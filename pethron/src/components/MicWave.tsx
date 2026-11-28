"use client";

import { useEffect, useRef } from "react";

export default function MicWave({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stopped = false;
    let analyser: AnalyserNode | null = null;
    let buffer: Uint8Array<ArrayBuffer> | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        const audioCtx = new AudioCtor();
        const source = audioCtx.createMediaStreamSource(stream);
        const node = audioCtx.createAnalyser();
        node.fftSize = 256;
        node.smoothingTimeConstant = 0.75;
        source.connect(node);
        analyser = node;
        buffer = new Uint8Array(node.frequencyBinCount);
        streamRef.current = stream;
        audioCtxRef.current = audioCtx;
      } catch {
        analyser = null;
      }
    };

    const roundRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      const radius = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + radius, y);
      c.arcTo(x + w, y, x + w, y + h, radius);
      c.arcTo(x + w, y + h, x, y + h, radius);
      c.arcTo(x, y + h, x, y, radius);
      c.arcTo(x, y, x + w, y, radius);
      c.closePath();
    };

    const draw = (time: number) => {
      if (stopped) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const bars = 52;
      const gap = 2;
      const barW = Math.max(1.5, (w - gap * (bars - 1)) / bars);

      let values: number[] = [];
      if (analyser && buffer) {
        analyser.getByteFrequencyData(buffer);
        values = Array.from(buffer.slice(0, bars)).map((v) => v / 255);
      }

      for (let i = 0; i < bars; i += 1) {
        const wave = 0.06 + 0.05 * Math.abs(Math.sin(time / 520 + i * 0.38));
        const amp = active ? Math.max(0.05, values[i] ?? wave) : wave;
        const barH = Math.max(3, amp * h * 0.9);
        const x = i * (barW + gap);
        const y = (h - barH) / 2;
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, active ? "#2563EB" : "#CBD5E1");
        gradient.addColorStop(1, active ? "#EC4899" : "#E2E8F0");
        ctx.fillStyle = gradient;
        roundRect(ctx, x, y, barW, barH, barW / 2);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    if (active) void startMic();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => undefined);
      }
      streamRef.current = null;
      audioCtxRef.current = null;
    };
  }, [active]);

  return <canvas ref={canvasRef} className="h-24 w-full" aria-hidden="true" />;
}
