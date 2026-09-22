import { unsafeCSS } from '@lit/reactive-element';
import { MouseCursor } from '../src/cursor';
import { CursorBench, CursorObject, CursorLibrary } from './objects';
import { convertSVGIntoCssURL, CURSOR_COLOR, CURSOR_SCALE } from '../src/utils';
import { pointingCursor } from './assets/svgs';

/** Global Styles */
const styles = new CSSStyleSheet();
styles.replaceSync(`
  body {
    cursor: ${unsafeCSS(convertSVGIntoCssURL(pointingCursor(CURSOR_COLOR, CURSOR_SCALE)))}, auto;
  }

  body:has(mouse-cursor:state(self)) {
    cursor: ${unsafeCSS(convertSVGIntoCssURL(pointingCursor(CURSOR_COLOR + '61', CURSOR_SCALE)))}, auto;
  }
`);
document.adoptedStyleSheets.push(styles);

MouseCursor.define();

export { CursorBench, MouseCursor, CursorObject, CursorLibrary };
