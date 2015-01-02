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
    for (var i = 0; i < this.length; i++) {
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
