/**
 * Decides when a downloaded app update may reload the page:
 * right away, unless something is being edited (a thought in progress,
 * unsaved settings) — then as soon as the last editor closes.
 */
export function createUpdateGate() {
  let apply: (() => void) | null = null;
  let pending = false;
  let applied = false;
  let editors = 0;

  const maybeApply = () => {
    if (pending && !applied && editors === 0 && apply) {
      applied = true;
      apply();
    }
  };

  return {
    /** Wire the function that activates the new version and reloads. */
    setApply(fn: () => void) {
      apply = fn;
      maybeApply();
    },
    /** A new version finished downloading. */
    updateReady() {
      pending = true;
      maybeApply();
    },
    /** Marks an edit in progress; call the returned function when it ends (idempotent). */
    startEditing(): () => void {
      editors++;
      let done = false;
      return () => {
        if (done) return;
        done = true;
        editors--;
        maybeApply();
      };
    },
  };
}

export const updateGate = createUpdateGate();
