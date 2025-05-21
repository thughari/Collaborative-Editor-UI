import { Injectable } from '@angular/core';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

@Injectable({
  providedIn: 'root',
})
export class EditorWebSocketService {
  private ws!: WebSocket;
  private documentId!: string; 

  connect(
    docId: string,
    username: string,
    onMessageCallback: (message: WebSocketMessage) => void
  ): void {
    this.documentId = docId; // Store for later use
    this.ws = new WebSocket(`wss://collabeditor-bsua.onrender.com/ws/editor/${docId}`); //use ws://localhost:8080/ws/editor/${docId} for local testing

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.sendPayload({
        type: 'join',
        payload: {
          username: username,
          documentId: this.documentId, 
        },
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data as string) as WebSocketMessage;
        onMessageCallback(messageData);
      } catch (error) {
        console.error('[WebSocket] Error parsing message data:', error, event.data);
         
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

  sendPayload(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      
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