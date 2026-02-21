import { useDefaultNode } from "../context/DefaultNodeContext";
import { taskOptions } from "../data/tasksdata";

export default function Configuration({
  text = "All places.",
  tasks,
  effort,
  onChange
}: {
  text?: string;
  tasks?: string[];
  effort?: Record<string, number>;
  onChange?: (tasks: string[], effort: Record<string, number>) => void;
}) {
  const context = useDefaultNode();

  // If props exist (Modal mode), use them. If not (Sidebar mode), use context.
  const currentTasks = tasks ?? context.defaultTasks;
  const currentEffort = effort ?? context.defaultTaskEffort;

  const toggleTask = (task: string) => {
    let newTasks: string[];
    const newEffort = { ...currentEffort };

    if (currentTasks.includes(task)) {
      newTasks = currentTasks.filter((t) => t !== task);
      delete newEffort[task];
    } else {
      newTasks = [...currentTasks, task];
      newEffort[task] = 1;
    }

    if (onChange) {
      onChange(newTasks, newEffort);
    } else {
      context.setDefaultTasks(newTasks);
      context.setDefaultTaskEffort(newEffort);
    }
  };

  const updateEffort = (task: string, value: number) => {
    const val = Math.max(0, Math.min(10, value));
    const newEffort = { ...currentEffort, [task]: val };

    if (onChange) {
      onChange(currentTasks, newEffort);
    } else {
      context.setDefaultTaskEffort(newEffort);
    }
  };

  return (
    <div className="config-container">
      <h3 className="config-title">
        Tasks & Effort : <i>For {text}</i>
      </h3>
      {taskOptions.map((task) => {
        // Use currentTasks directly here to ensure the UI is always in sync
        const isChecked = currentTasks.includes(task);

        return (
          <div key={task} className="task-row">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleTask(task)}
            />
            <span className="task-name">{task}</span>
            {isChecked && (
              <input
                type="number"
                min={1}
                max={10}
                value={currentEffort[task] || 1}
                onChange={(e) => updateEffort(task, Number(e.currentTarget.value))}
                className="task-effort"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}