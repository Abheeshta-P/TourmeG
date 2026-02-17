import { useDefaultNode } from '../context/DefaultNodeContext';

const allTasks = ["Eat", "Drink", "Sightseeing", "Read", "Shopping", "Other"];

function Configuration() {
  const getCrowdLabel = (value: number) => {
    if (value <= 2) return "Very Low";
    if (value <= 4) return "Low";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "High";
    return "Very High";
  };

  const {
    defaultCrowd,
    defaultTasks,
    defaultTaskEffort,
    defaultTime,
    setDefaultCrowd,
    setDefaultTasks,
    setDefaultTaskEffort,
    setDefaultTime,
  } = useDefaultNode();

  const toggleTask = (task: string) => {
    if (defaultTasks.includes(task)) {
      setDefaultTasks(defaultTasks.filter((t) => t !== task));
      const newEffort = { ...defaultTaskEffort };
      delete newEffort[task];
      setDefaultTaskEffort(newEffort);
    } else {
      setDefaultTasks([...defaultTasks, task]);
      setDefaultTaskEffort({ ...defaultTaskEffort, [task]: 1 });
    }
  };

  const updateEffort = (task: string, value: number) => {
    if (value < 0) value = 0;
    else if (value > 10) value = 10;
    setDefaultTaskEffort({ ...defaultTaskEffort, [task]: value });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 12 }}>

      {/* Crowd */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontWeight: 500 }}>
          Crowd Preference: <strong>{defaultCrowd} ({getCrowdLabel(defaultCrowd)})</strong>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          value={defaultCrowd}
          onChange={(e) => setDefaultCrowd(Number(e.currentTarget.value))}
        />
      </div>

      {/* Time */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontWeight: 500 }}>Time at Node (minutes):</label>
        <input
          type="number"
          min={0}
          value={defaultTime}
          onChange={(e) => setDefaultTime(Number(e.currentTarget.value))}
          style={{ width: 100 }}
        />
      </div>

      {/* Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3>Tasks & Effort</h3>
        {allTasks.map((task) => (
          <div
            key={task}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="checkbox"
              checked={defaultTasks.includes(task)}
              onChange={() => toggleTask(task)}
            />
            <span style={{ flex: 1 }}>{task}</span>
            {defaultTasks.includes(task) && (
              <input
                type="number"
                min={1}
                max={10}
                value={defaultTaskEffort[task] || 1}
                onChange={(e) => updateEffort(task, Number(e.currentTarget.value))}
                style={{ width: 50 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Configuration;
