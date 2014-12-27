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
    need(v !== null);
    //noinspection JSValidateTypes
    return v;
};

/**
 * Runs an aggregating function over an array, returning the accumulated value at each point (including the seed).
 *
 * @param {!Array.<T>} items
 * @param {S} seed
 * @param {!function(S, T) : S} aggregator
 *
 * @template T, S
 *
 * @returns {!Array.<S>}
 */
var scan = function(items, seed, aggregator) {
    var result = [];
    result.push(seed);

    var state = seed;
    for (var i = 0; i < items.length; i++) {
        state = aggregator(state, items[i]);
        result.push(state);
    }

    return result;
};

/**
 * Mutates the given array, pushing items at or past the given index ahead and placing the given item in the new space.
 *
 * @param {!Array<T>} array
 * @param {T} item
 * @param {!int} index
 *
 * @template T
 */
var insertAt = function(array, item, index) {
    need(index >= 0 && index <= array.length);
    array.splice(index, 0, item);
};

/**
 * Returns a copy of the given array, except the item at the given index is swapped out for the given item.
 *
 * @param {!Array<T>} array
 * @param {T} item
 * @param {!int} index
 *
 * @returns {!Array<T>}
 *
 * @template T
 */
var withItemReplacedAt = function(array, item, index) {
    need(index >= 0 && index < array.length);
    var result = [];
    for (var i = 0; i < array.length; i++) {
        result.push(i === index ? item : array[i]);
    }
    return result;
};

/**
 * Returns an array containing the first part of the given array, up to the takeCount'th item.
 *
 * @param {!Array.<T>} array
 * @param {!int} takeCount
 * @returns {Array.<T>}
 *
 * @template T
 */
var take = function(array, takeCount) {
    need(takeCount >= 0);
    return array.slice(0, takeCount);
};

/**
 * Returns a new array, with the same items as the given array.
 * @param {!Array<T>} array
 * @returns {!Array<T>}
 * @template T
 */
var copyArray = function(array) {
    return array.map(function(e) { return e; });
};

/**
 * @param {!Array<*>} array
 * @returns {!string}
 */
var arrayToString = function(array) {
    return "[" + array.join(", ") + "]";
};

/**
 * Returns an array containing the given item the given number of times.
 * @param {T} item
 * @param {!int} repeatCount
 * @returns {!Array<T>}
 * @template T
 */
var repeat = function(item, repeatCount) {
    return range(repeatCount).map(function() { return item; });
};

/**
 *
 * @param {!Array.<T>} items
 * @returns {T}
 * @template T
 */
var arrayMax = function(items) {
    if (items.length === 0) {
        return -Infinity;
    }

    var result = items[0];
    for (var i = 1; i < items.length; i++) {
        if (result < items[i]) {
            result = items[i];
        }
    }
    return result;
};

/**
 * Returns the highest-scoring item in an array, as determined by a scoring function.
 *
 * The array must have at least one item, and the scores must be comparable by the '<' operator.
 *
 * @param {!Array.<T>} items
 * @param {!function(T) : !number} projection
 * @returns {T}
 * @template T
 */
var maxBy = function(items, projection) {
    need(items.length > 0);
    if (items.length === 1) {
        return items[0];
    }

    var curMaxItem = items[0];
    var curMaxScore = projection(items[0]);
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var score = projection(item);
        if (score > curMaxScore) {
            curMaxItem = item;
            curMaxScore = score;
        }
    }

    return curMaxItem;
};

/**
 * Returns the base-2 logarithm of the given number.
 *
 * @param {!number} n
 * @returns {!number}
 */
var lg = function(n) {
    need(n > 0);
    return Math.log(n) / Math.log(2);
};

/**
 * Returns all of the integers that are unchanged by and-ing them against a bitwise mask.
 * @param {!int} mask
 * @returns {!Array.<!int>}
 */
var maskCandidates = function(mask) {
    need(mask >= 0);
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
    need(n >= 0);
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
 * Returns an array of the first n natural numbers, in order from 0 to n-1.
 * @param {!int} n
 * @returns {!Array.<!int>}
 */
var range = function(n) {
    need(n >= 0);
    var result = [];
    while (result.length < n) {
        result.push(result.length);
    }
    return result;
};

/**
 * Adds up the numbers in the given array and returns the total.
 * The empty array's sum is defined to be 0, to satisfy the invariant that sum(X.concat([s])) = sum(X) + s.
 * @param {!Array.<!number>} array
 * @returns {!number}
 */
var sum = function(array) {
    return array.reduce(function(e1, e2) { return e1 + e2; }, 0);
};

/**
 * Combines two arrays together by pairing items with the same index and running them through a combining function.
 * If one array is longer than the other, the lonely tail is discarded.
 *
 * @param {!Array.<T1>} array1
 * @param {!Array.<T2>} array2
 * @param {!function(T1, T2) : R} combiner
 *
 * @returns {!Array.<R>}
 *
 * @template T1, T2, R
 */
var zip = function(array1, array2, combiner) {
    return range(Math.min(array1.length, array2.length))
        .map(function(i) { return combiner(array1[i], array2[i]); });
};

/**
 * Determines if two arrays contain the same items in the same order, as determined by the given equality comparer.
 * Arrays of different lengths are never considered equal.
 *
 * @param {!Array.<T>} array1
 * @param {!Array.<T>} array2
 * @param {!function(T, T) : !boolean} comparer
 *
 * @returns {!boolean}
 *
 * @template T
 */
var arraysEqualBy = function(array1, array2, comparer) {
    return Array.isArray(array1) &&
        Array.isArray(array2) &&
        array1.length === array2.length &&
        zip(array1, array2, comparer).indexOf(false) === -1;
};

/**
 * Determines if the two given values are strictly equal.
 * @param {*} e1
 * @param {*} e2
 * @return {!boolean}
 */
var STRICT_EQUALITY = function(e1, e2) {
    return e1 === e2;
};

/**
 * @param {*} e1
 * @param {*} e2
 * @returns {!boolean}
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
