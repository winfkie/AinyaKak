"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechRecognition {
  supported: boolean;
  listening: boolean;
  finalText: string;
  interimText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(locale: string): UseSpeechRecognition {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;
    setSupported(Boolean(Ctor));
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = useCallback(() => {
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;
    if (!Ctor) {
      setError("Browser ini belum support speech recognition. Pakai mode ketik manual aja ya.");
      return;
    }
    try {
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
    const recognition = new Ctor();
    recognition.lang = locale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Akses mikrofon ditolak. Izinkan mic di browser, atau pakai mode manual.");
      } else if (event.error === "no-speech") {
        setError("Belum ada suara yang kedeteksi. Coba bicara lebih dekat ke mic.");
      } else {
        setError(`Mic error: ${event.error}. Kamu bisa lanjut pakai mode manual.`);
      }
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalChunk += transcript + " ";
        else interimChunk += transcript;
      }
      if (finalChunk) {
        setFinalText((prev) => (prev + " " + finalChunk).replace(/\s+/g, " ").trimStart());
      }
      setInterimText(interimChunk);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Gagal start mic. Coba refresh halaman lalu izinkan akses mikrofon.");
    }
  }, [locale]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
    setInterimText("");
  }, []);

  const reset = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
    setFinalText("");
    setInterimText("");
    setError(null);
    setListening(false);
  }, []);

  return { supported, listening, finalText, interimText, error, start, stop, reset };
}
