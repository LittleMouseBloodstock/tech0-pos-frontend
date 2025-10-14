"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import ScanSection from "../components/ScanSection";
import PurchaseList from "../components/PurchaseList";
import PurchaseCompletePopup from "../components/PurchaseCompletePopup";
import FooterBar from "../components/FooterBar";
import { normalizeBarcode } from "../lib/barcode";
import { fetchProductByCode, type Product, type PurchaseItemReq, postPurchase } from "../lib/api";

type Line = Product & { qty: number };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const USE_DUMMY = process.env.NEXT_PUBLIC_USE_DUMMY === "1";
const BarcodeScanner = dynamic(() => import("../components/BarcodeScanner"), { ssr: false });

export default function Home(): JSX.Element {
  const [codeInput, setCodeInput] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<Line[]>([]);
  const [message, setMessage] = useState<string>("");
  const [scanOpen, setScanOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; tradeId?: number | string; subtotal: number; tax: number; total: number; datetimeISO?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const tax = useMemo(() => Math.floor(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const fetchProduct = useCallback(async (raw: string) => {
    const code = normalizeBarcode(raw);
    if (!code) {
      setMessage("12〜13桁のバーコードを入力してください");
      setProduct(null);
      return;
    }
    setMessage("");
    if (USE_DUMMY) {
      setProduct({ prdId: 1, code, name: "ダミー商品", price: 123 });
      return;
    }
    setSearching(true);
    try {
      // FastAPI API integration: GET /api/products?code=... - 商品コード検索
      const p = await fetchProductByCode(API_BASE, code);
      if (p) setProduct(p);
      else setProduct({ prdId: 0, code, name: "未登録コード（マスタ未登録）", price: 0 });
    } catch {
      setMessage("検索に失敗しました（通信エラー）");
      setProduct(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const search = useCallback(async () => { await fetchProduct(codeInput.trim()); }, [codeInput, fetchProduct]);
  const autoSearch = useCallback(async (code: string) => { await fetchProduct(code); }, [fetchProduct]);

  const add = useCallback(() => {
    if (!product) return;
    setCart((prev) => {
      const idx = prev.findIndex((l) => (l.prdId && product.prdId ? l.prdId === product.prdId : l.code === product.code));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setProduct(null);
    setCodeInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [product]);

  const inc = useCallback((code: string) => { setCart((prev) => prev.map((x) => (x.code === code ? { ...x, qty: x.qty + 1 } : x))); }, []);
  const dec = useCallback((code: string) => { setCart((prev) => prev.map((x) => (x.code === code ? { ...x, qty: Math.max(1, x.qty - 1) } : x))); }, []);
  const remove = useCallback((code: string) => { setCart((prev) => prev.filter((x) => x.code !== code)); }, []);
  const clear = useCallback(() => setCart([]), []);

  const onDetected = useCallback(async (text: string) => {
    const code = text.trim();
    setScanOpen(false);
    setCodeInput(code);
    // FastAPI API integration: POST /api/scan - 画像→コード抽出（サーバ側デコード）
    // FastAPI API integration: GET  /api/products?code=... - 取得したコードの検索
    await fetchProduct(code);
  }, [fetchProduct]);

  const purchase = useCallback(async () => {
    if (!cart.length || purchasing) return;
    setPurchasing(true);
    try {
      const items: PurchaseItemReq[] = cart.map((l) => ({ product_code: l.code, quantity: l.qty, unit_price: l.price }));
      // FastAPI API integration: POST /api/purchase - 購入確定
      const res = await postPurchase(API_BASE, { items });
      const rSub = (res as any)?.subtotal ?? subtotal;
      const rTot = (res as any)?.total ?? total;
        const summary = { tradeId: (res as any)?.trade_id ?? (res as any)?.id, subtotal: rSub, tax, total: rTot, datetimeISO: new Date().toISOString() };
        setPopup({ visible: true, ...summary });
        setCart([]);
    } catch {
      setMessage("購入に失敗しました（通信エラー）");
    } finally {
      setPurchasing(false);
    }
  }, [cart, purchasing, subtotal, tax, total]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[960px] p-4 pb-20">
        <div className="grid gap-4">
          <section className="bg-white rounded-xl shadow-sm p-3">
            <ScanSection
              codeInput={codeInput}
              onCodeChange={(v) => { setCodeInput(v); setProduct(null); setMessage(""); }}
              onSearch={search}
              onAutoSearch={autoSearch}
              onScan={() => setScanOpen(true)}
              product={product}
              onAdd={add}
              canAdd={!!product}
              message={message}
              searching={searching}
            />
          </section>

          <section className="bg-white rounded-xl shadow-sm p-3">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">購入リスト</h2>
            <PurchaseList
              lines={cart}
              onInc={inc}
              onDec={dec}
              onRemove={remove}
              onClear={clear}
              onChangeQty={(code, qty) => setCart((prev) => prev.map((x) => (x.code === code ? { ...x, qty: Math.max(1, qty) } : x)))}
              taxRate={0.1}
            />
          </section>
        </div>
      </main>

      {scanOpen && <BarcodeScanner onDetected={onDetected} onClose={() => setScanOpen(false)} />}

      {popup?.visible && (
        <PurchaseCompletePopup
          visible
          total={popup.total}
          subtotal={popup.subtotal}
          tax={popup.tax}
          tradeId={popup.tradeId}
          datetimeISO={popup.datetimeISO}
          onClose={() => setPopup(null)}
        />
      )}

      <FooterBar subtotal={subtotal} tax={tax} total={total} disabled={!cart.length} loading={purchasing} onPurchase={purchase} />
    </>
  );
}
