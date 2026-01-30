// import 'https://esm.sh/@folkjs/labs@0.0.7/standalone/folk-sync-attribute';
import { ReactiveElement, css, property, type PropertyValues } from '@folkjs/dom/ReactiveElement';
import { findCssSelector } from '@folkjs/dom/css-selector';
import {
  pointingCursor,
  sittingCursor,
  sittingCursorWithLegsForward,
  sittingCursorWithLegsBack,
  standingCursor,
  slidingCursor,
  crouching,
} from './sprites';
import { DocHandle, isValidAutomergeUrl, Repo, WebSocketClientAdapter, type DocHandleChangePayload } from '@folkjs/collab/automerge';

interface CursorObject {
  acquireCursor(cursor: MouseCursor): void;
  releaseCursor(cursor: MouseCursor): void;
}

/* CONSTANTS */
const COLORS = ['#447F59', '#A10314', '#FB546E', '#8750C9', '#E601B2', '#2962C5'];
const SCALES = [1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9];
const CURSOR_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const CURSOR_SCALE = SCALES[Math.floor(Math.random() * SCALES.length)];
const UUID = crypto.randomUUID();

/* UTILITIES */
const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);

const inlineSVG = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const convertSVGIntoCssURL = (svg: string) => `url('${inlineSVG(svg)}')`;

export interface CursorKeyFrame {
  percentage: number;
  x?: number;
  y?: number;
  rotation?: number;
}

interface ComputedCursorKeyFrame {
  timeDiff: number;
  x: number | undefined;
  y: number | undefined;
  rotation: number | undefined;
}

export class CursorAnimation {
  #cursor;
  #index = 0;
  #keyframes: ComputedCursorKeyFrame[];
  #currentKeyFrame: ComputedCursorKeyFrame | undefined;
  #isPending = false;
  #timeout = -1;
  #promise = Promise.withResolvers<void>();

  get pending() {
    return this.#isPending;
  }

  get finished() {
    return this.#promise.promise;
  }

  constructor(cursor: MouseCursor, duration: number, keyframes: CursorKeyFrame[]) {
    this.#cursor = cursor;
    let previousTime = 0;
    this.#keyframes = keyframes.map(({ percentage, x, y, rotation }) => {
      const time = (duration * percentage) / 100;
      const timeDiff = time - previousTime;
      previousTime = time;
      return { timeDiff, x, y, rotation };
    });
  }

  start() {
    this.#isPending = true;
    this.#executeKeyFrame();
  }

  cancel() {
    this.#isPending = false;
    clearTimeout(this.#timeout);
    this.#promise.resolve();
  }

  #executeKeyFrame = () => {
    // commit the current keyframe values
    if (this.#currentKeyFrame !== undefined) {
      if (this.#currentKeyFrame.x !== undefined) this.#cursor.x = this.#currentKeyFrame.x;
      if (this.#currentKeyFrame.y !== undefined) this.#cursor.y = this.#currentKeyFrame.y;
      if (this.#currentKeyFrame.rotation !== undefined) this.#cursor.rotation = this.#currentKeyFrame.rotation;
    }

    // check if there is another keyframe
    this.#currentKeyFrame = this.#keyframes[this.#index];
    if (this.#currentKeyFrame === undefined) {
      this.#promise.resolve();
    } else {
      // increment index for next time
      this.#index += 1;
      this.#timeout = setTimeout(this.#executeKeyFrame, this.#currentKeyFrame.timeDiff);
    }
  };
}

/* GLOBAL STYLES */
const globalStyles = new CSSStyleSheet();

globalStyles.replaceSync(`
  body {
    cursor: ${convertSVGIntoCssURL(pointingCursor(CURSOR_COLOR, CURSOR_SCALE))}, auto;

    &:has(cursor-bench > mouse-cursor:state(self)) {
      cursor: ${convertSVGIntoCssURL(pointingCursor(CURSOR_COLOR + '51', CURSOR_SCALE))}, auto;
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

  static actions = new Map([
    ['pointing', pointingCursor],
    ['sitting', sittingCursor],
    ['sitting-backwards', sittingCursorWithLegsBack],
    ['sitting-forwards', sittingCursorWithLegsForward],
    ['standing', standingCursor],
    ['sliding', slidingCursor],
    ['crouching', crouching],
  ]);

  @property({ type: Number, reflect: true }) x = 0;

  @property({ type: Number, reflect: true }) y = 0;

  @property({ type: Number, reflect: true }) rotation = 0;

  @property({ type: Number, reflect: true }) scale = 1.75;

  @property({ type: String, reflect: true }) color = 'black';

  @property({ type: String, reflect: true }) action = 'pointing';

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

    if (changedProperties.has('rotation')) {
      this.style.rotate = this.rotation + 'deg';
    }

    if (changedProperties.has('action') || changedProperties.has('scale') || changedProperties.has('color')) {
      const previousAction = changedProperties.get('action');
      if (previousAction) {
        this.#internals.states.delete(previousAction);
      }

      this.#internals.states.add(this.action);

      const actionSprite = MouseCursor.actions.get(this.action) || pointingCursor;

      this.#img.src = inlineSVG(actionSprite(this.color, this.scale));
    }
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
      top: -4px !important;
    }
  `;

  #cursor: MouseCursor | null = null;
  #animation: CursorAnimation | null = null;

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

  #animateCursor(delta: number) {
    if (this.#cursor === null) return;

    this.#animation?.cancel();

    const previousX = this.#cursor.x;
    const x = previousX + delta;
    const direction = Math.sign(delta);

    this.#animation = new CursorAnimation(this.#cursor, 250, [
      { percentage: 0, x: previousX, rotation: 0 },
      { percentage: 33, x: previousX, rotation: direction * 10 },
      { percentage: 66, x, rotation: direction * -7 },
      { percentage: 100, x, rotation: 0 },
    ]);

    this.#animation.start();

    this.#animation.finished.then(() => (this.#animation = null));
  }
}

export class CursorSlide extends ReactiveElement implements CursorObject {
  static tagName = 'cursor-slide';

  static styles = css`
    :host {
      width: 44px;
      aspect-ratio: 1.189;
      display: block;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `;

  // #cursor: MouseCursor | null = null;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    (root as ShadowRoot).setHTMLUnsafe(`<svg viewBox="0 0 44 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<line x1="4.62474" y1="33" x2="4.62474" y2="1" stroke="black" stroke-width="2" stroke-linecap="square"/>
<path d="M41.1529 33.8656C41.7049 33.8501 42.1399 33.3899 42.1243 32.8379C42.1088 32.2858 41.6486 31.8509 41.0966 31.8664L41.1247 32.866L41.1529 33.8656ZM4.62472 3.54399e-05L3.62472 3.51419e-05L3.62472 2.00004L4.62472 2.00003L4.62472 1.00003L4.62472 3.54399e-05ZM41.1247 32.866L41.0966 31.8664C30.4412 32.1667 24.2117 24.6688 19.2241 16.6429C16.787 12.7212 14.5813 8.54906 12.4089 5.48932C10.2511 2.45019 7.79811 3.36625e-05 4.62472 3.54399e-05L4.62472 1.00003L4.62472 2.00003C6.70137 2.00003 8.62341 3.61237 10.7781 6.64717C12.9182 9.66136 14.9625 13.5746 17.5254 17.6986C22.5378 25.7643 29.3083 34.1994 41.1529 33.8656L41.1247 32.866Z" fill="black"/>
</svg>
<slot></slot>`);

    return root;
  }

  acquireCursor(_cursor: MouseCursor): void {}

  releaseCursor(_cursor: MouseCursor): void {}
}

export class CursorSign extends ReactiveElement implements CursorObject {
  static tagName = 'cursor-sign';

  static styles = css`
    :host {
      width: 44px;
      aspect-ratio: 1.189;
      display: block;
    }
  `;

  // #cursor: MouseCursor | null = null;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    (root as ShadowRoot).setHTMLUnsafe(`<svg viewBox="0 0 44 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<line x1="4.62474" y1="33" x2="4.62474" y2="1" stroke="black" stroke-width="2" stroke-linecap="square"/>
<path d="M41.1529 33.8656C41.7049 33.8501 42.1399 33.3899 42.1243 32.8379C42.1088 32.2858 41.6486 31.8509 41.0966 31.8664L41.1247 32.866L41.1529 33.8656ZM4.62472 3.54399e-05L3.62472 3.51419e-05L3.62472 2.00004L4.62472 2.00003L4.62472 1.00003L4.62472 3.54399e-05ZM41.1247 32.866L41.0966 31.8664C30.4412 32.1667 24.2117 24.6688 19.2241 16.6429C16.787 12.7212 14.5813 8.54906 12.4089 5.48932C10.2511 2.45019 7.79811 3.36625e-05 4.62472 3.54399e-05L4.62472 1.00003L4.62472 2.00003C6.70137 2.00003 8.62341 3.61237 10.7781 6.64717C12.9182 9.66136 14.9625 13.5746 17.5254 17.6986C22.5378 25.7643 29.3083 34.1994 41.1529 33.8656L41.1247 32.866Z" fill="black"/>
</svg>
<slot></slot>`);

    return root;
  }

  acquireCursor(_cursor: MouseCursor): void {}

  releaseCursor(_cursor: MouseCursor): void {}
}

interface CursorItem {
  action: string;
  color: string;
  rotation: number;
  x: number;
  y: number;
  scale: number;
  parent: string;
}

interface CursorDoc {
  cursors: Record<string, CursorItem>;
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

  @property({ type: String, reflect: true }) src = '';

  #cursors = new Map<string, MouseCursor>();
  #isCursorClaimed = false;
  #cursorPosition = { x: 0, y: 0 };
  #handle: DocHandle<CursorDoc> | null = null;
  #repo = new Repo({ network: [new WebSocketClientAdapter('wss://sync.automerge.org')] });

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(document.createElement('slot'));

    return root;
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('mousemove', this.#onMouseMove);
    window.addEventListener('beforeunload', this.#onBeforeUnload);
  }

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('src')) {
      this.#initializeDocument();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#cleanup();
    this.#onBeforeUnload();
    document.removeEventListener('mousemove', this.#onMouseMove);
    window.removeEventListener('beforeunload', this.#onBeforeUnload);
  }

  acquireCursor(cursor: MouseCursor): void {
    // when the park acquires the cursor of the current tab bind the current mouse position
    if (cursor.self) {
      this.#isCursorClaimed = true;
      cursor.x = this.#cursorPosition.x;
      cursor.y = this.#cursorPosition.y;
    }

    cursor.action = 'pointing';
    this.appendChild(cursor);
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#isCursorClaimed = false;
  }

  async #initializeDocument() {
    // Creating the document is async so it could cause unnecessary initialization of the document
    if (this.src === this.#handle?.url) return;

    this.#cleanup();

    if (this.src && isValidAutomergeUrl(this.src)) {
      try {
        this.#handle = await this.#repo.find<CursorDoc>(this.src);
        await this.#handle.whenReady();
        const doc = this.#handle.doc();

        // Create cursors that already exist
        for (const id of Object.keys(doc.cursors)) {
          const data = doc.cursors[id];
          const cursor = document.createElement('mouse-cursor');
          cursor.id = id as string;
          cursor.action = data.action;
          cursor.color = data.color;
          cursor.rotation = data.rotation;
          cursor.x = data.x;
          cursor.y = data.y;
          this.#cursors.set(id as string, cursor);
          this.acquireCursor(cursor);
        }
      } catch (error) {
        console.error('Failed to find document:', error);
      }
    }

    if (this.#handle === null) {
      try {
        this.#handle = this.#repo.create<CursorDoc>({ cursors: {} });
        await this.#handle.whenReady();
        this.src = this.#handle.url;
      } catch (error) {
        console.error('Failed to create document:', error);
        return;
      }
    }
    if (!this.#handle) return;
    this.#handle.on('change', this.#onChange);

    // Create the cursor for this tab
    this.#handle.change((doc) => {
      doc.cursors[UUID] = {
        action: 'pointing',
        color: CURSOR_COLOR,
        rotation: 0,
        x: this.#cursorPosition.x,
        y: this.#cursorPosition.y,
        scale: CURSOR_SCALE,
        parent: findCssSelector(this),
      };
    });
  }

  #onChange = ({ patches }: DocHandleChangePayload<CursorDoc>) => {
    console.log(patches);
    for (const patch of patches) {
      if (patch.action === 'put') {
        const [_, id, key] = patch.path;

        // Create Cursor
        if (key === undefined) {
          console.log('create cursor', id);
          const cursor = document.createElement('mouse-cursor');
          cursor.id = id as string;
          this.#cursors.set(id as string, cursor);
          this.acquireCursor(cursor);
        } else {
          const cursor = this.#cursors.get(id as string);
          // ignore changes to id property.
          if (cursor && (key === 'action' || key === 'color' || key === 'rotation' || key === 'x' || key === 'y' || key === 'scale')) {
            cursor[key] = patch.value as never;
          }
        }
      } else if (patch.action === 'splice') {
        const [_, id, key, _index] = patch.path;

        const cursor = this.#cursors.get(id as string);
        // ignore changes to id property.
        if (cursor && (key === 'action' || key === 'color' || key === 'rotation' || key === 'x' || key === 'y' || key === 'scale')) {
          cursor[key] = patch.value as never;
        }
      } else if (patch.action === 'del') {
        const [_, id] = patch.path;
        const cursor = this.#cursors.get(id as string);
        cursor?.remove();
        this.#cursors.delete(id as string);
      }
    }
  };

  #cleanup() {
    this.#handle?.removeAllListeners();
  }

  #onBeforeUnload = () => {
    console.log('cleanup');
    this.#handle?.change((doc) => {
      delete doc.cursors[UUID];
    });
  };

  // always track the cursor position
  // is the part doesn't have ownership then store it for future use.
  #onMouseMove = (event: MouseEvent) => {
    if (this.#isCursorClaimed && this.#handle) {
      this.#handle.change((doc) => {
        doc.cursors[UUID].x = event.pageX;
        doc.cursors[UUID].y = event.pageY;
      });
      // this.#mouseCursor.x = event.pageX;
      // this.#mouseCursor.y = event.pageY;
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
    'cursor-slide': CursorSlide;
    'cursor-park': CursorPark;
  }
}

MouseCursor.define();
CursorBench.define();
CursorSlide.define();
CursorPark.define();
