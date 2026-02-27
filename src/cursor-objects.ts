import { ReactiveElement, css, property } from '@folkjs/dom/ReactiveElement';
import type { MouseCursor } from './cursor';
import { clamp, inlineSVG } from './utils';
import { cursorBench } from './sprites';
import { findCssSelector } from '@folkjs/dom/css-selector';
import type { CursorItem } from './park';

export interface Point {
  x: number;
  y: number;
}

export interface ICursorObject {
  acquireCursor(cursor: MouseCursor, point?: Point): void;
  releaseCursor(cursor: MouseCursor): void;
}

export class CursorObject extends ReactiveElement implements ICursorObject {
  #park = this.closest('cursor-park');

  #cursor: MouseCursor | null = null;

  get cursor() {
    return this.#cursor;
  }

  constructor() {
    super();

    this.addEventListener('click', this.#onAcquireClick);
  }

  updateCursor(data: Partial<CursorItem>) {
    this.#park?.updateSelfCursor(data);
  }

  acquireCursor(cursor: MouseCursor, _point: Point): void {
    (this.#cursor?.parentElement as unknown as CursorObject)?.releaseCursor();
    this.appendChild(cursor);
    this.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });
  }

  releaseCursor(): void {
    console.log();
    this.#cursor = null;
    document.removeEventListener('click', this.#onReleaseClick, { capture: true });
    this.addEventListener('click', this.#onAcquireClick);
  }

  #onAcquireClick = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.#cursor = document.querySelector<MouseCursor>('mouse-cursor:state(self)');

    if (this.#cursor) {
      // compute point of click relative to the objects bounding box (which has to account for scroll)
      const rect = this.getBoundingClientRect();
      const x = event.pageX - (rect.x + window.scrollX);
      const y = event.pageY - (rect.y + window.scrollY);
      this.acquireCursor(this.#cursor, { x, y });
    }
  };

  #onReleaseClick = (event: PointerEvent) => {
    if (this.#cursor === null) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.target === this) {
      const cursor = this.#cursor;
      this.releaseCursor();
      // give control back to the park
      this.#park?.acquireCursor(cursor);
    }
  };
}

export class CursorBench extends CursorObject {
  static tagName = 'cursor-bench';

  static styles = css`
    :host {
      display: block;
      position: relative;
      aspect-ratio: 2.04;
      width: 85px;
      user-select: none;
    }

    img {
      width: 100%;
      height: 100%;
    }

    ::slotted(mouse-cursor) {
      top: 50% !important;
      translate: 0 -72%;
    }
  `;

  #img = document.createElement('img');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(cursorBench());

    root.append(this.#img, document.createElement('slot'));

    return root;
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    document.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('keyup', this.#onKeyup);
    this.closest('cursor-park')?.updateSelfCursor({
      action: 'sitting',
      // Shift the cursor over by 1/3 because the sprite is slightly bigger than it's outline.
      x: clamp(0, point.x, this.offsetWidth) - cursor.offsetWidth / 3,
      y: 0,
      parent: findCssSelector(this),
    });
  }

  releaseCursor(): void {
    super.releaseCursor();

    document.removeEventListener('keydown', this.#onKeydown);
    document.removeEventListener('keyup', this.#onKeyup);
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (this.cursor === null) return;

    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      if (this.cursor.x > 3) this.#animateCursor(-2);
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      if (this.cursor.x + this.cursor.offsetWidth <= this.offsetWidth) this.#animateCursor(2);
    } else if (event.code === 'ArrowUp') {
      event.preventDefault();
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting-forwards',
      });
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting-backwards',
      });
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (this.cursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting',
      });
    }
  };

  #animateCursor(delta: number) {
    if (this.cursor === null) return;

    this.closest('cursor-park')?.updateSelfCursor({
      x: this.cursor.x + delta,
    });
  }
}
