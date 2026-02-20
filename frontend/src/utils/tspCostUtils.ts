import type { Node } from "../data/nodedata";

/**
 * Compute workload (sum of task efforts) for a node
 */
export function computeNodeWorkload(node: Node): number {
  if (!node.effort) return 0;
  return Object.values(node.effort).reduce((sum, val) => sum + val, 0);
}

export const getEffectiveNodeData = (
  node: Node,
  defaultTasks: string[],
  defaultEffort: Record<string, number>,
) => {
  return {
    ...node,
    // If node.tasks is empty, use global. Otherwise, use node's custom tasks.
    tasks: node.tasks && node.tasks.length > 0 ? node.tasks : defaultTasks,
    effort:
      node.effort && Object.keys(node.effort).length > 0
        ? node.effort
        : defaultEffort,
  };
};