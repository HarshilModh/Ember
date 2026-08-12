/**
 * Handwritten log notes ride in the existing `logs.note` text column — no
 * schema change — as a plain SVG string behind this sentinel prefix. Every
 * coordinate in the SVG is one we generated ourselves (see
 * ink-note-capture.tsx), never user-supplied markup, so rendering it back as
 * an <img> data URI is safe.
 */
const INK_PREFIX = "ink-note:v1:";

export function isInkNote(note: string): boolean {
  return note.startsWith(INK_PREFIX);
}

export function encodeInkNote(svg: string): string {
  return INK_PREFIX + svg;
}

export function inkNoteImageSrc(note: string): string {
  const svg = note.slice(INK_PREFIX.length);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
