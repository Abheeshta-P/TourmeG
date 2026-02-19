package com.graph.TourmeG.service;

import com.graph.TourmeG.model.Edge;
import com.graph.TourmeG.model.Node;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

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

    }
}
