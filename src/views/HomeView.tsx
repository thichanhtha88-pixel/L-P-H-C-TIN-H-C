import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Gamepad2,
  Globe,
  PlusCircle,
  School,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import type {
  Assignment,
  ClassRoom,
  Lesson,
  ModuleId,
  NotificationItem,
  Student,
  Submission,
  SystemSettings,
  UserProfile,
} from '../types/lms';

interface HomeViewProps {
  currentUser: UserProfile;
  settings: SystemSettings;
  classes: ClassRoom[];
  students: Student[];
  lessons: Lesson[];
  assignments: Assignment[];
  submissions: Submission[];
  notifications: NotificationItem[];
  onNavigate: (module: ModuleId) => void;
  onStartAssignment?: (assignmentId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  settings,
  classes,
  students,
  lessons,
  assignments,
  submissions,
  notifications,
  onNavigate,
  onStartAssignment,
}) => {
  const isTeacher = currentUser.role === 'teacher';

  const publishedAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'published'),
    [assignments]
  );

  // Compute real live statistics from database records
  const stats = useMemo(() => {
    const gradedSubs = submissions.filter((s) => s.score10 >= 0);
    const avgScore =
      gradedSubs.length > 0
        ? gradedSubs.reduce((acc, s) => acc + s.score10, 0) / gradedSubs.length
        : 0;

    // Calculate expected student-assignment pairs vs completed unique pairs per class
    let totalExpectedPairs = 0;
    let totalCompletedPairs = 0;

    const classChartData = classes.map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id && s.status === 'active');
      const classAsgs = publishedAssignments.filter((a) => a.classIds.includes(cls.id));

      let completedInClass = 0;
      const expectedInClass = classStudents.length * classAsgs.length;

      classAsgs.forEach((asg) => {
        classStudents.forEach((stu) => {
          const done = submissions.some(
            (sub) => sub.assignmentId === asg.id && sub.studentId === stu.id
          );
          if (done) completedInClass += 1;
        });
      });

      const uncompletedInClass = Math.max(0, expectedInClass - completedInClass);
      totalExpectedPairs += expectedInClass;
      totalCompletedPairs += completedInClass;

      return {
        name: `Lớp ${cls.name}`,
        completed: completedInClass,
        uncompleted: uncompletedInClass,
      };
    });

    const completionRate =
      totalExpectedPairs > 0
        ? Math.round((totalCompletedPairs / totalExpectedPairs) * 100)
        : 0;

    return {
      classCount: classes.length,
      studentCount: students.length,
      assignedCount: publishedAssignments.length,
      completedSubmissionsCount: submissions.length,
      avgScore,
      classChartData,
      totalExpectedPairs,
      totalCompletedPairs,
      totalUncompletedPairs: Math.max(0, totalExpectedPairs - totalCompletedPairs),
      completionRate,
    };
  }, [classes, students, publishedAssignments, submissions]);

  const formatAvg = (val: number) =>
    val > 0 ? val.toFixed(1).replace('.', ',') : '0,0';

  const formatPad2 = (n: number) => (n > 0 && n < 10 ? `0${n}` : String(n));

  // Student Portal Home View
  if (!isTeacher) {
    const completedIds = new Set(submissions.map((s) => s.assignmentId));
    const pendingAssignments = publishedAssignments.filter((a) => !completedIds.has(a.id));

    return (
      <div className="space-y-5">
        {/* Student Welcome Banner */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#003B8E]">
              Chào mừng em {currentUser.fullName} (Lớp {currentUser.className})!
            </h2>
            <p className="text-slate-600 mt-1 text-base">
              Chúc em có giờ học môn Tin học thật bổ ích cùng cô {settings.teacherName}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm cursor-pointer transition-colors"
            >
              Vào làm bài tập ({pendingAssignments.length} chưa làm)
            </button>
            <button
              type="button"
              onClick={() => onNavigate('games')}
              className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm cursor-pointer transition-colors"
            >
              Trò chơi Tin học
            </button>
          </div>
        </div>

        {/* Student 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#EAF5FF] p-4 shadow-sm border border-sky-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2196F3] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#003B8E] tabular-nums">
                {formatPad2(lessons.length)}
              </div>
              <div className="text-sm text-slate-700">Bài giảng của lớp</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FFF4E5] p-4 shadow-sm border border-amber-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FF9800] text-white flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#003B8E] tabular-nums">
                {formatPad2(publishedAssignments.length)}
              </div>
              <div className="text-sm text-slate-700">Bài tập được giao</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FCE7F3] p-4 shadow-sm border border-pink-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EC4899] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#003B8E] tabular-nums">
                {formatPad2(submissions.length)}
              </div>
              <div className="text-sm text-slate-700">Lượt bài đã nộp</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F3E8FF] p-4 shadow-sm border border-purple-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#003B8E] tabular-nums">
                {settings.allowStudentsViewResults ? formatAvg(stats.avgScore) : 'Đang ẩn'}
              </div>
              <div className="text-sm text-slate-700">Điểm trung bình của em</div>
            </div>
          </div>
        </div>

        {/* Pending Assignments & Class Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-sky-100">
            <h3 className="text-lg font-bold text-[#003B8E] mb-3">
              Bài tập được giao cho Lớp {currentUser.className}
            </h3>
            {publishedAssignments.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">
                Hiện tại lớp em chưa có bài tập mới.
              </p>
            ) : (
              <div className="space-y-3">
                {publishedAssignments.map((asg) => {
                  const attemptsDone = submissions.filter((s) => s.assignmentId === asg.id).length;
                  const canStart = attemptsDone < asg.maxAttempts;
                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-xl border border-sky-100 bg-[#F8FBFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-base text-[#003B8E]">{asg.title}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Số câu: {asg.questions.length} câu · Thời gian: {asg.durationMinutes} phút · Đã làm:{' '}
                          {attemptsDone}/{asg.maxAttempts} lần
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (canStart && onStartAssignment) {
                            onStartAssignment(asg.id);
                          } else {
                            onNavigate('assignments');
                          }
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-sm cursor-pointer whitespace-nowrap ${
                          canStart
                            ? 'bg-[#0066CC] hover:bg-[#003B8E] text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {canStart ? 'Bắt đầu làm bài' : 'Xem lại kết quả'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#2196F3]" />
                <span>THÔNG BÁO LỚP EM</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('notifications')}
                className="text-sm text-[#0066CC] hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="pb-3 border-b border-slate-100 last:border-none">
                  <div className="font-bold text-sm text-[#003B8E]">{n.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEACHER DASHBOARD (Matches Reference Image 100%)
  const pieData =
    stats.totalExpectedPairs > 0
      ? [
          { name: 'Đã hoàn thành', value: stats.totalCompletedPairs, color: '#2196F3' },
          { name: 'Chưa hoàn thành', value: stats.totalUncompletedPairs, color: '#FF9800' },
        ]
      : [{ name: 'Chưa có bài giao', value: 1, color: '#CBD5E1' }];

  const isEmptyDatabase = classes.length === 0 && students.length === 0;

  return (
    <div className="space-y-5">
      {/* Transparent DEMO Notice Strip */}
      {settings.dataMode === 'demo' && (
        <div className="bg-white/90 border border-sky-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-[#003B8E] shadow-xs">
          <div>
            <span className="font-bold">Chế độ Dữ liệu mẫu (DEMO):</span> Hệ thống đang hiển thị dữ liệu giả lập cục bộ phục vụ chạy thử (tách biệt hoàn toàn với dữ liệu học sinh thật và chưa đồng bộ trực tuyến lên đám mây).
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="text-xs font-bold text-[#0066CC] hover:underline cursor-pointer whitespace-nowrap"
          >
            Chuyển chế độ / Xem hướng dẫn Firebase &rarr;
          </button>
        </div>
      )}

      {/* 5 Top Stat Cards matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigate('classes')}
          className="rounded-2xl bg-[#E8F3FF] hover:bg-[#DCEBFF] transition-colors p-4 shadow-xs border border-sky-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#2196F3] to-[#0066CC] text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#002D72] tabular-nums leading-tight">
                {formatPad2(stats.classCount)}
              </div>
              <div className="text-base text-[#003B8E]">Lớp học</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#0066CC]">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('students')}
          className="rounded-2xl bg-[#E6F8EF] hover:bg-[#D5F3E4] transition-colors p-4 shadow-xs border border-emerald-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#34D399] to-[#059669] text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#002D72] tabular-nums leading-tight">
                {formatPad2(stats.studentCount)}
              </div>
              <div className="text-base text-[#003B8E]">Học sinh</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-emerald-600">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('assignments')}
          className="rounded-2xl bg-[#FFF3E0] hover:bg-[#FFE8C8] transition-colors p-4 shadow-xs border border-amber-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#FFB74D] to-[#F57C00] text-white flex items-center justify-center shadow-sm shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#002D72] tabular-nums leading-tight">
                {formatPad2(stats.assignedCount)}
              </div>
              <div className="text-base text-[#003B8E]">Bài tập đã giao</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-amber-600">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('results')}
          className="rounded-2xl bg-[#FCE7F3] hover:bg-[#FBCFE8] transition-colors p-4 shadow-xs border border-pink-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white flex items-center justify-center shadow-sm shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#002D72] tabular-nums leading-tight">
                {formatPad2(stats.completedSubmissionsCount)}
              </div>
              <div className="text-base text-[#003B8E]">Bài đã hoàn thành</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-rose-600">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('results')}
          className="rounded-2xl bg-[#F3E8FF] hover:bg-[#E9D5FF] transition-colors p-4 shadow-xs border border-purple-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#A855F7] to-[#7E22CE] text-white flex items-center justify-center shadow-sm shrink-0">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#002D72] tabular-nums leading-tight">
                {formatAvg(stats.avgScore)}
              </div>
              <div className="text-base text-[#003B8E]">Điểm trung bình</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-purple-600">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Empty State Guidance when Workspace has no data yet */}
      {isEmptyDatabase && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-200 text-center space-y-3">
          <h3 className="text-xl font-bold text-[#003B8E]">
            Chưa có dữ liệu lớp học và học sinh trong không gian làm việc này
          </h3>
          <p className="text-slate-600 max-w-2xl mx-auto text-base">
            Bắt đầu khởi tạo dữ liệu thực tế cho Trường Tiểu học Thứ Ba bằng cách tạo các lớp khối 3, 4, 5, nhập danh sách học sinh từ Excel và giao bài tập đầu tiên.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('classes')}
              className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Bước 1: Thêm lớp học</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Bước 2: Thêm / Nhập Excel học sinh</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="px-4 py-2 rounded-xl bg-[#FF9800] hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Bước 3: Tạo & Giao bài tập</span>
            </button>
          </div>
        </div>
      )}

      {/* Middle Row: Bar Chart + Donut Chart + Latest Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Column 1: Grouped Bar Chart */}
        <div className="xl:col-span-5 bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-lg font-bold text-[#003B8E]">THỐNG KÊ KẾT QUẢ HỌC TẬP</h2>
          </div>

          {stats.classChartData.length === 0 ? (
            <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-slate-500 text-sm">
              <p>Chưa có lớp học nào để thống kê biểu đồ cột.</p>
              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="mt-2 text-[#0066CC] font-bold hover:underline cursor-pointer"
              >
                + Thêm lớp học ngay
              </button>
            </div>
          ) : (
            <div className="h-[255px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.classChartData}
                  margin={{ top: 20, right: 12, left: -16, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fill: '#1E293B', fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={32} />
                  <Bar
                    dataKey="completed"
                    name="Đã hoàn thành"
                    fill="#2196F3"
                    radius={[4, 4, 0, 0]}
                    barSize={26}
                  >
                    <LabelList dataKey="completed" position="top" fill="#0F172A" fontSize={12} />
                  </Bar>
                  <Bar
                    dataKey="uncompleted"
                    name="Chưa hoàn thành"
                    fill="#FF9800"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  >
                    <LabelList dataKey="uncompleted" position="top" fill="#0F172A" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Column 2: Completion Donut Chart */}
        <div className="xl:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-lg font-bold text-[#003B8E]">TỈ LỆ HOÀN THÀNH BÀI TẬP</h2>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 min-h-[240px]">
            <div className="relative w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-[#003B8E] tabular-nums">
                  {stats.completionRate}%
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#2196F3] shrink-0" />
                <span className="text-slate-700">
                  Đã hoàn thành:{' '}
                  <strong className="text-slate-900 tabular-nums">{stats.totalCompletedPairs}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#FF9800] shrink-0" />
                <span className="text-slate-700">
                  Chưa hoàn thành:{' '}
                  <strong className="text-slate-900 tabular-nums">{stats.totalUncompletedPairs}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-slate-400 shrink-0" />
                <span className="text-slate-700">
                  Tổng lượt giao:{' '}
                  <strong className="text-slate-900 tabular-nums">{stats.totalExpectedPairs}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Latest Notifications */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#2196F3] fill-current" />
              <h2 className="text-lg font-bold text-[#003B8E]">THÔNG BÁO MỚI</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-sm text-[#003B8E] hover:text-[#0066CC] hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm py-8">
              <p>Chưa có thông báo mới.</p>
              <button
                type="button"
                onClick={() => onNavigate('notifications')}
                className="mt-2 text-[#0066CC] font-bold hover:underline cursor-pointer"
              >
                + Tạo thông báo đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {notifications.slice(0, 4).map((noti, index) => {
                const badgeStyles = [
                  { bg: 'bg-sky-100 text-[#0066CC]', Icon: ClipboardList },
                  { bg: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
                  { bg: 'bg-blue-100 text-blue-700', Icon: FileText },
                  { bg: 'bg-rose-100 text-rose-700', Icon: Calendar },
                ][index % 4];
                const BadgeIcon = badgeStyles.Icon;

                return (
                  <div
                    key={noti.id}
                    onClick={() => onNavigate('notifications')}
                    className="flex items-start gap-3 pb-2.5 border-b border-slate-100 last:border-none cursor-pointer hover:bg-sky-50/40 rounded-lg p-1 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${badgeStyles.bg}`}
                    >
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#003B8E] leading-snug truncate">
                        {noti.title}
                      </div>
                      <div className="text-xs text-slate-700 line-clamp-1 mt-0.5">{noti.message}</div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {new Date(noti.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: 8 Quick-Access Module Cards matching reference image */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-[#0066CC]" />
          <h2 className="text-lg font-bold text-[#003B8E]">CÁC PHÂN HỆ CHỨC NĂNG</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* 1. Tổng quan */}
          <div className="rounded-2xl bg-[#E3F2FD] p-4 border border-sky-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-[#0066CC]">
              <BarChart3 className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#003B8E]">TỔNG QUAN</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Thống kê lớp học, học sinh, bài tập và kết quả học tập.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0088FF] to-[#0066CC] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 2. Quản lý lớp học */}
          <div className="rounded-2xl bg-[#E8F5E9] p-4 border border-emerald-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-emerald-600">
              <School className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#065F46]">QUẢN LÝ LỚP HỌC</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Tạo, chỉnh sửa các lớp học môn Tin học khối 3, 4, 5.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#22C55E] to-[#15803D] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 3. Quản lý học sinh */}
          <div className="rounded-2xl bg-[#FCE7F3] p-4 border border-pink-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-pink-600">
              <Users className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#9D174D]">QUẢN LÝ HỌC SINH</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Thêm, chỉnh sửa danh sách học sinh, nhập từ Excel.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#EC4899] to-[#DB2777] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 4. Bài giảng và học liệu */}
          <div className="rounded-2xl bg-[#FFF3E0] p-4 border border-amber-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-amber-600">
              <BookOpen className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#9A3412]">BÀI GIẢNG VÀ HỌC LIỆU</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Lưu bài giảng, video, hình ảnh và tài liệu học tập.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('lessons')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#EA580C] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 5. Giao bài tập */}
          <div className="rounded-2xl bg-[#F3E8FF] p-4 border border-purple-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-purple-600">
              <ClipboardList className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#581C87]">GIAO BÀI TẬP</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Tạo và giao bài tập trực tuyến cho từng lớp.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#A855F7] to-[#7E22CE] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 6. Kết quả học tập */}
          <div className="rounded-2xl bg-[#E1F5FE] p-4 border border-sky-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-[#0284C7]">
              <Star className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#003B8E]">KẾT QUẢ HỌC TẬP</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Xem điểm số, thống kê, chấm tự luận, xuất báo cáo Excel.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('results')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2196F3] to-[#0066CC] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 7. Trò chơi học tập */}
          <div className="rounded-2xl bg-[#E8F5E9] p-4 border border-emerald-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-emerald-700">
              <Gamepad2 className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#065F46]">TRÒ CHƠI HỌC TẬP</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Các trò chơi ô chữ, ghép hình, nhận biết, trắc nghiệm.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('games')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#22C55E] to-[#15803D] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {/* 8. Cài đặt và tài khoản */}
          <div className="rounded-2xl bg-[#FCE4EC] p-4 border border-rose-200/70 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 text-rose-600">
              <Settings className="w-9 h-9" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-[#881337]">CÀI ĐẶT VÀ TÀI KHOẢN</h3>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                Quản lý tài khoản, phân quyền, đổi mật khẩu, sao lưu dữ liệu.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xem ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
