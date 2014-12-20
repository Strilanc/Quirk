/**
 * Utility class for raising an alert just once when something goes wrong.
 * @param {!string} message
 * @constructor
 */
function TripWire(message) {
    this.triggered = false;
    this.message = message;
    this.markCount = 0;
    this.markLabel = "";
}

/**
 * Trips the receiving wire's alert if the given expression is not true.
 * @param {!boolean|*} expression
 * @param {=Object} value
 */
TripWire.prototype.tripUnless = function(expression, value) {
    if (this.triggered) {
        return;
    }
    if (expression !== true) {
        this.triggered = true;
        if (value === undefined) {
            alert(this.message);
        } else {
            alert(this.message + ": " + (value === null ? "null" : value.toString()));
        }
    }
};

/**
 * Invokes a 0-arg function, tripping the receiving wire's alert if the function throws an exception.
 * The exception is propagated.
 *
 * The alert will also mention the trip wire's last mark.
 *
 * @param {!function() : T} func
 * @returns T
 * @template T
 */
TripWire.prototype.run = function(func) {
    try {
        this.markCount = 1;
        this.markLabel = "";
        var r = func();
        this.markCount = 0;
        this.markLabel = "";
        return r;
    } catch (ex) {
        if (this.markCount > 0) {
            this.tripUnless(false, "error: " + ex + ", mark: " + this.markLabel + ", markId: " + this.markCount);
        } else {
            this.tripUnless(false, ex);
        }
        throw ex;
    }
};

/**
 * Returns the same 0-arg function, except wrapped to run with the receiving trip wire's run method.
 * @param {!function() : R} func
 * @returns {!function() : R}
 * @template R
 */
TripWire.prototype.wrap0 = function(func) {
    var wire = this;
    return function() {
        wire.run(func);
    };
};

/**
 * Returns the same 1-arg function, except wrapped to run with the receiving trip wire's run method.
 * @param {!function(T1) : R} func
 * @returns {!function(T1) : R}
 * @template T1, R
 */
TripWire.prototype.wrap1 = function(func) {
    var wire = this;
    return function(e) {
        wire.run(function() { return func(e); });
    };
};

/**
 * Updates the additional provided when the wire trips due to an exception being caught.
 * @param {!string} markLabel
 */
TripWire.prototype.mark = function(markLabel) {
    this.tripUnless(this.markCount !== 0, "mark outside of run");
    this.markCount += 1;
    this.markLabel = markLabel;
};
