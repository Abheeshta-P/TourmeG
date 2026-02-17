import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useState } from "react";
import { useDefaultNode } from "../context/DefaultNodeContext";
import { mangaloreNodes } from "../data/nodedata";

type MapViewProps = {
  addMode?: boolean;
};

function MapClickHandler({ addMode }: MapViewProps) {
  const { defaultCrowd, defaultTime, defaultTasks } = useDefaultNode();
  const [nodes, setNodes] = useState([...mangaloreNodes]);

  console.log(defaultTasks);

  useMapEvents({
    async click(e) {
      if (!addMode) return;

      const { lat, lng } = e.latlng;
      let fetchedName = `New Node ${nodes.length + 1}`;

      try {
        // Optional: Fetch location name automatically
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        fetchedName = data.display_name.split(',')[0] || fetchedName;
      } catch (error) {
        console.error("Geocoding failed", error);
      }

      const newNode = {
        id: Date.now(), // Use timestamp for unique IDs
        name: fetchedName,
        position: [lat, lng] as [number, number],
        type: "Custom",
        tasks: [...defaultTasks],
        crowd: defaultCrowd,
        time: defaultTime,
        effort: {},
        nodeDifficulty: 0
      };

      setNodes((prev) => [...prev, newNode]);
    },
  });

  // Function to let user update name manually in the popup
  const updateNodeName = (id: number, newName: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, name: newName } : n));
  };

  return (
    <>
      {nodes.map((node) => (
        <Marker key={node.id} position={node.position}>
          <Popup key={`${node.id}-${node.tasks.join(',')}`}>
            <div>
              <input
                value={node.name}
                onChange={(e) => updateNodeName(node.id, e.target.value)}
                style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}
              />
              <p>Type: {node.type}</p>
              <p>NodeDifficulty: {node.nodeDifficulty}</p>
            </div>
          </Popup>
        </Marker>
      ))}
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
