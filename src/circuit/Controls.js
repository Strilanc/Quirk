import U from "src/base/Util.js"
import Seq from "src/base/Seq.js"

/**
 * Stores a set of requirements that a state's bits must meet.
 *
 * Mostly used for specifying the controls on an operation, i.e. which wires must be ON or OFF for it to apply.
 */
class Controls {
    /**
     * @param {!int} inclusionMask.
     * @param {!int} desiredValueMask
     * @property {!int} inclusionMask.
     * @property {!int} desiredValueMask
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
     * @returns {!Controls}
     */
    static fromBitIs(bitIndex, desiredValue) {
        U.need(bitIndex >= 0);
        return new Controls(1 << bitIndex, desiredValue ? (1 << bitIndex) : 0);
    };

    /**
     * @param {!Controls|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof Controls &&
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

        return "Controls: ...__" + Seq.naturals().
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
     * @returns {!int|Infinity}
     */
    includedBitCount() {
        let m = this.inclusionMask;
        if (m < 0) {
            return Infinity;
        }
        let n = 0;
        while (m > 0) {
            m &= m - 1;
            n++;
        }
        return n;
    }

    /**
     * @param {!Controls} other
     * @returns {!Controls}
     */
    combine(other) {
        U.need((other.desiredValueMask & this.inclusionMask) === (this.desiredValueMask & other.inclusionMask),
            "Can't combine contradictory controls.");
        return new Controls(
            this.inclusionMask | other.inclusionMask,
            this.desiredValueMask | other.desiredValueMask);
    };
}

/** @type {!Controls} */
Controls.NO_CONTROLS = new Controls(0, 0);

export default Controls;
