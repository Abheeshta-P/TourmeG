package com.graph.TourmeG.service;

import com.graph.TourmeG.model.Edge;
import com.graph.TourmeG.model.Node;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Service
public class GraphService {
    private Map<Long, Node> nodeMap = new HashMap<>();
    private Map<Long, ArrayList<Edge>> adjList = new HashMap<>();

//    In Spring Boot, we want this data to load once as soon as the application starts.
//    We use an annotation called @PostConstruct on a method to make this happen.

    @PostConstruct
    private void loadGraph(){
        try {
            ObjectMapper mapper = new ObjectMapper();

            // 1. Get the file
            InputStream is = getClass().getResourceAsStream("/data/roads_network.json");

            if(is==null){
                throw new RuntimeException("Could not find the roads_network.json file!");
            }

            // 2. Turn it into the tree
            JsonNode root = mapper.readTree(is);

            // 3. get the elements actual data from json
            JsonNode elements = root.get("elements");

            if(!elements.isArray()){
                throw new RuntimeException("Elements in file does not contain any elements, check the data.");
            }

            // First populate the points/nodes to form the nodemap
            for (JsonNode element : elements) {
                // 1. Convert to text before comparing
                if (element.get("type").asString().equals("node")) {

                    // 2. Use Jackson's built-in conversion (much faster than parsing strings)
                    long id = element.get("id").asLong();
                    double lat = element.get("lat").asDouble();
                    double lon = element.get("lon").asDouble();

                    Node newNode = Node.builder()
                            .id(id)
                            .lat(lat)
                            .lon(lon)
                            .build();

                    nodeMap.put(id, newNode);
                }
            }

            // Populate the adj list by going though the ways (type:way)
            // inside nodes array there are node ids for which nodes are picked from the nodeMap
            for(JsonNode element:elements){
                if(element.get("type").asString().equals("way")){
                    JsonNode nodesOfWay = element.get("nodes");
                    if(!nodesOfWay.isArray()){
                        throw new RuntimeException("Nodes in file does not contain any node, check the data.");
                    }

                    for (int i = 0; i < nodesOfWay.size() - 1; i++) {
                        long uId = nodesOfWay.get(i).asLong();     // Current node
                        long vId = nodesOfWay.get(i + 1).asLong(); // Next node

                        // Logic: Look up both nodes in nodeMap to calculate distance
                        Node nodeU = nodeMap.get(uId);
                        Node nodeV = nodeMap.get(vId);

                        if (nodeU != null && nodeV != null) {
                            // Here is where we calculate real distance
                            double distance = calculateDistance(nodeU, nodeV);

                            // Add A -> B
                            adjList.computeIfAbsent(uId, k -> new ArrayList<>()).add(new Edge(vId, distance));

                            // Add B -> A (Assuming two-way street)
                            adjList.computeIfAbsent(vId, k -> new ArrayList<>()).add(new Edge(uId, distance));
                        }
                    }
                }
            }

        }catch (Exception e) {
            e.printStackTrace();
        }
    }

    private double calculateDistance(Node a, Node b) {
        double R = 6371000; // Earth's radius in meters
        double lat1 = Math.toRadians(a.getLat());
        double lat2 = Math.toRadians(b.getLat());
        double dLat = Math.toRadians(b.getLat() - a.getLat());
        double dLon = Math.toRadians(b.getLon() - a.getLon());

        double ans = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(ans), Math.sqrt(1 - ans));

        return R * c; // Result in meters
    }
}
