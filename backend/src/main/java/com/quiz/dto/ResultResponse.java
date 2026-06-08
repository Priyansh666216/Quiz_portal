package com.quiz.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultResponse {

    private Long    id;
    private Long    quizId;
    private String  quizTitle;
    private String  category;
    private Integer score;
    private Integer totalMarks;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Double  percentage;
    private String  grade;
    private String  submittedAt;

    public static String calculateGrade(Double percentage) {
        if (percentage == null) return "F";
        if (percentage >= 90)  return "A+";
        if (percentage >= 80)  return "A";
        if (percentage >= 70)  return "B";
        if (percentage >= 60)  return "C";
        if (percentage >= 50)  return "D";
        return "F";
    }
}