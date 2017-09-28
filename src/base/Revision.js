// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe} from "src/base/Describe.js"
import {equate} from "src/base/Equate.js"
import {DetailedError} from "src/base/DetailedError.js"
import {ObservableSource, ObservableValue} from "src/base/Obs.js"

/**
 * A simple linear revision history tracker, for supporting undo and redo functionality.
 */
class Revision {
    /**
     * @param {!Array.<*>} history
     * @param {!int} index
     * @param {!boolean} isWorkingOnCommit
     */
    constructor(history, index, isWorkingOnCommit) {
        if (index < 0 || index >= history.length) {
            throw new DetailedError("Bad index", {history, index, isWorkingOnCommit});
        }
        if (!Array.isArray(history)) {
            throw new DetailedError("Bad history", {history, index, isWorkingOnCommit});
        }

        /** @type {!Array.<*>} */
        this.history = history;
        /** @type {!int} */
        this.index = index;
        /** @type {!boolean} */
        this.isWorkingOnCommit = isWorkingOnCommit;
        /** @type {!ObservableSource} */
        this._changes = new ObservableSource();
        /** @type {!ObservableSource} */
        this._latestActiveCommit = new ObservableValue(this.history[this.index]);
    }

    /**
     * @returns {!Observable.<*>}
     */
    changes() {
        return this._changes.observable();
    }

    /**
     * @returns {!Observable.<*>}
     */
    latestActiveCommit() {
        return this._latestActiveCommit.observable();
    }

    /**
     * Returns a snapshot of the current commit.
     * @returns {*}
     */
    peekActiveCommit() {
        return this._latestActiveCommit.get();
    }

    /**
     * Returns a cleared revision history, starting at the given state.
     * @param {*} state
     */
    static startingAt(state) {
        return new Revision([state], 0, false);
    }

    /**
     * @returns {!boolean}
     */
    isAtBeginningOfHistory() {
        return this.index === 0 && !this.isWorkingOnCommit;
    }

    /**
     * @returns {!boolean}
     */
    isAtEndOfHistory() {
        return this.index === this.history.length - 1;
    }

    /**
     * Throws away all revisions and resets the given state.
     * @param {*} state
     * @returns {void}
     */
    clear(state) {
        this.history = [state];
        this.index = 0;
        this.isWorkingOnCommit = false;
        this._changes.send(state);
        this._latestActiveCommit.set(state);
    }

    /**
     * Indicates that there are pending changes, so that a following 'undo' will return to the current state instead of
     * the previous state.
     * @returns {void}
     */
    startedWorkingOnCommit() {
        this.isWorkingOnCommit = true;
        this._changes.send(undefined);
    }

    /**
     * Indicates that pending changes were discarded, so that a following 'undo' should return to the previous state
     * instead of the current state.
     * @returns {*} The new current state.
     */
    cancelCommitBeingWorkedOn() {
        this.isWorkingOnCommit = false;
        let result = this.history[this.index];
        this._changes.send(result);
        this._latestActiveCommit.set(result);
        return result;
    }

    /**
     * Throws away future states, appends the given state, and marks it as the current state
     * @param {*} newCheckpoint
     * @returns {void}
     */
    commit(newCheckpoint) {
        if (newCheckpoint === this.history[this.index]) {
            this.cancelCommitBeingWorkedOn();
            return;
        }
        this.isWorkingOnCommit = false;
        this.index += 1;
        this.history.splice(this.index, this.history.length - this.index);
        this.history.push(newCheckpoint);
        this._changes.send(newCheckpoint);
        this._latestActiveCommit.set(newCheckpoint);
    }

    /**
     * Marks the previous state as the current state and returns it (or resets to the current state if
     * 'working on a commit' was indicated).
     * @returns {undefined|*} The new current state, or undefined if there's nothing to undo.
     */
    undo() {
        if (!this.isWorkingOnCommit) {
            if (this.index === 0) {
                return undefined;
            }
            this.index -= 1;
        }
        this.isWorkingOnCommit = false;
        let result = this.history[this.index];
        this._changes.send(result);
        this._latestActiveCommit.set(result);
        return result;
    }

    /**
     * Marks the next state as the current state and returns it (or does nothing if there is no next state).
     * @returns {undefined|*} The new current state, or undefined if there's nothing to redo.
     */
    redo() {
        if (this.index + 1 === this.history.length) {
            return undefined;
        }
        this.index += 1;
        this.isWorkingOnCommit = false;
        let result = this.history[this.index];
        this._changes.send(result);
        this._latestActiveCommit.set(result);
        return result;
    }

    /**
     * @returns {!string} A description of the revision.
     */
    toString() {
        return 'Revision(' + describe({
            index: this.index,
            count: this.history.length,
            workingOnCommit: this.isWorkingOnCommit,
            head: this.history[this.index]
        }) + ')';
    }

    /**
     * Determines if two revisions currently have the same state.
     * @param {*|!Revision} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof Revision &&
            this.index === other.index &&
            this.isWorkingOnCommit === other.isWorkingOnCommit &&
            equate(this.history, other.history);
    }
}

export {Revision}
