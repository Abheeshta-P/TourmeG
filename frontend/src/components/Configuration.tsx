import { useDefaultNode } from '../context/DefaultNodeContext';

const allTasks = ["Eat", "Drink", "Sightseeing", "Read", "Shopping", "Other"];

function Configuration({text="At all places."}:{text?:string}) {

  const {
    defaultTasks,
    defaultTaskEffort,
    setDefaultTasks,
    setDefaultTaskEffort,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3>Tasks & Effort : <i>{text}</i></h3>
      {
        allTasks.map((task) => (
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
        ))
      }
    </div >
  );
}

export default Configuration;
