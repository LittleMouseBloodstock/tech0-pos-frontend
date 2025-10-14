// reason: Lv2 ワイヤー用の「購入」ボタン（空ロジックのプレースホルダ）
export type PurchaseButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
};

export default function PurchaseButton({ onClick, disabled }: PurchaseButtonProps): JSX.Element {
  return (
    <button onClick={onClick} disabled={disabled}>
      購入
    </button>
  );
}

