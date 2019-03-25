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
 * Determines if two values are currently equivalent.
 *
 * Values that are equal according to === are currently equivalent.
 * NaN is currently equivalent to NaN.
 * Values with an `isEqualTo` method are currently equivalent to values that return true when passed to that method.
 * Collections of the same type that contain currently equivalent entries are currently equivalent.
 * Objects of the same type with equivalent same own properties and iterables are currently equivalent.
 *
 * @param {*} subject
 * @param {*} other
 * @returns {!boolean}
 */
function equate(subject, other) {
    if (subject === other || (isExactlyNaN(subject) && isExactlyNaN(other))) {
        return true;
    }

    // Custom equality.
    let customEquality = tryEquate_custom(subject, other);
    if (customEquality !== undefined) {
        return customEquality;
    }
    if (isAtomic(subject) || isAtomic(other) || !eqType(subject, other)) {
        return false;
    }

    // Collection equality.
    if (subject instanceof Map) {
        return equate_Maps(subject, other);
    }
    if (subject instanceof Set) {
        return equate_Sets(subject, other);
    }
    if (isIndexable(subject)) {
        return equate_Indexables(subject, other);
    }

    // Object equality.
    return equate_Objects(subject, other);
}

const GENERIC_ARRAY_TYPES = [
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray
];

/**
 * @param {*} v
 * @returns {!boolean}
 */
function isExactlyNaN(v) {
    return typeof v === "number" && isNaN(v);
}

/**
 * @param {*} subject
 * @param {*} other
 * @returns {undefined|!boolean}
 */
function tryEquate_custom(subject, other) {
    if (!isAtomic(subject) && subject.constructor.prototype.hasOwnProperty("isEqualTo")) {
        return subject.isEqualTo(other);
    }
    if (!isAtomic(other) && other.constructor.prototype.hasOwnProperty("isEqualTo")) {
        return other.isEqualTo(subject);
    }
    return undefined;
}

/**
 * @param {*} value
 * @returns {!boolean}
 */
function isAtomic(value) {
    return value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean";
}

/**
 * @param {*} value
 * @returns {!boolean}
 */
function isIndexable(value) {
    return Array.isArray(value) || !GENERIC_ARRAY_TYPES.every(t => !(value instanceof t));
}

/**
 * @param {*} subject
 * @param {*} other
 * @returns {!boolean}
 */
function eqType(subject, other) {
    return subject.constructor.name === other.constructor.name;
}

/**
 * @param {!(*[])} subject
 * @param {!(*[])} other
 * @returns {!boolean}
 */
function equate_Indexables(subject, other) {
    if (subject.length !== other.length) {
        return false;
    }
    for (let i = 0; i < subject.length; i++) {
        if (!equate(subject[i], other[i])) {
            return false;
        }
    }
    return true;
}

/**
 * @param {!Iterable} subject
 * @param {!Iterable} other
 * @returns {!boolean}
 */
function equate_Iterables(subject, other) {
    let otherIter = other[Symbol.iterator]();
    for (let subjectItem of subject) {
        let otherItemDone = otherIter.next();
        if (otherItemDone.done || !equate(subjectItem, otherItemDone.value)) {
            return false;
        }
    }
    return otherIter.next().done;
}

/**
 * @param {!Map} subject
 * @param {!Map} other
 * @returns {!boolean}
 */
function equate_Maps(subject, other) {
    if (subject.size !== other.size) {
        return false;
    }
    for (let [k, v] of subject) {
        //noinspection JSUnusedAssignment
        if (!other.has(k)) {
            return false;
        }
        //noinspection JSUnusedAssignment
        let otherV = other.get(k);
        //noinspection JSUnusedAssignment
        if (!equate(v, otherV)) {
            return false;
        }
    }
    return true;
}

/**
 * @param {!Set} subject
 * @param {!Set} other
 * @returns {!boolean}
 */
function equate_Sets(subject, other) {
    if (subject.size !== other.size) {
        return false;
    }
    for (let k of subject) {
        if (!other.has(k)) {
            return false;
        }
    }
    return true;
}

/**
 * @param {!object} obj
 * @returns {!Set}
 */
function objectKeys(obj) {
    let result = new Set();
    for (let k in obj) {
        if (obj.hasOwnProperty(k)) {
            result.add(k);
        }
    }
    return result;
}

/**
 * @param {!object} subject
 * @param {!object} other
 * @returns {!boolean}
 */
function equate_Objects(subject, other) {
    let keys = objectKeys(subject);
    if (!equate_Sets(keys, objectKeys(other))) {
        return false;
    }

    for (let k of keys) {
        if (k === Symbol.iterator) {
            continue;
        }
        if (!equate(subject[k], other[k])) {
            return false;
        }
    }

    let hasSubjectIter = subject[Symbol.iterator] !== undefined;
    let hasOtherIter = other[Symbol.iterator] !== undefined;
    if (hasSubjectIter !== hasOtherIter) {
        return false;
    }
    if (hasSubjectIter && hasOtherIter) {
        if (!equate_Iterables(/** @type {!Iterable} */ subject, /** @type {!Iterable} */ other)) {
            return false;
        }
    }

    return true;
}

export {equate, equate_Maps}
