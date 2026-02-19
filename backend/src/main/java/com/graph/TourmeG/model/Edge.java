package com.graph.TourmeG.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class Edge {
    private long targetId;      // The OSM ID
    private double dist;
}
