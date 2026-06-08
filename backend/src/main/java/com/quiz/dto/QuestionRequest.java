package com.quiz.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionRequest {
    private String questionText;
    private String type = "MCQ";
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;
    private String starterCode;
    private String sampleInput;
    private String expectedOutput;
    private String explanation;
    private Integer marks = 1;
    private Long quizId;
}
