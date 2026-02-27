import { ReactiveElement } from '@folkjs/dom/ReactiveElement';
import type { MouseCursor } from './cursor';

export class CursorObject extends ReactiveElement {
  acquireCursor(cursor: MouseCursor): void {}
  releaseCursor(cursor: MouseCursor): void {}
}
