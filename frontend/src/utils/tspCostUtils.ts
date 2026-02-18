// utils/tspCostUtils.ts
import type { Node } from "../data/nodedata";

/**
 * Compute workload (sum of task efforts) for a node
 */
export function computeNodeWorkload(node: Node): number {
  if (!node.effort) return 0;
  return Object.values(node.effort).reduce((sum, val) => sum + val, 0);
}

/**
 * Compute workload for all nodes (returns array of workloads)
 */
export function computeAllWorkloads(nodes: Node[]): number[] {
  return nodes.map((n) => computeNodeWorkload(n));
}

/**
 * Compute average workload across nodes
 */
export function computeAverageWorkload(nodes: Node[]): number {
  const workloads = computeAllWorkloads(nodes);
  if (!workloads.length) return 0;
  const total = workloads.reduce((sum, w) => sum + w, 0);
  return total / workloads.length;
}

/**
 * Compute average distance from a distance matrix
 * Assumes distanceMatrix[i][j] contains A* distances
 * Only uses unique pairs (i<j)
 */
export function computeAverageDistance(distanceMatrix: number[][]): number {
  const n = distanceMatrix.length;
  if (n <= 1) return 0;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      sum += distanceMatrix[i][j];
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

/**
 * Compute workloadWeight = avgDistance / avgWorkload
 */
export function computeWorkloadWeight(
  nodes: Node[],
  distanceMatrix: number[][],
): number {
  const avgWorkload = computeAverageWorkload(nodes);
  const avgDistance = computeAverageDistance(distanceMatrix);

  // Prevent divide by zero
  return avgWorkload > 0 ? avgDistance / avgWorkload : 1;
}

/**
 * Compute combined cost matrix:
 * combinedCost[i][j] = distanceMatrix[i][j] + workload(j) * workloadWeight
 */
export function computeCombinedCostMatrix(
  nodes: Node[],
  distanceMatrix: number[][],
): number[][] {
  const n = nodes.length;
  const combined: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0),
  );

  const workloads = computeAllWorkloads(nodes);
  const workloadWeight = computeWorkloadWeight(nodes, distanceMatrix);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) combined[i][j] = 0;
      else
        combined[i][j] = distanceMatrix[i][j] + workloads[j] * workloadWeight;
    }
  }

  return combined;
}
