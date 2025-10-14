"use client";

import type { Product } from "../lib/api";

export type ScanSectionProps = {
  codeInput: string;
  onCodeChange: (v: string) => void;
  onSearch: () => void;
  onAutoSearch?: (code: string) => void; // 値を直接渡して即時検索（setState競合回避）
  onScan: () => void;
  product: Product | null;
  onAdd: () => void;
  canAdd: boolean;
  message?: string;
  searching?: boolean;
  autoSearch?: boolean;
};

export default function ScanSection({
  codeInput,
  onCodeChange,
  onSearch,
  onAutoSearch,
  onScan,
  product,
  onAdd,
  canAdd,
  message,
  searching,
  autoSearch = true,
}: ScanSectionProps): JSX.Element {
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !searching) onSearch();
  };

  const onChange = (v: string) => {
    // 全角→半角など幅正規化してから数値のみ抽出
    const canon = (v || "").normalize("NFKC");
    const digits = canon.replace(/\D+/g, "");
    onCodeChange(digits);
    // 13桁（EAN-13）を優先して自動検索。
    // 12桁（UPC-A）はEnterキーで検索可能（normalize側で13桁化）。
    if (autoSearch && digits.length >= 13) {
      if (onAutoSearch) onAutoSearch(digits); else setTimeout(() => onSearch(), 0);
    }
  };

  return (
    <section className="grid gap-3">
      <button
        type="button"
        onClick={onScan}
        aria-label="カメラでスキャン"
        className="inline-flex h-12 w-full justify-center items-center rounded-lg bg-[#A6C9E0] text-slate-800 font-medium shadow-sm border-2 border-[#7199B5]"
      >
        <span className="mr-2">📷</span> スキャン（カメラ）
      </button>

      <div className="grid gap-2">
        <div className="h-12 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 flex items-center">{product?.code ?? ""}</div>
        <div className="h-12 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 flex items-center">{product?.name ?? ""}</div>
        <div className="h-12 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 flex items-center">{product ? `${product.price.toLocaleString()}円` : ""}</div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={codeInput}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="バーコード(12〜13桁)"
          inputMode="numeric"
          aria-label="商品コード入力"
          className="h-10 w-64 px-3 border rounded-md outline-none focus:ring-2 focus:ring-sky-300"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={!!searching}
          className="inline-flex h-10 px-3 items-center rounded-md border hover:bg-slate-50 disabled:opacity-50"
        >
          {searching ? "検索中..." : "検索"}
        </button>
        {message && <span className="text-sm text-red-600">{message}</span>}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className="inline-flex h-12 w-full justify-center items-center rounded-lg bg-[#A6C9E0] text-slate-800 font-semibold shadow-sm border-2 border-[#7199B5] disabled:opacity-50"
      >
        追加
      </button>
    </section>
  );
}
