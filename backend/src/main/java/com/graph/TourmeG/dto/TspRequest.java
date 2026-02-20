package com.graph.TourmeG.dto;

import lombok.Data;

import java.util.List;

@Data
public class TspRequest {
    private List<StopDTO> stops;
    private int startIdx;
    private Integer endIdx; // Can be null
}