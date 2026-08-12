/**
 * setPointerCapture throws NotFoundError if the pointer session it names has
 * already ended by the time the call runs (a fast stylus lift, a pointer
 * that left before the handler fired) — a real, if rare, race on touch
 * hardware, not just a synthetic-event quirk. An uncaught throw here happens
 * inside a React event handler, so it doesn't just no-op: it aborts the
 * commit and can leave drag/gesture state stuck.
 */
export function safeSetPointerCapture(el: Element, pointerId: number): void {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    // Pointer already gone — nothing to capture.
  }
}
