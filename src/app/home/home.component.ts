import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // for routing
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EditorWebSocketService } from '../editor-websocket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
newComment: any;
sendComment() {
throw new Error('Method not implemented.');
}
  collaborators: string[] = [];
  documentId: string = '';
  editorContent: string = '';
  currentUser: string = 'Thug Hari';

  constructor(
    private wsService: EditorWebSocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get documentId from URL or generate a new one
    this.route.paramMap.subscribe(params => {
      const docId = params.get('id');
      if (docId) {
        this.documentId = docId;
      } else {
        // generate new ID if not present
        this.documentId = this.generateDocumentId();
        this.router.navigate(['/editor', this.documentId]);
      }

      this.wsService.connect(this.documentId, (incomingData: string) => {
        this.editorContent = incomingData;
      });
    });
  }

  generateDocumentId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  onContentChange(): void {
    this.wsService.sendEdit(this.documentId, this.editorContent);
  }

  ngOnDestroy(): void {
    this.wsService.close();
  }

  copyShareLink() {
    const shareUrl = `${window.location.origin}/editor/${this.documentId}`;
    navigator.clipboard.writeText(shareUrl).then(() =>
      alert('Link copied to clipboard!')
    );
  }
}
