// reason: Lv2 ワイヤー用の商品情報表示（空ロジックのプレースホルダ）
export type ProductInfoProps = {
  name?: string;
  price?: number;
};

export default function ProductInfo({ name, price }: ProductInfoProps): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div>商品名: {name ?? '-'}</div>
      <div>単価: {price !== undefined ? price.toLocaleString() : '-'}</div>
    </div>
  );
}

