import type { Node } from "../data/nodedata";

/**
 * Compute workload (sum of task efforts) for a node
 */
export function computeNodeWorkload(node: Node): number {
  if (!node.effort) return 0;
  return Object.values(node.effort).reduce((sum, val) => sum + val, 0);
}