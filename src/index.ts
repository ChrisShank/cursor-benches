import { convertSVGIntoCssURL, CURSOR_COLOR, CURSOR_SCALE } from './utils';
import { pointingCursor, MouseCursor } from './cursor';
import { CursorPark } from './park';
import {
  CursorBench,
  CursorGrass,
  CursorInfographic,
  CursorLibrary,
  CursorMailbox,
  CursorMat,
  CursorPath,
  CursorRock,
  CursorSign,
  CursorTree,
  MovieScreen,
} from './cursor-objects';

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
    'cursor-rock': CursorRock;
    'cursor-mailbox': CursorMailbox;
    'cursor-library': CursorLibrary;
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
CursorRock.define();
CursorMailbox.define();
CursorLibrary.define();
