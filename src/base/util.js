/**
 * Checks a precondition, throwing an exception containing the given message in the case of failure.
 *
 * @param {!boolean|*} expression
 * @param {=string} message
 * @param {=Array} args
 */
export default class Util {
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
    *
    * @param {?T} v
    * @returns {!T}
    *
    * @template T
    */
    static notNull(v) {
        Util.need(v !== null, "notNull");
        //noinspection JSValidateTypes
        return v;
    }

    /**
    * Returns the base-2 logarithm of the given number.
    *
    * @param {!number} n
    * @returns {!number}
    */
    static lg(n) {
        Util.need(n > 0, "lg: n > 0");
        return Math.log(n) / Math.log(2);
    };

    ///**
    //* Returns all of the integers that are unchanged by and-ing them against a bitwise mask.
    //* @param {!int} mask
    //* @returns {!Array<!int>}
    //*/
    //static maskCandidates(mask) {
    //    Util.need(mask >= 0, "maskCandidates: mask >= 0");
    //    let bits = [];
    //    while (mask > 0) {
    //        let prevMask = mask;
    //        mask &= mask - 1;
    //        bits.push(Math.round(lg(prevMask - mask)));
    //    }
    //
    //    return Au.range(1 << bits.length).map(function(e) {
    //        let r = 0;
    //        for (let i = 0; i < bits.length; i++) {
    //            if (((1 << i) & e) !== 0) {
    //                r |= 1 << bits[i];
    //            }
    //        }
    //        return r;
    //    });
    //};

    ///**
    // * Determines if there is an integer p such that 2^p equals the given integer.
    // * @param {!int} i
    // * @returns {!boolean}
    // */
    //static isPowerOf2(i) {
    //    return i > 0 && ((i - 1) & i) === 0;
    //};
    //
    ///**
    // * Returns the number of bits needed to uniquely encode all integers up to and including the given value.
    // *
    // * A discrete off-by-one version of log_2(n).
    // *
    // * @param {!int} n
    // * @returns {!int}
    // */
    //static bitSize(n) {
    //    need(n >= 0, "bitSize: n >= 0");
    //    if (n === 0) {
    //        return 0;
    //    }
    //    return Math.floor(lg(n)  + 0.001) + 1;
    //};
    //
    ///**
    // * Determines how even a number is, with results like:
    // * 0 means 'odd',
    // * 1 means 'multiple of 2 but not 4'
    // * 2 means 'multiple of 4 but not 8'
    // * etc
    // *
    // * Note that 0 is infinitely even.
    // *
    // * @param {!int} i
    // * @returns {!int}
    // */
    //static evenPower(i) {
    //    if (i === 0) {
    //        return Math.POSITIVE_INFINITY;
    //    }
    //    if (i < 0) {
    //        return evenPower(-i);
    //    }
    //    var lowMask = i ^ (i - 1);
    //    var lowBit = i & lowMask;
    //    return Math.round(Math.log(lowBit) / Math.log(2));
    //};
    //
    ///**
    // * Converts a zero-argument instance method into a one-argument function.
    // *
    // * @param {!function(this:T1) : R} prototypeFunc1
    // *
    // * @returns {!function(T1) : R}
    // *
    // * @template T1, R
    // */
    //static arg1(prototypeFunc1) {
    //    return function(e1) {
    //        return prototypeFunc1.bind(e1)();
    //    };
    //};
    //
    ///**
    // * Converts a one-argument instance method into a two-argument function.
    // *
    // * @param {!function(this:T1, T2) : R} prototypeFunc1
    // *
    // * @returns {!function(T1, T2) : R}
    // *
    // * @template T1, T2, R
    // */
    //static arg2(prototypeFunc1) {
    //    return function(e1, e2) {
    //        return prototypeFunc1.bind(e1)(e2);
    //    };
    //};
    //
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
    //
    ///**
    // * Determines if the given value is a float or int. Note that NaN and Infinity are counted as numbers.
    // *
    // * @param {!number|*} e
    // * @returns {!boolean}
    // */
    //static isNumber(e) {
    //    return typeof e === "number";
    //}
    //
    ///**
    // * Determines if the given value is a whole number.
    // *
    // * @param {!int|!number|*} e
    // * @returns {!boolean}
    // */
    //static isInt(e) {
    //    return isNumber(e) && e % 1 === 0;
    //}
    //
    ///**
    // * Determines if the given value is a string.
    // *
    // * @param {!int|!number|*} e
    // * @returns {!boolean}
    // */
    //static isString(e) {
    //    return typeof e === "string";
    //};
    //
    ///**
    // * Corrects a value to a nearby simple fraction or root thereof, such as sqrt(1/2).
    // * @param {!number} value
    // * @param {!number} epsilon
    // */
    //static roundToNearbyFractionOrRoot(value, epsilon) {
    //    if (value < 0) {
    //        return -roundToNearbyFractionOrRoot(-value, epsilon);
    //    }
    //
    //    var r = value % 1;
    //    if (r <= epsilon || 1 - r <= epsilon) {
    //        return Math.round(value);
    //    }
    //
    //    var fraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
    //        return Math.abs(e.value - value) <= epsilon;
    //    });
    //    if (fraction !== undefined) {
    //        return fraction.value;
    //    }
    //
    //    var rootFraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
    //        return Math.abs(Math.sqrt(e.value) - value) <= epsilon;
    //    });
    //    if (rootFraction !== undefined) {
    //        return Math.sqrt(rootFraction.value);
    //    }
    //
    //    return value;
    //};
    //
    ///**
    // * Parses the output of floatToCompactString back into a float.
    // * @param {!string} text
    // * @throws
    // * @returns {!number}
    // */
    //static parseFloatFromCompactString(text) {
    //    if (text.length === 0) {
    //        throw new Error("Not a number: '" + text + "'");
    //    }
    //    if (text[0] === "-") {
    //        return -parseFloatFromCompactString(text.substr(1));
    //    }
    //    if (text[0] === "\u221A") {
    //        return Math.sqrt(parseFloatFromCompactString(text.substr(1)));
    //    }
    //
    //    var fraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
    //        return e.character === text;
    //    });
    //    if (fraction !== undefined) {
    //        return fraction.value;
    //    }
    //
    //    var result = parseFloat(text);
    //    if (isNaN(result)) {
    //        throw new Error("Not a number: '" + text + "'")
    //    }
    //    return result;
    //};
    //
    //static describeProbability(p, fractionalDigits) {
    //    if (p >= 1) {
    //        return "100%";
    //    }
    //    if (p <= 0) {
    //        return "0%";
    //    }
    //
    //    var v = p * 100;
    //    var e = Math.pow(10, -fractionalDigits);
    //    return Math.min(Math.max(v, e), 100 - e).toFixed(fractionalDigits) + "%";
    //};
    //
    ///**
    // * Wraps a caching layer around a function.
    // * The arguments must be usable as keys.
    // * @param {!function(T) : R} func
    // * @returns {!function(T) : R}
    // * @template T, R
    // */
    //static cacheFunc1(func) {
    //    var cacheObject = {};
    //    return arg => {
    //        if (!cacheObject.hasOwnProperty(arg)) {
    //            cacheObject[arg] = func(arg);
    //        }
    //        return cacheObject[arg];
    //    };
    //};
    //
    ///**
    // * Wraps a caching layer around a function.
    // * The arguments must be usable as keys.
    // * @param {!function(T1, T2) : R} func
    // * @returns {!function(T1, T2) : R}
    // * @template T1, T2, R
    // */
    //static cacheFunc2(func) {
    //    var partial = cacheFunc1(arg1 => cacheFunc1(arg2 => func(arg1, arg2)));
    //    return (arg1, arg2) => partial(arg1)(arg2);
    //};
    //
    ///**
    // * Wraps a caching layer around a function.
    // * The arguments must be usable as keys.
    // * @param {!function(T1, T2, T3) : R} func
    // * @returns {!function(T1, T2, T3) : R}
    // * @template T1, T2, T3, R
    // */
    //static cacheFunc3(func) {
    //    var partial = cacheFunc1(arg1 => cacheFunc2((arg2, arg3) => func(arg1, arg2, arg3)));
    //    return (arg1, arg2, arg3) => partial(arg1)(arg2, arg3);
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
