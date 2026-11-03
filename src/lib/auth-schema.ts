import { z } from "zod";

export const emailSchema = z.string().trim().email("Введите корректную почту").max(255);
export const passwordSchema = z.string().min(8, "Пароль должен содержать не менее 8 символов").max(128);
export const usernameSchema = z.string().trim().min(1, "Введите имя").max(80, "Имя слишком длинное");
export const signupSchema = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema, confirm: z.string() }).refine(v => v.password === v.confirm, { message: "Пароли не совпадают", path: ["confirm"] });
export const resetSchema = z.object({ password: passwordSchema, confirm: z.string() }).refine(v => v.password === v.confirm, { message: "Пароли не совпадают", path: ["confirm"] });
export const messagesSchema = z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(20000) })).max(100);

export function authError(error: { message: string; code?: string | undefined }) {
  if (error.code === "invalid_credentials") return "Неверная почта или пароль.";
  if (error.code === "email_not_confirmed") return "Подтвердите почту по ссылке в письме перед входом.";
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") return "Слишком много попыток. Подождите и попробуйте снова.";
  if (error.code === "user_already_exists") return "Аккаунт уже существует. Войдите или восстановите пароль.";
  if (error.code === "weak_password") return "Выберите более надёжный пароль.";
  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}