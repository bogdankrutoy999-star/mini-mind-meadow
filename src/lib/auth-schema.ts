import { z } from "zod";

export const emailSchema = z.string().trim().email("Проверьте формат адреса, например name@example.com").max(255);
export const passwordSchema = z.string().min(8, "Пароль должен содержать не менее 8 символов").max(128);
export const usernameSchema = z.string().trim().min(1, "Введите имя").max(80, "Имя слишком длинное");
export const signupSchema = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema, confirm: z.string() }).refine(v => v.password === v.confirm, { message: "Пароли не совпадают", path: ["confirm"] });
export const resetSchema = z.object({ password: passwordSchema, confirm: z.string() }).refine(v => v.password === v.confirm, { message: "Пароли не совпадают", path: ["confirm"] });
export const messagesSchema = z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(20000) })).max(100);

export function authErrorKind(code?: string): "credentials" | "unconfirmed" | "rate_limit" | "invalid_email" | "other" {
  if (code === "invalid_credentials") return "credentials";
  if (code === "email_not_confirmed") return "unconfirmed";
  if (["over_email_send_rate_limit", "over_request_rate_limit", "email_rate_limit_exceeded"].includes(code ?? "")) return "rate_limit";
  if (code === "email_address_invalid") return "invalid_email";
  return "other";
}

export function authError(error: { message: string; code?: string | undefined }) {
  if (error.code === "invalid_credentials") return "Не удалось войти. Проверьте пароль и убедитесь, что аккаунт зарегистрирован. Это не означает, что почта не существует.";
  if (error.code === "email_not_confirmed") return "Подтвердите почту по ссылке в письме перед входом.";
  if (authErrorKind(error.code) === "rate_limit") return "Повторная отправка временно ограничена. Подождите минуту; если ошибка повторяется, попробуйте позже. Это не ошибка адреса.";
  if (error.code === "email_address_invalid") return "Сервис отклонил формат адреса. Проверьте написание почты.";
  if (error.code === "user_already_exists") return "Аккаунт уже существует. Войдите или восстановите пароль.";
  if (error.code === "weak_password") return "Выберите более надёжный пароль.";
  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}