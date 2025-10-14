// reason: Lv2 ワイヤー用のコード表示（空ロジックのプレースホルダ）
export type CodeDisplayProps = {
  code?: string;
};

export default function CodeDisplay({ code }: CodeDisplayProps): JSX.Element {
  return (
    <div style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
      <strong>コード:</strong> <span>{code ?? '-'}</span>
    </div>
  );
}

