package com.quiz.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    public enum QuestionType {
        MCQ,
        CODING
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuestionType type = QuestionType.MCQ;

    @Column
    private String optionA;

    @Column
    private String optionB;

    @Column
    private String optionC;

    @Column
    private String optionD;

    @Column
    private String correctAnswer; // MCQ: "A", "B", "C", or "D"

    @Column(columnDefinition = "TEXT")
    private String starterCode;

    @Column(columnDefinition = "TEXT")
    private String sampleInput;

    @Column(columnDefinition = "TEXT")
    private String expectedOutput; // Coding: expected output or keyword used for simple grading

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "marks")
    @Builder.Default
    private Integer marks = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
}
