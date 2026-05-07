import { useId } from "react";

const AssistantMark = ({ className = "" }) => {
  const baseId = useId();

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-visible ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={`${baseId}-primary`} x1="18" y1="86" x2="82" y2="20">
            <stop offset="0%" stopColor="#1F5F7A" />
            <stop offset="52%" stopColor="#0F7C82" />
            <stop offset="100%" stopColor="#D3A24C" />
          </linearGradient>
          <linearGradient id={`${baseId}-secondary`} x1="70" y1="16" x2="106" y2="54">
            <stop offset="0%" stopColor="#D3A24C" />
            <stop offset="100%" stopColor="#0F7C82" />
          </linearGradient>
          <linearGradient id={`${baseId}-deep`} x1="74" y1="80" x2="104" y2="110">
            <stop offset="0%" stopColor="#163B56" />
            <stop offset="100%" stopColor="#0F7C82" />
          </linearGradient>
          <filter id={`${baseId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0F7C82" floodOpacity="0.22" />
          </filter>
        </defs>

        <g transform="translate(13 12) scale(0.78)" filter={`url(#${baseId}-glow)`}>
          <path
            d="M44 24C48 45 57 55 82 60C57 65 48 75 44 98C40 75 31 65 6 60C31 55 40 45 44 24Z"
            fill={`url(#${baseId}-primary)`}
          />
          <path
            d="M79 8C82 25 89 32 107 36C89 40 82 47 79 64C76 47 69 40 51 36C69 32 76 25 79 8Z"
            fill={`url(#${baseId}-secondary)`}
            opacity="0.98"
          />
          <path
            d="M93 75C96 88 102 94 116 97C102 100 96 106 93 119C90 106 84 100 70 97C84 94 90 88 93 75Z"
            fill={`url(#${baseId}-deep)`}
            opacity="0.94"
          />
          <path
            d="M65 16C66 22 69 25 76 27C69 29 66 32 65 38C64 32 61 29 54 27C61 25 64 22 65 16Z"
            fill="#ffffff"
            opacity="0.58"
          />
        </g>
      </svg>
    </div>
  );
};

export default AssistantMark;
