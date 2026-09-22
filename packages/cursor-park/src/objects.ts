import { library } from './assets/svgs';
import { MouseCursor } from './cursor';
import { ReactiveElement, css, property, type PropertyValues } from './reactive-element';
import { clamp, inlineSVG } from './utils';

export class CursorObject extends ReactiveElement {
  static acquiredObject: CursorObject | null = null;

  #cursor: MouseCursor | null = null;

  get cursor() {
    return this.#cursor;
  }

  constructor() {
    super();

    this.addEventListener('click', this.#onAcquireClick);
  }

  acquireCursor(x: number, y: number) {
    if (this.#cursor === null) return;

    CursorObject.acquiredObject?.releaseCursor();
    CursorObject.acquiredObject = this;

    this.#cursor.x = x;
    this.#cursor.y = y;
    this.appendChild(this.#cursor);
    console.log('acquire', this);
  }

  releaseCursor() {
    console.log('release', this);
    if (this.cursor == null) return;

    this.cursor.action = '';
    this.cursor.remove();
    this.#cursor = null;
    CursorObject.acquiredObject = null;
  }

  #onAcquireClick = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (this.#cursor) {
      this.releaseCursor();
    } else {
      this.#cursor = MouseCursor.self;

      // compute point of click relative to the objects bounding box (which has to account for scroll)
      const rect = this.getBoundingClientRect();
      const x = event.pageX - (rect.x + window.scrollX);
      const y = event.pageY - (rect.y + window.scrollY);

      this.acquireCursor(x, y);
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

    const url = new URL('./assets/bench.png', import.meta.url);
    this.#img.src = url.toString();
    this.#img.alt = 'A tiny metal casted bench.';

    root.append(this.#img, document.createElement('slot'));

    return root;
  }

  acquireCursor(x: number, y: number): void {
    super.acquireCursor(x, y);

    // Shift the cursor over by 1/3 because the sprite is slightly bigger than it's outline.
    this.cursor!.x = clamp(0, x, this.offsetWidth) - this.cursor!.offsetWidth / 3;
    this.cursor!.y = 0;
    this.cursor!.action = 'sitting';

    document.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('keyup', this.#onKeyup);
  }

  releaseCursor(): void {
    document.removeEventListener('keydown', this.#onKeydown);
    document.removeEventListener('keyup', this.#onKeyup);

    super.releaseCursor();
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
      this.cursor.action = 'sitting-forwards';
    } else if (event.code === 'ArrowDown') {
      event.preventDefault();
      this.cursor.action = 'sitting-backwards';
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (this.cursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.cursor.action = 'sitting';
    }
  };

  #animateCursor(delta: number) {
    if (this.cursor === null) return;

    this.cursor.x += delta;
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
      font-size: 16px;
      pointer-events: none;
      text-align: center;
      opacity: 0;
      position: absolute;
      top: -75px;
      bottom: -75px;
      left: 125%;
      background: #deeade;
      border-radius: 4px;
      transition: opacity 200ms ease-out;
      box-sizing: border-box;
      overflow: scroll;
      z-index: 2;
      box-shadow: 3px 4px 8px 0px rgba(0, 0, 0, 0.5);
      z-index: calc(Infinity);
      padding: 12px 64px 4px 20px;

      align-items: flex-end;
      display: flex !important;
      gap: 2px;
      list-style-type: none;

      ::slotted(a),
      a {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        border-radius: 3px;
        overflow: hidden;
        color: white;
        padding: 9px 4px;
        line-height: 1.5;
        text-decoration: none;
        cursor: unset;
        box-shadow: 1px 1px 3px 0px rgba(0, 0, 0, 0.5);
      }

      ::slotted(a:hover),
      a:hover {
        text-decoration: underline;
      }

      ::slotted(a:nth-child(even)),
      a:nth-child(even) {
        background: #3ebc1b;
      }

      ::slotted(a:nth-child(odd)),
      a:nth-child(odd) {
        background: #ff0000;
      }

      ::slotted(a:nth-child(2n + 1)),
      a:nth-child(2n + 1) {
        rotate: 2deg;
        translate: -2px;
        margin-left: 2px;
        background: #286e75;
      }

      ::slotted(a:nth-child(3n)),
      a:nth-child(3n) {
        rotate: -1deg;
        translate: 1px;
        margin-left: 1px;
        background: #d3d382;
        color: black;
      }

      ::slotted(a:first-child),
      a:first-child {
        rotate: 8deg;
        translate: -8px;
        margin-left: 8px;
        background: #ff0000;
      }

      ::slotted(a:last-of-type),
      a:last-of-type {
        rotate: -8deg;
        translate: 8px;
        background: #d3d382;
      }
    }
  `;

  #img = document.createElement('img');
  #books = document.createElement('div');
  #slot = document.createElement('slot');
  #clickZone = document.createElement('click-zone');

  @property({ type: String, reflect: true }) src = '';

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.#books.appendChild(this.#slot);
    this.#books.addEventListener('click', (e) => e.stopPropagation());

    this.#img.src = inlineSVG(library());

    const cursorSlot = document.createElement('slot');
    cursorSlot.name = 'cursor';

    root.append(cursorSlot, this.#clickZone, this.#img, this.#books);

    return root;
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);

    if (changedProperties.has('src')) {
      if (this.src === '') return;

      const url = URL.parse(this.src);

      if (url?.hostname === 'semble.so') {
        const [, profile, identifier, collections, rkey] = url.pathname.split('/');
        console.log('url', profile, identifier, collections, rkey);

        if (profile === 'profile' && identifier && collections === 'collections' && rkey) {
          this.#loadSembleCollection(identifier, rkey);
        }
      }
    }
  }

  async #loadSembleCollection(identifier: string, rkey: string) {
    const response = await fetch(
      `https://api.semble.so/xrpc/network.cosmik.collection.getByAtUri?handle=${identifier}&recordKey=${rkey}&page=1&limit=15`,
    );

    if (!response.ok) return;

    const collection = await response.json();

    const links = collection.urlCards.map(({ cardContent }: any) => ({
      url: cardContent.url,
      title: cardContent.title || cardContent.description,
    }));

    this.#createLinks(links);
  }

  #createLinks(links: { url: string; title: string }[]) {
    const anchors = links.map((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.title.length < 60 ? link.title : link.title.slice(0, 57) + '...';
      a.target = '_blank';
      const size = -2.5 * link.title.length + 70;
      a.style.fontSize = `${clamp(12, size, 18)}px`;
      return a;
    });
    this.#slot.append(...anchors);
    console.log(anchors);
  }

  acquireCursor(x: number, y: number): void {
    super.acquireCursor(x, y);
    this.cursor!.slot = 'cursor';
    this.cursor!.action = 'looking-down';
    this.#books.style.opacity = '0.9';
    this.#books.style.pointerEvents = 'all';
  }

  releaseCursor(): void {
    this.cursor!.slot = '';
    this.#books.style.opacity = '0';
    this.#books.style.pointerEvents = '';

    super.releaseCursor();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cursor-bench': CursorBench;
    'cursor-library': CursorLibrary;
  }
}
