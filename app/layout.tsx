import "./globals.css";

export const metadata = {
  title: 'POS Lv2',
  description: 'Minimal Next.js + FastAPI skeleton',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}

