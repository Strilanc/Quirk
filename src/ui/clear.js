/**
 * @param {!Revision} revision
 */
function initClear(revision) {
    const EMPTY_STATE = '{"cols":[]}';

    const clearButton = /** @type {!HTMLButtonElement} */ document.getElementById('clear-button');
    revision.latestActiveCommit().subscribe(e => { clearButton.disabled = e === EMPTY_STATE; });
    clearButton.addEventListener('click', () => revision.commit(EMPTY_STATE));
}

export {initClear}
