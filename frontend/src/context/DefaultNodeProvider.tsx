import { useState, type ReactNode } from "react";
import { DefaultNodeContext } from "./DefaultNodeContext";


export const DefaultNodeProvider = ({ children }: { children: ReactNode }) => {
  const [defaultTasks, setDefaultTasks] = useState<string[]>([]);
  const [defaultTaskEffort, setDefaultTaskEffort] = useState<{ [task: string]: number }>({});
  const [defaultNodeDifficulty, setDefaultNodeDifficulty] = useState<number>(0);

  return (
    <DefaultNodeContext.Provider
      value={{
        defaultTasks,
        defaultTaskEffort,
        defaultNodeDifficulty,
        setDefaultTasks,
        setDefaultTaskEffort,
        setDefaultNodeDifficulty
      }}
    >
      {children}
    </DefaultNodeContext.Provider>
  );
};


