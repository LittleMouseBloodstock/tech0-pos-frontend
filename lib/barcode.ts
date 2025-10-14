export function calcEAN13CheckDigit(d12: string): number {
  if (!/^\d{12}$/.test(d12)) throw new Error("invalid length");
  let sumOdd = 0; // 1,3,5,7,9,11桁目(1-based)
  let sumEven = 0; // 2,4,6,8,10,12桁目
  for (let i = 0; i < 12; i++) {
    const n = d12.charCodeAt(i) - 48;
    if ((i + 1) % 2 === 1) sumOdd += n; else sumEven += n;
  }
  const total = sumOdd + sumEven * 3;
  return (10 - (total % 10)) % 10;
}

export function validateEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const check = calcEAN13CheckDigit(code.slice(0, 12));
  return check === Number(code[12]);
}

// 入力文字列からバーコードを正規化（EAN-13に統一）。不正ならnull
export function normalizeBarcode(input: string): string | null {
  const raw = (input || "").trim().normalize('NFKC'); // 全角→半角などを正規化
  const digits = raw.replace(/\D+/g, "");
  // EAN-13 / UPC-A を最優先
  if (digits.length === 12) {
    const ean = "0" + digits; // UPC-A -> EAN-13
    // DB側は13桁で保持している前提。チェックが不一致でも情報検索のため通す
    return validateEAN13(ean) ? ean : ean;
  }
  if (digits.length === 13) {
    // チェックディジットが不一致でも、運用上コードがそのまま格納されているケースに対応
    return digits;
  }
  // それ以外（Code39/Code128/ITF 等）: 英数/記号を許容してそのまま返す
  // 実運用ではスキーマ・商品コード仕様に合わせて制約を調整してください
  if (/^[A-Za-z0-9\-_.]+$/.test(raw) && raw.length >= 4 && raw.length <= 64) {
    return raw.toUpperCase();
  }
  return null;
}
