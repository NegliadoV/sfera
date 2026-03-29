import React, { useId } from 'react';

export function Logo({ size = 32, className = '' }: { size?: number, className?: string }) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`neonMain-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-primary, #0ea5e9)" />
          <stop offset="50%" stopColor="var(--accent-purple, #a855f7)" />
          <stop offset="100%" stopColor="var(--text-primary, #f43f5e)" />
        </linearGradient>
        
        <linearGradient id={`cometGlow-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="var(--accent-primary, #0ea5e9)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent-purple, #a855f7)" stopOpacity="0" />
        </linearGradient>

        <filter id={`glowArch-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Уменьшаем весь туннель и сдвигаем его влево (translate X=10), 
          чтобы дать больше визуального отступа справа от логотипа до текста */}
      <g transform="translate(10, 20) scale(0.65)">
        
        {/* Точка схода (Vanishing Point) в левом нижнем углу (20, 75). */}
        <g transform="translate(20, 75)">
          
          {/* Направляющие коридора (перспектива стен) */}
          <g stroke="color-mix(in srgb, var(--accent-primary-muted) 30%, transparent)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7">
            <line x1="0" y1="0" x2="100" y2="18" /> {/* Пол коридора */}
            <line x1="0" y1="0" x2="100" y2="-100" /> {/* Потолок коридора */}
          </g>

          {/* Двери туннеля, летящие на камеру. Скорость ОЧЕНЬ медленная (почти статика) */}
          {[0, -6.6, -13.3].map((delay, index) => (
            <g key={index} filter={`url(#glowArch-${uid})`}>
              <animateTransform 
                attributeName="transform" type="scale" values="0; 4" 
                dur="20s" begin={`${delay}s`} repeatCount="indefinite"
                calcMode="spline" keySplines="0.5 0 1 1"
              />
              {/* Опасити: плавное появление вдали и растворение перед камерой */}
              <animate 
                attributeName="opacity" values="0; 1; 0" 
                keyTimes="0; 0.7; 1"
                dur="20s" begin={`${delay}s`} repeatCount="indefinite"
                calcMode="spline" keySplines="0.4 0 1 1; 0 0 0.8 1"
              />
              {/* Дверь вытянута по высоте, но сделана пошире (X от 15 до 37, центр 26) */}
              <path d="M 15 5 L 15 -30 A 11 10 0 0 1 37 -30 L 37 5" stroke={`url(#neonMain-${uid})`} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>
          ))}

          {/* Комета со шлейфом и лучистой звездой */}
          <g filter={`url(#glowArch-${uid})`}>
            <animateTransform 
              attributeName="transform" type="scale" values="0; 5" 
              dur="12s" begin="0s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 1 1"
            />
            <animate 
              attributeName="opacity" values="0; 1; 0" 
              keyTimes="0; 0.8; 1"
              dur="12s" begin="0s" repeatCount="indefinite"
            />
          
          {/* Дымящийся ионный шлейф кометы */}
          <polygon points="26,-15 26,-18 10,-6.5" fill={`url(#cometGlow-${uid})`} opacity="0.9" />
          
          {/* Ядро звезды */}
          <circle cx="26" cy="-16.5" r="1.5" fill="var(--text-primary, #ffffff)" />
          
          {/* Лучи звезды */}
          <path d="M 26 -20 L 26 -13 M 23 -16.5 L 29 -16.5" stroke="var(--text-primary, #ffffff)" strokeWidth="0.5" strokeLinecap="round" opacity="0.9" />
        </g>

      </g>
      </g>
    </svg>
  );
}
