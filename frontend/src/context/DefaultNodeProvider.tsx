import { useEffect, useState, type ReactNode } from "react";
import { DefaultNodeContext } from "./DefaultNodeContext";
import { storage } from "../utils/storageUtils";


export const DefaultNodeProvider = ({ children }: { children: ReactNode }) => {
  // Load initial state from storage
  const savedData = storage.loadDefaults();

  const [defaultTasks, setDefaultTasks] = useState<string[]>(savedData.tasks);
  const [defaultTaskEffort, setDefaultTaskEffort] = useState(savedData.effort);

  // Auto-save whenever tasks or effort change
  useEffect(() => {
    storage.saveDefaults(defaultTasks, defaultTaskEffort);
  }, [defaultTasks, defaultTaskEffort]);

  return (
    <DefaultNodeContext.Provider value={{ defaultTasks, defaultTaskEffort, setDefaultTasks, setDefaultTaskEffort }}>
      {children}
    </DefaultNodeContext.Provider>
  );
};


