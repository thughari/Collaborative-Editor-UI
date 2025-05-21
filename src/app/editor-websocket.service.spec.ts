import { TestBed } from '@angular/core/testing';

import { EditorWebsocketService } from './editor-websocket.service';

describe('EditorWebsocketService', () => {
  let service: EditorWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
