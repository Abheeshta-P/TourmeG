package com.graph.TourmeG.service;

import com.graph.TourmeG.model.Edge;
import com.graph.TourmeG.model.Node;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.Priority;
import lombok.Getter;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.*;

@Service
public class GraphService {

    private class PathResult {
        private double distance;
        private List<Node> path;

        PathResult(double d, List<Node> p){
            distance = d;
            path = p;
        }
    }

    private class NodeWrapper implements Comparable<NodeWrapper>{
        private double fscore;
        private long nodeId;

        NodeWrapper(double f, long id){
            fscore = f;
            nodeId = id;
        }

        @Override
        public int compareTo(NodeWrapper other){
            return Double.compare(this.fscore, other.fscore);
        }
    }

    private Map<Long, Node> nodeMap = new HashMap<>();
    private Map<Long, ArrayList<Edge>> adjList = new HashMap<>();

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
                if (element.get("type").toString().equals("node")) {

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
                if(element.get("type").toString().equals("way")){
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

    // nearest node finder for the input in the OSM data node
    public long findNearestNode(double lat, double lon){
        Node givenNode = Node.builder().id(-1).lon(lon).lat(lat).build();

        double minDist = Double.MAX_VALUE;
        long nodeId = -1;

        for (Node node : nodeMap.values()) {
            double dist = calculateDistance(givenNode, node);
            if (dist < minDist) {
                minDist = dist;
                nodeId = node.getId();
            }
        }

        return nodeId;
    }

    // to construct the path from the targetNode
    private List<Node> reconstructPath (long currentId, Map<Long,Long> cameFrom){
        List<Node> path =  new ArrayList<>();


        while (currentId!=-1L){
            path.add(nodeMap.get(currentId));
            currentId = cameFrom.get(currentId);
        }

        return path.reversed();
    }

    // A* algo, before this do snapping
    public PathResult findPath(long startId, long targetId) {
        PriorityQueue<NodeWrapper> openSet = new PriorityQueue<>();

        Map<Long, Double> gScore = new HashMap<>();
        Map<Long, Long> cameFrom = new HashMap<>();
        Set<Long> closedSet = new HashSet<>();

        Node startNode = nodeMap.get(startId);
        Node targetNode = nodeMap.get(targetId);

        gScore.put(startId, calculateDistance(startNode,targetNode));
        cameFrom.put(startId, -1L);
        openSet.add(new NodeWrapper(0.0, startId));

        while (!openSet.isEmpty()) {
            NodeWrapper nodeWrapper = openSet.poll();
            long nodeId = nodeWrapper.nodeId;

            if (nodeId == targetId) {
                // reconstruct path
                List<Node> path = reconstructPath(targetId, cameFrom);
                return new PathResult(gScore.get(targetId), path);
            }

            if (closedSet.contains(nodeId)) continue;

            closedSet.add(nodeId);

            // targetid, dist and id
            for (Edge nodeEdge : adjList.getOrDefault(nodeId, new ArrayList<>())) {
                long toId = nodeEdge.getTargetId();
                double fromDist = nodeEdge.getDist();

                Node toNode = nodeMap.get(toId);

                if (closedSet.contains(toId)) continue;

                double currentG = gScore.getOrDefault(toId, Double.MAX_VALUE);
                double tentativeGScore = gScore.get(nodeId) + fromDist;

                if (tentativeGScore < currentG) {
                    gScore.put(toId, tentativeGScore);
                    cameFrom.put(toId, nodeId);

                    // fScore = distance walked so far + distance to GOAL
                    double hScore = calculateDistance(toNode, targetNode);
                    openSet.add(new NodeWrapper(tentativeGScore + hScore, toId));
                }
            }
        }

        // unreachable and penalty should be added when constructing matrix for TSP
        return new PathResult(Double.MAX_VALUE,new ArrayList<>());
    }
}
