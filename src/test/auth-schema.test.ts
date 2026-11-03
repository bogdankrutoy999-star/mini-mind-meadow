import { describe, expect, it } from "vitest";
import { authErrorKind, emailSchema } from "@/lib/auth-schema";

describe("Email validation and account errors", () => {
  it("accepts a normal mailbox with surrounding whitespace", () => {
    expect(emailSchema.parse("  member.test+mini@gmail.com  ")).toBe("member.test+mini@gmail.com");
  });
  it("rejects an address without an at sign", () => {
    expect(emailSchema.safeParse("member.gmail.com").success).toBe(false);
  });
  it("does not interpret invalid credentials as a nonexistent mailbox", () => {
    expect(authErrorKind("invalid_credentials")).toBe("credentials");
  });
  it("distinguishes email confirmation from invalid format", () => {
    expect(authErrorKind("email_not_confirmed")).toBe("unconfirmed");
  });
  it("distinguishes a sending limit from invalid format", () => {
    expect(authErrorKind("over_email_send_rate_limit")).toBe("rate_limit");
  });
});