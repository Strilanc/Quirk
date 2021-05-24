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

import {DetailedError} from "../base/DetailedError.js"

/**
 * Manages interactions with the browser's history as the app's state changes and frequently updates the URL.
 */
class HistoryPusher {
    constructor() {
        /**
         * @type {!boolean}
         * @private
         */
        this._historyActionsNotWorking = false;
        /**
         * @type {undefined|*}
         * @private
         */
        this._currentMemorableStateObj = undefined;
    }

    /**
     * Indicates that the current state should be preserved in the browser history if the user transitions away from it.
     *
     * Because the state isn't known, any transition will trigger the preservation (possibly creating a duplicate
     * history entry).
     */
    currentStateIsMemorableButUnknown() {
        this._currentMemorableStateObj = {wont_equal_this: true};
    }

    /**
     * Indicates that the current state should be preserved in the browser history if the user transitions away from it.
     * @param {*} stateObj An ===-able object representing the current state, for identifying spurious transitions.
     */
    currentStateIsMemorableAndEqualTo(stateObj) {
        this._currentMemorableStateObj = stateObj;
    }

    /**
     * Indicates that the current state should not be preserved in the browser history if the user transitions away.
     * States are not-memorable by default.
     */
    currentStateIsNotMemorable() {
        this._currentMemorableStateObj = undefined;
    }

    /**
     * @param {*} stateObj An equatable (by ===) object representing the latest state.
     * @param {!string} stateUrlHash A document.location.hash value that will lead to the latest state.
     */
    stateChange(stateObj, stateUrlHash) {
        if (!stateUrlHash.startsWith('#')) {
            throw new DetailedError("Expected a hash URL.", {stateObj, stateUrlHash});
        }
        if (this._currentMemorableStateObj === stateObj) {
            return;
        }
        if (this._historyActionsNotWorking) {
            // This is worse than using the history API, since it inserts junk after every state change, but it's also
            // better than just randomly losing the circuit.
            document.location.hash = stateUrlHash;
            return;
        }

        try {
            // 'Memorable' states should stay in the history instead of being replaced.
            if (this._currentMemorableStateObj === undefined) {
                history.replaceState(stateObj, "", stateUrlHash);
            } else {
                history.pushState(stateObj, "", stateUrlHash);
                this._currentMemorableStateObj = undefined;
            }
        } catch (ex) {
            // E.g. this happens when running from the filesystem due to same-origin constraints.
            console.warn(
                "Calling 'history.replaceState/pushState' failed. Falling back to setting location.hash.",
                ex);
            this._historyActionsNotWorking = true;
            document.location.hash = stateUrlHash;
        }
    }
}

export {HistoryPusher}
