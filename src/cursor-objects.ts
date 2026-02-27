import { ReactiveElement, css, property, unsafeCSS } from '@folkjs/dom/ReactiveElement';
import type { MouseCursor } from './cursor';
import { clamp, convertSVGIntoCssURL, inlineSVG } from './utils';
import { cursorBench, cursorPath, cursorTree, grass, movieScreen } from './sprites';
import { findCssSelector } from '@folkjs/dom/css-selector';
import type { CursorItem } from './park';
import type CustomVideoElement from 'youtube-video-element';

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

export class MovieScreen extends ReactiveElement {
  static tagName = 'movie-screen';

  static styles = css`
    :host {
      display: block;
      position: relative;
      aspect-ratio: 1.3;
      width: 300px;
      user-select: none;
    }

    img {
      height: 100%;
      width: 100%;
    }

    youtube-video {
      display: block;
      position: absolute;
      top: 48px;
      left: 30px;
      width: 200px;
      transform: rotateY(33deg) rotateZ(-1deg) rotateX(-7deg);
      aspect-ratio: 1.78;
      border: unset;
      pointer-events: none;
      min-width: unset;
      min-height: unset;
      border-radius: 3px;
      overflow: hidden;
    }

    youtube-video::after {
      content: '';
      display: block;
      position: absolute;
      inset: 0;
      box-shadow: 0px 0px 50px 12px rgba(196, 196, 196, 0.75) inset;
    }
  `;

  #img = document.createElement('img');
  #player = document.createElement('youtube-video') as CustomVideoElement;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#player.volume = 0;
    this.#player.controls = false;
    this.#player.src = 'https://www.youtube.com/watch?v=WeyLEe1T0yo';
    this.#player.addEventListener('ended', this.#onFinish);
    setTimeout(() => {
      this.#player.play();
    }, 5000);

    this.#img.src = inlineSVG(movieScreen());

    root.append(this.#img, this.#player);

    return root;
  }

  #onFinish = () => {
    this.#player.style.display = 'none';
  };

  get volume() {
    return this.#player.volume;
  }
  set volume(value: number) {
    this.#player.volume = value;
  }
}

export class CursorGrass extends ReactiveElement {
  static tagName = 'cursor-grass';

  static styles = css`
    :host {
      display: block;
      width: 10px;
      aspect-ratio: 1.5;
      user-select: none;
    }

    img {
      height: 100%;
      width: 100%;
    }
  `;

  #img = document.createElement('img');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(grass());

    root.appendChild(this.#img);

    return root;
  }
}

export class CursorPath extends ReactiveElement {
  static tagName = 'cursor-path';

  static styles = css`
    :host {
      display: block;
      pointer-events: none;
      aspect-ratio: 1.5;
      background-image: ${unsafeCSS(convertSVGIntoCssURL(cursorPath()))};
      background-size: contain;
      background-repeat: no-repeat;
    }
  `;
}

export class CursorTree extends ReactiveElement {
  static tagName = 'cursor-tree';

  static styles = css`
    :host {
      display: block;
      user-select: none;
      width: 150px;
      aspect-ratio: 0.68;
      background-image: ${unsafeCSS(convertSVGIntoCssURL(cursorTree()))};
      background-size: contain;
      background-repeat: no-repeat;
    }
  `;
}
