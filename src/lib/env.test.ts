import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

describe("parseServerEnv", () => {
  it("uses safe defaults for the empty base project", () => {
    expect(parseServerEnv({}).NEXT_PUBLIC_APP_NAME).toBe("Amorta");
    expect(parseServerEnv({}).AMORTA_SINGLE_USER_ID).toBe("dev_user");
  });

  it("accepts configured server environment variables", () => {
    const env = parseServerEnv({
      AUTH_SECRET: "12345678901234567890123456789012",
      AMORTA_LOGIN_PASSWORD_HASH:
        "$2b$12$abcdefghijklmnopqrstuuP2D7v5ab6mPvSNiV5R9QFQyXWzOvwye",
      AMORTA_LOGIN_USERNAME: "mariof",
      AMORTA_SINGLE_USER_ID: "owner_test",
      DATABASE_URL: "postgresql://user:pass@example.com:5432/amorta",
      NEXT_PUBLIC_APP_NAME: "Amorta",
    });

    expect(env.AMORTA_LOGIN_USERNAME).toBe("mariof");
    expect(env.AMORTA_SINGLE_USER_ID).toBe("owner_test");
    expect(env.DATABASE_URL).toBe(
      "postgresql://user:pass@example.com:5432/amorta",
    );
  });
});
