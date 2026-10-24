import * as XLSX from 'xlsx';
import type { Question, Student, Submission } from '../types/lms';

export function exportStudentsToExcel(students: Student[]): void {
  const rows = students.map((s, idx) => ({
    STT: idx + 1,
    'Mã học sinh': s.studentCode,
    'Họ và tên': s.fullName,
    Lớp: s.className,
    Khối: `Khối ${s.grade}`,
    'Năm học': s.academicYear,
    'Tài khoản đăng nhập': s.username,
    'Trạng thái':
      s.status === 'active'
        ? 'Đang học'
        : s.status === 'paused'
          ? 'Tạm nghỉ'
          : 'Chuyển trường',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
  XLSX.writeFile(wb, `Danh_sach_hoc_sinh_Tin_hoc_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadStudentImportTemplate(): void {
  const sample = [
    {
      'Mã học sinh': 'HS3A06',
      'Họ và tên': 'Nguyễn Minh Khang',
      Lớp: '3A',
      'Năm học': '2026 - 2027',
    },
    {
      'Mã học sinh': 'HS4A06',
      'Họ và tên': 'Thị Yến Nhi',
      Lớp: '4A',
      'Năm học': '2026 - 2027',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MauNhapHocSinh');
  XLSX.writeFile(wb, 'Mau_nhap_hoc_sinh_Tin_hoc.xlsx');
}

export async function parseStudentsExcelFile(
  file: File
): Promise<Array<{ studentCode: string; fullName: string; className: string; academicYear?: string }>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rawRows
    .map((r) => {
      const studentCode = String(
        r['Mã học sinh'] ?? r['Ma hoc sinh'] ?? r['studentCode'] ?? r['Mã HS'] ?? ''
      ).trim();
      const fullName = String(
        r['Họ và tên'] ?? r['Ho va ten'] ?? r['fullName'] ?? r['Họ tên'] ?? ''
      ).trim();
      const className = String(
        r['Lớp'] ?? r['Lop'] ?? r['className'] ?? r['Tên lớp'] ?? ''
      ).trim();
      const academicYear = String(
        r['Năm học'] ?? r['Nam hoc'] ?? r['academicYear'] ?? '2026 - 2027'
      ).trim();
      return { studentCode, fullName, className, academicYear };
    })
    .filter((item) => item.studentCode || item.fullName);
}

export function exportSubmissionsToExcel(submissions: Submission[]): void {
  const rows = submissions.map((s, idx) => ({
    STT: idx + 1,
    'Mã học sinh': s.studentCode,
    'Họ và tên': s.studentName,
    Lớp: s.className,
    'Tên bài tập': s.assignmentTitle,
    'Số câu đúng': s.correctCount,
    'Tổng số câu': s.totalQuestions,
    'Điểm số (Thang 10)': s.score10 >= 0 ? s.score10 : 'Đang ẩn',
    'Lần làm': s.attemptNumber,
    'Thời gian nộp': new Date(s.submittedAt).toLocaleString('vi-VN'),
    'Trạng thái': s.gradingStatus === 'graded' ? 'Đã chấm xong' : 'Chờ chấm tự luận',
    'Nhận xét giáo viên': s.teacherFeedback || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KetQuaHocTap');
  XLSX.writeFile(wb, `Ket_qua_hoc_tap_Tin_hoc_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportQuestionsToExcel(questions: Question[]): void {
  const rows = questions.map((q, idx) => ({
    STT: idx + 1,
    'Khối lớp': q.grade,
    'Chủ đề': q.topic,
    'Mức độ':
      q.difficulty === 'nhan_biet'
        ? 'Nhận biết'
        : q.difficulty === 'thong_hieu'
          ? 'Thông hiểu'
          : 'Vận dụng',
    'Loại câu hỏi': q.type,
    'Nội dung câu hỏi': q.prompt,
    'Đáp án A': q.options[0]?.text || '',
    'Đáp án B': q.options[1]?.text || '',
    'Đáp án C': q.options[2]?.text || '',
    'Đáp án D': q.options[3]?.text || '',
    'Đáp án đúng':
      q.type === 'short_answer'
        ? q.acceptedAnswers.join(' | ')
        : q.correctOptionIds.join(','),
    Điểm: q.points,
    'Giải thích': q.explanation || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'NganHangCauHoi');
  XLSX.writeFile(wb, `Ngan_hang_cau_hoi_Tin_hoc_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function parseQuestionsFile(file: File): Promise<Partial<Question>[]> {
  if (file.name.toLowerCase().endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  }
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return raw.map((r) => {
    const rawDiff = String(r['Mức độ'] ?? r['difficulty'] ?? '').toLowerCase();
    const difficulty = rawDiff.includes('vận')
      ? 'van_dung'
      : rawDiff.includes('hiểu')
        ? 'thong_hieu'
        : 'nhan_biet';
    const typeRaw = String(r['Loại câu hỏi'] ?? r['type'] ?? 'single_choice') as Question['type'];
    const optA = String(r['Đáp án A'] ?? '').trim();
    const optB = String(r['Đáp án B'] ?? '').trim();
    const optC = String(r['Đáp án C'] ?? '').trim();
    const optD = String(r['Đáp án D'] ?? '').trim();
    const options =
      typeRaw === 'true_false'
        ? [
            { id: 'TRUE', text: 'Đúng' },
            { id: 'FALSE', text: 'Sai' },
          ]
        : [
            optA ? { id: 'A', text: optA } : null,
            optB ? { id: 'B', text: optB } : null,
            optC ? { id: 'C', text: optC } : null,
            optD ? { id: 'D', text: optD } : null,
          ].filter(Boolean) as Question['options'];

    const ansStr = String(r['Đáp án đúng'] ?? 'A').trim();
    return {
      grade: Number(r['Khối lớp'] ?? r['grade'] ?? 3) as 3 | 4 | 5,
      topic: String(r['Chủ đề'] ?? r['topic'] ?? 'Tin học tiểu học'),
      difficulty,
      type: typeRaw,
      prompt: String(r['Nội dung câu hỏi'] ?? r['prompt'] ?? ''),
      options,
      correctOptionIds: typeRaw === 'short_answer' ? [] : ansStr.split(',').map((x) => x.trim().toUpperCase()),
      acceptedAnswers: typeRaw === 'short_answer' ? ansStr.split('|').map((x) => x.trim()) : [],
      autoGradeShortAnswer: typeRaw === 'short_answer',
      points: Number(r['Điểm'] ?? r['points'] ?? 1),
      explanation: String(r['Giải thích'] ?? r['explanation'] ?? ''),
    };
  });
}
