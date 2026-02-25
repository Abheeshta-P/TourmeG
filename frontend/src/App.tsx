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
  const [startNodeId, setStartNodeId] = useState<number | null>(()=>storage.loadRoute().startNodeId || null);
  const [endNodeId, setEndNodeId] = useState<number | null>(() => storage.loadRoute().endNodeId || null);
  const { nodes } = useNodes();
  const { defaultTaskEffort, defaultTasks } = useDefaultNode();
  const [routePath, setRoutePath] = useState<[number, number][]>(() => storage.loadRoute().path);
  const [visitOrder, setVisitOrder] = useState<number[]>(()=>storage.loadRoute().visitOrder);

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
        totalWorkload: computeNodeWorkload(effective) 
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

      // console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      if (!res.ok) throw new Error("Server responded with an error");

      // Inside handleCalculate in App.tsx
      const data: BackendNode[] = await res.json();

      // 1. Helper to calculate distance between two points (Squared is faster)
      const getDistSq = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        return Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2);
      };

      // 2. Map your FRONTEND nodes to the BACKEND path index
      const orderedNodes = nodes.map(node => {
        const nodeLat = parseFloat(String(node.position[0]));
        const nodeLon = parseFloat(String(node.position[1]));

        let closestIndex = -1;
        let minDistance = Infinity;

        // Search through the backend path to find when we get closest to THIS marker
        data.forEach((pathPoint, index) => {
          const dist = getDistSq(nodeLat, nodeLon, pathPoint.lat, pathPoint.lon);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = index;
          }
        });

        return {
          id: node.id, // We keep the frontend ID for the visitOrder state
          pathIndex: closestIndex
        };
      });

      // 3. Sort by pathIndex to get the chronological visit order
      const finalOrder = orderedNodes
        .sort((a, b) => a.pathIndex - b.pathIndex)
        .map(item => item.id); // This is now a list of FRONTEND IDs in visit order

      setVisitOrder(finalOrder);

      // 4. Map the data for Leaflet [lat, lon]
      const polylinePath: [number, number][] = data.map(node => [node.lat, node.lon]);

      setRoutePath(polylinePath);
      storage.saveRoute({
        path: polylinePath,
        visitOrder:finalOrder,
        startNodeId,
        endNodeId
      });
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
      <Toaster richColors position="top-center" />
      {/* Sidebar */}
      <div className={`sidebar ${sidebar ? "" : "close"}`}>
        <div className="sidebar-header">
          <div>
            <h1 className="name">TourmeG</h1>
            <p className="helper-text">
              This is the panel for default settings, applied when creating a new place
            </p>
          </div>
          <button className="close-btn" onClick={() => setSideBar(false)}>
            ✕
          </button>
        </div>
        <Configuration />

        <hr />

        <h2>Actions</h2>
        <button onClick={() => setAddMode(!addMode)}>
          {addMode ? "Exit Add Mode" : "Add Place Mode"}
        </button>

        <button onClick={() => setShowRouteConfig(!showRouteConfig)}>
          {showRouteConfig ? "Close Route Config" : "Configure Route"}
        </button>

        {showRouteConfig && (
          <>
            <div className="route-config">

              <div>
                <h3>Start place *</h3>
                <select
                  value={startNodeId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || val === "NaN") {
                      setStartNodeId(null);
                    } else {
                      setStartNodeId(Number(val));
                    }
                  }}
                >
                  <option value="">Select existing place</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3>End place (Optional)</h3>
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

              <div className="route-buttons">
                <button
                  onClick={handleCalculate}
                  className="calculate-route"
                >
                  Calculate Route
                </button>

                {routePath.length > 0 && (
                  <button
                    onClick={() => {
                      // 1. Clear State 
                      setRoutePath([]);
                      setVisitOrder([]);
                      setStartNodeId(null);
                      setEndNodeId(null);

                      // 2. Clear Persistence
                      storage.clearRoute();

                      // 3. Notify the user
                      toast.info("Route cleared");
                    }}
                    className="clear-route"
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
        <MapView addMode={addMode} routePath={routePath}  visitOrder={visitOrder} setEndNodeId={setEndNodeId} setRoutePath={setRoutePath} setStartNodeId={setStartNodeId} setVisitOrder={setVisitOrder}/>
      </div>
    </div>
  );
}

export default App;