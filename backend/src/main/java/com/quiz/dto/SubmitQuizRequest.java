package com.quiz.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmitQuizRequest {
    @NotNull private Long quizId;
    private Map<Long, String> answers; // questionId -> selectedOption (A/B/C/D)
}
