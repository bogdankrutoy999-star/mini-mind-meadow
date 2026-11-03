import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetSchema, authError } from "@/lib/auth-schema";

export const Route = createFileRoute("/reset-password")({ head: () => ({ meta: [
  { title: "Новый пароль — Mini" }, { name: "description", content: "Безопасное восстановление пароля Mini." },
  { property: "og:title", content: "Новый пароль — Mini" }, { property: "og:description", content: "Установите новый пароль аккаунта Mini." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: ResetPassword });

function ResetPassword() {
  const [valid, setValid] = useState(false); const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" || sessionStorage.getItem("mini.recovery") === "active";
    void supabase.auth.getUser().then(({ data }) => { if (active) { setValid(recovery && Boolean(data.user)); setChecking(false); } }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  return <AuthLayout title="Новый пароль">{checking ? <p role="status">Проверяем ссылку…</p> : done ? <div className="space-y-4 text-center"><p role="status">Пароль изменён.</p><Button asChild className="bg-brand"><Link to="/auth">Войти</Link></Button></div> : !valid ? <div className="space-y-4 text-center"><p role="alert">Ссылка недействительна или устарела.</p><Button asChild variant="link"><Link to="/auth">Запросить новую ссылку</Link></Button></div> : <form className="space-y-4" onSubmit={async e => {
    e.preventDefault(); setError(""); const parsed = resetSchema.safeParse({ password, confirm });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Проверьте пароль"); return; }
    setBusy(true);
    try { const { error } = await supabase.auth.updateUser({ password: parsed.data.password }); if (error) setError(authError(error)); else { sessionStorage.removeItem("mini.recovery"); await supabase.auth.signOut(); setDone(true); } }
    catch { setError("Не удалось сохранить пароль. Попробуйте снова."); } finally { setBusy(false); }
  }}>
    <label className="block text-sm">Новый пароль<Input className="mt-2 h-11 bg-card" type="password" autoComplete="new-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>
    <label className="block text-sm">Повтор пароля<Input className="mt-2 h-11 bg-card" type="password" autoComplete="new-password" required maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button disabled={busy} className="h-11 w-full bg-brand">{busy ? "Сохраняем…" : "Сохранить пароль"}</Button>
  </form>}</AuthLayout>;
}