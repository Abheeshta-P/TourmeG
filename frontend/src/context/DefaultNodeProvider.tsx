import { useState, type ReactNode } from "react";
import { DefaultNodeContext } from "./DefaultNodeContext";


export const DefaultNodeProvider = ({ children }: { children: ReactNode }) => {
  const [defaultTasks, setDefaultTasks] = useState<string[]>([]);
  const [defaultTaskEffort, setDefaultTaskEffort] = useState<{ [task: string]: number }>({});

  return (
    <DefaultNodeContext.Provider
      value={{
        defaultTasks,
        defaultTaskEffort,
        setDefaultTasks,
        setDefaultTaskEffort,
      }}
    >
      {children}
    </DefaultNodeContext.Provider>
  );
};


