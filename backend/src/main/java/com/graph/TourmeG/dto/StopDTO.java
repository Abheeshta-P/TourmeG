package com.graph.TourmeG.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StopDTO {
    private long id;
    private double lat;
    private double lon;
    private double totalWorkload;
}
