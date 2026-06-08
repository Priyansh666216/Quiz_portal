package com.quiz.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.quiz.entity.Question;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Async
    public void sendQuizResultEmail(
            String studentUsername,
            String studentEmail,
            String quizTitle,
            String category,
            int score,
            int totalMarks,
            int correctAnswers,
            int totalQuestions,
            double percentage,
            String grade,
            String quizType,
            List<Question> questions,
            Map<Long, String> answers
    ) {
        try {
            byte[] pdfBytes = generateResultPdf(
                    studentUsername, studentEmail, quizTitle, category,
                    score, totalMarks, correctAnswers, totalQuestions,
                    percentage, grade, quizType, questions, answers);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(adminEmail);
            helper.setSubject("📊 Quiz Submitted — "
                    + studentUsername + " | "
                    + quizTitle + " | Grade: " + grade);

            String gradeColor =
                    (grade.equals("A+") || grade.equals("A")) ? "#22c55e"
                            : (grade.equals("B") || grade.equals("C")) ? "#f59e0b"
                            : grade.equals("D") ? "#f97316"
                            : "#ef4444";

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8"/>
                  <style>
                    body{font-family:Arial,sans-serif;background:#f4f4f4;
                         margin:0;padding:20px;}
                    .card{background:#ffffff;border-radius:12px;max-width:560px;
                          margin:0 auto;overflow:hidden;
                          box-shadow:0 2px 12px rgba(0,0,0,0.1);}
                    .header{background:#1a1a1a;padding:28px 32px;}
                    .header h1{color:#f0c040;margin:0;font-size:22px;}
                    .header p{color:#aaaaaa;margin:4px 0 0;font-size:13px;}
                    .body{padding:28px 32px;}
                    .grade-badge{display:inline-block;background:%s;
                                 color:#fff;font-size:36px;font-weight:bold;
                                 border-radius:50%%;width:72px;height:72px;
                                 line-height:72px;text-align:center;
                                 margin-bottom:20px;}
                    .row{display:flex;justify-content:space-between;
                         border-bottom:1px solid #f0f0f0;
                         padding:10px 0;font-size:14px;}
                    .row:last-child{border-bottom:none;}
                    .label{color:#666;}
                    .value{font-weight:bold;color:#1a1a1a;}
                    .badge{display:inline-block;background:#f0c040;
                           color:#1a1a1a;font-size:11px;font-weight:bold;
                           border-radius:4px;padding:2px 8px;margin-left:8px;}
                    .footer{background:#f9f9f9;padding:16px 32px;
                            font-size:12px;color:#999;text-align:center;}
                    .pdf-note{background:#f0f9ff;border:1px solid #bae6fd;
                              border-radius:8px;padding:12px 16px;margin-top:16px;
                              font-size:13px;color:#0369a1;}
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="header">
                      <h1>QuizMaster — Result Notification</h1>
                      <p>A student just submitted a quiz</p>
                    </div>
                    <div class="body">
                      <div class="grade-badge">%s</div>
                      <div class="row">
                        <span class="label">Student</span>
                        <span class="value">%s</span>
                      </div>
                      <div class="row">
                        <span class="label">Email</span>
                        <span class="value">%s</span>
                      </div>
                      <div class="row">
                        <span class="label">Quiz</span>
                        <span class="value">%s
                          <span class="badge">%s</span>
                        </span>
                      </div>
                      <div class="row">
                        <span class="label">Category</span>
                        <span class="value">%s</span>
                      </div>
                      <div class="row">
                        <span class="label">Score</span>
                        <span class="value">%d / %d</span>
                      </div>
                      <div class="row">
                        <span class="label">Correct Answers</span>
                        <span class="value">%d / %d</span>
                      </div>
                      <div class="row">
                        <span class="label">Percentage</span>
                        <span class="value">%.1f%%</span>
                      </div>
                      <div class="row">
                        <span class="label">Grade</span>
                        <span class="value" style="color:%s;font-size:18px;">
                          %s
                        </span>
                      </div>
                      <div class="pdf-note">
                        📎 Full answer sheet with all submitted answers is attached as a PDF.
                      </div>
                    </div>
                    <div class="footer">
                      QuizMaster Pro &nbsp;·&nbsp; Automated Notification
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                    gradeColor, grade,
                    studentUsername, studentEmail,
                    quizTitle, quizType,
                    category,
                    score, totalMarks,
                    correctAnswers, totalQuestions,
                    percentage,
                    gradeColor, grade
            );

            helper.setText(html, true);

            // Attach the PDF
            String pdfFilename = "QuizResult_" + studentUsername + "_"
                    + quizTitle.replaceAll("[^a-zA-Z0-9]", "_") + ".pdf";
            helper.addAttachment(pdfFilename,
                    new ByteArrayDataSource(pdfBytes, "application/pdf"));

            mailSender.send(message);
            log.info("Result email with PDF sent for {} — {}",
                    studentUsername, quizTitle);

        } catch (Exception e) {
            log.error("Failed to send result email: {}", e.getMessage(), e);
        }
    }

    // ── PDF Generation ────────────────────────────────────────────
    private byte[] generateResultPdf(
            String studentUsername,
            String studentEmail,
            String quizTitle,
            String category,
            int score,
            int totalMarks,
            int correctAnswers,
            int totalQuestions,
            double percentage,
            String grade,
            String quizType,
            List<Question> questions,
            Map<Long, String> answers
    ) throws Exception {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter writer = PdfWriter.getInstance(doc, baos);

        // Page border
        writer.setPageEvent(new PdfPageEventHelper() {
            @Override
            public void onEndPage(PdfWriter w, Document d) {
                PdfContentByte cb = w.getDirectContent();
                cb.setColorStroke(new BaseColor(30, 30, 30));
                cb.setLineWidth(2f);
                cb.rectangle(20, 20, d.getPageSize().getWidth() - 40,
                        d.getPageSize().getHeight() - 40);
                cb.stroke();
            }
        });

        doc.open();

        // ── Color palette ──
        BaseColor gold     = new BaseColor(240, 192, 64);
        BaseColor darkBg   = new BaseColor(26, 26, 26);
        BaseColor textDark = new BaseColor(30, 30, 30);
        BaseColor textGray = new BaseColor(100, 100, 100);
        BaseColor green    = new BaseColor(80, 250, 123);
        BaseColor red      = new BaseColor(255, 85, 85);
        BaseColor lightBg  = new BaseColor(245, 245, 245);

        // ── Fonts ──
        Font titleFont  = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, BaseColor.WHITE);
        Font subFont    = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(180, 180, 180));
        Font h2Font     = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, textDark);
        Font labelFont  = new Font(Font.FontFamily.HELVETICA, 9,  Font.BOLD, textGray);
        Font valueFont  = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, textDark);
        Font bodyFont   = new Font(Font.FontFamily.HELVETICA, 9,  Font.NORMAL, textDark);
        Font codeFont   = new Font(Font.FontFamily.COURIER,   8,  Font.NORMAL, textDark);
        Font correctF   = new Font(Font.FontFamily.HELVETICA, 9,  Font.BOLD, new BaseColor(22, 160, 80));
        Font wrongF     = new Font(Font.FontFamily.HELVETICA, 9,  Font.BOLD, new BaseColor(200, 40, 40));
        Font gradeFont  = new Font(Font.FontFamily.HELVETICA, 26, Font.BOLD, BaseColor.WHITE);

        // ── Header Banner ──
        PdfPTable header = new PdfPTable(1);
        header.setWidthPercentage(100);
        PdfPCell hCell = new PdfPCell();
        hCell.setBackgroundColor(darkBg);
        hCell.setPadding(22);
        hCell.setBorder(Rectangle.NO_BORDER);

        Paragraph hTitle = new Paragraph("QuizMaster — Answer Sheet", titleFont);
        hTitle.setAlignment(Element.ALIGN_CENTER);
        hCell.addElement(hTitle);

        Paragraph hSub = new Paragraph("Submitted: "
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                subFont);
        hSub.setAlignment(Element.ALIGN_CENTER);
        hSub.setSpacingBefore(4);
        hCell.addElement(hSub);
        header.addCell(hCell);
        doc.add(header);
        doc.add(new Paragraph(" "));

        // ── Summary Row: Info + Grade ──
        PdfPTable summaryTable = new PdfPTable(2);
        summaryTable.setWidthPercentage(100);
        summaryTable.setWidths(new float[]{70f, 30f});

        // Left: student info grid
        PdfPTable infoGrid = new PdfPTable(2);
        infoGrid.setWidthPercentage(100);
        infoGrid.setWidths(new float[]{40f, 60f});

        String[][] infoRows = {
            {"Student",   studentUsername},
            {"Email",     studentEmail},
            {"Quiz",      quizTitle},
            {"Category",  category.isEmpty() ? "—" : category},
            {"Type",      quizType},
            {"Score",     score + " / " + totalMarks},
            {"Correct",   correctAnswers + " / " + totalQuestions},
            {"Percentage", String.format("%.1f%%", percentage)},
        };
        for (String[] row : infoRows) {
            PdfPCell lbl = new PdfPCell(new Phrase(row[0], labelFont));
            lbl.setBorder(Rectangle.BOTTOM);
            lbl.setBorderColor(new BaseColor(220, 220, 220));
            lbl.setPadding(5);
            lbl.setBackgroundColor(lightBg);

            PdfPCell val = new PdfPCell(new Phrase(row[1], valueFont));
            val.setBorder(Rectangle.BOTTOM);
            val.setBorderColor(new BaseColor(220, 220, 220));
            val.setPadding(5);

            infoGrid.addCell(lbl);
            infoGrid.addCell(val);
        }

        PdfPCell infoCell = new PdfPCell();
        infoCell.addElement(infoGrid);
        infoCell.setBorder(Rectangle.BOX);
        infoCell.setPadding(8);
        summaryTable.addCell(infoCell);

        // Right: grade circle
        BaseColor gradeCol;
        if (grade.equals("A+") || grade.equals("A")) gradeCol = new BaseColor(34, 197, 94);
        else if (grade.equals("B") || grade.equals("C")) gradeCol = new BaseColor(245, 158, 11);
        else if (grade.equals("D")) gradeCol = new BaseColor(249, 115, 22);
        else gradeCol = new BaseColor(239, 68, 68);

        PdfPCell gradeCell = new PdfPCell();
        gradeCell.setBorder(Rectangle.BOX);
        gradeCell.setBackgroundColor(gradeCol);
        gradeCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        gradeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        gradeCell.setPadding(20);

        Paragraph gradeP = new Paragraph(grade, gradeFont);
        gradeP.setAlignment(Element.ALIGN_CENTER);
        gradeCell.addElement(gradeP);

        Paragraph gradeLabel = new Paragraph("GRADE", labelFont);
        gradeLabel.setAlignment(Element.ALIGN_CENTER);
        Font whiteLabelFont = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BaseColor.WHITE);
        Paragraph gradeLabelW = new Paragraph("GRADE", whiteLabelFont);
        gradeLabelW.setAlignment(Element.ALIGN_CENTER);
        gradeCell.addElement(gradeLabelW);

        summaryTable.addCell(gradeCell);
        doc.add(summaryTable);

        // ── Questions Section ──────────────────────────────────────
        doc.add(new Paragraph(" "));
        Paragraph qHeader = new Paragraph("Answer Sheet — All Questions", h2Font);
        qHeader.setSpacingBefore(10);
        qHeader.setSpacingAfter(8);
        doc.add(qHeader);

        // Horizontal rule
        PdfPTable hr = new PdfPTable(1);
        hr.setWidthPercentage(100);
        PdfPCell hrCell = new PdfPCell();
        hrCell.setBackgroundColor(gold);
        hrCell.setFixedHeight(2f);
        hrCell.setBorder(Rectangle.NO_BORDER);
        hr.addCell(hrCell);
        doc.add(hr);
        doc.add(new Paragraph(" "));

        if (questions == null || questions.isEmpty()) {
            doc.add(new Paragraph("No questions found.", bodyFont));
        } else {
            int qNum = 1;
            for (Question q : questions) {
                String submitted = answers != null ? answers.get(q.getId()) : null;
                boolean isCoding = q.getType() == Question.QuestionType.CODING;

                // ── Question card ──
                PdfPTable qCard = new PdfPTable(1);
                qCard.setWidthPercentage(100);
                qCard.setSpacingAfter(10);

                PdfPCell qCell = new PdfPCell();
                qCell.setBorder(Rectangle.BOX);
                qCell.setBorderColor(new BaseColor(220, 220, 220));
                qCell.setPadding(10);

                // Question number + type badge
                boolean isCorrect;
                if (isCoding) {
                    String expected = q.getExpectedOutput() != null
                            ? q.getExpectedOutput().trim().toLowerCase() : "";
                    isCorrect = submitted != null && !expected.isEmpty()
                            && submitted.toLowerCase().contains(expected);
                } else {
                    isCorrect = submitted != null
                            && submitted.trim().equalsIgnoreCase(q.getCorrectAnswer());
                }

                // Header row: Q number + status
                PdfPTable qHeaderRow = new PdfPTable(2);
                qHeaderRow.setWidthPercentage(100);
                qHeaderRow.setWidths(new float[]{80f, 20f});

                String typeTag = isCoding ? "[CODING]" : "[MCQ]";
                Font typeFont = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD,
                        isCoding ? new BaseColor(200, 140, 20) : new BaseColor(80, 130, 250));

                Paragraph qNumP = new Paragraph();
                qNumP.add(new Chunk("Q" + qNum + ".  " + typeTag + "  ", typeFont));
                qNumP.add(new Chunk(q.getQuestionText(), h2Font));
                PdfPCell qNumCell = new PdfPCell();
                qNumCell.addElement(qNumP);
                qNumCell.setBorder(Rectangle.NO_BORDER);
                qHeaderRow.addCell(qNumCell);

                Font statusFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,
                        submitted == null ? textGray : isCorrect ? new BaseColor(22, 163, 74) : new BaseColor(220, 38, 38));
                String statusText = submitted == null ? "NOT ANSWERED"
                        : isCorrect ? "✓ CORRECT" : "✗ WRONG";
                PdfPCell statusCell = new PdfPCell(new Phrase(statusText, statusFont));
                statusCell.setBorder(Rectangle.NO_BORDER);
                statusCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                statusCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                qHeaderRow.addCell(statusCell);
                qCell.addElement(qHeaderRow);

                // Thin separator
                PdfPTable sep = new PdfPTable(1);
                sep.setWidthPercentage(100);
                PdfPCell sepC = new PdfPCell();
                sepC.setFixedHeight(1f);
                sepC.setBackgroundColor(new BaseColor(230, 230, 230));
                sepC.setBorder(Rectangle.NO_BORDER);
                sep.addCell(sepC);
                qCell.addElement(sep);
                qCell.addElement(new Paragraph(" "));

                if (isCoding) {
                    // Sample input
                    if (q.getSampleInput() != null && !q.getSampleInput().isEmpty()) {
                        qCell.addElement(new Phrase("Sample Input:\n", labelFont));
                        Paragraph sip = new Paragraph(q.getSampleInput(), codeFont);
                        sip.setIndentationLeft(10);
                        qCell.addElement(sip);
                        qCell.addElement(new Paragraph(" "));
                    }

                    // Expected output
                    if (q.getExpectedOutput() != null && !q.getExpectedOutput().isEmpty()) {
                        qCell.addElement(new Phrase("Expected Output:\n", labelFont));
                        Paragraph eop = new Paragraph(q.getExpectedOutput(), codeFont);
                        eop.setIndentationLeft(10);
                        qCell.addElement(eop);
                        qCell.addElement(new Paragraph(" "));
                    }

                    // Submitted code
                    qCell.addElement(new Phrase("Submitted Code:\n", labelFont));
                    String codeText = (submitted != null && !submitted.trim().isEmpty())
                            ? submitted : "(No code submitted)";
                    // truncate long code
                    if (codeText.length() > 1200) {
                        codeText = codeText.substring(0, 1200) + "\n... [truncated]";
                    }
                    PdfPTable codeBox = new PdfPTable(1);
                    codeBox.setWidthPercentage(100);
                    PdfPCell codeBoxCell = new PdfPCell(new Phrase(codeText, codeFont));
                    codeBoxCell.setBackgroundColor(new BaseColor(28, 28, 38));
                    codeBoxCell.setPadding(8);
                    codeBoxCell.setBorder(Rectangle.BOX);
                    codeBoxCell.setBorderColor(new BaseColor(60, 60, 80));
                    // Override code font color to white for dark background
                    Font codeFontWhite = new Font(Font.FontFamily.COURIER, 8, Font.NORMAL, BaseColor.WHITE);
                    codeBoxCell.setPhrase(new Phrase(codeText, codeFontWhite));
                    codeBox.addCell(codeBoxCell);
                    qCell.addElement(codeBox);

                    // Result verdict
                    qCell.addElement(new Paragraph(" "));
                    Font verdictFont = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD,
                            isCorrect ? new BaseColor(22, 163, 74) : new BaseColor(220, 38, 38));
                    String verdict = isCorrect
                            ? "✓ Output matches expected — CORRECT"
                            : "✗ Output does not match expected — WRONG"
                              + (q.getExpectedOutput() != null
                                 ? "\n  Correct Output: " + q.getExpectedOutput().trim()
                                 : "");
                    qCell.addElement(new Phrase(verdict, verdictFont));

                } else {
                    // MCQ options
                    String[] optKeys = {"A", "B", "C", "D"};
                    String[] optVals = {q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()};
                    for (int i = 0; i < 4; i++) {
                        if (optVals[i] == null || optVals[i].isEmpty()) continue;
                        String key  = optKeys[i];
                        String val  = optVals[i];
                        boolean isSubmittedOpt = key.equalsIgnoreCase(submitted);
                        boolean isCorrectOpt   = key.equalsIgnoreCase(q.getCorrectAnswer());

                        BaseColor optBg;
                        Font optFont;
                        String prefix;
                        if (isCorrectOpt) {
                            optBg   = new BaseColor(220, 252, 231);
                            optFont = correctF;
                            prefix  = "✓ ";
                        } else if (isSubmittedOpt) {
                            optBg   = new BaseColor(254, 226, 226);
                            optFont = wrongF;
                            prefix  = "✗ ";
                        } else {
                            optBg   = lightBg;
                            optFont = bodyFont;
                            prefix  = "   ";
                        }

                        PdfPTable optRow = new PdfPTable(2);
                        optRow.setWidthPercentage(100);
                        optRow.setWidths(new float[]{10f, 90f});
                        optRow.setSpacingBefore(2f);

                        PdfPCell keyCell = new PdfPCell(new Phrase(prefix + key, optFont));
                        keyCell.setBackgroundColor(optBg);
                        keyCell.setBorder(Rectangle.NO_BORDER);
                        keyCell.setPadding(5);
                        optRow.addCell(keyCell);

                        PdfPCell valCell = new PdfPCell(new Phrase(val, optFont));
                        valCell.setBackgroundColor(optBg);
                        valCell.setBorder(Rectangle.NO_BORDER);
                        valCell.setPadding(5);
                        optRow.addCell(valCell);

                        qCell.addElement(optRow);
                    }

                    // Show submitted answer summary
                    qCell.addElement(new Paragraph(" "));
                    if (submitted == null) {
                        qCell.addElement(new Phrase("Not Answered  |  Correct Answer: " + q.getCorrectAnswer(), wrongF));
                    } else if (!isCorrect) {
                        qCell.addElement(new Phrase("Your Answer: " + submitted
                                + "  |  Correct Answer: " + q.getCorrectAnswer(), wrongF));
                    } else {
                        qCell.addElement(new Phrase("Your Answer: " + submitted + "  ✓", correctF));
                    }
                }

                // Explanation
                if (q.getExplanation() != null && !q.getExplanation().isEmpty()) {
                    qCell.addElement(new Paragraph(" "));
                    Font hintFont = new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC,
                            new BaseColor(80, 100, 160));
                    qCell.addElement(new Phrase("💡 " + q.getExplanation(), hintFont));
                }

                qCard.addCell(qCell);
                doc.add(qCard);
                qNum++;
            }
        }

        // ── Footer ──
        Paragraph footer = new Paragraph(
                "Generated by QuizMaster Pro  •  " +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")),
                new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, textGray));
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(10);
        doc.add(footer);

        doc.close();
        return baos.toByteArray();
    }
}
