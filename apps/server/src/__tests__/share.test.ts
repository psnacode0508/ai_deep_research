import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  then: vi.fn(),
}));

vi.mock("../db/supabase", () => ({
  supabaseAdmin: mockSupabase
}));

import { getShareStatus, enableShare, revokeShare, getPublicSharedReport } from "../controllers/share.controller";

vi.mock("../engine/export", () => ({
  buildMarkdownContent: vi.fn().mockReturnValue("# Test Markdown")
}));

describe("Share API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateShareAccess", () => {
    it("should reject if report not approved", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "session_1",
          user_id: "user_1",
          research_reports: [{ is_approved: false }]
        },
        error: null
      });

      const req: any = { user: { id: "user_1" }, params: { id: "session_1" } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await getShareStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: "Report not finalized" } });
    });

    it("should allow if report is approved", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "session_1",
          user_id: "user_1",
          research_reports: [{ id: "report_1", is_approved: true }]
        },
        error: null
      }).mockResolvedValueOnce({
        data: { id: "share_1", is_public: true },
        error: null
      });

      const req: any = { user: { id: "user_1" }, params: { id: "session_1" } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await getShareStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "share_1", is_public: true } });
    });
  });

  describe("enableShare", () => {
    it("should upsert a share record", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "session_1",
          user_id: "user_1",
          research_reports: [{ id: "report_1", is_approved: true }]
        },
        error: null
      }).mockResolvedValueOnce({
        data: { id: "share_1", is_public: true },
        error: null
      });

      const req: any = { user: { id: "user_1" }, params: { id: "session_1" }, body: {} };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await enableShare(req, res);

      expect(mockSupabase.upsert).toHaveBeenCalledWith(expect.objectContaining({
        report_id: "report_1",
        is_public: true
      }), expect.anything());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("revokeShare", () => {
    it("should update is_public to false", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "session_1",
          user_id: "user_1",
          research_reports: [{ id: "report_1", is_approved: true }]
        },
        error: null
      }).mockResolvedValueOnce({
        data: { id: "share_1", is_public: false },
        error: null
      });

      const req: any = { user: { id: "user_1" }, params: { id: "session_1" } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await revokeShare(req, res);

      expect(mockSupabase.update).toHaveBeenCalledWith({ is_public: false });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getPublicSharedReport", () => {
    it("should reject if token invalid or share revoked", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_public: false },
        error: null
      });

      const req: any = { params: { token: "token123" } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await getPublicSharedReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reject if expired", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_public: true, expires_at: new Date(Date.now() - 10000).toISOString() },
        error: null
      });

      const req: any = { params: { token: "token123" } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await getPublicSharedReport(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
    });

    it("should return sanitized markdown if valid", async () => {
      mockSupabase.single.mockResolvedValueOnce({ // share lookup
        data: { 
          id: "share_1",
          is_public: true, 
          view_count: 0,
          report: { id: "report_1", title: "Test", session_id: "session_1", created_at: "2026-01-01" } 
        },
        error: null
      });
      // Mock citations lookup (does not use single)
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null });
      // Mock evaluations lookup (uses single)
      mockSupabase.single.mockResolvedValueOnce({ data: {}, error: null });

      const req: any = { params: { token: "token123" } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await getPublicSharedReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          title: "Test",
          markdown: "# Test Markdown" // from mock buildMarkdownContent
        })
      }));
    });
  });
});
