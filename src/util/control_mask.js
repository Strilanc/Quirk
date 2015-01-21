/**
 * A set of requirements that a state must meet.
 * @param {!int} inclusionMask.
 * @param {!int} desiredValueMask
 * @property {!int} inclusionMask
 * @property {!int} desiredValueMask
 * @constructor
 */
function ControlMask(inclusionMask, desiredValueMask) {
    need((desiredValueMask & ~inclusionMask) === 0, "Desired non-zero values but didn't include them.");
    this.inclusionMask = inclusionMask;
    this.desiredValueMask = desiredValueMask;
}

/** @type {!ControlMask} */
ControlMask.NO_CONTROLS = new ControlMask(0, 0);

/**
 * @param {!int} stateIndex
 * @returns {!boolean}
 */
ControlMask.prototype.allowsState = function(stateIndex) {
    return (this.inclusionMask & stateIndex) === this.desiredValueMask;
};

/**
 * @param {!int} bitIndex
 * @returns {?boolean}
 */
ControlMask.prototype.desiredValueFor = function(bitIndex) {
    if ((this.inclusionMask & (1 << bitIndex)) === 0) {
        return null;
    }
    return (this.desiredValueMask & (1 << bitIndex)) !== 0;
};

/**
 * @param {!int} bitIndex
 * @param {!boolean} desiredValue
 * @returns {!ControlMask}
 */
ControlMask.fromBitIs = function(bitIndex, desiredValue) {
    need(bitIndex >= 0);
    return new ControlMask(1 << bitIndex, desiredValue ? (1 << bitIndex) : 0);
};

/**
 * @param {!ControlMask} other
 * @returns {!ControlMask}
 */
ControlMask.prototype.combine = function(other) {
    need((other.desiredValueMask & this.inclusionMask) === (this.desiredValueMask & other.inclusionMask),
        "Can't combine contradictory controls.");
    return new ControlMask(this.inclusionMask | other.inclusionMask, this.desiredValueMask | other.desiredValueMask);
};

/**
 * @returns {!string}
 */
ControlMask.prototype.toString = function() {
    if (this.inclusionMask === 0) {
        return "No Controls";
    }

    var constraints = [];
    for (var i = 0; (1 << i) <= this.inclusionMask; i++) {
        if ((this.inclusionMask & (1 << i)) !== 0) {
            var b = (this.desiredValueMask & (1 << i)) !== 0;
            constraints.push("bit " + i + ": " + (b ? "on" : "off"));
        }
    }
    return constraints.join(", ");
};

/**
 * @param {!ControlMask|*} other
 * @returns {!boolean}
 */
ControlMask.prototype.isEqualTo = function(other) {
    return other instanceof ControlMask &&
        this.inclusionMask == other.inclusionMask &&
        this.desiredValueMask == other.desiredValueMask;
};
