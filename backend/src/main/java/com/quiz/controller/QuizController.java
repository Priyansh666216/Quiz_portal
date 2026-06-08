package com.quiz.controller;

import com.quiz.dto.*;
import com.quiz.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Quiz Controller — REST APIs:
 * POST   /api/quizzes/create        → Create quiz (ADMIN)
 * GET    /api/quizzes/all           → Get all quizzes (PUBLIC)
 * GET    /api/quizzes/{id}          → Get quiz by ID (PUBLIC)
 * GET    /api/quizzes/category/{c}  → Get by category (PUBLIC)
 * PUT    /api/quizzes/update/{id}   → Update quiz (ADMIN)
 * DELETE /api/quizzes/delete/{id}   → Delete quiz (ADMIN)
 */
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    // API 3 — Create Quiz
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> createQuiz(@Valid @RequestBody QuizRequest request) {
        return ResponseEntity.ok(quizService.createQuiz(request));
    }

    // API 4 — Get All Quizzes
    @GetMapping("/all")
    public ResponseEntity<List<QuizResponse>> getAllQuizzes() {
        return ResponseEntity.ok(quizService.getAllQuizzes());
    }

    // API 5 — Get Quiz By ID
    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuizById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    // API 6 — Get By Category
    @GetMapping("/category/{category}")
    public ResponseEntity<List<QuizResponse>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(quizService.getQuizzesByCategory(category));
    }

    // API 7 — Update Quiz
    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> updateQuiz(@PathVariable Long id,
                                                    @Valid @RequestBody QuizRequest request) {
        return ResponseEntity.ok(quizService.updateQuiz(id, request));
    }

    // API 8 — Delete Quiz
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok("Quiz deleted successfully");
    }
}
