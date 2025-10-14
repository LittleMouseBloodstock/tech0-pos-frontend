// reason: Lv2 ワイヤー用の「カメラでスキャン」ボタン（空ロジックのプレースホルダ）
export type CameraButtonProps = {
  onClick?: () => void;
};

export default function CameraButton({ onClick }: CameraButtonProps): JSX.Element {
  return (
    <button onClick={onClick}>カメラでスキャン</button>
  );
}

