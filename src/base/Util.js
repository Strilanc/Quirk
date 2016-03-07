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
            for (let e of groupMap.keys()) {
                result.set(e, []);
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

    /**
     * Performs a binary search, looking for the first index to return false under the constraint that the given
     * function returns true for all arguments less than some index and false afterwards.
     *
     * @param {!int} max Determines the range to search over. Valid inputs to the query function are non-negative
     * integers up to this maximum than this count.
     * @param {!function(!int) : !boolean} argIsBeforeTransitionFunc Determines if the transition happens before or
     * after the given index.
     * @returns {!int}
     */
    static binarySearchForTransitionFromTrueToFalse(max, argIsBeforeTransitionFunc) {
        let min = 0;
        while (max > min) {
            let med = min + Math.floor((max - min) / 2);
            if (argIsBeforeTransitionFunc(med)) {
                min = med + 1;
            } else {
                max = med;
            }
        }
        return min;
    }

    /**
     * Breaks a single line of characters into several lines, when forced to by a width boundary.
     * @param {!string} text A single unbroken line of text, without any newline characters.
     * @param {!number} maxWidth The maximum width that lines can grow to before they must be broken.
     * @param {!function(!string) : !number} measureWidth Measure the width of a substring.
     * @returns {!(!string[])}
     */
    static breakLine(text, maxWidth, measureWidth) {
        let lines = [];
        let p = 0;
        while (p < text.length) {
            // How many characters will fit on this line?
            let maxKeepLength = Util.binarySearchForTransitionFromTrueToFalse(
                text.length - p + 1,
                i => measureWidth(text.substr(p, i)) <= maxWidth) - 1;
            maxKeepLength = Math.max(1, maxKeepLength);
            let maxChunk = text.substr(p, maxKeepLength);

            let hitBoundary = p + maxKeepLength === text.length ||
                text.substr(p + maxKeepLength, 1).match(/\s/) !== null;
            if (!hitBoundary) {
                // If some of the chunk words fit, defer the split word into the next line.
                let niceRegex = /^(.*\S)(\s+)\S*$/;
                let niceChunkMatch = niceRegex.exec(maxChunk);
                if (niceChunkMatch !== null) {
                    let keepChunk = niceChunkMatch[1];
                    let skipChunk = niceChunkMatch[2];
                    lines.push(keepChunk.trim());
                    p += keepChunk.length + skipChunk.length;
                    continue;
                }
            }

            // Taking the entire chunk, either due to a lucky break in the right place or an unavoidable word split.
            lines.push(maxChunk.trim());
            p += maxChunk.length;

            // Skip starting whitespace
            p += text.substr(p).match(/^\s*/)[0].length;
        }
        return lines;
    }

    /**
     * Enumerates the fields of an object, stashing their values into an array.
     * Array fields are flattened into the result array.
     *
     * @param {*} object
     * @returns {!Array.<*>}
     */
    static decomposeObjectValues(object) {
        let result = [];

        let decomposeValueOrArray;
        decomposeValueOrArray = val => {
            if (Array.isArray(val)) {
                for (let item of val) {
                    decomposeValueOrArray(item);
                }
            } else {
                result.push(val);
            }
        };

        for (let key of Object.keys(object)) {
            decomposeValueOrArray(object[key], result);
        }
        return result;
    }

    /**
     * @param {*} originalObject
     * @param {!Array.<*>} newFieldValues
     * @returns {!object}
     */
    static recomposedObjectValues(originalObject, newFieldValues) {
        let result = {};
        let i = 0;

        let recomposeValueOrArray;
        recomposeValueOrArray = originalVal => {
            if (Array.isArray(originalVal)) {
                let arr = [];
                for (let item of originalVal) {
                    arr.push(recomposeValueOrArray(item));
                }
                return arr;
            }

            return newFieldValues[i++];
        };

        for (let key of Object.keys(originalObject)) {
            result[key] = recomposeValueOrArray(originalObject[key]);
        }
        Util.need(i === newFieldValues.length, "Mismatched field value count.");
        return result;
    }

    /**
     * @param {!function(!Array.<*>) : !Array.<*>} func
     * @returns {!function(!object) : !object}
     */
    static objectifyArrayFunc(func) {
        return arg => Util.recomposedObjectValues(arg, func(Util.decomposeObjectValues(arg)));
    }
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
