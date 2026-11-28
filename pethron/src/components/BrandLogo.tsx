import Link from "next/link";
import { useId } from "react";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTag?: boolean;
}

export function BrandLogo({
  href = "/",
  size = "md",
  showTag = true,
}: BrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `pethron-cap-${uid}`;
  const glossId = `pethron-gloss-${uid}`;
  const sparkleId = `pethron-sparkle-${uid}`;

  const iconSize = size === "sm" ? 34 : size === "lg" ? 44 : 38;
  const wordmarkSize =
    size === "sm" ? "text-xl" : size === "lg" ? "text-2xl sm:text-[26px]" : "text-[22px]";

  const content = (
    <span className="inline-flex items-center gap-3 group select-none">
      {/* Y2K Glossy Capsule Emblem */}
      <span
        className="relative inline-flex items-center justify-center rounded-2xl shadow-[0_6px_20px_rgba(37,99,235,0.28)] transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-2"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="55%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id={glossId} x1="22" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id={sparkleId} x1="29" y1="6" x2="38" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FBCFE8" />
            </linearGradient>
          </defs>

          {/* Glossy capsule base */}
          <rect
            x="2"
            y="2"
            width="40"
            height="40"
            rx="14"
            fill={`url(#${gradId})`}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.5"
          />

          {/* Top Y2K specular highlight */}
          <rect
            x="5"
            y="4"
            width="34"
            height="16"
            rx="10"
            fill={`url(#${glossId})`}
          />

          {/* Soundwave bars */}
          <rect x="11" y="19" width="3.2" height="10" rx="1.6" fill="#FFFFFF" fillOpacity="0.92" />
          <rect x="16.5" y="14" width="3.2" height="18" rx="1.6" fill="#FFFFFF" />
          <rect x="22" y="17" width="3.2" height="13" rx="1.6" fill="#FFFFFF" fillOpacity="0.95" />
          <rect x="27.5" y="20" width="3.2" height="8" rx="1.6" fill="#FFFFFF" fillOpacity="0.88" />

          {/* Y2K Four-point Sparkle */}
          <path
            d="M34 7.5L35.1 10.9L38.5 12L35.1 13.1L34 16.5L32.9 13.1L29.5 12L32.9 10.9L34 7.5Z"
            fill={`url(#${sparkleId})`}
          />
        </svg>
      </span>

      {/* Wordmark + Brand Tag Pill */}
      <span className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5">
        <span
          className={`font-display font-extrabold tracking-tight text-ink leading-none ${wordmarkSize}`}
        >
          Pethron
        </span>
        {showTag && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-[0.14em] uppercase bg-white/65 backdrop-blur-md border border-white/90 text-cobalt shadow-[0_2px_10px_rgba(37,99,235,0.1)] w-fit">
            PITCH &amp; DEFENSE STUDIO
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Pethron — Pitch & Defense Studio">
      {content}
    </Link>
  );
}
