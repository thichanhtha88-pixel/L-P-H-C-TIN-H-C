import React, { useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Download,
  Edit3,
  FilePlus2,
  Layers,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  Assignment,
  ClassRoom,
  DifficultyLevel,
  GradeLevel,
  Question,
  QuestionType,
} from '../types/lms';
import { exportQuestionsToExcel, parseQuestionsFile } from '../utils/excel';

interface QuestionBankViewProps {
  questions: Question[];
  classes: ClassRoom[];
  onCreateQuestion: (payload: Partial<Question>) => Promise<void>;
  onUpdateQuestion: (id: string, payload: Partial<Question>) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onBulkImportQuestions: (questions: Partial<Question>[]) => Promise<number>;
  onCreateAssignmentFromQuestions: (payload: Partial<Assignment>) => Promise<void>;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  classes,
  onCreateQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onBulkImportQuestions,
  onCreateAssignmentFromQuestions,
}) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | '5'>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | DifficultyLevel>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Add/Edit Question Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [topic, setTopic] = useState('Máy tính và em');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('nhan_biet');
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState(1);
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIds, setCorrectIds] = useState<string[]>(['A']);
  const [acceptedShort, setAcceptedShort] = useState('');
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick Quiz Generator Modal from Selected Questions
  const [quizGenOpen, setQuizGenOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState(15);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (gradeFilter !== 'all' && String(q.grade) !== gradeFilter) return false;
      if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
      const kw = search.trim().toLowerCase();
      if (!kw) return true;
      return q.prompt.toLowerCase().includes(kw) || q.topic.toLowerCase().includes(kw);
    });
  }, [questions, gradeFilter, diffFilter, search]);

  const openAdd = () => {
    setEditingQ(null);
    setGrade(3);
    setTopic('Máy tính và em');
    setDifficulty('nhan_biet');
    setQType('single_choice');
    setPrompt('');
    setPoints(1);
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectIds(['A']);
    setAcceptedShort('');
    setExplanation('');
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingQ(q);
    setGrade(q.grade);
    setTopic(q.topic);
    setDifficulty(q.difficulty);
    setQType(q.type);
    setPrompt(q.prompt);
    setPoints(q.points);
    setOptA(q.options[0]?.text || '');
    setOptB(q.options[1]?.text || '');
    setOptC(q.options[2]?.text || '');
    setOptD(q.options[3]?.text || '');
    setCorrectIds(q.correctOptionIds.length ? q.correctOptionIds : ['A']);
    setAcceptedShort(q.acceptedAnswers.join(' | '));
    setExplanation(q.explanation || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const options =
      qType === 'true_false'
        ? [
            { id: 'TRUE', text: 'Đúng' },
            { id: 'FALSE', text: 'Sai' },
          ]
        : qType === 'single_choice' || qType === 'multiple_choice'
          ? [
              { id: 'A', text: optA || 'Phương án A' },
              { id: 'B', text: optB || 'Phương án B' },
              ...(optC ? [{ id: 'C', text: optC }] : []),
              ...(optD ? [{ id: 'D', text: optD }] : []),
            ]
          : [];

    const payload: Partial<Question> = {
      grade,
      topic,
      difficulty,
      type: qType,
      prompt,
      points,
      options,
      correctOptionIds: qType === 'short_answer' || qType === 'essay' ? [] : correctIds,
      acceptedAnswers:
        qType === 'short_answer'
          ? acceptedShort
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      autoGradeShortAnswer: qType === 'short_answer',
      explanation: explanation || undefined,
    };

    try {
      if (editingQ) {
        await onUpdateQuestion(editingQ.id, payload);
      } else {
        await onCreateQuestion(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const items = await parseQuestionsFile(file);
      const count = await onBulkImportQuestions(items);
      setNotice(`Đã nhập thành công ${count} câu hỏi vào Ngân hàng câu hỏi!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Lỗi đọc tệp câu hỏi.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCreateExamFromSelected = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = questions.filter((q) => selectedIds.includes(q.id));
    if (chosen.length === 0) return;
    const targetGrade = chosen[0].grade;
    const targetCls = classes.filter((c) => c.grade === targetGrade).map((c) => c.id);

    await onCreateAssignmentFromQuestions({
      title: quizTitle || `Bài kiểm tra Tin học Khối ${targetGrade}`,
      grade: targetGrade,
      classIds: targetCls,
      instructions: 'Hoàn thành các câu hỏi được trích xuất từ Ngân hàng câu hỏi.',
      questions: chosen,
      durationMinutes: quizDuration,
      maxAttempts: 2,
      status: targetCls.length > 0 ? 'published' : 'draft',
      allowViewScore: true,
    });
    setQuizGenOpen(false);
    setSelectedIds([]);
    setNotice('Đã tạo và giao bài kiểm tra mới thành công từ các câu hỏi đã chọn!');
  };

  const diffLabel = (d: DifficultyLevel) =>
    d === 'nhan_biet' ? 'Nhận biết' : d === 'thong_hieu' ? 'Thông hiểu' : 'Vận dụng';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#0066CC]" />
            <span>NGÂN HÀNG CÂU HỎI MÔN TIN HỌC ({questions.length} CÂU)</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Phân loại theo khối 3, 4, 5, chủ đề và mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng); tái sử dụng tạo đề thi nhanh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuizTitle(`Bài kiểm tra nhanh (${selectedIds.length} câu)`);
                setQuizGenOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Tạo bài kiểm tra ({selectedIds.length} câu đã chọn)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nhập tệp (.xlsx/.json)</span>
          </button>
          <button
            type="button"
            onClick={() => exportQuestionsToExcel(filteredQuestions)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#003B8E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-bold underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nội dung câu hỏi hoặc chủ đề..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as 'all' | '3' | '4' | '5')}
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
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value as 'all' | DifficultyLevel)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="nhan_biet">Nhận biết</option>
            <option value="thong_hieu">Thông hiểu</option>
            <option value="van_dung">Vận dụng</option>
          </select>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => {
          const checked = selectedIds.includes(q.id);
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex items-start gap-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setSelectedIds((prev) =>
                    prev.includes(q.id) ? prev.filter((x) => x !== q.id) : [...prev, q.id]
                  )
                }
                className="mt-1.5 w-4 h-4 cursor-pointer"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-xs text-slate-500">
                  Câu #{idx + 1} · Khối {q.grade} · {q.topic} · Mức độ:{' '}
                  <strong className="text-[#0066CC]">{diffLabel(q.difficulty)}</strong> · {q.points} điểm
                </div>
                <div className="font-bold text-base text-[#003B8E]">{q.prompt}</div>
                {q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700 pt-1">
                    {q.options.map((o) => {
                      const isRight = q.correctOptionIds.includes(o.id);
                      return (
                        <div
                          key={o.id}
                          className={isRight ? 'font-bold text-emerald-700' : 'text-slate-600'}
                        >
                          {o.id}. {o.text} {isRight ? '✓' : ''}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === 'short_answer' && q.acceptedAnswers.length > 0 && (
                  <div className="text-xs text-emerald-700 font-bold">
                    Đáp án khớp tự động: {q.acceptedAnswers.join(' | ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(q)}
                  className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                  title="Sửa câu hỏi"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteQuestion(q.id)}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#003B8E] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingQ ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi vào Ngân hàng'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Mức độ nhận thức</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="nhan_biet">Nhận biết</option>
                    <option value="thong_hieu">Thông hiểu</option>
                    <option value="van_dung">Vận dụng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Loại câu hỏi</label>
                  <select
                    value={qType}
                    onChange={(e) => {
                      const next = e.target.value as QuestionType;
                      setQType(next);
                      setCorrectIds(next === 'true_false' ? ['TRUE'] : ['A']);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                    <option value="multiple_choice">Nhiều đáp án đúng</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Điền đáp án ngắn</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Chủ đề *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Điểm mặc định</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              {(qType === 'single_choice' || qType === 'multiple_choice') && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#003B8E]">
                    Nhập các phương án và tích chọn đáp án đúng:
                  </div>
                  {[
                    { id: 'A', val: optA, set: setOptA },
                    { id: 'B', val: optB, set: setOptB },
                    { id: 'C', val: optC, set: setOptC },
                    { id: 'D', val: optD, set: setOptD },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type={qType === 'single_choice' ? 'radio' : 'checkbox'}
                        checked={correctIds.includes(item.id)}
                        onChange={() => {
                          if (qType === 'single_choice') setCorrectIds([item.id]);
                          else
                            setCorrectIds((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((x) => x !== item.id)
                                : [...prev, item.id]
                            );
                        }}
                      />
                      <span className="font-bold w-5">{item.id}.</span>
                      <input
                        type="text"
                        value={item.val}
                        onChange={(e) => item.set(e.target.value)}
                        placeholder={`Nội dung đáp án ${item.id}`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === 'true_false' && (
                <div className="flex items-center gap-4 font-bold">
                  <span>Đáp án đúng:</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={correctIds[0] === 'TRUE'}
                      onChange={() => setCorrectIds(['TRUE'])}
                    />
                    <span>Đúng</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={correctIds[0] === 'FALSE'}
                      onChange={() => setCorrectIds(['FALSE'])}
                    />
                    <span>Sai</span>
                  </label>
                </div>
              )}

              {qType === 'short_answer' && (
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Các đáp án đúng chấp nhận (cách nhau bởi dấu | )
                  </label>
                  <input
                    type="text"
                    value={acceptedShort}
                    onChange={(e) => setAcceptedShort(e.target.value)}
                    placeholder="VD: S | Ctrl + S"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">Giải thích đáp án (Tùy chọn)</label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Exam Generator Modal */}
      {quizGenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleCreateExamFromSelected}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-[#003B8E] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              <span>Tạo bài kiểm tra từ {selectedIds.length} câu đã chọn</span>
            </h3>
            <div>
              <label className="block text-xs font-bold mb-1">Tên bài kiểm tra *</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Thời gian làm bài (phút)</label>
              <input
                type="number"
                min={5}
                max={90}
                value={quizDuration}
                onChange={(e) => setQuizDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuizGenOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold cursor-pointer"
              >
                Tạo & Giao bài ngay
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
