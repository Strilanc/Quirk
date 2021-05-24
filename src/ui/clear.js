/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @param {!Revision} revision
 * @param {!Observable.<boolean>} obsIsAnyOverlayShowing
 */
function initClear(revision, obsIsAnyOverlayShowing) {
    const EMPTY_STATE = '{"cols":[]}';

    const clearAllButton = /** @type {!HTMLButtonElement} */ document.getElementById('clear-all-button');
    revision.latestActiveCommit().zipLatest(obsIsAnyOverlayShowing, (r, v) => ({r, v})).subscribe(({r, v}) => {
        clearAllButton.disabled = r === EMPTY_STATE || v;
    });
    clearAllButton.addEventListener('click', () => revision.commit(EMPTY_STATE));

    const clearCircuitButton = /** @type {!HTMLButtonElement} */ document.getElementById('clear-circuit-button');
    revision.latestActiveCommit().zipLatest(obsIsAnyOverlayShowing, (r, v) => ({r, v})).subscribe(({r, v}) => {
        clearCircuitButton.disabled = r === _getEmptyCircuitState(revision) || v;
    });
    clearCircuitButton.addEventListener('click', () => revision.commit(_getEmptyCircuitState(revision)));
}

/**
 * Returns current state without circuit. Keeps all custom gates.
 * @param {!Revision} revision
 * @returns {!string}
 */
function _getEmptyCircuitState(revision) {
    let val = JSON.parse(revision.peekActiveCommit());
    val["cols"] = [];

    return JSON.stringify(val);
}

export {initClear}
