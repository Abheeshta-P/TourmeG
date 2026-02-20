package com.graph.TourmeG.utils;

import org.springframework.stereotype.Component;
import java.util.LinkedList;
import java.util.List;

@Component
public class TSPSolver {

    public List<Integer> solve(double[][] matrix, int startIdx, Integer endIdx) {
        int n = matrix.length;
        int numStates = 1 << n; // 2^n combinations

        // dp[mask][curr] = min cost to reach 'curr' having visited 'mask'
        double[][] dp = new double[numStates][n];
        // parent[mask][curr] = the node we came from to reach 'curr'
        int[][] parent = new int[numStates][n];

        // 1. Initialize
        for (int i = 0; i < numStates; i++) {
            for (int j = 0; j < n; j++) {
                dp[i][j] = Double.MAX_VALUE;
                parent[i][j] = -1;
            }
        }

        // 2. Base Case: Start at the provided index
        dp[1 << startIdx][startIdx] = 0.0;

        // 3. Fill DP Table
        for (int mask = 1; mask < numStates; mask++) {
            for (int curr = 0; curr < n; curr++) {
                if ((mask & (1 << curr)) == 0) continue; // curr node not in mask
                if (dp[mask][curr] == Double.MAX_VALUE) continue; // unreachable

                for (int next = 0; next < n; next++) {
                    if ((mask & (1 << next)) != 0) continue; // already visited
                    if (matrix[curr][next] == Double.MAX_VALUE) continue; // no road

                    int nextMask = mask | (1 << next);
                    double newDist = dp[mask][curr] + matrix[curr][next];

                    if (newDist < dp[nextMask][next]) {
                        dp[nextMask][next] = newDist;
                        parent[nextMask][next] = curr;
                    }
                }
            }
        }

        // 4. Find the best possible path (Handles Broken Roads / Partial Paths)
        int bestMask = 0;
        int bestLastNode = -1;
        int maxNodesVisited = -1;
        double minCostFound = Double.MAX_VALUE;

        // If endIdx is forced, we first check the full mask for that specific end
        if (endIdx != null && dp[numStates - 1][endIdx] < Double.MAX_VALUE) {
            bestMask = numStates - 1;
            bestLastNode = endIdx;
        } else {
            // Otherwise, look for the state with the most nodes visited
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