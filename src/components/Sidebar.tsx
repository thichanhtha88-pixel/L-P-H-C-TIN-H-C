import React from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  Gamepad2,
  Home,
  Layers,
  PieChart,
  School,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type { ModuleId, UserRole } from '../types/lms';
import { SidebarBottomLaptopSvg } from './BannerArtwork';

interface SidebarProps {
  activeModule: ModuleId;
  role: UserRole;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectModule: (id: ModuleId) => void;
}

interface MenuItemConfig {
  id: ModuleId;
  label: string;
  studentLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  teacherOnly?: boolean;
}

export const MENU_ITEMS: MenuItemConfig[] = [
  { id: 'home', label: 'Trang chủ', studentLabel: 'Trang chủ học tập', icon: Home },
  { id: 'overview', label: 'Tổng quan', icon: PieChart, teacherOnly: true },
  { id: 'classes', label: 'Quản lý lớp học', icon: School, teacherOnly: true },
  { id: 'students', label: 'Quản lý học sinh', icon: Users, teacherOnly: true },
  { id: 'lessons', label: 'Bài giảng và học liệu', studentLabel: 'Bài giảng của lớp', icon: BookOpen },
  { id: 'assignments', label: 'Giao bài tập', studentLabel: 'Bài tập được giao', icon: ClipboardCheck },
  { id: 'results', label: 'Kết quả học tập', studentLabel: 'Kết quả của em', icon: BarChart3 },
  { id: 'games', label: 'Trò chơi học tập', icon: Gamepad2 },
  { id: 'questions', label: 'Ngân hàng câu hỏi', icon: Layers, teacherOnly: true },
  { id: 'resources', label: 'Thư viện tài nguyên', icon: FolderOpen },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'settings', label: 'Cài đặt và tài khoản', studentLabel: 'Tài khoản của em', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  role,
  mobileOpen,
  onCloseMobile,
  onSelectModule,
}) => {
  const visibleItems = MENU_ITEMS.filter((item) => (role === 'teacher' ? true : !item.teacherOnly));

  const navContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#003380] via-[#002B6B] to-[#001F4D] text-white w-64 shrink-0 select-none shadow-lg">
      {/* Mobile Header inside Drawer */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/15">
        <span className="font-bold text-base text-[#FFC107]">DANH MỤC HỆ THỐNG</span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 12 Menu Items */}
      <nav className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const displayLabel = role === 'student' && item.studentLabel ? item.studentLabel : item.label;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectModule(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-[16px] transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#0088FF] to-[#2196F3] text-white font-bold shadow-md'
                  : 'text-sky-100 hover:bg-white/10 hover:text-white font-normal'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-sky-200'}`} />
              <span className="truncate">{displayLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Motto & Laptop Illustration */}
      <div className="px-4 py-4 border-t border-white/10 text-center bg-[#001B44]/60">
        <SidebarBottomLaptopSvg />
        <p className="text-sm italic text-sky-100 leading-snug mt-1">
          Vì một thế hệ học sinh
          <br />
          thành thạo kỹ năng số
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={onCloseMobile} />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
};
