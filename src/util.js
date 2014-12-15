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
 * Checks a precondition.
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
 * @param {!int} i
 * @returns {!boolean}
 */
var isPowerOf2 = function(i) {
    return i > 0 && ((i - 1) & i) === 0;
};

/**
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
 * @param {!Array.<!number>} array
 * @returns {!number}
 */
var sum = function(array) {
    return array.reduce(function(e1, e2) { return e1 + e2; }, 0);
};

/**
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
 * @param {*} e1
 * @param {*} e2
 * @return {boolean}
 */
var STRICT_EQUALITY = function(e1, e2) {
    return e1 === e2;
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
