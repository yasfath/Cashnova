import { useId } from "react";
import { MoveDownRight, MoveUpRight } from "lucide-react";

const accentMap = {
  blue: {
    primary: "#1F5F7A",
    secondary: "#0F7C82",
    soft: "#EAF4F7",
    track: "#D9E8EE",
  },
  orange: {
    primary: "#D3A24C",
    secondary: "#1F5F7A",
    soft: "#FBF5E8",
    track: "#F1E5C8",
  },
  green: {
    primary: "#0F7C82",
    secondary: "#5E8B7E",
    soft: "#E8F5F3",
    track: "#D4E8E3",
  },
  red: {
    primary: "#B85C38",
    secondary: "#D3A24C",
    soft: "#F9EEE7",
    track: "#EFD8CA",
  },
};

const MiniLine = ({ accent, graphId }) => (
  <svg viewBox="0 0 128 82" className="h-[62px] w-[126px]">
    <defs>
      <linearGradient id={`${graphId}-line-fill`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={accent.secondary} stopOpacity="0.34" />
        <stop offset="72%" stopColor={accent.secondary} stopOpacity="0.08" />
        <stop offset="100%" stopColor={accent.secondary} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${graphId}-line-stroke`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor={accent.primary} />
        <stop offset="100%" stopColor={accent.secondary} />
      </linearGradient>
      <filter id={`${graphId}-line-glow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow
          dx="0"
          dy="7"
          stdDeviation="6"
          floodColor={accent.secondary}
          floodOpacity="0.24"
        />
      </filter>
    </defs>
    <path
      d="M4 60
         L12 50
         L20 54
         L28 40
         L36 34
         L44 18
         L52 26
         L60 12
         L68 19
         L76 15
         L84 25
         L92 11
         L100 36
         L108 25
         L116 33
         L124 27
         L124 82
         L4 82 Z"
      fill={`url(#${graphId}-line-fill)`}
    />
    <path
      d="M4 60
         L12 50
         L20 54
         L28 40
         L36 34
         L44 18
         L52 26
         L60 12
         L68 19
         L76 15
         L84 25
         L92 11
         L100 36
         L108 25
         L116 33
         L124 27"
      fill="none"
      stroke={`url(#${graphId}-line-stroke)`}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={`url(#${graphId}-line-glow)`}
    />
  </svg>
);

const MiniArea = ({ accent, graphId }) => (
  <svg viewBox="0 0 128 88" className="h-[72px] w-[132px]">
    <defs>
      <linearGradient id={`${graphId}-area-fill`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={accent.primary} stopOpacity="0.38" />
        <stop offset="68%" stopColor={accent.primary} stopOpacity="0.12" />
        <stop offset="100%" stopColor={accent.primary} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${graphId}-area-stroke`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor={accent.secondary} />
        <stop offset="100%" stopColor={accent.primary} />
      </linearGradient>
      <filter id={`${graphId}-area-glow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow
          dx="0"
          dy="7"
          stdDeviation="6"
          floodColor={accent.primary}
          floodOpacity="0.24"
        />
      </filter>
    </defs>
    <path
      d="M6 17
         L14 17
         L19 6
         L24 20
         L30 14
         L36 34
         L42 28
         L48 49
         L54 42
         L60 60
         L66 53
         L72 66
         L78 59
         L84 72
         L90 68
         L98 74
         L106 63
         L114 69
         L122 66
         L122 88
         L6 88 Z"
      fill={`url(#${graphId}-area-fill)`}
    />
    <path
      d="M6 17
         L14 17
         L19 6
         L24 20
         L30 14
         L36 34
         L42 28
         L48 49
         L54 42
         L60 60
         L66 53
         L72 66
         L78 59
         L84 72
         L90 68
         L98 74
         L106 63
         L114 69
         L122 66"
      fill="none"
      stroke={`url(#${graphId}-area-stroke)`}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={`url(#${graphId}-area-glow)`}
    />
  </svg>
);

const Donut = ({ accent, down = false, graphId }) => (
  <div className="relative flex h-24 w-24 items-center justify-center rounded-full opacity-90">
    <svg viewBox="0 0 120 120" className="h-24 w-24 -rotate-90">
      <defs>
        <linearGradient id={`${graphId}-donut-stroke`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={accent.primary} />
          <stop offset="100%" stopColor={accent.secondary} />
        </linearGradient>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke={accent.track}
        strokeWidth="12"
      />
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke={`url(#${graphId}-donut-stroke)`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="180 265"
        strokeDashoffset={down ? "20" : "0"}
      />
    </svg>
    <div
      className="absolute inset-0 rounded-full blur-[26px]"
      style={{
        background: `radial-gradient(circle, ${accent.secondary}33 0%, transparent 70%)`,
      }}
    />
    <div className="absolute inset-0 flex items-center justify-center text-[#1F5F7A]">
      {down ? (
        <MoveDownRight size={28} color={accent.primary} />
      ) : (
        <MoveUpRight size={28} color={accent.primary} />
      )}
    </div>
  </div>
);

const StatCard = ({ title, value, change, note, type, color }) => {
  const positive = !change.startsWith("-");
  const accent = accentMap[color] || accentMap.blue;
  const graphId = useId().replace(/:/g, "");

  return (
    <div className="dashboard-stat-card theme-card relative flex min-h-[150px] items-start justify-between overflow-hidden rounded-[24px] p-4 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(19,52,72,0.12)] active:scale-[0.985] sm:p-5">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at top right, ${accent.secondary}16 0%, transparent 30%), radial-gradient(circle at bottom left, ${accent.primary}10 0%, transparent 28%)`,
        }}
      />

      <div className="relative min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#496474]">{title}</h3>
        </div>

        <p className="text-[28px] font-extrabold tracking-tight text-[#12303f]">{value}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1 text-sm">
          <span
            className="font-semibold"
            style={{ color: positive ? accent.primary : accent.secondary }}
          >
            {positive ? "↑" : "↓"}
          </span>
          <span className="font-semibold text-[#496474]">{change}</span>
          <span className="text-[#738b99]">{note}</span>
        </div>
      </div>

      <div className="relative flex h-full shrink-0 items-center">
        {type === "donutUp" && <Donut accent={accent} graphId={graphId} />}
        {type === "donutDown" && <Donut accent={accent} graphId={graphId} down />}
        {type === "lineUp" && <MiniLine accent={accent} graphId={graphId} />}
        {type === "areaDown" && <MiniArea accent={accent} graphId={graphId} />}
      </div>
    </div>
  );
};

export default StatCard;
