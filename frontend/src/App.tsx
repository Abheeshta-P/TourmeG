import { useState } from "react";
import MapView from "./components/MapView";
import Configuration from "./components/Configuration";
import { toast, Toaster } from "sonner";
import { useNodes } from "./context/NodeContext";

function App() {
  const [sidebar, setSideBar] = useState<boolean>(true);
  const [addMode, setAddMode] = useState<boolean>(false);
  const [showRouteConfig, setShowRouteConfig] = useState<boolean>(false);
  const [startNode, setStartNode] = useState<{ lat: number; lng: number } | null>(null);
  const [endNodeId, setEndNodeId] = useState<number | null>(null);
  const { nodes } = useNodes();

  const handleCalculate = async () => {
    if (!startNode) {
      toast.error("Start node is required");
      return;
    }

    const payload = {
      startNode,
      endNodeId,
      selectedNodes: nodes.map(n => n.id),
    };

    try {
      const res = await fetch("/api/route/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log(data);
    } catch (err) {
      toast.error("Failed to calculate route" + err);
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
                    onChange={(e) => {
                      const nodeId = Number(e.target.value);
                      const node = nodes.find(n => n.id === nodeId);
                      if (node) {
                        setStartNode({ lat: node.position[0], lng: node.position[1] });
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
                  onChange={(e) => setEndNodeId(Number(e.target.value))}
                >
                  <option value="">None</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={handleCalculate} className="calculate-route">
                Calculate Route
              </button>

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
        <MapView addMode={addMode} />
      </div>
    </div>
  );
}

export default App;
