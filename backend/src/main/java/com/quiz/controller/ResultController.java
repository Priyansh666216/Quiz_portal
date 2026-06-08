package com.quiz.controller;

import com.quiz.dto.ResultResponse;
import com.quiz.dto.SubmitQuizRequest;
import com.quiz.service.ResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @PostMapping("/submit")
    public ResponseEntity<ResultResponse> submitQuiz(
            @Valid @RequestBody SubmitQuizRequest request) {
        return ResponseEntity.ok(resultService.submitQuiz(request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ResultResponse>> getMyResults() {
        return ResponseEntity.ok(resultService.getMyResults());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultResponse> getResultById(
            @PathVariable Long id) {
        return ResponseEntity.ok(resultService.getResultById(id));
    }

    @GetMapping("/quiz/{quizId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResultResponse>> getResultsByQuiz(
            @PathVariable Long quizId) {
        return ResponseEntity.ok(resultService.getResultsByQuiz(quizId));
    }
}