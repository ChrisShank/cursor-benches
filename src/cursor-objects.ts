import { ReactiveElement, css, property } from '@folkjs/dom/ReactiveElement';
import type { MouseCursor } from './cursor';
import { clamp, inlineSVG } from './utils';
import { cursorBench } from './sprites';
import { findCssSelector } from '@folkjs/dom/css-selector';

export interface ICursorObject {
  acquireCursor(cursor: MouseCursor): void;
  releaseCursor(cursor: MouseCursor): void;
}

export class CursorObject extends ReactiveElement implements ICursorObject {
  get #park() {
    return this.closest('cursor-park');
  }

  updateCursor() {}

  acquireCursor(cursor: MouseCursor): void {}
  releaseCursor(cursor: MouseCursor): void {}
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
  #cursor: MouseCursor | null = null;

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(cursorBench());

    root.append(this.#img, document.createElement('slot'));

    this.addEventListener('click', this.#onAcquireClick);

    return root;
  }

  acquireCursor(cursor: MouseCursor, x = 0): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as CursorObject)?.releaseCursor(this.#cursor);
    // this.#cursor.action = 'sitting';
    // this.#cursor.x = 0;
    // this.#cursor.y = 0;
    this.appendChild(this.#cursor);
    this.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });
    document.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('keyup', this.#onKeyup);
    this.closest('cursor-park')?.updateSelfCursor({
      action: 'sitting',
      x,
      y: 0,
      parent: findCssSelector(this),
    });
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
    document.removeEventListener('click', this.#onReleaseClick, { capture: true });
    document.removeEventListener('keydown', this.#onKeydown);
    document.removeEventListener('keyup', this.#onKeyup);
    this.addEventListener('click', this.#onAcquireClick);
  }

  // while someone is sitting on a bench intercept all clicks until someone clicks on the bench.
  #onReleaseClick = (event: PointerEvent) => {
    if (this.#cursor === null) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.target === this) {
      const cursor = this.#cursor;
      this.releaseCursor(this.#cursor);
      // give control back to the park
      this.#park?.acquireCursor(cursor);
    }
  };

  #onAcquireClick = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const cursor = document.querySelector<MouseCursor>('mouse-cursor:state(self)');

    if (cursor) {
      const rect = this.getBoundingClientRect();
      const x = clamp(0, event.pageX - (rect.x + window.scrollX), this.offsetWidth) - cursor.offsetWidth / 2;
      this.acquireCursor(cursor, x);
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (this.#cursor === null) return;
    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      if (this.#cursor.x > 3) this.#animateCursor(-2);
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      if (this.#cursor.x + this.#cursor.offsetWidth <= this.offsetWidth) this.#animateCursor(2);
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
    if (this.#cursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting',
      });
    }
  };

  #animateCursor(delta: number) {
    if (this.#cursor === null) return;

    this.closest('cursor-park')?.updateSelfCursor({
      x: this.#cursor.x + delta,
    });
  }
}
