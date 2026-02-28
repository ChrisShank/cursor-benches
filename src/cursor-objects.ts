import { ReactiveElement, css, property, unsafeCSS, type PropertyValues } from '@folkjs/dom/ReactiveElement';
import type { MouseCursor } from './cursor';
import { clamp, convertSVGIntoCssURL, inlineSVG } from './utils';
import {
  cursorBench,
  cursorMat,
  cursorPath,
  cursorRocks,
  cursorTree,
  grass,
  cursorMailbox,
  movieScreen,
  parkInfographic,
  parkSign,
  library,
} from './sprites';
import { findCssSelector } from '@folkjs/dom/css-selector';
import type { CursorItem } from './park';
import 'youtube-video-element';
import type CustomVideoElement from 'youtube-video-element';

export interface Point {
  x: number;
  y: number;
}

export interface ICursorObject {
  acquireCursor(cursor: MouseCursor, point: Point): void;
  releaseCursor(): void;
}

export class CursorObject extends ReactiveElement implements ICursorObject {
  #cursor: MouseCursor | null = null;
  #park = this.closest('cursor-park');

  get cursor() {
    return this.#cursor;
  }

  get park() {
    return this.#park;
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
  }

  releaseCursor(): void {
    this.#cursor = null;
  }

  #onAcquireClick = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (this.#cursor) {
      const cursor = this.#cursor;
      // give control back to the park
      this.#park?.acquireCursor(cursor);
    } else {
      this.#cursor = document.querySelector<MouseCursor>('mouse-cursor:state(self)');

      if (this.#cursor) {
        // compute point of click relative to the objects bounding box (which has to account for scroll)
        const rect = this.getBoundingClientRect();
        const x = event.pageX - (rect.x + window.scrollX);
        const y = event.pageY - (rect.y + window.scrollY);
        this.acquireCursor(this.#cursor, { x, y });
      }
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

    this.updateCursor({
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
      this.updateCursor({
        action: 'sitting-forwards',
      });
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      this.updateCursor({
        action: 'sitting-backwards',
      });
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (this.cursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.updateCursor({
        action: 'sitting',
      });
    }
  };

  #animateCursor(delta: number) {
    if (this.cursor === null) return;

    this.updateCursor({
      x: this.cursor.x + delta,
    });
  }
}

export class CursorMat extends CursorObject {
  static tagName = 'cursor-mat';

  static styles = css`
    :host {
      display: block;
      position: relative;
      user-select: none;
    }

    img {
      display: block;
      width: 80px;
    }

    /* place on tip of cursor */
    ::slotted(mouse-cursor) {
      translate: -25% -65%;
      transform: rotateY(26deg) rotateX(-3deg) rotateZ(-8deg);
    }
  `;

  @property({ type: String, reflect: true }) type = '';

  #mat = document.createElement('img');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.append(this.#mat, document.createElement('slot'));

    return root;
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);

    if (changedProperties.has('type')) {
      this.#mat.src = inlineSVG(cursorMat(this.type));
    }
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    this.updateCursor({
      action: 'crouching',
      x: point.x,
      y: point.y,
      parent: findCssSelector(this),
    });

    if (this.hasAttribute('movie')) {
      const movie = document.querySelector('movie-screen');
      if (movie) movie.volume = 0.15;
    }
  }

  releaseCursor(): void {
    super.releaseCursor();

    if (this.hasAttribute('movie')) {
      const movie = document.querySelector('movie-screen');
      if (movie) movie.volume = 0;
    }
  }
}

export class CursorRock extends CursorObject {
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

  #rocks = document.createElement('img');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#rocks.src = inlineSVG(cursorRocks());

    root.append(this.#rocks, document.createElement('slot'));

    return root;
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    this.updateCursor({
      action: 'crouching',
      x: point.x,
      y: point.y,
      parent: findCssSelector(this),
    });
  }
}

export class CursorSign extends CursorObject {
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
      height: 100%;
      width: 100%;
      bottom: -30%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
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
      z-index: calc(Infinity);
      pointer-events: none;
    }
  `;
  #img = document.createElement('img');
  #message = document.createElement('div');
  #clickZone = document.createElement('click-zone');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(parkSign());

    const slot = document.createElement('slot');
    slot.name = 'message';
    this.#message.appendChild(slot);

    root.append(document.createElement('slot'), this.#clickZone, this.#img, this.#message);

    return root;
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    this.updateCursor({
      action: 'looking-up',
      x: point.x,
      y: point.y,
      parent: findCssSelector(this),
    });

    this.#message.style.opacity = '0.9';
  }

  releaseCursor(): void {
    super.releaseCursor();

    this.#message.style.opacity = '0';
  }
}

export class CursorInfographic extends CursorObject {
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
      height: 100%;
      width: 150%;
      top: -25%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    img {
      height: 100%;
      width: 100%;
    }

    ::slotted(mouse-cursor) {
      translate: -50% 0%;
    }

    div {
      pointer-events: none;
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
      z-index: calc(Infinity);
    }
  `;

  #img = document.createElement('img');
  #message = document.createElement('div');
  #clickZone = document.createElement('click-zone');
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    const slot = document.createElement('slot');
    slot.name = 'message';
    this.#message.appendChild(slot);
    this.#img.src = inlineSVG(parkInfographic());

    root.append(document.createElement('slot'), this.#clickZone, this.#img, this.#message);

    return root;
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    this.updateCursor({
      action: 'looking-down',
      x: point.x,
      y: point.y,
      parent: findCssSelector(this),
    });

    this.#message.style.opacity = '0.9';
    this.#message.style.pointerEvents = 'all';
  }

  releaseCursor(): void {
    super.releaseCursor();
    this.#message.style.opacity = '0';
    this.#message.style.pointerEvents = '';
  }
}

export class CursorLibrary extends CursorObject {
  static tagName = 'cursor-library';

  static styles = css`
    :host {
      display: block;
      position: relative;
      /* 20 x 38 */
      aspect-ratio: 0.53;
      height: 80px;
      user-select: none;
    }

    click-zone {
      display: block;
      position: absolute;
      height: 100%;
      width: 150%;
      top: -25%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    img {
      height: 100%;
      width: 100%;
    }

    ::slotted(mouse-cursor) {
      translate: -50% 0%;
    }

    div {
      pointer-events: none;
      text-align: center;
      opacity: 0;
      position: absolute;
      top: -85%;
      bottom: -85%;
      left: 110%;
      background: #deeade;
      padding: 0 0.5rem;
      border-radius: 4px;
      transition: opacity 200ms ease-out;
      box-sizing: border-box;
      overflow: scroll;
      z-index: 2;
      box-shadow: 3px 4px 8px 0px rgba(0, 0, 0, 0.5);
      z-index: calc(Infinity);
      padding: 12px 48px 4px 12px;
    }

    div ::slotted(ul) {
      display: flex !important;
      gap: 2px;
      list-style-type: none;
      padding: 0;
      margin: 0;
      align-items: flex-end;
      height: 100%;
    }
  `;

  #img = document.createElement('img');
  #books = document.createElement('div');
  #clickZone = document.createElement('click-zone');
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    const slot = document.createElement('slot');
    slot.name = 'books';
    this.#books.appendChild(slot);
    this.#books.addEventListener('click', (e) => e.stopPropagation());

    this.#img.src = inlineSVG(library());

    root.append(document.createElement('slot'), this.#clickZone, this.#img, this.#books);

    return root;
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    this.updateCursor({
      action: 'looking-down',
      x: point.x,
      y: point.y,
      parent: findCssSelector(this),
    });

    this.#books.style.opacity = '0.9';
    this.#books.style.pointerEvents = 'all';
  }

  releaseCursor(): void {
    super.releaseCursor();
    this.#books.style.opacity = '0';
    this.#books.style.pointerEvents = '';
  }
}

export class CursorMailbox extends CursorObject {
  static tagName = 'cursor-mailbox';

  static styles = css`
    :host {
      display: block;
      position: relative;
      /* 103 x 164 */
      aspect-ratio: 0.63;
      height: 60px;
      user-select: none;
    }

    click-zone {
      display: block;
      position: absolute;
      height: 100%;
      width: 150%;
      top: -25%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    img {
      height: 100%;
      width: 100%;
    }

    ::slotted(mouse-cursor) {
      translate: -50% 0%;
    }

    form {
      pointer-events: none;
      text-align: center;
      opacity: 0;
      position: absolute;
      bottom: 125%;
      left: -100px;
      width: 200px;
      aspect-ratio: 6/4;
      background: #deeade;
      padding: 0 0.5rem;
      border-radius: 4px;
      transition: opacity 200ms ease-out;
      box-sizing: border-box;
      overflow: scroll;
      z-index: 2;
      box-shadow: 3px 4px 8px 0px rgba(0, 0, 0, 0.5);
      z-index: calc(Infinity);
      display: flex;
      flex-direction: column;
      padding: 0;
      gap: 0.25rem;

      label {
        text-align: center;
      }

      textarea {
        flex-grow: 1;
        resize: none;
        background: transparent;
        border: unset;
      }

      button {
        align-self: flex-end;
      }
    }
  `;

  #img = document.createElement('img');
  #form = document.createElement('form');
  #clickZone = document.createElement('click-zone');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#form.action = 'https://docs.google.com/forms/u/0/d/169qksxua_-nPsYOyKmZ6xQh0Gv1wmHopEnxF71K0e-g/formResponse';
    this.#form.addEventListener('click', (e) => e.stopPropagation());
    this.#form.addEventListener('submit', this.#onSubmit);
    this.#form.setHTMLUnsafe(`
      <label for="message">Write a postcard!</label>
      <textarea id="message" name="entry.379819885"></textarea>
      <button>Send Mail</button>
    `);

    this.#img.src = inlineSVG(cursorMailbox());

    root.append(document.createElement('slot'), this.#clickZone, this.#img, this.#form);

    return root;
  }

  acquireCursor(cursor: MouseCursor, point: Point): void {
    super.acquireCursor(cursor, point);

    this.updateCursor({
      action: 'standing',
      x: point.x,
      y: point.y,
      parent: findCssSelector(this),
    });

    this.#form.style.opacity = '1';
    this.#form.style.pointerEvents = 'all';
  }

  releaseCursor(): void {
    super.releaseCursor();
    this.#form.style.opacity = '0';
    this.#form.style.pointerEvents = '';
  }

  #onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      const url = new URL(this.#form.action);
      url.search = new URLSearchParams(new FormData(this.#form) as any).toString();

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } finally {
      this.#form.reset();
      this.park?.acquireCursor(this.cursor!);
    }
  };
}

/* INERT OBJECTS */
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
      background-image: ${unsafeCSS(convertSVGIntoCssURL(grass()))};
      background-size: contain;
      background-repeat: no-repeat;
    }
  `;
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
