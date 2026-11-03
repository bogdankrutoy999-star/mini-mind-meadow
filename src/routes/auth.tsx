import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LoaderCircle, LogIn, Mail, UserPlus } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authError, emailSchema, signupSchema } from "@/lib/auth-schema";
import { newThreadId } from "@/lib/chat-store";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Вход в аккаунт — Mini" },
    { name: "description", content: "Вход и регистрация в личном аккаунте Mini." },
    { property: "og:title", content: "Вход в аккаунт — Mini" },
    { property: "og:description", content: "Ваш личный AI-помощник Mini." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const changeMode = (next: typeof mode) => { setMode(next); setError(""); setNotice(""); setForm(value => ({ ...value, password: "", confirm: "" })); };

  async function submit() {
    setError(""); setNotice("");
    const parsed = mode === "register" ? signupSchema.safeParse(form) : mode === "forgot" ? z.object({ email: emailSchema }).safeParse(form) : z.object({ email: emailSchema, password: z.string().min(1, "Введите пароль").max(128) }).safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Проверьте данные"); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: form.password });
        if (error) setError(authError(error));
        else await navigate({ to: "/chat/$threadId", params: { threadId: newThreadId() }, replace: true });
      } else if (mode === "register") {
        const data = signupSchema.parse(form);
        const { error } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { data: { username: data.username }, emailRedirectTo: window.location.origin } });
        if (error) setError(authError(error));
        else setNotice("Проверьте почту: подтвердите аккаунт по ссылке в письме, затем войдите.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) setError(authError(error));
        else setNotice("Если аккаунт с этой почтой существует, вы получите письмо со ссылкой для смены пароля. Проверьте также папку «Спам».");
      }
    } catch { setError("Не удалось связаться с сервером. Попробуйте снова."); }
    finally { setBusy(false); }
  }

  return <AuthLayout title={mode === "login" ? "С возвращением" : mode === "register" ? "Создать аккаунт" : "Восстановление пароля"}>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); void submit(); }}>
      {mode === "register" && <label className="block text-sm">Имя пользователя<Input className="mt-2 h-11 bg-card" required maxLength={80} autoComplete="nickname" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>}
      <label className="block text-sm">Электронная почта<Input className="mt-2 h-11 bg-card" type="email" required maxLength={255} autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      {mode !== "forgot" && <label className="block text-sm">Пароль<Input className="mt-2 h-11 bg-card" type="password" required maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>}
      {mode === "register" && <label className="block text-sm">Повтор пароля<Input className="mt-2 h-11 bg-card" type="password" required maxLength={128} autoComplete="new-password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /><span className="mt-2 block text-xs text-muted-foreground">Не менее 8 символов в пароле.</span></label>}
      {mode === "login" && <div className="text-right"><Button type="button" variant="link" className="h-auto p-0" disabled={busy} onClick={() => changeMode("forgot")}>Забыли пароль?</Button></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      <Button className="h-11 w-full bg-brand shadow-glow" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : mode === "login" ? <LogIn /> : mode === "register" ? <UserPlus /> : <Mail />}{mode === "login" ? "Войти" : mode === "register" ? "Зарегистрироваться" : "Отправить письмо"}</Button>
    </form>
    <div className="mt-5 text-center"><Button variant="link" disabled={busy} onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Создать аккаунт" : "Вернуться ко входу"}</Button></div>
  </AuthLayout>;
}