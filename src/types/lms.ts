export type UserRole = 'teacher' | 'student';

export type ModuleId =
  | 'home'
  | 'overview'
  | 'classes'
  | 'students'
  | 'lessons'
  | 'assignments'
  | 'results'
  | 'games'
  | 'questions'
  | 'resources'
  | 'notifications'
  | 'settings';

export type GradeLevel = 3 | 4 | 5;

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  schoolName: string;
  email?: string;
  studentId?: string;
  studentCode?: string;
  classId?: string;
  className?: string;
  grade?: GradeLevel;
  academicYear: string;
}

export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  grade: GradeLevel;
  academicYear: string;
  teacherName: string;
  createdAt: string;
}

export type StudentStatus = 'active' | 'paused' | 'transferred';

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  academicYear: string;
  username: string;
  status: StudentStatus;
  createdAt: string;
}

export interface LessonAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'pptx' | 'doc';
  url: string;
  sizeLabel: string;
}

export interface Lesson {
  id: string;
  title: string;
  grade: GradeLevel;
  topic: string;
  lessonNumber: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  attachments: LessonAttachment[];
  targetClassIds: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay';

export type DifficultyLevel = 'nhan_biet' | 'thong_hieu' | 'van_dung';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  grade: GradeLevel;
  topic: string;
  difficulty: DifficultyLevel;
  prompt: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  acceptedAnswers: string[];
  autoGradeShortAnswer: boolean;
  points: number;
  explanation?: string;
  createdAt: string;
}

export type AssignmentStatus = 'draft' | 'published';

export interface Assignment {
  id: string;
  title: string;
  grade: GradeLevel;
  classIds: string[];
  instructions: string;
  questions: Question[];
  durationMinutes: number;
  dueDate: string;
  maxAttempts: number;
  status: AssignmentStatus;
  allowViewScore: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export interface QuestionEvaluation {
  questionId: string;
  isCorrect: boolean | null;
  earnedPoints: number;
  maxPoints: number;
  teacherComment?: string;
}

export type GradingStatus = 'graded' | 'pending_essay';

export interface Submission {
  id: string;
  submissionKey: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string;
  answers: SubmissionAnswer[];
  evaluations: QuestionEvaluation[];
  correctCount: number;
  totalQuestions: number;
  earnedPoints: number;
  totalPoints: number;
  score10: number;
  gradingStatus: GradingStatus;
  teacherFeedback?: string;
}

export type ResourceCategory =
  | 'image'
  | 'video'
  | 'pdf'
  | 'pptx'
  | 'practice'
  | 'software_guide';

export interface ResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  grade: GradeLevel | 'all';
  description: string;
  url: string;
  fileFormat: string;
  accessLevel: 'all' | 'teacher_only';
  createdAt: string;
}

export type NotificationType =
  | 'assignment'
  | 'deadline'
  | 'material'
  | 'schedule'
  | 'general';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetClassIds: string[];
  createdAt: string;
  createdBy: string;
}

export interface GameRecord {
  id: string;
  gameType: string;
  gameTitle: string;
  userId: string;
  studentName: string;
  className: string;
  score: number;
  maxScore: number;
  durationSeconds: number;
  createdAt: string;
}

export interface SystemSettings {
  schoolName: string;
  teacherName: string;
  teacherEmail: string;
  slogan: string;
  academicYear: string;
  defaultDurationMinutes: number;
  allowStudentsViewResults: boolean;
  recordGameScores: boolean;
  dataMode: 'demo' | 'workspace';
}

export interface LmsBootstrapPayload {
  currentUser: UserProfile;
  settings: SystemSettings;
  classes: ClassRoom[];
  students: Student[];
  lessons: Lesson[];
  assignments: Assignment[];
  questions: Question[];
  submissions: Submission[];
  resources: ResourceItem[];
  notifications: NotificationItem[];
  gameRecords: GameRecord[];
  demoAccounts: {
    username: string;
    role: UserRole;
    label: string;
    className?: string;
  }[];
}
