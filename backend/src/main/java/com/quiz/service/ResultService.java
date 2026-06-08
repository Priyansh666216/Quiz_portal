package com.quiz.service;

import com.quiz.dto.ResultResponse;
import com.quiz.dto.SubmitQuizRequest;
import com.quiz.entity.Question;
import com.quiz.entity.Quiz;
import com.quiz.entity.Result;
import com.quiz.entity.User;
import com.quiz.repository.QuizRepository;
import com.quiz.repository.ResultRepository;
import com.quiz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final ResultRepository resultRepository;
    private final QuizRepository   quizRepository;
    private final UserRepository   userRepository;
    private final EmailService     emailService;

    // ── Get current logged-in user ──────────────────────────────
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(
                        "User not found: " + username));
    }

    // ── Map Result → ResultResponse ─────────────────────────────
    private ResultResponse toResponse(Result result) {
        Quiz quiz = result.getQuiz();
        double pct = result.getPercentage() != null
                ? result.getPercentage() : 0.0;
        return ResultResponse.builder()
                .id(result.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .category(quiz.getCategory() != null
                        ? quiz.getCategory().name() : "")
                .score(result.getScore())
                .totalMarks(result.getTotalMarks())
                .correctAnswers(result.getCorrectAnswers())
                .totalQuestions(result.getTotalQuestions())
                .percentage(pct)
                .grade(ResultResponse.calculateGrade(pct))
                .submittedAt(result.getSubmittedAt() != null
                        ? result.getSubmittedAt().toString() : null)
                .build();
    }

    // ── GET /results/my ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ResultResponse> getMyResults() {
        User user = getCurrentUser();
        return resultRepository
                .findByUserIdWithQuiz(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── GET /results/{id} ───────────────────────────────────────
    @Transactional(readOnly = true)
    public ResultResponse getResultById(Long id) {
        Result result = resultRepository.findByIdWithQuiz(id)
                .orElseThrow(() -> new RuntimeException(
                        "Result not found: " + id));
        return toResponse(result);
    }

    // ── GET /results/quiz/{quizId} ──────────────────────────────
    @Transactional(readOnly = true)
    public List<ResultResponse> getResultsByQuiz(Long quizId) {
        return resultRepository
                .findByQuizIdWithQuiz(quizId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── POST /results/submit ─────────────────────────────────────
    @Transactional
    public ResultResponse submitQuiz(SubmitQuizRequest request) {
        User user = getCurrentUser();

        Quiz quiz = quizRepository
                .findByIdWithQuestions(request.getQuizId())
                .orElseThrow(() -> new RuntimeException(
                        "Quiz not found: " + request.getQuizId()));

        List<Question> questions = quiz.getQuestions();
        if (questions == null || questions.isEmpty()) {
            throw new RuntimeException("This quiz has no questions");
        }

        Map<Long, String> answers = request.getAnswers() != null
                ? request.getAnswers() : Map.of();

        int totalMarks   = 0;
        int score        = 0;
        int correctCount = 0;

        boolean hasCoding = questions.stream()
                .anyMatch(q -> q.getType() == Question.QuestionType.CODING);
        String quizType = hasCoding ? "CODING" : "MCQ";

        for (Question q : questions) {
            int marks = q.getMarks() != null ? q.getMarks() : 1;
            totalMarks += marks;

            String submitted = answers.get(q.getId());
            if (submitted == null) continue;

            if (q.getType() == Question.QuestionType.CODING) {
                String expected = q.getExpectedOutput() != null
                        ? q.getExpectedOutput().trim().toLowerCase() : "";
                if (!expected.isEmpty()
                        && submitted.toLowerCase().contains(expected)) {
                    score += marks;
                    correctCount++;
                }
            } else {
                if (submitted.trim().equalsIgnoreCase(
                        q.getCorrectAnswer())) {
                    score += marks;
                    correctCount++;
                }
            }
        }

        double percentage = totalMarks > 0
                ? Math.round((score * 100.0) / totalMarks) : 0.0;

        Result result = Result.builder()
                .user(user)
                .quiz(quiz)
                .score(score)
                .totalMarks(totalMarks)
                .correctAnswers(correctCount)
                .totalQuestions(questions.size())
                .percentage(percentage)
                .build();

        result = resultRepository.save(result);

        // Fire email async — does not slow down the response
        emailService.sendQuizResultEmail(
                user.getUsername(),
                user.getEmail(),
                quiz.getTitle(),
                quiz.getCategory() != null
                        ? quiz.getCategory().name() : "",
                score,
                totalMarks,
                correctCount,
                questions.size(),
                percentage,
                ResultResponse.calculateGrade(percentage),
                quizType,
                questions,
                answers
        );

        return toResponse(result);
    }
}