/**
 * @param {!Revision} revision
 * @param {!Observable.<boolean>} obsIsAnyOverlayShowing
 */
function initClear(revision, obsIsAnyOverlayShowing) {
    const EMPTY_STATE = '{"cols":[]}';

    const clearButton = /** @type {!HTMLButtonElement} */ document.getElementById('clear-button');
    revision.latestActiveCommit().zipLatest(obsIsAnyOverlayShowing, (r, v) => ({r, v})).subscribe(({r, v}) => {
        clearButton.disabled = r === EMPTY_STATE || v;
    });
    clearButton.addEventListener('click', () => revision.commit(EMPTY_STATE));
}

export {initClear}
