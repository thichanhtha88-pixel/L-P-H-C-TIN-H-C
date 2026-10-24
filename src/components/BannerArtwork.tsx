import React from 'react';

export const ComputerBookLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg viewBox="0 0 120 110" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Green Laurel Leaves */}
    <path d="M18 82C8 68 12 45 26 34C22 52 24 68 32 82H18Z" fill="#22C55E" opacity="0.9" />
    <path d="M12 72C4 58 10 40 22 30" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
    <path d="M102 82C112 68 108 45 94 34C98 52 96 68 88 82H102Z" fill="#22C55E" opacity="0.9" />
    <path d="M108 72C116 58 110 40 98 30" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
    {/* Monitor */}
    <rect x="30" y="12" width="60" height="44" rx="7" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="3" />
    <rect x="35" y="17" width="50" height="33" rx="4" fill="#0284C7" />
    {/* Refresh/Tech cycle icon inside monitor */}
    <circle cx="60" cy="33" r="10" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="45 12" />
    <circle cx="60" cy="33" r="3" fill="#FFC107" />
    <rect x="53" y="56" width="14" height="8" fill="#BAE6FD" />
    {/* Open Book at base */}
    <path
      d="M20 88C34 80 48 82 60 90C72 82 86 80 100 88V68C86 60 72 62 60 70C48 62 34 60 20 68V88Z"
      fill="#FFFFFF"
      stroke="#003B8E"
      strokeWidth="2.5"
    />
    <line x1="60" y1="70" x2="60" y2="92" stroke="#0066CC" strokeWidth="2.5" />
    <path d="M27 74C38 69 48 71 55 76" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    <path d="M27 80C38 75 48 77 55 82" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    <path d="M93 74C82 69 72 71 65 76" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    <path d="M93 80C82 75 72 77 65 82" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const StudentsAndTeacherHeroSvg: React.FC<{ className?: string }> = ({ className = 'h-28 w-auto' }) => (
  <svg viewBox="0 0 340 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Tech decorative floating icons */}
    <circle cx="24" cy="28" r="13" stroke="#BAE6FD" strokeWidth="1.5" opacity="0.6" />
    <ellipse cx="24" cy="28" rx="6" ry="13" stroke="#BAE6FD" strokeWidth="1.5" opacity="0.6" />
    <line x1="11" y1="28" x2="37" y2="28" stroke="#BAE6FD" strokeWidth="1.5" opacity="0.6" />
    {/* Wifi waves */}
    <path d="M180 18C188 11 200 11 208 18" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    <path d="M185 24C190 19 198 19 203 24" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    <circle cx="194" cy="29" r="2.5" fill="#FFC107" />

    {/* Boy Student (Left) */}
    <g transform="translate(46, 22)">
      {/* Hair & Head */}
      <circle cx="34" cy="34" r="22" fill="#FDE68A" />
      <path d="M12 30C12 14 26 8 42 11C52 13 57 22 55 32C49 24 38 22 25 24C18 25 14 28 12 30Z" fill="#3B2314" />
      {/* Eyes & Smile */}
      <circle cx="27" cy="36" r="2.8" fill="#1E293B" />
      <circle cx="41" cy="36" r="2.8" fill="#1E293B" />
      <path d="M28 45C31 49 37 49 40 45" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" />
      {/* White School Shirt + Red Scarf (Khăn quàng đỏ) */}
      <path d="M10 98L16 58H52L58 98H10Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M19 58L34 76L49 58H39L34 65L29 58H19Z" fill="#EF4444" />
      <path d="M31 73L28 92L34 88L40 92L37 73H31Z" fill="#DC2626" />
    </g>

    {/* Girl Student (Middle) */}
    <g transform="translate(115, 26)">
      <circle cx="12" cy="34" r="8" fill="#3B2314" />
      <circle cx="56" cy="34" r="8" fill="#3B2314" />
      <circle cx="34" cy="34" r="21" fill="#FDE68A" />
      <path d="M14 29C15 14 28 10 42 12C51 14 55 22 54 30C46 23 24 23 14 29Z" fill="#3B2314" />
      <circle cx="27" cy="36" r="2.7" fill="#1E293B" />
      <circle cx="41" cy="36" r="2.7" fill="#1E293B" />
      <path d="M29 44C32 48 36 48 39 44" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 94L18 56H50L56 94H12Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M20 56L34 73L48 56H39L34 63L29 56H20Z" fill="#EF4444" />
    </g>

    {/* Silver Laptop in front of students */}
    <g transform="translate(132, 76)">
      <rect x="8" y="0" width="66" height="42" rx="5" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
      <circle cx="41" cy="21" r="6" fill="#0066CC" opacity="0.35" />
      <rect x="0" y="41" width="82" height="6" rx="3" fill="#94A3B8" />
    </g>

    {/* Vietnamese Female Teacher in Pink Áo Dài (Right) */}
    <g transform="translate(222, 8)">
      {/* Long Dark Hair */}
      <path d="M20 34C20 12 36 4 50 8C64 12 68 28 68 56C68 74 64 92 58 102H26C20 90 20 60 20 34Z" fill="#27170E" />
      <circle cx="44" cy="34" r="20" fill="#FDE68A" />
      <path d="M25 28C28 14 44 10 56 17C61 20 63 25 63 30C53 22 36 21 25 28Z" fill="#27170E" />
      <circle cx="37" cy="35" r="2.5" fill="#1E293B" />
      <circle cx="51" cy="35" r="2.5" fill="#1E293B" />
      <path d="M39 44C42 47 47 47 50 44" stroke="#BE123C" strokeWidth="2.2" strokeLinecap="round" />
      {/* Pink Áo Dài */}
      <path d="M16 118L24 58H64L74 118H16Z" fill="#F472B6" />
      <path d="M35 58L44 70L53 58" stroke="#FCE7F3" strokeWidth="2.5" fill="none" />
      {/* Teacher Notebook */}
      <rect x="34" y="78" width="28" height="36" rx="3" fill="#7C2D12" stroke="#FDE047" strokeWidth="1.8" />
      <circle cx="48" cy="94" r="6" fill="#FACC15" opacity="0.85" />
    </g>
  </svg>
);

export const SidebarBottomLaptopSvg: React.FC = () => (
  <svg viewBox="0 0 180 95" className="w-36 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sparkles */}
    <circle cx="24" cy="26" r="2.5" fill="#FFC107" />
    <circle cx="156" cy="22" r="2.5" fill="#FFC107" />
    <circle cx="144" cy="48" r="2" fill="#38BDF8" />
    <circle cx="36" cy="52" r="2" fill="#38BDF8" />
    <path d="M40 16L42 21L47 23L42 25L40 30L38 25L33 23L38 21L40 16Z" fill="#FDE047" />
    <path d="M140 12L141.5 16L145.5 17.5L141.5 19L140 23L138.5 19L134.5 17.5L138.5 16L140 12Z" fill="#FDE047" />
    {/* Laptop screen */}
    <rect x="50" y="16" width="80" height="50" rx="6" fill="#0284C7" stroke="#E0F2FE" strokeWidth="2.5" />
    <circle cx="90" cy="41" r="15" stroke="#FFFFFF" strokeWidth="2" />
    <ellipse cx="90" cy="41" rx="7" ry="15" stroke="#FFFFFF" strokeWidth="1.6" />
    <line x1="75" y1="41" x2="105" y2="41" stroke="#FFFFFF" strokeWidth="1.6" />
    {/* Keyboard base */}
    <path d="M36 68H144L154 80H26L36 68Z" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.8" />
    <rect x="76" y="73" width="28" height="3" rx="1.5" fill="#003B8E" />
  </svg>
);
