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

  useMapEvents({
    click(e) {
      if (!addMode) return;

      const newNode = {
        id: nodes.length + 1,
        name: `New Node ${nodes.length + 1}`,
        position: [e.latlng.lat, e.latlng.lng] as [number, number],
        type: "Custom",
        tasks: [...defaultTasks],
        crowd: defaultCrowd,
        time: defaultTime,
        effort: {},
        nodeDifficulty:0
      };
      setNodes([...nodes, newNode]);
    },
  });

  return (
    <>
      {nodes.map((node) => (
        <Marker
          key={node.id}
          position={node.position as [number, number]}
        >
          <Popup>
            <div>
              <h4>{node.name}</h4>
              <p>Crowd: {node.crowd}</p>
              <p>Time: {node.time} min</p>
              <p>Tasks: {node.tasks.join(", ")}</p>
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
