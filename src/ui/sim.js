/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CircuitDefinition} from "../circuit/CircuitDefinition.js"
import {Config} from "../Config.js"
import {CircuitStats} from "../circuit/CircuitStats.js"

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
