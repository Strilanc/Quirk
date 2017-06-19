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

let CONSTRUCTOR_CALLS_NESTING = 0;

/**
 * A generic error with an attached payload of details for context.
 */
class DetailedError extends Error {
    /**
     * @param {!string} message
     * @param {*} detailsObj
     */
    constructor(message, detailsObj) {
        super(message);
        /** @type {*} */
        this.detailsObj = detailsObj;
        /** @type {!string} */
        this.name = 'Error';
        /** @type {!string} */
        this.message = message;
        /** @type {undefined|!string} */
        this.stack = new Error().stack;
        if (this.stack !== undefined) {
            this.stack = this.stack.replace(/^Error\n\s+at new DetailedError (\S+)\s?\n\s+at /, '\n    ');
        }

        CONSTRUCTOR_CALLS_NESTING++;
        try {
            /** @type {!string} */
            this.details = CONSTRUCTOR_CALLS_NESTING === 1 ?
                describe(this.detailsObj) :
                "(failed to describe detailsObj due to possibly re-entrancy)";
        } catch (ex) {
            console.error(ex);
            this.details = "(failed to describe detailsObj, see the console for details)";
        } finally {
            CONSTRUCTOR_CALLS_NESTING--;
        }
    }

    toString() {
        return `${super.toString()}\nDetails: ${this.details}`;
    }
}

export {DetailedError}
