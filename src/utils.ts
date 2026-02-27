const COLORS = ['#447F59', '#A10314', '#FB546E', '#8750C9', '#E601B2', '#2962C5'];
const SCALES = [1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3];
export const CURSOR_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
export const CURSOR_SCALE = SCALES[Math.floor(Math.random() * SCALES.length)];
export const UUID = crypto.randomUUID();
export const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);
export const inlineSVG = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
export const convertSVGIntoCssURL = (svg: string) => `url('${inlineSVG(svg)}')`;
