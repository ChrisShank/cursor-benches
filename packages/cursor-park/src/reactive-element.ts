import { ReactiveElement as RE } from '@lit/reactive-element';

export { css, type PropertyValues, unsafeCSS } from '@lit/reactive-element';
export { property } from '@lit/reactive-element/decorators.js';

export class ReactiveElement extends RE {
  /** Defines the name of the custom element, must include a hyphen or it will error out when defined.
   * Defaults to a kebab-case version of the PascalCase class name
   */
  static tagName = '';

  /** Defines the custom element with the global CustomElementRegistry, ignored if called more than once. Errors if no tagName is defined or it doesn't include a hyphen. */
  static define() {
    if (!this.tagName)
      this.tagName = this.name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .slice(1);

    if (customElements.get(this.tagName)) return;

    customElements.define(this.tagName, this);
  }
}
