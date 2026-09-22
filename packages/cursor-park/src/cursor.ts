import {
  crouching,
  cursorLookingDown,
  cursorLookingUp,
  pointingCursor,
  sittingCursor,
  sittingCursorWithLegsBack,
  sittingCursorWithLegsForward,
  standingCursor,
} from './assets/svgs';
import { ReactiveElement, css, property, type PropertyValues } from './reactive-element';
import { CURSOR_COLOR, CURSOR_SCALE, inlineSVG } from './utils';

export class MouseCursor extends ReactiveElement {
  static #self: MouseCursor | undefined;

  static get self() {
    if (this.#self === undefined) {
      this.#self = new MouseCursor();
      this.#self.scale = CURSOR_SCALE;
      this.#self.color = CURSOR_COLOR;
      this.#self.#internals.states.add('self');
    }

    return this.#self;
  }
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      user-select: none;
      z-index: calc(Infinity - 1);
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
    ['crouching', crouching],
    ['looking-up', cursorLookingUp],
    ['looking-down', cursorLookingDown],
  ]);

  @property({ type: Number, reflect: true }) x = 0;

  @property({ type: Number, reflect: true }) y = 0;

  @property({ type: Number, reflect: true }) scale = 1.75;

  @property({ type: String, reflect: true }) color = 'black';

  @property({ type: String, reflect: true }) action = 'pointing';

  #internals = this.attachInternals();
  #animation: Animation | null = null;
  #img = document.createElement('img');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(this.#img);

    return root;
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.update(changedProperties);

    if (changedProperties.has('x')) {
      // Temporary place to animate bench interactions
      const x = this.x;
      const previousX = changedProperties.get('x') || 0;
      const delta = Math.abs(x - previousX);
      const previousAction = changedProperties.get('action');
      if ((previousAction === undefined || previousAction.includes('sitting')) && this.action.includes('sitting') && delta <= 2.1) {
        this.#animation?.commitStyles();
        this.#animation?.cancel();
        this.style.rotate = '';

        const direction = Math.sign(x - previousX);

        this.#animation = this.animate(
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

        this.#animation.finished
          .then(() => {
            this.#animation?.commitStyles();
            this.#animation?.cancel();
            this.#animation = null;
          })
          .catch(() => {});
      } else {
        this.style.left = this.x + 'px';
      }
    }

    if (changedProperties.has('y')) {
      this.style.top = this.y + 'px';
    }

    if (changedProperties.has('action') || changedProperties.has('scale') || changedProperties.has('color')) {
      if (this.#animation && !this.action.includes('sitting')) {
        this.cancelAnimation();
      }

      const previousAction = changedProperties.get('action');
      if (previousAction) {
        this.#internals.states.delete(previousAction);
      }

      this.#internals.states.add(this.action);

      const actionSprite = MouseCursor.actions.get(this.action) || pointingCursor;

      this.#img.src = inlineSVG(actionSprite(this.color, this.scale));
    }
  }

  cancelAnimation() {
    this.#animation?.cancel();
    this.#animation = null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mouse-cursor': MouseCursor;
  }
}
