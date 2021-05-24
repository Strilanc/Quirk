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

import {Suite, assertThat} from "../TestUtil.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {CircuitStats} from "../../src/circuit/CircuitStats.js"
import {Serializer} from "../../src/circuit/Serializer.js"

let suite = new Suite("SampleDisplay");

suite.testUsingWebGL("SampleDisplay_SingleZero", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {"cols":[["Sample1"]]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.probabilities).isApproximatelyEqualTo([
        1,
        0,
    ]);
});
