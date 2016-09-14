/**
 * @param {!Revision} revision
 */
function initUndoRedo(revision) {
    const overlay_divs = [
        document.getElementById('gate-forge-div'),
        document.getElementById('export-div')
    ];

    const undoButton = /** @type {!HTMLButtonElement} */ document.getElementById('undo-button');
    const redoButton = /** @type {!HTMLButtonElement} */ document.getElementById('redo-button');
    revision.latestActiveCommit().subscribe(() => {
        undoButton.disabled = revision.isAtBeginningOfHistory();
        redoButton.disabled = revision.isAtEndOfHistory();
    });

    undoButton.addEventListener('click', () => revision.undo());
    redoButton.addEventListener('click', () => revision.redo());

    document.addEventListener("keydown", e => {
        // Don't capture keystrokes while menus are showing.
        for (let div of overlay_divs) {
            if (div.style.display !== 'NONE' && div.style.display !== 'none') {
                return;
            }
        }

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
