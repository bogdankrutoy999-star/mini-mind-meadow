import { describe, expect, it } from "vitest";
import { authErrorKind, emailSchema, signupCodeSchema } from "@/lib/auth-schema";

describe("Email validation and account errors", () => {
  it("accepts a six-digit signup code including leading zeroes", () => {
    expect(signupCodeSchema.parse("012345")).toBe("012345");
  });
  it("rejects incomplete or nonnumeric signup codes", () => {
    expect(signupCodeSchema.safeParse("12345").success).toBe(false);
    expect(signupCodeSchema.safeParse("12345a").success).toBe(false);
  });
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