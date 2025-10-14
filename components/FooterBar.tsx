"use client";
import type { ReactNode } from "react";

type Props = {
  subtotal: number;
  tax: number;
  total: number;
  disabled?: boolean;
  loading?: boolean;
  onPurchase: () => void;
  childrenRight?: ReactNode;
};

export default function FooterBar({ subtotal, tax, total, disabled, loading, onPurchase, childrenRight }: Props) {
  return (
    <footer role="contentinfo" className="fixed inset-x-0 bottom-0 z-50 bg-white/90 backdrop-blur border-t pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="mx-auto h-14 max-w-[960px] px-4 flex items-center justify-end">
        <div className="flex items-center gap-3">
          {childrenRight}
          <button
            type="button"
            onClick={onPurchase}
            disabled={disabled || loading}
            className="inline-flex h-10 px-6 items-center rounded-lg bg-[#7199B5] text-white hover:opacity-95 disabled:opacity-50 border-2 border-[#456C8A]"
          >
            購入
          </button>
        </div>
      </div>
    </footer>
  );
}
