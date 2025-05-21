import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EditorWebSocketService, WebSocketMessage } from '../editor-websocket.service';

export interface Comment {
  user: string;
  comment: string;
  timestamp?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  newCommentText: string = '';
  comments: Comment[] = [];
  collaborators: string[] = [];
  documentId: string = '';
  editorContent: string = '';

  usernameInput: string = `User${Math.floor(Math.random() * 1000)}`;
  currentUser: string = '';
  isUsernameConfirmed: boolean = false;
  isWebSocketConnected: boolean = false;

  showCommentsDrawer = false;
  isMobile: boolean = false;
isMobileChatOpen: boolean = false;

  toggleMobileChat() {
  this.isMobileChatOpen = !this.isMobileChatOpen;
}


  constructor(
    private wsService: EditorWebSocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const docIdFromUrl = params.get('id');
      if (docIdFromUrl) {
        this.documentId = docIdFromUrl;
      } else {
        const newDocId = this.generateDocumentId();
        this.router.navigate(['/editor', newDocId], { replaceUrl: true });
        return;
      }
    });
    this.isMobile = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) this.isMobileChatOpen = false;
  });
  }

  confirmUsernameAndConnect(): void {
    if (!this.usernameInput.trim()) {
      alert("Please enter a username.");
      return;
    }
    if (!this.documentId) {
      alert("Document ID is not yet available. Please wait a moment or refresh.");
      return;
    }

    this.currentUser = this.usernameInput.trim();
    this.isUsernameConfirmed = true;
    this.connectToWebSocket();
  }

  editUsername(): void {
    this.isUsernameConfirmed = false;
    this.isWebSocketConnected = false;
    if (this.wsService) {
      this.wsService.close();
    }
    this.editorContent = '';
    this.comments = [];
    this.collaborators = [];
  }

  private connectToWebSocket(): void {
    if (!this.currentUser || !this.documentId) return;

    this.wsService.connect(this.documentId, this.currentUser, (message: WebSocketMessage) => {
      this.handleWebSocketMessage(message);
    });

    this.isWebSocketConnected = true; 
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    console.log('Received WS Message:', message);
    if (!this.isUsernameConfirmed) {
      console.warn("Received message while username is not confirmed. Ignoring.", message);
      return;
    }

    const data = message.payload;

    switch (message.type) {
      case 'initial_data':
        this.editorContent = data.content || "";
        this.collaborators = data.collaborators || [];
        this.comments = (data.comments || []).sort((a: Comment, b: Comment) => (a.timestamp || 0) - (b.timestamp || 0));
        this.isWebSocketConnected = true;
        break;
      case 'content_update':
        if (data.editor !== this.currentUser) {
            this.editorContent = data.content;
        }
        break;
      case 'collaborators_update':
        this.collaborators = data.collaborators;
        break;
      case 'new_comment':
        this.comments.push(data.comment as Comment);
        this.comments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        break;
      case 'error':
        console.error('Server error:', data.message);
        alert(`Server error: ${data.message}`);
        break;
      default:
        console.warn('Unhandled WebSocket message type:', message.type);
    }
  }

  generateDocumentId(): string {
    return Math.random().toString(36).substring(2, 12);
  }

  onContentChange(): void {
    if (!this.isWebSocketConnected || !this.isUsernameConfirmed) return;
    this.wsService.sendPayload({
      type: 'edit',
      payload: {
        content: this.editorContent,
        documentId: this.documentId,
      },
    });
  }

  sendComment(): void {
    if (!this.newCommentText.trim() || !this.isWebSocketConnected || !this.isUsernameConfirmed) return;
    const commentData: Comment = {
      user: this.currentUser,
      comment: this.newCommentText.trim(),
    };
    this.wsService.sendPayload({
      type: 'comment',
      payload: {
        comment: commentData,
        documentId: this.documentId,
      },
    });
    this.newCommentText = '';
  }

  ngOnDestroy(): void {
    if (this.wsService) {
      this.wsService.close();
    }
  }

  copyShareLink(): void {
    if (!this.isUsernameConfirmed) return;
    const shareUrl = `${window.location.origin}/editor/${this.documentId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Failed to copy link: ', err));
  }

  formatTimestamp(timestamp: number | undefined): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}