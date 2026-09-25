import './globals.css';
import NavBar from './NavBar';

export const metadata = { title: '취업 준비 플랫폼' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <NavBar />
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">{children}</div>
      </body>
    </html>
  );
}
