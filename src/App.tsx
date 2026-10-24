import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type {
  Assignment,
  ClassRoom,
  Lesson,
  LmsBootstrapPayload,
  ModuleId,
  NotificationItem,
  Question,
  ResourceItem,
  Student,
  Submission,
  SubmissionAnswer,
  SystemSettings,
} from './types/lms';
import {
  apiRequest,
  fetchBootstrap,
  markLoggedOut,
  setStoredToken,
} from './services/api';
import { HeaderBanner } from './components/HeaderBanner';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './views/HomeView';
import { OverviewView } from './views/OverviewView';
import { ClassesView } from './views/ClassesView';
import { StudentsView } from './views/StudentsView';
import { LessonsView } from './views/LessonsView';
import { AssignmentsView } from './views/AssignmentsView';
import { ResultsView } from './views/ResultsView';
import { GamesView } from './views/GamesView';
import { QuestionBankView } from './views/QuestionBankView';
import { ResourcesView } from './views/ResourcesView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';

const TEACHER_ONLY_MODULES: ModuleId[] = ['overview', 'classes', 'students', 'questions'];

export default function App() {
  const [data, setData] = useState<LmsBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loggedOutState, setLoggedOutState] = useState(false);
  const [autoStartAssignmentId, setAutoStartAssignmentId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const reloadData = useCallback(async () => {
    try {
      const payload = await fetchBootstrap();
      setData(payload);
      setLoggedOutState(false);
      if (
        payload.currentUser.role === 'student' &&
        TEACHER_ONLY_MODULES.includes(activeModule)
      ) {
        setActiveModule('home');
      }
    } catch {
      setLoggedOutState(true);
      setAuthModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, [activeModule]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const handleLogin = async (
    username: string,
    password: string,
    quickDemoSwitch?: boolean
  ) => {
    const res = await apiRequest<{ token: string; bootstrap: LmsBootstrapPayload }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password, quickDemoSwitch }),
      }
    );
    setStoredToken(res.token);
    setData(res.bootstrap);
    setLoggedOutState(false);
    if (
      res.bootstrap.currentUser.role === 'student' &&
      TEACHER_ONLY_MODULES.includes(activeModule)
    ) {
      setActiveModule('home');
    }
    showToast('success', `Xin chào ${res.bootstrap.currentUser.fullName}!`);
  };

  const handleLogout = () => {
    markLoggedOut();
    setLoggedOutState(true);
    setAuthModalOpen(true);
  };

  const handleNavigate = (mod: ModuleId) => {
    if (data?.currentUser.role === 'student' && TEACHER_ONLY_MODULES.includes(mod)) {
      showToast('error', 'Tài khoản học sinh không được phép truy cập trang quản trị này.');
      return;
    }
    setActiveModule(mod);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#EAF5FF] flex flex-col items-center justify-center gap-3 text-[#003B8E]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0066CC]" />
        <p className="text-lg font-bold">
          Đang tải Hệ thống Quản lý & Học tập môn Tin học - Trường Tiểu học Thứ Ba...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF5FF] text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {data && !loggedOutState && (
        <>
          <HeaderBanner
            currentUser={data.currentUser}
            settings={data.settings}
            notifications={data.notifications}
            demoAccounts={data.demoAccounts}
            onNavigate={handleNavigate}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onQuickSwitchAccount={(uname) =>
              handleLogin(uname, '', true).catch((err) =>
                showToast('error', err instanceof Error ? err.message : 'Lỗi chuyển tài khoản')
              )
            }
            onLogout={handleLogout}
            onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
          />

          <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
            <Sidebar
              activeModule={activeModule}
              role={data.currentUser.role}
              mobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
              onSelectModule={handleNavigate}
            />

            <main className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 overflow-x-hidden">
              {activeModule === 'home' && (
                <HomeView
                  currentUser={data.currentUser}
                  settings={data.settings}
                  classes={data.classes}
                  students={data.students}
                  lessons={data.lessons}
                  assignments={data.assignments}
                  submissions={data.submissions}
                  notifications={data.notifications}
                  onNavigate={handleNavigate}
                  onStartAssignment={(asgId) => {
                    setAutoStartAssignmentId(asgId);
                    setActiveModule('assignments');
                  }}
                />
              )}

              {activeModule === 'overview' && data.currentUser.role === 'teacher' && (
                <OverviewView
                  classes={data.classes}
                  students={data.students}
                  assignments={data.assignments}
                  submissions={data.submissions}
                  onNavigate={handleNavigate}
                  onSendReminder={async (classId, assignmentTitle) => {
                    try {
                      await apiRequest('/api/notifications', {
                        method: 'POST',
                        body: JSON.stringify({
                          title: `Nhắc hạn nộp bài: ${assignmentTitle}`,
                          message: `Các em chưa hoàn thành bài "${assignmentTitle}" vui lòng vào mục Bài tập được giao để nộp bài đúng hạn nhé!`,
                          type: 'deadline',
                          targetClassIds: [classId],
                        }),
                      });
                      await reloadData();
                      showToast('success', 'Đã gửi thông báo nhắc hạn nộp bài tới lớp!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi gửi nhắc nhở.');
                    }
                  }}
                />
              )}

              {activeModule === 'classes' && data.currentUser.role === 'teacher' && (
                <ClassesView
                  classes={data.classes}
                  students={data.students}
                  submissions={data.submissions}
                  settings={data.settings}
                  onCreateClass={async (payload: Partial<ClassRoom>) => {
                    try {
                      await apiRequest('/api/classes', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã thêm lớp học mới thành công!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi thêm lớp.');
                      throw err;
                    }
                  }}
                  onUpdateClass={async (id: string, payload: Partial<ClassRoom>) => {
                    try {
                      await apiRequest(`/api/classes/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã cập nhật thông tin lớp học!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi cập nhật lớp.');
                      throw err;
                    }
                  }}
                  onDeleteClass={async (id: string, transferToClassId?: string) => {
                    try {
                      const qs = transferToClassId
                        ? `?transferToClassId=${encodeURIComponent(transferToClassId)}`
                        : '';
                      await apiRequest(`/api/classes/${id}${qs}`, { method: 'DELETE' });
                      await reloadData();
                      showToast('success', 'Đã xóa lớp học an toàn!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi xóa lớp.');
                      throw err;
                    }
                  }}
                />
              )}

              {activeModule === 'students' && data.currentUser.role === 'teacher' && (
                <StudentsView
                  classes={data.classes}
                  students={data.students}
                  submissions={data.submissions}
                  onCreateStudent={async (payload) => {
                    try {
                      await apiRequest('/api/students', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã thêm học sinh mới thành công!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi thêm học sinh.');
                      throw err;
                    }
                  }}
                  onUpdateStudent={async (id: string, payload: Partial<Student>) => {
                    try {
                      await apiRequest(`/api/students/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã cập nhật hồ sơ học sinh!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi cập nhật.');
                      throw err;
                    }
                  }}
                  onDeleteStudent={async (id: string) => {
                    try {
                      await apiRequest(`/api/students/${id}`, { method: 'DELETE' });
                      await reloadData();
                      showToast('success', 'Đã xóa học sinh.');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi xóa học sinh.');
                    }
                  }}
                  onBulkImportStudents={async (rows) => {
                    const res = await apiRequest<{ importedCount: number; skipped: string[] }>(
                      '/api/students/bulk-import',
                      {
                        method: 'POST',
                        body: JSON.stringify({ rows }),
                      }
                    );
                    await reloadData();
                    showToast('success', `Đã nhập ${res.importedCount} học sinh từ Excel!`);
                    return res;
                  }}
                />
              )}

              {activeModule === 'lessons' && (
                <LessonsView
                  currentUser={data.currentUser}
                  classes={data.classes}
                  lessons={data.lessons}
                  onCreateLesson={async (payload: Partial<Lesson>) => {
                    try {
                      await apiRequest('/api/lessons', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã tạo bài giảng mới!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi tạo bài giảng.');
                      throw err;
                    }
                  }}
                  onUpdateLesson={async (id: string, payload: Partial<Lesson>) => {
                    try {
                      await apiRequest(`/api/lessons/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã cập nhật bài giảng!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi cập nhật.');
                    }
                  }}
                  onDeleteLesson={async (id: string) => {
                    try {
                      await apiRequest(`/api/lessons/${id}`, { method: 'DELETE' });
                      await reloadData();
                      showToast('success', 'Đã xóa bài giảng.');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi xóa bài giảng.');
                    }
                  }}
                />
              )}

              {activeModule === 'assignments' && (
                <AssignmentsView
                  currentUser={data.currentUser}
                  settings={data.settings}
                  classes={data.classes}
                  students={data.students}
                  assignments={data.assignments}
                  questionBank={data.questions}
                  submissions={data.submissions}
                  initialAutoStartAssignmentId={autoStartAssignmentId}
                  onClearAutoStart={() => setAutoStartAssignmentId(null)}
                  onCreateAssignment={async (payload: Partial<Assignment>) => {
                    await apiRequest('/api/assignments', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast(
                      'success',
                      payload.status === 'published'
                        ? 'Đã xuất bản và giao bài tập cho lớp!'
                        : 'Đã lưu bản nháp bài tập!'
                    );
                  }}
                  onUpdateAssignment={async (id: string, payload: Partial<Assignment>) => {
                    await apiRequest(`/api/assignments/${id}`, {
                      method: 'PUT',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast('success', 'Đã cập nhật bài tập!');
                  }}
                  onDeleteAssignment={async (id: string) => {
                    await apiRequest(`/api/assignments/${id}`, { method: 'DELETE' });
                    await reloadData();
                    showToast('success', 'Đã xóa bài tập.');
                  }}
                  onSubmitQuiz={async (payload: {
                    assignmentId: string;
                    submissionKey: string;
                    startedAt: string;
                    answers: SubmissionAnswer[];
                    previewStudentId?: string;
                  }) => {
                    const res = await apiRequest<{
                      submission: Submission;
                      revealedAssignment?: Assignment;
                    }>('/api/submissions', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast('success', 'Nộp bài thành công! Kết quả đã được lưu.');
                    return res;
                  }}
                />
              )}

              {activeModule === 'results' && (
                <ResultsView
                  currentUser={data.currentUser}
                  settings={data.settings}
                  classes={data.classes}
                  students={data.students}
                  assignments={data.assignments}
                  submissions={data.submissions}
                  onGradeSubmission={async (submissionId, payload) => {
                    try {
                      await apiRequest(`/api/submissions/${submissionId}/grade`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                      showToast('success', 'Đã lưu điểm chấm bài và nhận xét của giáo viên!');
                    } catch (err) {
                      showToast('error', err instanceof Error ? err.message : 'Lỗi lưu điểm.');
                      throw err;
                    }
                  }}
                />
              )}

              {activeModule === 'games' && (
                <GamesView
                  questions={data.questions}
                  gameRecords={data.gameRecords}
                  settings={data.settings}
                  onSaveGameScore={async (payload) => {
                    try {
                      await apiRequest('/api/games/records', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                      });
                      await reloadData();
                    } catch {
                      // silent if disabled
                    }
                  }}
                />
              )}

              {activeModule === 'questions' && data.currentUser.role === 'teacher' && (
                <QuestionBankView
                  questions={data.questions}
                  classes={data.classes}
                  onCreateQuestion={async (payload: Partial<Question>) => {
                    await apiRequest('/api/questions', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast('success', 'Đã thêm câu hỏi vào Ngân hàng câu hỏi!');
                  }}
                  onUpdateQuestion={async (id: string, payload: Partial<Question>) => {
                    await apiRequest(`/api/questions/${id}`, {
                      method: 'PUT',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast('success', 'Đã cập nhật câu hỏi!');
                  }}
                  onDeleteQuestion={async (id: string) => {
                    await apiRequest(`/api/questions/${id}`, { method: 'DELETE' });
                    await reloadData();
                    showToast('success', 'Đã xóa câu hỏi.');
                  }}
                  onBulkImportQuestions={async (questions) => {
                    const res = await apiRequest<{ importedCount: number }>(
                      '/api/questions/bulk-import',
                      {
                        method: 'POST',
                        body: JSON.stringify({ questions }),
                      }
                    );
                    await reloadData();
                    return res.importedCount;
                  }}
                  onCreateAssignmentFromQuestions={async (payload) => {
                    await apiRequest('/api/assignments', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                  }}
                />
              )}

              {activeModule === 'resources' && (
                <ResourcesView
                  currentUser={data.currentUser}
                  resources={data.resources}
                  onCreateResource={async (payload: Partial<ResourceItem>) => {
                    await apiRequest('/api/resources', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast('success', 'Đã thêm tài nguyên vào thư viện!');
                  }}
                  onDeleteResource={async (id: string) => {
                    await apiRequest(`/api/resources/${id}`, { method: 'DELETE' });
                    await reloadData();
                    showToast('success', 'Đã xóa tài nguyên.');
                  }}
                />
              )}

              {activeModule === 'notifications' && (
                <NotificationsView
                  currentUser={data.currentUser}
                  classes={data.classes}
                  notifications={data.notifications}
                  onCreateNotification={async (payload: Partial<NotificationItem>) => {
                    await apiRequest('/api/notifications', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                    showToast('success', 'Đã đăng thông báo thành công!');
                  }}
                  onDeleteNotification={async (id: string) => {
                    await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
                    await reloadData();
                    showToast('success', 'Đã xóa thông báo.');
                  }}
                />
              )}

              {activeModule === 'settings' && (
                <SettingsView
                  currentUser={data.currentUser}
                  settings={data.settings}
                  onUpdateSettings={async (payload: Partial<SystemSettings>) => {
                    await apiRequest('/api/settings', {
                      method: 'PUT',
                      body: JSON.stringify(payload),
                    });
                    await reloadData();
                  }}
                  onChangePassword={async (currentPassword, newPassword) => {
                    await apiRequest('/api/auth/change-password', {
                      method: 'POST',
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                  }}
                  onSwitchDataMode={async (mode) => {
                    const res = await apiRequest<{
                      token: string;
                      bootstrap: LmsBootstrapPayload;
                    }>('/api/system/mode', {
                      method: 'POST',
                      body: JSON.stringify({ mode }),
                    });
                    setStoredToken(res.token);
                    setData(res.bootstrap);
                    showToast(
                      'success',
                      mode === 'demo'
                        ? 'Đã chuyển sang Chế độ Dữ liệu mẫu (DEMO)!'
                        : 'Đã chuyển sang Không gian dữ liệu Thực tế cục bộ!'
                    );
                  }}
                  onResetDemoData={async () => {
                    const res = await apiRequest<{
                      token: string;
                      bootstrap: LmsBootstrapPayload;
                    }>('/api/system/reset-demo', {
                      method: 'POST',
                    });
                    setStoredToken(res.token);
                    setData(res.bootstrap);
                    showToast('success', 'Đã khôi phục dữ liệu mẫu DEMO về trạng thái ban đầu!');
                  }}
                  onOpenAuthModal={() => setAuthModalOpen(true)}
                  onLogout={handleLogout}
                />
              )}
            </main>
          </div>
        </>
      )}

      {/* Auth Modal (Can also stay open as full login screen when logged out) */}
      <AuthModal
        isOpen={authModalOpen || loggedOutState}
        canClose={!loggedOutState}
        isDemoMode={data?.settings.dataMode !== 'workspace'}
        demoAccounts={data?.demoAccounts || []}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
