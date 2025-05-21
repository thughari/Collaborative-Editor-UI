import { Injectable } from '@angular/core';

// Define a more structured message format
export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

@Injectable({
  providedIn: 'root',
})
export class EditorWebSocketService {
  private ws!: WebSocket;
  private documentId!: string; // Store documentId for sending messages

  connect(
    docId: string,
    username: string, // Add username parameter
    onMessageCallback: (message: WebSocketMessage) => void
  ): void {
    this.documentId = docId; // Store for later use
    this.ws = new WebSocket(`ws://localhost:8080/ws/editor/${docId}`);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      // Send a join message with username
      this.sendPayload({
        type: 'join',
        payload: {
          username: username,
          documentId: this.documentId, // Include documentId in join payload
        },
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data as string) as WebSocketMessage;
        onMessageCallback(messageData);
      } catch (error) {
        console.error('[WebSocket] Error parsing message data:', error, event.data);
         // Fallback for plain text content update for initial load if server sends it raw
        if (typeof event.data === 'string' && !event.data.startsWith('{')) {
            onMessageCallback({ type: 'initial_content', payload: { content: event.data } });
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    this.ws.onclose = (event) => {
      console.warn(`[WebSocket] Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendPayload(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Ensure documentId is always in the payload if not part of the message's payload already
      if (message.payload && typeof message.payload === 'object' && !message.payload.documentId) {
        message.payload.documentId = this.documentId;
      }
      this.ws.send(JSON.stringify(message));
      console.log('[WebSocket] Sent:', message);
    } else {
      console.warn('[WebSocket] Connection not open. Message not sent:', message);
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}