import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type {
  ClassRoom,
  GradeLevel,
  Lesson,
  LessonAttachment,
  UserProfile,
} from '../types/lms';

interface LessonsViewProps {
  currentUser: UserProfile;
  classes: ClassRoom[];
  lessons: Lesson[];
  onCreateLesson: (payload: Partial<Lesson>) => Promise<void>;
  onUpdateLesson: (id: string, payload: Partial<Lesson>) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
}

function toEmbedYoutubeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return url;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  currentUser,
  classes,
  lessons,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
}) => {
  const isTeacher = currentUser.role === 'teacher';

  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');
  const [topicSearch, setTopicSearch] = useState('');
  const [readingLesson, setReadingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [topic, setTopic] = useState('');
  const [lessonNumber, setLessonNumber] = useState('Bài 1');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [newAttName, setNewAttName] = useState('');
  const [newAttType, setNewAttType] = useState<'pdf' | 'pptx' | 'doc'>('pdf');
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (gradeFilter !== 'all' && String(l.grade) !== gradeFilter) return false;
      const q = topicSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.topic.toLowerCase().includes(q) ||
        l.lessonNumber.toLowerCase().includes(q)
      );
    });
  }, [lessons, gradeFilter, topicSearch]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setTitle('');
    setGrade(3);
    setTopic('Chủ đề A: Máy tính và em');
    setLessonNumber('Bài mới');
    setContent('');
    setImageUrl('');
    setVideoUrl('');
    setAttachments([]);
    setTargetClassIds(classes.filter((c) => c.grade === 3).map((c) => c.id));
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (les: Lesson) => {
    setEditingLesson(les);
    setTitle(les.title);
    setGrade(les.grade);
    setTopic(les.topic);
    setLessonNumber(les.lessonNumber);
    setContent(les.content);
    setImageUrl(les.imageUrl || '');
    setVideoUrl(les.videoUrl || '');
    setAttachments(les.attachments || []);
    setTargetClassIds(les.targetClassIds || []);
    setPublished(les.published);
    setModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAttachment = () => {
    if (!newAttName.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: newAttName.trim(),
        fileType: newAttType,
        url: `#tai-lieu-${Date.now()}`,
        sizeLabel: '1,2 MB',
      },
    ]);
    setNewAttName('');
  };

  const handleAttachmentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt')
      ? 'pptx'
      : file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')
        ? 'doc'
        : 'pdf';
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: file.name,
        fileType: ext,
        url: URL.createObjectURL(file),
        sizeLabel: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
      },
    ]);
  };

  const toggleClassTarget = (cid: string) => {
    setTargetClassIds((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Partial<Lesson> = {
      title,
      grade,
      topic,
      lessonNumber,
      content,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl ? toEmbedYoutubeUrl(videoUrl) : undefined,
      attachments,
      targetClassIds,
      published,
    };
    try {
      if (editingLesson) {
        await onUpdateLesson(editingLesson.id, payload);
      } else {
        await onCreateLesson(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#0066CC]" />
            <span>{isTeacher ? 'BÀI GIẢNG VÀ HỌC LIỆU SỐ' : `BÀI GIẢNG LỚP ${currentUser.className}`}</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isTeacher
              ? 'Soạn bài giảng theo khối 3, 4, 5, đính kèm PDF/PowerPoint, hình minh họa, nhúng video và phân quyền xuất bản cho từng lớp.'
              : 'Danh sách các bài học đã được cô giáo xuất bản dành cho lớp của em.'}
          </p>
        </div>

        {isTeacher && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bài giảng mới</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={topicSearch}
          onChange={(e) => setTopicSearch(e.target.value)}
          placeholder="Tìm theo tên bài học hoặc chủ đề (VD: Máy tính và em, Paint, Scratch)..."
          className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:border-[#0066CC] focus:outline-none"
        />
        {isTeacher && (
          <div className="flex items-center gap-1 bg-[#EAF5FF] p-1 rounded-xl">
            {(['all', '3', '4', '5'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer ${
                  gradeFilter === g ? 'bg-[#0066CC] text-white' : 'text-[#003B8E]'
                }`}
              >
                {g === 'all' ? 'Tất cả khối' : `Khối ${g}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lessons Cards Grid */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-sky-100 text-slate-600">
          Chưa có bài giảng nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLessons.map((les) => {
            const assignedClassNames = classes
              .filter((c) => les.targetClassIds.includes(c.id))
              .map((c) => c.name)
              .join(', ');

            return (
              <div
                key={les.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Khối {les.grade} · {les.topic} · {les.lessonNumber}
                    </span>
                    {isTeacher && (
                      <span className={les.published ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {les.published ? 'Đã xuất bản' : 'Đang ẩn (Nháp)'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#003B8E] leading-snug">{les.title}</h3>

                  {les.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-sky-100 bg-[#F8FBFF] max-h-44 flex items-center justify-center">
                      <img
                        src={les.imageUrl}
                        alt={les.title}
                        referrerPolicy="no-referrer"
                        className="max-h-44 w-auto object-contain"
                      />
                    </div>
                  )}

                  <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">
                    {les.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    {les.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[#0066CC] font-bold">
                        <Paperclip className="w-3.5 h-3.5" />
                        {les.attachments.length} tệp đính kèm (PDF/PPTX)
                      </span>
                    )}
                    {les.videoUrl && (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                        <Video className="w-3.5 h-3.5" />
                        Có video bài học
                      </span>
                    )}
                    {isTeacher && (
                      <span>
                        Lớp áp dụng: <strong>{assignedClassNames || 'Tất cả lớp cùng khối'}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setReadingLesson(les)}
                    className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Mở xem bài học</span>
                  </button>

                  {isTeacher && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateLesson(les.id, { published: !les.published })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {les.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{les.published ? 'Ẩn bài' : 'Xuất bản'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(les)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingLesson(les)}
                        className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lesson Reader Modal */}
      {readingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-sky-200">
                  Khối {readingLesson.grade} · {readingLesson.topic} · {readingLesson.lessonNumber}
                </div>
                <h3 className="text-xl font-bold mt-0.5">{readingLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setReadingLesson(null)}
                className="p-1.5 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {readingLesson.imageUrl && (
                <div className="rounded-xl border border-sky-100 bg-[#F8FBFF] p-3 flex justify-center">
                  <img
                    src={readingLesson.imageUrl}
                    alt={readingLesson.title}
                    referrerPolicy="no-referrer"
                    className="max-h-72 object-contain"
                  />
                </div>
              )}

              <div className="prose max-w-none text-base text-slate-800 whitespace-pre-line leading-relaxed bg-[#F8FBFF] p-5 rounded-xl border border-sky-100">
                {readingLesson.content}
              </div>

              {readingLesson.videoUrl && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#003B8E] text-base flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>Video bài giảng minh họa</span>
                  </h4>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <iframe
                      src={toEmbedYoutubeUrl(readingLesson.videoUrl)}
                      title={readingLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {readingLesson.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#003B8E] text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0066CC]" />
                    <span>Tài liệu đính kèm (PDF / PowerPoint)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {readingLesson.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        download={att.name}
                        onClick={(e) => {
                          if (att.url.startsWith('#')) {
                            e.preventDefault();
                            const blob = new Blob(
                              [`Tài liệu môn Tin học - ${readingLesson.title}\nTên tệp: ${att.name}\nGiáo viên: Thị Chành Tha - Trường Tiểu học Thứ Ba.`],
                              { type: 'text/plain;charset=utf-8' }
                            );
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `${att.name}.txt`;
                            link.click();
                          }
                        }}
                        className="p-3 rounded-xl border border-sky-200 bg-[#EAF5FF]/60 hover:bg-[#EAF5FF] flex items-center justify-between text-sm text-[#003B8E]"
                      >
                        <span className="font-bold truncate pr-2">{att.name}</span>
                        <span className="text-xs text-slate-600 shrink-0">{att.sizeLabel}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Lesson Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingLesson ? 'Chỉnh sửa bài giảng & học liệu' : 'Tạo bài giảng mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp *</label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setGrade(g);
                      setTargetClassIds(classes.filter((c) => c.grade === g).map((c) => c.id));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bài học số</label>
                  <input
                    type="text"
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(e.target.value)}
                    placeholder="VD: Bài 3"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={published ? 'published' : 'hidden'}
                    onChange={(e) => setPublished(e.target.value === 'published')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="published">Xuất bản ngay</option>
                    <option value="hidden">Tạm ẩn (Bản nháp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="VD: Chủ đề A: Máy tính và em"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bài giảng *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Bài 3: Các bộ phận máy tính"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp được phép xem bài giảng
                </label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => {
                    const checked = targetClassIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClassTarget(c.id)}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung bài học *</label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập kiến thức trọng tâm, hướng dẫn thực hành..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                    Hình ảnh minh họa (Tải tệp hoặc dán URL)
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Dán đường dẫn ảnh..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs mb-1.5"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="text-xs text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <Video className="w-3.5 h-3.5 inline mr-1" />
                    Nhúng Video học tập (YouTube URL)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Attachments PDF / PowerPoint */}
              <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-sky-100 space-y-2">
                <label className="block text-xs font-bold text-[#003B8E]">
                  Đính kèm tài liệu PDF / PowerPoint
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={newAttName}
                    onChange={(e) => setNewAttName(e.target.value)}
                    placeholder="Tên tài liệu (VD: Bai_giang_Lop3.pptx)"
                    className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <select
                    value={newAttType}
                    onChange={(e) => setNewAttType(e.target.value as 'pdf' | 'pptx' | 'doc')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="pptx">PowerPoint</option>
                    <option value="doc">Word</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-1.5 rounded-lg bg-[#0066CC] text-white text-xs font-bold cursor-pointer"
                  >
                    + Thêm tên tệp
                  </button>
                  <label className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">
                    Chọn tệp máy tính
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={handleAttachmentFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        <span>
                          <strong>[{att.fileType.toUpperCase()}]</strong> {att.name} ({att.sizeLabel})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                          }
                          className="text-red-600 font-bold cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white text-sm font-bold cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : 'Lưu bài giảng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lesson Modal */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">Xác nhận xóa bài giảng</h3>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa bài giảng <strong>{deletingLesson.title}</strong> không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingLesson(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteLesson(deletingLesson.id);
                  setDeletingLesson(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer"
              >
                Xóa bài giảng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
