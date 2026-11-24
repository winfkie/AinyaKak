import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const cfdPromoSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cta: z.string(),
});

export const CfdPromo: React.FC<z.infer<typeof cfdPromoSchema>> = ({ title, subtitle, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const y = interpolate(enter, [0, 1], [40, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#111", color: "#fff", fontFamily: "Arial, sans-serif" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #D63426 0%, #111 55%, #111 100%)", opacity: 0.9 }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80, textAlign: "center" }}>
        <div style={{ transform: `translateY(${y}px)`, opacity }}>
          <div style={{ fontSize: 28, letterSpacing: 4, color: "#F9D908", marginBottom: 24 }}>CAR FREE DAY SEMARANG</div>
          <h1 style={{ fontSize: 88, lineHeight: 1.05, margin: 0 }}>{title}</h1>
          <p style={{ fontSize: 42, lineHeight: 1.3, marginTop: 28, color: "#f2f2f2" }}>{subtitle}</p>
          <div style={{ marginTop: 48, display: "inline-block", background: "#F9D908", color: "#111", padding: "20px 28px", fontSize: 30, fontWeight: 700, borderRadius: 16 }}>
            {cta}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
