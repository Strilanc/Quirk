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
        state = aggregator(seed, items[i]);
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
    need(index >= 0 && index <= array.length);
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

function TripWire(message) {
    this.triggered = false;
    this.message = message;
}

/**
 * @param {!boolean|*} expression
 * @param {=Object} values
 */
TripWire.prototype.tripIf = function(expression, values) {
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

TripWire.prototype.try = function(func) {
    try {
        func();
    } catch (ex) {
        this.tripIf(false, ex);
    }
};

TripWire.wrap = function(msg, func) {
    var wire = new TripWire(msg);
    return function() {
        wire.try(func);
    };
};
