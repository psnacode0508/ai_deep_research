import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { ResearchStatus } from '@deepresearch/shared';
import {
  approvePlan,
  rejectPlan,
  approveReport,
  rejectReport
} from '../controllers/research.controller';

const mockUpdate = vi.fn();
const mockEqUserId = vi.fn();
const mockSingle = vi.fn();
const mockEqId = vi.fn();
const mockSelect = vi.fn();
const mockResumeResearchJob = vi.fn();

vi.mock('../engine', () => ({
  ResearchEngine: {
    startResearch: vi.fn(),
    cancelResearch: vi.fn()
  }
}));

vi.mock('../config/env', () => ({
  config: {
    supabase: { url: 'http://localhost:54321', serviceRoleKey: 'key' },
    redis: { url: 'redis://localhost:6379' },
    port: 4000
  }
}));

vi.mock('../queue', () => ({
  enqueueResearchJob: vi.fn(),
  resumeResearchJob: (...args: any[]) => mockResumeResearchJob(...args)
}));

vi.mock('../db/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: mockSelect,
      update: mockUpdate
    })
  }
}));

describe('Approvals Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    mockReq = {
      user: { id: 'user-1' } as any,
      params: { id: 'session-1' }
    };

    mockSelect.mockReturnValue({ eq: mockEqId });
    mockEqId.mockReturnValue({ eq: mockEqUserId });
    mockEqUserId.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEqId });
  });

  describe('approvePlan', () => {
    it('should return 401 if user is unauthenticated', async () => {
      mockReq.user = undefined;
      await approvePlan(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if session not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('not found') });
      await approvePlan(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if session is not awaiting plan approval', async () => {
      mockSingle.mockResolvedValue({ data: { status: ResearchStatus.Pending }, error: null });
      await approvePlan(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should approve plan and enqueue job', async () => {
      mockSingle.mockResolvedValue({ data: { status: ResearchStatus.AwaitingPlanApproval }, error: null });

      await approvePlan(mockReq as Request, mockRes as Response);
      
      expect(mockResumeResearchJob).toHaveBeenCalledWith('session-1', 'user-1', 'execute_search');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('rejectPlan', () => {
    it('should reject plan and not enqueue job', async () => {
      mockSingle.mockResolvedValue({ data: { status: ResearchStatus.AwaitingPlanApproval }, error: null });
      mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      await rejectPlan(mockReq as Request, mockRes as Response);
      
      expect(mockUpdate).toHaveBeenCalledWith({ status: ResearchStatus.PlanRejected });
      expect(mockResumeResearchJob).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('approveReport', () => {
    it('should approve report and enqueue job', async () => {
      mockSingle.mockResolvedValue({ data: { status: ResearchStatus.AwaitingFinalApproval }, error: null });

      await approveReport(mockReq as Request, mockRes as Response);
      
      expect(mockResumeResearchJob).toHaveBeenCalledWith('session-1', 'user-1', 'finalize_session');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('rejectReport', () => {
    it('should reject report and not enqueue job', async () => {
      mockSingle.mockResolvedValue({ data: { status: ResearchStatus.AwaitingFinalApproval }, error: null });
      mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      await rejectReport(mockReq as Request, mockRes as Response);
      
      expect(mockUpdate).toHaveBeenCalledWith({ status: ResearchStatus.FinalRejected });
      expect(mockResumeResearchJob).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
