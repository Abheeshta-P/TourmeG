import {type Node } from "../data/nodedata";

export const getNextAvailableId = (existingNodes: Node[]) => {
  const existingIds = new Set(existingNodes.map((n) => n.id));
  // Look for the first number between 1 and 10 not in use
  for (let i = 1; i <= 10; i++) {
    if (!existingIds.has(i)) return i;
  }
  return Date.now() % 1000; // Fallback just in case
};
