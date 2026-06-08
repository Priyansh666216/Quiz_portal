package com.quiz.repository;

import com.quiz.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {

    List<Result> findByUserId(Long userId);
    List<Result> findByQuizId(Long quizId);
    Optional<Result> findByUserIdAndQuizId(Long userId, Long quizId);

    @Query("SELECT r FROM Result r JOIN FETCH r.quiz JOIN FETCH r.user WHERE r.user.id = :userId ORDER BY r.submittedAt DESC")
    List<Result> findByUserIdWithQuiz(@Param("userId") Long userId);

    @Query("SELECT r FROM Result r JOIN FETCH r.quiz JOIN FETCH r.user WHERE r.quiz.id = :quizId")
    List<Result> findByQuizIdWithQuiz(@Param("quizId") Long quizId);

    @Query("SELECT r FROM Result r JOIN FETCH r.quiz JOIN FETCH r.user WHERE r.id = :id")
    Optional<Result> findByIdWithQuiz(@Param("id") Long id);
}