package com.graph.TourmeG.utils;

import org.springframework.stereotype.Component;
import java.util.LinkedList;
import java.util.List;

@Component
public class TSPSolver {

    /**
     * Solves the TSP problem ensuring ALL nodes are visited.
     * If a path to all nodes cannot be found, it returns the best available full path.
     */
    public List<Integer> solve(double[][] matrix, int startIdx, Integer endIdx) {

        int n = matrix.length;
        int numStates = 1 << n; // 2^n combinations

        // dp[mask][curr] = min cost to reach 'curr' having visited 'mask'
        double[][] dp = new double[numStates][n];
        // parent[mask][curr] = the node we came from to reach 'curr'
        int[][] parent = new int[numStates][n];

        // 1. Initialize with Infinity
        for (int i = 0; i < numStates; i++) {
            for (int j = 0; j < n; j++) {
                dp[i][j] = Double.MAX_VALUE;
                parent[i][j] = -1;
            }
        }

        // 2. Base Case: Start at the user-defined start node
        dp[1 << startIdx][startIdx] = 0.0;

        // 3. Fill DP Table (Bitmasking DP)
        for (int mask = 1; mask < numStates; mask++) {
            for (int curr = 0; curr < n; curr++) {
                // If current node isn't in this mask or state is unreachable, skip
                if ((mask & (1 << curr)) == 0 || dp[mask][curr] == Double.MAX_VALUE) continue;

                for (int next = 0; next < n; next++) {
                    // If 'next' is already visited, skip
                    if ((mask & (1 << next)) != 0) continue;

                    // If no road exists between curr and next, skip
                    if (matrix[curr][next] == Double.MAX_VALUE) continue;

                    int nextMask = mask | (1 << next);
                    double newDist = dp[mask][curr] + matrix[curr][next];

                    if (newDist < dp[nextMask][next]) {
                        dp[nextMask][next] = newDist;
                        parent[nextMask][next] = curr;
                    }
                }
            }
        }

        // 4. Find the best possible path
        int bestMask = 0;
        int bestLastNode = -1;

        // CASE A: ROUND TRIP (Start and End are the same)
        if (endIdx != null && startIdx == endIdx) {
            double minLoopCost = Double.MAX_VALUE;
            bestMask = numStates - 1; // We want all nodes visited

            for (int i = 0; i < n; i++) {
                // We find the node 'i' that allows us to return to startIdx cheapest
                if (i != startIdx && dp[bestMask][i] != Double.MAX_VALUE && matrix[i][startIdx] != Double.MAX_VALUE) {
                    double totalCost = dp[bestMask][i] + matrix[i][startIdx];
                    if (totalCost < minLoopCost) {
                        minLoopCost = totalCost;
                        bestLastNode = i;
                    }
                }
            }

            // If a full loop is found, reconstruct and add the closing link
            if (bestLastNode != -1) {
                List<Integer> path = reconstructPath(parent, bestLastNode, bestMask);
                path.add(startIdx); // Manually close the circle
                return path;
            }
            // Fallback: If no full loop is possible, it will drop down to the "Partial Path" logic below
        }

        // CASE B: SPECIFIC END NODE (Different from start)
        if (endIdx != null && dp[numStates - 1][endIdx] < Double.MAX_VALUE) {
            bestMask = numStates - 1;
            bestLastNode = endIdx;
        }
        // CASE C: BEST PARTIAL PATH (Fallback for broken roads or unspecified end)
        else {
            int maxNodesVisited = -1;
            double minCostFound = Double.MAX_VALUE;

            for (int mask = 1; mask < numStates; mask++) {
                for (int i = 0; i < n; i++) {
                    if (dp[mask][i] == Double.MAX_VALUE) continue;

                    int nodesVisited = Integer.bitCount(mask);
                    if (nodesVisited > maxNodesVisited) {
                        maxNodesVisited = nodesVisited;
                        minCostFound = dp[mask][i];
                        bestMask = mask;
                        bestLastNode = i;
                    } else if (nodesVisited == maxNodesVisited && dp[mask][i] < minCostFound) {
                        minCostFound = dp[mask][i];
                        bestMask = mask;
                        bestLastNode = i;
                    }
                }
            }
        }

        return reconstructPath(parent, bestLastNode, bestMask);
    }

    private List<Integer> reconstructPath(int[][] parent, int lastNode, int mask) {
        LinkedList<Integer> path = new LinkedList<>();
        if (lastNode == -1) return path;

        int currMask = mask;
        int currNode = lastNode;

        while (currNode != -1) {
            path.addFirst(currNode);
            int prevNode = parent[currMask][currNode];
            currMask ^= (1 << currNode); // Backtrack the bit
            currNode = prevNode;
        }
        return path;
    }
}