import U from "src/util/util.js";

export default class Au {
    /**
     * Determines if an object can be iterated and has a length.
     * @param {*|!(T[])} obj
     * @returns {!boolean}
     * @template T
     */
    static isArrayLike(obj) {
        //noinspection JSUnresolvedVariable
        return obj[Symbol.iterator] !== undefined && obj.hasOwnProperty("length");
    };

    /**
     * Returns a string representation of the array.
     * @param {!(T[])} array The array to operate on.
     * @returns {!string}
     * @template T
     */
    static describe(array) {
        return `[${ array.join(", ") }]`;
    };

    /**
     * Returns an array containing the given item the given number of times.
     * @param {T} item
     * @param {!int} repeatCount
     * @returns {!(T[])}
     * @template T
     */
    static repeat(item, repeatCount) {
        return Au.range(repeatCount).map(_ => item);
    };

    /**
     * Returns an array of the first n natural numbers, in order from 0 to n-1.
     * @param {!int} n
     * @returns {!(!int[])}
     */
    static range(n) {
        U.need(n >= 0, "range: n >= 0");
        let result = [];
        for (let i = 0; i < n; i++) {
            result.push(i);
        }
        return result;
    };

    /**
     * Returns the first item in the given array that causes the given predicate to return true.
     *
     * If no items match the predicate, an alternative value is returned (defaults to undefined).
     *
     * @param {!(T[])} array The array to operate on.
     * @param {!function(T) : !boolean} predicate
     * @param {=A} alternative
     * @returns {T|A}
     * @template T, A
     */
    static firstMatchElse(array, predicate, alternative = undefined) {
        U.need(Au.isArrayLike(array), "isArrayLike(array)");
        for (let item of array) {
            if (predicate(item)) {
                return item;
            }
        }
        return alternative;
    };

    ///**
    // * Returns the largest value in the array, as determined by the `<` operator.
    // *
    // * If the array is empty, -Infinity is returned.
    // *
    // * @param {!(T[])} array The array to operate on.
    // * @returns {T}
    // * @template T
    // */
    //static max(array) {
    //    if (array.length === 0) {
    //        return -Infinity;
    //    }
    //
    //    var result = array[0];
    //    for (var i = 1; i < array.length; i++) {
    //        if (result < array[i]) {
    //            result = array[i];
    //        }
    //    }
    //    return result;
    //};
    //
    ///**
    // * Returns the highest-scoring item in a collection, as determined by a scoring function.
    // *
    // * The iterable must have at least one item, and the scores must be comparable by the '<' operator.
    // *
    // * @param {!(T[])} iterable The iterable to operate on.
    // * @param {!function(T) : !number} projection The scoring function.
    // * @returns {T}
    // * @template T
    // */
    //static maxBy(iterable, projection) {
    //    let curMaxItem;
    //    let curMaxScore;
    //    let hasMaxScore = false;
    //    for (let item of iterable) {
    //        // Special handling for first/second item
    //        if (!hasMaxScore) {
    //            // Delay computing the score for the first item, so that singleton lists never touch the score function
    //            if (hasMaxScore === false) {
    //                curMaxItem = item;
    //                hasMaxScore = null;
    //                continue;
    //            }
    //            curMaxScore = projection(curMaxItem);
    //        }
    //
    //        let score = projection(item);
    //        if (score > curMaxScore) {
    //            curMaxItem = item;
    //            curMaxScore = score;
    //        }
    //    }
    //
    //    need(hasMaxScore !== false, "iterable.length > 0");
    //
    //    return curMaxItem;
    //};
    //
    ///**
    // * Combines two arrays together by pairing items with the same index and running them through a combining function.
    // * If one array is longer than the other, the lonely tail is discarded.
    // *
    // * @param {!(T1[])} array1
    // * @param {!(T2[])} array2
    // * @param {!function(T1, T2) : R} combiner
    // *
    // * @returns {!(R[])}
    // *
    // * @template T1, T2, R
    // */
    //static zip(array1, array2, combiner) {
    //    return range(Math.min(array1.length, array2.length)).map(i => combiner(array1[i], array2[i]));
    //};
    //
    ///**
    // * Determines if an array contains a given value or not.
    // * @param {!(T[])} array The array to operate on.
    // * @param {T} value
    // * @returns {!boolean}
    // * @template T
    // */
    //static contains(array, value) {
    //    return array.indexOf(value) !== -1;
    //};
    //
    ///**
    // * Determines if two arrays contain the same items in the same order, as determined by the given equality comparer.
    // * Arrays of different lengths are never considered equal.
    // *
    // * @param {*|!(T[])} array1
    // * @param {*|!(T[])} array2
    // * @param {!function(T, T) : !boolean} comparer
    // *
    // * @returns {!boolean}
    // *
    // * @template T
    // */
    //static equateBy(array1, array2, comparer) {
    //    return Array.isArray(array1) &&
    //        Array.isArray(array2) &&
    //        array1.length === array2.length &&
    //        !zip(array1, array2, comparer).contains(false);
    //};
    //
    ///**
    // * Adds up the numbers in the given array, using the `+` operator, and returns the total.
    // * The empty array's sum is defined to be 0, to satisfy the invariant that sum(X.concat([s])) = sum(X) + s.
    // * @param {!(T[])} array
    // * @returns {!number}
    // * @template T
    // */
    //static sum(array) {
    //    return array.reduce((e1, e2) => e1 + e2, 0);
    //};
    //
    ///**
    // * Determines if any of the items in this array match the given predicate.
    // * @param {!function(T) : !boolean} predicate
    // * @param {!(T[])} array
    // * @returns {!boolean}
    // * @template T
    // */
    //static any(array, predicate) {
    //    return !array.every(e => !predicate(e));
    //};
    //
    ///**
    // * Flattens this array of arrays into a single-level array with the same items.
    // * @param {*} array
    // * @returns {!(T[])}
    // * @template T
    // */
    //static flatten(array) {
    //    return [].concat.apply([], array);
    //};
    //
    ///**
    // * Returns a new array, with the same items as the receiving array.
    // * @param {!(T[])} array
    // * @returns {!(T[])}
    // * @template T
    // */
    //static clone(array) {
    //    return array.map(e => e);
    //};
    //
    ///**
    // * Runs an aggregating function over the receiving array, returning the accumulated value at each point (including the
    // * seed). For example, [1, 2, 3].scan(add) returns [0, 1, 3, 6].
    // *
    // * @param {!(T[])} array
    // * @param {S} seed
    // * @param {!function(S, T) : S} aggregator
    // *
    // * @template T, S
    // *
    // * @returns {!Array<S>}
    // */
    //static scan(array, seed, aggregator) {
    //    var result = [];
    //    result.push(seed);
    //
    //    var state = seed;
    //    array.forEach(e => {
    //        state = aggregator(state, e);
    //        result.push(state);
    //    });
    //    return result;
    //};
    //
    ///**
    // * Mutates the receiving array, pushing items at or past the given index ahead and placing the given item in the new
    // * space.
    // *
    // * @param {!(T[])} array
    // * @param {!int} index
    // * @param {T} item
    // *
    // * @template T
    // */
    //static insertAt(array, index, item) {
    //    need(index >= 0 && index <= array.length, "insertAt: index >= 0 && index <= array.length");
    //    array.splice(index, 0, item);
    //};
    //
    ///**
    // * Returns a copy of the receiving array, except the item at the given index is swapped out for the given item.
    // *
    // * @param {!(T[])} array
    // * @param {!int} index
    // * @param {T} item
    // *
    // * @returns {!(T[])}
    // *
    // * @template T
    // */
    //static withItemReplacedAtBy(array, index, item) {
    //    need(index >= 0 && index < array.length, "withItemReplacedAt: index >= 0 && index < array.length");
    //    var result = clone(array);
    //    result[index] = item;
    //    return result;
    //};
    //
    ///**
    // * Returns an array with the same items, except later items with the same key as earlier items get skipped.
    // *
    // * @param {!(T[])} array
    // * @param {!function(T) : K} keySelector Must return values of a type that can be indexed (e.g. ints or strings).
    // * @returns {!(T[])}
    // * @template T, K
    // */
    //static distinctBy(array, keySelector) {
    //    if (array.length <= 1) {
    //        return clone(array);
    //    }
    //
    //    //noinspection JSUnresolvedFunction
    //    var keySet = new Set();
    //    return array.filter(e => {
    //        var key = keySelector(e);
    //        if (keySet.has(key)) {
    //            return false;
    //        }
    //        keySet.add(key);
    //        return true;
    //    });
    //};
    //
    ///**
    // * Returns an array with the same items, except duplicate items are omitted. The array items must be usable as property
    // * keys.
    // *
    // * @param {!(T[])} array
    // * @returns {!(T[])}
    // * @template T
    // */
    //static distinct(array) {
    //    return distinctBy(array, e => e);
    //};
    //
    ///**
    // * Returns the single item in the receiving array, or else returns undefined.
    // *
    // * @param {!(T[])} array
    // * @param {R} alternative
    // * @returns {T|R}
    // * @template T, R
    // */
    //static singleElse(array, alternative = undefined) {
    //    let iter = array[Symbol.iterator];
    //
    //    let first = iter.next();
    //    if (first.done || !iter.next().done) {
    //        return alternative;
    //    }
    //
    //    return first.value;
    //};
    //
    ///**
    // * Returns an array starting with the same items, but padded up to the given length with the given item. If the array
    // * is already past the length, the returned array is equivalent.
    // * @param {!(T[])} array
    // * @param {T} item
    // * @param {!int} minimumLength
    // * @returns {!(T[])}
    // * @template T
    // */
    //static paddedWithTo(array, item, minimumLength) {
    //    need(isInt(minimumLength) && minimumLength >= 0, "non-negative min length", arguments);
    //    var result = clone(array);
    //    while (result.length < minimumLength) {
    //        result.push(item);
    //    }
    //    return result;
    //};
    //
    ///**
    // * @param {!Float32Array|!Uint8Array} arrayLike
    // * @type {Float32Array.toArray|*|Function}
    // */
    //static toArray(arrayLike ) {
    //    return Array.prototype.slice.call(arrayLike);
    //};
    //
    ///**
    // * @param {!(T[])} array
    // * @param {!function(T): R} valueSelector
    // * @returns {!object}
    // * @template T, R
    // */
    //static mapKeysTo(array, valueSelector) {
    //    var map = new Map();
    //    for (let key of array) {
    //        map[key] = valueSelector(key);
    //    }
    //    return map;
    //};
}
