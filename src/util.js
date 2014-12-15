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

function TripWire(message) {
    this.triggered = false;
    this.message = message;
    this.markCount = 0;
    this.markLabel = "";
}

/**
 * @param {!boolean|*} expression
 * @param {=Object} values
 */
TripWire.prototype.tripUnless = function(expression, values) {
    if (this.triggered) {
        return;
    }
    if (expression !== true) {
        this.triggered = true;
        if (values === undefined) {
            alert(this.message);
        } else {
            alert(this.message + ": " + (values === null ? "null" : values.toString()));
        }
    }
};

TripWire.prototype.run = function(func) {
    try {
        this.markCount = 1;
        this.markLabel = "";
        func();
        this.markCount = 0;
        this.markLabel = "";
    } catch (ex) {
        if (this.markCount > 0) {
            this.tripUnless(false, "error: " + ex + ", mark: " + this.markLabel + ", markId: " + this.markCount);
        } else {
            this.tripUnless(false, ex);
        }
        throw ex;
    }
};

TripWire.prototype.wrap = function(func) {
    var wire = this;
    return function() {
        wire.run(func);
    };
};

TripWire.prototype.mark = function(markLabel) {
    this.tripUnless(this.markCount !== 0, "mark outside of run");
    this.markCount += 1;
    this.markLabel = markLabel;
};
