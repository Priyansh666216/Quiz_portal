package com.quiz.service;

import com.quiz.dto.*;
import com.quiz.entity.*;
import com.quiz.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;

    public QuestionResponse addQuestion(QuestionRequest request) {
        validateQuestionRequest(request);
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        Question.QuestionType type = parseType(request.getType());
        Question question = Question.builder()
                .questionText(request.getQuestionText())
                .type(type)
                .optionA(request.getOptionA())
                .optionB(request.getOptionB())
                .optionC(request.getOptionC())
                .optionD(request.getOptionD())
                .correctAnswer(type == Question.QuestionType.MCQ ? request.getCorrectAnswer() : null)
                .starterCode(request.getStarterCode())
                .sampleInput(request.getSampleInput())
                .expectedOutput(type == Question.QuestionType.CODING ? request.getExpectedOutput() : null)
                .explanation(request.getExplanation())
                .marks(request.getMarks() != null ? request.getMarks() : 1)
                .quiz(quiz)
                .build();

        return mapToResponse(questionRepository.save(question), true);
    }

    public List<QuestionResponse> getQuestionsByQuiz(Long quizId, boolean isAdmin) {
        return questionRepository.findByQuizId(quizId).stream()
                .map(q -> mapToResponse(q, isAdmin))
                .collect(Collectors.toList());
    }

    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        validateQuestionRequest(request);
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        Question.QuestionType type = parseType(request.getType());
        q.setQuestionText(request.getQuestionText());
        q.setType(type);
        q.setOptionA(request.getOptionA());
        q.setOptionB(request.getOptionB());
        q.setOptionC(request.getOptionC());
        q.setOptionD(request.getOptionD());
        q.setCorrectAnswer(type == Question.QuestionType.MCQ ? request.getCorrectAnswer() : null);
        q.setStarterCode(request.getStarterCode());
        q.setSampleInput(request.getSampleInput());
        q.setExpectedOutput(type == Question.QuestionType.CODING ? request.getExpectedOutput() : null);
        q.setExplanation(request.getExplanation());
        q.setMarks(request.getMarks() != null ? request.getMarks() : 1);

        return mapToResponse(questionRepository.save(q), true);
    }

    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new RuntimeException("Question not found");
        }
        questionRepository.deleteById(id);
    }

    private void validateQuestionRequest(QuestionRequest request) {
        if (request.getQuizId() == null) {
            throw new RuntimeException("Quiz is required");
        }
        if (isBlank(request.getQuestionText())) {
            throw new RuntimeException("Question text is required");
        }

        Question.QuestionType type = parseType(request.getType());
        if (type == Question.QuestionType.MCQ) {
            if (isBlank(request.getOptionA()) || isBlank(request.getOptionB())
                    || isBlank(request.getOptionC()) || isBlank(request.getOptionD())) {
                throw new RuntimeException("All MCQ options are required");
            }
            if (isBlank(request.getCorrectAnswer()) || !request.getCorrectAnswer().matches("[ABCD]")) {
                throw new RuntimeException("Correct answer must be A, B, C, or D");
            }
        } else if (isBlank(request.getExpectedOutput())) {
            throw new RuntimeException("Expected output or grading keyword is required for coding questions");
        }
    }

    private Question.QuestionType parseType(String type) {
        if (isBlank(type)) return Question.QuestionType.MCQ;
        try {
            return Question.QuestionType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Question type must be MCQ or CODING");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private QuestionResponse mapToResponse(Question q, boolean showAnswer) {
        return QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .type(q.getType() != null ? q.getType().name() : Question.QuestionType.MCQ.name())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .correctAnswer(showAnswer ? q.getCorrectAnswer() : null)
                .starterCode(q.getStarterCode())
                .sampleInput(q.getSampleInput())
                .expectedOutput(showAnswer ? q.getExpectedOutput() : null)
                .explanation(showAnswer ? q.getExplanation() : null)
                .marks(q.getMarks())
                .quizId(q.getQuiz().getId())
                .build();
    }
}
