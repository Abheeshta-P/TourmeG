import { useState } from "react";
import MapView from "./components/MapView";
import Configuration from "./components/Configuration";
import { toast, Toaster } from "sonner";
import { useNodes } from "./context/NodeContext";
import { computeNodeWorkload, getEffectiveNodeData } from "./utils/tspCostUtils";
import { storage } from "./utils/storageUtils";
import { API_ENDPOINTS } from "./config/config";
import { useDefaultNode } from "./context/DefaultNodeContext";

interface BackendNode {
  id: number;
  lat: number;
  lon: number;
}

function App() {
  const [sidebar, setSideBar] = useState<boolean>(true);
  const [addMode, setAddMode] = useState<boolean>(false);
  const [showRouteConfig, setShowRouteConfig] = useState<boolean>(false);
  const [startNodeId, setstartNodeId] = useState<number | null>(null);
  const [endNodeId, setEndNodeId] = useState<number | null>(null);
  const { nodes } = useNodes();
  const { defaultTaskEffort, defaultTasks } = useDefaultNode();
  const [routePath, setRoutePath] = useState<[number, number][]>(() => storage.loadRoute());
  
  const handleCalculate = async () => {
    if (!startNodeId) {
      toast.error("Start node is required");
      return;
    }

    // 1. Prepare the stops array with all the data the backend needs
    const stops = nodes.map(n => {
      const effective = getEffectiveNodeData(n, defaultTasks, defaultTaskEffort);
      return {
        id: effective.id,
        lat: effective.position[0],
        lon: effective.position[1],
        totalWorkload: computeNodeWorkload(effective) // Now sends the correct workload!
      };
    });

    // 2. Find the POSITION (0, 1, 2...) of the node in the array
    const startIdx = nodes.findIndex(n => n.id === startNodeId);

    // 3. Match the endNodeId to its POSITION in the array
    const endIdx = endNodeId ? nodes.findIndex(n => n.id === endNodeId) : null;

    const payload = {
      stops: stops,
      startIdx: startIdx,
      endIdx: endIdx,
    };

    try {
      toast.info("Calculating optimal route...");

      const res = await fetch(API_ENDPOINTS.CALCULATE_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Add this right before your fetch() call in App.tsx
      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      if (!res.ok) throw new Error("Server responded with an error");

      const data:BackendNode[] = await res.json(); // This is your List<Node> from Java

      // 4. Map the data for Leaflet [lat, lon]
      const polylinePath: [number, number][] = data.map(node => [node.lat, node.lon]);

      setRoutePath(polylinePath);
      storage.saveRoute(polylinePath); 
      toast.success("Route optimized!");

    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        toast.error("Failed to calculate route: " + err.message);
      } else {
        console.log("Unknown error", err);
      }
    }
  };


  return (
    <div className="main">
      <Toaster richColors position="top-center" />      {/* Sidebar */}
      <div className={`sidebar ${sidebar ? "" : "close"}`}>
        <div className="sidebar-header">
          <div>
            <h2>Default Settings ⚙️</h2>
            <p className="helper-text">
              Applied when creating a new node
            </p>
         </div>
          <button className="close-btn" onClick={() => setSideBar(false)}>
            ✕
          </button>
        </div>

        <Configuration/>

        <hr />

        <h2>Actions</h2>
        <button onClick={() => setAddMode(!addMode)}>
          {addMode ? "Exit Add Mode" : "Add Node Mode"}
        </button>

        <button onClick={() => setShowRouteConfig(!showRouteConfig)}>
          {showRouteConfig ? "Close Route Config" : "Configure Route"}
        </button>

        {showRouteConfig && (
          <>
            <div className="route-config">

              <div>
                <h3>Start Node *</h3>
                <div>
                  <select
                    value={startNodeId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === "NaN") {
                        setstartNodeId(null);
                      } else {
                        setstartNodeId(Number(val));
                      }
                    }}
                  >
                    <option value="">Select existing node</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
             </div>

              <div>
                <h3>End Node (Optional)</h3>
                <select
                  value={endNodeId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || val === "NaN") {
                      setEndNodeId(null);
                    } else {
                      setEndNodeId(Number(val));
                    }
                  }}
                >
                  <option value="">None</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection:"row", gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={handleCalculate}
                  className="calculate-route"
                  style={{ flex: 1 }}
                >
                  Calculate Route
                </button>

                {routePath.length > 0 && (
                  <button
                    onClick={() => {
                      setRoutePath([]);
                      storage.clearRoute();
                      toast.info("Route cleared");
                    }}
                    className="clear-route"
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '0 12px'
                    }}
                    title="Remove the route"
                  >
                    🗑️
                  </button>
                )}
              </div>

            </div>
          </>
        )}
      </div>

      {/* Open sidebar button */}
      {!sidebar && (
        <button className="open-btn" onClick={() => setSideBar(true)}>
          ☰
        </button>
      )}

      {/* Map container */}
      <div className="map-container">
        <MapView addMode={addMode} routePath={routePath} />
      </div>
    </div>
  );
}

export default App;
