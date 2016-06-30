/**
 * @param {!Revision} revision
 */
function initUndoRedo(revision) {
    const undoButton = /** @type {!HTMLButtonElement} */ document.getElementById('undo-button');
    const redoButton = /** @type {!HTMLButtonElement} */ document.getElementById('redo-button');
    revision.changes().subscribe(() => {
        undoButton.disabled = revision.isAtBeginningOfHistory();
        redoButton.disabled = revision.isAtEndOfHistory();
    });

    undoButton.addEventListener('click', () => revision.undo());
    redoButton.addEventListener('click', () => revision.redo());

    document.addEventListener("keydown", e => {
        const Y_KEY = 89;
        const Z_KEY = 90;
        let isUndo = e.keyCode === Z_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
        let isRedo1 = e.keyCode === Z_KEY && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey;
        let isRedo2 = e.keyCode === Y_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
        if (isUndo) {
            revision.undo();
            e.preventDefault();
        }
        if (isRedo1 || isRedo2) {
            revision.redo();
            e.preventDefault();
        }
    });
}

export { initUndoRedo }
