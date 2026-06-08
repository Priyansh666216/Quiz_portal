package com.quiz.service;

import com.quiz.dto.*;
import com.quiz.entity.*;
import com.quiz.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    public QuizResponse createQuiz(QuizRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(Quiz.Category.valueOf(request.getCategory().toUpperCase()))
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .createdBy(user)
                .build();

        Quiz saved = quizRepository.save(quiz);
        return mapToResponse(saved);
    }

    public List<QuizResponse> getAllQuizzes() {
        return quizRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public QuizResponse getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + id));
        return mapToResponse(quiz);
    }

    public List<QuizResponse> getQuizzesByCategory(String category) {
        Quiz.Category cat = Quiz.Category.valueOf(category.toUpperCase());
        return quizRepository.findByCategory(cat).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public QuizResponse updateQuiz(Long id, QuizRequest request) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCategory(Quiz.Category.valueOf(request.getCategory().toUpperCase()));
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        return mapToResponse(quizRepository.save(quiz));
    }

    public void deleteQuiz(Long id) {
        if (!quizRepository.existsById(id)) {
            throw new RuntimeException("Quiz not found");
        }
        quizRepository.deleteById(id);
    }

    private QuizResponse mapToResponse(Quiz quiz) {
        int questionCount = (int) questionRepository.countByQuizId(quiz.getId());
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .category(quiz.getCategory().name())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .questionCount(questionCount)
                .createdBy(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getUsername() : "N/A")
                .createdAt(quiz.getCreatedAt() != null ? quiz.getCreatedAt().toString() : "")
                .build();
    }
}
