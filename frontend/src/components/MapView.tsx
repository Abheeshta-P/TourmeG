import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { useDefaultNode } from "../context/DefaultNodeContext";
import { toast } from "sonner";
import { type Node } from "../data/nodedata";
import Configuration from "./Configuration";
import L from "leaflet";
import { computeNodeWorkload } from "../utils/tspCostUtils";
import { useNodes } from "../context/NodeContext";
import { getNextAvailableId } from "../utils";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { LocateFixed } from "lucide-react";

// Fix for React-Leaflet icons not showing up in Vite production builds
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type MapClickHandlerProps = {
  addMode?: boolean;
  visitOrder?: number[]; 
  handleClearAllRouteData: () => void;
};

type MapViewProps = MapClickHandlerProps & {
  routePath?: [number, number][];
  userPosition: [number, number] | null;
  setUserPosition: (pos: [number, number] | null) => void;
};

const SERVICE_BOUNDS = {
  minLat: 12.5500,
  maxLat: 13.0800,
  minLon: 74.0000,
  maxLon: 75.6120,
};

const createNumberedIcon = (number: number, isStart: boolean, isEnd: boolean) => {
  let bgColor = "#3b82f6"; // Blue
  if (isStart) bgColor = "#22c55e"; // Green
  if (isEnd) bgColor = "#ef4444"; // Red

  return L.divIcon({
    html: `<div style="
      background-color: ${bgColor};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const userIcon = L.divIcon({
  html: `
    <div style="
      background:#2563eb;
      width:20px;
      height:20px;
      border-radius:50%;
      border:4px solid white;
      box-shadow:0 0 10px blue;
    ">
    </div>
  `,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapClickHandler({ addMode, visitOrder, handleClearAllRouteData }: MapClickHandlerProps) {
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
      const { minLat, maxLat, minLon, maxLon } = SERVICE_BOUNDS;

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
        id: getNextAvailableId(nodes),
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

    
    handleClearAllRouteData();
    setNodes((prev) => prev.filter((p) => p.id !== nodeToDelete.id));

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
      {nodes.map((node) => {
        const orderIdx = visitOrder ? visitOrder.indexOf(node.id) : -1;
        const isNumbered = orderIdx !== -1;

        // Logic for the color icons
        let customIcon;
        if (isNumbered) {
          customIcon = createNumberedIcon(
            orderIdx + 1,
            orderIdx === 0, // Green for first
            orderIdx === visitOrder!.length - 1 // Red for last
          );
        }

        return (
          <Marker
            key={node.id}
            position={node.position}
            icon={isNumbered ? customIcon : new L.Icon.Default()}
          >
            <Popup key={`${node.id}-${node.tasks.join(',')}`}>
            <div style={{ minWidth: '150px' }}>
                <p style={{ marginBottom: '5px', display: 'block', width: '100%' }}> <strong>{isNumbered ? `Step ${orderIdx + 1}: ` : ""}{node.name}</strong></p>
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
        );
      })}

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

export default function MapView({ addMode, routePath, visitOrder, handleClearAllRouteData, userPosition, setUserPosition }: MapViewProps) {
  const outOfBoundsToastRef = useRef<boolean>(false);

  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    if (isTracking) {
      toast.info("Already tracking location");
      return;
    }

    setIsTracking(true);
    toast.info("Requesting location access...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserPosition([lat, lon]);

        const { minLat, maxLat, minLon, maxLon } = SERVICE_BOUNDS;
        const isCurrentlyOutOfBounds = lat < minLat || lat > maxLat || lon < minLon || lon > maxLon;

        if (isCurrentlyOutOfBounds && !outOfBoundsToastRef.current) {
          toast.warning("Outside Service Area", {
            description: "You have exited the Mangaluru service area.",
            duration: 6000,
          });
          outOfBoundsToastRef.current = true;
        } else if (!isCurrentlyOutOfBounds && outOfBoundsToastRef.current) {
          toast.success("Inside Service Area", {
            description: "You have re-entered the Mangaluru service area.",
            duration: 4000,
          });
          outOfBoundsToastRef.current = false;
        }
      },
      (error) => {
        console.error(error);
        if (error.code !== 3) { // Ignore timeout errors, it will retry automatically
          toast.error("Unable to get location");
          setIsTracking(false);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {!isTracking && (
        <button
          onClick={startTracking}
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
            backgroundColor: "#2563eb",
            color: "white",
            padding: "10px 16px",
            borderRadius: "50px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <LocateFixed size={18} /> Locate Me
        </button>
      )}
      
      <MapContainer
        center={[12.87, 75.05]} // Slightly adjusted center for the new box
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        maxBounds={[
          [12.55, 74], // South West: Moved UP from 12.51 to stay in Karnataka/Mangaluru
          [13.08, 75.612], // North East: Moved DOWN from 13.17 to stay below Udupi
        ]}
        maxBoundsViscosity={1.0}
        minZoom={10}
        maxZoom={18}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {routePath && routePath.length > 0 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: "#3b82f6",
              weight: 5,
              opacity: 0.8,
              dashArray: "10, 10",
              lineJoin: "round",
            }}
          />
        )}
        <MapClickHandler
          addMode={addMode}
          visitOrder={visitOrder}
          handleClearAllRouteData={handleClearAllRouteData}
        />
      </MapContainer>
    </div>
  );
}
