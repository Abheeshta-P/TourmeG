package com.graph.TourmeG.controller;

import com.graph.TourmeG.dto.TspRequest;
import com.graph.TourmeG.model.Node;
import com.graph.TourmeG.service.TSPService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
public class RouteController {

    private final TSPService tspService;

    @PostMapping("/calculate")
    public ResponseEntity<List<Node>> getOptimalRoute(@RequestBody TspRequest request) {
        List<Node> finalPath = tspService.calculateTspRoute(
                request.getStops(),
                request.getStartIdx(),
                request.getEndIdx()
        );

        return ResponseEntity.ok(finalPath);
    }
}
