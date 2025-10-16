"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

type Props = {
  onDetected: (code: string) => void;
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const FORMATS = ["ean_13", "ean_8", "upc_a", "code_128", "code_39", "itf"];

export default function BarcodeScanner({ onDetected, onClose }: Props): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, []);

  const close = useCallback(() => {
    stop();
    onClose();
  }, [onClose, stop]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (streamRef.current) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream as MediaStream;
          await new Promise<void>((resolve) => {
            if (v.readyState >= 2) resolve();
            else v.addEventListener("loadedmetadata", () => resolve(), { once: true });
          });
          try {
            await v.play();
          } catch (err: any) {
            if (!(err && err.name === "AbortError")) throw err;
          }
        }

        if ("BarcodeDetector" in window) {
          detectorRef.current = new (window as any).BarcodeDetector({ formats: FORMATS });
          const tick = async () => {
            if (!videoRef.current || !detectorRef.current) return;
            try {
              const codes = await detectorRef.current.detect(videoRef.current);
              if (codes && codes.length > 0) {
                const value: string = codes[0].rawValue || "";
                if (value) {
                  if (navigator.vibrate) navigator.vibrate(50);
                  onDetected(value);
                  close();
                  return;
                }
              }
            } catch {
              /* ignore */
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
        } else {
          // Fallback for Safari/iOS or browsers without BarcodeDetector
          try {
            const { BrowserMultiFormatReader } = await import("@zxing/browser");
            const codeReader = new BrowserMultiFormatReader();
            // Try continuous decode from the existing video element
            const v = videoRef.current as HTMLVideoElement | null;
            if (v) {
              const result = await codeReader.decodeOnceFromVideoElement(v).catch(() => null);
              if (result && result.getText()) {
                if (navigator.vibrate) navigator.vibrate(50);
                onDetected(result.getText());
                close();
                return;
              }
            }
          } catch (e) {
            // ZXing fallback not available; rely on capture button
          }
        }
      } catch (e) {
        console.error(e);
        setError("カメラを起動できませんでした。画像から読み取りに切り替えます。");
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [close, stop, onDetected]);

  const runDetectOnCanvas = useCallback(async (canvas: HTMLCanvasElement) => {
    // まずネイティブAPIで試す
    if ("BarcodeDetector" in window) {
      try {
        const det = detectorRef.current || new (window as any).BarcodeDetector({ formats: FORMATS });
        detectorRef.current = det;
        const res = await det.detect(canvas as unknown as CanvasImageSource);
        if (res && res.length > 0 && res[0].rawValue) return String(res[0].rawValue);
      } catch {
        /* ignore */
      }
    }

    // ZXingフォールバック
    if (typeof window === "undefined") return null;
    try {
      // ✅ 型定義の不備を補正（DecodeHintType は @zxing/library から）
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

      const reader: any = new BrowserMultiFormatReader();

      // 🔍 精度向上: TRY_HARDER + フォーマット指定
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.ITF,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_128,
      ]);
      reader.decodeHints = hints;

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });

      const url = URL.createObjectURL(blob);
      try {
        const result: any = await reader.decodeFromImageUrl(url);
        const val = (result && (result.getText?.() || result.text)) as string | undefined;
        if (val) {
          console.debug("ZXing decode success:", val);
          return String(val);
        }
      } catch (err) {
        console.warn("ZXing decode failed", err);
      } finally {
        URL.revokeObjectURL(url);
        (reader as any).reset?.();
      }
    } catch (err) {
      console.warn("ZXing import/exec error:", err);
    }
    return null;
  }, []);

  const onPickImage = useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      try {
        const bmp = await createImageBitmap(f);
        const maxSide = Math.max(bmp.width, bmp.height);
        const scale = maxSide < 1200 ? Math.ceil(1200 / maxSide) : 1.5;
        const w = bmp.width * scale;
        const h = bmp.height * scale;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        (ctx as any).filter = "grayscale(100%) contrast(180%) brightness(110%)";
        ctx.drawImage(bmp, 0, 0, w, h);

        const val = await runDetectOnCanvas(canvas);
        if (val) {
          if (navigator.vibrate) navigator.vibrate(50);
          onDetected(val);
          close();
          return;
        }

        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch(`${API_BASE}/api/scan`, { method: "POST", body: fd });
        if (r.ok) {
          const { code, codes } = await r.json();
          const v = code || (Array.isArray(codes) && codes[0]);
          if (v) {
            if (navigator.vibrate) navigator.vibrate(50);
            onDetected(String(v));
            close();
            return;
          }
        }
        setError("画像からバーコードを読み取れませんでした");
      } catch {
        setError("画像の処理に失敗しました");
      }
    },
    [close, onDetected, runDetectOnCanvas]
  );

  const captureAndDetect = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      setBusy(true);
      const vw = v.videoWidth || v.clientWidth;
      const vh = v.videoHeight || v.clientHeight;
      if (!vw || !vh) throw new Error("no video frame");
      const maxSide = Math.max(vw, vh);
      const scale = maxSide < 1200 ? Math.ceil(1200 / maxSide) : 1.5;
      const w = vw * scale;
      const h = vh * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      (ctx as any).filter = "grayscale(100%) contrast(180%) brightness(110%)";
      ctx.drawImage(v, 0, 0, w, h);

      const val = await runDetectOnCanvas(canvas);
      if (val) {
        if (navigator.vibrate) navigator.vibrate(50);
        onDetected(val);
        close();
        return;
      }
      setError("認識できませんでした。枠に合わせてもう一度お試しください。");
    } catch {
      setError("フレームの取得に失敗しました");
    } finally {
      setBusy(false);
    }
  }, [close, onDetected, runDetectOnCanvas]);

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>バーコードを枠に合わせてください</strong>
          <button onClick={close}>閉じる</button>
        </div>
        {error && <div style={{ color: "#c00", marginBottom: 8 }}>{error}</div>}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "3/4",
            background: "#000",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={frameStyle} />
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={captureAndDetect}
            disabled={busy}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #0ea5e9",
              background: "#e0f2fe",
              color: "#075985",
            }}
          >
            {busy ? "解析中..." : "撮影して読み取る"}
          </button>
          <label style={{ display: "inline-block" }}>
            画像から読み取る:
            <input type="file" accept="image/*" onChange={onPickImage} style={{ display: "block", marginTop: 6 }} />
          </label>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
  padding: 16,
};
const containerStyle: React.CSSProperties = {
  width: "min(480px, 100%)",
  background: "#fff",
  padding: 12,
  borderRadius: 10,
};
const frameStyle: React.CSSProperties = {
  position: "absolute",
  inset: "20% 10%",
  border: "2px solid rgba(255,255,255,0.9)",
  borderRadius: 8,
  boxShadow: "0 0 0 9999px rgba(0,0,0,0.25) inset",
  pointerEvents: "none",
};
