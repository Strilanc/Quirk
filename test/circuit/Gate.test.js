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
import {Gate, GateBuilder} from "../../src/circuit/Gate.js"

import {Matrix} from "../../src/math/Matrix.js"

let suite = new Suite("Gate");

suite.test("toString_runsWithoutFailing", () => {
    let g = new GateBuilder().setEffectToTimeVaryingMatrix(_ => Matrix.HADAMARD).gate;
    assertThat(g.toString()).isNotEqualTo(null);
});

suite.test("stableDuration", () => {
    let m0 = Gate.fromKnownMatrix("symbol", Matrix.HADAMARD, "name", "blurb");
    let mt = new GateBuilder().setEffectToTimeVaryingMatrix(t => Matrix.square(t, 0, 0, 0)).gate;

    assertThat(m0.stableDuration()).isEqualTo(Infinity);
    assertThat(mt.stableDuration()).isEqualTo(0);
});

suite.test("knownMatrixAt", () => {
    let m0 = Gate.fromKnownMatrix("symbol", Matrix.HADAMARD, "name", "blurb");
    let mt = new GateBuilder().setEffectToTimeVaryingMatrix(t => Matrix.square(t, 0, 0, 0)).gate;

    assertThat(m0.knownMatrixAt(0)).isEqualTo(Matrix.HADAMARD);
    assertThat(m0.knownMatrixAt(0.5)).isEqualTo(Matrix.HADAMARD);

    assertThat(mt.knownMatrixAt(0)).isEqualTo(Matrix.square(0, 0, 0, 0));
    assertThat(mt.knownMatrixAt(0.5)).isEqualTo(Matrix.square(0.5, 0, 0, 0));
});
