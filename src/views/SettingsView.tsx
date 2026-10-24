import React, { useState } from 'react';
import {
  Cloud,
  Database,
  Download,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import type { SystemSettings, UserProfile } from '../types/lms';
import { apiRequest } from '../services/api';

interface SettingsViewProps {
  currentUser: UserProfile;
  settings: SystemSettings;
  onUpdateSettings: (payload: Partial<SystemSettings>) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onSwitchDataMode: (mode: 'demo' | 'workspace') => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

const FIRESTORE_RULES_TEMPLATE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function isTeacher() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    function getStudentClassId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.classId;
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isTeacher());
      allow write: if isTeacher();
    }
    match /classes/{classId} {
      allow read: if isTeacher() || (isSignedIn() && getStudentClassId() == classId);
      allow write: if isTeacher();
    }
    match /students/{studentId} {
      allow read: if isTeacher() || (isSignedIn() && resource.data.uid == request.auth.uid);
      allow write: if isTeacher();
    }
    match /lessons/{lessonId} {
      allow read: if isTeacher() ||
        (isSignedIn() && resource.data.published == true && getStudentClassId() in resource.data.targetClassIds);
      allow write: if isTeacher();
    }
    match /assignments/{assignmentId} {
      allow read: if isTeacher() ||
        (isSignedIn() && resource.data.status == 'published' && getStudentClassId() in resource.data.classIds);
      allow write: if isTeacher();
    }
    match /submissions/{submissionId} {
      // Học sinh chỉ đọc được bài nộp của chính mình, KHÔNG được tự sửa điểm số (chấm điểm thực hiện qua Backend/Cloud Functions)
      allow read: if isTeacher() || (isSignedIn() && resource.data.studentUid == request.auth.uid);
      allow update, delete: if isTeacher();
    }
    match /questions/{questionId} {
      allow read, write: if isTeacher();
    }
    match /resources/{resourceId} {
      allow read: if isTeacher() || (isSignedIn() && resource.data.accessLevel == 'all');
      allow write: if isTeacher();
    }
    match /notifications/{notiId} {
      allow read: if isTeacher() ||
        (isSignedIn() && (resource.data.targetClassIds.size() == 0 || getStudentClassId() in resource.data.targetClassIds));
      allow write: if isTeacher();
    }
  }
}`;

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  settings,
  onUpdateSettings,
  onChangePassword,
  onSwitchDataMode,
  onResetDemoData,
  onOpenAuthModal,
  onLogout,
}) => {
  const isTeacher = currentUser.role === 'teacher';

  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [teacherEmail, setTeacherEmail] = useState(settings.teacherEmail);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(
    settings.defaultDurationMinutes
  );
  const [allowStudentsViewResults, setAllowStudentsViewResults] = useState(
    settings.allowStudentsViewResults
  );
  const [recordGameScores, setRecordGameScores] = useState(settings.recordGameScores);

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await onUpdateSettings({
        schoolName,
        teacherName,
        teacherEmail,
        slogan,
        academicYear,
        defaultDurationMinutes,
        allowStudentsViewResults,
        recordGameScores,
      });
      setFeedback({ type: 'ok', text: 'Đã cập nhật thông tin trường, giáo viên và cấu hình hệ thống thành công!' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Cập nhật thất bại.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (newPass !== confirmPass) {
      setFeedback({ type: 'err', text: 'Mật khẩu xác nhận không trùng khớp.' });
      return;
    }
    setSaving(true);
    try {
      await onChangePassword(curPass, newPass);
      setCurPass('');
      setNewPass('');
      setConfirmPass('');
      setFeedback({ type: 'ok', text: 'Đã thay đổi mật khẩu an toàn!' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportFullBackup = async () => {
    try {
      const backup = await apiRequest<Record<string, unknown>>('/api/system/backup');
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Sao_luu_Tin_hoc_Tieu_hoc_Thu_Ba_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setFeedback({ type: 'ok', text: 'Đã tải tệp sao lưu toàn bộ dữ liệu (.json) thành công!' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Không thể xuất bản sao lưu.',
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0066CC]" />
            <span>CÀI ĐẶT HỆ THỐNG VÀ TÀI KHOẢN</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Quản lý tài khoản đăng nhập, phân quyền, cấu hình kiểm tra, sao lưu dữ liệu và hướng dẫn kết nối Firebase trực tuyến.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-4 py-2 rounded-xl bg-[#EAF5FF] hover:bg-sky-200 text-[#003B8E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Chuyển tài khoản</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm font-bold ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Teacher & School Configuration */}
        {isTeacher && (
          <form
            onSubmit={handleSaveSystemSettings}
            className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4 text-sm"
          >
            <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#0066CC]" />
              <span>Thông tin Trường, Giáo viên & Quy tắc học tập</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên trường học</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên giáo viên phụ trách
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời gian làm bài mặc định (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={defaultDurationMinutes}
                  onChange={(e) => setDefaultDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khẩu hiệu môn học</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-sky-100 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowStudentsViewResults}
                  onChange={(e) => setAllowStudentsViewResults(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-bold text-[#003B8E]">
                  Cho phép học sinh xem điểm số và nhận xét sau khi nộp bài
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordGameScores}
                  onChange={(e) => setRecordGameScores(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-bold text-[#003B8E]">
                  Bật ghi nhận điểm số trong phân hệ Trò chơi học tập
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu cài đặt hệ thống</span>
              </button>
            </div>
          </form>
        )}

        {/* Right Column: Password Change & Data Mode / Backup */}
        <div className={`${isTeacher ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-5`}>
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-3 text-sm"
          >
            <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#0066CC]" />
              <span>Đổi mật khẩu tài khoản ({currentUser.username})</span>
            </h3>
            <div>
              <label className="block text-xs font-bold mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={curPass}
                onChange={(e) => setCurPass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#003B8E] text-white font-bold text-xs cursor-pointer"
            >
              Cập nhật mật khẩu
            </button>
          </form>

          {isTeacher && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-3 text-sm">
              <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0066CC]" />
                <span>Tách biệt Dữ liệu DEMO & Sao lưu</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dữ liệu DEMO (5 lớp 3A, 3B, 4A, 5A, 5B) được lưu tách biệt hoàn toàn với Không gian làm việc thực tế cục bộ để không trộn lẫn dữ liệu giả định với danh sách học sinh thật.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSwitchDataMode('demo')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                    settings.dataMode === 'demo'
                      ? 'bg-[#0066CC] text-white border-[#0066CC]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Chế độ DEMO (Dữ liệu mẫu)
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchDataMode('workspace')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                    settings.dataMode === 'workspace'
                      ? 'bg-[#0066CC] text-white border-[#0066CC]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Không gian Thực tế (Tách riêng)
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="px-3.5 py-2 rounded-xl bg-[#22C55E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Sao lưu toàn bộ dữ liệu (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Khôi phục gốc DEMO</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-3">
        <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
          <span>Bảng phân quyền tài khoản và cơ chế bảo mật chấm điểm</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-[#EAF5FF]/60 border border-sky-200 space-y-1.5">
            <div className="font-bold text-[#003B8E]">1. Vai trò GIÁO VIÊN (Cô {settings.teacherName})</div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Toàn quyền quản lý lớp học, nhập/xuất Excel học sinh, soạn bài giảng, quản lý ngân hàng câu hỏi, giao bài tập, chấm câu tự luận, xem thống kê toàn trường và sao lưu dữ liệu.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
            <div className="font-bold text-emerald-900">2. Vai trò HỌC SINH (Khối 3, 4, 5)</div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Chỉ xem được bài giảng, thông báo và bài tập đã xuất bản cho đúng lớp của mình; làm bài, nộp bài (chấm điểm trên máy chủ chống can thiệp điểm từ trình duyệt) và chỉ xem được kết quả của bản thân.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step Firebase Connection & Deployment Guide for Teacher */}
      {isTeacher && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-200 space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-[#0066CC]" />
            <h3 className="text-xl font-bold text-[#003B8E]">
              HƯỚNG DẪN TỪNG BƯỚC KẾT NỐI FIREBASE THẬT & TRIỂN KHAI WEBSITE LÊN INTERNET
            </h3>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            Hiện tại ứng dụng đang chạy ở <strong>Chế độ DEMO / Máy chủ cục bộ</strong> (do bước khởi tạo Firebase tự động vừa được từ chối). Khi sẵn sàng chuyển sang lưu trữ trực tuyến trên đám mây Firebase mà không cần đưa bất kỳ khóa bí mật quản trị nào vào trình duyệt, cô thực hiện theo 4 bước sau:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FBFF] space-y-1.5">
              <div className="font-bold text-[#003B8E]">Bước 1: Tạo dự án Firebase & Authentication</div>
              <p className="text-xs text-slate-700 leading-relaxed">
                1. Truy cập <strong>console.firebase.google.com</strong> và tạo dự án mới (ví dụ: <code>tinhoc-tieuhoc-thuba</code>).<br />
                2. Mở mục <strong>Authentication &rarr; Sign-in method</strong>: Bật <em>Email/Password</em> hoặc <em>Google Sign-In</em> cho giáo viên và tài khoản học sinh (mật khẩu được Firebase băm tự động, không bao giờ lưu văn bản thuần).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FBFF] space-y-1.5">
              <div className="font-bold text-[#003B8E]">Bước 2: Bật Cloud Firestore & Firebase Storage</div>
              <p className="text-xs text-slate-700 leading-relaxed">
                1. Vào <strong>Firestore Database &rarr; Create database</strong> (chọn vùng <code>asia-southeast1</code> Singapore để tốc độ tại Việt Nam nhanh nhất).<br />
                2. Tạo các bộ sưu tập: <code>users</code>, <code>classes</code>, <code>students</code>, <code>lessons</code>, <code>assignments</code>, <code>questions</code>, <code>submissions</code>, <code>resources</code>, <code>notifications</code>.<br />
                3. Bật <strong>Storage</strong> để lưu tệp PDF, PowerPoint bài giảng.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FBFF] space-y-1.5">
              <div className="font-bold text-[#003B8E]">Bước 3: Cấu hình biến môi trường an toàn</div>
              <p className="text-xs text-slate-700 leading-relaxed">
                - Cấu hình Web SDK công khai trong <code>firebase-applet-config.json</code> (hoặc kích hoạt trực tiếp nút <strong>Firebase Setup</strong> trong AI Studio).<br />
                - Tuyệt đối <strong>KHÔNG</strong> đặt Service Account Private Key vào mã React phía trình duyệt; việc chấm điểm bài nộp đặt tại máy chủ Express (<code>server.ts</code>) hoặc Cloud Functions.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FBFF] space-y-1.5">
              <div className="font-bold text-[#003B8E]">Bước 4: Xuất bản lên Internet (Deploy)</div>
              <p className="text-xs text-slate-700 leading-relaxed">
                - <strong>Cách 1 (Nhanh nhất):</strong> Nhấn nút <strong>Deploy / Share App</strong> ngay góc trên phải Google AI Studio để xuất bản lên Cloud Run.<br />
                - <strong>Cách 2 (Firebase Hosting):</strong> Chạy lệnh <code>npm run build</code> sau đó chạy <code>firebase deploy --only firestore:rules,hosting</code>.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#003B8E]">
              Mẫu Quy tắc bảo mật Firestore (firestore.rules) phân quyền chặt chẽ Giáo viên & Học sinh:
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-sky-100 text-xs overflow-x-auto leading-relaxed">
              {FIRESTORE_RULES_TEMPLATE}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
