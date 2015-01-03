/**
 * @returns {!string}
 */
Array.prototype.toArrayString = function() {
    return "[" + this.join(", ") + "]";
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
 * Returns an array of the first n natural numbers, in order from 0 to n-1.
 * @param {!int} n
 * @returns {!Array.<!int>}
 */
var range = function(n) {
    need(n >= 0, "range: n >= 0");
    var result = [];
    while (result.length < n) {
        result.push(result.length);
    }
    return result;
};

/**
 * Returns the first item in the given array that causes the given predicate to return true.
 *
 * If no items match the predicate, undefined is returned.
 *
 * @param {!function(T) : !boolean} predicate
 * @returns {undefined|T}
 * @template T
 */
Array.prototype.firstMatchElseUndefined = function(predicate) {
    for (var i = 0; i < this.length; i++) {
        var item = this[i];
        if (predicate(item)) {
            return item;
        }
    }
    return undefined;
};


/**
 * Returns the largest value in the array, as determined by the `<` operator.
 *
 * If the array is empty, -Infinity is returned.
 *
 * @returns {T}
 * @template T
 */
Array.prototype.max = function() {
    if (this.length === 0) {
        return -Infinity;
    }

    var result = this[0];
    for (var i = 1; i < this.length; i++) {
        if (result < this[i]) {
            result = this[i];
        }
    }
    return result;
};

/**
 * Returns the highest-scoring item in an array, as determined by a scoring function.
 *
 * The array must have at least one item, and the scores must be comparable by the '<' operator.
 *
 * @param {!function(T) : !number} projection The scoring function.
 * @returns {T}
 * @template T
 */
Array.prototype.maxBy = function(projection) {
    need(this.length > 0, "maxBy: items.length > 0");
    if (this.length === 1) {
        return this[0];
    }

    var curMaxItem = this[0];
    var curMaxScore = projection(this[0]);
    for (var i = 1; i < this.length; i++) {
        var item = this[i];
        var score = projection(item);
        if (score > curMaxScore) {
            curMaxItem = item;
            curMaxScore = score;
        }
    }

    return curMaxItem;
};

/**
 * Combines two arrays together by pairing items with the same index and running them through a combining function.
 * If one array is longer than the other, the lonely tail is discarded.
 *
 * @param {!Array.<T2>} otherArray
 * @param {!function(T1, T2) : R} combiner
 *
 * @returns {!Array.<R>}
 *
 * @template T1, T2, R
 */
Array.prototype.zip = function(otherArray, combiner) {
    var thisArray = this;
    return range(Math.min(thisArray.length, otherArray.length))
        .map(function(i) { return combiner(thisArray[i], otherArray[i]); });
};

/**
 * Determines if this array contains a given value or not.
 * @param {*} value
 * @returns {!boolean}
 */
Array.prototype.contains = function(value) {
    return this.indexOf(value) !== -1;
};

/**
 * Determines if two arrays contain the same items in the same order, as determined by the given equality comparer.
 * Arrays of different lengths are never considered equal.
 *
 * @param {*|!Array.<T>} otherArray
 * @param {!function(T, T) : !boolean} comparer
 *
 * @returns {!boolean}
 *
 * @template T
 */
Array.prototype.isEqualToBy = function(otherArray, comparer) {
    return Array.isArray(otherArray) &&
        this.length === otherArray.length &&
        !this.zip(otherArray, comparer).contains(false);
};

/**
 * Adds up the numbers in the given array, using the `+` operator, and returns the total.
 * The empty array's sum is defined to be 0, to satisfy the invariant that sum(X.concat([s])) = sum(X) + s.
 * @returns {!number}
 */
Array.prototype.sum = function() {
    return this.reduce(function(e1, e2) { return e1 + e2; }, 0);
};

/**
 * Determines if any of the items in this array match the given predicate.
 * @param {!function(T) : !boolean} predicate
 * @returns {!boolean}
 * @template T
 */
Array.prototype.any = function(predicate) {
    return !this.every(function(e) { return !predicate(e); });
};

/**
 * Flattens this array of arrays into a single-level array with the same items.
 * @returns {Array.<T>}
 * @template T
 */
Array.prototype.flatten = function() {
    return [].concat.apply([], this);
};

/**
 * Returns a new array, with the same items as the receiving array.
 * @returns {!Array<T>}
 * @template T
 */
Array.prototype.clone = function() {
    return this.map(function(e) { return e; });
};

/**
 * Runs an aggregating function over the receiving array, returning the accumulated value at each point (including the
 * seed). For example, [1, 2, 3].scan(add) returns [0, 1, 3, 6].
 *
 * @param {S} seed
 * @param {!function(S, T) : S} aggregator
 *
 * @template T, S
 *
 * @returns {!Array.<S>}
 */
Array.prototype.scan = function(seed, aggregator) {
    var result = [];
    result.push(seed);

    var state = seed;
    this.forEach(function(e) {
        state = aggregator(state, e);
        result.push(state);
    });
    return result;
};

/**
 * Mutates the receiving array, pushing items at or past the given index ahead and placing the given item in the new
 * space.
 *
 * @param {!int} index
 * @param {T} item
 *
 * @template T
 */
Array.prototype.insertAt = function(index, item) {
    need(index >= 0 && index <= this.length, "insertAt: index >= 0 && index <= this.length");
    this.splice(index, 0, item);
};

/**
 * Returns a copy of the receiving array, except the item at the given index is swapped out for the given item.
 *
 * @param {!int} index
 * @param {T} item
 *
 * @returns {!Array<T>}
 *
 * @template T
 */
Array.prototype.withItemReplacedAtBy = function(index, item) {
    need(index >= 0 && index < this.length, "withItemReplacedAt: index >= 0 && index < this.length");
    var result = this.clone();
    result[index] = item;
    return result;
};

/**
 * Returns an array with the same items, except later items with the same key as earlier items get skipped.
 *
 * @param {!function(T) : K} keySelector Must return values of a type that can be indexed (e.g. ints or strings).
 * @returns {!Array.<T>}
 * @template T, K
 */
Array.prototype.distinctBy = function(keySelector) {
    if (this.length <= 1) {
        return this.clone();
    }

    var keySet = {};
    return this.filter(function(e) {
        var key = keySelector(e);
        if (keySet.hasOwnProperty(key)) {
            return false;
        }
        keySet[key] = true;
        return true;
    });
};

/**
 * Returns an array with the same items, except duplicate items are omitted. The array items must be usable as property
 * keys.
 *
 * @returns {!Array.<T>}
 * @template T
 */
Array.prototype.distinct = function() {
    return this.distinctBy(function(e) { return e; });
};

/**
 * Returns the single item in the receiving array, or else returns undefined.
 *
 * @returns {T}
 * @template T
 */
Array.prototype.singleElseUndefined = function() {
    return this.length === 1 ? this[0] : undefined;
};
