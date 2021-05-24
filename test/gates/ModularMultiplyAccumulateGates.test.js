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

import {Suite} from "../TestUtil.js"
import {assertThatGateActsLikePermutation} from "../CircuitOperationTestUtil.js"

import {ModularMultiplyAccumulateGates} from "../../src/gates/ModularMultiplyAccumulateGates.js"
import {Util} from "../../src/base/Util.js"

let suite = new Suite("ModularMultiplyAccumulateGates");

suite.testUsingWebGL('plus_AB_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularMultiplyAccumulateGates.PlusABModRFamily.ofSize(2),
        (t, a, b, r) => t < r ? (t + a*b) % r : t,
        [2, 2, 2]);
});

suite.testUsingWebGL('minus_AB_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularMultiplyAccumulateGates.MinusABModRFamily.ofSize(2),
        (t, a, b, r) => t < r ? Util.properMod(t - a*b, r) : t,
        [2, 2, 2]);
});
