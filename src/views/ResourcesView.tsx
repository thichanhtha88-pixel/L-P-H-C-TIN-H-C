import React, { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Monitor,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type { GradeLevel, ResourceCategory, ResourceItem, UserProfile } from '../types/lms';

interface ResourcesViewProps {
  currentUser: UserProfile;
  resources: ResourceItem[];
  onCreateResource: (payload: Partial<ResourceItem>) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  image: 'Hình ảnh học tập',
  video: 'Video bài giảng',
  pdf: 'Tài liệu PDF',
  pptx: 'Bài trình chiếu PowerPoint',
  practice: 'Tài liệu thực hành',
  software_guide: 'Hướng dẫn sử dụng phần mềm',
};

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  currentUser,
  resources,
  onCreateResource,
  onDeleteResource,
}) => {
  const isTeacher = currentUser.role === 'teacher';
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | ResourceCategory>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');

  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('pdf');
  const [grade, setGrade] = useState<GradeLevel | 'all'>('all');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [accessLevel, setAccessLevel] = useState<'all' | 'teacher_only'>('all');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      if (gradeFilter !== 'all' && r.grade !== 'all' && String(r.grade) !== gradeFilter)
        return false;
      const kw = search.trim().toLowerCase();
      if (!kw) return true;
      return (
        r.title.toLowerCase().includes(kw) || r.description.toLowerCase().includes(kw)
      );
    });
  }, [resources, catFilter, gradeFilter, search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreateResource({
        title,
        category,
        grade,
        description,
        url: url || '#tai-nguyen',
        fileFormat: CATEGORY_LABELS[category],
        accessLevel,
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setUrl('');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadResource = (res: ResourceItem) => {
    if (res.url && !res.url.startsWith('#')) {
      const a = document.createElement('a');
      a.href = res.url;
      a.download = res.title;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.click();
      return;
    }
    const content = `TÀI NGUYÊN MÔN TIN HỌC - TRƯỜNG TIỂU HỌC THỨ BA\nTiêu đề: ${res.title}\nPhân loại: ${CATEGORY_LABELS[res.category]}\nMô tả: ${res.description}\nGiáo viên biên soạn: Thị Chành Tha`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${res.title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#0066CC]" />
            <span>THƯ VIỆN TÀI NGUYÊN SỐ</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Kho lưu trữ hình ảnh, video, PDF, PowerPoint, phiếu thực hành và hướng dẫn sử dụng phần mềm Tin học tiểu học.
          </p>
        </div>

        {isTeacher && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài nguyên</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tài liệu, phần mềm Paint, Scratch, RapidTyping..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as 'all' | ResourceCategory)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">Tất cả loại tài nguyên</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as 'all' | '3' | '4' | '5')}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">Mọi khối lớp</option>
            <option value="3">Khối 3</option>
            <option value="4">Khối 4</option>
            <option value="5">Khối 5</option>
          </select>
        </div>
      </div>

      {/* Resource Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 border border-sky-100">
          Không tìm thấy tài nguyên nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((res) => {
            const Icon =
              res.category === 'image'
                ? ImageIcon
                : res.category === 'video'
                  ? Video
                  : res.category === 'software_guide'
                    ? Monitor
                    : FileText;

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {CATEGORY_LABELS[res.category]} ·{' '}
                      {res.grade === 'all' ? 'Dùng chung' : `Khối ${res.grade}`}
                    </span>
                    {isTeacher && (
                      <span
                        className={
                          res.accessLevel === 'teacher_only'
                            ? 'text-amber-700 font-bold'
                            : 'text-emerald-700 font-bold'
                        }
                      >
                        {res.accessLevel === 'teacher_only' ? 'Chỉ GV' : 'GV & HS'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF5FF] text-[#0066CC] flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#003B8E] leading-snug">
                        {res.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{res.description}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(res)}
                      className="px-3 py-1.5 rounded-xl bg-[#EAF5FF] hover:bg-sky-200 text-[#003B8E] font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(res)}
                      className="px-3 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về</span>
                    </button>
                  </div>

                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => onDeleteResource(res.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                      title="Xóa tài nguyên"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Resource Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">{previewItem.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewItem.url.startsWith('data:image') && (
                <div className="rounded-xl border border-sky-100 bg-[#F8FBFF] p-3 flex justify-center">
                  <img
                    src={previewItem.url}
                    alt={previewItem.title}
                    className="max-h-72 object-contain"
                  />
                </div>
              )}
              {previewItem.category === 'video' && previewItem.url.startsWith('http') && (
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <iframe
                    src={previewItem.url}
                    title={previewItem.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              <p className="text-sm text-slate-700 leading-relaxed">{previewItem.description}</p>
              <div className="text-xs text-slate-500">
                Định dạng: {previewItem.fileFormat} · Ngày đăng:{' '}
                {new Date(previewItem.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#003B8E]">Thêm tài nguyên mới</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Tiêu đề tài nguyên *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Loại tài nguyên</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={(e) =>
                    setGrade(
                      e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel)
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="all">Tất cả khối</option>
                  <option value={3}>Khối 3</option>
                  <option value={4}>Khối 4</option>
                  <option value={5}>Khối 5</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Quyền truy cập</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as 'all' | 'teacher_only')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">Giáo viên và Học sinh</option>
                <option value="teacher_only">Chỉ Giáo viên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Đường dẫn tệp / Video URL (Tùy chọn)</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Mô tả ngắn</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
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
                className="px-5 py-2 rounded-xl bg-[#0066CC] text-white font-bold cursor-pointer"
              >
                {saving ? 'Đang lưu...' : 'Lưu tài nguyên'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
