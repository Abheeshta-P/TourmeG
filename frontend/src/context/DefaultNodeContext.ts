import { createContext, useContext } from "react";

type DefaultNodeContextType = {
  defaultTasks: string[];
  defaultTaskEffort: { [task: string]: number }; // effort for each task
  
  setDefaultTasks: (tasks: string[]) => void;
  setDefaultTaskEffort: (effort: { [task: string]: number }) => void;
};


export const DefaultNodeContext = createContext<DefaultNodeContextType | undefined>(undefined);

export const useDefaultNode = () => {
  const context = useContext(DefaultNodeContext);
  if (!context)
    throw new Error("useDefaultNode must be used within DefaultNodeProvider");
  return context;
};
