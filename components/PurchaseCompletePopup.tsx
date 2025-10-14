"use client";

import { useEffect, useRef } from "react";

type Props = {
  visible: boolean;
  total: number; // 税込
  subtotal: number; // 税抜
  tax: number;
  tradeId?: number | string;
  datetimeISO?: string;
  onClose: () => void;
};

export default function PurchaseCompletePopup({
  visible,
  total,
  subtotal,
  tax,
  tradeId,
  datetimeISO,
  onClose,
}: Props): JSX.Element | null {
  const okRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => okRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 pb-[max(0px,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-complete-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl" onClick={stop}>
        <h3 id="purchase-complete-title" className="mt-0 mb-2 text-lg font-semibold">
          購入が完了しました
        </h3>

        {tradeId !== undefined && (
          <div className="mb-1 text-sm text-slate-700">取引ID：{String(tradeId)}</div>
        )}
        {datetimeISO && <div className="mb-3 text-xs text-slate-500">日時：{datetimeISO}</div>}

        <div className="grid gap-2 tabular-nums">
          <div className="flex items-baseline justify-between">
            <span className="text-slate-600">税抜（小計）：</span>
            <span>{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-slate-600">税額：</span>
            <span>{tax.toLocaleString()}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-medium">合計（税込）：</span>
            <strong className="text-base">{total.toLocaleString()}</strong>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            ref={okRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md bg-sky-600 px-4 text-white hover:bg-sky-700"
            aria-label="OK"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
