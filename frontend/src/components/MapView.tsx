import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useState } from "react";
import { useDefaultNode } from "../context/DefaultNodeContext";
import {toast} from "sonner";
import { mangaloreNodes, type Node } from "../data/nodedata";

type MapViewProps = {
  addMode?: boolean;
};

function MapClickHandler({ addMode }: MapViewProps) {
  const { defaultTasks } = useDefaultNode();
  const [nodes, setNodes] = useState([...mangaloreNodes]);

  const MAX_NODES = 15;

  // State to track which node we are currently "configuring"
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  useMapEvents({
    async click(e) {
      if (!addMode) return;

      // 1. CHECK BEFORE ADDING
      if (nodes.length >= MAX_NODES) {
        toast.error('Limit Reached!', {
          description: `You can only add up to ${MAX_NODES} nodes. Delete some nodes if you want to add more.`,
          duration: 5000,
        });
        return;
      }

      const { lat, lng } = e.latlng;
      let fetchedName = `New Node ${nodes.length + 1}`;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        fetchedName = data.display_name.split(',')[0] || fetchedName;
      } catch (error) {
        console.error("Geocoding failed", error);
      }

      const newNode = {
        id: Date.now(),
        name: fetchedName,
        position: [lat, lng] as [number, number],
        type: "Custom",
        tasks: [...defaultTasks],
        effort: {},
        nodeDifficulty: 0
      };

      setNodes((prev) => [...prev, newNode]);
      toast.success('Node Added!', {
        description: `${fetchedName} has been placed on the map.`,
      });
    },
  });

  const updateNodeName = (id: number, newName: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, name: newName } : n));
  };

  // DELETE function
  const deleteNode = (id: number) => {
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;

    setNodes(nodes.filter(n => n.id !== id));

    toast('Node deleted', {
      description: `${nodeToDelete.name} removed.`,
      action: {
        label: 'Undo',
        onClick: () => setNodes(prev => [...prev, nodeToDelete])
      },
      icon:'🗑️'
    });
  };

  return (
    <>
      {nodes.map((node) => (
        <Marker key={node.id} position={node.position}>
          <Popup key={`${node.id}-${node.tasks.join(',')}`}>
            <div style={{ minWidth: '150px' }}>
              <input
                value={node.name}
                onChange={(e) => updateNodeName(node.id, e.target.value)}
                style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block', width: '100%' }}
              />
              <p style={{ margin: '2px 0' }}>Type: {node.type}</p>
              <p style={{ margin: '2px 0' }}>Difficulty: {node.nodeDifficulty}</p>

              <hr style={{ margin: '8px 0' }} />

              {/* BUTTONS SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents map click
                    setEditingNode(node);
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
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'white', padding: '20px', zIndex: 1000, borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <h3>Config: {editingNode.name}</h3>
          <label>Difficulty:
            <input
              type="number"
              value={editingNode.nodeDifficulty}
              onChange={(e) => setEditingNode({ ...editingNode, nodeDifficulty: Number(e.target.value) })}
            />
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => {
              setNodes(nodes.map(n => n.id === editingNode.id ? editingNode : n));
              setEditingNode(null);
              toast.success('Configuration Saved', {
                description: `Settings for ${editingNode.name} updated.`
              });
            }}>
              Save
            </button>
            <button onClick={() => setEditingNode(null)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function MapView({ addMode }: MapViewProps) {
  return (
    <MapContainer
      center={[12.88, 74.85]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler addMode={addMode} />
    </MapContainer>
  );
}
