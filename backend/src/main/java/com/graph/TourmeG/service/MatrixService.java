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
    Map<String, List<Node>> pathCache = new HashMap<>();

    public double[][] buildMatrix(List<StopDTO> stops){
        int n = stops.size();
        double[][] distanceMatrix = new double[n][n];

        // 1. Calculate all A* distances first
        for(int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                // snapping to nearest node
                long startNodeId = graphService.findNearestNode(stops.get(i).getLat(), stops.get(i).getLon());
                long endNodeId = graphService.findNearestNode(stops.get(j).getLat(), stops.get(j).getLon());

                double dist = graphService.findPath(startNodeId, endNodeId).getDistance();

                // two way road
                distanceMatrix[i][j] = dist;
                distanceMatrix[j][i] = dist;
            }
        }


    }

    // 1. convert frontend lan,lat to id's

    // 2. Construct matrix of cost/dist + nodeeffort by normalizing with scalefactor weight
}
