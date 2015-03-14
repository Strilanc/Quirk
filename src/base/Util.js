import Rect from "src/base/Rect.js"

/**
 * Miscellaneous utility methods.
 */
export default class Util {
    /**
     * Checks a precondition, throwing an exception containing the given message in the case of failure.
     * @param {!boolean|*} expression
     * @param {=string} message
     * @param {=Array} args
     */
    static need(expression, message, args) {
        if (expression !== true) {
            let argDesc = args === undefined ?
                "(not provided)" :
                `[${ Array.prototype.slice.call(args).join(", ") }]` ;
            let msgDesc = message === undefined ? "(not provided)" : message;
            var msg = "Precondition failed" +
                "\n\nMessage: " + msgDesc +
                "\n\nArgs: " + argDesc;
            throw new Error(msg);
        }
    }

    /**
    * Forced cast from nullable to non-nullable, throwing an exception on failure.
    * @param {?T} v
    * @returns {!T}
    * @template T
    */
    static notNull(v) {
        Util.need(v !== null, "notNull");
        //noinspection JSValidateTypes
        return v;
    }

    /**
     * Determines if there is an integer p such that 2^p equals the given integer.
     * @param {!int} i
     * @returns {!boolean}
     */
    static isPowerOf2(i) {
        return i > 0 && ((i - 1) & i) === 0;
    };

    /**
     * Returns the number of bits needed to uniquely encode all integers up to and including the given value.
     * A discrete off-by-one version of log_2(n).
     * @param {!int} n
     * @returns {!int}
     */
    static bitSize(n) {
        Util.need(n >= 0, "bitSize: n >= 0");
        if (n === 0) {
            return 0;
        }
        return Math.floor(Math.log2(n) + 0.000001) + 1;
    };

    /**
     * Returns the smallest power of 2 that is equal to or larger than the given integer.
     * @param {!int} i
     * @returns {!int}
     */
    static ceilingPowerOf2(i) {
        if (i <= 1) {
            return 1;
        }
        return 1 << Util.bitSize(i - 1);
    };

    /**
     * Determines how multiply-even a number is; how many times you can divide it by 2 before getting an odd result.
     * Odd numbers have 0 power-of-two-ness, multiples of 2 that aren't multiples of 4 have 1 power-of-two-ness,
     * multiples of 4 that aren't multiples of 8 have 3 power-of-two-ness, and so forth.
     *
     * Note that zero has infinite power-of-two-ness.
     *
     * @param {!int} i
     * @returns {!int}
     */
    static powerOfTwoness(i) {
        if (i === 0) {
            return Math.POSITIVE_INFINITY;
        }
        if (i < 0) {
            return Util.powerOfTwoness(-i);
        }
        var lowMask = i ^ (i - 1);
        var lowBit = i & lowMask;
        return Math.round(Math.log2(lowBit));
    };

    /**
     * Returns the flattened items at indexes corresponding to a rectangle in a 2-dimensional array, after the array was
     * flattened.
     * @param {!int} rowWidth
     * @param {!(T[])} items
     * @param {!Rect} rect
     * @returns {!(T[])}
     * @template T
     */
    static sliceRectFromFlattenedArray(rowWidth, items, rect) {
        let result = [];
        for (let j = 0; j < rect.h; j++) {
            for (let i = 0; i < rect.w; i++) {
                result.push(items[(j+rect.y)*rowWidth + i + rect.x]);
            }
        }
        return result;
    }

    /**
     * Converts from Map.<K, V[]> to Map.<V, K[]> in the "obvious" way, by having each value map to the group of keys that
     * mapped to a group containing said value in the original map.
     * @param {!Map.<K, !(V[])>} groupMap
     * @param {!boolean=} includeGroupsForOriginalKeysEvenIfEmpty
     * @returns {!Map.<V, !(K[])>}
     * @template K, V
     */
    static reverseGroupMap(groupMap, includeGroupsForOriginalKeysEvenIfEmpty = false) {
        let result = new Map();

        if (includeGroupsForOriginalKeysEvenIfEmpty) {
            //noinspection JSDuplicatedDeclaration
            for (let k of groupMap.keys()) {
                result.set(k, []);
            }
        }

        for (let [k, g] of groupMap) {
            //noinspection JSUnusedAssignment
            for (let e of g) {
                if (!result.has(e)) {
                    result.set(e, []);
                }
                //noinspection JSUnusedAssignment
                result.get(e).push(k);
            }
        }

        return result;
    };

    ///**
    // * Returns an object's property, or else throws an exception when the object doesn't have that property.
    // * @param {*} object
    // * @param {*} key
    // * @returns {*}
    // */
    //static forceGetProperty(object, key) {
    //    if (!object.hasOwnProperty(key)) {
    //        throw new Error("Missing property: " + key);
    //    }
    //    return object[key];
    //};
    //
    ///**
    // * @param {function(T) : R} func
    // * @returns {function(?T) : ?R}
    // * @template {T, R}
    // */
    //static wrapFuncToPropagateNull(func) {
    //    return function(arg) {
    //        return arg === null ? null : func(arg);
    //    }
    //};
}

/**
 * Determines if the two given values are exactly the same, as determined by the `===` operator.
 * @param {*} e1
 * @param {*} e2
 * @return {!boolean}
 */
Util.STRICT_EQUALITY = (e1, e2) => e1 === e2;

/**
 * Uses the `isEqualTo` property of the first argument to determine equality with the second argument. Handles the case
 * where both are null, returning true instead of throwing.
 *
 * @param {?T|*} e1
 * @param {?T|*} e2
 * @returns {!boolean}
 * @template T
 */
Util.CUSTOM_IS_EQUAL_TO_EQUALITY = (e1, e2) => e1 === null ? e2 === null: e1.isEqualTo(e2);
