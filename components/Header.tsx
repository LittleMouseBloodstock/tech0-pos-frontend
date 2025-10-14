"use client";

import type { ReactNode } from "react";

export type HeaderProps = {
  title?: string;
  right?: ReactNode;
};

export default function Header({ title = "モバイルPOSアプリ", right }: HeaderProps): JSX.Element {
  return (
    <header role="banner" className="sticky top-0 z-50 bg-[#7199B5] text-white">
      <div className="relative h-14 mx-auto max-w-[960px] px-4 flex items-center justify-center">
        <h1 className="m-0 text-base font-semibold tracking-wide">{title}</h1>
        {right && <div className="absolute right-4">{right}</div>}
      </div>
    </header>
  );
}
