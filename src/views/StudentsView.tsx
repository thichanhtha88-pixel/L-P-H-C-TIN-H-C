import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Download,
  Edit3,
  FileSpreadsheet,
  History,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { ClassRoom, Student, Submission } from '../types/lms';
import {
  downloadStudentImportTemplate,
  exportStudentsToExcel,
  parseStudentsExcelFile,
} from '../utils/excel';

interface StudentsViewProps {
  classes: ClassRoom[];
  students: Student[];
  submissions: Submission[];
  onCreateStudent: (payload: {
    studentCode: string;
    fullName: string;
    classId: string;
    status: Student['status'];
    password?: string;
  }) => Promise<void>;
  onUpdateStudent: (id: string, payload: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onBulkImportStudents: (
    rows: Array<{ studentCode: string; fullName: string; className: string; academicYear?: string }>
  ) => Promise<{ importedCount: number; skipped: string[] }>;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  classes,
  students,
  submissions,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkImportStudents,
}) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<Student['status']>('active');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (gradeFilter !== 'all' && String(s.grade) !== gradeFilter) return false;
      if (classFilter !== 'all' && s.classId !== classFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q)
      );
    });
  }, [students, gradeFilter, classFilter, search]);

  const openAddModal = () => {
    setEditingStudent(null);
    setStudentCode('');
    setFullName('');
    setClassId(classes[0]?.id || '');
    setStatus('active');
    setPassword('Hs@123456');
    setModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setStudentCode(stu.studentCode);
    setFullName(stu.fullName);
    setClassId(stu.classId);
    setStatus(stu.status);
    setPassword('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, {
          studentCode,
          fullName,
          classId,
          status,
        });
      } else {
        await onCreateStudent({
          studentCode,
          fullName,
          classId,
          status,
          password,
        });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFeedback(null);
    try {
      const parsed = await parseStudentsExcelFile(file);
      const res = await onBulkImportStudents(parsed);
      setImportFeedback(
        `Đã nhập thành công ${res.importedCount} học sinh từ tệp Excel.${
          res.skipped.length > 0 ? ` Bỏ qua ${res.skipped.length} dòng (${res.skipped.slice(0, 3).join('; ')}).` : ''
        }`
      );
    } catch (err) {
      setImportFeedback(err instanceof Error ? err.message : 'Lỗi đọc tệp Excel.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Excel Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0066CC]" />
            <span>QUẢN LÝ HỌC SINH TIỂU HỌC</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Quản lý hồ sơ học tập tối giản, an toàn (không thu thập SĐT hay địa chỉ cá nhân), nhập/xuất Excel và tra cứu lịch sử làm bài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={downloadStudentImportTemplate}
            className="px-3 py-2 rounded-xl border border-sky-200 bg-[#EAF5FF] hover:bg-sky-200 text-[#003B8E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tải tệp Excel mẫu</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nhập từ Excel</span>
          </button>
          <button
            type="button"
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {importFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{importFeedback}</span>
          <button
            type="button"
            onClick={() => setImportFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, mã học sinh (VD: HS3A01) hoặc tài khoản..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:border-[#0066CC] focus:outline-none"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value as 'all' | '3' | '4' | '5');
              setClassFilter('all');
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">Tất cả khối (3, 4, 5)</option>
            <option value="3">Khối 3</option>
            <option value="4">Khối 4</option>
            <option value="5">Khối 5</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">Tất cả lớp học</option>
            {classes
              .filter((c) => gradeFilter === 'all' || String(c.grade) === gradeFilter)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-slate-600">Chưa có học sinh nào khớp bộ lọc hiện tại.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="text-sm font-bold text-[#0066CC] hover:underline cursor-pointer"
            >
              + Thêm học sinh đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF5FF] text-[#003B8E] text-sm border-b border-sky-200">
                  <th className="py-3 px-3">STT</th>
                  <th className="py-3 px-3">Mã HS</th>
                  <th className="py-3 px-3">Họ và tên</th>
                  <th className="py-3 px-3">Lớp · Khối</th>
                  <th className="py-3 px-3">Năm học</th>
                  <th className="py-3 px-3">Tài khoản đăng nhập</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((stu, idx) => {
                  const statusLabel =
                    stu.status === 'active'
                      ? 'Đang học'
                      : stu.status === 'paused'
                        ? 'Tạm nghỉ'
                        : 'Chuyển trường';
                  const statusColor =
                    stu.status === 'active'
                      ? 'text-emerald-700 font-bold'
                      : stu.status === 'paused'
                        ? 'text-amber-700 font-bold'
                        : 'text-slate-500';

                  return (
                    <tr key={stu.id} className="hover:bg-sky-50/40">
                      <td className="py-2.5 px-3 tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0066CC]">{stu.studentCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{stu.fullName}</td>
                      <td className="py-2.5 px-3">
                        Lớp <strong>{stu.className}</strong> · Khối {stu.grade}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums">{stu.academicYear}</td>
                      <td className="py-2.5 px-3 text-slate-700">{stu.username}</td>
                      <td className={`py-2.5 px-3 ${statusColor}`}>{statusLabel}</td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setHistoryStudent(stu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EAF5FF] hover:bg-sky-200 text-[#003B8E] font-bold text-xs cursor-pointer"
                          title="Xem lịch sử làm bài"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Lịch sử bài làm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(stu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs cursor-pointer"
                          title="Sửa thông tin hoặc chuyển lớp"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Sửa / Chuyển lớp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(stu)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit / Transfer Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-[#003B8E] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>{editingStudent ? 'Cập nhật / Chuyển lớp học sinh' : 'Thêm học sinh mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {classes.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Vui lòng thêm ít nhất 1 lớp học ở mục Quản lý lớp học trước khi thêm học sinh.
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Mã học sinh (Duy nhất) *
                </label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="VD: HS3A06"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tài khoản đăng nhập tự động: <strong>{(studentCode || 'hs...').toLowerCase()}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Khang"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Lớp học *</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    required
                  >
                    <option value="" disabled>
                      Chọn lớp
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name} (Khối {c.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Student['status'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="active">Đang học</option>
                    <option value="paused">Tạm nghỉ</option>
                    <option value="transferred">Chuyển trường</option>
                  </select>
                </div>
              </div>

              {!editingStudent && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Mật khẩu khởi tạo (Tối thiểu 6 ký tự)
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || classes.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">Xác nhận xóa hồ sơ học sinh</h3>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa học sinh <strong>{deletingStudent.fullName}</strong> ({deletingStudent.studentCode} - Lớp {deletingStudent.className}) không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteStudent(deletingStudent.id);
                  setDeletingStudent(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer"
              >
                Xóa học sinh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Submission History Modal */}
      {historyStudent && (() => {
        const stuSubs = submissions.filter((s) => s.studentId === historyStudent.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
              <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    Lịch sử làm bài: {historyStudent.fullName} ({historyStudent.studentCode})
                  </h3>
                  <p className="text-xs text-sky-200">
                    Lớp {historyStudent.className} · Tài khoản: {historyStudent.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryStudent(null)}
                  className="p-1.5 hover:bg-white/15 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                {stuSubs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">
                    Học sinh này chưa có bài nộp nào.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#EAF5FF] text-[#003B8E]">
                        <th className="py-2.5 px-3">Bài tập</th>
                        <th className="py-2.5 px-3">Lần làm</th>
                        <th className="py-2.5 px-3">Số câu đúng</th>
                        <th className="py-2.5 px-3">Điểm số</th>
                        <th className="py-2.5 px-3">Thời gian nộp</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stuSubs.map((sub) => (
                        <tr key={sub.id}>
                          <td className="py-2.5 px-3 font-bold">{sub.assignmentTitle}</td>
                          <td className="py-2.5 px-3 tabular-nums">Lần {sub.attemptNumber}</td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {sub.correctCount}/{sub.totalQuestions}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">
                            {sub.score10.toFixed(1).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-2.5 px-3">
                            {sub.gradingStatus === 'graded' ? 'Đã chấm' : 'Chờ chấm tự luận'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
