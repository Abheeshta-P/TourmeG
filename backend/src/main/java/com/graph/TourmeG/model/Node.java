package com.graph.TourmeG.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class Node {
    private long id;      // The OSM ID
    private double lat;   // Latitude (y-axis)
    private double lon;   // Longitude (x-axis)
}
