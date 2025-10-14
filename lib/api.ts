export type Product = { prdId: number; code: string; name: string; price: number };

// 単一 or null 返却が理想だが、現状の {items:[...]} 形式にも互換対応
// FastAPI API integration point: /scan or /products
// - スキャン結果のコードをサーバ検索する想定のため、現状は
//   GET /api/products?code=... を呼び出しています。
// - もしサーバに /api/scan（画像→コード変換）がある場合は、クライアント側で
//   画像を送る or 取得コードをそのまま返すなど要件に応じて差し替えてください。
export async function fetchProductByCode(apiBase: string, code: string): Promise<Product | null> {
  const res = await fetch(`${apiBase}/api/products?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data) return null;
  if (Array.isArray(data.items)) {
    const it = data.items[0];
    if (!it) return null;
    return { prdId: it.prdId ?? 0, code: it.code, name: it.name, price: it.price ?? 0 };
  }
  return { prdId: data.prdId ?? 0, code: data.code, name: data.name, price: data.price ?? 0 };
}

export type PurchaseItemReq = {
  prd_id?: number;
  product_code: string;
  product_name?: string;
  unit_price?: number;
  quantity: number;
};

export type PurchaseReq = {
  cashier_code?: string;
  store_code?: string;
  pos_id?: string;
  items: PurchaseItemReq[];
};

export type PurchaseRes = {
  success?: boolean;
  id?: number; // 旧スタブ互換
  status?: string; // 旧スタブ互換
  trade_id?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
};

// FastAPI API integration point: /purchase
// - 購入の送信先は POST /api/purchase です。
// - レスポンスは { success, total, subtotal, trade_id } を想定（互換で id/status も受容）。
export async function postPurchase(apiBase: string, body: PurchaseReq): Promise<PurchaseRes> {
  const res = await fetch(`${apiBase}/api/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
