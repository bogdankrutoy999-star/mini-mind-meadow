import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle, LogIn, Mail, UserPlus } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authError, authErrorKind, emailSchema, signupSchema } from "@/lib/auth-schema";
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
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [retryIn, setRetryIn] = useState(0);
  const navigate = useNavigate();
  const changeMode = (next: typeof mode) => { setMode(next); setError(""); setNotice(""); setConfirmationEmail(""); setForm(value => ({ ...value, password: "", confirm: "" })); };
  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = setTimeout(() => setRetryIn(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [retryIn]);

  function handleError(issue: { message: string; code?: string | undefined }, email: string) {
    setError(authError(issue));
    if (authErrorKind(issue.code) === "rate_limit") setRetryIn(60);
    if (authErrorKind(issue.code) === "unconfirmed") setConfirmationEmail(email);
  }

  async function resendConfirmation() {
    const parsed = emailSchema.safeParse(confirmationEmail);
    if (!parsed.success || busy || retryIn > 0) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: window.location.origin } });
      if (error) handleError(error, parsed.data);
      else { setNotice("Если адрес ожидает подтверждения, письмо отправлено повторно. Проверьте входящие и папку «Спам»."); setRetryIn(60); }
    } catch { setError("Не удалось связаться с сервером. Попробуйте снова."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (busy || (mode !== "login" && retryIn > 0)) return;
    setError(""); setNotice("");
    const parsed = mode === "register" ? signupSchema.safeParse(form) : mode === "forgot" ? z.object({ email: emailSchema }).safeParse(form) : z.object({ email: emailSchema, password: z.string().min(1, "Введите пароль").max(128) }).safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Проверьте данные"); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: form.password });
        if (error) handleError(error, parsed.data.email);
        else await navigate({ to: "/chat/$threadId", params: { threadId: newThreadId() }, replace: true });
      } else if (mode === "register") {
        const data = signupSchema.parse(form);
        const { error } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { data: { username: data.username }, emailRedirectTo: window.location.origin } });
        if (error) handleError(error, data.email);
        else {
          setConfirmationEmail(data.email); setRetryIn(60);
          setForm(value => ({ ...value, password: "", confirm: "" }));
          setNotice("Адрес принят. Если он доступен для регистрации, вы получите письмо. Откройте ссылку, чтобы подтвердить доступ к почте, затем войдите. Проверьте папку «Спам».");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) handleError(error, parsed.data.email);
        else { setRetryIn(60); setNotice("Если аккаунт с этой почтой существует, вы получите письмо со ссылкой для смены пароля. Проверьте также папку «Спам»."); }
      }
    } catch { setError("Не удалось связаться с сервером. Попробуйте снова."); }
    finally { setBusy(false); }
  }

  return <AuthLayout title={mode === "login" ? "С возвращением" : mode === "register" ? "Создать аккаунт" : "Восстановление пароля"}>
    <form noValidate className="space-y-4" onSubmit={e => { e.preventDefault(); void submit(); }}>
      {mode === "register" && <label className="block text-sm">Имя пользователя<Input className="mt-2 h-11 bg-card" required maxLength={80} autoComplete="nickname" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>}
      <label className="block text-sm">Электронная почта<Input className="mt-2 h-11 bg-card" type="email" required maxLength={255} autoComplete="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setError(""); setNotice(""); setConfirmationEmail(""); }} /></label>
      {mode !== "forgot" && <label className="block text-sm">Пароль<Input className="mt-2 h-11 bg-card" type="password" required maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>}
      {mode === "register" && <label className="block text-sm">Повтор пароля<Input className="mt-2 h-11 bg-card" type="password" required maxLength={128} autoComplete="new-password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /><span className="mt-2 block text-xs text-muted-foreground">Не менее 8 символов в пароле.</span></label>}
      {mode === "login" && <div className="text-right"><Button type="button" variant="link" className="h-auto p-0" disabled={busy} onClick={() => changeMode("forgot")}>Забыли пароль?</Button></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      <Button className="h-11 w-full bg-brand shadow-glow" disabled={busy || (mode !== "login" && (retryIn > 0 || Boolean(confirmationEmail)))}>{busy ? <LoaderCircle className="animate-spin" /> : mode === "login" ? <LogIn /> : mode === "register" ? <UserPlus /> : <Mail />}{mode === "login" ? "Войти" : mode === "register" ? "Зарегистрироваться" : "Отправить письмо"}</Button>
    </form>
    {confirmationEmail && <div className="mt-4 space-y-3 border-t pt-4">
      <p className="break-all text-sm text-muted-foreground">Ожидает подтверждения: {confirmationEmail}</p>
      <Button variant="outline" className="w-full" disabled={busy || retryIn > 0} onClick={() => void resendConfirmation()}><Mail />Отправить подтверждение ещё раз</Button>
    </div>}
    {retryIn > 0 && <p role="status" className="mt-3 text-center text-sm text-muted-foreground">Повторная отправка через {retryIn} с</p>}
    <div className="mt-5 text-center"><Button variant="link" disabled={busy} onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Создать аккаунт" : "Вернуться ко входу"}</Button></div>
  </AuthLayout>;
}