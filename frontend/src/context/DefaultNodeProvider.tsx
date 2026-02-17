import { useState, type ReactNode } from "react";
import { DefaultNodeContext } from "./DefaultNodeContext";


export const DefaultNodeProvider = ({ children }: { children: ReactNode }) => {
  const [defaultCrowd, setDefaultCrowd] = useState<number>(5);
  const [defaultTime, setDefaultTime] = useState<number>(30);
  const [defaultTasks, setDefaultTasks] = useState<string[]>([]);
  const [defaultTaskEffort, setDefaultTaskEffort] = useState<{ [task: string]: number }>({});

  return (
    <DefaultNodeContext.Provider
      value={{
        defaultCrowd,
        defaultTime,
        defaultTasks,
        defaultTaskEffort,
        setDefaultCrowd,
        setDefaultTime,
        setDefaultTasks,
        setDefaultTaskEffort,
      }}
    >
      {children}
    </DefaultNodeContext.Provider>
  );
};


