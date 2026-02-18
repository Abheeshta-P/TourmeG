import { useState } from "react";
import MapView from "./components/MapView";
import Configuration from "./components/Configuration";
import { Toaster } from "sonner";

function App() {
  const [sidebar, setSideBar] = useState<boolean>(true);
  const [addMode, setAddMode] = useState<boolean>(false);

  return (
    <div className="main">
      <Toaster richColors position="top-center" />      {/* Sidebar */}
      <div className={`sidebar ${sidebar ? "" : "close"}`}>
        <div className="sidebar-header">
          <h2>Default Settings</h2>
          <button className="close-btn" onClick={() => setSideBar(false)}>
            ✕
          </button>
        </div>

        <p className="helper-text">
          Applied when creating a new node
        </p>

        <Configuration/>

        <hr />

        <h2>Actions</h2>
        <button onClick={() => setAddMode(!addMode)}>
          {addMode ? "Exit Add Mode" : "Add Node Mode"}
        </button>
        <button>Calculate Route</button>
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
