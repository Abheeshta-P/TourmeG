import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { useDefaultNode } from "../context/DefaultNodeContext";
import { toast } from "sonner";
import { type Node } from "../data/nodedata";
import Configuration from "./Configuration";
import L from "leaflet";
import { computeNodeWorkload } from "../utils/tspCostUtils";
import { useNodes } from "../context/NodeContext";
import { storage } from "../utils/storageUtils";

type MapViewProps = {
  addMode?: boolean;
  routePath?: [number, number][]; // Add this
};

function MapClickHandler({ addMode }: MapViewProps) {
  const { defaultTasks, defaultTaskEffort } = useDefaultNode();
  const { nodes, setNodes } = useNodes();

  const modalRef = useRef<HTMLDivElement>(null);

  const MAX_NODES = 10;

  // State to track which node we are currently "configuring"
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  useEffect(() => {
    if (editingNode && modalRef.current) {
      // This tells Leaflet to ignore all mouse events inside this div
      L.DomEvent.disableClickPropagation(modalRef.current);
      L.DomEvent.disableScrollPropagation(modalRef.current);
    }
  }, [editingNode]);


  useMapEvents({
    async click(e) {
      if (!addMode) return;
      
      let { lat, lng } = e.latlng;

      // 1. DEFINE YOUR RANGE (Based on your maxBounds)
      const minLat = 12.5500;
      const maxLat = 13.0800;
      const minLon = 74.0000; // Your southwest lon
      const maxLon = 75.6120; // Your northeast lon

      // 2. VALIDATION CHECK
      if (lat < minLat || lat > maxLat || lng < minLon || lng > maxLon) {
        toast.error("Out of Bounds", {
          description: "You can only add nodes within the Mangaluru service area.",
        });
        return;
      }

      // 3. CHECK NODE LIMIT
      if (nodes.length >= MAX_NODES) {
        toast.error('Limit Reached!', {
          description: `Max ${MAX_NODES} nodes allowed.`,
        });
        return;
      }

      let fetchedName = `New Node ${nodes.length + 1}`;
      let type = "Custom";

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        fetchedName = data.display_name.split(',')[0] || fetchedName;
        type = data.type || type;
        lat = data.lat || lat;
        lng = data.lng || lng;
      } catch (error) {
        console.error("Geocoding failed", error);
      }

      const newNode = {
        id: nodes.length + 20,
        name: fetchedName,
        position: [lat, lng] as [number, number],
        type: type,
        tasks: [...defaultTasks],
        effort: { ...defaultTaskEffort },
      };

      setNodes((prev) => [...prev, newNode]);
      toast.success('Node Added!', {
        description: `${fetchedName} has been placed on the map.`,
      });
    },
  });

  // DELETE function
  const deleteNode = (id: number) => {
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;

    setNodes(nodes.filter(n => n.id !== id));

    storage.clearRoute();
    window.location.reload();

    toast('Node deleted', {
      description: `${nodeToDelete.name} removed.`,
      action: {
        label: 'Undo',
        onClick: () => setNodes(prev => [...prev, nodeToDelete])
      },
      icon: '🗑️'
    });
  };

  // Updated save function with validation
  const saveConfig = () => {
    // 1. Validation: Trim whitespace and check if empty
    const trimmedName = editingNode?.name?.trim();

    if (!editingNode || !trimmedName) {
      toast.error('Invalid Name', {
        description: 'The node name cannot be empty.',
      });
      return;
    }

    // 2. Save logic using the trimmed name
    setNodes(prev =>
      prev.map(n =>
        n.id === editingNode.id
          ? { ...editingNode, name: trimmedName }
          : n
      )
    );

    setEditingNode(null);
    toast.success('Configuration Saved');
  };

  return (
    <>
      {nodes.map((node) => (
        <Marker key={node.id} position={node.position}>
          <Popup key={`${node.id}-${node.tasks.join(',')}`}>
            <div style={{ minWidth: '150px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block', width: '100%' }}>{node.name}</p>
              <p style={{ margin: '2px 0' }}>Type: {node.type}</p>

              <hr style={{ margin: '8px 0' }} />

              {/* BUTTONS SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents map click
                    setEditingNode({
                      ...node,
                      tasks: node.tasks?.length ? [...node.tasks] : [...defaultTasks],
                      effort: Object.keys(node.effort || {}).length
                        ? { ...node.effort }
                        : { ...defaultTaskEffort },
                    });

                  }}
                  style={{ cursor: 'pointer', padding: '2px 5px' }}
                >
                  ⚙️ Config
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents map click
                    deleteNode(node.id);
                  }}
                  style={{ cursor: 'pointer', padding: '2px 5px', color: 'red' }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Basic Modal for Config */}
      {editingNode && (
        <div
          className="modal-overlay" ref={modalRef}>
          <div className="modal-content">
            <h2 className="modal-title">Configure Node</h2>

            {/* Node Name & Difficulty */}
            <div className="modal-section">
              <label>Node Name</label>
              <input
                type="text"
                value={editingNode.name}
                minLength={2}
                maxLength={40}
                onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
              />

              <label style={{ marginTop: '10px', display: 'block' }}>Difficulty (0-10)</label>
              <input
                type="number"
                value={computeNodeWorkload(editingNode)}
                readOnly
                disabled
              />
            </div>

            <hr className="modal-divider" />

            {/* Reuse your existing Configuration component */}
            <Configuration
              text={`${editingNode.name}`}
              tasks={editingNode.tasks}
              effort={editingNode.effort}
              onChange={(newTasks, newEffort) => {
                setEditingNode({ ...editingNode, tasks: newTasks, effort: newEffort });
              }}
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingNode(null)}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={saveConfig}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MapView({ addMode, routePath }: MapViewProps) {
  return (
    <MapContainer
      center={[12.87, 75.05]} // Slightly adjusted center for the new box
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      maxBounds={[
        [12.5500, 74], // South West: Moved UP from 12.51 to stay in Karnataka/Mangaluru
        [13.0800, 75.6120]  // North East: Moved DOWN from 13.17 to stay below Udupi
      ]}
      maxBoundsViscosity={1.0}
      minZoom={10}
      maxZoom={18}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {routePath && routePath.length > 0 && (
        <Polyline
          positions={routePath}
          pathOptions={{
            color: '#3b82f6',
            weight: 5,
            opacity: 0.8,
            lineJoin: 'round'
          }}
        />
      )}
      <MapClickHandler addMode={addMode} />
    </MapContainer>
  );
}
