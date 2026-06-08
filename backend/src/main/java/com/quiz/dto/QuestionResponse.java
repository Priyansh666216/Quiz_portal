package com.quiz.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionResponse {
    private Long id;
    private String questionText;
    private String type;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer; // shown only to ADMIN
    private String starterCode;
    private String sampleInput;
    private String expectedOutput; // shown only to ADMIN
    private String explanation;    // shown only to ADMIN
    private Integer marks;
    private Long quizId;
}
