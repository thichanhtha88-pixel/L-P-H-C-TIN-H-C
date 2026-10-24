import crypto from 'node:crypto';
import type {
  Assignment,
  ClassRoom,
  GameRecord,
  Lesson,
  NotificationItem,
  Question,
  ResourceItem,
  Student,
  Submission,
  SystemSettings,
  UserProfile,
} from '../src/types/lms.ts';

export interface StoredAccount extends UserProfile {
  passwordSalt: string;
  passwordHash: string;
}

export interface DatabaseState {
  settings: SystemSettings;
  users: StoredAccount[];
  classes: ClassRoom[];
  students: Student[];
  lessons: Lesson[];
  questions: Question[];
  assignments: Assignment[];
  submissions: Submission[];
  resources: ResourceItem[];
  notifications: NotificationItem[];
  gameRecords: GameRecord[];
}

export function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const ILLUSTRATION_DESKTOP_PC = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340">
  <rect width="600" height="340" rx="20" fill="#EAF5FF"/>
  <rect x="140" y="36" width="230" height="150" rx="12" fill="#003B8E"/>
  <rect x="152" y="48" width="206" height="120" rx="6" fill="#38BDF8"/>
  <circle cx="255" cy="108" r="32" fill="#FFF" opacity="0.9"/>
  <text x="255" y="115" text-anchor="middle" font-family="Times New Roman" font-size="18" font-weight="bold" fill="#003B8E">Màn hình</text>
  <rect x="235" y="186" width="40" height="28" fill="#64748B"/>
  <rect x="200" y="212" width="110" height="10" rx="5" fill="#475569"/>
  <rect x="405" y="42" width="95" height="180" rx="10" fill="#1E293B"/>
  <circle cx="452" cy="80" r="10" fill="#22C55E"/>
  <rect x="425" y="108" width="55" height="8" rx="4" fill="#64748B"/>
  <text x="452" y="165" text-anchor="middle" font-family="Times New Roman" font-size="15" font-weight="bold" fill="#FFF">Thân máy</text>
  <rect x="120" y="245" width="250" height="52" rx="8" fill="#334155"/>
  <text x="245" y="276" text-anchor="middle" font-family="Times New Roman" font-size="17" font-weight="bold" fill="#FFF">Bàn phím</text>
  <ellipse cx="425" cy="272" rx="26" ry="34" fill="#0066CC"/>
  <line x1="425" y1="238" x2="425" y2="265" stroke="#FFF" stroke-width="3"/>
  <text x="490" y="278" font-family="Times New Roman" font-size="17" font-weight="bold" fill="#003B8E">Chuột</text>
</svg>
`);

export const ILLUSTRATION_PAINT_TOOLS = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320">
  <rect width="600" height="320" rx="20" fill="#FFF8E7"/>
  <rect x="30" y="25" width="540" height="54" rx="10" fill="#0066CC"/>
  <text x="300" y="59" text-anchor="middle" font-family="Times New Roman" font-size="22" font-weight="bold" fill="#FFFFFF">THANH CÔNG CỤ PHẦN MỀM VẼ PAINT</text>
  <g transform="translate(55, 105)">
    <rect width="110" height="110" rx="14" fill="#FFFFFF" stroke="#2196F3" stroke-width="3"/>
    <path d="M35 80 L75 30 L85 40 L45 90 Z" fill="#FFC107" stroke="#003B8E" stroke-width="2"/>
    <text x="55" y="138" text-anchor="middle" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#003B8E">Bút chì (A)</text>
  </g>
  <g transform="translate(190, 105)">
    <rect width="110" height="110" rx="14" fill="#FFFFFF" stroke="#2196F3" stroke-width="3"/>
    <ellipse cx="55" cy="52" rx="26" ry="20" fill="#22C55E"/>
    <path d="M32 52 L40 85 L70 85 L78 52 Z" fill="#0066CC"/>
    <text x="55" y="138" text-anchor="middle" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#003B8E">Tô màu (B)</text>
  </g>
  <g transform="translate(325, 105)">
    <rect width="110" height="110" rx="14" fill="#FFFFFF" stroke="#2196F3" stroke-width="3"/>
    <rect x="32" y="38" width="46" height="34" rx="5" fill="#F472B6" stroke="#9D174D" stroke-width="2"/>
    <text x="55" y="138" text-anchor="middle" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#003B8E">Cục tẩy (C)</text>
  </g>
  <g transform="translate(460, 105)">
    <rect width="90" height="110" rx="14" fill="#FFFFFF" stroke="#2196F3" stroke-width="3"/>
    <text x="45" y="72" text-anchor="middle" font-family="Times New Roman" font-size="48" font-weight="bold" fill="#003B8E">A</text>
    <text x="45" y="138" text-anchor="middle" font-family="Times New Roman" font-size="16" font-weight="bold" fill="#003B8E">Viết chữ (D)</text>
  </g>
</svg>
`);

export const ILLUSTRATION_SCRATCH_BLOCKS = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320">
  <rect width="600" height="320" rx="20" fill="#F3E8FF"/>
  <text x="300" y="46" text-anchor="middle" font-family="Times New Roman" font-size="22" font-weight="bold" fill="#003B8E">CHƯƠNG TRÌNH SCRATCH CỦA CHÚ MÈO</text>
  <rect x="130" y="75" width="340" height="52" rx="12" fill="#FFBF00" stroke="#D97706" stroke-width="2"/>
  <text x="300" y="107" text-anchor="middle" font-family="Times New Roman" font-size="20" font-weight="bold" fill="#1E293B">Khi bấm vào Lá cờ xanh</text>
  <rect x="130" y="135" width="340" height="50" rx="10" fill="#4C97FF" stroke="#1D4ED8" stroke-width="2"/>
  <text x="300" y="166" text-anchor="middle" font-family="Times New Roman" font-size="20" font-weight="bold" fill="#FFFFFF">Di chuyển 50 bước</text>
  <rect x="130" y="193" width="340" height="50" rx="10" fill="#9966FF" stroke="#6D28D9" stroke-width="2"/>
  <text x="300" y="224" text-anchor="middle" font-family="Times New Roman" font-size="20" font-weight="bold" fill="#FFFFFF">Nói "Xin chào Tin học 5!" trong 2 giây</text>
</svg>
`);

export function createEmptyWorkspaceState(): DatabaseState {
  const teacherPass = hashPassword('Gv@123456', 'teacher_static_salt_2026');
  const settings: SystemSettings = {
    schoolName: 'TRƯỜNG TIỂU HỌC THỨ BA',
    teacherName: 'Thị Chành Tha',
    teacherEmail: 'thichanhtha88@gmail.com',
    slogan: 'Đồng hành cùng học sinh khám phá thế giới số',
    academicYear: '2026 - 2027',
    defaultDurationMinutes: 15,
    allowStudentsViewResults: true,
    recordGameScores: true,
    dataMode: 'workspace',
  };

  const teacherUser: StoredAccount = {
    id: 'usr-teacher-1',
    username: 'thichanhtha',
    fullName: 'Thị Chành Tha',
    role: 'teacher',
    schoolName: 'TRƯỜNG TIỂU HỌC THỨ BA',
    email: 'thichanhtha88@gmail.com',
    academicYear: '2026 - 2027',
    passwordSalt: teacherPass.salt,
    passwordHash: teacherPass.hash,
  };

  return {
    settings,
    users: [teacherUser],
    classes: [],
    students: [],
    lessons: [],
    questions: [],
    assignments: [],
    submissions: [],
    resources: [],
    notifications: [],
    gameRecords: [],
  };
}

export function createDemoSeedState(): DatabaseState {
  const teacherPass = hashPassword('Gv@123456', 'demo_teacher_salt_2026');
  const studentPass = hashPassword('Hs@123456', 'demo_student_salt_2026');

  const settings: SystemSettings = {
    schoolName: 'TRƯỜNG TIỂU HỌC THỨ BA',
    teacherName: 'Thị Chành Tha',
    teacherEmail: 'thichanhtha88@gmail.com',
    slogan: 'Đồng hành cùng học sinh khám phá thế giới số',
    academicYear: '2026 - 2027',
    defaultDurationMinutes: 15,
    allowStudentsViewResults: true,
    recordGameScores: true,
    dataMode: 'demo',
  };

  const classes: ClassRoom[] = [
    { id: 'cls-3a', code: 'TIN-3A', name: '3A', grade: 3, academicYear: '2026 - 2027', teacherName: 'Thị Chành Tha', createdAt: '2026-09-05T08:00:00.000Z' },
    { id: 'cls-3b', code: 'TIN-3B', name: '3B', grade: 3, academicYear: '2026 - 2027', teacherName: 'Thị Chành Tha', createdAt: '2026-09-05T08:05:00.000Z' },
    { id: 'cls-4a', code: 'TIN-4A', name: '4A', grade: 4, academicYear: '2026 - 2027', teacherName: 'Thị Chành Tha', createdAt: '2026-09-05T08:10:00.000Z' },
    { id: 'cls-5a', code: 'TIN-5A', name: '5A', grade: 5, academicYear: '2026 - 2027', teacherName: 'Thị Chành Tha', createdAt: '2026-09-05T08:15:00.000Z' },
    { id: 'cls-5b', code: 'TIN-5B', name: '5B', grade: 5, academicYear: '2026 - 2027', teacherName: 'Thị Chành Tha', createdAt: '2026-09-05T08:20:00.000Z' },
  ];

  const rawStudents: Array<{ code: string; name: string; classId: string; className: string; grade: 3 | 4 | 5 }> = [
    { code: 'HS3A01', name: 'Danh Minh Khôi', classId: 'cls-3a', className: '3A', grade: 3 },
    { code: 'HS3A02', name: 'Thị Ngọc Hân', classId: 'cls-3a', className: '3A', grade: 3 },
    { code: 'HS3A03', name: 'Nguyễn Hoàng Bảo', classId: 'cls-3a', className: '3A', grade: 3 },
    { code: 'HS3A04', name: 'Trần Thảo My', classId: 'cls-3a', className: '3A', grade: 3 },
    { code: 'HS3A05', name: 'Lê Gia Hưng', classId: 'cls-3a', className: '3A', grade: 3 },

    { code: 'HS3B01', name: 'Phạm Tuấn Kiệt', classId: 'cls-3b', className: '3B', grade: 3 },
    { code: 'HS3B02', name: 'Thị Kim Ngân', classId: 'cls-3b', className: '3B', grade: 3 },
    { code: 'HS3B03', name: 'Huỳnh Quốc Đạt', classId: 'cls-3b', className: '3B', grade: 3 },
    { code: 'HS3B04', name: 'Võ Thiên Kim', classId: 'cls-3b', className: '3B', grade: 3 },
    { code: 'HS3B05', name: 'Danh Thanh Tùng', classId: 'cls-3b', className: '3B', grade: 3 },

    { code: 'HS4A01', name: 'Nguyễn Minh Thư', classId: 'cls-4a', className: '4A', grade: 4 },
    { code: 'HS4A02', name: 'Danh Hoàng Phúc', classId: 'cls-4a', className: '4A', grade: 4 },
    { code: 'HS4A03', name: 'Thị Bảo Trân', classId: 'cls-4a', className: '4A', grade: 4 },
    { code: 'HS4A04', name: 'Trương Anh Tuấn', classId: 'cls-4a', className: '4A', grade: 4 },
    { code: 'HS4A05', name: 'Lâm Khánh Vy', classId: 'cls-4a', className: '4A', grade: 4 },

    { code: 'HS5A01', name: 'Đặng Gia Bảo', classId: 'cls-5a', className: '5A', grade: 5 },
    { code: 'HS5A02', name: 'Thị Mai Phương', classId: 'cls-5a', className: '5A', grade: 5 },
    { code: 'HS5A03', name: 'Bùi Nhật Minh', classId: 'cls-5a', className: '5A', grade: 5 },
    { code: 'HS5A04', name: 'Ngô Thanh Hà', classId: 'cls-5a', className: '5A', grade: 5 },
    { code: 'HS5A05', name: 'Danh Quốc Huy', classId: 'cls-5a', className: '5A', grade: 5 },

    { code: 'HS5B01', name: 'Trần Khánh Linh', classId: 'cls-5b', className: '5B', grade: 5 },
    { code: 'HS5B02', name: 'Lý Minh Quân', classId: 'cls-5b', className: '5B', grade: 5 },
    { code: 'HS5B03', name: 'Thị Hồng Nhung', classId: 'cls-5b', className: '5B', grade: 5 },
    { code: 'HS5B04', name: 'Phan Đức Anh', classId: 'cls-5b', className: '5B', grade: 5 },
    { code: 'HS5B05', name: 'Hồ Phương Thảo', classId: 'cls-5b', className: '5B', grade: 5 },
  ];

  const students: Student[] = rawStudents.map((s, idx) => ({
    id: `stu-${idx + 1}`,
    studentCode: s.code,
    fullName: s.name,
    classId: s.classId,
    className: s.className,
    grade: s.grade,
    academicYear: '2026 - 2027',
    username: s.code.toLowerCase(),
    status: 'active',
    createdAt: '2026-09-06T08:00:00.000Z',
  }));

  const users: StoredAccount[] = [
    {
      id: 'usr-teacher-1',
      username: 'thichanhtha',
      fullName: 'Thị Chành Tha',
      role: 'teacher',
      schoolName: 'TRƯỜNG TIỂU HỌC THỨ BA',
      email: 'thichanhtha88@gmail.com',
      academicYear: '2026 - 2027',
      passwordSalt: teacherPass.salt,
      passwordHash: teacherPass.hash,
    },
    ...students.map((stu) => ({
      id: `usr-${stu.id}`,
      username: stu.username,
      fullName: stu.fullName,
      role: 'student' as const,
      schoolName: 'TRƯỜNG TIỂU HỌC THỨ BA',
      studentId: stu.id,
      studentCode: stu.studentCode,
      classId: stu.classId,
      className: stu.className,
      grade: stu.grade,
      academicYear: stu.academicYear,
      passwordSalt: studentPass.salt,
      passwordHash: studentPass.hash,
    })),
  ];

  // 10 Questions for "Máy tính và em" (Lớp 3) + 12 additional questions for Khối 3, 4, 5
  const questionsG3MayTinh: Question[] = [
    {
      id: 'q-301',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'nhan_biet',
      prompt: 'Một bộ máy tính để bàn cơ bản gồm mấy thành phần chính?',
      imageUrl: ILLUSTRATION_DESKTOP_PC,
      options: [
        { id: 'A', text: '2 thành phần' },
        { id: 'B', text: '3 thành phần' },
        { id: 'C', text: '4 thành phần (Màn hình, Thân máy, Bàn phím, Chuột)' },
        { id: 'D', text: '5 thành phần' },
      ],
      correctOptionIds: ['C'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Máy tính để bàn gồm 4 bộ phận cơ bản: Màn hình, Thân máy, Bàn phím và Chuột.',
      createdAt: '2026-09-10T08:00:00.000Z',
    },
    {
      id: 'q-302',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'nhan_biet',
      prompt: 'Bộ phận nào của máy tính dùng để hiển thị hình ảnh, chữ viết và kết quả làm việc?',
      options: [
        { id: 'A', text: 'Bàn phím' },
        { id: 'B', text: 'Màn hình' },
        { id: 'C', text: 'Chuột máy tính' },
        { id: 'D', text: 'Thân máy' },
      ],
      correctOptionIds: ['B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Màn hình là thiết bị đưa thông tin ra dưới dạng hình ảnh và văn bản.',
      createdAt: '2026-09-10T08:05:00.000Z',
    },
    {
      id: 'q-303',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'nhan_biet',
      prompt: 'Bộ phận nào được ví như "bộ não" điều khiển mọi hoạt động của máy tính?',
      options: [
        { id: 'A', text: 'Thân máy (chứa bộ xử lý CPU)' },
        { id: 'B', text: 'Loa máy tính' },
        { id: 'C', text: 'Chuột máy tính' },
        { id: 'D', text: 'Tấm lót chuột' },
      ],
      correctOptionIds: ['A'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Thân máy chứa bộ xử lý trung tâm (CPU) đóng vai trò bộ não xử lý thông tin.',
      createdAt: '2026-09-10T08:10:00.000Z',
    },
    {
      id: 'q-304',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'thong_hieu',
      prompt: 'Khi ngồi học với máy tính, khoảng cách hợp lý từ mắt em đến màn hình là bao nhiêu?',
      options: [
        { id: 'A', text: 'Từ 10 cm đến 20 cm' },
        { id: 'B', text: 'Từ 50 cm đến 80 cm' },
        { id: 'C', text: 'Sát vào màn hình' },
        { id: 'D', text: 'Trên 2 mét' },
      ],
      correctOptionIds: ['B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Khoảng cách an toàn từ mắt đến màn hình là khoảng 50 cm đến 80 cm để bảo vệ thị lực.',
      createdAt: '2026-09-10T08:15:00.000Z',
    },
    {
      id: 'q-305',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'nhan_biet',
      prompt: 'Hai phím có gai trên hàng phím cơ sở của bàn phím là hai phím nào?',
      options: [
        { id: 'A', text: 'Phím A và phím S' },
        { id: 'B', text: 'Phím G và phím H' },
        { id: 'C', text: 'Phím F và phím J' },
        { id: 'D', text: 'Phím K và phím L' },
      ],
      correctOptionIds: ['C'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Hai phím F và J có gai nhỏ giúp định vị hai ngón trỏ khi gõ bàn phím bằng 10 ngón.',
      createdAt: '2026-09-10T08:20:00.000Z',
    },
    {
      id: 'q-306',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'thong_hieu',
      prompt: 'Thao tác nhấn nhanh nút trái chuột hai lần liên tiếp rồi thả ra gọi là gì?',
      options: [
        { id: 'A', text: 'Nháy chuột' },
        { id: 'B', text: 'Nháy nút phải chuột' },
        { id: 'C', text: 'Nháy đúp chuột' },
        { id: 'D', text: 'Kéo thả chuột' },
      ],
      correctOptionIds: ['C'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Nhấn nhanh hai lần liên tiếp nút trái chuột gọi là nháy đúp chuột (Double click).',
      createdAt: '2026-09-10T08:25:00.000Z',
    },
    {
      id: 'q-307',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'thong_hieu',
      prompt: 'Hành động nào sau đây ĐẢM BẢO AN TOÀN điện khi sử dụng máy tính?',
      options: [
        { id: 'A', text: 'Dùng tay ướt cắm phích điện máy tính' },
        { id: 'B', text: 'Báo ngay cho thầy cô hoặc người lớn khi thấy dây điện bị hở' },
        { id: 'C', text: 'Tự ý tháo nắp thân máy khi đang bật điện' },
        { id: 'D', text: 'Để cốc nước sát cạnh bàn phím máy tính' },
      ],
      correctOptionIds: ['B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Tuyệt đối không tự chạm vào dây điện hở, cần báo ngay cho giáo viên hoặc người lớn.',
      createdAt: '2026-09-10T08:30:00.000Z',
    },
    {
      id: 'q-308',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'nhan_biet',
      prompt: 'Thiết bị nào giúp em điều khiển con trỏ mũi tên trên màn hình nhanh chóng?',
      options: [
        { id: 'A', text: 'Chuột máy tính' },
        { id: 'B', text: 'Loa nghe nhạc' },
        { id: 'C', text: 'Máy in' },
        { id: 'D', text: 'Ổ cắm điện' },
      ],
      correctOptionIds: ['A'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Chuột máy tính giúp điều khiển con trỏ chọn biểu tượng trên màn hình.',
      createdAt: '2026-09-10T08:35:00.000Z',
    },
    {
      id: 'q-309',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'van_dung',
      prompt: 'Để tắt máy tính đúng cách trên hệ điều hành Windows, em chọn lệnh nào trong bảng chọn Start?',
      options: [
        { id: 'A', text: 'Rút trực tiếp dây nguồn' },
        { id: 'B', text: 'Chọn Power -> Shut down' },
        { id: 'C', text: 'Tắt riêng nút màn hình rồi ra về' },
        { id: 'D', text: 'Nhấn liên tục phím Space' },
      ],
      correctOptionIds: ['B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Chọn Start -> Power -> Shut down giúp hệ điều hành lưu trạng thái và tắt an toàn.',
      createdAt: '2026-09-10T08:40:00.000Z',
    },
    {
      id: 'q-310',
      type: 'single_choice',
      grade: 3,
      topic: 'Máy tính và em',
      difficulty: 'thong_hieu',
      prompt: 'Đâu là các dạng thông tin thường gặp mà máy tính có thể xử lý?',
      options: [
        { id: 'A', text: 'Chỉ có chữ viết' },
        { id: 'B', text: 'Chỉ có âm thanh' },
        { id: 'C', text: 'Văn bản (chữ, số), hình ảnh và âm thanh' },
        { id: 'D', text: 'Mùi hương và vị giác' },
      ],
      correctOptionIds: ['C'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 1,
      explanation: 'Ba dạng thông tin phổ biến trên máy tính là văn bản, hình ảnh và âm thanh.',
      createdAt: '2026-09-10T08:45:00.000Z',
    },
  ];

  const extraQuestions: Question[] = [
    {
      id: 'q-311',
      type: 'single_choice',
      grade: 3,
      topic: 'Phần mềm Paint',
      difficulty: 'nhan_biet',
      prompt: 'Quan sát hình minh họa thanh công cụ Paint, biểu tượng (B) dùng để làm gì?',
      imageUrl: ILLUSTRATION_PAINT_TOOLS,
      options: [
        { id: 'A', text: 'Vẽ đường thẳng' },
        { id: 'B', text: 'Tô màu cho vùng khép kín (Fill with color)' },
        { id: 'C', text: 'Xóa chi tiết tranh vẽ' },
        { id: 'D', text: 'Gõ chữ vào tranh' },
      ],
      correctOptionIds: ['B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2.5,
      explanation: 'Hình chiếc xô đổ sơn (B) là công cụ Tô màu (Fill with color).',
      createdAt: '2026-09-15T08:00:00.000Z',
    },
    {
      id: 'q-312',
      type: 'true_false',
      grade: 3,
      topic: 'Phần mềm Paint',
      difficulty: 'thong_hieu',
      prompt: 'Trong phần mềm Paint, tổ hợp phím Ctrl + Z giúp em quay lại (Hoàn tác) thao tác vẽ vừa thực hiện sai.',
      options: [
        { id: 'TRUE', text: 'Đúng' },
        { id: 'FALSE', text: 'Sai' },
      ],
      correctOptionIds: ['TRUE'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2.5,
      explanation: 'Ctrl + Z là phím tắt Undo giúp hoàn tác bước vừa vẽ.',
      createdAt: '2026-09-15T08:05:00.000Z',
    },
    {
      id: 'q-313',
      type: 'multiple_choice',
      grade: 3,
      topic: 'Phần mềm Paint',
      difficulty: 'thong_hieu',
      prompt: 'Chọn TẤT CẢ các công cụ có sẵn trong hộp công cụ của phần mềm vẽ Paint:',
      options: [
        { id: 'A', text: 'Bút chì (Pencil)' },
        { id: 'B', text: 'Cục tẩy (Eraser)' },
        { id: 'C', text: 'Tô màu (Fill with color)' },
        { id: 'D', text: 'Máy giặt quần áo' },
      ],
      correctOptionIds: ['A', 'B', 'C'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2.5,
      explanation: 'Paint cung cấp Bút chì, Cục tẩy, Tô màu, Viết chữ và các hình mẫu.',
      createdAt: '2026-09-15T08:10:00.000Z',
    },
    {
      id: 'q-314',
      type: 'short_answer',
      grade: 3,
      topic: 'Phần mềm Paint',
      difficulty: 'van_dung',
      prompt: 'Để lưu bức tranh đang vẽ trong Paint bằng bàn phím, em nhấn tổ hợp phím Ctrl + phím chữ cái nào? (Chỉ điền 1 chữ cái)',
      options: [],
      correctOptionIds: [],
      acceptedAnswers: ['S', 's', 'Ctrl + S', 'ctrl+s'],
      autoGradeShortAnswer: true,
      points: 2.5,
      explanation: 'Nhấn Ctrl + S (Save) để lưu tệp hình vẽ vào máy tính.',
      createdAt: '2026-09-15T08:15:00.000Z',
    },
    // Grade 4 Questions
    {
      id: 'q-401',
      type: 'single_choice',
      grade: 4,
      topic: 'Internet và tìm kiếm thông tin',
      difficulty: 'nhan_biet',
      prompt: 'Phần mềm nào sau đây là trình duyệt web dùng để truy cập Internet?',
      options: [
        { id: 'A', text: 'Google Chrome' },
        { id: 'B', text: 'Microsoft Paint' },
        { id: 'C', text: 'Calculator' },
        { id: 'D', text: 'Unikey' },
      ],
      correctOptionIds: ['A'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Google Chrome, Microsoft Edge, Firefox là các trình duyệt web phổ biến.',
      createdAt: '2026-09-20T08:00:00.000Z',
    },
    {
      id: 'q-402',
      type: 'multiple_choice',
      grade: 4,
      topic: 'Soạn thảo văn bản Word',
      difficulty: 'thong_hieu',
      prompt: 'Trong phần mềm Microsoft Word, những nút lệnh nào dùng để định dạng kiểu chữ?',
      options: [
        { id: 'A', text: 'B (In đậm - Bold)' },
        { id: 'B', text: 'I (In nghiêng - Italic)' },
        { id: 'C', text: 'U (Gạch chân - Underline)' },
        { id: 'D', text: 'Shut down (Tắt máy)' },
      ],
      correctOptionIds: ['A', 'B', 'C'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Ba nút B, I, U lần lượt là chữ đậm, chữ nghiêng và chữ gạch chân.',
      createdAt: '2026-09-20T08:05:00.000Z',
    },
    {
      id: 'q-403',
      type: 'true_false',
      grade: 4,
      topic: 'Internet và tìm kiếm thông tin',
      difficulty: 'thong_hieu',
      prompt: 'Khi sử dụng Internet, em KHÔNG NÊN chia sẻ mật khẩu tài khoản học tập cho người lạ.',
      options: [
        { id: 'TRUE', text: 'Đúng' },
        { id: 'FALSE', text: 'Sai' },
      ],
      correctOptionIds: ['TRUE'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Giữ bí mật mật khẩu giúp bảo vệ tài khoản cá nhân trên môi trường mạng.',
      createdAt: '2026-09-20T08:10:00.000Z',
    },
    {
      id: 'q-404',
      type: 'short_answer',
      grade: 4,
      topic: 'Soạn thảo văn bản Word',
      difficulty: 'nhan_biet',
      prompt: 'Trong kiểu gõ Telex, để gõ được chữ "ô", em gõ liên tiếp hai chữ cái nào?',
      options: [],
      correctOptionIds: [],
      acceptedAnswers: ['oo', 'OO'],
      autoGradeShortAnswer: true,
      points: 2,
      explanation: 'Trong kiểu gõ Telex: aa -> â, oo -> ô, ee -> ê.',
      createdAt: '2026-09-20T08:15:00.000Z',
    },
    {
      id: 'q-405',
      type: 'essay',
      grade: 4,
      topic: 'Internet và tìm kiếm thông tin',
      difficulty: 'van_dung',
      prompt: 'Em hãy nêu 2 quy tắc sử dụng Internet an toàn và lịch sự mà học sinh tiểu học cần ghi nhớ.',
      options: [],
      correctOptionIds: [],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Ví dụ: Không chia sẻ thông tin riêng tư/mật khẩu cho người lạ; giao tiếp lễ phép, hỏi ý kiến thầy cô/cha mẹ khi gặp nội dung lạ.',
      createdAt: '2026-09-20T08:20:00.000Z',
    },
    // Grade 5 Questions (Scratch & Multimedia)
    {
      id: 'q-501',
      type: 'single_choice',
      grade: 5,
      topic: 'Lập trình Scratch',
      difficulty: 'nhan_biet',
      prompt: 'Quan sát chương trình Scratch trong hình, lệnh "Khi bấm vào Lá cờ xanh" thuộc nhóm lệnh nào?',
      imageUrl: ILLUSTRATION_SCRATCH_BLOCKS,
      options: [
        { id: 'A', text: 'Nhóm Chuyển động (Motion)' },
        { id: 'B', text: 'Nhóm Sự kiện (Events)' },
        { id: 'C', text: 'Nhóm Hiển thị (Looks)' },
        { id: 'D', text: 'Nhóm Âm thanh (Sound)' },
      ],
      correctOptionIds: ['B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Khối lệnh màu vàng "Khi bấm vào Lá cờ xanh" thuộc nhóm Sự kiện (Events).',
      createdAt: '2026-09-25T08:00:00.000Z',
    },
    {
      id: 'q-502',
      type: 'multiple_choice',
      grade: 5,
      topic: 'Lập trình Scratch',
      difficulty: 'thong_hieu',
      prompt: 'Khi chạy đoạn chương trình Scratch ở hình minh họa, nhân vật Chú mèo sẽ thực hiện những hành động nào?',
      imageUrl: ILLUSTRATION_SCRATCH_BLOCKS,
      options: [
        { id: 'A', text: 'Di chuyển về phía trước 50 bước' },
        { id: 'B', text: 'Hiển thị bóng nói "Xin chào Tin học 5!" trong 2 giây' },
        { id: 'C', text: 'Đổi màu sân khấu thành màu đen' },
        { id: 'D', text: 'Biến mất khỏi màn hình' },
      ],
      correctOptionIds: ['A', 'B'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Nhân vật thực hiện tuần tự 2 lệnh: Di chuyển 50 bước rồi nói lời chào trong 2 giây.',
      createdAt: '2026-09-25T08:05:00.000Z',
    },
    {
      id: 'q-503',
      type: 'true_false',
      grade: 5,
      topic: 'Lập trình Scratch',
      difficulty: 'thong_hieu',
      prompt: 'Trong Scratch, khối lệnh "Lặp lại 4 lần: [Di chuyển 100 bước -> Xoay 90 độ]" giúp nhân vật vẽ được một hình vuông.',
      options: [
        { id: 'TRUE', text: 'Đúng' },
        { id: 'FALSE', text: 'Sai' },
      ],
      correctOptionIds: ['TRUE'],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Hình vuông có 4 cạnh bằng nhau và 4 góc vuông 90 độ nên lặp 4 lần sẽ khép kín hình vuông.',
      createdAt: '2026-09-25T08:10:00.000Z',
    },
    {
      id: 'q-504',
      type: 'short_answer',
      grade: 5,
      topic: 'Lập trình Scratch',
      difficulty: 'van_dung',
      prompt: 'Muốn nhân vật Scratch vẽ được một hình tam giác đều bằng vòng lặp, số lần lặp cần điền vào khối "Lặp lại (...) lần" là bao nhiêu?',
      options: [],
      correctOptionIds: [],
      acceptedAnswers: ['3', 'ba'],
      autoGradeShortAnswer: true,
      points: 2,
      explanation: 'Hình tam giác đều có 3 cạnh bằng nhau nên cần lặp lại 3 lần (mỗi lần xoay 120 độ).',
      createdAt: '2026-09-25T08:15:00.000Z',
    },
    {
      id: 'q-505',
      type: 'essay',
      grade: 5,
      topic: 'Lập trình Scratch',
      difficulty: 'van_dung',
      prompt: 'Em hãy mô tả ý tưởng kịch bản một trò chơi đơn giản trên Scratch mà em muốn sáng tạo trong học kì này.',
      options: [],
      correctOptionIds: [],
      acceptedAnswers: [],
      autoGradeShortAnswer: false,
      points: 2,
      explanation: 'Học sinh nêu nhân vật chính, cách điều khiển và điều kiện thắng/ghi điểm.',
      createdAt: '2026-09-25T08:20:00.000Z',
    },
  ];

  const allQuestions: Question[] = [...questionsG3MayTinh, ...extraQuestions];

  const assignments: Assignment[] = [
    {
      id: 'asg-1',
      title: 'Máy tính và em',
      grade: 3,
      classIds: ['cls-3a', 'cls-3b'],
      instructions: 'Các em đọc kỹ từng câu hỏi trắc nghiệm về các bộ phận máy tính, tư thế ngồi đúng và an toàn điện. Thời gian làm bài 15 phút.',
      questions: questionsG3MayTinh,
      durationMinutes: 15,
      dueDate: '2026-11-15T17:00:00.000Z',
      maxAttempts: 2,
      status: 'published',
      allowViewScore: true,
      createdAt: '2026-10-18T08:00:00.000Z',
      updatedAt: '2026-10-18T08:00:00.000Z',
    },
    {
      id: 'asg-2',
      title: 'Em tập vẽ với phần mềm Paint',
      grade: 3,
      classIds: ['cls-3a', 'cls-3b'],
      instructions: 'Hoàn thành 4 câu hỏi tổng hợp (trắc nghiệm, nhiều đáp án, đúng/sai và điền phím tắt) về phần mềm đồ họa Paint.',
      questions: extraQuestions.slice(0, 4),
      durationMinutes: 15,
      dueDate: '2026-11-20T17:00:00.000Z',
      maxAttempts: 2,
      status: 'published',
      allowViewScore: true,
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'asg-3',
      title: 'Tìm kiếm thông tin & Soạn thảo văn bản',
      grade: 4,
      classIds: ['cls-4a'],
      instructions: 'Bài kiểm tra cuối chủ đề Tin học 4 gồm câu hỏi trắc nghiệm và 1 câu tự luận nêu quy tắc an toàn Internet.',
      questions: extraQuestions.slice(4, 9),
      durationMinutes: 20,
      dueDate: '2026-11-18T17:00:00.000Z',
      maxAttempts: 1,
      status: 'published',
      allowViewScore: true,
      createdAt: '2026-10-21T08:00:00.000Z',
      updatedAt: '2026-10-21T08:00:00.000Z',
    },
    {
      id: 'asg-4',
      title: 'Lập trình trực quan với Scratch',
      grade: 5,
      classIds: ['cls-5a', 'cls-5b'],
      instructions: 'Quan sát khối lệnh Scratch và hoàn thành các câu hỏi tư duy thuật toán. Câu tự luận cuối bài sẽ được cô Thị Chành Tha chấm và nhận xét.',
      questions: extraQuestions.slice(9, 14),
      durationMinutes: 20,
      dueDate: '2026-11-22T17:00:00.000Z',
      maxAttempts: 2,
      status: 'published',
      allowViewScore: true,
      createdAt: '2026-10-22T08:00:00.000Z',
      updatedAt: '2026-10-22T08:00:00.000Z',
    },
    {
      id: 'asg-5',
      title: 'Ôn tập Gõ bàn phím bằng 10 ngón (Bản nháp)',
      grade: 4,
      classIds: ['cls-4a'],
      instructions: 'Bản nháp bài ôn tập chuẩn bị giao cho lớp 4A vào tuần tới.',
      questions: [questionsG3MayTinh[4], extraQuestions[5], extraQuestions[7]],
      durationMinutes: 15,
      dueDate: '2026-11-30T17:00:00.000Z',
      maxAttempts: 2,
      status: 'draft',
      allowViewScore: true,
      createdAt: '2026-10-23T09:00:00.000Z',
      updatedAt: '2026-10-23T09:00:00.000Z',
    },
  ];

  // Generate realistic submissions across 3A, 3B, 4A, 5A, 5B
  const submissions: Submission[] = [];

  const buildAutoSubmission = (
    subId: string,
    stu: Student,
    asg: Assignment,
    wrongIndices: number[],
    submittedAt: string,
    pendingEssayText?: string,
    essayGradedPoints?: number,
    feedback?: string
  ): Submission => {
    const answers = asg.questions.map((q, idx) => {
      const isWrong = wrongIndices.includes(idx);
      if (q.type === 'essay') {
        return {
          questionId: q.id,
          textAnswer: pendingEssayText || 'Em không chia sẻ mật khẩu cho người lạ và luôn lễ phép khi học trực tuyến.',
        };
      }
      if (q.type === 'short_answer') {
        return {
          questionId: q.id,
          textAnswer: isWrong ? 'X' : (q.acceptedAnswers[0] || ''),
        };
      }
      return {
        questionId: q.id,
        selectedOptionIds: isWrong ? [q.options[0]?.id === q.correctOptionIds[0] ? q.options[1]?.id || 'B' : q.options[0]?.id || 'A'] : [...q.correctOptionIds],
      };
    });

    let correctCount = 0;
    let earnedPoints = 0;
    let totalPoints = 0;
    let hasPendingEssay = false;

    const evaluations = asg.questions.map((q, idx) => {
      totalPoints += q.points;
      const isWrong = wrongIndices.includes(idx);
      if (q.type === 'essay') {
        if (typeof essayGradedPoints === 'number') {
          const ok = essayGradedPoints >= q.points * 0.5;
          if (ok) correctCount += 1;
          earnedPoints += essayGradedPoints;
          return {
            questionId: q.id,
            isCorrect: ok,
            earnedPoints: essayGradedPoints,
            maxPoints: q.points,
            teacherComment: 'Ý thức an toàn mạng rất tốt, trình bày rõ ràng!',
          };
        }
        hasPendingEssay = true;
        return {
          questionId: q.id,
          isCorrect: null,
          earnedPoints: 0,
          maxPoints: q.points,
        };
      }
      const pts = isWrong ? 0 : q.points;
      if (!isWrong) correctCount += 1;
      earnedPoints += pts;
      return {
        questionId: q.id,
        isCorrect: !isWrong,
        earnedPoints: pts,
        maxPoints: q.points,
      };
    });

    const score10 = totalPoints > 0 ? Math.round(((earnedPoints / totalPoints) * 10) * 10) / 10 : 0;
    const startMs = new Date(submittedAt).getTime() - 9 * 60 * 1000;

    return {
      id: subId,
      submissionKey: `seed-${subId}`,
      assignmentId: asg.id,
      assignmentTitle: asg.title,
      studentId: stu.id,
      studentCode: stu.studentCode,
      studentName: stu.fullName,
      classId: stu.classId,
      className: stu.className,
      grade: stu.grade,
      attemptNumber: 1,
      startedAt: new Date(startMs).toISOString(),
      submittedAt,
      answers,
      evaluations,
      correctCount,
      totalQuestions: asg.questions.length,
      earnedPoints,
      totalPoints,
      score10,
      gradingStatus: hasPendingEssay ? 'pending_essay' : 'graded',
      teacherFeedback: feedback,
    };
  };

  // Class 3A: 4 students completed asg-1, 3 completed asg-2 (HS3A05 not yet submitted asg-1 so student login hs3a05 or hs3a01 2nd attempt works!)
  submissions.push(
    buildAutoSubmission('sub-1', students[0], assignments[0], [3], '2026-10-22T08:15:00.000Z', undefined, undefined, 'Em nắm vững các bộ phận máy tính, phát huy nhé!'),
    buildAutoSubmission('sub-2', students[1], assignments[0], [], '2026-10-22T08:18:00.000Z', undefined, undefined, 'Xuất sắc! Đạt điểm tối đa 10/10.'),
    buildAutoSubmission('sub-3', students[2], assignments[0], [4, 8], '2026-10-22T08:22:00.000Z'),
    buildAutoSubmission('sub-4', students[3], assignments[0], [5], '2026-10-22T08:25:00.000Z'),
    buildAutoSubmission('sub-5', students[0], assignments[1], [], '2026-10-23T09:10:00.000Z'),
    buildAutoSubmission('sub-6', students[1], assignments[1], [3], '2026-10-23T09:14:00.000Z'),
    buildAutoSubmission('sub-7', students[2], assignments[1], [], '2026-10-23T09:20:00.000Z')
  );

  // Class 3B: 4 students completed asg-1, 2 completed asg-2
  submissions.push(
    buildAutoSubmission('sub-8', students[5], assignments[0], [1], '2026-10-22T10:05:00.000Z'),
    buildAutoSubmission('sub-9', students[6], assignments[0], [], '2026-10-22T10:12:00.000Z'),
    buildAutoSubmission('sub-10', students[7], assignments[0], [2, 6, 8], '2026-10-22T10:19:00.000Z'),
    buildAutoSubmission('sub-11', students[8], assignments[0], [5], '2026-10-22T10:24:00.000Z'),
    buildAutoSubmission('sub-12', students[5], assignments[1], [], '2026-10-23T10:30:00.000Z'),
    buildAutoSubmission('sub-13', students[6], assignments[1], [1], '2026-10-23T10:35:00.000Z')
  );

  // Class 4A: 4 students completed asg-3 (3 graded, 1 pending essay for teacher demo!)
  submissions.push(
    buildAutoSubmission('sub-14', students[10], assignments[2], [], '2026-10-23T14:15:00.000Z', '1. Không tiết lộ mật khẩu cho người lạ. 2. Luôn hỏi ý kiến thầy cô và bố mẹ khi xem thông tin trên mạng.', 2, 'Bài làm rất tốt, nêu đúng 2 quy tắc vàng!'),
    buildAutoSubmission('sub-15', students[11], assignments[2], [1], '2026-10-23T14:22:00.000Z', 'Không nhấn vào đường link lạ và nói chuyện lịch sự với bạn bè.', 2),
    buildAutoSubmission('sub-16', students[12], assignments[2], [], '2026-10-23T15:10:00.000Z', 'Em chỉ truy cập các trang web học tập lành mạnh và giữ bí mật thông tin cá nhân.', 1.5),
    buildAutoSubmission('sub-17', students[13], assignments[2], [3], '2026-10-23T15:20:00.000Z', 'Em hứa không cho ai biết mật khẩu tài khoản học tập và không xem nội dung xấu trên mạng.', undefined)
  );

  // Class 5A: 3 students completed asg-4 (2 graded, 1 pending essay)
  submissions.push(
    buildAutoSubmission('sub-18', students[15], assignments[3], [], '2026-10-23T16:00:00.000Z', 'Em muốn làm trò chơi Chú mèo hứng táo rơi: dùng phím mũi tên trái phải điều khiển chú mèo đỡ quả táo để cộng 10 điểm.', 2, 'Ý tưởng trò chơi rất sáng tạo và phù hợp với Scratch!'),
    buildAutoSubmission('sub-19', students[16], assignments[3], [1], '2026-10-23T16:12:00.000Z', 'Em làm trò chơi Mê cung tri thức: trả lời đúng câu hỏi Tin học để mở cửa qua màn.', 2),
    buildAutoSubmission('sub-20', students[17], assignments[3], [3], '2026-10-23T16:25:00.000Z', 'Em dự định thiết kế trò chơi Tàu vũ trụ vượt chướng ngại vật bằng các khối lệnh lặp và cảm biến chạm màu.', undefined)
  );

  // Class 5B: 4 students completed asg-4
  submissions.push(
    buildAutoSubmission('sub-21', students[20], assignments[3], [], '2026-10-23T16:40:00.000Z', 'Em thiết kế trò chơi Đố vui biển đảo Việt Nam trên phần mềm Scratch.', 2, 'Chủ đề rất ý nghĩa, cô khuyến khích em thực hiện!'),
    buildAutoSubmission('sub-22', students[21], assignments[3], [0], '2026-10-23T16:45:00.000Z', 'Em làm trò chơi Chú cá săn mồi dưới đại dương.', 1.5),
    buildAutoSubmission('sub-23', students[22], assignments[3], [], '2026-10-23T16:50:00.000Z', 'Em làm thiệp chúc mừng Ngày Nhà giáo Việt Nam 20/11 có nhạc và hiệu ứng pháo hoa.', 2),
    buildAutoSubmission('sub-24', students[23], assignments[3], [1, 3], '2026-10-23T16:55:00.000Z', 'Em làm trò chơi Đua xe vượt địa hình tính điểm.', 1.5)
  );

  const lessons: Lesson[] = [
    {
      id: 'les-1',
      title: 'Bài 3: Máy tính và em - Các bộ phận của máy tính để bàn',
      grade: 3,
      topic: 'Chủ đề A: Máy tính và em',
      lessonNumber: 'Bài 3',
      content:
        '1. Bốn bộ phận cơ bản của máy tính để bàn:\n- Màn hình: Hiển thị kết quả hoạt động của máy tính dưới dạng hình ảnh và chữ viết.\n- Thân máy: Hộp chứa nhiều chi tiết tinh vi, trong đó có bộ xử lý trung tâm (CPU) đóng vai trò bộ não của máy tính.\n- Bàn phím: Có nhiều phím giúp gửi tín hiệu chữ, số và lệnh vào máy tính.\n- Chuột máy tính: Giúp điều khiển con trỏ chọn nhanh các biểu tượng trên màn hình.\n\n2. Tư thế ngồi đúng và an toàn điện:\n- Ngồi thẳng lưng, vai thả lỏng, mắt cách màn hình từ 50 cm đến 80 cm.\n- Không dùng tay ướt chạm vào thiết bị điện, báo ngay cho thầy cô khi thấy dây nguồn bất thường.',
      imageUrl: ILLUSTRATION_DESKTOP_PC,
      videoUrl: 'https://www.youtube.com/embed/2e5_lG3C-2k',
      attachments: [
        { id: 'att-1', name: 'Bai_giang_May_tinh_va_em_Lop3.pptx', fileType: 'pptx', url: '#slide-may-tinh-va-em', sizeLabel: '2,4 MB' },
        { id: 'att-2', name: 'Phieu_hoc_tap_Bai3_Lop3.pdf', fileType: 'pdf', url: '#pdf-phieu-hoc-tap-3', sizeLabel: '680 KB' },
      ],
      targetClassIds: ['cls-3a', 'cls-3b'],
      published: true,
      createdAt: '2026-10-10T08:00:00.000Z',
      updatedAt: '2026-10-18T08:00:00.000Z',
    },
    {
      id: 'les-2',
      title: 'Bài 6: Khám phá phần mềm vẽ tranh Paint',
      grade: 3,
      topic: 'Chủ đề E: Ứng dụng tin học',
      lessonNumber: 'Bài 6',
      content:
        '1. Giới thiệu phần mềm Paint:\nPaint là phần mềm giúp em vẽ tranh, tô màu và chỉnh sửa hình ảnh sinh động trên máy tính.\n\n2. Các công cụ chính:\n- Bút chì (Pencil): Vẽ nét tự do.\n- Tô màu (Fill with color): Tô màu vào một vùng khép kín.\n- Cục tẩy (Eraser): Xóa chi tiết vẽ sai.\n- Công cụ chữ A (Text): Viết dòng chữ chú thích lên bức tranh.\n\n3. Lưu bài vẽ:\nNhấn File -> Save hoặc tổ hợp phím Ctrl + S, đặt tên tệp không dấu rõ ràng theo lớp và họ tên.',
      imageUrl: ILLUSTRATION_PAINT_TOOLS,
      attachments: [
        { id: 'att-3', name: 'Huong_dan_thuc_hanh_Paint.pdf', fileType: 'pdf', url: '#pdf-paint', sizeLabel: '1,2 MB' },
      ],
      targetClassIds: ['cls-3a', 'cls-3b'],
      published: true,
      createdAt: '2026-10-12T08:00:00.000Z',
      updatedAt: '2026-10-19T08:00:00.000Z',
    },
    {
      id: 'les-3',
      title: 'Bài 4: Tìm kiếm thông tin trên Internet & Quy tắc an toàn số',
      grade: 4,
      topic: 'Chủ đề B: Mạng máy tính và Internet',
      lessonNumber: 'Bài 4',
      content:
        '1. Sử dụng máy tìm kiếm:\n- Mở trình duyệt web (Google Chrome, Microsoft Edge).\n- Nhập từ khóa ngắn gọn, chính xác vào ô tìm kiếm rồi nhấn phím Enter.\n\n2. Quy tắc an toàn thông tin cho học sinh tiểu học:\n- Không tự ý cung cấp họ tên đầy đủ, trường lớp, mật khẩu cho người lạ trên mạng.\n- Sử dụng ngôn từ lịch sự, tôn trọng thầy cô và bạn bè.\n- Hỏi ý kiến cha mẹ hoặc cô giáo khi gặp thông tin đáng ngờ.',
      attachments: [
        { id: 'att-4', name: 'Cam_nang_An_toan_Internet_Khoi4.pdf', fileType: 'pdf', url: '#pdf-internet-4', sizeLabel: '1,5 MB' },
        { id: 'att-5', name: 'Slide_Tim_kiem_thong_tin_Lop4.pptx', fileType: 'pptx', url: '#pptx-internet-4', sizeLabel: '3,1 MB' },
      ],
      targetClassIds: ['cls-4a'],
      published: true,
      createdAt: '2026-10-14T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'les-4',
      title: 'Bài 8: Lập trình điều khiển nhân vật với Scratch',
      grade: 5,
      topic: 'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lessonNumber: 'Bài 8',
      content:
        '1. Môi trường lập trình trực quan Scratch:\n- Khu vực Sân khấu (Stage): Nơi nhân vật biểu diễn.\n- Khu vực Khối lệnh: Phân chia theo màu sắc (Sự kiện màu vàng, Chuyển động màu xanh dương, Hiển thị màu tím, Điều khiển màu cam).\n\n2. Cấu trúc tuần tự và cấu trúc lặp:\n- Ghép các khối lệnh từ trên xuống dưới để nhân vật thực hiện lần lượt.\n- Dùng khối lệnh "Lặp lại (n) lần" để rút ngắn các bước lặp giống nhau khi vẽ hình đa giác đều.',
      imageUrl: ILLUSTRATION_SCRATCH_BLOCKS,
      attachments: [
        { id: 'att-6', name: 'Bai_tap_thuc_hanh_Scratch_Lop5.pdf', fileType: 'pdf', url: '#pdf-scratch-5', sizeLabel: '1,9 MB' },
      ],
      targetClassIds: ['cls-5a', 'cls-5b'],
      published: true,
      createdAt: '2026-10-16T08:00:00.000Z',
      updatedAt: '2026-10-22T08:00:00.000Z',
    },
    {
      id: 'les-5',
      title: 'Bài 9: Thiết kế bài trình chiếu đa phương tiện (Bản thảo chưa xuất bản)',
      grade: 5,
      topic: 'Chủ đề E: Ứng dụng tin học',
      lessonNumber: 'Bài 9',
      content: 'Bài giảng đang được cô Thị Chành Tha hoàn thiện hình ảnh minh họa trước khi xuất bản cho khối 5.',
      attachments: [],
      targetClassIds: ['cls-5a', 'cls-5b'],
      published: false,
      createdAt: '2026-10-23T08:00:00.000Z',
      updatedAt: '2026-10-23T08:00:00.000Z',
    },
  ];

  const resources: ResourceItem[] = [
    {
      id: 'res-1',
      title: 'Sơ đồ trực quan 4 bộ phận máy tính để bàn',
      category: 'image',
      grade: 3,
      description: 'Hình ảnh sơ đồ độ phân giải cao dùng giảng dạy Bài 3 Tin học lớp 3.',
      url: ILLUSTRATION_DESKTOP_PC,
      fileFormat: 'SVG / PNG',
      accessLevel: 'all',
      createdAt: '2026-10-10T08:00:00.000Z',
    },
    {
      id: 'res-2',
      title: 'Bảng nhận diện các công cụ vẽ phần mềm Paint',
      category: 'software_guide',
      grade: 3,
      description: 'Hướng dẫn từng bước cách mở Paint, chọn cọ vẽ, đổ màu và lưu bài vào thư mục lớp.',
      url: ILLUSTRATION_PAINT_TOOLS,
      fileFormat: 'Hướng dẫn trực quan',
      accessLevel: 'all',
      createdAt: '2026-10-12T09:00:00.000Z',
    },
    {
      id: 'res-3',
      title: 'Bài trình chiếu mẫu: An toàn thông tin trên không gian mạng',
      category: 'pptx',
      grade: 4,
      description: 'Slide bài giảng PowerPoint có hiệu ứng sinh động dành cho học sinh khối 4.',
      url: '#pptx-antoanmang',
      fileFormat: 'PPTX (3,1 MB)',
      accessLevel: 'all',
      createdAt: '2026-10-14T10:00:00.000Z',
    },
    {
      id: 'res-4',
      title: 'Phiếu thực hành gõ 10 ngón với phần mềm RapidTyping',
      category: 'practice',
      grade: 4,
      description: 'Bài luyện gõ hàng phím cơ sở, hàng phím trên và hàng phím dưới có chấm tốc độ.',
      url: '#pdf-rapidtyping',
      fileFormat: 'PDF Thực hành',
      accessLevel: 'all',
      createdAt: '2026-10-15T08:00:00.000Z',
    },
    {
      id: 'res-5',
      title: 'Sơ đồ khối lệnh cơ bản trong Scratch 3.0',
      category: 'software_guide',
      grade: 5,
      description: 'Tài liệu tra cứu nhanh nhóm lệnh Sự kiện, Chuyển động, Hiển thị và Điều khiển trong Scratch.',
      url: ILLUSTRATION_SCRATCH_BLOCKS,
      fileFormat: 'Hướng dẫn phần mềm',
      accessLevel: 'all',
      createdAt: '2026-10-18T08:30:00.000Z',
    },
    {
      id: 'res-6',
      title: 'Video hướng dẫn: Lập trình chú mèo vẽ hình đa giác đều',
      category: 'video',
      grade: 5,
      description: 'Video minh họa trực quan góc quay và vòng lặp trong Scratch dành cho lớp 5A, 5B.',
      url: 'https://www.youtube.com/embed/2e5_lG3C-2k',
      fileFormat: 'Video MP4 / Embed',
      accessLevel: 'all',
      createdAt: '2026-10-19T14:00:00.000Z',
    },
    {
      id: 'res-7',
      title: 'Kế hoạch bài dạy (Giáo án) Tin học Khối 3 - 4 - 5 Học kì I',
      category: 'pdf',
      grade: 'all',
      description: 'Hồ sơ chuyên môn phân phối chương trình môn Tin học dành riêng cho giáo viên.',
      url: '#pdf-ke-hoach-bai-day',
      fileFormat: 'PDF (4,2 MB)',
      accessLevel: 'teacher_only',
      createdAt: '2026-09-05T08:00:00.000Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'noti-1',
      title: 'Đã giao bài tập mới',
      message: 'Tin học lớp 3 - Bài 3: Máy tính và em (10 câu trắc nghiệm - Thời gian 15 phút).',
      type: 'assignment',
      targetClassIds: ['cls-3a', 'cls-3b'],
      createdAt: '2026-10-24T01:30:00.000Z',
      createdBy: 'Thị Chành Tha',
    },
    {
      id: 'noti-2',
      title: 'Học sinh lớp 4A đã nộp bài',
      message: 'Bài kiểm tra cuối chủ đề: Tìm kiếm thông tin & Soạn thảo văn bản.',
      type: 'deadline',
      targetClassIds: ['cls-4a'],
      createdAt: '2026-10-23T08:20:00.000Z',
      createdBy: 'Thị Chành Tha',
    },
    {
      id: 'noti-3',
      title: 'Cập nhật tài liệu học tập',
      message: 'Hướng dẫn sử dụng phần mềm Paint dành cho học sinh khối 3 đã được đăng tải.',
      type: 'material',
      targetClassIds: ['cls-3a', 'cls-3b'],
      createdAt: '2026-10-12T09:00:00.000Z',
      createdBy: 'Thị Chành Tha',
    },
    {
      id: 'noti-4',
      title: 'Lịch học tuần tới',
      message: 'Phòng Tin học – Thứ 2, Thứ 4, Thứ 6. Các lớp xếp hàng ngay ngắn trước giờ thực hành 5 phút.',
      type: 'schedule',
      targetClassIds: [],
      createdAt: '2026-10-11T08:00:00.000Z',
      createdBy: 'Thị Chành Tha',
    },
  ];

  const gameRecords: GameRecord[] = [
    {
      id: 'gm-1',
      gameType: 'millionaire',
      gameTitle: 'Ai là triệu phú Tin học',
      userId: 'usr-stu-1',
      studentName: 'Danh Minh Khôi',
      className: '3A',
      score: 90,
      maxScore: 100,
      durationSeconds: 115,
      createdAt: '2026-10-23T09:30:00.000Z',
    },
    {
      id: 'gm-2',
      gameType: 'challenge10',
      gameTitle: 'Thử thách 10 câu hỏi',
      userId: 'usr-stu-16',
      studentName: 'Đặng Gia Bảo',
      className: '5A',
      score: 100,
      maxScore: 100,
      durationSeconds: 98,
      createdAt: '2026-10-23T14:40:00.000Z',
    },
  ];

  return {
    settings,
    users,
    classes,
    students,
    lessons,
    questions: allQuestions,
    assignments,
    submissions,
    resources,
    notifications,
    gameRecords,
  };
}
