import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  createDemoSeedState,
  createEmptyWorkspaceState,
  hashPassword,
  verifyPassword,
} from './server/demoSeed.ts';
import type { DatabaseState, StoredAccount } from './server/demoSeed.ts';
import type {
  Assignment,
  ClassRoom,
  GameRecord,
  Lesson,
  NotificationItem,
  Question,
  QuestionEvaluation,
  ResourceItem,
  Student,
  Submission,
  SubmissionAnswer,
  UserProfile,
} from './src/types/lms.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DEMO_DB_PATH = path.join(DATA_DIR, 'demo-db.json');
const WORKSPACE_DB_PATH = path.join(DATA_DIR, 'workspace-db.json');
const MODE_CONFIG_PATH = path.join(DATA_DIR, 'active-mode.json');

const SESSION_SECRET = process.env.SESSION_SECRET || 'tin-hoc-tieu-hoc-thu-ba-hmac-secret-2026';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadActiveMode(): 'demo' | 'workspace' {
  try {
    if (fs.existsSync(MODE_CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(MODE_CONFIG_PATH, 'utf-8'));
      if (raw.mode === 'workspace') return 'workspace';
    }
  } catch {
    // default demo
  }
  return 'demo';
}

function saveActiveMode(mode: 'demo' | 'workspace'): void {
  fs.writeFileSync(MODE_CONFIG_PATH, JSON.stringify({ mode }, null, 2), 'utf-8');
}

function loadDb(mode: 'demo' | 'workspace'): DatabaseState {
  const filePath = mode === 'demo' ? DEMO_DB_PATH : WORKSPACE_DB_PATH;
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DatabaseState;
      parsed.settings.dataMode = mode;
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read DB file, recreating default state:', err);
  }
  const initial = mode === 'demo' ? createDemoSeedState() : createEmptyWorkspaceState();
  fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

function saveDb(mode: 'demo' | 'workspace', state: DatabaseState): void {
  const filePath = mode === 'demo' ? DEMO_DB_PATH : WORKSPACE_DB_PATH;
  state.settings.dataMode = mode;
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

let activeMode: 'demo' | 'workspace' = loadActiveMode();
let dbState: DatabaseState = loadDb(activeMode);

function toPublicUser(acc: StoredAccount): UserProfile {
  const { passwordHash: _h, passwordSalt: _s, ...publicProfile } = acc;
  return publicProfile;
}

function signToken(userId: string, mode: 'demo' | 'workspace'): string {
  const payload = Buffer.from(JSON.stringify({ userId, mode, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string | undefined): StoredAccount | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      userId: string;
      mode: 'demo' | 'workspace';
    };
    const found = dbState.users.find((u) => u.id === decoded.userId);
    return found || null;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  user?: StoredAccount;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const verified = verifyToken(rawToken);
  if (verified) {
    req.user = verified;
  } else {
    // Default initial preview session to Teacher Thị Chành Tha so preview opens directly to the dashboard,
    // while still supporting full login/logout/student switching!
    const fallbackHeader = req.headers['x-explicit-logged-out'];
    if (fallbackHeader !== 'true') {
      req.user = dbState.users.find((u) => u.role === 'teacher') || dbState.users[0];
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
    return;
  }
  next();
}

function requireTeacher(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'teacher') {
    res.status(403).json({ error: 'Chỉ tài khoản Giáo viên mới có quyền thực hiện thao tác này.' });
    return;
  }
  next();
}

function sanitizeAssignmentForStudent(asg: Assignment, allowRevealAnswers: boolean): Assignment {
  if (allowRevealAnswers) return asg;
  return {
    ...asg,
    questions: asg.questions.map((q) => ({
      ...q,
      correctOptionIds: [],
      acceptedAnswers: [],
      explanation: undefined,
    })),
  };
}

function buildBootstrapPayload(user: StoredAccount) {
  const isTeacher = user.role === 'teacher';
  const studentClassId = user.classId || '';

  const filteredLessons = isTeacher
    ? dbState.lessons
    : dbState.lessons.filter(
        (l) => l.published && (l.targetClassIds.length === 0 || l.targetClassIds.includes(studentClassId))
      );

  const filteredSubmissions = isTeacher
    ? dbState.submissions
    : dbState.submissions.filter((s) => s.studentId === user.studentId);

  const filteredAssignments = isTeacher
    ? dbState.assignments
    : dbState.assignments
        .filter((a) => a.status === 'published' && a.classIds.includes(studentClassId))
        .map((a) => {
          const hasSubmitted = filteredSubmissions.some((s) => s.assignmentId === a.id);
          const allowReveal = hasSubmitted && a.allowViewScore && dbState.settings.allowStudentsViewResults;
          return sanitizeAssignmentForStudent(a, allowReveal);
        });

  const filteredResources = isTeacher
    ? dbState.resources
    : dbState.resources.filter(
        (r) => r.accessLevel === 'all' && (r.grade === 'all' || r.grade === user.grade)
      );

  const filteredNotifications = isTeacher
    ? dbState.notifications
    : dbState.notifications.filter(
        (n) => n.targetClassIds.length === 0 || n.targetClassIds.includes(studentClassId)
      );

  const filteredStudents = isTeacher
    ? dbState.students
    : dbState.students.filter((s) => s.id === user.studentId);

  const filteredClasses = isTeacher
    ? dbState.classes
    : dbState.classes.filter((c) => c.id === studentClassId);

  // Students get question bank questions ONLY without answers for learning games, or sanitized
  const filteredQuestions = isTeacher
    ? dbState.questions
    : dbState.questions.filter((q) => !user.grade || q.grade === user.grade);

  const demoAccounts = dbState.users.slice(0, 8).map((u) => ({
    username: u.username,
    role: u.role,
    label: u.role === 'teacher' ? `Giáo viên: ${u.fullName}` : `HS: ${u.fullName} (Lớp ${u.className})`,
    className: u.className,
  }));

  return {
    currentUser: toPublicUser(user),
    settings: dbState.settings,
    classes: filteredClasses,
    students: filteredStudents,
    lessons: filteredLessons,
    assignments: filteredAssignments,
    questions: filteredQuestions,
    submissions: filteredSubmissions.map((sub) => {
      if (!isTeacher && !dbState.settings.allowStudentsViewResults) {
        return {
          ...sub,
          score10: -1,
          earnedPoints: 0,
          correctCount: 0,
          evaluations: [],
        };
      }
      return sub;
    }),
    resources: filteredResources,
    notifications: filteredNotifications,
    gameRecords: isTeacher
      ? dbState.gameRecords
      : dbState.gameRecords.filter((g) => g.userId === user.id),
    demoAccounts,
  };
}

// Server-side authoritative grading logic
function evaluateSubmissionOnServer(
  assignment: Assignment,
  clientAnswers: SubmissionAnswer[]
): {
  evaluations: QuestionEvaluation[];
  correctCount: number;
  earnedPoints: number;
  totalPoints: number;
  score10: number;
  gradingStatus: 'graded' | 'pending_essay';
} {
  let correctCount = 0;
  let earnedPoints = 0;
  let totalPoints = 0;
  let hasPendingManual = false;

  const evaluations: QuestionEvaluation[] = assignment.questions.map((q) => {
    const qPoints = Number(q.points) > 0 ? Number(q.points) : 1;
    totalPoints += qPoints;
    const ans = clientAnswers.find((a) => a.questionId === q.id);

    if (q.type === 'single_choice' || q.type === 'true_false') {
      const selected = ans?.selectedOptionIds || [];
      const expected = q.correctOptionIds || [];
      const isCorrect = selected.length === 1 && expected.length === 1 && selected[0] === expected[0];
      if (isCorrect) {
        correctCount += 1;
        earnedPoints += qPoints;
      }
      return {
        questionId: q.id,
        isCorrect,
        earnedPoints: isCorrect ? qPoints : 0,
        maxPoints: qPoints,
      };
    }

    if (q.type === 'multiple_choice') {
      const selectedSet = new Set(ans?.selectedOptionIds || []);
      const expectedSet = new Set(q.correctOptionIds || []);
      const isCorrect =
        selectedSet.size === expectedSet.size &&
        expectedSet.size > 0 &&
        Array.from(expectedSet).every((item) => selectedSet.has(item));
      if (isCorrect) {
        correctCount += 1;
        earnedPoints += qPoints;
      }
      return {
        questionId: q.id,
        isCorrect,
        earnedPoints: isCorrect ? qPoints : 0,
        maxPoints: qPoints,
      };
    }

    if (q.type === 'short_answer') {
      const rawText = (ans?.textAnswer || '').trim();
      if (q.autoGradeShortAnswer && q.acceptedAnswers && q.acceptedAnswers.length > 0) {
        const normalizedInput = rawText.toLowerCase().replace(/\s+/g, ' ');
        const matched = q.acceptedAnswers.some(
          (acc) => acc.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedInput
        );
        if (matched) {
          correctCount += 1;
          earnedPoints += qPoints;
        }
        return {
          questionId: q.id,
          isCorrect: matched,
          earnedPoints: matched ? qPoints : 0,
          maxPoints: qPoints,
        };
      }
      hasPendingManual = true;
      return {
        questionId: q.id,
        isCorrect: null,
        earnedPoints: 0,
        maxPoints: qPoints,
      };
    }

    // Essay question: strictly wait for teacher grading
    hasPendingManual = true;
    return {
      questionId: q.id,
      isCorrect: null,
      earnedPoints: 0,
      maxPoints: qPoints,
    };
  });

  const score10 = totalPoints > 0 ? Math.round(((earnedPoints / totalPoints) * 10) * 10) / 10 : 0;

  return {
    evaluations,
    correctCount,
    earnedPoints,
    totalPoints,
    score10,
    gradingStatus: hasPendingManual ? 'pending_essay' : 'graded',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(attachUser);

  // --- AUTH & BOOTSTRAP ---
  app.get('/api/bootstrap', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json(buildBootstrapPayload(req.user!));
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password, quickDemoSwitch } = req.body as {
      username?: string;
      password?: string;
      quickDemoSwitch?: boolean;
    };
    if (!username) {
      res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập.' });
      return;
    }
    const cleanUser = username.trim().toLowerCase();
    const account = dbState.users.find(
      (u) => u.username.toLowerCase() === cleanUser || (u.studentCode && u.studentCode.toLowerCase() === cleanUser)
    );
    if (!account) {
      res.status(401).json({ error: 'Không tìm thấy tài khoản phù hợp.' });
      return;
    }

    if (quickDemoSwitch && activeMode === 'demo') {
      const token = signToken(account.id, activeMode);
      res.json({ token, bootstrap: buildBootstrapPayload(account) });
      return;
    }

    if (!password || !verifyPassword(password, account.passwordSalt, account.passwordHash)) {
      res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu chưa chính xác.' });
      return;
    }

    const token = signToken(account.id, activeMode);
    res.json({ token, bootstrap: buildBootstrapPayload(account) });
  });

  app.post('/api/auth/change-password', requireAuth, (req: AuthedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    const user = req.user!;
    if (!verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
      res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
      return;
    }
    const updated = hashPassword(newPassword);
    user.passwordSalt = updated.salt;
    user.passwordHash = updated.hash;
    saveDb(activeMode, dbState);
    res.json({ message: 'Đổi mật khẩu thành công!' });
  });

  // --- DATA MODE SWITCH & RESET ---
  app.post('/api/system/mode', requireTeacher, (req: AuthedRequest, res: Response) => {
    const { mode } = req.body as { mode?: 'demo' | 'workspace' };
    if (mode !== 'demo' && mode !== 'workspace') {
      res.status(400).json({ error: 'Chế độ dữ liệu không hợp lệ.' });
      return;
    }
    activeMode = mode;
    saveActiveMode(mode);
    dbState = loadDb(mode);
    const teacher = dbState.users.find((u) => u.role === 'teacher') || dbState.users[0];
    const token = signToken(teacher.id, activeMode);
    res.json({ token, bootstrap: buildBootstrapPayload(teacher) });
  });

  app.post('/api/system/reset-demo', requireTeacher, (_req: AuthedRequest, res: Response) => {
    activeMode = 'demo';
    saveActiveMode('demo');
    dbState = createDemoSeedState();
    saveDb('demo', dbState);
    const teacher = dbState.users.find((u) => u.role === 'teacher')!;
    const token = signToken(teacher.id, 'demo');
    res.json({ token, bootstrap: buildBootstrapPayload(teacher) });
  });

  app.put('/api/settings', requireTeacher, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<DatabaseState['settings']>;
    dbState.settings = {
      ...dbState.settings,
      schoolName: (body.schoolName || dbState.settings.schoolName).trim().slice(0, 120),
      teacherName: (body.teacherName || dbState.settings.teacherName).trim().slice(0, 80),
      teacherEmail: (body.teacherEmail || dbState.settings.teacherEmail).trim().slice(0, 120),
      slogan: (body.slogan || dbState.settings.slogan).trim().slice(0, 200),
      academicYear: (body.academicYear || dbState.settings.academicYear).trim().slice(0, 30),
      defaultDurationMinutes: Math.max(5, Math.min(120, Number(body.defaultDurationMinutes) || 15)),
      allowStudentsViewResults:
        typeof body.allowStudentsViewResults === 'boolean'
          ? body.allowStudentsViewResults
          : dbState.settings.allowStudentsViewResults,
      recordGameScores:
        typeof body.recordGameScores === 'boolean' ? body.recordGameScores : dbState.settings.recordGameScores,
      dataMode: activeMode,
    };
    const teacherAcc = dbState.users.find((u) => u.role === 'teacher');
    if (teacherAcc) {
      teacherAcc.fullName = dbState.settings.teacherName;
      teacherAcc.schoolName = dbState.settings.schoolName;
      teacherAcc.email = dbState.settings.teacherEmail;
      teacherAcc.academicYear = dbState.settings.academicYear;
    }
    saveDb(activeMode, dbState);
    res.json({ settings: dbState.settings, currentUser: teacherAcc ? toPublicUser(teacherAcc) : undefined });
  });

  // --- CLASSES CRUD ---
  app.post('/api/classes', requireTeacher, (req: AuthedRequest, res: Response) => {
    const { code, name, grade, academicYear, teacherName } = req.body as Partial<ClassRoom>;
    if (!name || !code || ![3, 4, 5].includes(Number(grade))) {
      res.status(400).json({ error: 'Vui lòng nhập đầy đủ Mã lớp, Tên lớp và Khối (3, 4, 5).' });
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (dbState.classes.some((c) => c.code.toUpperCase() === cleanCode || c.name.toLowerCase() === cleanName.toLowerCase())) {
      res.status(400).json({ error: 'Mã lớp hoặc tên lớp đã tồn tại trong hệ thống.' });
      return;
    }
    const newClass: ClassRoom = {
      id: `cls-${crypto.randomUUID().slice(0, 8)}`,
      code: cleanCode,
      name: cleanName,
      grade: Number(grade) as 3 | 4 | 5,
      academicYear: (academicYear || dbState.settings.academicYear).trim(),
      teacherName: (teacherName || dbState.settings.teacherName).trim(),
      createdAt: new Date().toISOString(),
    };
    dbState.classes.push(newClass);
    saveDb(activeMode, dbState);
    res.json({ classRoom: newClass });
  });

  app.put('/api/classes/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const cls = dbState.classes.find((c) => c.id === req.params.id);
    if (!cls) {
      res.status(404).json({ error: 'Không tìm thấy lớp học.' });
      return;
    }
    const { code, name, grade, academicYear, teacherName } = req.body as Partial<ClassRoom>;
    if (code) cls.code = code.trim().toUpperCase();
    if (name) cls.name = name.trim();
    if (grade && [3, 4, 5].includes(Number(grade))) cls.grade = Number(grade) as 3 | 4 | 5;
    if (academicYear) cls.academicYear = academicYear.trim();
    if (teacherName) cls.teacherName = teacherName.trim();

    // Sync denormalized className & grade on students/users/submissions
    dbState.students.forEach((s) => {
      if (s.classId === cls.id) {
        s.className = cls.name;
        s.grade = cls.grade;
      }
    });
    dbState.users.forEach((u) => {
      if (u.classId === cls.id) {
        u.className = cls.name;
        u.grade = cls.grade;
      }
    });
    dbState.submissions.forEach((sub) => {
      if (sub.classId === cls.id) {
        sub.className = cls.name;
        sub.grade = cls.grade;
      }
    });

    saveDb(activeMode, dbState);
    res.json({ classRoom: cls });
  });

  app.delete('/api/classes/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const classId = req.params.id;
    const cls = dbState.classes.find((c) => c.id === classId);
    if (!cls) {
      res.status(404).json({ error: 'Không tìm thấy lớp học.' });
      return;
    }
    const linkedStudents = dbState.students.filter((s) => s.classId === classId);
    const linkedSubmissions = dbState.submissions.filter((sub) => sub.classId === classId);
    const transferToClassId = req.query.transferToClassId as string | undefined;

    if ((linkedStudents.length > 0 || linkedSubmissions.length > 0) && !transferToClassId) {
      res.status(409).json({
        error: `Lớp ${cls.name} hiện có ${linkedStudents.length} học sinh và ${linkedSubmissions.length} bài nộp. Hệ thống không tự động xóa dữ liệu học sinh hoặc bài làm liên quan. Vui lòng chọn lớp chuyển tiếp học sinh trước khi xóa lớp.`,
        studentCount: linkedStudents.length,
        submissionCount: linkedSubmissions.length,
      });
      return;
    }

    if (transferToClassId) {
      const targetCls = dbState.classes.find((c) => c.id === transferToClassId && c.id !== classId);
      if (!targetCls) {
        res.status(400).json({ error: 'Lớp chuyển đến không hợp lệ.' });
        return;
      }
      dbState.students.forEach((s) => {
        if (s.classId === classId) {
          s.classId = targetCls.id;
          s.className = targetCls.name;
          s.grade = targetCls.grade;
        }
      });
      dbState.users.forEach((u) => {
        if (u.classId === classId) {
          u.classId = targetCls.id;
          u.className = targetCls.name;
          u.grade = targetCls.grade;
        }
      });
    }

    dbState.classes = dbState.classes.filter((c) => c.id !== classId);
    saveDb(activeMode, dbState);
    res.json({ message: `Đã xóa lớp ${cls.name} an toàn.` });
  });

  // --- STUDENTS CRUD & BULK IMPORT ---
  app.post('/api/students', requireTeacher, (req: AuthedRequest, res: Response) => {
    const { studentCode, fullName, classId, status, password } = req.body as {
      studentCode?: string;
      fullName?: string;
      classId?: string;
      status?: Student['status'];
      password?: string;
    };
    if (!studentCode || !fullName || !classId) {
      res.status(400).json({ error: 'Vui lòng điền Mã học sinh, Họ và tên, và Lớp học.' });
      return;
    }
    const cleanCode = studentCode.trim().toUpperCase();
    if (dbState.students.some((s) => s.studentCode.toUpperCase() === cleanCode)) {
      res.status(400).json({ error: `Mã học sinh "${cleanCode}" đã tồn tại. Mã học sinh phải là duy nhất.` });
      return;
    }
    const cls = dbState.classes.find((c) => c.id === classId);
    if (!cls) {
      res.status(400).json({ error: 'Lớp học được chọn không tồn tại.' });
      return;
    }
    const username = cleanCode.toLowerCase();
    const newStudent: Student = {
      id: `stu-${crypto.randomUUID().slice(0, 8)}`,
      studentCode: cleanCode,
      fullName: fullName.trim(),
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      academicYear: cls.academicYear,
      username,
      status: status || 'active',
      createdAt: new Date().toISOString(),
    };
    const hashed = hashPassword(password && password.length >= 6 ? password : 'Hs@123456');
    const newUser: StoredAccount = {
      id: `usr-${newStudent.id}`,
      username,
      fullName: newStudent.fullName,
      role: 'student',
      schoolName: dbState.settings.schoolName,
      studentId: newStudent.id,
      studentCode: newStudent.studentCode,
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      academicYear: cls.academicYear,
      passwordSalt: hashed.salt,
      passwordHash: hashed.hash,
    };

    dbState.students.push(newStudent);
    dbState.users.push(newUser);
    saveDb(activeMode, dbState);
    res.json({ student: newStudent });
  });

  app.post('/api/students/bulk-import', requireTeacher, (req: AuthedRequest, res: Response) => {
    const { rows } = req.body as {
      rows?: Array<{ studentCode: string; fullName: string; className: string; academicYear?: string }>;
    };
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'Danh sách nhập trống hoặc không đúng định dạng.' });
      return;
    }
    let importedCount = 0;
    const skipped: string[] = [];

    for (const row of rows) {
      const code = String(row.studentCode || '').trim().toUpperCase();
      const name = String(row.fullName || '').trim();
      const clsName = String(row.className || '').trim();
      if (!code || !name || !clsName) {
        skipped.push(`${code || '(Thiếu mã)'}: Thiếu thông tin bắt buộc`);
        continue;
      }
      if (dbState.students.some((s) => s.studentCode.toUpperCase() === code)) {
        skipped.push(`${code}: Trùng mã học sinh`);
        continue;
      }
      let cls = dbState.classes.find((c) => c.name.toLowerCase() === clsName.toLowerCase() || c.code.toLowerCase() === clsName.toLowerCase());
      if (!cls) {
        const inferredGrade = clsName.startsWith('4') ? 4 : clsName.startsWith('5') ? 5 : 3;
        cls = {
          id: `cls-${crypto.randomUUID().slice(0, 8)}`,
          code: `TIN-${clsName.toUpperCase()}`,
          name: clsName.toUpperCase(),
          grade: inferredGrade,
          academicYear: row.academicYear?.trim() || dbState.settings.academicYear,
          teacherName: dbState.settings.teacherName,
          createdAt: new Date().toISOString(),
        };
        dbState.classes.push(cls);
      }

      const username = code.toLowerCase();
      const stu: Student = {
        id: `stu-${crypto.randomUUID().slice(0, 8)}`,
        studentCode: code,
        fullName: name,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        academicYear: row.academicYear?.trim() || cls.academicYear,
        username,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const hashed = hashPassword('Hs@123456');
      dbState.students.push(stu);
      dbState.users.push({
        id: `usr-${stu.id}`,
        username,
        fullName: stu.fullName,
        role: 'student',
        schoolName: dbState.settings.schoolName,
        studentId: stu.id,
        studentCode: stu.studentCode,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        academicYear: stu.academicYear,
        passwordSalt: hashed.salt,
        passwordHash: hashed.hash,
      });
      importedCount += 1;
    }

    saveDb(activeMode, dbState);
    res.json({ importedCount, skipped, students: dbState.students, classes: dbState.classes });
  });

  app.put('/api/students/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const stu = dbState.students.find((s) => s.id === req.params.id);
    if (!stu) {
      res.status(404).json({ error: 'Không tìm thấy học sinh.' });
      return;
    }
    const { studentCode, fullName, classId, status } = req.body as Partial<Student>;
    if (studentCode) {
      const cleanCode = studentCode.trim().toUpperCase();
      if (dbState.students.some((s) => s.id !== stu.id && s.studentCode.toUpperCase() === cleanCode)) {
        res.status(400).json({ error: `Mã học sinh "${cleanCode}" đã được sử dụng.` });
        return;
      }
      stu.studentCode = cleanCode;
      stu.username = cleanCode.toLowerCase();
    }
    if (fullName) stu.fullName = fullName.trim();
    if (status) stu.status = status;
    if (classId && classId !== stu.classId) {
      const targetCls = dbState.classes.find((c) => c.id === classId);
      if (!targetCls) {
        res.status(400).json({ error: 'Lớp chuyển đến không tồn tại.' });
        return;
      }
      stu.classId = targetCls.id;
      stu.className = targetCls.name;
      stu.grade = targetCls.grade;
    }

    const userAcc = dbState.users.find((u) => u.studentId === stu.id);
    if (userAcc) {
      userAcc.fullName = stu.fullName;
      userAcc.studentCode = stu.studentCode;
      userAcc.username = stu.username;
      userAcc.classId = stu.classId;
      userAcc.className = stu.className;
      userAcc.grade = stu.grade;
    }

    saveDb(activeMode, dbState);
    res.json({ student: stu });
  });

  app.delete('/api/students/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const stu = dbState.students.find((s) => s.id === req.params.id);
    if (!stu) {
      res.status(404).json({ error: 'Không tìm thấy học sinh.' });
      return;
    }
    dbState.students = dbState.students.filter((s) => s.id !== stu.id);
    dbState.users = dbState.users.filter((u) => u.studentId !== stu.id);
    saveDb(activeMode, dbState);
    res.json({ message: 'Đã xóa hồ sơ học sinh.' });
  });

  // --- LESSONS CRUD ---
  app.post('/api/lessons', requireTeacher, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<Lesson>;
    if (!body.title || !body.topic || ![3, 4, 5].includes(Number(body.grade))) {
      res.status(400).json({ error: 'Vui lòng điền Tên bài giảng, Chủ đề và Khối lớp.' });
      return;
    }
    const now = new Date().toISOString();
    const lesson: Lesson = {
      id: `les-${crypto.randomUUID().slice(0, 8)}`,
      title: body.title.trim(),
      grade: Number(body.grade) as 3 | 4 | 5,
      topic: body.topic.trim(),
      lessonNumber: (body.lessonNumber || 'Bài mới').trim(),
      content: (body.content || '').trim(),
      imageUrl: body.imageUrl?.trim() || undefined,
      videoUrl: body.videoUrl?.trim() || undefined,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      targetClassIds: Array.isArray(body.targetClassIds) ? body.targetClassIds : [],
      published: Boolean(body.published),
      createdAt: now,
      updatedAt: now,
    };
    dbState.lessons.unshift(lesson);
    saveDb(activeMode, dbState);
    res.json({ lesson });
  });

  app.put('/api/lessons/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const idx = dbState.lessons.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Không tìm thấy bài giảng.' });
      return;
    }
    const existing = dbState.lessons[idx];
    const body = req.body as Partial<Lesson>;
    const updated: Lesson = {
      ...existing,
      title: body.title !== undefined ? body.title.trim() : existing.title,
      grade: body.grade && [3, 4, 5].includes(Number(body.grade)) ? (Number(body.grade) as 3 | 4 | 5) : existing.grade,
      topic: body.topic !== undefined ? body.topic.trim() : existing.topic,
      lessonNumber: body.lessonNumber !== undefined ? body.lessonNumber.trim() : existing.lessonNumber,
      content: body.content !== undefined ? body.content.trim() : existing.content,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl.trim() || undefined : existing.imageUrl,
      videoUrl: body.videoUrl !== undefined ? body.videoUrl.trim() || undefined : existing.videoUrl,
      attachments: Array.isArray(body.attachments) ? body.attachments : existing.attachments,
      targetClassIds: Array.isArray(body.targetClassIds) ? body.targetClassIds : existing.targetClassIds,
      published: typeof body.published === 'boolean' ? body.published : existing.published,
      updatedAt: new Date().toISOString(),
    };
    dbState.lessons[idx] = updated;
    saveDb(activeMode, dbState);
    res.json({ lesson: updated });
  });

  app.delete('/api/lessons/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    dbState.lessons = dbState.lessons.filter((l) => l.id !== req.params.id);
    saveDb(activeMode, dbState);
    res.json({ message: 'Đã xóa bài giảng.' });
  });

  // --- QUESTION BANK CRUD & BULK IMPORT ---
  app.post('/api/questions', requireTeacher, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<Question>;
    if (!body.prompt || !body.type || ![3, 4, 5].includes(Number(body.grade))) {
      res.status(400).json({ error: 'Vui lòng nhập Nội dung câu hỏi, Loại câu hỏi và Khối lớp.' });
      return;
    }
    const question: Question = {
      id: `q-${crypto.randomUUID().slice(0, 8)}`,
      type: body.type,
      grade: Number(body.grade) as 3 | 4 | 5,
      topic: (body.topic || 'Chủ đề chung').trim(),
      difficulty: body.difficulty || 'nhan_biet',
      prompt: body.prompt.trim(),
      imageUrl: body.imageUrl?.trim() || undefined,
      options: Array.isArray(body.options) ? body.options : [],
      correctOptionIds: Array.isArray(body.correctOptionIds) ? body.correctOptionIds : [],
      acceptedAnswers: Array.isArray(body.acceptedAnswers) ? body.acceptedAnswers : [],
      autoGradeShortAnswer: Boolean(body.autoGradeShortAnswer),
      points: Math.max(0.25, Number(body.points) || 1),
      explanation: body.explanation?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    dbState.questions.unshift(question);
    saveDb(activeMode, dbState);
    res.json({ question });
  });

  app.post('/api/questions/bulk-import', requireTeacher, (req: AuthedRequest, res: Response) => {
    const { questions } = req.body as { questions?: Partial<Question>[] };
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: 'Tệp câu hỏi trống hoặc không hợp lệ.' });
      return;
    }
    let count = 0;
    for (const q of questions) {
      if (!q.prompt) continue;
      dbState.questions.unshift({
        id: `q-${crypto.randomUUID().slice(0, 8)}`,
        type: q.type || 'single_choice',
        grade: [3, 4, 5].includes(Number(q.grade)) ? (Number(q.grade) as 3 | 4 | 5) : 3,
        topic: (q.topic || 'Chủ đề nhập tệp').trim(),
        difficulty: q.difficulty || 'nhan_biet',
        prompt: q.prompt.trim(),
        imageUrl: q.imageUrl,
        options: Array.isArray(q.options) ? q.options : [],
        correctOptionIds: Array.isArray(q.correctOptionIds) ? q.correctOptionIds : [],
        acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [],
        autoGradeShortAnswer: Boolean(q.autoGradeShortAnswer),
        points: Math.max(0.25, Number(q.points) || 1),
        explanation: q.explanation,
        createdAt: new Date().toISOString(),
      });
      count += 1;
    }
    saveDb(activeMode, dbState);
    res.json({ importedCount: count, questions: dbState.questions });
  });

  app.put('/api/questions/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const idx = dbState.questions.findIndex((q) => q.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
      return;
    }
    const existing = dbState.questions[idx];
    const body = req.body as Partial<Question>;
    const updated: Question = {
      ...existing,
      ...body,
      id: existing.id,
      grade: body.grade && [3, 4, 5].includes(Number(body.grade)) ? (Number(body.grade) as 3 | 4 | 5) : existing.grade,
      points: body.points !== undefined ? Math.max(0.25, Number(body.points) || 1) : existing.points,
    };
    dbState.questions[idx] = updated;
    saveDb(activeMode, dbState);
    res.json({ question: updated });
  });

  app.delete('/api/questions/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    dbState.questions = dbState.questions.filter((q) => q.id !== req.params.id);
    saveDb(activeMode, dbState);
    res.json({ message: 'Đã xóa câu hỏi khỏi ngân hàng.' });
  });

  // --- ASSIGNMENTS CRUD ---
  app.post('/api/assignments', requireTeacher, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<Assignment>;
    if (!body.title || ![3, 4, 5].includes(Number(body.grade))) {
      res.status(400).json({ error: 'Vui lòng nhập Tên bài tập và Khối lớp.' });
      return;
    }
    if (body.status === 'published' && (!Array.isArray(body.questions) || body.questions.length === 0)) {
      res.status(400).json({ error: 'Bài tập xuất bản phải có ít nhất 1 câu hỏi.' });
      return;
    }
    if (body.status === 'published' && (!Array.isArray(body.classIds) || body.classIds.length === 0)) {
      res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 lớp học để giao bài.' });
      return;
    }

    const now = new Date().toISOString();
    const assignment: Assignment = {
      id: `asg-${crypto.randomUUID().slice(0, 8)}`,
      title: body.title.trim(),
      grade: Number(body.grade) as 3 | 4 | 5,
      classIds: Array.isArray(body.classIds) ? body.classIds : [],
      instructions: (body.instructions || 'Đọc kỹ câu hỏi trước khi chọn đáp án.').trim(),
      questions: Array.isArray(body.questions) ? body.questions : [],
      durationMinutes: Math.max(1, Math.min(180, Number(body.durationMinutes) || dbState.settings.defaultDurationMinutes)),
      dueDate: body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      maxAttempts: Math.max(1, Math.min(10, Number(body.maxAttempts) || 1)),
      status: body.status === 'published' ? 'published' : 'draft',
      allowViewScore: typeof body.allowViewScore === 'boolean' ? body.allowViewScore : true,
      createdAt: now,
      updatedAt: now,
    };

    dbState.assignments.unshift(assignment);

    // Auto-create announcement when teacher publishes assignment
    if (assignment.status === 'published') {
      dbState.notifications.unshift({
        id: `noti-${crypto.randomUUID().slice(0, 8)}`,
        title: `Bài tập mới: ${assignment.title}`,
        message: `Cô ${dbState.settings.teacherName} vừa giao bài tập "${assignment.title}" (${assignment.questions.length} câu - ${assignment.durationMinutes} phút).`,
        type: 'assignment',
        targetClassIds: assignment.classIds,
        createdAt: now,
        createdBy: dbState.settings.teacherName,
      });
    }

    saveDb(activeMode, dbState);
    res.json({ assignment, notifications: dbState.notifications });
  });

  app.put('/api/assignments/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    const idx = dbState.assignments.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Không tìm thấy bài tập.' });
      return;
    }
    const existing = dbState.assignments[idx];
    const body = req.body as Partial<Assignment>;
    const nextStatus = body.status || existing.status;
    const nextQuestions = Array.isArray(body.questions) ? body.questions : existing.questions;
    const nextClassIds = Array.isArray(body.classIds) ? body.classIds : existing.classIds;

    if (nextStatus === 'published' && nextQuestions.length === 0) {
      res.status(400).json({ error: 'Cần có ít nhất 1 câu hỏi trước khi xuất bản bài tập.' });
      return;
    }
    if (nextStatus === 'published' && nextClassIds.length === 0) {
      res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 lớp được giao bài.' });
      return;
    }

    const updated: Assignment = {
      ...existing,
      ...body,
      id: existing.id,
      questions: nextQuestions,
      classIds: nextClassIds,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    dbState.assignments[idx] = updated;

    if (existing.status === 'draft' && updated.status === 'published') {
      dbState.notifications.unshift({
        id: `noti-${crypto.randomUUID().slice(0, 8)}`,
        title: `Đã giao bài tập: ${updated.title}`,
        message: `Các em vào mục Giao bài tập để hoàn thành bài "${updated.title}" đúng hạn nhé.`,
        type: 'assignment',
        targetClassIds: updated.classIds,
        createdAt: new Date().toISOString(),
        createdBy: dbState.settings.teacherName,
      });
    }

    saveDb(activeMode, dbState);
    res.json({ assignment: updated, notifications: dbState.notifications });
  });

  app.delete('/api/assignments/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    dbState.assignments = dbState.assignments.filter((a) => a.id !== req.params.id);
    saveDb(activeMode, dbState);
    res.json({ message: 'Đã xóa bài tập.' });
  });

  // --- SUBMISSIONS & SERVER-SIDE GRADING ---
  app.post('/api/submissions', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { assignmentId, submissionKey, startedAt, answers, previewStudentId } = req.body as {
      assignmentId?: string;
      submissionKey?: string;
      startedAt?: string;
      answers?: SubmissionAnswer[];
      previewStudentId?: string;
    };

    if (!assignmentId || !submissionKey || !Array.isArray(answers)) {
      res.status(400).json({ error: 'Dữ liệu bài nộp không hợp lệ.' });
      return;
    }

    // Idempotency check: prevent duplicate submissions if student clicks "Nộp bài" multiple times
    const existingDuplicate = dbState.submissions.find((s) => s.submissionKey === submissionKey);
    if (existingDuplicate) {
      res.json({ submission: existingDuplicate, deduplicated: true });
      return;
    }

    const assignment = dbState.assignments.find((a) => a.id === assignmentId);
    if (!assignment || assignment.status !== 'published') {
      res.status(404).json({ error: 'Bài tập không tồn tại hoặc chưa được xuất bản.' });
      return;
    }

    let studentRecord: Student | undefined;
    if (user.role === 'student') {
      studentRecord = dbState.students.find((s) => s.id === user.studentId);
      if (!studentRecord || !assignment.classIds.includes(studentRecord.classId)) {
        res.status(403).json({ error: 'Bài tập này không được giao cho lớp của em.' });
        return;
      }
    } else if (user.role === 'teacher' && previewStudentId) {
      studentRecord = dbState.students.find((s) => s.id === previewStudentId);
    }

    if (!studentRecord) {
      res.status(400).json({ error: 'Không xác định được thông tin học sinh làm bài.' });
      return;
    }

    const previousAttempts = dbState.submissions.filter(
      (s) => s.assignmentId === assignment.id && s.studentId === studentRecord!.id
    );

    if (previousAttempts.length >= assignment.maxAttempts) {
      res.status(403).json({
        error: `Em đã hết lượt làm bài (Tối đa ${assignment.maxAttempts} lần theo cấu hình của giáo viên).`,
      });
      return;
    }

    const graded = evaluateSubmissionOnServer(assignment, answers);
    const nowIso = new Date().toISOString();

    const newSubmission: Submission = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      submissionKey,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentId: studentRecord.id,
      studentCode: studentRecord.studentCode,
      studentName: studentRecord.fullName,
      classId: studentRecord.classId,
      className: studentRecord.className,
      grade: studentRecord.grade,
      attemptNumber: previousAttempts.length + 1,
      startedAt: startedAt || nowIso,
      submittedAt: nowIso,
      answers,
      evaluations: graded.evaluations,
      correctCount: graded.correctCount,
      totalQuestions: assignment.questions.length,
      earnedPoints: graded.earnedPoints,
      totalPoints: graded.totalPoints,
      score10: graded.score10,
      gradingStatus: graded.gradingStatus,
    };

    dbState.submissions.unshift(newSubmission);
    saveDb(activeMode, dbState);

    const canReveal = assignment.allowViewScore && dbState.settings.allowStudentsViewResults;
    res.json({
      submission: !canReveal && user.role === 'student'
        ? { ...newSubmission, score10: -1, earnedPoints: 0, evaluations: [] }
        : newSubmission,
      revealedAssignment: canReveal ? assignment : undefined,
    });
  });

  // Teacher manual essay/short-answer grading & feedback
  app.put('/api/submissions/:id/grade', requireTeacher, (req: AuthedRequest, res: Response) => {
    const sub = dbState.submissions.find((s) => s.id === req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Không tìm thấy bài nộp.' });
      return;
    }
    const { questionUpdates, teacherFeedback } = req.body as {
      questionUpdates?: Array<{ questionId: string; earnedPoints: number; teacherComment?: string }>;
      teacherFeedback?: string;
    };

    if (Array.isArray(questionUpdates)) {
      sub.evaluations = sub.evaluations.map((ev) => {
        const match = questionUpdates.find((u) => u.questionId === ev.questionId);
        if (!match) return ev;
        const clamped = Math.max(0, Math.min(ev.maxPoints, Number(match.earnedPoints) || 0));
        return {
          ...ev,
          earnedPoints: clamped,
          isCorrect: clamped >= ev.maxPoints * 0.5,
          teacherComment: match.teacherComment?.trim() || ev.teacherComment,
        };
      });
    }

    let earned = 0;
    let correct = 0;
    sub.evaluations.forEach((ev) => {
      earned += ev.earnedPoints;
      if (ev.isCorrect) correct += 1;
    });
    sub.earnedPoints = Math.round(earned * 100) / 100;
    sub.correctCount = correct;
    sub.score10 = sub.totalPoints > 0 ? Math.round(((earned / sub.totalPoints) * 10) * 10) / 10 : 0;
    sub.gradingStatus = 'graded';
    if (teacherFeedback !== undefined) {
      sub.teacherFeedback = teacherFeedback.trim();
    }

    saveDb(activeMode, dbState);
    res.json({ submission: sub });
  });

  // --- RESOURCES CRUD ---
  app.post('/api/resources', requireTeacher, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<ResourceItem>;
    if (!body.title || !body.category) {
      res.status(400).json({ error: 'Vui lòng nhập Tên tài nguyên và Danh mục.' });
      return;
    }
    const resource: ResourceItem = {
      id: `res-${crypto.randomUUID().slice(0, 8)}`,
      title: body.title.trim(),
      category: body.category,
      grade: body.grade === 'all' || ![3, 4, 5].includes(Number(body.grade)) ? 'all' : (Number(body.grade) as 3 | 4 | 5),
      description: (body.description || '').trim(),
      url: (body.url || '#tai-nguyen').trim(),
      fileFormat: (body.fileFormat || body.category.toUpperCase()).trim(),
      accessLevel: body.accessLevel === 'teacher_only' ? 'teacher_only' : 'all',
      createdAt: new Date().toISOString(),
    };
    dbState.resources.unshift(resource);
    saveDb(activeMode, dbState);
    res.json({ resource });
  });

  app.delete('/api/resources/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    dbState.resources = dbState.resources.filter((r) => r.id !== req.params.id);
    saveDb(activeMode, dbState);
    res.json({ message: 'Đã xóa tài nguyên.' });
  });

  // --- NOTIFICATIONS CRUD ---
  app.post('/api/notifications', requireTeacher, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<NotificationItem>;
    if (!body.title || !body.message) {
      res.status(400).json({ error: 'Vui lòng nhập Tiêu đề và Nội dung thông báo.' });
      return;
    }
    const noti: NotificationItem = {
      id: `noti-${crypto.randomUUID().slice(0, 8)}`,
      title: body.title.trim(),
      message: body.message.trim(),
      type: body.type || 'general',
      targetClassIds: Array.isArray(body.targetClassIds) ? body.targetClassIds : [],
      createdAt: new Date().toISOString(),
      createdBy: dbState.settings.teacherName,
    };
    dbState.notifications.unshift(noti);
    saveDb(activeMode, dbState);
    res.json({ notification: noti });
  });

  app.delete('/api/notifications/:id', requireTeacher, (req: AuthedRequest, res: Response) => {
    dbState.notifications = dbState.notifications.filter((n) => n.id !== req.params.id);
    saveDb(activeMode, dbState);
    res.json({ message: 'Đã xóa thông báo.' });
  });

  // --- GAME RECORDS ---
  app.post('/api/games/records', requireAuth, (req: AuthedRequest, res: Response) => {
    if (!dbState.settings.recordGameScores) {
      res.json({ recorded: false });
      return;
    }
    const user = req.user!;
    const { gameType, gameTitle, score, maxScore, durationSeconds } = req.body as Partial<GameRecord>;
    const rec: GameRecord = {
      id: `gm-${crypto.randomUUID().slice(0, 8)}`,
      gameType: String(gameType || 'quiz'),
      gameTitle: String(gameTitle || 'Trò chơi Tin học'),
      userId: user.id,
      studentName: user.fullName,
      className: user.className || (user.role === 'teacher' ? 'Giáo viên' : 'Khối Tiểu học'),
      score: Math.max(0, Number(score) || 0),
      maxScore: Math.max(1, Number(maxScore) || 100),
      durationSeconds: Math.max(1, Number(durationSeconds) || 30),
      createdAt: new Date().toISOString(),
    };
    dbState.gameRecords.unshift(rec);
    saveDb(activeMode, dbState);
    res.json({ recorded: true, gameRecord: rec });
  });

  // --- FULL BACKUP EXPORT ---
  app.get('/api/system/backup', requireTeacher, (_req: AuthedRequest, res: Response) => {
    const safeBackup = {
      exportedAt: new Date().toISOString(),
      mode: activeMode,
      settings: dbState.settings,
      classes: dbState.classes,
      students: dbState.students,
      lessons: dbState.lessons,
      questions: dbState.questions,
      assignments: dbState.assignments,
      submissions: dbState.submissions,
      resources: dbState.resources,
      notifications: dbState.notifications,
      gameRecords: dbState.gameRecords,
    };
    res.json(safeBackup);
  });

  // Mount Vite dev server in development or static dist in production
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'));
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LMS Tin Học Tiểu Học server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
