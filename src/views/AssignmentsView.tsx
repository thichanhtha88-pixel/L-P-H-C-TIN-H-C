import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  Eye,
  Play,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  Assignment,
  ClassRoom,
  GradeLevel,
  Question,
  QuestionType,
  Student,
  Submission,
  SubmissionAnswer,
  SystemSettings,
  UserProfile,
} from '../types/lms';
import { StudentQuizPlayer } from '../components/StudentQuizPlayer';

interface AssignmentsViewProps {
  currentUser: UserProfile;
  settings: SystemSettings;
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  questionBank: Question[];
  submissions: Submission[];
  initialAutoStartAssignmentId?: string | null;
  onClearAutoStart?: () => void;
  onCreateAssignment: (payload: Partial<Assignment>) => Promise<void>;
  onUpdateAssignment: (id: string, payload: Partial<Assignment>) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onSubmitQuiz: (payload: {
    assignmentId: string;
    submissionKey: string;
    startedAt: string;
    answers: SubmissionAnswer[];
    previewStudentId?: string;
  }) => Promise<{ submission: Submission; revealedAssignment?: Assignment }>;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  currentUser,
  settings,
  classes,
  students,
  assignments,
  questionBank,
  submissions,
  initialAutoStartAssignmentId,
  onClearAutoStart,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onSubmitQuiz,
}) => {
  const isTeacher = currentUser.role === 'teacher';

  const [activeQuizAssignment, setActiveQuizAssignment] = useState<Assignment | null>(null);
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  useEffect(() => {
    if (initialAutoStartAssignmentId) {
      const target = assignments.find((a) => a.id === initialAutoStartAssignmentId);
      if (target) {
        setActiveQuizAssignment(target);
      }
      if (onClearAutoStart) onClearAutoStart();
    }
  }, [initialAutoStartAssignmentId, assignments, onClearAutoStart]);

  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Create/Edit Assignment Builder State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(settings.defaultDurationMinutes);
  const [dueDate, setDueDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [allowViewScore, setAllowViewScore] = useState(true);
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // Inline Question Creator inside Builder
  const [showInlineQForm, setShowInlineQForm] = useState(false);
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [qPrompt, setQPrompt] = useState('');
  const [qPoints, setQPoints] = useState(1);
  const [qImageUrl, setQImageUrl] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIds, setCorrectIds] = useState<string[]>(['A']);
  const [acceptedShortText, setAcceptedShortText] = useState('');
  const [autoGradeShort, setAutoGradeShort] = useState(true);

  // Teacher Submission Status Modal (Submitted vs Not Submitted)
  const [trackingAssignment, setTrackingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [teacherTrialAssignment, setTeacherTrialAssignment] = useState<Assignment | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (gradeFilter !== 'all' && String(a.grade) !== gradeFilter) return false;
      if (isTeacher && statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    });
  }, [assignments, gradeFilter, statusFilter, isTeacher]);

  const openCreateBuilder = () => {
    setEditingAssignment(null);
    setTitle('');
    setGrade(3);
    setClassIds(classes.filter((c) => c.grade === 3).map((c) => c.id));
    setInstructions('Các em đọc kỹ đề bài, kiểm tra lại đáp án trước khi nhấn Nộp bài.');
    setDurationMinutes(settings.defaultDurationMinutes);
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setMaxAttempts(2);
    setAllowViewScore(true);
    setDraftQuestions([]);
    setBuilderError(null);
    setBuilderOpen(true);
  };

  const openEditBuilder = (asg: Assignment) => {
    setEditingAssignment(asg);
    setTitle(asg.title);
    setGrade(asg.grade);
    setClassIds(asg.classIds);
    setInstructions(asg.instructions);
    setDurationMinutes(asg.durationMinutes);
    setDueDate(asg.dueDate.slice(0, 10));
    setMaxAttempts(asg.maxAttempts);
    setAllowViewScore(asg.allowViewScore);
    setDraftQuestions(asg.questions);
    setBuilderError(null);
    setBuilderOpen(true);
  };

  const handleAddInlineQuestion = () => {
    if (!qPrompt.trim()) return;
    const options =
      qType === 'true_false'
        ? [
            { id: 'TRUE', text: 'Đúng' },
            { id: 'FALSE', text: 'Sai' },
          ]
        : qType === 'single_choice' || qType === 'multiple_choice'
          ? [
              { id: 'A', text: optA || 'Đáp án A' },
              { id: 'B', text: optB || 'Đáp án B' },
              ...(optC ? [{ id: 'C', text: optC }] : []),
              ...(optD ? [{ id: 'D', text: optD }] : []),
            ]
          : [];

    const newQ: Question = {
      id: `q-inline-${Date.now()}`,
      type: qType,
      grade,
      topic: title || 'Bài tập trực tuyến',
      difficulty: 'thong_hieu',
      prompt: qPrompt.trim(),
      imageUrl: qImageUrl.trim() || undefined,
      options,
      correctOptionIds:
        qType === 'short_answer' || qType === 'essay'
          ? []
          : qType === 'true_false'
            ? [correctIds[0] === 'FALSE' ? 'FALSE' : 'TRUE']
            : correctIds,
      acceptedAnswers:
        qType === 'short_answer'
          ? acceptedShortText
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      autoGradeShortAnswer: qType === 'short_answer' ? autoGradeShort : false,
      points: Number(qPoints) || 1,
      createdAt: new Date().toISOString(),
    };

    setDraftQuestions((prev) => [...prev, newQ]);
    setQPrompt('');
    setQImageUrl('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectIds(['A']);
    setAcceptedShortText('');
    setShowInlineQForm(false);
  };

  const handleSaveAssignment = async (targetStatus: 'draft' | 'published') => {
    setBuilderError(null);
    if (!title.trim()) {
      setBuilderError('Vui lòng nhập tên bài tập.');
      return;
    }
    if (targetStatus === 'published' && draftQuestions.length === 0) {
      setBuilderError('Cần thêm ít nhất 1 câu hỏi trước khi giao bài cho lớp.');
      return;
    }
    if (targetStatus === 'published' && classIds.length === 0) {
      setBuilderError('Vui lòng chọn ít nhất 1 lớp học nhận bài tập.');
      return;
    }

    setSaving(true);
    const payload: Partial<Assignment> = {
      title: title.trim(),
      grade,
      classIds,
      instructions,
      questions: draftQuestions,
      durationMinutes: Number(durationMinutes) || 15,
      dueDate: dueDate ? new Date(`${dueDate}T17:00:00.000Z`).toISOString() : new Date().toISOString(),
      maxAttempts: Number(maxAttempts) || 1,
      status: targetStatus,
      allowViewScore,
    };

    try {
      if (editingAssignment) {
        await onUpdateAssignment(editingAssignment.id, payload);
      } else {
        await onCreateAssignment(payload);
      }
      setBuilderOpen(false);
    } catch (err) {
      setBuilderError(err instanceof Error ? err.message : 'Không thể lưu bài tập.');
    } finally {
      setSaving(false);
    }
  };

  // Active Quiz Taking Screen
  if (activeQuizAssignment) {
    const trialStu = previewStudentId
      ? students.find((s) => s.id === previewStudentId)
      : undefined;

    return (
      <StudentQuizPlayer
        assignment={activeQuizAssignment}
        studentName={trialStu ? trialStu.fullName : currentUser.fullName}
        classNameLabel={trialStu ? trialStu.className : currentUser.className || ''}
        allowViewScoreGlobal={settings.allowStudentsViewResults}
        previewStudentId={previewStudentId || undefined}
        onSubmitQuiz={onSubmitQuiz}
        onExit={() => {
          setActiveQuizAssignment(null);
          setPreviewStudentId('');
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#0066CC]" />
            <span>
              {isTeacher ? 'GIAO BÀI TẬP TRỰC TUYẾN' : `BÀI TẬP ĐƯỢC GIAO - LỚP ${currentUser.className}`}
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isTeacher
              ? 'Tạo bài tập đa dạng (trắc nghiệm 1 hoặc nhiều đáp án, đúng/sai, điền khuyết, tự luận, câu hỏi có hình), lưu nháp hoặc giao cho nhiều lớp.'
              : 'Chọn bài tập được giao, nhấn "Bắt đầu làm bài" và nộp bài đúng thời gian quy định.'}
          </p>
        </div>

        {isTeacher && (
          <button
            type="button"
            onClick={openCreateBuilder}
            className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo & Giao bài tập mới</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {isTeacher && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#EAF5FF] p-1 rounded-xl">
            {(['all', '3', '4', '5'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer ${
                  gradeFilter === g ? 'bg-[#0066CC] text-white' : 'text-[#003B8E]'
                }`}
              >
                {g === 'all' ? 'Tất cả khối' : `Khối ${g}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'published', 'draft'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  statusFilter === st ? 'bg-white text-[#003B8E] shadow-xs' : 'text-slate-600'
                }`}
              >
                {st === 'all' ? 'Tất cả trạng thái' : st === 'published' ? 'Đã giao' : 'Bản nháp'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-sky-100 text-slate-600">
          Chưa có bài tập nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAssignments.map((asg) => {
            const assignedClasses = classes
              .filter((c) => asg.classIds.includes(c.id))
              .map((c) => `Lớp ${c.name}`)
              .join(', ');

            const asgSubs = submissions.filter((s) => s.assignmentId === asg.id);
            const myAttempts = !isTeacher ? asgSubs.length : 0;
            const canStudentStart = !isTeacher && myAttempts < asg.maxAttempts;

            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Tin học lớp {asg.grade} · {assignedClasses || 'Chưa chọn lớp'}
                    </span>
                    <span
                      className={
                        asg.status === 'published'
                          ? 'text-emerald-700 font-bold'
                          : 'text-amber-700 font-bold'
                      }
                    >
                      {asg.status === 'published' ? 'Đang mở giao bài' : 'Bản nháp'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#003B8E]">{asg.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{asg.instructions}</p>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#EAF5FF] text-[#003B8E]">
                      Số câu hỏi: <strong className="tabular-nums">{asg.questions.length} câu</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FFF4E5] text-amber-900">
                      Thời gian: <strong className="tabular-nums">{asg.durationMinutes} phút</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#E8F5E9] text-emerald-900">
                      Số lần làm: <strong className="tabular-nums">Tối đa {asg.maxAttempts} lần</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1 flex items-center justify-between">
                    <span className="tabular-nums">
                      Hạn nộp: {new Date(asg.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                    {isTeacher ? (
                      <span className="font-bold text-[#0066CC] tabular-nums">
                        Đã nhận: {asgSubs.length} bài nộp
                      </span>
                    ) : (
                      <span className="font-bold text-[#0066CC] tabular-nums">
                        Em đã làm: {myAttempts}/{asg.maxAttempts} lần
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {isTeacher ? (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTrackingAssignment(asg)}
                          className="px-3 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>DS Đã nộp / Chưa nộp</span>
                        </button>
                        {asg.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => {
                              const eligibleStudents = students.filter((s) =>
                                asg.classIds.includes(s.classId)
                              );
                              setPreviewStudentId(eligibleStudents[0]?.id || '');
                              setTeacherTrialAssignment(asg);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Làm thử</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {asg.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => onUpdateAssignment(asg.id, { status: 'published' })}
                            className="px-2.5 py-1.5 rounded-lg bg-[#22C55E] text-white font-bold text-xs cursor-pointer"
                          >
                            Giao bài ngay
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditBuilder(asg)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAssignment(asg)}
                          className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      {asgSubs.length > 0 && settings.allowStudentsViewResults && asg.allowViewScore ? (
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">
                          Điểm cao nhất:{' '}
                          {Math.max(...asgSubs.map((s) => s.score10))
                            .toFixed(1)
                            .replace('.', ',')}{' '}
                          / 10
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {asgSubs.length > 0 ? 'Đã nộp bài' : 'Chưa làm bài'}
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={!canStudentStart}
                        onClick={() => setActiveQuizAssignment(asg)}
                        className={`px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer ${
                          canStudentStart
                            ? 'bg-[#0066CC] hover:bg-[#003B8E] text-white'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        <span>
                          {canStudentStart
                            ? myAttempts > 0
                              ? 'Làm lại bài tập'
                              : 'Bắt đầu làm bài'
                            : 'Đã hết lượt làm bài'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher Trial Modal (Choose student in class to simulate full flow) */}
      {teacherTrialAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#003B8E]">
              Chạy thử luồng Học sinh làm bài: {teacherTrialAssignment.title}
            </h3>
            <p className="text-sm text-slate-600">
              Chọn một học sinh thuộc lớp được giao để kiểm tra giao diện làm bài, đồng hồ đếm ngược và chấm điểm tự động:
            </p>
            <select
              value={previewStudentId}
              onChange={(e) => setPreviewStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {students
                .filter((s) => teacherTrialAssignment.classIds.includes(s.classId))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentCode} - Lớp {s.className})
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTeacherTrialAssignment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={!previewStudentId}
                onClick={() => {
                  const target = teacherTrialAssignment;
                  setTeacherTrialAssignment(null);
                  setActiveQuizAssignment(target);
                }}
                className="px-5 py-2 rounded-xl bg-[#0066CC] text-white text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                Bắt đầu làm bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Tracking Modal: Submitted vs Not Submitted Students */}
      {trackingAssignment && (() => {
        const targetStudents = students.filter((s) =>
          trackingAssignment.classIds.includes(s.classId)
        );
        const asgSubs = submissions.filter((s) => s.assignmentId === trackingAssignment.id);
        const submittedStudents = targetStudents.filter((stu) =>
          asgSubs.some((sub) => sub.studentId === stu.id)
        );
        const unsubmittedStudents = targetStudents.filter(
          (stu) => !asgSubs.some((sub) => sub.studentId === stu.id)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
              <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Tiến độ nộp bài: {trackingAssignment.title}
                  </h3>
                  <p className="text-xs text-sky-200">
                    Đã nộp: {submittedStudents.length}/{targetStudents.length} học sinh · Chưa nộp:{' '}
                    {unsubmittedStudents.length} học sinh
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackingAssignment(null)}
                  className="p-1.5 hover:bg-white/15 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Submitted Column */}
                <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
                  <h4 className="font-bold text-emerald-800 text-base mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã nộp bài ({submittedStudents.length})</span>
                  </h4>
                  {submittedStudents.length === 0 ? (
                    <p className="text-xs text-slate-500">Chưa có học sinh nào nộp bài.</p>
                  ) : (
                    <div className="space-y-2">
                      {submittedStudents.map((stu) => {
                        const latestSub = asgSubs.find((s) => s.studentId === stu.id)!;
                        return (
                          <div
                            key={stu.id}
                            className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">
                                {stu.fullName} (Lớp {stu.className})
                              </div>
                              <div className="text-slate-500 tabular-nums">
                                Nộp: {new Date(latestSub.submittedAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm text-emerald-700 tabular-nums">
                                {latestSub.score10.toFixed(1).replace('.', ',')}đ
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {latestSub.gradingStatus === 'pending_essay' ? 'Chờ chấm TL' : 'Đã chấm'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Unsubmitted Column */}
                <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30">
                  <h4 className="font-bold text-amber-900 text-base mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Chưa nộp bài ({unsubmittedStudents.length})</span>
                  </h4>
                  {unsubmittedStudents.length === 0 ? (
                    <p className="text-xs text-emerald-700 font-bold">
                      100% học sinh được giao đã hoàn thành bài tập!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {unsubmittedStudents.map((stu) => (
                        <div
                          key={stu.id}
                          className="bg-white p-2.5 rounded-lg border border-amber-100 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-800">{stu.fullName}</span>
                          <span className="text-slate-500">
                            {stu.studentCode} · Lớp {stu.className}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create / Edit Assignment Builder Modal */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingAssignment ? `Chỉnh sửa bài tập: ${editingAssignment.title}` : 'Tạo và Giao bài tập trực tuyến'}
              </h3>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {builderError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
                  {builderError}
                </div>
              )}

              {/* Basic Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài tập *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Máy tính và em - Kiểm tra 15 phút"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp *</label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setGrade(g);
                      setClassIds(classes.filter((c) => c.grade === g).map((c) => c.id));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>

              {/* Assign to one or multiple classes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Giao cho lớp (Chọn một hoặc nhiều lớp) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const checked = classIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() =>
                          setClassIds((prev) =>
                            prev.includes(cls.id)
                              ? prev.filter((x) => x !== cls.id)
                              : [...prev, cls.id]
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                          checked
                            ? 'bg-[#0066CC] text-white border-[#0066CC]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Lớp {cls.name} (Khối {cls.grade})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian làm bài (Phút)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hạn nộp bài</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số lần được làm
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowViewScore}
                      onChange={(e) => setAllowViewScore(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Cho HS xem điểm ngay</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung hướng dẫn học sinh
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              {/* Questions Section */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-base text-[#003B8E]">
                    Danh sách câu hỏi trong bài ({draftQuestions.length} câu)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineQForm((v) => !v)}
                      className="px-3 py-1.5 rounded-xl bg-[#0066CC] text-white text-xs font-bold cursor-pointer"
                    >
                      + Soạn câu hỏi mới
                    </button>
                  </div>
                </div>

                {/* Quick Pick from Question Bank */}
                <div className="p-3 rounded-xl bg-[#EAF5FF]/60 border border-sky-200">
                  <div className="text-xs font-bold text-[#003B8E] mb-1.5">
                    Chọn nhanh câu hỏi có sẵn từ Ngân hàng câu hỏi Khối {grade}:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {questionBank
                      .filter((qb) => qb.grade === grade)
                      .map((qb) => {
                        const alreadyIn = draftQuestions.some((d) => d.id === qb.id);
                        return (
                          <div
                            key={qb.id}
                            className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg text-xs border border-sky-100"
                          >
                            <span className="truncate pr-2">
                              <strong>[{qb.topic}]</strong> {qb.prompt}
                            </span>
                            <button
                              type="button"
                              disabled={alreadyIn}
                              onClick={() => setDraftQuestions((prev) => [...prev, qb])}
                              className={`px-2.5 py-1 rounded-md font-bold shrink-0 cursor-pointer ${
                                alreadyIn
                                  ? 'bg-slate-100 text-slate-400'
                                  : 'bg-[#22C55E] text-white hover:bg-emerald-600'
                              }`}
                            >
                              {alreadyIn ? 'Đã thêm' : '+ Thêm vào bài'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Inline New Question Form */}
                {showInlineQForm && (
                  <div className="p-4 rounded-xl border-2 border-[#2196F3] bg-[#F8FBFF] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Dạng câu hỏi
                        </label>
                        <select
                          value={qType}
                          onChange={(e) => {
                            const nextT = e.target.value as QuestionType;
                            setQType(nextT);
                            setCorrectIds(nextT === 'true_false' ? ['TRUE'] : ['A']);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          <option value="single_choice">Trắc nghiệm 1 đáp án đúng</option>
                          <option value="multiple_choice">Trắc nghiệm nhiều đáp án đúng</option>
                          <option value="true_false">Câu hỏi Đúng / Sai</option>
                          <option value="short_answer">Điền đáp án ngắn</option>
                          <option value="essay">Câu hỏi Tự luận (Giáo viên chấm)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={qPoints}
                          onChange={(e) => setQPoints(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nội dung câu hỏi *
                      </label>
                      <input
                        type="text"
                        value={qPrompt}
                        onChange={(e) => setQPrompt(e.target.value)}
                        placeholder="Nhập nội dung câu hỏi..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Hình ảnh minh họa (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={qImageUrl}
                        onChange={(e) => setQImageUrl(e.target.value)}
                        placeholder="Dán URL hình ảnh minh họa nếu có..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    {(qType === 'single_choice' || qType === 'multiple_choice') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'A', val: optA, set: setOptA },
                          { id: 'B', val: optB, set: setOptB },
                          { id: 'C', val: optC, set: setOptC },
                          { id: 'D', val: optD, set: setOptD },
                        ].map((item) => {
                          const isChecked = correctIds.includes(item.id);
                          return (
                            <div key={item.id} className="flex items-center gap-2">
                              <input
                                type={qType === 'single_choice' ? 'radio' : 'checkbox'}
                                name="inlineCorrectOpt"
                                checked={isChecked}
                                onChange={() => {
                                  if (qType === 'single_choice') {
                                    setCorrectIds([item.id]);
                                  } else {
                                    setCorrectIds((prev) =>
                                      prev.includes(item.id)
                                        ? prev.filter((x) => x !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }
                                }}
                              />
                              <input
                                type="text"
                                value={item.val}
                                onChange={(e) => item.set(e.target.value)}
                                placeholder={`Phương án ${item.id}`}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {qType === 'true_false' && (
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span>Đáp án đúng:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={correctIds[0] === 'TRUE'}
                            onChange={() => setCorrectIds(['TRUE'])}
                          />
                          <span>Đúng</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={correctIds[0] === 'FALSE'}
                            onChange={() => setCorrectIds(['FALSE'])}
                          />
                          <span>Sai</span>
                        </label>
                      </div>
                    )}

                    {qType === 'short_answer' && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold">
                          <input
                            type="checkbox"
                            checked={autoGradeShort}
                            onChange={(e) => setAutoGradeShort(e.target.checked)}
                          />
                          <span>Tự động chấm theo quy tắc khớp đáp án mẫu</span>
                        </label>
                        {autoGradeShort && (
                          <input
                            type="text"
                            value={acceptedShortText}
                            onChange={(e) => setAcceptedShortText(e.target.value)}
                            placeholder="Các đáp án chấp nhận, cách nhau bởi dấu | (VD: S | Ctrl + S)"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInlineQForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleAddInlineQuestion}
                        className="px-4 py-1.5 rounded-lg bg-[#0066CC] text-white text-xs font-bold cursor-pointer"
                      >
                        Lưu câu hỏi vào đề
                      </button>
                    </div>
                  </div>
                )}

                {/* Draft Questions Preview */}
                <div className="space-y-2">
                  {draftQuestions.map((dq, idx) => (
                    <div
                      key={`${dq.id}-${idx}`}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#003B8E]">
                          Câu {idx + 1} ({dq.points}đ):
                        </span>{' '}
                        <span>{dq.prompt}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftQuestions((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-red-600 font-bold shrink-0 cursor-pointer"
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveAssignment('draft')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold cursor-pointer"
                >
                  Lưu bản nháp
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveAssignment('published')}
                  className="px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Xuất bản & Giao bài cho lớp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Assignment Confirmation */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">Xác nhận xóa bài tập</h3>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa bài tập <strong>{deletingAssignment.title}</strong> không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAssignment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteAssignment(deletingAssignment.id);
                  setDeletingAssignment(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer"
              >
                Xóa bài tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
