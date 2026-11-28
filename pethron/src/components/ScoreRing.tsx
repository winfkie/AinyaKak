"use client";

import { motion } from "motion/react";

interface ScoreRingProps {
  score: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: "auto" | "forest" | "gold";
}

function toneColor(score: number, max: number, tone: ScoreRingProps["tone"]): string {
  if (tone === "forest") return "#1B4332";
  if (tone === "gold") return "#D97706";
  const ratio = score / max;
  if (ratio >= 0.75) return "#1B4332";
  if (ratio >= 0.5) return "#D97706";
  return "#DC2626";
}

export default function ScoreRing({
  score,
  max = 10,
  size = 140,
  stroke = 10,
  label,
  sublabel,
  tone = "auto",
}: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, score / max));
  const color =
    tone === "forest"
      ? "#10B981"
      : tone === "gold"
      ? "#EC4899"
      : ((s: number) => s >= 80 ? "#10B981" : s >= 60 ? "#2563EB" : "#EC4899")(score);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(37, 99, 235, 0.12)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - ratio) }}
            transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.15 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-metric text-2xl font-bold leading-none text-ink">
            {score.toFixed(1)}
          </span>
          <span className="mt-1 font-metric text-[10px] uppercase tracking-wider text-muted">
            / {max}
          </span>
        </div>
      </div>
      {label ? (
        <div className="text-center">
          <div className="text-sm font-bold text-ink">{label}</div>
          {sublabel ? <div className="text-xs text-muted font-medium">{sublabel}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
