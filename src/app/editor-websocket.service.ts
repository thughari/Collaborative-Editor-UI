import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EditorWebSocketService {
  private ws!: WebSocket;

  connect(documentId: string, onMessage: (data: string) => void): void {
  this.ws = new WebSocket(`ws://localhost:8080/ws/editor/${documentId}`);

  this.ws.onopen = () => {
    console.log('[WebSocket] Connected');
  };

  this.ws.onmessage = (message) => {
    onMessage(message.data);
  };

  this.ws.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
  };

  this.ws.onclose = () => {
    console.warn('[WebSocket] Disconnected');
  };
}

sendEdit(documentId: string, content: string): void {
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify({ documentId, content }));
  }
}


  close(): void {
    if (this.ws) this.ws.close();
  }
}
