import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, BellRing, Filter, PieChart } from 'lucide-react';
import type { Assignment, ClassRoom, ModuleId, Student, Submission } from '../types/lms';

interface OverviewViewProps {
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onSendReminder: (classId: string, assignmentTitle: string) => Promise<void>;
  onNavigate: (module: ModuleId) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  onSendReminder,
  onNavigate,
}) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d'>('all');
  const [remindingKey, setRemindingKey] = useState<string | null>(null);

  const publishedAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'published'),
    [assignments]
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (gradeFilter !== 'all' && String(c.grade) !== gradeFilter) return false;
      if (classFilter !== 'all' && c.id !== classFilter) return false;
      return true;
    });
  }, [classes, gradeFilter, classFilter]);

  const filteredStudents = useMemo(() => {
    const validClassIds = new Set(filteredClasses.map((c) => c.id));
    return students.filter((s) => validClassIds.has(s.classId));
  }, [students, filteredClasses]);

  const filteredAssignments = useMemo(() => {
    const validClassIds = new Set(filteredClasses.map((c) => c.id));
    return publishedAssignments.filter((a) => {
      if (assignmentFilter !== 'all' && a.id !== assignmentFilter) return false;
      return a.classIds.some((cid) => validClassIds.has(cid));
    });
  }, [publishedAssignments, filteredClasses, assignmentFilter]);

  const filteredSubmissions = useMemo(() => {
    const now = Date.now();
    const validClassIds = new Set(filteredClasses.map((c) => c.id));
    return submissions.filter((s) => {
      if (!validClassIds.has(s.classId)) return false;
      if (assignmentFilter !== 'all' && s.assignmentId !== assignmentFilter) return false;
      if (timeFilter === '7d' && now - new Date(s.submittedAt).getTime() > 7 * 86400000) return false;
      if (timeFilter === '30d' && now - new Date(s.submittedAt).getTime() > 30 * 86400000) return false;
      return true;
    });
  }, [submissions, filteredClasses, assignmentFilter, timeFilter]);

  const gradeCounts = useMemo(() => {
    return [3, 4, 5].map((g) => ({
      grade: `Khối ${g}`,
      students: students.filter((s) => s.grade === g).length,
      classes: classes.filter((c) => c.grade === g).length,
    }));
  }, [students, classes]);

  const classComparisonData = useMemo(() => {
    return filteredClasses.map((cls) => {
      const clsSubs = filteredSubmissions.filter((s) => s.classId === cls.id);
      const avg =
        clsSubs.length > 0
          ? Math.round((clsSubs.reduce((sum, x) => sum + x.score10, 0) / clsSubs.length) * 10) / 10
          : 0;
      return {
        name: `Lớp ${cls.name}`,
        submissions: clsSubs.length,
        avgScore: avg,
      };
    });
  }, [filteredClasses, filteredSubmissions]);

  const uncompletedList = useMemo(() => {
    const missing: Array<{
      student: Student;
      assignment: Assignment;
    }> = [];

    filteredAssignments.forEach((asg) => {
      asg.classIds.forEach((cid) => {
        const clsStudents = filteredStudents.filter((s) => s.classId === cid && s.status === 'active');
        clsStudents.forEach((stu) => {
          const done = submissions.some(
            (sub) => sub.assignmentId === asg.id && sub.studentId === stu.id
          );
          if (!done) {
            missing.push({ student: stu, assignment: asg });
          }
        });
      });
    });

    return missing;
  }, [filteredAssignments, filteredStudents, submissions]);

  const totalExpected = useMemo(() => {
    let count = 0;
    filteredAssignments.forEach((asg) => {
      asg.classIds.forEach((cid) => {
        count += filteredStudents.filter((s) => s.classId === cid && s.status === 'active').length;
      });
    });
    return count;
  }, [filteredAssignments, filteredStudents]);

  const completedPairs = Math.max(0, totalExpected - uncompletedList.length);
  const completionPct = totalExpected > 0 ? Math.round((completedPairs / totalExpected) * 100) : 0;
  const overallAvg =
    filteredSubmissions.length > 0
      ? (
          filteredSubmissions.reduce((acc, s) => acc + s.score10, 0) / filteredSubmissions.length
        )
          .toFixed(1)
          .replace('.', ',')
      : '0,0';

  const handleRemind = async (classId: string, assignmentTitle: string) => {
    const key = `${classId}-${assignmentTitle}`;
    setRemindingKey(key);
    try {
      await onSendReminder(classId, assignmentTitle);
    } finally {
      setRemindingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
              <PieChart className="w-6 h-6 text-[#0066CC]" />
              <span>TỔNG QUAN THỐNG KÊ HỌC TẬP CHI TIẾT</span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Theo dõi sĩ số theo khối, tiến độ nộp bài, điểm trung bình từng lớp và danh sách học sinh chưa hoàn thành bài.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              <Filter className="w-3.5 h-3.5 inline mr-1" />
              Lọc theo Khối lớp
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value as 'all' | '3' | '4' | '5');
                setClassFilter('all');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="all">Tất cả khối (3, 4, 5)</option>
              <option value="3">Khối 3</option>
              <option value="4">Khối 4</option>
              <option value="5">Khối 5</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Lọc theo Lớp học</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="all">Tất cả lớp đang chọn</option>
              {classes
                .filter((c) => gradeFilter === 'all' || String(c.grade) === gradeFilter)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} (Khối {c.grade})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Lọc theo Bài tập</label>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="all">Tất cả bài tập đã giao</option>
              {publishedAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} (Khối {a.grade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Khoảng thời gian nộp</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'all' | '7d' | '30d')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="all">Toàn bộ năm học</option>
              <option value="7d">7 ngày gần nhất</option>
              <option value="30d">30 ngày gần nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 Summary Metric Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs text-slate-500">Số lớp đang lọc</div>
          <div className="text-2xl font-bold text-[#003B8E] mt-1 tabular-nums">{filteredClasses.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs text-slate-500">Tổng học sinh</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{filteredStudents.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs text-slate-500">Bài tập đã giao</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{filteredAssignments.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs text-slate-500">Tổng lượt nộp bài</div>
          <div className="text-2xl font-bold text-[#0066CC] mt-1 tabular-nums">{filteredSubmissions.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs text-slate-500">Tỷ lệ hoàn thành</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{completionPct}%</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs text-slate-500">Điểm trung bình</div>
          <div className="text-2xl font-bold text-purple-700 mt-1 tabular-nums">{overallAvg}</div>
        </div>
      </div>

      {/* Charts: Grade Student Breakdown & Score Comparison by Class */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs">
          <h3 className="text-lg font-bold text-[#003B8E] mb-3">
            Tổng số học sinh và lớp học theo Khối (3, 4, 5)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Số học sinh" fill="#0066CC" radius={[6, 6, 0, 0]} barSize={36} />
                <Bar dataKey="classes" name="Số lớp học" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs">
          <h3 className="text-lg font-bold text-[#003B8E] mb-3">
            So sánh Điểm trung bình & Số lượt nộp bài theo Lớp
          </h3>
          {classComparisonData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Không có dữ liệu lớp học khớp bộ lọc.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={classComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="submissions"
                    name="Số lượt nộp"
                    fill="#2196F3"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgScore"
                    name="Điểm TB (Thang 10)"
                    stroke="#F59E0B"
                    strokeWidth={3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Table of Students Who Haven't Completed Assigned Work */}
      <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span>DANH SÁCH HỌC SINH CHƯA HOÀN THÀNH BÀI TẬP ({uncompletedList.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('assignments')}
            className="text-sm text-[#0066CC] font-bold hover:underline cursor-pointer"
          >
            Quản lý giao bài &rarr;
          </button>
        </div>

        {uncompletedList.length === 0 ? (
          <div className="py-8 text-center text-emerald-700 font-bold text-base bg-emerald-50/60 rounded-xl">
            Tuyệt vời! Tất cả học sinh trong phạm vi lọc đã hoàn thành đầy đủ bài tập được giao.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF5FF] text-[#003B8E] text-sm border-b border-sky-200">
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã HS</th>
                  <th className="py-2.5 px-3">Họ và tên</th>
                  <th className="py-2.5 px-3">Lớp</th>
                  <th className="py-2.5 px-3">Bài tập chưa nộp</th>
                  <th className="py-2.5 px-3">Hạn nộp</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {uncompletedList.map(({ student, assignment }, idx) => {
                  const key = `${student.classId}-${assignment.title}`;
                  return (
                    <tr key={`${student.id}-${assignment.id}`} className="hover:bg-sky-50/40">
                      <td className="py-2.5 px-3 tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-[#003B8E]">{student.studentCode}</td>
                      <td className="py-2.5 px-3 font-bold">{student.fullName}</td>
                      <td className="py-2.5 px-3">Lớp {student.className}</td>
                      <td className="py-2.5 px-3">{assignment.title}</td>
                      <td className="py-2.5 px-3 tabular-nums">
                        {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          disabled={remindingKey === key}
                          onClick={() => handleRemind(student.classId, assignment.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span>{remindingKey === key ? 'Đang gửi...' : 'Gửi nhắc nhở lớp'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
