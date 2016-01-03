import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import Seq from "src/base/Seq.js"

export default class CycleCircuitStats {
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
        this._divisions = circuitDefinition.isTimeDependent() ? timeBucketCount : 1;

        /**
         * @type {!Array.<?CircuitStats>}
         * @private
         */
        this._cachedCircuitStatsByTime = Seq.repeat(null, this._divisions).toArray();
    }

    /**
     * @param {!int} i
     * @returns {!CircuitStats}
     * @private
     */
    _computeStateForBucket(i) {
        return CircuitStats.fromCircuitAtTime(this.circuitDefinition, i / this._divisions);
    }

    /**
     * @param {!number} t
     * @returns {!CircuitStats}
     */
    statsAtApproximateTime(t) {
        let i = Math.round(t * this._divisions) % this._divisions;
        if (this._cachedCircuitStatsByTime[i] === null) {
            this._cachedCircuitStatsByTime[i] = this._computeStateForBucket(i);
        }
        //noinspection JSValidateTypes
        return this._cachedCircuitStatsByTime[i];
    }
}
