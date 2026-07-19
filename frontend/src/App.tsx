import { useState, useEffect } from "react";
import MapView from "./components/MapView";
import Configuration from "./components/Configuration";
import { toast, Toaster } from "sonner";
import { useNodes } from "./context/NodeContext";
import { computeNodeWorkload, getEffectiveNodeData } from "./utils/tspCostUtils";
import { storage } from "./utils/storageUtils";
import { getDistanceInMeters } from "./utils/geoUtils";
import { API_ENDPOINTS } from "./config/config";
import { useDefaultNode } from "./context/DefaultNodeContext";
import { X, Trash2, Menu, Loader2, CheckCircle2, Navigation, MapPin, ChevronUp, ChevronDown } from "lucide-react";

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
  const { nodes, setNodes } = useNodes();
  const { defaultTaskEffort, defaultTasks } = useDefaultNode();
  const [routePath, setRoutePath] = useState<[number, number][]>(() => storage.loadRoute().path);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [visitOrder, setVisitOrder] = useState<number[]>(() => storage.loadRoute().visitOrder);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
  
  const handleClearAllRouteData = () => {
    const emptyState = storage.clearRoute();

    // Sync all React states in one batch
    setRoutePath(emptyState.path);
    setVisitOrder(emptyState.visitOrder);
    setStartNodeId(emptyState.startNodeId);
    setEndNodeId(emptyState.endNodeId);
    setCurrentStepIndex(0);
    setIsDrawerExpanded(true);
  };

  const handleCalculate = async () => {
    if (startNodeId === -1 && !userPosition) {
      toast.error("Waiting for GPS location...");
      return;
    }
    if (startNodeId === null) {
      toast.error("Start node is required");
      return;
    }

    // 1. Prepare the stops array with all the data the backend needs
    let stops = nodes.map(n => {
      const effective = getEffectiveNodeData(n, defaultTasks, defaultTaskEffort);
      return {
        id: effective.id,
        lat: effective.position[0],
        lon: effective.position[1],
        totalWorkload: computeNodeWorkload(effective) 
      };
    });

    // 2. Find the POSITION (0, 1, 2...) of the node in the array
    let actualStartIdx = nodes.findIndex(n => n.id === startNodeId);
    let actualEndIdx = endNodeId ? nodes.findIndex(n => n.id === endNodeId) : null;

    if (startNodeId === -1 && userPosition) {
      const userNode = {
        id: -1,
        lat: userPosition[0],
        lon: userPosition[1],
        totalWorkload: 0 
      };
      stops = [userNode, ...stops];
      actualStartIdx = 0;
      if (actualEndIdx !== null) {
        actualEndIdx += 1;
      }
    }

    const payload = {
      stops: stops,
      startIdx: actualStartIdx,
      endIdx: actualEndIdx,
    };

    setIsCalculating(true);

    try {
      toast.info("Calculating optimal route...");

      const res = await fetch(API_ENDPOINTS.CALCULATE_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      if (!res.ok) throw new Error("Server responded with an error");

      const data: BackendNode[] = await res.json();

      // 1. Helper to calculate distance between two points (Squared is faster)
      const getDistSq = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        return Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2);
      };

      // 2. Map your FRONTEND nodes to the BACKEND path index
      const orderedNodes = stops.map(stop => {
        const nodeLat = parseFloat(String(stop.lat));
        const nodeLon = parseFloat(String(stop.lon));

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
          id: stop.id, // We keep the frontend ID for the visitOrder state
          pathIndex: closestIndex
        };
      });

      // 3. Sort by pathIndex to get the chronological visit order
      const finalOrder = orderedNodes
        .sort((a, b) => a.pathIndex - b.pathIndex)
        .map(item => item.id); // This is now a list of FRONTEND IDs in visit order

      setVisitOrder(finalOrder);
      setCurrentStepIndex(0);
      setIsDrawerExpanded(true);

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
    } finally {
      setIsCalculating(false);
    }
  };


  useEffect(() => {
    if (!userPosition || visitOrder.length === 0 || currentStepIndex >= visitOrder.length) return;

    const targetNodeId = visitOrder[currentStepIndex];
    const targetNode = nodes.find(n => n.id === targetNodeId);
    
    if (targetNode) {
      const distance = getDistanceInMeters(
        userPosition[0], userPosition[1],
        targetNode.position[0], targetNode.position[1]
      );
      
      // If within 50 meters, automatically mark as arrived and progress
      if (distance < 50) {
        toast.success(`Arrived at ${targetNode.name}!`);
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  }, [userPosition, visitOrder, currentStepIndex, nodes]);

  return (
    <div className="main">
      <Toaster richColors position="top-center" />
      {/* Sidebar */}
      <div className={`sidebar ${sidebar ? "" : "close"}`}>
        <div className="sidebar-header">
          <div className="brand-title">
            <img src="/tourmeg_logo.png" alt="TourmeG Logo" className="brand-logo" />
            <div>
              <h1 className="name">TourmeG</h1>
              <p className="helper-text">Smart Router • Mangaluru Region</p>
            </div>
          </div>
          <button className="close-btn" onClick={() => setSideBar(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="sidebar-card">
          <Configuration />
          <p className="helper-text" style={{ marginTop: "8px" }}>
            This is the panel for default settings, applied when creating a new place.
          </p>
        </div>

        <div className="actions-section">
          <div className="action-buttons">
            <button 
              className={`primary-btn ${addMode ? "active-mode-btn" : ""}`} 
              onClick={() => setAddMode(!addMode)}
              disabled={nodes.length >= 10 && !addMode}
            >
              {nodes.length >= 10 && !addMode 
                ? `Max Places (10/10)` 
                : addMode 
                  ? `Done (${nodes.length}/10)` 
                  : `Add Place (${nodes.length}/10)`
              }
            </button>

            <button className="secondary-btn" onClick={() => setShowRouteConfig(!showRouteConfig)}>
              {showRouteConfig ? "Close Config" : "Configure Route"}
            </button>

            {nodes.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete all places? This cannot be undone.")) {
                    setNodes([]);
                    handleClearAllRouteData();
                    toast.success("All places removed");
                  }
                }}
                className="danger-btn danger-icon-btn"
                title="Delete All Places"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {showRouteConfig && (
          <div className="sidebar-card">
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
                  {userPosition && <option value="-1">Current Location (GPS)</option>}
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
                  disabled={isCalculating || (nodes.length + (userPosition ? 1 : 0)) < 2}
                  title={(nodes.length + (userPosition ? 1 : 0)) < 2 ? "Add at least 2 places to route." : undefined}
                >
                  {isCalculating ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Calculating...
                    </>
                  ) : (
                    "Calculate Route"
                  )}
                </button>

                {routePath.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear the calculated route?")) {
                        handleClearAllRouteData();
                        toast.info("Route cleared");
                      }
                    }}
                    className="clear-route"
                    title="Remove the route"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Open sidebar button */}
      {!sidebar && (
        <button className="open-btn" onClick={() => setSideBar(true)}>
          <Menu size={24} />
        </button>
      )}

      {/* Map container */}
      <div className={`map-container ${addMode ? "map-add-mode" : ""}`}>
        <MapView addMode={addMode} routePath={routePath} visitOrder={visitOrder} handleClearAllRouteData={handleClearAllRouteData} userPosition={userPosition} setUserPosition={setUserPosition}/>
      </div>

      {/* Navigation Drawer */}
      {visitOrder.length > 0 && currentStepIndex < visitOrder.length && (
        <div className={`navigation-drawer ${isDrawerExpanded ? 'expanded' : 'collapsed'}`}>
          <div 
            className="drawer-header" 
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
          >
            <div className="drawer-title-container">
              <h3>Navigation</h3>
              <span className="step-counter">{currentStepIndex + 1} / {visitOrder.length} Places</span>
            </div>
            <button className="drawer-toggle-btn">
              {isDrawerExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
          
          {isDrawerExpanded && (
            <div className="drawer-content">
              {visitOrder.slice(currentStepIndex, currentStepIndex + 2).map((nodeId, idx) => {
                const node = nodes.find(n => n.id === nodeId);
                if (!node) return null;
                
                const isCurrent = idx === 0;
                
                return (
                  <div key={nodeId} className={`nav-step ${isCurrent ? 'current' : 'upcoming'}`}>
                    <div className="step-icon">
                      {isCurrent ? <Navigation size={18} /> : <MapPin size={16} />}
                    </div>
                    <div className="step-details">
                      <h4>{node.name}</h4>
                      <p>{isCurrent ? 'Next Destination' : 'Upcoming Stop'}</p>
                    </div>
                    {isCurrent && (
                      <button 
                        className="mark-done-btn" 
                        onClick={(e) => {
                          e.stopPropagation(); // prevent collapsing drawer
                          setCurrentStepIndex(prev => prev + 1);
                        }}
                        title="Mark as visited manually"
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;