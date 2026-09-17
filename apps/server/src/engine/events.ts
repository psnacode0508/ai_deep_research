import { Response } from "express";
import { ResearchEvent, ResearchEventType } from "@deepresearch/shared";
import Redis from "ioredis";
import { config } from "../config/env";

const pubClient = new Redis(config.redis.url, { maxRetriesPerRequest: null });
const subClient = new Redis(config.redis.url, { maxRetriesPerRequest: null });

class EventService {
  private clients: Map<string, Set<Response>> = new Map();

  constructor() {
    subClient.subscribe("research-events");
    subClient.on("message", (channel, message) => {
      if (channel === "research-events") {
        try {
          const event = JSON.parse(message);
          this.localEmit(event);
        } catch (e) {
          console.error("[EventService] Failed to parse event from Redis", e);
        }
      }
    });
  }

  /**
   * Subscribes a client to a specific research session's event stream.
   */
  subscribe(sessionId: string, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Establish connection immediately

    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }
    
    const sessionClients = this.clients.get(sessionId)!;
    sessionClients.add(res);

    // Send a heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(":\n\n");
    }, 30000);

    // Cleanup on disconnect
    res.on("close", () => {
      clearInterval(heartbeat);
      sessionClients.delete(res);
      if (sessionClients.size === 0) {
        this.clients.delete(sessionId);
      }
    });
  }

  /**
   * Broadcasts an event to all connected clients for a session.
   * This sends it to Redis so it reaches all processes.
   */
  emit(event: ResearchEvent) {
    pubClient.publish("research-events", JSON.stringify(event));
  }

  /**
   * Handles an event received from Redis, sending to local connected clients.
   */
  private localEmit(event: ResearchEvent) {
    const sessionClients = this.clients.get(event.sessionId);
    if (!sessionClients || sessionClients.size === 0) return;

    const dataString = `data: ${JSON.stringify(event)}\n\n`;
    sessionClients.forEach(client => {
      client.write(dataString);
    });
  }
}

export const eventService = new EventService();
