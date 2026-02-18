import { type ReactNode, useState, useEffect } from "react";
import { mangaloreNodes, type Node } from "../data/nodedata";
import  { storage } from "../utils/storageUtils";
import { NodeContext } from "./NodeContext";

export const NodeProvider = ({ children }: { children: ReactNode }) => {
  // Optimal initialization: Use the function version of useState 
  // to run the storage loader ONLY on the first mount.
  const [nodes, setNodes] = useState<Node[]>(() => storage.loadNodes(mangaloreNodes));

  // Persistence Layer: Automatically syncs state to LocalStorage
  useEffect(() => {
    storage.saveNodes(nodes);
  }, [nodes]);

  return (
    <NodeContext.Provider value={{ nodes, setNodes }}>
      {children}
    </NodeContext.Provider>
  );
};