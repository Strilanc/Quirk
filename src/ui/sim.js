import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {Config} from "src/Config.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"

const getCircuitCycleTime = (() => {
    /**
     * Milliseconds.
     * @type {!number}
     */
    let _circuitCycleTime = 0;
    /**
     * Milliseconds.
     * @type {!number}
     */
    let _prevRealTime = performance.now();

    return () => {
        let nextRealTime = performance.now();
        let elapsed = (nextRealTime - _prevRealTime) / Config.CYCLE_DURATION_MS;
        _circuitCycleTime += elapsed;
        _circuitCycleTime %= 1;
        _prevRealTime = nextRealTime;
        return _circuitCycleTime;
    };
})();

/** @type {undefined|!CircuitStats} */
let _cachedStats = undefined;

/**
 * @param {!CircuitDefinition} circuit
 * @returns {!CircuitStats}
 */
function simulate(circuit) {
    if (_cachedStats !== undefined && _cachedStats.circuitDefinition.isEqualTo(circuit)) {
        return _cachedStats.withTime(getCircuitCycleTime());
    }

    _cachedStats = undefined;
    let result = CircuitStats.fromCircuitAtTime(circuit, getCircuitCycleTime());
    if (circuit.stableDuration() === Infinity) {
        _cachedStats = result;
    }
    return result;
}

export {simulate, getCircuitCycleTime}
