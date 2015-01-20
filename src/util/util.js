/**
 * Checks a precondition, throwing an exception containing the given message in the case of failure.
 *
 * @param {!boolean|*} expression
 * @param {=string} message
 * @param {=Array} args
 */
var need = function(expression, message, args) {
    if (expression !== true) {
        var msg = "Precondition failed" +
            "\n\nMessage: " + (message === undefined ? "(not provided)" : message) +
            "\n\nArgs: " + (args === undefined ? "(not provided)" : Array.prototype.slice.call(args).toArrayString());
        console.log(msg);
        throw new Error(msg);
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

/**
 * @type {!Array.<!{character: !string, expanded: !string, value: !number}>}
 */
var UNICODE_FRACTIONS = [
    {character: "\u00BD", ref: "½", expanded: "1/2", value: 1/2},
    {character: "\u00BC", ref: "¼", expanded: "1/4", value: 1/4},
    {character: "\u00BE", ref: "¾", expanded: "3/4", value: 3/4},
    {character: "\u2153", ref: "⅓", expanded: "1/3", value: 1/3},
    {character: "\u2154", ref: "⅔", expanded: "2/3", value: 2/3},
    {character: "\u2155", ref: "⅕", expanded: "1/5", value: 1/5},
    {character: "\u2156", ref: "⅖", expanded: "2/5", value: 2/5},
    {character: "\u2157", ref: "⅗", expanded: "3/5", value: 3/5},
    {character: "\u2158", ref: "⅘", expanded: "4/5", value: 4/5},
    {character: "\u2159", ref: "⅙", expanded: "1/6", value: 1/6},
    {character: "\u215A", ref: "⅚", expanded: "5/6", value: 5/6},
    {character: "\u2150", ref: "⅐", expanded: "1/7", value: 1/7},
    {character: "\u215B", ref: "⅛", expanded: "1/8", value: 1/8},
    {character: "\u215C", ref: "⅜", expanded: "3/8", value: 3/8},
    {character: "\u215D", ref: "⅝", expanded: "5/8", value: 5/8},
    {character: "\u215E", ref: "⅞", expanded: "7/8", value: 7/8},
    {character: "\u2151", ref: "⅑", expanded: "1/9", value: 1/9},
    {character: "\u2152", ref: "⅒", expanded: "1/10",  value:1/10}
];

/**
 * Corrects a value to a nearby simple fraction or root thereof, such as sqrt(1/2).
 * @param {!number} value
 * @param {!number} epsilon
 */
var roundToNearbyFractionOrRoot = function(value, epsilon) {
    if (value < 0) {
        return -roundToNearbyFractionOrRoot(-value, epsilon);
    }

    var r = value % 1;
    if (r <= epsilon || 1 - r <= epsilon) {
        return Math.round(value);
    }

    var fraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
        return Math.abs(e.value - value) <= epsilon;
    });
    if (fraction !== undefined) {
        return fraction.value;
    }

    var rootFraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
        return Math.abs(Math.sqrt(e.value) - value) <= epsilon;
    });
    if (rootFraction !== undefined) {
        return Math.sqrt(rootFraction.value);
    }

    return value;
};

/**
 * Returns a string representation of a float, taking advantage of unicode fractions and square roots.
 *
 * @param {!number} value The value to represent as a string.
 * @param {=number} epsilon The maximum error introduced by using an expression.
 * @param {=number} digits The number of digits to use if no expression matches.
 * @returns {!string}
 */
var floatToCompactString = function(value, epsilon, digits) {
    epsilon = epsilon || 0;

    if (value < 0) {
        return "-" + floatToCompactString(-value, epsilon);
    }

    var fraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
        return Math.abs(e.value - value) <= epsilon;
    });
    if (fraction !== undefined) {
        return fraction.character;
    }

    var rootFraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
        return Math.abs(Math.sqrt(e.value) - value) <= epsilon;
    });
    if (rootFraction !== undefined) {
        return "√" + rootFraction.character;
    }

    if (value % 1 !== 0 && digits !== undefined) {
        return value.toFixed(digits);
    }

    return value.toString();
};

/**
 * Parses the output of floatToCompactString back into a float.
 * @param {!string} text
 * @throws
 * @returns {!number}
 */
var parseFloatFromCompactString = function(text) {
    if (text.length === 0) {
        throw new Error("Not a number: '" + text + "'");
    }
    if (text[0] === "-") {
        return -parseFloatFromCompactString(text.substr(1));
    }
    if (text[0] === "√") {
        return Math.sqrt(parseFloatFromCompactString(text.substr(1)));
    }

    var fraction = UNICODE_FRACTIONS.firstMatchElseUndefined(function(e) {
        return e.character === text;
    });
    if (fraction !== undefined) {
        return fraction.value;
    }

    var result = parseFloat(text);
    if (isNaN(result)) {
        throw new Error("Not a number: '" + text + "'")
    }
    return result;
};

/**
 * Wraps a caching layer around a function.
 * The arguments must be usable as keys.
 * @param {*} bindThis
 * @param {!function(T) : R} func
 * @returns {!function(T) : R}
 * @template T, R
 */
var cacheFunc1 = function(bindThis, func) {
    var cacheObject = {};
    return function(arg) {
        if (!cacheObject.hasOwnProperty(arg)) {
            cacheObject[arg] = func.bind(bindThis)(arg);
        }
        return cacheObject[arg];
    };
};

/**
 * Wraps a caching layer around a function.
 * The arguments must be usable as keys.
 * @param {*} bindThis
 * @param {!function(T1, T2) : R} func
 * @returns {!function(T1, T2) : R}
 * @template T1, T2, R
 */
var cacheFunc2 = function(bindThis, func) {
    var partial = cacheFunc1(null, function(arg1) {
        return cacheFunc1(null, function(arg2) {
            return func.bind(bindThis)(arg1, arg2);
        })
    });
    return function(arg1, arg2) {
        return partial(arg1)(arg2);
    };
};
