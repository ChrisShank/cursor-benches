// import 'https://esm.sh/@folkjs/labs@0.0.7/standalone/folk-sync-attribute';
import { ReactiveElement, css, property, unsafeCSS, type PropertyValues } from '@folkjs/dom/ReactiveElement';
import { findCssSelector } from '@folkjs/dom/css-selector';
import { parkSign, parkInfographic, cursorMat, cursorRocks } from './sprites';
import 'youtube-video-element';
import { convertSVGIntoCssURL, CURSOR_COLOR, CURSOR_SCALE, inlineSVG } from './utils';
import { pointingCursor, MouseCursor } from './cursor';
import { CursorPark } from './park';
import { CursorBench, CursorGrass, CursorMat, CursorPath, CursorTree, MovieScreen, type ICursorObject, type Point } from './cursor-objects';

/* GLOBAL STYLES */
const globalStyles = new CSSStyleSheet();

globalStyles.replaceSync(`
  body {
    cursor: ${convertSVGIntoCssURL(pointingCursor(CURSOR_COLOR, CURSOR_SCALE))}, auto;

    &:not(:has(cursor-park > mouse-cursor:state(self))) {
      cursor: ${convertSVGIntoCssURL(pointingCursor(CURSOR_COLOR + '51', CURSOR_SCALE))}, auto;
    }
  }
`);

document.adoptedStyleSheets.push(globalStyles);

export class CursorRock extends ReactiveElement implements ICursorObject {
  static tagName = 'cursor-rock';

  static styles = css`
    :host {
      display: block;
      position: relative;
      user-select: none;
    }

    img {
      display: block;
      width: 100px;
    }

    /* place on tip of cursor */
    ::slotted(mouse-cursor) {
      translate: -25% -25%;
    }
  `;

  @property({ type: String, reflect: true }) type = '';

  #cursor: MouseCursor | null = null;
  #rocks = document.createElement('img');

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#rocks.src = inlineSVG(cursorRocks());

    root.append(this.#rocks, document.createElement('slot'));

    this.#rocks.addEventListener('click', this.#onAcquireClick);

    return root;
  }

  acquireCursor(cursor: MouseCursor, { x }: Point = { x: 0, y: 0 }): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as ICursorObject)?.releaseCursor(this.#cursor);
    this.appendChild(this.#cursor);

    this.#rocks.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });

    const rect = this.#rocks.getBoundingClientRect();
    this.closest('cursor-park')?.updateSelfCursor({
      action: 'crouching',
      x: x - (rect.x + window.scrollX),
      y: 0,
      parent: findCssSelector(this),
    });
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
    document.removeEventListener('click', this.#onReleaseClick, { capture: true });
    this.#rocks.addEventListener('click', this.#onAcquireClick);
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
      this.acquireCursor(cursor, { x: event.pageX, y: event.pageY });
    }
  };
}

export class CursorSign extends ReactiveElement implements ICursorObject {
  static tagName = 'cursor-sign';

  static styles = css`
    :host {
      display: block;
      position: relative;
      /* 26 x 53 */
      aspect-ratio: 0.49;
      height: 140px;
      user-select: none;
    }

    click-zone {
      display: block;
      position: absolute;
      height: 30%;
      width: 75%;
      bottom: 10%;
      right: 90%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    :host(:hover) click-zone,
    click-zone:hover {
      opacity: 1;
    }

    img {
      height: 100%;
      width: 100%;
    }

    div {
      text-align: center;
      opacity: 0;
      position: absolute;
      inset: -10% -250% -10% 110%;
      background: #deeade;
      padding: 0 0.5rem;
      border-radius: 4px;
      transition: opacity 200ms ease-out;
      box-sizing: border-box;
      overflow: scroll;
      box-shadow: 3px 4px 8px 0px rgba(0, 0, 0, 0.5);
      z-index: 2;
    }
  `;
  #cursor: MouseCursor | null = null;
  #img = document.createElement('img');
  #message = document.createElement('div');
  #clickZone = document.createElement('click-zone');

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(parkSign());
    this.#clickZone.addEventListener('click', this.#onAcquireClick);

    const slot = document.createElement('slot');
    slot.name = 'message';
    this.#message.appendChild(slot);

    root.append(document.createElement('slot'), this.#clickZone, this.#img, this.#message);

    return root;
  }

  acquireCursor(cursor: MouseCursor, { x, y }: Point = { x: 0, y: 0 }): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as ICursorObject)?.releaseCursor(this.#cursor);
    this.appendChild(this.#cursor);

    this.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });

    const rect = this.getBoundingClientRect();

    this.closest('cursor-park')?.updateSelfCursor({
      action: 'looking-up',
      x: x - (rect.x + window.scrollX),
      y: y - (rect.y + window.scrollY),
      parent: findCssSelector(this),
    });

    this.#message.style.opacity = '0.9';
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
    this.#message.style.opacity = '0';
    document.removeEventListener('click', this.#onReleaseClick, { capture: true });
    this.#clickZone.addEventListener('click', this.#onAcquireClick);
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
      this.acquireCursor(cursor, { x: event.pageX, y: event.pageY });
    }
  };
}

export class CursorInfographic extends ReactiveElement implements ICursorObject {
  static tagName = 'cursor-infographic';

  static styles = css`
    :host {
      display: block;
      position: relative;
      /* 10 x 12 */
      aspect-ratio: 0.83;
      height: 50px;
      user-select: none;
    }

    click-zone {
      display: block;
      position: absolute;
      height: 50%;
      width: 120%;
      top: -20%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    :host(:hover) click-zone,
    click-zone:hover {
      opacity: 1;
    }

    img {
      height: 100%;
      width: 100%;
    }

    ::slotted(mouse-cursor) {
      translate: -50% 0%;
    }

    div {
      text-align: center;
      opacity: 0;
      position: absolute;
      inset: -100% -500% -100% 110%;
      background: #deeade;
      padding: 0 0.5rem;
      border-radius: 4px;
      transition: opacity 200ms ease-out;
      box-sizing: border-box;
      overflow: scroll;
      z-index: 2;
      box-shadow: 3px 4px 8px 0px rgba(0, 0, 0, 0.5);
    }
  `;

  #cursor: MouseCursor | null = null;
  #img = document.createElement('img');
  #message = document.createElement('div');
  #clickZone = document.createElement('click-zone');

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    const slot = document.createElement('slot');
    slot.name = 'message';
    this.#message.appendChild(slot);
    this.#img.src = inlineSVG(parkInfographic());
    this.#clickZone.addEventListener('click', this.#onAcquireClick);

    root.append(document.createElement('slot'), this.#clickZone, this.#img, this.#message);

    return root;
  }

  acquireCursor(cursor: MouseCursor, { x, y }: Point = { x: 0, y: 0 }): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as ICursorObject)?.releaseCursor(this.#cursor);
    this.appendChild(this.#cursor);

    this.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });

    const rect = this.getBoundingClientRect();

    this.closest('cursor-park')?.updateSelfCursor({
      action: 'looking-down',
      x: x - (rect.x + window.scrollX),
      y: y - (rect.y + window.scrollY),
      parent: findCssSelector(this),
    });
    this.#message.style.opacity = '0.9';
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
    this.#message.style.opacity = '0';
    document.removeEventListener('click', this.#onReleaseClick, { capture: true });
    this.#clickZone.addEventListener('click', this.#onAcquireClick);
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
      this.acquireCursor(cursor, { x: event.pageX, y: event.pageY });
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'mouse-cursor': MouseCursor;
    'cursor-bench': CursorBench;
    'cursor-mat': CursorMat;
    'cursor-park': CursorPark;
    'cursor-sign': CursorSign;
    'cursor-infographic': CursorInfographic;
    'movie-screen': MovieScreen;
    'cursor-grass': CursorGrass;
    'cursor-path': CursorPath;
    'cursor-tree': CursorTree;
    'cursor-rock': CursorRock;
  }
}

MouseCursor.define();
CursorBench.define();
CursorMat.define();
CursorPark.define();
CursorSign.define();
CursorInfographic.define();
MovieScreen.define();
CursorGrass.define();
CursorPath.define();
CursorTree.define();
CursorRock.define();
