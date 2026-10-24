import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type {
  Assignment,
  Submission,
  SubmissionAnswer,
} from '../types/lms';

interface StudentQuizPlayerProps {
  assignment: Assignment;
  studentName: string;
  classNameLabel: string;
  allowViewScoreGlobal: boolean;
  previewStudentId?: string;
  onSubmitQuiz: (payload: {
    assignmentId: string;
    submissionKey: string;
    startedAt: string;
    answers: SubmissionAnswer[];
    previewStudentId?: string;
  }) => Promise<{ submission: Submission; revealedAssignment?: Assignment }>;
  onExit: () => void;
}

export const StudentQuizPlayer: React.FC<StudentQuizPlayerProps> = ({
  assignment,
  studentName,
  classNameLabel,
  allowViewScoreGlobal,
  previewStudentId,
  onSubmitQuiz,
  onExit,
}) => {
  const storagePrefix = `quiz_attempt_${assignment.id}_${previewStudentId || 'self'}`;

  const [submissionKey] = useState<string>(() => {
    const savedKey = sessionStorage.getItem(`${storagePrefix}_key`);
    if (savedKey) return savedKey;
    const generated = `subkey-${assignment.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(`${storagePrefix}_key`, generated);
    return generated;
  });

  const [startedAt] = useState<string>(() => {
    const savedStart = sessionStorage.getItem(`${storagePrefix}_start`);
    if (savedStart) return savedStart;
    const now = new Date().toISOString();
    sessionStorage.setItem(`${storagePrefix}_start`, now);
    return now;
  });

  const [answersMap, setAnswersMap] = useState<Record<string, SubmissionAnswer>>(() => {
    try {
      const saved = sessionStorage.getItem(`${storagePrefix}_answers`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(10, assignment.durationMinutes * 60 - Math.max(0, elapsed));
  });

  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    submission: Submission;
    revealedAssignment?: Assignment;
  } | null>(null);

  const hasSubmittedRef = useRef(false);

  // Persist answers to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem(`${storagePrefix}_answers`, JSON.stringify(answersMap));
  }, [answersMap, storagePrefix]);

  const performSubmit = async () => {
    if (hasSubmittedRef.current || submitting) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    setConfirmSubmitOpen(false);

    const formattedAnswers: SubmissionAnswer[] = assignment.questions.map((q) => {
      const existing = answersMap[q.id];
      return {
        questionId: q.id,
        selectedOptionIds: existing?.selectedOptionIds || [],
        textAnswer: existing?.textAnswer || '',
      };
    });

    try {
      const result = await onSubmitQuiz({
        assignmentId: assignment.id,
        submissionKey,
        startedAt,
        answers: formattedAnswers,
        previewStudentId,
      });
      sessionStorage.removeItem(`${storagePrefix}_key`);
      sessionStorage.removeItem(`${storagePrefix}_start`);
      sessionStorage.removeItem(`${storagePrefix}_answers`);
      setCompletedResult(result);
    } catch (err) {
      hasSubmittedRef.current = false;
      setSubmitError(err instanceof Error ? err.message : 'Lỗi nộp bài, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (completedResult) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          performSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [completedResult]);

  const answeredCount = useMemo(() => {
    return assignment.questions.filter((q) => {
      const a = answersMap[q.id];
      if (!a) return false;
      if (q.type === 'short_answer' || q.type === 'essay') {
        return Boolean(a.textAnswer && a.textAnswer.trim().length > 0);
      }
      return Boolean(a.selectedOptionIds && a.selectedOptionIds.length > 0);
    }).length;
  }, [assignment.questions, answersMap]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Submission Completed Screen
  if (completedResult) {
    const { submission, revealedAssignment } = completedResult;
    const canShowScore =
      assignment.allowViewScore && allowViewScoreGlobal && submission.score10 >= 0;
    const refQuestions = revealedAssignment?.questions || assignment.questions;

    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-sky-200 space-y-6">
        <div className="text-center space-y-2 py-4 bg-[#EAF5FF] rounded-2xl border border-sky-200 px-4">
          <CheckCircle2 className="w-14 h-14 text-[#22C55E] mx-auto" />
          <h2 className="text-2xl font-bold text-[#003B8E]">NỘP BÀI THÀNH CÔNG!</h2>
          <p className="text-base text-slate-700">
            Học sinh: <strong>{submission.studentName}</strong> (Lớp {submission.className}) · Bài tập:{' '}
            <strong>{submission.assignmentTitle}</strong>
          </p>
          <p className="text-xs text-slate-600 tabular-nums">
            Lần làm thứ: {submission.attemptNumber} · Bắt đầu:{' '}
            {new Date(submission.startedAt).toLocaleTimeString('vi-VN')} · Nộp lúc:{' '}
            {new Date(submission.submittedAt).toLocaleString('vi-VN')}
          </p>

          {canShowScore ? (
            <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white px-5 py-3 rounded-xl border border-sky-200 shadow-xs">
                <div className="text-xs text-slate-500">Điểm số đạt được</div>
                <div className="text-3xl font-bold text-[#0066CC] tabular-nums">
                  {submission.score10.toFixed(1).replace('.', ',')} / 10
                </div>
              </div>
              <div className="bg-white px-5 py-3 rounded-xl border border-sky-200 shadow-xs">
                <div className="text-xs text-slate-500">Số câu đúng tự động</div>
                <div className="text-3xl font-bold text-emerald-600 tabular-nums">
                  {submission.correctCount} / {submission.totalQuestions}
                </div>
              </div>
              {submission.gradingStatus === 'pending_essay' && (
                <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 text-amber-900 text-sm font-bold">
                  Bài làm có câu tự luận/điền đáp án đang chờ cô giáo chấm điểm bổ sung.
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 text-sm font-bold text-amber-800">
              Bài làm của em đã được lưu an toàn. Điểm chi tiết sẽ hiển thị khi giáo viên cho phép xem kết quả.
            </div>
          )}
        </div>

        {/* Detailed Question Review if allowed */}
        {canShowScore && submission.evaluations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#003B8E]">Chi tiết bài làm của em</h3>
            {refQuestions.map((q, idx) => {
              const ans = submission.answers.find((a) => a.questionId === q.id);
              const ev = submission.evaluations.find((e) => e.questionId === q.id);
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200 bg-[#F8FBFF] space-y-2 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-[#003B8E]">
                      Câu {idx + 1}: {q.prompt}
                    </div>
                    <span
                      className={`font-bold shrink-0 ${
                        ev?.isCorrect === true
                          ? 'text-emerald-700'
                          : ev?.isCorrect === false
                            ? 'text-red-600'
                            : 'text-amber-700'
                      }`}
                    >
                      {ev?.isCorrect === true
                        ? `Đúng (+${ev.earnedPoints}đ)`
                        : ev?.isCorrect === false
                          ? 'Chưa đúng (0đ)'
                          : 'Chờ giáo viên chấm'}
                    </span>
                  </div>

                  {q.type === 'short_answer' || q.type === 'essay' ? (
                    <div className="text-slate-700">
                      Câu trả lời của em: <strong>{ans?.textAnswer || '(Bỏ trống)'}</strong>
                    </div>
                  ) : (
                    <div className="text-slate-700">
                      Đáp án đã chọn:{' '}
                      <strong>{(ans?.selectedOptionIds || []).join(', ') || '(Chưa chọn)'}</strong>
                      {q.correctOptionIds.length > 0 && (
                        <span className="ml-3 text-emerald-700">
                          · Đáp án đúng: <strong>{q.correctOptionIds.join(', ')}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-sky-100">
                      Giải thích: {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onExit}
            className="px-6 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-base cursor-pointer"
          >
            Quay về danh sách bài tập
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = assignment.questions[currentIdx];
  const currentAnswer = answersMap[currentQuestion.id];

  const handleToggleSingle = (optId: string) => {
    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIds: [optId],
      },
    }));
  };

  const handleToggleMultiple = (optId: string) => {
    const cur = currentAnswer?.selectedOptionIds || [];
    const next = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIds: next,
      },
    }));
  };

  const handleTextChange = (val: string) => {
    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        textAnswer: val,
      },
    }));
  };

  const progressPct = Math.round((answeredCount / assignment.questions.length) * 100);

  return (
    <div className="space-y-4">
      {/* Top Quiz Header Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0066CC]">
            ĐANG LÀM BÀI TẬP · Học sinh: {studentName} (Lớp {classNameLabel})
          </div>
          <h2 className="text-xl font-bold text-[#003B8E]">{assignment.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-xl font-bold text-lg flex items-center gap-2 tabular-nums border ${
              secondsLeft <= 60
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-[#EAF5FF] text-[#003B8E] border-sky-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => setConfirmSubmitOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Đang nộp...' : 'Nộp bài'}</span>
          </button>
        </div>
      </div>

      {submitError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Question Stage */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-xs border border-sky-100 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-base font-bold text-[#0066CC]">
              Câu hỏi {currentIdx + 1} / {assignment.questions.length}
            </span>
            <span className="text-xs text-slate-500">
              Điểm câu này: <strong>{currentQuestion.points} điểm</strong> ·{' '}
              {currentQuestion.type === 'single_choice'
                ? 'Chọn 1 đáp án đúng'
                : currentQuestion.type === 'multiple_choice'
                  ? 'Chọn nhiều đáp án đúng'
                  : currentQuestion.type === 'true_false'
                    ? 'Chọn Đúng hoặc Sai'
                    : currentQuestion.type === 'short_answer'
                      ? 'Điền đáp án ngắn'
                      : 'Tự luận'}
            </span>
          </div>

          <div className="text-lg font-bold text-slate-900 leading-relaxed">
            {currentQuestion.prompt}
          </div>

          {currentQuestion.imageUrl && (
            <div className="rounded-xl border border-sky-100 bg-[#F8FBFF] p-3 flex justify-center">
              <img
                src={currentQuestion.imageUrl}
                alt="Hình minh họa câu hỏi"
                referrerPolicy="no-referrer"
                className="max-h-64 object-contain"
              />
            </div>
          )}

          {/* Answer Input Area */}
          {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'true_false') && (
            <div className="space-y-2.5">
              {currentQuestion.options.map((opt) => {
                const selected = (currentAnswer?.selectedOptionIds || []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleSingle(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer text-base ${
                      selected
                        ? 'border-[#0066CC] bg-[#EAF5FF] text-[#003B8E] font-bold'
                        : 'border-slate-200 hover:border-sky-300 bg-white text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        selected ? 'bg-[#0066CC] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.id === 'TRUE' ? 'Đ' : opt.id === 'FALSE' ? 'S' : opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'multiple_choice' && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#0066CC]">
                (Em có thể nhấn chọn nhiều đáp án đúng cho câu hỏi này)
              </p>
              {currentQuestion.options.map((opt) => {
                const selected = (currentAnswer?.selectedOptionIds || []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleMultiple(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer text-base ${
                      selected
                        ? 'border-[#0066CC] bg-[#EAF5FF] text-[#003B8E] font-bold'
                        : 'border-slate-200 hover:border-sky-300 bg-white text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm shrink-0 ${
                        selected ? 'bg-[#0066CC] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'short_answer' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Nhập đáp án ngắn của em:
              </label>
              <input
                type="text"
                value={currentAnswer?.textAnswer || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Gõ câu trả lời ngắn gọn tại đây..."
                className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#0066CC] focus:outline-none text-base"
              />
            </div>
          )}

          {currentQuestion.type === 'essay' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Bài làm tự luận của em (Cô giáo sẽ đọc và chấm điểm):
              </label>
              <textarea
                rows={5}
                value={currentAnswer?.textAnswer || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Em hãy trình bày câu trả lời vào ô này..."
                className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 focus:border-[#0066CC] focus:outline-none text-base"
              />
            </div>
          )}

          {/* Prev / Next Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {currentIdx < assignment.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(assignment.questions.length - 1, i + 1))}
                className="px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(true)}
                className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Hoàn thành & Nộp bài</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Progress & Question Grid */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4 self-start">
          <div>
            <div className="flex items-center justify-between text-sm font-bold text-[#003B8E] mb-1.5">
              <span>Tiến độ làm bài</span>
              <span className="tabular-nums">
                {answeredCount}/{assignment.questions.length} câu ({progressPct}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0066CC] to-[#22C55E] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-600 mb-2">Danh sách câu hỏi:</div>
            <div className="grid grid-cols-5 gap-2">
              {assignment.questions.map((q, idx) => {
                const a = answersMap[q.id];
                const isDone =
                  q.type === 'short_answer' || q.type === 'essay'
                    ? Boolean(a?.textAnswer && a.textAnswer.trim())
                    : Boolean(a?.selectedOptionIds && a.selectedOptionIds.length > 0);
                const isCur = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl font-bold text-sm tabular-nums cursor-pointer border transition-colors ${
                      isCur
                        ? 'border-2 border-[#FFC107] bg-[#003B8E] text-white'
                        : isDone
                          ? 'bg-[#2196F3] text-white border-[#2196F3]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EAF5FF] text-xs text-[#003B8E] space-y-1">
            <div className="font-bold">Hướng dẫn của cô giáo:</div>
            <p>{assignment.instructions}</p>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="w-full py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Tạm thoát (Tiến độ đang làm vẫn được giữ)
          </button>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-[#003B8E]">Xác nhận nộp bài tập</h3>
            <p className="text-sm text-slate-700">
              Em đã trả lời <strong>{answeredCount}</strong> trên tổng số{' '}
              <strong>{assignment.questions.length}</strong> câu hỏi.
              {answeredCount < assignment.questions.length && (
                <span className="block text-amber-700 font-bold mt-1">
                  Chú ý: Vẫn còn {assignment.questions.length - answeredCount} câu chưa trả lời!
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Kiểm tra lại bài
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={performSubmit}
                className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang nộp bài...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
