/**
 * Checks a precondition, throwing an exception containing the given message in the case of failure.
 *
 * @param {!boolean|*} expression
 * @param {=string} message
 */
var need = function(expression, message) {
    if (expression !== true) {
        throw "Precondition failed: " + (message || "(no message provided)");
    }
};

/**
 * Forced cast from nullable to non-nullable, throwing an exception on failure.
 *
 * @param {?T} v
 * @returns {!T}
 *
 * @template T
 */
var notNull = function(v) {
    need(v !== null, "notNull");
    //noinspection JSValidateTypes
    return v;
};

/**
 * Returns the base-2 logarithm of the given number.
 *
 * @param {!number} n
 * @returns {!number}
 */
var lg = function(n) {
    need(n > 0, "lg: n > 0");
    return Math.log(n) / Math.log(2);
};

/**
 * Returns all of the integers that are unchanged by and-ing them against a bitwise mask.
 * @param {!int} mask
 * @returns {!Array.<!int>}
 */
var maskCandidates = function(mask) {
    need(mask >= 0, "maskCandidates: mask >= 0");
    var bits = [];
    while (mask > 0) {
        var prevMask = mask;
        mask &= mask - 1;
        bits.push(Math.round(lg(prevMask - mask)));
    }

    return range(1 << bits.length).map(function(e) {
        var r = 0;
        for (var i = 0; i < bits.length; i++) {
            if (((1 << i) & e) !== 0) {
                r |= 1 << bits[i];
            }
        }
        return r;
    });
};

/**
 * Determines if there is an integer p such that 2^p equals the given integer.
 * @param {!int} i
 * @returns {!boolean}
 */
var isPowerOf2 = function(i) {
    return i > 0 && ((i - 1) & i) === 0;
};

/**
 * Returns the number of bits needed to uniquely encode all integers up to and including the given value.
 *
 * A discrete off-by-one version of log_2(n).
 *
 * @param {!int} n
 * @returns {!int}
 */
var bitSize = function(n) {
    need(n >= 0, "bitSize: n >= 0");
    if (n === 0) {
        return 0;
    }
    return Math.floor(lg(n)  + 0.001) + 1;
};

/**
 * Determines how even a number is, with results like:
 * 0 means 'odd',
 * 1 means 'multiple of 2 but not 4'
 * 2 means 'multiple of 4 but not 8'
 * etc
 *
 * Note that 0 is infinitely even.
 *
 * @param {!int} i
 * @returns {!int}
 */
var evenPower = function(i) {
    if (i === 0) {
        return Math.POSITIVE_INFINITY;
    }
    if (i < 0) {
        return evenPower(-i);
    }
    var lowMask = i ^ (i - 1);
    var lowBit = i & lowMask;
    return Math.round(Math.log(lowBit) / Math.log(2));
};

/**
 * Determines if the two given values are exactly the same, as determined by the `===` operator.
 * @param {*} e1
 * @param {*} e2
 * @return {!boolean}
 */
var STRICT_EQUALITY = function(e1, e2) {
    return e1 === e2;
};

/**
 * Uses the `isEqualTo` property of the first argument to determine equality with the second argument. Handles the case
 * where both are null, returning true instead of throwing.
 *
 * @param {?T|*} e1
 * @param {?T|*} e2
 * @returns {!boolean}
 * @template T
 */
var CUSTOM_IS_EQUAL_TO_EQUALITY = function(e1, e2) {
    if (e1 === null) {
        return e2 === null;
    } else {
        return e1.isEqualTo(e2);
    }
};

/**
 * Converts a zero-argument instance method into a one-argument function.
 *
 * @param {!function(this:T1) : R} prototypeFunc1
 *
 * @returns {!function(T1) : R}
 *
 * @template T1, R
 */
var arg1 = function(prototypeFunc1) {
    return function(e1) {
        return prototypeFunc1.bind(e1)();
    };
};

/**
 * Converts a one-argument instance method into a two-argument function.
 *
 * @param {!function(this:T1, T2) : R} prototypeFunc1
 *
 * @returns {!function(T1, T2) : R}
 *
 * @template T1, T2, R
 */
var arg2 = function(prototypeFunc1) {
    return function(e1, e2) {
        return prototypeFunc1.bind(e1)(e2);
    };
};

/**
 * Returns an object's property, or else throws an exception when the object doesn't have that property.
 * @param {*} object
 * @param {*} key
 * @returns {*}
 */
var forceGetProperty = function(object, key) {
    if (!object.hasOwnProperty(key)) {
        throw new Error("Missing property: " + key);
    }
    return object[key];
};

/**
 * @param {function(T) : R} func
 * @returns {function(?T) : ?R}
 * @template {T, R}
 */
var wrapFuncToPropagateNull = function(func) {
    return function(arg) {
        return arg === null ? null : func(arg);
    }
};

/**
 * Determines if the given value is a float or int. Note that NaN and Infinity are counted as numbers.
 *
 * @param {!number|*} e
 * @returns {!boolean}
 */
var isNumber = function(e) {
    return typeof e === "number";
};

/**
 * Determines if the given value is a whole number.
 *
 * @param {!int|!number|*} e
 * @returns {!boolean}
 */
var isInt = function(e) {
    return isNumber(e) && e % 1 === 0;
};

/**
 * Determines if the given value is a string.
 *
 * @param {!int|!number|*} e
 * @returns {!boolean}
 */
var isString = function(e) {
    return typeof e === "string";
};
