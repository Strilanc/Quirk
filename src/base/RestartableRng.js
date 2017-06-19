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

/**
 * A random number generator that records its results, so you can make a restarted copy.
 */
class RestartableRng {
    /**
     * @private
     */
    constructor() {
        /**
         * @type {!Array.<!number>}
         * @private
         */
        this._cache = [];
        /**
         * @type {!int}
         * @private
         */
        this._next = 0;
    }

    /**
     * @returns {!RestartableRng}
     */
    restarted() {
        let result =  new RestartableRng();
        result._cache = this._cache;
        return result;
    }

    /**
     * @returns {!number} A random number uniformly sampled from [0, 1).
     */
    random() {
        let p = this._next++;
        if (p >= this._cache.length) {
            this._cache.push(Math.random());
        }
        return this._cache[p];
    }
}

export {RestartableRng}
