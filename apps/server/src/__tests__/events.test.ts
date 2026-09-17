import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/env', () => ({
  config: {
    redis: { url: "redis://localhost:6379" },
    server: { nodeEnv: "test", isProduction: false, isDevelopment: false },
    supabase: { url: "test", serviceRoleKey: "test", databaseUrl: "test" },
    gemini: { apiKey: "test", model: "test" },
    tavily: { apiKey: "test" },
  }
}));

vi.mock("ioredis", () => {
  return {
    default: class RedisMock {
      on = vi.fn();
      subscribe = vi.fn();
      publish = vi.fn();
    }
  };
});

import { eventService } from '../engine/events';
import { ResearchEvent } from '@deepresearch/shared';

describe('EventService', () => {
  beforeEach(() => {
    // Clear private clients map using reflection for tests
    (eventService as any).clients.clear();
  });

  it('should subscribe and keep connection alive', () => {
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      on: vi.fn()
    };
    
    eventService.subscribe('session-1', mockRes as any);
    
    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockRes.flushHeaders).toHaveBeenCalled();
    expect((eventService as any).clients.get('session-1')?.size).toBe(1);
  });

  it('should broadcast events to connected clients', () => {
    const mockRes1 = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      on: vi.fn()
    };
    const mockRes2 = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      on: vi.fn()
    };
    
    eventService.subscribe('session-1', mockRes1 as any);
    eventService.subscribe('session-1', mockRes2 as any);
    
    const testEvent: ResearchEvent = {
      type: 'task.started',
      sessionId: 'session-1',
      message: 'Testing',
      timestamp: new Date().toISOString()
    };
    
    // simulate receiving it from Redis
    (eventService as any).localEmit(testEvent);
    
    const expectedPayload = `data: ${JSON.stringify(testEvent)}\n\n`;
    expect(mockRes1.write).toHaveBeenCalledWith(expectedPayload);
    expect(mockRes2.write).toHaveBeenCalledWith(expectedPayload);
  });

  it('should clean up on disconnect', () => {
    let closeCallback: any;
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      on: vi.fn().mockImplementation((event, cb) => {
        if (event === 'close') closeCallback = cb;
      })
    };
    
    eventService.subscribe('session-1', mockRes as any);
    expect((eventService as any).clients.get('session-1')?.size).toBe(1);
    
    // Simulate disconnect
    closeCallback();
    
    expect((eventService as any).clients.has('session-1')).toBe(false);
  });
});
