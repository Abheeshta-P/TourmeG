package com.graph.TourmeG.service;

import com.graph.TourmeG.dto.StopDTO;
import com.graph.TourmeG.model.Node;
import com.graph.TourmeG.utils.TSPSolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TSPService {

    private final MatrixService matrixService;
    private final TSPSolver tspSolver; // Make sure to create this class with the solve() method

    public List<Node> calculateTspRoute(List<StopDTO> stops, int startIdx, Integer endIdx) {
        // 1. Generate the cost matrix (Distance + Workload)
        double[][] combinedMatrix = matrixService.buildMatrix(stops);

        // 2. Solve for the optimal sequence of indices
        // Example output: [0, 4, 2, 7...]
        List<Integer> optimalIndices = tspSolver.solve(combinedMatrix, startIdx, endIdx);

        if (optimalIndices.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. Convert indices back into a continuous list of GPS Nodes
        return assembleFinalPath(optimalIndices);
    }

    private List<Node> assembleFinalPath(List<Integer> indices) {
        List<Node> fullPath = new ArrayList<>();

        for (int k = 0; k < indices.size() - 1; k++) {
            int fromIdx = indices.get(k);
            int toIdx = indices.get(k + 1);

            // Fetch the cached road path we stored in MatrixService
            String key = Math.min(fromIdx, toIdx) + "-" + Math.max(fromIdx, toIdx);
            List<Node> segment = matrixService.pathCache.get(key);

            if (segment == null || segment.isEmpty()) continue;

            // Deep copy to avoid modifying the cache
            List<Node> segmentCopy = new ArrayList<>(segment);

            // LOGIC: If we are traveling from Higher Index to Lower Index,
            // and our cache key was (min-max), we need to reverse the coordinates!
            if (fromIdx > toIdx) {
                Collections.reverse(segmentCopy);
            }

            // Avoid duplicating the connecting node (end of current == start of next)
            if (!fullPath.isEmpty() && !segmentCopy.isEmpty()) {
                fullPath.remove(fullPath.size() - 1);
            }
            fullPath.addAll(segmentCopy);
        }

        return fullPath;
    }
}