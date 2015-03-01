import U from "src/base/Util.js"
import Seq from "src/base/Seq.js"

/**
 * Stores a set of requirements that a state's bits must meet.
 */
export default class ControlMask {
    /**
     * @param {!int} inclusionMask.
     * @param {!int} desiredValueMask
     */
    constructor(inclusionMask, desiredValueMask) {
        U.need((desiredValueMask & ~inclusionMask) === 0, "Desired non-zero values but didn't include them.");
        /** @type {!int} */
        this.inclusionMask = inclusionMask;
        /** @type {!int} */
        this.desiredValueMask = desiredValueMask;
    }

    /**
     * @param {!int} bitIndex
     * @param {!boolean} desiredValue
     * @returns {!ControlMask}
     */
    static fromBitIs(bitIndex, desiredValue) {
        U.need(bitIndex >= 0);
        return new ControlMask(1 << bitIndex, desiredValue ? (1 << bitIndex) : 0);
    };

    /**
     * @param {!ControlMask|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof ControlMask &&
            this.inclusionMask == other.inclusionMask &&
            this.desiredValueMask == other.desiredValueMask;
    };

    /**
     * @returns {!string}
     */
    toString() {
        if (this.inclusionMask === 0) {
            return "No Controls";
        }

        return "ControlMask: ...__" + Seq.naturals().
            takeWhile(i => (1<<i) <= this.inclusionMask).
            map(this.desiredValueFor.bind(this)).
            map(e => e === null ? "_" : e ? "1" : "0").
            reverse().
            join("");
    };

    /**
     * @param {!int} stateIndex
     * @returns {!boolean}
     */
    allowsState(stateIndex) {
        return (this.inclusionMask & stateIndex) === this.desiredValueMask;
    };

    /**
     * @param {!int} bitIndex
     * @returns {?boolean}
     */
    desiredValueFor(bitIndex) {
        if ((this.inclusionMask & (1 << bitIndex)) === 0) {
            return null;
        }
        return (this.desiredValueMask & (1 << bitIndex)) !== 0;
    };

    /**
     * @param {!ControlMask} other
     * @returns {!ControlMask}
     */
    combine(other) {
        U.need((other.desiredValueMask & this.inclusionMask) === (this.desiredValueMask & other.inclusionMask),
            "Can't combine contradictory controls.");
        return new ControlMask(
            this.inclusionMask | other.inclusionMask,
            this.desiredValueMask | other.desiredValueMask);
    };
}

/** @type {!ControlMask} */
ControlMask.NO_CONTROLS = new ControlMask(0, 0);
