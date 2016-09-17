import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"

class CycleCircuitStats {
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!int} timeBucketCount
     */
    constructor(circuitDefinition, timeBucketCount) {
        /**
         * The circuit that these stats apply to.
         * @type {!CircuitDefinition}
         */
        this.circuitDefinition = circuitDefinition;

        /**
         * @type {!int}
         * @private
         */
        this._divisions = Math.min(timeBucketCount, Math.max(1, 1/circuitDefinition.stableDuration()));

        /**
         * @type {!Array.<?CircuitStats>}
         * @private
         */
        this._cachedCircuitStatsByTime = Seq.repeat(undefined, this._divisions).toArray();
    }

    /**
     * @param {!int} i
     * @returns {!CircuitStats}
     * @private
     */
    _computeStateForBucket(i) {
        let t = (i+0.5) / this._divisions;
        return CircuitStats.fromCircuitAtTime(this.circuitDefinition, t);
    }

    /**
     * @param {!number} t
     * @returns {!CircuitStats}
     */
    statsAtApproximateTime(t) {
        let i = Util.properMod(Math.round(t * this._divisions - 0.5), this._divisions);
        if (this._cachedCircuitStatsByTime[i] === undefined) {
            this._cachedCircuitStatsByTime[i] = this._computeStateForBucket(i);
        }
        return this._cachedCircuitStatsByTime[i].withTime(t);
    }
}

export {CycleCircuitStats}
