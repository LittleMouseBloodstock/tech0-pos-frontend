"use client";

import { useMemo } from "react";
import type { Product } from "../lib/api";

export type Line = Product & { qty: number };

type Props = {
  lines: Line[];
  onInc: (code: string) => void;
  onDec: (code: string) => void;
  onRemove: (code: string) => void;
  onClear: () => void;
  onChangeQty?: (code: string, qty: number) => void;
  taxRate?: number; // 既定10%
  rounding?: "floor" | "round" | "ceil"; // 税端数処理（既定: floor）
};

const applyRounding = (v: number, mode: Props["rounding"] = "floor") =>
  mode === "ceil" ? Math.ceil(v) : mode === "round" ? Math.round(v) : Math.floor(v);

export default function PurchaseList({
  lines,
  onInc,
  onDec,
  onRemove,
  onClear,
  onChangeQty,
  taxRate = 0.1,
  rounding = "floor",
}: Props): JSX.Element {
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);
  const tax = useMemo(() => applyRounding(subtotal * taxRate, rounding), [subtotal, taxRate, rounding]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  return (
    <section className="space-y-3">

      {lines.length === 0 ? (
        <div className="text-slate-500">カートは空です</div>
      ) : (
        <div className="grid gap-2">
          {lines.map((l) => (
            <div key={l.code} className="rounded-md border border-slate-200 px-2 py-2">
              {/* 1行目: 商品名のみ（強調・省略） */}
              <div className="min-w-0">
                <div className="font-semibold truncate" title={`${l.name} (${l.code})`}>{l.name}</div>
              </div>

              {/* 2行目: 単価 / 個数操作 / 行計 / 削除 */}
              <div className="mt-1 grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-2">
                <div className="text-xs text-slate-600 tabular-nums whitespace-nowrap">単価 {l.price.toLocaleString()}円</div>

                <div className="inline-flex items-center gap-2">
                  <button aria-label="数量を1減らす" onClick={() => onDec(l.code)} className="h-8 w-8 rounded-md border border-sky-700 text-sky-700 hover:bg-slate-50 shrink-0">-</button>
                  {onChangeQty ? (
                    <input
                      inputMode="numeric"
                      className="h-8 w-14 rounded-md border px-2 text-right shrink-0"
                      value={String(l.qty)}
                      onChange={(e) => {
                        const n = Math.max(1, Number(e.target.value.replace(/\D+/g, "")) || 1) | 0;
                        onChangeQty(l.code, n);
                      }}
                      aria-label="数量を入力"
                    />
                  ) : (
                    <span aria-live="polite" className="w-8 text-center shrink-0">{l.qty}</span>
                  )}
                  <button aria-label="数量を1増やす" onClick={() => onInc(l.code)} className="h-8 w-8 rounded-md border border-sky-700 text-sky-700 hover:bg-slate-50 shrink-0">+</button>
                </div>

                <div className="tabular-nums whitespace-nowrap justify-self-end">= {(l.price * l.qty).toLocaleString()}</div>

                <div className="text-right">
                  <button aria-label="この商品を削除" onClick={() => onRemove(l.code)} className="h-8 px-3 rounded-md border text-red-600 hover:bg-red-50 whitespace-nowrap shrink-0">
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <button onClick={onClear} className="h-9 px-3 rounded-md border hover:bg-slate-50 whitespace-nowrap text-sm shrink-0">カートをクリア</button>
            <div className="flex items-baseline gap-3 tabular-nums text-sm whitespace-nowrap">
              <div className="text-slate-600">税抜（小計）：{subtotal.toLocaleString()}</div>
              <div className="text-slate-600">税額：{tax.toLocaleString()}</div>
              <div className="font-semibold">合計（税込）：{total.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
