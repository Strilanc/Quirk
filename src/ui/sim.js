import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Config from "src/Config.js"
import CycleCircuitStats from "src/circuit/CycleCircuitStats.js"

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

let cache = new CycleCircuitStats(CircuitDefinition.EMPTY, Config.TIME_CACHE_GRANULARITY);

/**
 * @param {!CircuitDefinition} circuit
 * @returns {!CircuitStats}
 */
function simulate(circuit) {
    if (!cache.circuitDefinition.isEqualTo(circuit)) {
        cache = new CycleCircuitStats(circuit, Config.TIME_CACHE_GRANULARITY);
    }
    return cache.statsAtApproximateTime(getCircuitCycleTime());
}

export { simulate }
