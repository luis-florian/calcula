import { describe, expect, it } from "vitest";

import { appInfo } from "./app-info";

describe("appInfo", () => {
  it("identifies the application", () => {
    expect(appInfo.name).toBe("Amorta");
  });
});
