import React, { useState } from 'react';
import { Bell, ChevronDown, Database, LogOut, Menu, RefreshCw, ShieldCheck, UserCheck } from 'lucide-react';
import type { ModuleId, NotificationItem, SystemSettings, UserProfile, UserRole } from '../types/lms';
import { ComputerBookLogoSvg, StudentsAndTeacherHeroSvg } from './BannerArtwork';

interface HeaderBannerProps {
  currentUser: UserProfile;
  settings: SystemSettings;
  notifications: NotificationItem[];
  demoAccounts: { username: string; role: UserRole; label: string; className?: string }[];
  onNavigate: (module: ModuleId) => void;
  onOpenAuthModal: () => void;
  onQuickSwitchAccount: (username: string) => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  currentUser,
  settings,
  notifications,
  demoAccounts,
  onNavigate,
  onOpenAuthModal,
  onQuickSwitchAccount,
  onLogout,
  onToggleMobileMenu,
}) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  return (
    <header className="relative w-full bg-gradient-to-r from-[#002D72] via-[#0066CC] to-[#2196F3] text-white shadow-md overflow-visible z-30">
      {/* Decorative subtle tech background circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border-2 border-sky-200" />
        <div className="absolute right-48 bottom-2 w-24 h-24 rounded-full border border-sky-100" />
      </div>

      <div className="relative max-w-[1600px] mx-auto px-4 lg:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Left Zone: Mobile toggle + Logo + School & Subject Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
            aria-label="Mở thanh điều hướng"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          <div
            onClick={() => onNavigate('home')}
            className="hidden sm:block shrink-0 cursor-pointer"
            title="Về Trang chủ"
          >
            <ComputerBookLogoSvg className="w-20 h-18 lg:w-24 lg:h-20 drop-shadow" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl xl:text-[30px] font-bold tracking-wide text-white leading-tight drop-shadow-sm">
              TIN HỌC TIỂU HỌC
            </h1>
            <p className="text-base sm:text-lg xl:text-[22px] font-bold text-[#FFC107] leading-snug tracking-wide">
              {settings.schoolName}
            </p>
            <p className="text-xs sm:text-sm xl:text-[15px] text-sky-100 leading-snug">
              HỆ THỐNG QUẢN LÝ VÀ HỌC TẬP MÔN TIN HỌC
            </p>
          </div>
        </div>

        {/* Center Zone: Students & Teacher Illustration + Teacher Name Card */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <StudentsAndTeacherHeroSvg className="h-24 w-auto" />
          <div className="bg-[#E0F2FE]/95 text-[#003B8E] border-2 border-white/80 rounded-2xl px-5 py-2 shadow-sm text-center">
            <div className="text-base font-bold leading-snug">
              Giáo viên: <span className="text-lg text-[#003B8E]">{settings.teacherName}</span>
            </div>
            <div className="text-sm font-semibold text-[#00509E] leading-snug">
              Trường Tiểu học Thứ Ba
            </div>
            <div className="text-xs italic text-[#0066CC] mt-0.5">
              &ldquo;{settings.slogan}&rdquo;
            </div>
          </div>
        </div>

        {/* Right Zone: Demo Mode Indicator + Notification Bell + Account Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto lg:ml-0 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFC107] text-[#002D72] font-bold text-xs shadow-sm hover:bg-amber-300 transition-colors cursor-pointer whitespace-nowrap"
            title="Nhấn để xem cấu hình dữ liệu và hướng dẫn kết nối Firebase trực tuyến"
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>
              {settings.dataMode === 'demo'
                ? 'CHẾ ĐỘ DEMO (Chưa lưu trực tuyến)'
                : 'DỮ LIỆU CỤC BỘ (Chưa kết nối Firebase)'}
            </span>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
            title="Xem thông báo mới"
          >
            <Bell className="w-5 h-5 text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Profile & Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#003B8E]/80 hover:bg-[#003B8E] border border-sky-300/40 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-200 to-sky-100 text-[#003B8E] font-bold flex items-center justify-center border-2 border-white shrink-0 text-sm">
                {currentUser.role === 'teacher' ? 'GV' : 'HS'}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-sm font-bold text-white whitespace-nowrap">
                  {currentUser.fullName}
                </div>
                <div className="text-xs text-sky-200 whitespace-nowrap">
                  {currentUser.role === 'teacher'
                    ? 'Giáo viên Tin học'
                    : `Học sinh · Lớp ${currentUser.className}`}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-sky-200" />
            </button>

            {accountDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAccountDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-sky-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-sm font-bold text-[#003B8E]">{currentUser.fullName}</div>
                    <div className="text-xs text-slate-600">
                      Vai trò: {currentUser.role === 'teacher' ? 'Giáo viên quản trị' : `Học sinh lớp ${currentUser.className}`}
                    </div>
                  </div>

                  {settings.dataMode === 'demo' && demoAccounts.length > 0 && (
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-[#0066CC]" />
                        <span>Chuyển nhanh tài khoản dùng thử (DEMO):</span>
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {demoAccounts.map((acc) => {
                          const isCurrent = acc.username === currentUser.username;
                          return (
                            <button
                              key={acc.username}
                              type="button"
                              onClick={() => {
                                setAccountDropdownOpen(false);
                                onQuickSwitchAccount(acc.username);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#EAF5FF] text-[#003B8E] font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{acc.label}</span>
                              {isCurrent && <UserCheck className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="px-2 pt-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#EAF5FF] text-[#003B8E] flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
                      <span>Đăng nhập tài khoản khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#EAF5FF] text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-[#0066CC]" />
                      <span>Cài đặt & Kết nối Firebase</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
