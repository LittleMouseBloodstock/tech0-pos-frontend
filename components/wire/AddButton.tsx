// reason: Lv2 ワイヤー用の「追加」ボタン（空ロジックのプレースホルダ）
export type AddButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
};

export default function AddButton({ onClick, disabled }: AddButtonProps): JSX.Element {
  return (
    <button onClick={onClick} disabled={disabled}>
      追加
    </button>
  );
}

