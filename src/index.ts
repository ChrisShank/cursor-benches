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
  parkSign,
  parkInfographic,
} from './sprites';
import { PerfectCursor } from 'perfect-cursors';
import { DocHandle, isValidAutomergeUrl, Repo, WebSocketClientAdapter, type DocHandleChangePayload } from '@folkjs/collab/automerge';

interface CursorObject {
  acquireCursor(cursor: MouseCursor): void;
  releaseCursor(cursor: MouseCursor): void;
}

/* CONSTANTS */
const COLORS = ['#447F59', '#A10314', '#FB546E', '#8750C9', '#E601B2', '#2962C5'];
// const SCALES = [1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9];
const SCALES = [1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3];
const CURSOR_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const CURSOR_SCALE = SCALES[Math.floor(Math.random() * SCALES.length)];
const UUID = crypto.randomUUID();

PerfectCursor.MAX_INTERVAL = 100;

/* UTILITIES */
const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);

const inlineSVG = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const convertSVGIntoCssURL = (svg: string) => `url('${inlineSVG(svg)}')`;

export class AcquireCursorEvent extends Event {
  static eventType = 'acquire-cursor';

  constructor() {
    super(AcquireCursorEvent.eventType, { bubbles: true });
  }
}

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

    &:not(:has(cursor-park > mouse-cursor:state(self))) {
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

    img {
      display: block;
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
      background-image: url('data:image/webp;base64,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');
      aspect-ratio: 2.03;
      width: 80px;
      user-select: none;
    }

    ::slotted(mouse-cursor) {
      top: 50% !important;
      translate: 0 -55%;
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
    // this.dispatchEvent(new AcquireCursorEvent());
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
      const x = clamp(0, event.pageX - rect.x, this.offsetWidth) - cursor.offsetWidth / 2;
      this.acquireCursor(cursor, x);
      // cursor.x = clamp(0, event.pageX - rect.x, this.offsetWidth) - cursor.offsetWidth / 2;
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
      // this.#cursor.action = 'sitting-forwards';
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting-forwards',
      });
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      // this.#cursor.action = 'sitting-backwards';
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting-backwards',
      });
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (this.#cursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // this.#cursor.action = 'sitting';
      this.closest('cursor-park')?.updateSelfCursor({
        action: 'sitting',
      });
    }
  };

  #animateCursor(delta: number) {
    if (this.#cursor === null) return;

    this.#animation?.cancel();

    const previousX = this.#cursor.x;
    const x = previousX + delta;
    // const direction = Math.sign(delta);

    this.closest('cursor-park')?.updateSelfCursor({
      x,
    });

    // this.#animation = new CursorAnimation(this.#cursor, 250, [
    //   { percentage: 0, x: previousX, rotation: 0 },
    //   { percentage: 33, x: previousX, rotation: direction * 10 },
    //   { percentage: 66, x, rotation: direction * -7 },
    //   { percentage: 100, x, rotation: 0 },
    // ]);

    // this.#animation.start();

    // this.#animation.finished.then(() => (this.#animation = null));
  }
}

export class CursorMat extends ReactiveElement implements CursorObject {
  static tagName = 'cursor-mat';

  static styles = css`
    :host {
      display: block;
      position: relative;
      aspect-ratio: 1;
      width: 75px;
      user-select: none;
    }

    div {
      display: block;
      background-color: tan;
      height: 100%;
      width: 100%;
      transform: rotate3d(1, 0.5, -1, 90deg);
    }

    ::slotted(mouse-cursor) {
      translate: -100% -50%;
    }
  `;

  #cursor: MouseCursor | null = null;
  #mat = document.createElement('div');

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    root.append(this.#mat, document.createElement('slot'));

    this.#mat.addEventListener('click', this.#onAcquireClick);

    return root;
  }

  acquireCursor(cursor: MouseCursor, x = 0, y = 0): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as CursorObject)?.releaseCursor(this.#cursor);
    this.appendChild(this.#cursor);

    this.#mat.removeEventListener('click', this.#onAcquireClick);
    document.addEventListener('click', this.#onReleaseClick, { capture: true });

    const rect = this.#mat.getBoundingClientRect();

    this.closest('cursor-park')?.updateSelfCursor({
      action: 'crouching',
      x: x - rect.x,
      y: y - rect.y,
      parent: findCssSelector(this),
    });
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
    document.removeEventListener('click', this.#onReleaseClick, { capture: true });
    this.#mat.addEventListener('click', this.#onAcquireClick);
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
      this.acquireCursor(cursor, event.pageX, event.pageY);
    }
  };
}

export class CursorSign extends ReactiveElement {
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

    img {
      height: 100%;
      width: 100%;
    }
  `;

  #img = document.createElement('img');
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(parkSign());

    root.appendChild(document.createElement('slot'));
    root.append(this.#img);

    return root;
  }
}

export class CursorInfographic extends ReactiveElement {
  static tagName = 'cursor-infographic';

  static styles = css`
    :host {
      display: block;
      position: relative;
      /* 10 x 12 */
      aspect-ratio: 0.83;
      height: 60px;
      user-select: none;
    }

    img {
      height: 100%;
      width: 100%;
    }
  `;

  @property({ type: String, reflect: true }) text = '';

  #img = document.createElement('img');
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(document.createElement('slot'));
    root.append(this.#img);

    return root;
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);

    if (changedProperties.has('text')) {
      this.#img.src = inlineSVG(parkInfographic());
    }
  }
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
  #perfectCursors = new Map<string, PerfectCursor>();
  #isCursorClaimed = false;
  #cursorPosition = { x: 0, y: 0 };
  #handle: DocHandle<CursorDoc> | null = null;
  #repo = new Repo({ network: [new WebSocketClientAdapter('wss://sync.automerge.org')] });

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(document.createElement('slot'));

    // this.addEventListener(AcquireCursorEvent.eventType, (e) => {
    //   console.log('acquire', e.target);
    //   this.#updateSelfCursorParent(e.target as HTMLElement);
    // });

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
      // cursor.x = this.#cursorPosition.x;
      // cursor.y = this.#cursorPosition.y;
      // cursor.action = 'pointing';
      // this.#updateSelfCursorParent(this);
      this.updateSelfCursor({
        x: this.#cursorPosition.x,
        y: this.#cursorPosition.y,
        action: 'pointing',
        parent: findCssSelector(this),
      });
    }

    this.appendChild(cursor);
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#isCursorClaimed = false;
  }

  // #updateSelfCursorParent(el: HTMLElement) {
  //   this.#handle?.change((doc) => {
  //     console.log(findCssSelector(el));
  //     doc.cursors[UUID].parent = findCssSelector(el);
  //   });
  // }

  async #initializeDocument() {
    // Creating the document is async so it could cause unnecessary initialization of the document
    if (this.src === this.#handle?.url) return;

    this.#cleanup();

    console.log('init doc');

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
          const newParent = document.querySelector(data.parent);
          if (newParent) {
            newParent.appendChild(cursor);
          }
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

  #onChange = ({ doc, patches }: DocHandleChangePayload<CursorDoc>) => {
    // console.log(patches);
    for (const patch of patches) {
      if (patch.action === 'put') {
        const [_, id, key] = patch.path;

        // Create Cursor
        if (key === undefined) {
          const cursor = document.createElement('mouse-cursor');
          cursor.id = id as string;
          this.#cursors.set(id as string, cursor);

          this.#perfectCursors.set(
            id as string,
            new PerfectCursor(([x, y]) => {
              // only update the cursor if it's pointing
              if (cursor.action === 'pointing') {
                cursor.x = x;
                cursor.y = y;
              }
            }),
          );

          this.acquireCursor(cursor);
        } else {
          const cursor = this.#cursors.get(id as string);

          if (cursor === undefined) return;

          const data = doc.cursors[id];
          if (key === 'parent' && typeof patch.value === 'string' && patch.value !== '') {
            const newParent = document.querySelector(patch.value);
            if (newParent && newParent !== cursor.parentElement) {
              newParent.appendChild(cursor);
            }
          } else if ((key === 'x' || key === 'y') && !cursor.self && data.action === 'pointing') {
            this.#perfectCursors.get(id as string)?.addPoint([data.x, data.y]);
          } else if (key === 'action' || key === 'color' || key === 'rotation' || key === 'x' || key === 'y' || key === 'scale') {
            cursor[key] = patch.value as never;
          }
        }
      } else if (patch.action === 'splice') {
        const [_, id, key, _index] = patch.path;

        const cursor = this.#cursors.get(id as string);

        if (cursor === undefined) return;
        // ignore changes to id property.
        if (key === 'action' || key === 'color' || key === 'rotation' || key === 'x' || key === 'y' || key === 'scale') {
          cursor[key] = patch.value as never;
        } else if (key === 'parent' && typeof patch.value === 'string' && patch.value !== '') {
          const newParent = document.querySelector(patch.value);
          if (newParent && newParent !== cursor.parentElement) {
            newParent.appendChild(cursor);
          }
        }
      } else if (patch.action === 'del') {
        const [_, id] = patch.path;
        const cursor = this.#cursors.get(id as string);
        cursor?.remove();
        this.#cursors.delete(id as string);
        this.#perfectCursors.get(id as string)?.dispose();
        this.#perfectCursors.delete(id as string);
      }
    }
  };

  #cleanup() {
    this.#handle?.removeAllListeners();
  }

  #onBeforeUnload = () => {
    console.log('unload');
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
    }
    this.#cursorPosition.x = event.pageX;
    this.#cursorPosition.y = event.pageY;
  };

  updateSelfCursor({ x, y, action, color, rotation, scale, parent }: Partial<CursorItem>) {
    const cursor = this.#cursors.get(UUID);
    if (cursor === undefined) return;

    this.#handle?.change((doc) => {
      const cursorData = doc.cursors[UUID];
      if (parent !== undefined) cursorData.parent = parent;
      if (action !== undefined) cursorData.action = action;
      if (x !== undefined) cursorData.x = x;
      if (y !== undefined) cursorData.y = y;
      if (color !== undefined) cursorData.color = color;
      if (rotation !== undefined) cursorData.rotation = rotation;
      if (scale !== undefined) cursorData.scale = scale;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mouse-cursor': MouseCursor;
    'cursor-bench': CursorBench;
    'cursor-mat': CursorMat;
    'cursor-park': CursorPark;
    'cursor-sign': CursorSign;
    'cursor-infographic': CursorInfographic;
  }
}

MouseCursor.define();
CursorBench.define();
CursorMat.define();
CursorPark.define();
CursorSign.define();
CursorInfographic.define();
