"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onDetected: (code: string) => void;
  onClose: () => void;
};

declare global { interface Window { BarcodeDetector?: any; } }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";\n\nexport default function BarcodeScanner({ onDetected, onClose }: Props): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any | null>(null);
  const [error, setError] = useState<string>("");

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const close = useCallback(() => { stop(); onClose(); }, [onClose, stop]);

  useEffect(() => {
    // FastAPI API integration point: /scan
    // - 迴ｾ蝨ｨ縺ｯ繝悶Λ繧ｦ繧ｶ縺ｮ BarcodeDetector 繧貞茜逕ｨ縺励※繝ｭ繝ｼ繧ｫ繝ｫ縺ｧ繝・さ繝ｼ繝峨＠縺ｦ縺・∪縺吶・    // - 繧ｵ繝ｼ繝仙・縺ｧ逕ｻ蜒鞘・繝舌・繧ｳ繝ｼ繝芽ｪｭ蜿・API・井ｾ・ POST /api/scan・峨′謠蝉ｾ帙＆繧後ｋ蝣ｴ蜷医・    //   荳玖ｨ倥・讀懷・繝ｫ繝ｼ繝励ｄ onPickImage 縺ｧ蜿門ｾ励＠縺溘ヵ繝ｬ繝ｼ繝/逕ｻ蜒上ｒ繧ｵ繝ｼ繝舌↓騾∽ｿ｡縺励・    //   繝ｬ繧ｹ繝昴Φ繧ｹ縺ｮ繧ｳ繝ｼ繝牙､縺ｧ onDetected(...) 繧貞他縺ｳ蜃ｺ縺吝ｽ｢縺ｫ蟾ｮ縺玲崛縺医※縺上□縺輔＞縲・    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if ("BarcodeDetector" in window) {
          const formats = ["ean_13","ean_8","upc_a","code_128","code_39","itf"];
          detectorRef.current = new window.BarcodeDetector({ formats });
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
            } catch { /* ignore */ }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      } catch (e) {
        console.error(e);
        setError("繧ｫ繝｡繝ｩ繧定ｵｷ蜍輔〒縺阪∪縺帙ｓ縺ｧ縺励◆縲ょ・逵溘°繧芽ｪｭ縺ｿ蜿悶ｊ縺ｫ蛻・ｊ譖ｿ縺医∪縺吶・);
      }
    })();
    return () => stop();
  }, [close, stop]);

  const onPickImage = useCallback(async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(f);
        const det = new window.BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","code_128","code_39","itf"] });
        const res = await det.detect(img as unknown as CanvasImageSource);
        if (res && res.length > 0 && res[0].rawValue) {
          if (navigator.vibrate) navigator.vibrate(50);
          onDetected(res[0].rawValue as string);
          close();
          return;
        }
      }
      // FastAPI API integration point (fallback): /scan
      // - 逕ｻ蜒上ヵ繧｡繧､繝ｫ f 繧・multipart/form-data 縺ｧ POST /api/scan 縺ｫ騾∽ｿ｡縺励・      //   繧ｵ繝ｼ繝仙・縺ｧ繝・さ繝ｼ繝峨＠縺溘ヰ繝ｼ繧ｳ繝ｼ繝画枚蟄怜・繧貞女縺大叙繧句ｮ溯｣・↓鄂ｮ縺肴鋤縺亥庄閭ｽ縺ｧ縺吶・      // - 萓・
      //   const fd = new FormData(); fd.append('file', f);
      //   const r = await fetch(`${API_BASE}/api/scan`, { method: 'POST', body: fd });
      //   const { code } = await r.json(); onDetected(code); close();
      setError("逕ｻ蜒上°繧峨ヰ繝ｼ繧ｳ繝ｼ繝峨ｒ隱ｭ縺ｿ蜿悶ｌ縺ｾ縺帙ｓ縺ｧ縺励◆縲・);
    } catch { setError("逕ｻ蜒上・蜃ｦ逅・↓螟ｱ謨励＠縺ｾ縺励◆縲・); }
  }, [close, onDetected]);

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>繝舌・繧ｳ繝ｼ繝峨ｒ譫蜀・↓蜷医ｏ縺帙※縺上□縺輔＞</strong>
          <button onClick={close}>髢峨§繧・/button>
        </div>
        {error && <div style={{ color: "#c00", marginBottom: 8 }}>{error}</div>}
        <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "#000", borderRadius: 8, overflow: "hidden" }}>
          <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={frameStyle} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "inline-block" }}>
            逕ｻ蜒上°繧芽ｪｭ縺ｿ蜿悶ｋ:
            <input type="file" accept="image/*" capture="environment" onChange={onPickImage} style={{ display: "block", marginTop: 6 }} />
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





