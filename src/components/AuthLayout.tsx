import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
    <div className="float-slow"><Logo size={108} /></div>
    <div className="mt-3 font-display text-4xl font-bold text-brand">Mini</div>
    <h1 className="mb-7 mt-5 text-center font-display text-2xl font-semibold">{title}</h1>
    <div className="w-full max-w-sm animate-in fade-in duration-300">{children}</div>
  </main>;
}