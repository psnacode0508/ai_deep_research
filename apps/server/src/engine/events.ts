import { Response } from "express";
import { ResearchEvent, ResearchEventType } from "@deepresearch/shared";

class EventService {
  private clients: Map<string, Set<Response>> = new Map();

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
   */
  emit(event: ResearchEvent) {
    const sessionClients = this.clients.get(event.sessionId);
    if (!sessionClients || sessionClients.size === 0) return;

    const dataString = `data: ${JSON.stringify(event)}\n\n`;
    sessionClients.forEach(client => {
      client.write(dataString);
    });
  }
}

export const eventService = new EventService();
