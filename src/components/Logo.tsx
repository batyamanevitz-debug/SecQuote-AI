import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
  size = 54,
  showText = true,
  textSize = 'text-xl',
  subtitle,
  className = '',
  style,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-2 ${className}`}
      style={style}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute -inset-2.5 rounded-full filter blur-[5px] animate-sq-pulse pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.34) 0%, rgba(34,211,238,0) 70%)',
          }}
        />
        <svg
          width={size}
          height={size}
          viewBox="0 0 96 96"
          fill="none"
          className="relative block select-none"
        >
          <defs>
            <linearGradient id="sqShieldGrad" x1="14" y1="6" x2="82" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="0.55" stopColor="#2563eb" />
              <stop offset="1" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          {/* Main Shield */}
          <path
            d="M48 5 14 17v29c0 20 14 36 34 45 20-9 34-25 34-45V17L48 5Z"
            fill="url(#sqShieldGrad)"
            stroke="#67e8f9"
            strokeWidth="2.6"
          />
          {/* Inner dark facet */}
          <path
            d="M48 15 24 23v22c0 15.5 10.5 28 24 35.4 13.5-7.4 24-19.9 24-35.4V23L48 15Z"
            fill="rgba(4,12,28,0.42)"
          />
          {/* Circuit details */}
          <path
            d="M20 34h-9M20 48h-13M76 34h9M76 62h11M28 74l-8 7M68 74l8 7"
            stroke="#67e8f9"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <circle cx="9" cy="34" r="2.2" fill="#67e8f9" />
          <circle cx="87" cy="62" r="2.2" fill="#67e8f9" />
          {/* AI typography */}
          <text
            x="48"
            y="60"
            textAnchor="middle"
            fontFamily="'Heebo', sans-serif"
            fontSize="30"
            fontWeight="900"
            fill="#e8f9ff"
          >
            AI
          </text>
        </svg>
      </div>

      {showText && (
        <div className="text-center select-none" dir="ltr">
          <div className={`${textSize} font-black tracking-tight text-[#f2f8ff]`}>
            SecQuote <span className="text-[#22d3ee]">AI</span>
          </div>
          {subtitle && (
            <div className="mt-1 text-[11px] font-semibold tracking-[0.3em] uppercase text-[#7dd3fc]/70">
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
