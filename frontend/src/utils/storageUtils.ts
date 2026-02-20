// storageUtils.ts
import { type Node } from "../data/nodedata";

const NODES_KEY = "map_nodes_data";
const DEFAULTS_KEY = "map_default_settings";
const ROUTE_KEY = "last_calculated_route";

export const storage = {
  // Save Nodes to LocalStorage
  saveNodes: (nodes: Node[]) => {
    localStorage.setItem(NODES_KEY, JSON.stringify(nodes));
  },

  // Load Nodes or return initial data if empty
  loadNodes: (initialData: Node[]): Node[] => {
    const saved = localStorage.getItem(NODES_KEY);
    return saved ? JSON.parse(saved) : initialData;
  },

  // Save Global Context Defaults
  saveDefaults: (tasks: string[], effort: Record<string, number>) => {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ tasks, effort }));
  },

  // Load Global Context Defaults
  loadDefaults: () => {
    const saved = localStorage.getItem(DEFAULTS_KEY);
    return saved ? JSON.parse(saved) : { tasks: [], effort: {} };
  },

  saveRoute: (path: [number, number][]) => {
    localStorage.setItem(ROUTE_KEY, JSON.stringify(path));
  },

  loadRoute: (): [number, number][] => {
    const saved = localStorage.getItem(ROUTE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  clearRoute: () => {
    localStorage.removeItem(ROUTE_KEY);
  },
};
