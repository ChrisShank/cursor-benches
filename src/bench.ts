// import 'https://esm.sh/@folkjs/labs@0.0.7/standalone/folk-sync-attribute';
import { ReactiveElement, css, property, type PropertyValues } from '@folkjs/dom/ReactiveElement';
import { cursor, sittingCursor, sittingCursorWithLegsForward, sittingCursorWithLegsBack } from './sprites';

interface CursorObject {
  claimCursor(cursor: MouseCursor): void;
  revokeCursor(cursor: MouseCursor): void;
}

/* CONSTANTS */
const CURSOR_SCALE = 1.5;
const CURSOR_COLOR = '#4f9c15';
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

    &:has(cursor-bench:state(sitting)) {
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
      z-index: calc(Infinity);
    }

    :host(:state(self)) {
      display: none;
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

    console.log(this.self);

    if (this.self) {
      this.#internals.states.add('self');
    }

    root.appendChild(this.#img);

    return root;
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('beforeunload', this.#onBeforeUnload);
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
      // document.addEventListener('mousemove', this.#onMouseMove);
    }

    this.#img.src = inlineSVG(bg);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    window.removeEventListener('beforeunload', this.#onBeforeUnload);
    // document.removeEventListener('mousemove', this.#onMouseMove);
  }

  #onMouseMove = (event: MouseEvent) => {
    this.x = event.pageX;
    this.y = event.pageY;
  };

  #onBeforeUnload = () => {
    this.remove();
  };
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
    }

    ::slotted(mouse-cursor) {
      top: -2px !important;
    }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(document.createElement('slot'));

    return root;
  }

  claimCursor(cursor: MouseCursor): void {}

  revokeCursor(cursor: MouseCursor): void {}
}

export class CursorPark extends ReactiveElement implements CursorObject {
  static tagName = 'cursor-park';

  static styles = css`
    :host {
      display: block;
    }
  `;

  #mouseCursor!: MouseCursor;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#mouseCursor = document.createElement('mouse-cursor');
    this.#mouseCursor.id = UUID;

    root.appendChild(document.createElement('slot'));

    return root;
  }

  claimCursor(cursor: MouseCursor): void {}

  revokeCursor(cursor: MouseCursor): void {}
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

/* SITTING DOWN LOGIC */
// #onClick = (event: PointerEvent) => {
//   if (this.#sittingCursor) {
//     // this.#sittingCursor.remove();
//     this.#sittingCursor = null;
//     document.removeEventListener('keydown', this.#onKeydown);
//     document.removeEventListener('keyup', this.#onKeyup);
//     this.#internals.states.delete('sitting');
//   } else {
//     this.#internals.states.add('sitting');

//     document.addEventListener('keydown', this.#onKeydown);
//     document.addEventListener('keyup', this.#onKeyup);

//     const rect = this.getBoundingClientRect();
//     this.#sittingCursor = document.createElement('sitting-cursor') as any;
//     this.#sittingCursor.color = CURSOR_COLOR;
//     this.renderRoot.append(this.#sittingCursor);
//     this.#sittingCursor.x = clamp(0, event.pageX - rect.x, this.offsetWidth) - this.#sittingCursor.offsetWidth / 2;
//   }
// };

// #onKeydown = (event: KeyboardEvent) => {
//   if (this.#sittingCursor === null) return;
//   event.preventDefault();
//   if (event.code === 'ArrowLeft' && this.#sittingCursor.x > 0) {
//     this.#sittingCursor.moveLeft();
//   } else if (event.code === 'ArrowRight' && this.#sittingCursor.x + this.#sittingCursor.offsetWidth <= this.offsetWidth) {
//     this.#sittingCursor.moveRight();
//   } else if (event.code === 'ArrowUp') {
//     this.#sittingCursor.legs = 'forwards';
//   } else if (event.code === 'ArrowDown') {
//     this.#sittingCursor.legs = 'backwards';
//   }
// };

// #onKeyup = (event: KeyboardEvent) => {
//   if (this.#sittingCursor === null) return;

//   if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
//     this.#sittingCursor.legs = '';
//   }
// };

/* SITTING ANIMATION LOGIC */
//     const previousX = changedProperties.get('x');
//     if (previousX !== undefined) {
//       this.style.left = '';
//       this.style.rotate = '';
//       const direction = Math.sign(this.x - previousX);
//       const animation = this.animate(
//         [
//           { left: previousX + 'px', rotate: '0deg' },
//           { left: previousX + 'px', rotate: direction * 10 + 'deg' },
//           { left: this.x + 'px', rotate: direction * -7 + 'deg' },
//           { left: this.x + 'px', rotate: '0deg' },
//         ],
//         {
//           duration: 300,
//           fill: 'forwards',
//         }
//       );

//       await animation.finished;
//       // console.log(animation.pending);
//       animation.commitStyles();

//       // // Cancel the animation because of fill mode
//       animation.cancel();
//     } else {
//       this.style.left = this.x + 'px';
//     }
