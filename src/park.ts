import { DocHandle, Repo, WebSocketClientAdapter, isValidAutomergeUrl, type DocHandleChangePayload } from '@folkjs/collab/automerge';
import { findCssSelector } from '@folkjs/dom/css-selector';
import { ReactiveElement, type PropertyValues, property, css } from '@folkjs/dom/ReactiveElement';
import { PerfectCursor } from 'perfect-cursors';
import type { MouseCursor } from './cursor';
import type { ICursorObject } from './cursor-objects';
import { UUID, CURSOR_COLOR, CURSOR_SCALE } from './utils';

PerfectCursor.MAX_INTERVAL = 100;

export interface CursorItem {
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

export class CursorPark extends ReactiveElement implements ICursorObject {
  static tagName = 'cursor-park';

  static styles = css`
    :host {
      display: block !important;
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
      (cursor?.parentElement as unknown as ICursorObject)?.releaseCursor();
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

  releaseCursor(): void {
    this.#isCursorClaimed = false;
  }

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
