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

const COLLECTION_CUTOFF = 1000;
const BAD_TO_STRING_RESULT = new (function(){})().toString();
const RECURSE_LIMIT_DESCRIPTION = "!recursion-limit!";
const DEFAULT_RECURSION_LIMIT = 10;

function try_describe_atomic(value) {
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }
    if (typeof value === "string") {
        return `"${value}"`;
    }
    if (typeof value === "number") {
        return "" + value;
    }
    return undefined;
}
function try_describe_collection(value, recursionLimit) {
    if (recursionLimit === 0) {
        return RECURSE_LIMIT_DESCRIPTION;
    }
    if (value instanceof Map) {
        return describe_Map(value, recursionLimit);
    }
    if (value instanceof Set) {
        return describe_Set(value, recursionLimit);
    }
    if (value[Symbol.iterator] !== undefined) {
        return describe_Iterable(value, recursionLimit);
    }
    return undefined;
}
function describe_fallback(value, recursionLimit) {
    let defaultString = String(value);
    if (defaultString !== BAD_TO_STRING_RESULT) {
        return defaultString;
    }
    return describe_Object(value, recursionLimit);
}

/**
 * Attempts to give a useful and unambiguous description of the given value.
 *
 * @param {*} value
 * @param {!int=} recursionLimit
 * @returns {!string}
 */
function describe(value, recursionLimit = DEFAULT_RECURSION_LIMIT) {
    return try_describe_atomic(value) ||
        try_describe_collection(value, recursionLimit) ||
        describe_fallback(value, recursionLimit);
}

/**
 * @param {!Map} map
 * @param {!int} limit
 * @returns {!string}
 */
function describe_Map(map, limit) {
    let entries = [];
    for (let [k, v] of map.entries()) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        //noinspection JSUnusedAssignment
        let keyDesc = describe(k, limit - 1);
        //noinspection JSUnusedAssignment
        let valDesc = describe(v, limit - 1);
        entries.push(`${keyDesc}: ${valDesc}`);
    }
    return `Map{${entries.join(", ")}}`;
}

/**
 * @param {!Set} set
 * @param {!int} limit
 * @returns {!string}
 */
function describe_Set(set, limit) {
    let entries = [];
    for (let e of set) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        entries.push(describe(e, limit - 1));
    }
    return `Set{${entries.join(", ")}}`;
}

/**
 * @param {!Iterable} seq
 * @param {!int} limit
 * @returns {!string}
 */
function describe_Iterable(seq, limit) {
    let entries = [];
    for (let e of seq) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        entries.push(describe(e, limit - 1));
    }
    let prefix = Array.isArray(seq) ? "" : seq.constructor.name;
    return `${prefix}[${entries.join(", ")}]`;
}

/**
 * @param {*} value
 * @param {!int} limit
 * @returns {!string}
 */
function describe_Object(value, limit) {
    let entries = [];
    for (let k in value) {
        if (!value.hasOwnProperty(k)) {
            continue;
        }
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        let v = value[k];
        let keyDesc = describe(k, limit - 1);
        let valDesc = describe(v, limit - 1);
        entries.push(`${keyDesc}: ${valDesc}`);
    }

    let typeName = value.constructor.name;
    let prefix = typeName === {}.constructor.name ? "" : `(Type: ${typeName})`;
    return `${prefix}{${entries.join(", ")}}`;
}

export {describe}
