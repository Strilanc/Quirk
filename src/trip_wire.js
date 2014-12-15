/**
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
