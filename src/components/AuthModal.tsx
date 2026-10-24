import React, { useState } from 'react';
import { KeyRound, LogIn, ShieldCheck, User, X } from 'lucide-react';
import type { UserRole } from '../types/lms';

interface AuthModalProps {
  isOpen: boolean;
  canClose: boolean;
  isDemoMode: boolean;
  demoAccounts: { username: string; role: UserRole; label: string; className?: string }[];
  onClose: () => void;
  onLogin: (username: string, password: string, quickDemoSwitch?: boolean) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  canClose,
  isDemoMode,
  demoAccounts,
  onClose,
  onLogin,
}) => {
  const [username, setUsername] = useState('thichanhtha');
  const [password, setPassword] = useState('Gv@123456');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(username, password, false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (accUsername: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(accUsername, '', true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể chuyển tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-sky-100">
        <div className="bg-gradient-to-r from-[#003B8E] to-[#0066CC] px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Đăng nhập hệ thống Tin học</h2>
            <p className="text-xs text-sky-100 mt-0.5">Trường Tiểu học Thứ Ba · Giáo viên: Thị Chành Tha</p>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Tài khoản hoặc Mã học sinh
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: thichanhtha hoặc hs3a01"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 focus:border-[#0066CC] focus:outline-none text-base"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 focus:border-[#0066CC] focus:outline-none text-base"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          </button>

          {isDemoMode && demoAccounts.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="text-xs font-bold text-[#003B8E] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
                <span>Tài khoản mẫu (Chế độ DEMO — Nhấn để đăng nhập nhanh):</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemo(acc.username)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-sky-100 bg-[#EAF5FF]/60 hover:bg-[#EAF5FF] text-sm text-[#003B8E] flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-bold">{acc.label}</span>
                    <span className="text-xs text-slate-500">@{acc.username}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Mật khẩu mặc định DEMO: Giáo viên <span className="font-bold">Gv@123456</span> · Học sinh{' '}
                <span className="font-bold">Hs@123456</span>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
