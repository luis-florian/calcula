import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

describe("parseServerEnv", () => {
  it("uses safe defaults for the empty base project", () => {
    expect(parseServerEnv({}).NEXT_PUBLIC_APP_NAME).toBe("Amorta");
  });

  it("accepts configured server environment variables", () => {
    const env = parseServerEnv({
      AUTH_SECRET: "12345678901234567890123456789012",
      DATABASE_URL: "postgresql://user:pass@example.com:5432/amorta",
      NEXT_PUBLIC_APP_NAME: "Amorta",
    });

    expect(env.DATABASE_URL).toBe(
      "postgresql://user:pass@example.com:5432/amorta",
    );
  });
});
