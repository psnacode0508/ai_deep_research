import { describe, it, expect, vi } from "vitest";
import { classifyDomain, parsePdfBuffer } from "../ingestion/index";

describe("Ingestion Service", () => {
  describe("classifyDomain", () => {
    it("classifies .gov as government/primary", () => {
      const result = classifyDomain("www.defense.gov");
      expect(result.category).toBe("government");
      expect(result.isPrimary).toBe(true);
    });

    it("classifies .edu as academic", () => {
      const result = classifyDomain("research.mit.edu");
      expect(result.category).toBe("academic");
      expect(result.isPrimary).toBe(false);
    });

    it("classifies github as technical documentation", () => {
      const result = classifyDomain("github.com");
      expect(result.category).toBe("technical documentation");
    });

    it("classifies unknown domains properly", () => {
      const result = classifyDomain("example.com");
      expect(result.category).toBe("unknown");
    });
  });

  describe("parsePdfBuffer", () => {
    it("throws if buffer is too large", async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await expect(parsePdfBuffer(largeBuffer, "large.pdf")).rejects.toThrow("PDF exceeds maximum allowed size");
    });
  });
});
