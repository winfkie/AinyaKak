import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const cfdPromoSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cta: z.string(),
  finalText: z.string(),
});

const QR_SRC = staticFile("qr-cfdsemarang.svg");
const QR_LABEL = "cfdsemarang.aidanrn06.workers.dev";

export const CfdPromo: React.FC<z.infer<typeof cfdPromoSchema>> = ({ title, subtitle, cta, finalText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const finalStart = 16 * fps;
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const introY = interpolate(enter, [0, 1], [40, 0]);
  const introOpacity = interpolate(frame, [0, 15, finalStart - 8, finalStart], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalProgress = interpolate(frame, [finalStart, finalStart + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalY = interpolate(finalProgress, [0, 1], [60, 0]);
  const qrScale = interpolate(spring({ frame: Math.max(0, frame - finalStart - 6), fps, config: { damping: 200 } }), [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill style={{ background: "#111", color: "#fff", fontFamily: "Arial, sans-serif" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #D63426 0%, #111 55%, #111 100%)", opacity: 0.9 }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80, textAlign: "center", opacity: introOpacity }}>
        <div style={{ transform: `translateY(${introY}px)` }}>
          <div style={{ fontSize: 28, letterSpacing: 4, color: "#F9D908", marginBottom: 24 }}>CAR FREE DAY SEMARANG</div>
          <h1 style={{ fontSize: 88, lineHeight: 1.05, margin: 0 }}>{title}</h1>
          <p style={{ fontSize: 42, lineHeight: 1.3, marginTop: 28, color: "#f2f2f2" }}>{subtitle}</p>
          <div style={{ marginTop: 48, display: "inline-block", background: "#F9D908", color: "#111", padding: "20px 28px", fontSize: 30, fontWeight: 700, borderRadius: 16 }}>
            {cta}
          </div>
        </div>
      </AbsoluteFill>

      {frame >= finalStart ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 72, textAlign: "center", opacity: finalProgress }}>
          <div style={{ transform: `translateY(${finalY}px)`, width: "100%" }}>
            <div style={{ fontSize: 28, letterSpacing: 4, color: "#F9D908", marginBottom: 24 }}>CFD SEMARANG</div>
            <h1 style={{ fontSize: 64, lineHeight: 1.1, margin: "0 auto 36px", maxWidth: 900 }}>{finalText}</h1>
            <div
              style={{
                display: "inline-block",
                background: "#fff",
                padding: 24,
                borderRadius: 32,
                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                transform: `scale(${qrScale})`,
              }}
            >
              <Img src={QR_SRC} style={{ width: 520, height: 520, display: "block" }} />
            </div>
            <div style={{ marginTop: 28, fontSize: 30, color: "#f2f2f2", letterSpacing: 0.5 }}>Scan untuk booking</div>
            <div style={{ marginTop: 8, fontSize: 24, color: "#F9D908", wordBreak: "break-all" }}>{QR_LABEL}</div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
