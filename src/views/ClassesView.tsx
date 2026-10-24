import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Eye,
  Plus,
  School,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { ClassRoom, GradeLevel, Student, Submission, SystemSettings } from '../types/lms';

interface ClassesViewProps {
  classes: ClassRoom[];
  students: Student[];
  submissions: Submission[];
  settings: SystemSettings;
  onCreateClass: (payload: Partial<ClassRoom>) => Promise<void>;
  onUpdateClass: (id: string, payload: Partial<ClassRoom>) => Promise<void>;
  onDeleteClass: (id: string, transferToClassId?: string) => Promise<void>;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  submissions,
  settings,
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
}) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [saving, setSaving] = useState(false);

  const [detailClass, setDetailClass] = useState<ClassRoom | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null);
  const [transferClassId, setTransferClassId] = useState<string>('');

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (gradeFilter !== 'all' && String(c.grade) !== gradeFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q)
      );
    });
  }, [classes, gradeFilter, search]);

  const openCreateModal = () => {
    setEditingClass(null);
    setCode('');
    setName('');
    setGrade(3);
    setAcademicYear(settings.academicYear);
    setTeacherName(settings.teacherName);
    setFormModalOpen(true);
  };

  const openEditModal = (cls: ClassRoom) => {
    setEditingClass(cls);
    setCode(cls.code);
    setName(cls.name);
    setGrade(cls.grade);
    setAcademicYear(cls.academicYear);
    setTeacherName(cls.teacherName);
    setFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClass) {
        await onUpdateClass(editingClass.id, { code, name, grade, academicYear, teacherName });
      } else {
        await onCreateClass({ code, name, grade, academicYear, teacherName });
      }
      setFormModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingClass) return;
    setSaving(true);
    try {
      await onDeleteClass(deletingClass.id, transferClassId || undefined);
      setDeletingClass(null);
      setTransferClassId('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <School className="w-6 h-6 text-[#0066CC]" />
            <span>QUẢN LÝ LỚP HỌC MÔN TIN HỌC</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Quản lý danh sách các lớp khối 3, 4, 5, sĩ số học sinh và kết quả học tập từng lớp.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm lớp học</span>
        </button>
      </div>

      {/* Search & Grade Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo mã lớp, tên lớp hoặc giáo viên phụ trách..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:border-[#0066CC] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-[#EAF5FF] p-1 rounded-xl">
          {(['all', '3', '4', '5'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(g)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                gradeFilter === g
                  ? 'bg-[#0066CC] text-white shadow-xs'
                  : 'text-[#003B8E] hover:bg-white/60'
              }`}
            >
              {g === 'all' ? 'Tất cả khối' : `Khối ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        {filteredClasses.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-slate-600 text-base">Chưa tìm thấy lớp học nào phù hợp.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="text-sm font-bold text-[#0066CC] hover:underline cursor-pointer"
            >
              + Nhấn vào đây để thêm lớp học mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF5FF] text-[#003B8E] text-sm border-b border-sky-200">
                  <th className="py-3 px-4">Mã lớp</th>
                  <th className="py-3 px-4">Tên lớp</th>
                  <th className="py-3 px-4">Khối lớp</th>
                  <th className="py-3 px-4">Năm học</th>
                  <th className="py-3 px-4">Số học sinh</th>
                  <th className="py-3 px-4">Điểm TB lớp</th>
                  <th className="py-3 px-4">Giáo viên phụ trách</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClasses.map((cls) => {
                  const clsStudents = students.filter((s) => s.classId === cls.id);
                  const clsSubs = submissions.filter((s) => s.classId === cls.id);
                  const avg =
                    clsSubs.length > 0
                      ? (clsSubs.reduce((sum, x) => sum + x.score10, 0) / clsSubs.length)
                          .toFixed(1)
                          .replace('.', ',')
                      : 'Chưa có';

                  return (
                    <tr key={cls.id} className="hover:bg-sky-50/40">
                      <td className="py-3 px-4 font-bold text-[#0066CC]">{cls.code}</td>
                      <td className="py-3 px-4 font-bold text-base text-[#003B8E]">Lớp {cls.name}</td>
                      <td className="py-3 px-4">Khối {cls.grade}</td>
                      <td className="py-3 px-4 tabular-nums">{cls.academicYear}</td>
                      <td className="py-3 px-4 font-bold tabular-nums">{clsStudents.length} học sinh</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">{avg}</td>
                      <td className="py-3 px-4">{cls.teacherName}</td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailClass(cls)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EAF5FF] hover:bg-sky-200 text-[#003B8E] font-bold text-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(cls)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingClass(cls);
                            setTransferClassId('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
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

      {/* Add / Edit Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-[#003B8E] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingClass ? `Chỉnh sửa Lớp ${editingClass.name}` : 'Thêm lớp học mới'}
              </h3>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mã lớp *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: TIN-3C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên lớp *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: 3C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Khối lớp *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Năm học *</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Giáo viên phụ trách</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white text-sm font-bold cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : 'Lưu lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Class Modal */}
      {deletingClass && (() => {
        const stuCount = students.filter((s) => s.classId === deletingClass.id).length;
        const subCount = submissions.filter((s) => s.classId === deletingClass.id).length;
        const otherClasses = classes.filter((c) => c.id !== deletingClass.id);
        const needsTransfer = stuCount > 0 || subCount > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-red-600">
                Xác nhận xóa Lớp {deletingClass.name}
              </h3>

              {needsTransfer ? (
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    Lớp <strong>{deletingClass.name}</strong> hiện có <strong>{stuCount} học sinh</strong> và{' '}
                    <strong>{subCount} bài nộp</strong>. Để bảo toàn dữ liệu học sinh và bài làm, vui lòng chọn lớp chuyển tiếp trước khi xóa:
                  </div>
                  {otherClasses.length > 0 ? (
                    <select
                      value={transferClassId}
                      onChange={(e) => setTransferClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="">-- Chọn lớp tiếp nhận học sinh --</option>
                      {otherClasses.map((oc) => (
                        <option key={oc.id} value={oc.id}>
                          Lớp {oc.name} (Khối {oc.grade})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-red-600 font-bold">
                      Cần tạo ít nhất 1 lớp khác để chuyển học sinh sang trước khi xóa lớp này.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Lớp {deletingClass.name} hiện chưa có học sinh và bài nộp nào. Bạn có chắc chắn muốn xóa lớp này không?
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingClass(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={saving || (needsTransfer && !transferClassId)}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang xử lý...' : needsTransfer ? 'Chuyển HS & Xóa lớp' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Class Detail Roster & Results Modal */}
      {detailClass && (() => {
        const clsStudents = students.filter((s) => s.classId === detailClass.id);
        const clsSubs = submissions.filter((s) => s.classId === detailClass.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
              <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>Chi tiết Lớp {detailClass.name} ({detailClass.code})</span>
                  </h3>
                  <p className="text-xs text-sky-200 mt-0.5">
                    Khối {detailClass.grade} · Năm học {detailClass.academicYear} · GV: {detailClass.teacherName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailClass(null)}
                  className="p-1.5 hover:bg-white/15 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#EAF5FF]">
                    <div className="text-xs text-slate-600">Sĩ số lớp</div>
                    <div className="text-xl font-bold text-[#003B8E] tabular-nums">{clsStudents.length} HS</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <div className="text-xs text-slate-600">Tổng bài đã nộp</div>
                    <div className="text-xl font-bold text-emerald-700 tabular-nums">{clsSubs.length} bài</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <div className="text-xs text-slate-600">Điểm trung bình lớp</div>
                    <div className="text-xl font-bold text-purple-700 tabular-nums">
                      {clsSubs.length > 0
                        ? (clsSubs.reduce((a, b) => a + b.score10, 0) / clsSubs.length)
                            .toFixed(1)
                            .replace('.', ',')
                        : 'Chưa có'}
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-[#003B8E] text-base">
                  Danh sách học sinh và kết quả học tập ({clsStudents.length})
                </h4>
                {clsStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">Lớp chưa có học sinh.</p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Mã HS</th>
                        <th className="py-2 px-3">Họ và tên</th>
                        <th className="py-2 px-3">Tài khoản</th>
                        <th className="py-2 px-3">Bài đã nộp</th>
                        <th className="py-2 px-3">Điểm TB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clsStudents.map((stu, i) => {
                        const mySubs = clsSubs.filter((x) => x.studentId === stu.id);
                        const myAvg =
                          mySubs.length > 0
                            ? (mySubs.reduce((a, b) => a + b.score10, 0) / mySubs.length)
                                .toFixed(1)
                                .replace('.', ',')
                            : '-';
                        return (
                          <tr key={stu.id}>
                            <td className="py-2 px-3 tabular-nums">{i + 1}</td>
                            <td className="py-2 px-3 font-bold text-[#0066CC]">{stu.studentCode}</td>
                            <td className="py-2 px-3 font-bold">{stu.fullName}</td>
                            <td className="py-2 px-3 text-slate-600">{stu.username}</td>
                            <td className="py-2 px-3 tabular-nums">{mySubs.length}</td>
                            <td className="py-2 px-3 font-bold text-emerald-700 tabular-nums">{myAvg}</td>
                          </tr>
                        );
                      })}
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
