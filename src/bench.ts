// import 'https://esm.sh/@folkjs/labs@0.0.7/standalone/folk-sync-attribute';
import { ReactiveElement, css, property, type PropertyValues } from '@folkjs/dom/ReactiveElement';
import { cursor, sittingCursor, sittingCursorWithLegsForward, sittingCursorWithLegsBack } from './sprites';

interface CursorObject {
  acquireCursor(cursor: MouseCursor): void;
  releaseCursor(cursor: MouseCursor): void;
}

/* CONSTANTS */
const COLORS = ['#447F59', '#A10314', '#FB546E', '#8750C9', '#E601B2', '#2962C5'];
const CURSOR_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const UUID = crypto.randomUUID();

/* UTILITIES */
const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);

const inlineSVG = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const convertSVGIntoCssURL = (svg: string) => `url('${inlineSVG(svg)}')`;

/* GLOBAL STYLES */
const globalStyles = new CSSStyleSheet();

globalStyles.replaceSync(`
  body {
    cursor: ${convertSVGIntoCssURL(cursor(CURSOR_COLOR))}, auto;

    &:has(cursor-bench > mouse-cursor:state(self)) {
      cursor: ${convertSVGIntoCssURL(cursor(CURSOR_COLOR + '51'))}, auto;
      pointer-event: none;
    }
  }
`);

document.adoptedStyleSheets.push(globalStyles);

/* CUSTOM ELEMENTS */
export class MouseCursor extends ReactiveElement {
  static tagName = 'mouse-cursor';

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      user-select: none;
      z-index: calc(Infinity);
    }
  `;

  @property({ type: Number, reflect: true }) x = 0;

  @property({ type: Number, reflect: true }) y = 0;

  @property({ type: String, reflect: true }) color = 'black';

  @property({ type: String, reflect: true }) action = 'standing';

  // @property({ type: Number, reflect: true }) scale = 1;

  get self() {
    return UUID === this.id;
  }

  #internals = this.attachInternals();
  #img = document.createElement('img');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    if (this.self) {
      this.#internals.states.add('self');
    }

    root.appendChild(this.#img);

    return root;
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);

    if (changedProperties.has('x')) {
      this.style.left = this.x + 'px';
    }

    if (changedProperties.has('y')) {
      this.style.top = this.y + 'px';
    }

    const previousAction = changedProperties.get('action');
    if (previousAction) {
      this.#internals.states.delete(previousAction);
    }

    this.#internals.states.add(this.action);

    let bg;
    if (this.action === 'sitting') {
      bg = sittingCursor(this.color);
    } else if (this.action === 'sitting-forwards') {
      bg = sittingCursorWithLegsForward(this.color);
    } else if (this.action === 'sitting-backwards') {
      bg = sittingCursorWithLegsBack(this.color);
    } else {
      bg = cursor(this.color);
    }

    this.#img.src = inlineSVG(bg);
  }
}

export class CursorBench extends ReactiveElement implements CursorObject {
  static tagName = 'cursor-bench';

  static styles = css`
    :host {
      display: block;
      position: relative;
      background-size: contain;
      background-repeat: no-repeat;
      /* 183 x 90 */
      background-image: url('/bench.webp');
      aspect-ratio: 2.03;
      width: 60px;
      user-select: none;
    }

    ::slotted(mouse-cursor) {
      display: block;
      top: -2px !important;
    }
  `;

  #cursor: MouseCursor | null = null;
  #animation: Animation | null = null;

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(document.createElement('slot'));

    this.addEventListener('click', this.#onAcquireClick);

    return root;
  }

  acquireCursor(cursor: MouseCursor): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as CursorObject)?.releaseCursor(this.#cursor);
    this.#cursor.action = 'sitting';
    this.#cursor.x = 0;
    this.#cursor.y = 0;
    this.appendChild(this.#cursor);
    this.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });
    document.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('keyup', this.#onKeyup);
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
    this.#animation?.cancel();
    this.#animation = null;
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
      this.releaseCursor(this.#cursor);
      // give control back to the park
      this.#park?.acquireCursor(this.#cursor);
    }
  };

  #onAcquireClick = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const cursor = document.querySelector<MouseCursor>('mouse-cursor:state(self)');

    if (cursor) {
      this.acquireCursor(cursor);
      const rect = this.getBoundingClientRect();
      cursor.x = clamp(0, event.pageX - rect.x, this.offsetWidth) - cursor.offsetWidth / 2;
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (this.#cursor === null) return;

    if (event.code === 'ArrowLeft' && this.#cursor.x > 0) {
      event.preventDefault();
      this.#animateCursor(-2);
    } else if (event.code === 'ArrowRight' && this.#cursor.x + this.#cursor.offsetWidth <= this.offsetWidth) {
      event.preventDefault();
      this.#animateCursor(2);
    } else if (event.code === 'ArrowUp') {
      event.preventDefault();
      this.#cursor.action = 'sitting-forwards';
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      this.#cursor.action = 'sitting-backwards';
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (this.#cursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.#cursor.action = 'sitting';
    }
  };

  async #animateCursor(delta: number) {
    // If we're in the middle of an animation then ignore the request
    if (this.#cursor === null || this.#animation) return;

    const previousX = this.#cursor.x;
    const x = previousX + delta;
    const direction = Math.sign(delta);
    this.#animation = this.#cursor.animate(
      [
        { left: previousX + 'px', rotate: '0deg' },
        { left: previousX + 'px', rotate: direction * 7 + 'deg' },
        { left: x + 'px', rotate: direction * -5 + 'deg' },
        { left: x + 'px', rotate: '0deg' },
      ],
      {
        duration: 250,
        fill: 'forwards',
      },
    );

    await this.#animation.finished;

    this.#animation.commitStyles();
    this.#animation.cancel();
    this.#animation = null;
    this.#cursor.x = x;
  }
}

export class CursorPark extends ReactiveElement implements CursorObject {
  static tagName = 'cursor-park';

  static styles = css`
    :host {
      display: block;
    }

    ::slotted(mouse-cursor:state(self)) {
      display: none;
    }
  `;
  #isCursorClaimed = false;
  #mouseCursor!: MouseCursor;
  #cursorPosition = { x: 0, y: 0 };

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#mouseCursor = document.createElement('mouse-cursor');
    this.#mouseCursor.color = CURSOR_COLOR;
    this.#mouseCursor.id = UUID;

    root.appendChild(document.createElement('slot'));

    return root;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.acquireCursor(this.#mouseCursor);
    document.addEventListener('mousemove', this.#onMouseMove);
    window.addEventListener('beforeunload', this.#onBeforeUnload);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.releaseCursor(this.#mouseCursor);
    document.removeEventListener('mousemove', this.#onMouseMove);
    window.removeEventListener('beforeunload', this.#onBeforeUnload);
  }

  acquireCursor(_cursor: MouseCursor): void {
    this.#isCursorClaimed = true;
    this.#mouseCursor.action = 'standing';
    this.#mouseCursor.x = this.#cursorPosition.x;
    this.#mouseCursor.y = this.#cursorPosition.y;
    this.appendChild(this.#mouseCursor);
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#isCursorClaimed = false;
  }

  #onBeforeUnload = () => this.#mouseCursor.remove();

  // always track the cursor position
  // is the part doesn't have ownership then store it for future use.
  #onMouseMove = (event: MouseEvent) => {
    if (this.#isCursorClaimed) {
      this.#mouseCursor.x = event.pageX;
      this.#mouseCursor.y = event.pageY;
    } else {
      this.#cursorPosition.x = event.pageX;
      this.#cursorPosition.y = event.pageY;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'mouse-cursor': MouseCursor;
    'cursor-bench': CursorBench;
    'cursor-park': CursorPark;
  }
}

MouseCursor.define();
CursorBench.define();
CursorPark.define();
