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

import {DetailedError} from "src/base/DetailedError.js"
import {Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"

/**
 * Stores a set of requirements that a state's bits must meet.
 *
 * Mostly used for specifying the controls on an operation, i.e. which wires must be ON or OFF for it to apply.
 */
class Controls {
    /**
     * @param {!int} inclusionMask.
     * @param {!int} desiredValueMask
     * @property {!int} inclusionMask.
     * @property {!int} desiredValueMask
     */
    constructor(inclusionMask, desiredValueMask) {
        if ((desiredValueMask & ~inclusionMask) !== 0) {
            throw new DetailedError("Desired un-included bits", {inclusionMask, desiredValueMask});
        }
        /** @type {!int} */
        this.inclusionMask = inclusionMask;
        /** @type {!int} */
        this.desiredValueMask = desiredValueMask;
    }

    /**
     * @param {!int} bitIndex
     * @param {!boolean} desiredValue
     * @returns {!Controls}
     */
    static bit(bitIndex, desiredValue) {
        if (bitIndex < 0) {
            throw new DetailedError("Out of range", {bitIndex})
        }
        return new Controls(1 << bitIndex, desiredValue ? (1 << bitIndex) : 0);
    }

    /**
     * @param {!Controls|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof Controls &&
            this.inclusionMask === other.inclusionMask &&
            this.desiredValueMask === other.desiredValueMask;
    }

    /**
     * @returns {!string}
     */
    toString() {
        if (this.inclusionMask === 0) {
            return "No Controls";
        }

        return "Controls: ...__" + Seq.naturals().
            takeWhile(i => (1<<i) <= this.inclusionMask).
            map(this.desiredValueFor.bind(this)).
            map(e => e === undefined ? "_" : e ? "1" : "0").
            reverse().
            join("");
    }

    /**
     * @param {!int} stateIndex
     * @returns {!boolean}
     */
    allowsState(stateIndex) {
        return (this.inclusionMask & stateIndex) === this.desiredValueMask;
    }

    /**
     * @param {!int} bitIndex
     * @returns {undefined|!boolean}
     */
    desiredValueFor(bitIndex) {
        if ((this.inclusionMask & (1 << bitIndex)) === 0) {
            return undefined;
        }
        return (this.desiredValueMask & (1 << bitIndex)) !== 0;
    }

    /**
     * @returns {!int|Infinity}
     */
    includedBitCount() {
        if (this.inclusionMask < 0) {
            return Infinity;
        }
        return Util.numberOfSetBits(this.inclusionMask);
    }

    /**
     * @param {!Controls} other
     * @returns {!Controls}
     */
    and(other) {
        if ((other.desiredValueMask & this.inclusionMask) !== (this.desiredValueMask & other.inclusionMask)) {
            throw new DetailedError("Contradictory controls.", {"this": this, other})
        }
        return new Controls(
            this.inclusionMask | other.inclusionMask,
            this.desiredValueMask | other.desiredValueMask);
    }

    /**
     * @param {!int} offset
     * @returns {!Controls}
     */
    shift(offset) {
        return new Controls(
            this.inclusionMask << offset,
            this.desiredValueMask << offset)
    }
}

/** @type {!Controls} */
Controls.NONE = new Controls(0, 0);

export {Controls}
