import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  MessageSquare,
  X,
} from 'lucide-react';
import type {
  Assignment,
  ClassRoom,
  Student,
  Submission,
  SystemSettings,
  UserProfile,
} from '../types/lms';
import { exportSubmissionsToExcel } from '../utils/excel';

interface ResultsViewProps {
  currentUser: UserProfile;
  settings: SystemSettings;
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onGradeSubmission: (
    submissionId: string,
    payload: {
      questionUpdates: Array<{ questionId: string; earnedPoints: number; teacherComment?: string }>;
      teacherFeedback: string;
    }
  ) => Promise<void>;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  currentUser,
  settings,
  classes,
  students,
  assignments,
  submissions,
  onGradeSubmission,
}) => {
  const isTeacher = currentUser.role === 'teacher';

  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [studentQuery, setStudentQuery] = useState<string>('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Teacher Grading / Student Review Modal
  const [inspectingSub, setInspectingSub] = useState<Submission | null>(null);
  const [editPointsMap, setEditPointsMap] = useState<Record<string, number>>({});
  const [editCommentMap, setEditCommentMap] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (gradeFilter !== 'all' && String(s.grade) !== gradeFilter) return false;
      if (classFilter !== 'all' && s.classId !== classFilter) return false;
      if (assignmentFilter !== 'all' && s.assignmentId !== assignmentFilter) return false;
      if (studentQuery.trim()) {
        const q = studentQuery.trim().toLowerCase();
        if (
          !s.studentName.toLowerCase().includes(q) &&
          !s.studentCode.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (fromDate) {
        const startMs = new Date(`${fromDate}T00:00:00`).getTime();
        if (new Date(s.submittedAt).getTime() < startMs) return false;
      }
      if (toDate) {
        const endMs = new Date(`${toDate}T23:59:59`).getTime();
        if (new Date(s.submittedAt).getTime() > endMs) return false;
      }
      return true;
    });
  }, [submissions, gradeFilter, classFilter, assignmentFilter, studentQuery, fromDate, toDate]);

  const chartByClass = useMemo(() => {
    return classes.map((cls) => {
      const clsSubs = filteredSubmissions.filter((s) => s.classId === cls.id && s.score10 >= 0);
      const avg =
        clsSubs.length > 0
          ? Math.round((clsSubs.reduce((sum, x) => sum + x.score10, 0) / clsSubs.length) * 10) / 10
          : 0;
      return {
        name: `Lớp ${cls.name}`,
        avgScore: avg,
        count: clsSubs.length,
      };
    });
  }, [classes, filteredSubmissions]);

  const openInspectModal = (sub: Submission) => {
    setInspectingSub(sub);
    const pts: Record<string, number> = {};
    const cmts: Record<string, string> = {};
    sub.evaluations.forEach((ev) => {
      pts[ev.questionId] = ev.earnedPoints;
      cmts[ev.questionId] = ev.teacherComment || '';
    });
    setEditPointsMap(pts);
    setEditCommentMap(cmts);
    setOverallFeedback(sub.teacherFeedback || '');
  };

  const handleSaveGrading = async () => {
    if (!inspectingSub) return;
    setSavingGrade(true);
    try {
      const updates = Object.keys(editPointsMap).map((qId) => ({
        questionId: qId,
        earnedPoints: Number(editPointsMap[qId]) || 0,
        teacherComment: editCommentMap[qId] || undefined,
      }));
      await onGradeSubmission(inspectingSub.id, {
        questionUpdates: updates,
        teacherFeedback: overallFeedback,
      });
      setInspectingSub(null);
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0066CC]" />
            <span>{isTeacher ? 'KẾT QUẢ HỌC TẬP & CHẤM BÀI' : 'KẾT QUẢ HỌC TẬP CỦA EM'}</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isTeacher
              ? 'Xem bảng điểm chi tiết, chấm câu hỏi tự luận, ghi nhận xét cho học sinh và xuất báo cáo Excel.'
              : 'Xem lại lịch sử nộp bài, điểm số và nhận xét của cô giáo dành riêng cho em.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportSubmissionsToExcel(filteredSubmissions)}
          className="px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Filters */}
      {isTeacher && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Khối lớp</label>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value as 'all' | '3' | '4' | '5');
                setClassFilter('all');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="all">Tất cả khối</option>
              <option value="3">Khối 3</option>
              <option value="4">Khối 4</option>
              <option value="5">Khối 5</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Lớp học</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="all">Tất cả lớp</option>
              {classes
                .filter((c) => gradeFilter === 'all' || String(c.grade) === gradeFilter)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Học sinh</label>
            <input
              type="text"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Tên hoặc mã HS..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Bài tập</label>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="all">Tất cả bài tập</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Class Average Score Chart for Teacher */}
      {isTeacher && chartByClass.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
          <h3 className="text-base font-bold text-[#003B8E] mb-3">
            Biểu đồ thống kê Điểm trung bình theo Lớp (Thang điểm 10)
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByClass} margin={{ top: 18, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="avgScore" name="Điểm trung bình" fill="#0066CC" radius={[6, 6, 0, 0]} barSize={38}>
                  <LabelList dataKey="avgScore" position="top" fill="#003B8E" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-base">
            Chưa có bài nộp nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF5FF] text-[#003B8E] text-sm border-b border-sky-200">
                  <th className="py-3 px-3">STT</th>
                  <th className="py-3 px-3">Mã HS</th>
                  <th className="py-3 px-3">Họ và tên</th>
                  <th className="py-3 px-3">Lớp</th>
                  <th className="py-3 px-3">Tên bài tập</th>
                  <th className="py-3 px-3">Số câu đúng</th>
                  <th className="py-3 px-3">Tổng số câu</th>
                  <th className="py-3 px-3">Điểm số</th>
                  <th className="py-3 px-3">Thời gian nộp</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSubmissions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-sky-50/40">
                    <td className="py-2.5 px-3 tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-[#0066CC]">{sub.studentCode}</td>
                    <td className="py-2.5 px-3 font-bold">{sub.studentName}</td>
                    <td className="py-2.5 px-3">Lớp {sub.className}</td>
                    <td className="py-2.5 px-3">
                      {sub.assignmentTitle}{' '}
                      <span className="text-xs text-slate-400">(Lần {sub.attemptNumber})</span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums font-bold">
                      {sub.score10 >= 0 ? sub.correctCount : '-'}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">{sub.totalQuestions}</td>
                    <td className="py-2.5 px-3 font-bold text-base text-emerald-700 tabular-nums">
                      {sub.score10 >= 0 ? sub.score10.toFixed(1).replace('.', ',') : 'Đang ẩn'}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-xs">
                      {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3">
                      {sub.gradingStatus === 'graded' ? (
                        <span className="text-emerald-700 font-bold text-xs">Đã hoàn thành</span>
                      ) : (
                        <span className="text-amber-700 font-bold text-xs">Chờ chấm tự luận</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        disabled={!isTeacher && !settings.allowStudentsViewResults}
                        onClick={() => openInspectModal(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF5FF] hover:bg-sky-200 text-[#003B8E] font-bold text-xs cursor-pointer disabled:opacity-40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isTeacher ? 'Xem & Chấm bài' : 'Xem bài làm'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect & Teacher Grading Modal */}
      {inspectingSub && (() => {
        const refAsg = assignments.find((a) => a.id === inspectingSub.assignmentId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    Chi tiết bài làm: {inspectingSub.studentName} (Lớp {inspectingSub.className})
                  </h3>
                  <p className="text-xs text-sky-200">
                    Bài tập: {inspectingSub.assignmentTitle} · Điểm hiện tại:{' '}
                    {inspectingSub.score10 >= 0
                      ? `${inspectingSub.score10.toFixed(1).replace('.', ',')}/10`
                      : 'Đang ẩn'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingSub(null)}
                  className="p-1.5 hover:bg-white/15 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {inspectingSub.evaluations.map((ev, idx) => {
                  const q = refAsg?.questions.find((item) => item.id === ev.questionId);
                  const ans = inspectingSub.answers.find((a) => a.questionId === ev.questionId);

                  return (
                    <div
                      key={ev.questionId}
                      className="p-4 rounded-xl border border-slate-200 bg-[#F8FBFF] space-y-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-[#003B8E]">
                          Câu {idx + 1}: {q?.prompt || `Câu hỏi #${idx + 1}`}
                        </div>
                        <span className="text-xs font-bold text-slate-600 shrink-0 tabular-nums">
                          Tối đa: {ev.maxPoints}đ
                        </span>
                      </div>

                      <div className="text-slate-800">
                        Trả lời của học sinh:{' '}
                        <strong>
                          {ans?.textAnswer
                            ? ans.textAnswer
                            : (ans?.selectedOptionIds || []).join(', ') || '(Bỏ trống)'}
                        </strong>
                      </div>

                      {q && q.correctOptionIds.length > 0 && (
                        <div className="text-xs text-emerald-700">
                          Đáp án đúng: <strong>{q.correctOptionIds.join(', ')}</strong>
                        </div>
                      )}

                      {isTeacher ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-0.5">
                              Điểm chấm (0 - {ev.maxPoints})
                            </label>
                            <input
                              type="number"
                              step="0.25"
                              min={0}
                              max={ev.maxPoints}
                              value={editPointsMap[ev.questionId] ?? ev.earnedPoints}
                              onChange={(e) =>
                                setEditPointsMap((prev) => ({
                                  ...prev,
                                  [ev.questionId]: Number(e.target.value),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-0.5">
                              Nhận xét riêng cho câu này
                            </label>
                            <input
                              type="text"
                              value={editCommentMap[ev.questionId] || ''}
                              onChange={(e) =>
                                setEditCommentMap((prev) => ({
                                  ...prev,
                                  [ev.questionId]: e.target.value,
                                }))
                              }
                              placeholder="Nhận xét câu trả lời..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        ev.teacherComment && (
                          <div className="text-xs text-[#0066CC] italic">
                            Nhận xét của cô giáo: {ev.teacherComment}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}

                {/* Overall Teacher Feedback */}
                <div className="p-4 rounded-xl bg-[#EAF5FF] border border-sky-200 space-y-2">
                  <label className="block text-sm font-bold text-[#003B8E] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#0066CC]" />
                    <span>Nhận xét chung của giáo viên</span>
                  </label>
                  {isTeacher ? (
                    <textarea
                      rows={2}
                      value={overallFeedback}
                      onChange={(e) => setOverallFeedback(e.target.value)}
                      placeholder="Nhập lời khen hoặc góp ý cho học sinh..."
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white text-sm"
                    />
                  ) : (
                    <p className="text-sm text-slate-800">
                      {inspectingSub.teacherFeedback || 'Cô giáo chưa thêm nhận xét chung.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingSub(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
                >
                  Đóng
                </button>
                {isTeacher && (
                  <button
                    type="button"
                    disabled={savingGrade}
                    onClick={handleSaveGrading}
                    className="px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingGrade ? 'Đang cập nhật điểm...' : 'Lưu điểm & Nhận xét'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
