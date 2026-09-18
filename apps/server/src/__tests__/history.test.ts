import { describe, it, expect, vi, beforeEach } from "vitest";
import { listResearchSessions, deleteResearchSession } from "../controllers/research.controller";

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  then: vi.fn(),
}));

vi.mock("../db/supabase", () => ({
  supabaseAdmin: mockSupabase
}));

vi.mock("../engine", () => ({
  ResearchEngine: { cancelResearch: vi.fn().mockResolvedValue(true) }
}));

vi.mock("../queue", () => ({
  enqueueResearchJob: vi.fn(),
  resumeResearchJob: vi.fn()
}));

describe("History API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listResearchSessions", () => {
    it("should handle default pagination and isolation", async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [{ id: "session1" }],
        count: 1,
        error: null
      });

      const req: any = { 
        user: { id: "user_1" },
        query: {}
      };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await listResearchSessions(req, res);

      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_1");
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19);
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: "session1" }],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    });

    it("should handle max page size enforcement", async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        count: 0,
        error: null
      });

      const req: any = { 
        user: { id: "user_1" },
        query: { page: "2", limit: "100" } // limit should be capped at 50
      };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await listResearchSessions(req, res);

      // (2 - 1) * 50 = 50
      // 50 + 50 - 1 = 99
      expect(mockSupabase.range).toHaveBeenCalledWith(50, 99);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle search and status filters", async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        count: 0,
        error: null
      });

      const req: any = { 
        user: { id: "user_1" },
        query: { search: "test", status: "complete", sortDir: "asc" }
      };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await listResearchSessions(req, res);

      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "complete");
      expect(mockSupabase.or).toHaveBeenCalledWith(`title.ilike.%test%,question.ilike.%test%`);
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: true });
    });
  });

  describe("deleteResearchSession", () => {
    it("should restrict deletion to owner", async () => {
      // Mock the final promise resolution on the last chained method (eq)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase); // id
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
        count: 1
      }); // user_id

      const req: any = { 
        user: { id: "user_1" },
        params: { id: "session_1" }
      };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await deleteResearchSession(req, res);

      expect(mockSupabase.delete).toHaveBeenCalledWith({ count: 'exact' });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "session_1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 for nonexistent or unowned session", async () => {
      mockSupabase.eq.mockReturnValueOnce(mockSupabase); // id
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
        count: 0
      }); // user_id

      const req: any = { 
        user: { id: "user_1" },
        params: { id: "session_does_not_exist" }
      };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await deleteResearchSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
