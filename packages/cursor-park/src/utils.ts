import { AtUri, type AtUriString, type DidString, type NsidString, type RecordKeyString } from '@atproto/syntax';

const COLORS = [
  '#447F59',
  '#A10314',
  '#FB546E',
  '#8750C9',
  '#E601B2',
  '#c44601',
  '#f57600',
  '#0073e6',
  '#054fb9',
  '#5ba300',
  '#89ce00',
  '#0073e6',
  '#e6308a',
  '#009eb0',
  '#b51963',
  '#f57600',
  '#00b4c5',
  '#5928ed',
];
const SCALES = [1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3];
export const CURSOR_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
export const CURSOR_SCALE = SCALES[Math.floor(Math.random() * SCALES.length)];
export const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);
export const inlineSVG = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
export const convertSVGIntoCssURL = (svg: string) => `url('${inlineSVG(svg)}')`;

export interface ATRecord {
  uri: AtUriString;
  cid: string;
  value: any;
}

export async function fetchRecord(uri: string): Promise<ATRecord | null> {
  const atURI = new AtUri(uri);
  const url = new URL('https://slingshot.microcosm.blue/xrpc/com.atproto.repo.getRecord');
  url.searchParams.set('repo', atURI.did);
  url.searchParams.set('collection', atURI.collectionSafe);
  url.searchParams.set('rkey', atURI.rkeySafe);

  const data = await fetch(url).then((res) => res.json());
  return data;
}

interface BacklinkResponse {
  total: number;
  records: Backlink[];
  cursor: string;
}

interface Backlink {
  did: DidString;
  collection: NsidString;
  rkey: RecordKeyString;
}

export async function fetchBacklinks(uri: string, source: string, limit = 20): Promise<ATRecord[]> {
  const url = new URL('https://constellation.microcosm.blue/xrpc/blue.microcosm.links.getBacklinks');
  url.searchParams.set('subject', uri);
  url.searchParams.set('source', source);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const backlinks: BacklinkResponse = await response.json();
  const records = await Promise.all(backlinks.records.map((bl) => fetchRecord(`at://${bl.did}/${bl.collection}/${bl.rkey}`)));
  return records.filter((record) => record !== null);
}
