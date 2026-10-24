import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Cpu,
  Gamepad2,
  HelpCircle,
  Puzzle,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GameRecord, Question, SystemSettings } from '../types/lms';
import { playSoundEffect } from '../utils/sound';

interface GamesViewProps {
  questions: Question[];
  gameRecords: GameRecord[];
  settings: SystemSettings;
  onSaveGameScore: (payload: {
    gameType: string;
    gameTitle: string;
    score: number;
    maxScore: number;
    durationSeconds: number;
  }) => Promise<void>;
}

type ActiveGameId =
  | null
  | 'millionaire'
  | 'wheel'
  | 'crossword'
  | 'hardware_match'
  | 'true_false'
  | 'challenge10';

const CROSSWORD_PUZZLES = [
  {
    clue: 'Thiết bị cầm tay giúp điều khiển con trỏ mũi tên trên màn hình máy tính (5 chữ cái)',
    answer: 'CHUOT',
    displayAnswer: 'CHUỘT',
  },
  {
    clue: 'Thiết bị có nhiều phím chữ và số, có hai phím gai F và J (7 chữ cái không dấu)',
    answer: 'BANPHIM',
    displayAnswer: 'BÀN PHÍM',
  },
  {
    clue: 'Phần mềm đồ họa quen thuộc dùng để vẽ tranh và tô màu trên Windows (5 chữ cái)',
    answer: 'PAINT',
    displayAnswer: 'PAINT',
  },
  {
    clue: 'Mạng máy tính toàn cầu giúp em tìm kiếm thông tin và học tập trực tuyến (8 chữ cái)',
    answer: 'INTERNET',
    displayAnswer: 'INTERNET',
  },
  {
    clue: 'Phần mềm lập trình trực quan bằng cách kéo thả khối lệnh với biểu tượng chú mèo (7 chữ cái)',
    answer: 'SCRATCH',
    displayAnswer: 'SCRATCH',
  },
];

const HARDWARE_PAIRS = [
  { id: 'monitor', device: 'Màn hình máy tính', role: 'Hiển thị hình ảnh, văn bản và kết quả hoạt động' },
  { id: 'cpu', device: 'Thân máy (CPU)', role: 'Bộ não điều khiển và xử lý mọi thông tin' },
  { id: 'keyboard', device: 'Bàn phím', role: 'Gõ chữ, số và gửi tín hiệu lệnh vào máy tính' },
  { id: 'mouse', device: 'Chuột máy tính', role: 'Di chuyển con trỏ để chọn nhanh biểu tượng' },
  { id: 'speaker', device: 'Loa máy tính', role: 'Phát âm thanh, bài hát và lời giảng bài' },
  { id: 'printer', device: 'Máy in', role: 'In văn bản và tranh vẽ từ máy tính ra giấy' },
];

export const GamesView: React.FC<GamesViewProps> = ({
  questions,
  gameRecords,
  settings,
  onSaveGameScore,
}) => {
  const [muted, setMuted] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGameId>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const mcQuestions = useMemo(
    () => questions.filter((q) => q.type === 'single_choice' && q.options.length >= 2),
    [questions]
  );

  const tfQuestions = useMemo(() => {
    const nativeTf = questions.filter((q) => q.type === 'true_false');
    // Supplement from single_choice turned into statements so there are plenty of questions
    const extra = mcQuestions.slice(0, 6).map((q, idx) => {
      const pickCorrect = idx % 2 === 0;
      const opt = pickCorrect
        ? q.options.find((o) => q.correctOptionIds.includes(o.id)) || q.options[0]
        : q.options.find((o) => !q.correctOptionIds.includes(o.id)) || q.options[0];
      return {
        id: `tf-gen-${q.id}`,
        prompt: `${q.prompt} -> Đáp án "${opt.text}" là đúng hay sai?`,
        isTrue: pickCorrect,
      };
    });
    return [
      ...nativeTf.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        isTrue: q.correctOptionIds[0] === 'TRUE',
      })),
      ...extra,
    ];
  }, [questions, mcQuestions]);

  // --- Shared Game State ---
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Millionaire lifelines
  const [used5050, setUsed5050] = useState(false);
  const [hiddenOpts, setHiddenOpts] = useState<string[]>([]);
  const [usedAudience, setUsedAudience] = useState(false);
  const [usedSwap, setUsedSwap] = useState(false);

  // Wheel state
  const [wheelBonus, setWheelBonus] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);

  // Crossword state
  const [cwIdx, setCwIdx] = useState(0);
  const [cwInput, setCwInput] = useState('');

  // Hardware Match state
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [shuffledRoles, setShuffledRoles] = useState(HARDWARE_PAIRS);

  const startGame = (id: ActiveGameId) => {
    setActiveGame(id);
    setStartTime(Date.now());
    setQIndex(0);
    setScore(0);
    setFinished(false);
    setFeedbackMsg(null);
    setUsed5050(false);
    setHiddenOpts([]);
    setUsedAudience(false);
    setUsedSwap(false);
    setWheelBonus(null);
    setCwIdx(0);
    setCwInput('');
    setSelectedDevice(null);
    setMatchedIds([]);
    setShuffledRoles([...HARDWARE_PAIRS].sort(() => Math.random() - 0.5));
  };

  const finishAndRecord = async (finalScore: number, maxScore: number, title: string, type: string) => {
    setFinished(true);
    playSoundEffect('win', muted);
    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    await onSaveGameScore({
      gameType: type,
      gameTitle: title,
      score: finalScore,
      maxScore,
      durationSeconds,
    });
  };

  // --- Lobby View ---
  if (!activeGame) {
    const gameCards = [
      {
        id: 'millionaire' as const,
        title: 'Ai là triệu phú Tin học',
        desc: 'Chinh phục 10 mốc câu hỏi kiến thức số cùng 3 quyền trợ giúp thú vị (50:50, Hỏi lớp học, Đổi câu).',
        bg: 'bg-[#E3F2FD] border-sky-200',
        btn: 'bg-[#0066CC]',
        Icon: Trophy,
      },
      {
        id: 'wheel' as const,
        title: 'Vòng quay kiến thức',
        desc: 'Quay vòng quay may mắn nhận mốc điểm thưởng 10, 20, 30, 50 điểm và trả lời câu hỏi Tin học.',
        bg: 'bg-[#FFF3E0] border-amber-200',
        btn: 'bg-[#F59E0B]',
        Icon: Sparkles,
      },
      {
        id: 'crossword' as const,
        title: 'Ô chữ bí mật',
        desc: 'Giải mã 5 từ khóa bí mật về thiết bị máy tính, phần mềm Paint, Internet và Scratch.',
        bg: 'bg-[#F3E8FF] border-purple-200',
        btn: 'bg-[#7E22CE]',
        Icon: HelpCircle,
      },
      {
        id: 'hardware_match' as const,
        title: 'Ghép hình thiết bị máy tính',
        desc: 'Nối tên từng thiết bị phần cứng (Màn hình, Thân máy, Bàn phím, Chuột, Loa, Máy in) với đúng chức năng.',
        bg: 'bg-[#E8F5E9] border-emerald-200',
        btn: 'bg-[#16A34A]',
        Icon: Cpu,
      },
      {
        id: 'true_false' as const,
        title: 'Đúng hay Sai',
        desc: 'Phản xạ nhanh phân biệt các phát biểu Đúng hoặc Sai về an toàn điện, Internet và phần mềm.',
        bg: 'bg-[#FCE7F3] border-pink-200',
        btn: 'bg-[#DB2777]',
        Icon: CheckCircle2,
      },
      {
        id: 'challenge10' as const,
        title: 'Thử thách 10 câu hỏi',
        desc: 'Đua tốc độ vượt qua 10 câu hỏi lấy trực tiếp từ Ngân hàng câu hỏi môn Tin học.',
        bg: 'bg-[#E1F5FE] border-sky-200',
        btn: 'bg-[#0284C7]',
        Icon: Puzzle,
      },
    ];

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#003B8E] flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-[#0066CC]" />
              <span>TRÒ CHƠI HỌC TẬP MÔN TIN HỌC</span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Vừa học vừa chơi sôi nổi với câu hỏi từ Ngân hàng câu hỏi ({questions.length} câu sẵn sàng).{' '}
              {settings.recordGameScores
                ? 'Chế độ lưu điểm trò chơi đang BẬT.'
                : 'Chế độ lưu điểm trò chơi đang TẮT.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer border ${
              muted
                ? 'bg-slate-100 text-slate-600 border-slate-300'
                : 'bg-[#EAF5FF] text-[#003B8E] border-sky-200'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#0066CC]" />}
            <span>{muted ? 'Âm thanh: Đang tắt' : 'Âm thanh: Đang bật'}</span>
          </button>
        </div>

        {/* 6 Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {gameCards.map((g) => {
            const Icon = g.Icon;
            return (
              <div
                key={g.id}
                className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between gap-4 ${g.bg}`}
              >
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#003B8E]">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#003B8E]">{g.title}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{g.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startGame(g.id)}
                  className={`w-full py-2.5 rounded-xl text-white font-bold text-sm cursor-pointer hover:opacity-95 shadow-xs ${g.btn}`}
                >
                  Chơi ngay
                </button>
              </div>
            );
          })}
        </div>

        {/* Recent Game Scores Table */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
          <h3 className="text-lg font-bold text-[#003B8E] mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FFC107]" />
            <span>BẢNG VÀNG KẾT QUẢ TRÒ CHƠI GẦN ĐÂY</span>
          </h3>
          {gameRecords.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Chưa có lượt ghi nhận điểm trò chơi nào. Hãy chọn một trò chơi phía trên để bắt đầu!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#EAF5FF] text-[#003B8E]">
                    <th className="py-2.5 px-3">Người chơi</th>
                    <th className="py-2.5 px-3">Lớp</th>
                    <th className="py-2.5 px-3">Trò chơi</th>
                    <th className="py-2.5 px-3">Điểm đạt được</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gameRecords.slice(0, 8).map((rec) => (
                    <tr key={rec.id}>
                      <td className="py-2 px-3 font-bold">{rec.studentName}</td>
                      <td className="py-2 px-3">{rec.className}</td>
                      <td className="py-2 px-3">{rec.gameTitle}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700 tabular-nums">
                        {rec.score} / {rec.maxScore} điểm
                      </td>
                      <td className="py-2 px-3 tabular-nums text-xs text-slate-500">
                        {rec.durationSeconds} giây · {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Common Game Top Bar
  const renderGameHeader = (title: string) => (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-200 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveGame(null)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
        >
          &larr; Chọn trò chơi khác
        </button>
        <h2 className="text-xl font-bold text-[#003B8E]">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3.5 py-1.5 rounded-xl bg-[#FFC107] text-[#002D72] font-bold text-sm tabular-nums">
          Điểm hiện tại: {score}
        </span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="p-2 rounded-xl bg-[#EAF5FF] text-[#003B8E] cursor-pointer"
          title="Bật/Tắt âm thanh"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  if (finished) {
    return (
      <div className="space-y-4">
        {renderGameHeader('Hoàn thành trò chơi!')}
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-sky-200 space-y-4">
          <Trophy className="w-16 h-16 text-[#FFC107] mx-auto" />
          <h3 className="text-2xl font-bold text-[#003B8E]">CHÚC MỪNG EM ĐÃ VỀ ĐÍCH!</h3>
          <p className="text-lg text-slate-700">
            Tổng điểm em đạt được: <strong className="text-2xl text-emerald-600 tabular-nums">{score} điểm</strong>
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startGame(activeGame)}
              className="px-5 py-2.5 rounded-xl bg-[#0066CC] text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại lần nữa</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame(null)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm cursor-pointer"
            >
              Về sảnh trò chơi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME 1 & GAME 6: Millionaire / 10-Question Challenge
  if (activeGame === 'millionaire' || activeGame === 'challenge10') {
    const pool = mcQuestions.slice(0, 10);
    const curQ = pool[qIndex % Math.max(1, pool.length)];
    if (!curQ) {
      return (
        <div className="space-y-4">
          {renderGameHeader('Trò chơi trắc nghiệm')}
          <div className="bg-white p-8 rounded-2xl text-center">
            Ngân hàng câu hỏi chưa có câu trắc nghiệm. Vui lòng thêm câu hỏi trước.
          </div>
        </div>
      );
    }

    const handlePick = (optId: string) => {
      const ok = curQ.correctOptionIds.includes(optId);
      if (ok) {
        playSoundEffect('correct', muted);
        const nextScore = score + 10;
        setScore(nextScore);
        setFeedbackMsg('Chính xác! +10 điểm!');
        setHiddenOpts([]);
        setTimeout(() => {
          setFeedbackMsg(null);
          if (qIndex + 1 >= Math.min(10, pool.length)) {
            finishAndRecord(
              nextScore,
              Math.min(10, pool.length) * 10,
              activeGame === 'millionaire' ? 'Ai là triệu phú Tin học' : 'Thử thách 10 câu hỏi',
              activeGame
            );
          } else {
            setQIndex((i) => i + 1);
          }
        }, 700);
      } else {
        playSoundEffect('wrong', muted);
        setFeedbackMsg(`Tiếc quá, chưa đúng rồi! Đáp án đúng là ${curQ.correctOptionIds[0]}.`);
        setTimeout(() => {
          setFeedbackMsg(null);
          if (activeGame === 'millionaire') {
            finishAndRecord(score, 100, 'Ai là triệu phú Tin học', 'millionaire');
          } else if (qIndex + 1 >= Math.min(10, pool.length)) {
            finishAndRecord(score, Math.min(10, pool.length) * 10, 'Thử thách 10 câu hỏi', 'challenge10');
          } else {
            setQIndex((i) => i + 1);
          }
        }, 1100);
      }
    };

    return (
      <div className="space-y-4">
        {renderGameHeader(
          activeGame === 'millionaire' ? 'Ai là triệu phú Tin học' : 'Thử thách 10 câu hỏi'
        )}

        <div className="bg-gradient-to-br from-[#002D72] to-[#00509E] text-white rounded-2xl p-6 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#FFC107]">
              Mốc câu hỏi {qIndex + 1} / {Math.min(10, pool.length)}
            </span>

            {activeGame === 'millionaire' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={used5050}
                  onClick={() => {
                    setUsed5050(true);
                    const wrongs = curQ.options
                      .filter((o) => !curQ.correctOptionIds.includes(o.id))
                      .slice(0, 2)
                      .map((o) => o.id);
                    setHiddenOpts(wrongs);
                  }}
                  className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer disabled:opacity-35"
                >
                  50:50
                </button>
                <button
                  type="button"
                  disabled={usedAudience}
                  onClick={() => {
                    setUsedAudience(true);
                    setFeedbackMsg(
                      `Tổ tư vấn lớp học gợi ý: 82% các bạn chọn đáp án ${curQ.correctOptionIds[0]}!`
                    );
                  }}
                  className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer disabled:opacity-35"
                >
                  Hỏi ý kiến lớp
                </button>
                <button
                  type="button"
                  disabled={usedSwap || pool.length <= 1}
                  onClick={() => {
                    setUsedSwap(true);
                    setHiddenOpts([]);
                    setQIndex((i) => (i + 1) % pool.length);
                  }}
                  className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer disabled:opacity-35"
                >
                  Đổi câu hỏi
                </button>
              </div>
            )}
          </div>

          <div className="text-xl font-bold leading-relaxed bg-white/10 p-5 rounded-xl border border-sky-300/30">
            {curQ.prompt}
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-[#FFC107] text-[#002D72] font-bold text-sm text-center">
              {feedbackMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {curQ.options.map((opt) => {
              if (hiddenOpts.includes(opt.id)) {
                return (
                  <div
                    key={opt.id}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 opacity-30 text-sm"
                  >
                    (Đã lược bỏ 50:50)
                  </div>
                );
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePick(opt.id)}
                  className="p-4 rounded-xl border-2 border-sky-300/50 bg-[#003B8E] hover:bg-[#0066CC] text-left font-bold text-base flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-[#FFC107] text-[#002D72] flex items-center justify-center shrink-0 text-sm">
                    {opt.id}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // GAME 2: Vòng quay kiến thức
  if (activeGame === 'wheel') {
    const pool = mcQuestions.slice(0, 5);
    const curQ = pool[qIndex % Math.max(1, pool.length)];
    const spinWheel = () => {
      if (spinning) return;
      setSpinning(true);
      playSoundEffect('tick', muted);
      const prizes = [10, 20, 30, 40, 50];
      setTimeout(() => {
        const picked = prizes[Math.floor(Math.random() * prizes.length)];
        setWheelBonus(picked);
        setSpinning(false);
      }, 600);
    };

    return (
      <div className="space-y-4">
        {renderGameHeader('Vòng quay kiến thức (5 lượt quay)')}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 space-y-5 text-center">
          <div className="text-sm font-bold text-slate-600">Lượt {qIndex + 1} / 5</div>
          {!wheelBonus ? (
            <div className="py-6 space-y-4">
              <div
                className={`w-44 h-44 mx-auto rounded-full border-8 border-[#FFC107] bg-gradient-to-tr from-[#003B8E] via-[#0066CC] to-[#22C55E] text-white flex items-center justify-center shadow-lg ${
                  spinning ? 'animate-spin' : ''
                }`}
              >
                <span className="text-lg font-bold px-3">VÒNG QUAY MAY MẮN</span>
              </div>
              <button
                type="button"
                onClick={spinWheel}
                className="px-6 py-3 rounded-xl bg-[#FF9800] hover:bg-amber-600 text-white font-bold text-base cursor-pointer"
              >
                {spinning ? 'Đang quay...' : 'Nhấn để quay điểm thưởng!'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-900 font-bold text-center">
                Ô điểm thưởng: +{wheelBonus} điểm nếu trả lời đúng!
              </div>
              <div className="text-lg font-bold text-[#003B8E]">{curQ?.prompt}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {curQ?.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const ok = curQ.correctOptionIds.includes(opt.id);
                      const nextScore = ok ? score + wheelBonus : score;
                      playSoundEffect(ok ? 'correct' : 'wrong', muted);
                      setScore(nextScore);
                      setWheelBonus(null);
                      if (qIndex + 1 >= 5) {
                        finishAndRecord(nextScore, 200, 'Vòng quay kiến thức', 'wheel');
                      } else {
                        setQIndex((i) => i + 1);
                      }
                    }}
                    className="p-3.5 rounded-xl border-2 border-sky-200 hover:bg-[#EAF5FF] font-bold text-sm cursor-pointer"
                  >
                    {opt.id}. {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // GAME 3: Ô chữ bí mật
  if (activeGame === 'crossword') {
    const curPuzzle = CROSSWORD_PUZZLES[cwIdx];
    const checkCrossword = (e: React.FormEvent) => {
      e.preventDefault();
      const cleaned = cwInput
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd')
        .replace(/\s+/g, '')
        .toUpperCase();

      if (cleaned === curPuzzle.answer) {
        playSoundEffect('correct', muted);
        const nextScore = score + 20;
        setScore(nextScore);
        setCwInput('');
        setFeedbackMsg(`Tuyệt vời! Từ khóa đúng là: ${curPuzzle.displayAnswer}`);
        setTimeout(() => {
          setFeedbackMsg(null);
          if (cwIdx + 1 >= CROSSWORD_PUZZLES.length) {
            finishAndRecord(nextScore, 100, 'Ô chữ bí mật', 'crossword');
          } else {
            setCwIdx((i) => i + 1);
          }
        }, 800);
      } else {
        playSoundEffect('wrong', muted);
        setFeedbackMsg('Chưa khớp ô chữ bí mật, em hãy đếm số chữ cái và thử lại nhé!');
      }
    };

    return (
      <div className="space-y-4">
        {renderGameHeader('Ô chữ bí mật Tin học')}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 max-w-2xl mx-auto space-y-5 text-center">
          <div className="text-xs font-bold text-[#0066CC]">
            Ô chữ {cwIdx + 1} / {CROSSWORD_PUZZLES.length} ({curPuzzle.answer.length} chữ cái)
          </div>
          <div className="p-4 rounded-xl bg-[#EAF5FF] text-[#003B8E] font-bold text-base">
            Gợi ý: {curPuzzle.clue}
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {curPuzzle.answer.split('').map((_, idx) => (
              <div
                key={idx}
                className="w-11 h-11 rounded-xl border-2 border-[#0066CC] bg-sky-50 flex items-center justify-center font-bold text-lg text-[#003B8E]"
              >
                {cwInput.replace(/\s+/g, '')[idx]?.toUpperCase() || '?'}
              </div>
            ))}
          </div>

          {feedbackMsg && (
            <div className="text-sm font-bold text-amber-700">{feedbackMsg}</div>
          )}

          <form onSubmit={checkCrossword} className="flex gap-2 justify-center">
            <input
              type="text"
              value={cwInput}
              onChange={(e) => setCwInput(e.target.value)}
              placeholder="Nhập từ khóa (có dấu hoặc không dấu)..."
              className="px-4 py-2.5 rounded-xl border-2 border-sky-200 text-base w-64 text-center font-bold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0066CC] text-white font-bold text-sm cursor-pointer"
            >
              Mở ô chữ
            </button>
          </form>
        </div>
      </div>
    );
  }

  // GAME 4: Ghép hình thiết bị máy tính
  if (activeGame === 'hardware_match') {
    const handleMatchRole = (roleItemId: string) => {
      if (!selectedDevice) return;
      if (selectedDevice === roleItemId) {
        playSoundEffect('correct', muted);
        const nextMatched = [...matchedIds, roleItemId];
        const nextScore = score + 20;
        setMatchedIds(nextMatched);
        setScore(nextScore);
        setSelectedDevice(null);
        if (nextMatched.length === HARDWARE_PAIRS.length) {
          finishAndRecord(nextScore, HARDWARE_PAIRS.length * 20, 'Ghép hình thiết bị máy tính', 'hardware_match');
        }
      } else {
        playSoundEffect('wrong', muted);
        setFeedbackMsg('Hai thẻ chưa khớp nhau, em thử chọn lại nhé!');
        setSelectedDevice(null);
      }
    };

    return (
      <div className="space-y-4">
        {renderGameHeader('Ghép thiết bị máy tính với chức năng đúng')}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 space-y-4">
          <p className="text-sm text-slate-600 text-center">
            Bước 1: Nhấn chọn tên <strong>Thiết bị máy tính</strong> ở cột trái &rarr; Bước 2: Nhấn vào <strong>Chức năng tương ứng</strong> ở cột phải.
          </p>
          {feedbackMsg && (
            <div className="text-center text-xs font-bold text-amber-700">{feedbackMsg}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <h4 className="font-bold text-[#003B8E] text-sm">Cột A: Thiết bị máy tính</h4>
              {HARDWARE_PAIRS.map((item) => {
                const done = matchedIds.includes(item.id);
                const active = selectedDevice === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={done}
                    onClick={() => {
                      setFeedbackMsg(null);
                      setSelectedDevice(item.id);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border-2 font-bold text-sm cursor-pointer ${
                      done
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : active
                          ? 'bg-[#0066CC] border-[#0066CC] text-white'
                          : 'bg-white border-sky-200 text-[#003B8E] hover:bg-sky-50'
                    }`}
                  >
                    {done ? `✓ ${item.device}` : item.device}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-[#003B8E] text-sm">Cột B: Chức năng hoạt động</h4>
              {shuffledRoles.map((item) => {
                const done = matchedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={done}
                    onClick={() => handleMatchRole(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 text-sm cursor-pointer ${
                      done
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                        : 'bg-[#F8FBFF] border-slate-200 hover:border-[#0066CC] text-slate-800'
                    }`}
                  >
                    {item.role}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GAME 5: Đúng hay Sai
  const curTf = tfQuestions[qIndex % Math.max(1, tfQuestions.length)];
  const handleTfAnswer = (choice: boolean) => {
    const ok = choice === curTf.isTrue;
    playSoundEffect(ok ? 'correct' : 'wrong', muted);
    const nextScore = ok ? score + 15 : score;
    setScore(nextScore);
    if (qIndex + 1 >= Math.min(8, tfQuestions.length)) {
      finishAndRecord(nextScore, Math.min(8, tfQuestions.length) * 15, 'Đúng hay Sai', 'true_false');
    } else {
      setQIndex((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4">
      {renderGameHeader('Trò chơi phản xạ: Đúng hay Sai')}
      <div className="bg-white rounded-2xl p-8 shadow-xs border border-sky-100 max-w-2xl mx-auto text-center space-y-6">
        <div className="text-xs font-bold text-[#0066CC]">
          Câu {qIndex + 1} / {Math.min(8, tfQuestions.length)}
        </div>
        <div className="text-xl font-bold text-[#003B8E] leading-relaxed p-5 rounded-2xl bg-[#EAF5FF]">
          {curTf?.prompt}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTfAnswer(true)}
            className="py-4 rounded-2xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-lg cursor-pointer shadow-sm"
          >
            ĐÚNG
          </button>
          <button
            type="button"
            onClick={() => handleTfAnswer(false)}
            className="py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg cursor-pointer shadow-sm"
          >
            SAI
          </button>
        </div>
      </div>
    </div>
  );
};
