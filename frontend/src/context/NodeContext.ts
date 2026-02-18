// NodeContext.tsx
import { createContext, useContext } from "react";
import { type Node } from "../data/nodedata";

type NodeContextType = {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
};

export const NodeContext = createContext<NodeContextType | undefined>(undefined);

export const useNodes = () => {
  const context = useContext(NodeContext);
  if (!context) throw new Error("useNodes must be used within a NodeProvider");
  return context;
};