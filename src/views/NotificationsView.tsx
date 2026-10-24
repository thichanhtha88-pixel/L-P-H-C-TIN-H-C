import React, { useState } from 'react';
import { Bell, Calendar, ClipboardList, FileText, Plus, Send, Trash2, X } from 'lucide-react';
import type {
  ClassRoom,
  NotificationItem,
  NotificationType,
  UserProfile,
} from '../types/lms';

interface NotificationsViewProps {
  currentUser: UserProfile;
  classes: ClassRoom[];
  notifications: NotificationItem[];
  onCreateNotification: (payload: Partial<NotificationItem>) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
}

const TYPE_LABELS: Record<NotificationType, string> = {
  assignment: 'Thông báo bài tập mới',
  deadline: 'Nhắc hạn nộp bài',
  material: 'Thông báo tài liệu mới',
  schedule: 'Lịch học thực hành phòng máy',
  general: 'Thông báo chung',
};

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  classes,
  notifications,
  onCreateNotification,
  onDeleteNotification,
}) => {
  const isTeacher = currentUser.role === 'teacher';
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('assignment');
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreateNotification({
        title,
        message,
        type,
        targetClassIds,
      });
      setModalOpen(false);
      setTitle('');
      setMessage('');
      setTargetClassIds([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#0066CC]" />
            <span>THÔNG BÁO HỌC TẬP</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isTeacher
              ? 'Gửi thông báo bài tập mới, nhắc hạn nộp bài, tài liệu mới hoặc lịch học phòng Tin học tới từng lớp.'
              : `Bảng tin thông báo dành cho Lớp ${currentUser.className} và toàn trường.`}
          </p>
        </div>

        {isTeacher && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo thông báo mới</span>
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-500 border border-sky-100">
            Hiện tại chưa có thông báo nào.
          </div>
        ) : (
          notifications.map((noti) => {
            const Icon =
              noti.type === 'assignment' || noti.type === 'deadline'
                ? ClipboardList
                : noti.type === 'material'
                  ? FileText
                  : noti.type === 'schedule'
                    ? Calendar
                    : Bell;

            const classText =
              noti.targetClassIds.length === 0
                ? 'Tất cả các lớp (Khối 3, 4, 5)'
                : classes
                    .filter((c) => noti.targetClassIds.includes(c.id))
                    .map((c) => `Lớp ${c.name}`)
                    .join(', ');

            return (
              <div
                key={noti.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#EAF5FF] text-[#0066CC] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      {TYPE_LABELS[noti.type]} · Gửi tới: <strong>{classText}</strong> ·{' '}
                      <span className="tabular-nums">
                        {new Date(noti.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#003B8E]">{noti.title}</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{noti.message}</p>
                    <div className="text-xs text-slate-500 italic">
                      Người gửi: Giáo viên {noti.createdBy}
                    </div>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => onDeleteNotification(noti.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 shrink-0 cursor-pointer"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Notification Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#003B8E]">Gửi thông báo mới đến học sinh</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Loại thông báo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Lớp nhận thông báo (Để trống nếu gửi toàn trường)
              </label>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => {
                  const checked = targetClassIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setTargetClassIds((prev) =>
                          prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        checked
                          ? 'bg-[#0066CC] text-white border-[#0066CC]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Lớp {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Tiêu đề thông báo *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nhắc hạn nộp bài tập Tin học lớp 3"
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nội dung chi tiết *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung gửi đến các em học sinh..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#0066CC] text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Đang gửi...' : 'Đăng thông báo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
