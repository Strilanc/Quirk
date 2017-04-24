import {Suite, assertThat} from "test/TestUtil.js"
import {Gate, GateBuilder} from "src/circuit/Gate.js"

import {Matrix} from "src/math/Matrix.js"

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
