package com.quiz.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer timeLimitMinutes;
    private int questionCount;
    private String createdBy;
    private String createdAt;
}
