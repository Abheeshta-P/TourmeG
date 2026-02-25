package com.graph.TourmeG.service;

import com.graph.TourmeG.dto.StopDTO;
import com.graph.TourmeG.model.Node;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MatrixService {

    @Autowired
    private final GraphService graphService;

    // store the calculated path between nodes so that it can be used after the TSP calc
    public Map<String, List<Node>> pathCache = new HashMap<>();

    // Build the input for TSP
    public double[][] buildMatrix(List<StopDTO> stops, int startIdx){
        int n = stops.size();
        double[][] distanceMatrix = new double[n][n];
        long[] snappedIds = new long[n];

        // 1. snapping to nearest node
        for(int i = 0; i < n; i++){
          snappedIds[i] = graphService.findNearestNode(stops.get(i).getLat(), stops.get(i).getLon());
        }

        // 2. Calculate all A* distances first
        for(int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                GraphService.PathResult result = graphService.findPath(snappedIds[i], snappedIds[j]);

                distanceMatrix[i][j] = result.distance();
                distanceMatrix[j][i] = result.distance();

                // key normalization
                pathCache.put(Math.min(i,j) + "-" + Math.max(i,j), result.path());
            }
        }

        // 3. Normalization
        double avgDist = calculateAvgDist(distanceMatrix);
        double avgWorkload = calculateAvgWorkload(stops);
        double weight = (avgWorkload > 0) ? avgDist / avgWorkload : 1.0;

        // 4. Final combined matrix input to TSP
        // Formula: distMatrix[i][j] + (stops.get(j).getWorkload() * weight)
        double[][] combinedMatrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    combinedMatrix[i][j] = 0.0;
                } else if (distanceMatrix[i][j] == Double.MAX_VALUE) {
                    combinedMatrix[i][j] = Double.MAX_VALUE;
                } else {
                    // Cost to ARRIVE at j = travel distance + workload at j
                    // Workload is only 0 if we are returning to the start node.

                    double effectiveWorkload = (j == startIdx) ? 0 : stops.get(j).getTotalWorkload();
                    combinedMatrix[i][j] = distanceMatrix[i][j] + (effectiveWorkload * weight);                }
            }
        }

        return combinedMatrix;
    }

    private double calculateAvgDist(double[][] matrix) {
        int n = matrix.length;
        double sum = 0.0;
        int count = 0; // Keep track of how many pairs we check

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                // Only count it if a path was actually found!
                if (matrix[i][j] < Double.MAX_VALUE) {
                    sum += matrix[i][j];
                    count++;
                }
            }
        }
        // Divide by the number of pairs, not the number of nodes
        return count > 0 ? sum / count : 0.0;
    }

    private double calculateAvgWorkload(List<StopDTO> stops){
        int n = stops.size();
        double sum = 0.0;

        for(StopDTO stop: stops){
            sum += stop.getTotalWorkload();
        }

        return sum/n;
    }

}
