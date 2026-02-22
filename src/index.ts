// import 'https://esm.sh/@folkjs/labs@0.0.7/standalone/folk-sync-attribute';
import { ReactiveElement, css, property, unsafeCSS, type PropertyValues } from '@folkjs/dom/ReactiveElement';
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
  cursorLookingUp,
  cursorLookingDown,
  cursorMat,
  movieScreen,
  cursorBench,
  grass,
  cursorPath,
  cursorTree,
} from './sprites';
import { PerfectCursor } from 'perfect-cursors';
import { DocHandle, isValidAutomergeUrl, Repo, WebSocketClientAdapter, type DocHandleChangePayload } from '@folkjs/collab/automerge';
import 'youtube-video-element';
import type CustomVideoElement from 'youtube-video-element';

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
      if (this.#currentKeyFrame.x !== undefined) this.#cursor.style.left = this.#currentKeyFrame.x + 'px';
      if (this.#currentKeyFrame.y !== undefined) this.#cursor.style.top = this.#currentKeyFrame.y + 'px';
      if (this.#currentKeyFrame.rotation !== undefined) this.#cursor.style.rotate = this.#currentKeyFrame.rotation + 'deg';
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
    ['looking-up', cursorLookingUp],
    ['looking-down', cursorLookingDown],
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
  #animation: CursorAnimation | null = null;
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
      // Temporary place to animate bench interactions
      if (
        changedProperties.get('action') !== 'pointing' &&
        (this.action === 'sitting' || this.action === 'sitting-backwards' || this.action === 'sitting-forwards')
      ) {
        this.#animation?.cancel();
        const previousX = changedProperties.get('x') || 0;
        const x = this.x;
        const direction = Math.sign(x - previousX);
        this.#animation = new CursorAnimation(this, 200, [
          { percentage: 0, x: previousX, rotation: 0 },
          { percentage: 33, x: previousX, rotation: direction * 10 },
          { percentage: 66, x, rotation: direction * -7 },
          { percentage: 100, x, rotation: 0 },
        ]);

        this.#animation.start();

        this.#animation.finished.then(() => (this.#animation = null));
      } else {
        this.style.left = this.x + 'px';
      }
    }

    if (changedProperties.has('y')) {
      this.style.top = this.y + 'px';
    }

    if (changedProperties.has('rotation')) {
      this.style.rotate = this.rotation + 'deg';
    }

    if (changedProperties.has('action') || changedProperties.has('scale') || changedProperties.has('color')) {
      this.#animation?.cancel();
      this.#animation = null;

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
      aspect-ratio: 2.04;
      width: 85px;
      user-select: none;
    }

    :host(:hover)::after {
      display: block;
      position: absolute;
      height: 20%;
      width: 120%;
      bottom: 10%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    :host(:hover)::after {
      opacity: 1;
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
  #animation: CursorAnimation | null = null;

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
      const x = clamp(0, event.pageX - (rect.x + window.scrollX), this.offsetWidth) - cursor.offsetWidth / 2;
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
      user-select: none;
    }

    img {
      display: block;
      width: 80px;
    }

    /* place on tip of cursor */
    ::slotted(mouse-cursor) {
      translate: -25% -70%;
      transform: rotateY(26deg) rotateX(-3deg) rotateZ(-8deg);
    }
  `;

  @property({ type: String, reflect: true }) type = '';

  #cursor: MouseCursor | null = null;
  #mat = document.createElement('img');

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    root.append(this.#mat, document.createElement('slot'));

    this.#mat.addEventListener('click', this.#onAcquireClick);

    return root;
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);

    if (changedProperties.has('type')) {
      this.#mat.src = inlineSVG(cursorMat(this.type));
    }
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
      x: x - (rect.x + window.scrollX),
      y: y - (rect.y + window.scrollY),
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

export class CursorSign extends ReactiveElement implements CursorObject {
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

    div {
      display: block;
      position: absolute;
      height: 20%;
      width: 120%;
      bottom: 10%;
      right: 100%;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    :host(:hover) div,
    div:hover {
      opacity: 1;
    }

    img {
      height: 100%;
      width: 100%;
    }
  `;

  #img = document.createElement('img');
  #clickZone = document.createElement('div');
  #cursor: MouseCursor | null = null;

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(parkSign());
    this.#clickZone.addEventListener('click', this.#onAcquireClick);

    root.append(document.createElement('slot'), this.#clickZone, this.#img);

    return root;
  }

  acquireCursor(cursor: MouseCursor, x = 0, y = 0): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as CursorObject)?.releaseCursor(this.#cursor);
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
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
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
      this.acquireCursor(cursor, event.pageX, event.pageY);
    }
  };
}

export class CursorInfographic extends ReactiveElement implements CursorObject {
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

    div {
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

    :host(:hover) div,
    div:hover {
      opacity: 1;
    }

    img {
      height: 100%;
      width: 100%;
    }

    ::slotted(mouse-cursor) {
      translate: -50% 0%;
    }
  `;

  #img = document.createElement('img');
  #clickZone = document.createElement('div');
  #cursor: MouseCursor | null = null;

  get #park() {
    return this.closest('cursor-park');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#img.src = inlineSVG(parkInfographic());
    this.#clickZone.addEventListener('click', this.#onAcquireClick);

    root.append(document.createElement('slot'), this.#clickZone, this.#img);

    return root;
  }

  acquireCursor(cursor: MouseCursor, x = 0, y = 0): void {
    this.#cursor = cursor;
    (this.#cursor?.parentElement as unknown as CursorObject)?.releaseCursor(this.#cursor);
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
  }

  releaseCursor(_cursor: MouseCursor): void {
    this.#cursor = null;
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
      this.acquireCursor(cursor, event.pageX, event.pageY);
    }
  };
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

export class MovieScreen extends ReactiveElement {
  static tagName = 'movie-screen';

  static styles = css`
    :host {
      display: block;
      position: relative;
      aspect-ratio: 1.3;
      width: 300px;
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

    this.#player.volume = 0.05;
    this.#player.controls = false;
    this.#player.src = 'https://www.youtube.com/watch?v=WeyLEe1T0yo';
    this.#player.addEventListener('ended', this.#onFinish);
    // this.#player.play();

    this.#img.src = inlineSVG(movieScreen());

    root.append(this.#img, this.#player);

    return root;
  }

  #onFinish = () => {
    this.#player.style.display = 'none';
  };
}

export class CursorGrass extends ReactiveElement {
  static tagName = 'cursor-grass';

  static styles = css`
    :host {
      display: block;
      width: 10px;
      aspect-ratio: 1.5;
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
      pointer-events: none;
      width: 150px;
      aspect-ratio: 0.68;
      background-image: ${unsafeCSS(convertSVGIntoCssURL(cursorTree()))};
      background-size: contain;
      background-repeat: no-repeat;
    }
  `;
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
