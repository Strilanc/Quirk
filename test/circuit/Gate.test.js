import {Suite, assertThat} from "test/TestUtil.js"
import {Gate} from "src/circuit/Gate.js"

import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("Gate");

suite.test("toString_runsWithoutFailing", () => {
    let g = Gate.fromVaryingMatrix("symbol", _ => Matrix.HADAMARD, "name", "blurb");
    assertThat(g.toString()).isNotEqualTo(null);
});

suite.test("stableDuration", () => {
    let m0 = Gate.fromKnownMatrix("symbol", Matrix.HADAMARD, "name", "blurb");
    let mt = Gate.fromVaryingMatrix("symbol", t => Matrix.square(t, 0, 0, 0), "name", "blurb");
    let mc = Gate.fromVaryingMatrix("symbol", t => Matrix.square(Math.round(t*2), 0, 0, 0), "name", "blurb").
        withStableDuration(0.5);

    assertThat(m0.stableDuration()).isEqualTo(Infinity);
    assertThat(mt.stableDuration()).isEqualTo(0);
    assertThat(mc.stableDuration()).isEqualTo(0.5);
});

suite.test("knownMatrixAt", () => {
    let m0 = Gate.fromKnownMatrix("symbol", Matrix.HADAMARD, "name", "blurb");
    let mt = Gate.fromVaryingMatrix("symbol", t => Matrix.square(t, 0, 0, 0), "name", "blurb");

    assertThat(m0.knownMatrixAt(0)).isEqualTo(Matrix.HADAMARD);
    assertThat(m0.knownMatrixAt(0.5)).isEqualTo(Matrix.HADAMARD);

    assertThat(mt.knownMatrixAt(0)).isEqualTo(Matrix.square(0, 0, 0, 0));
    assertThat(mt.knownMatrixAt(0.5)).isEqualTo(Matrix.square(0.5, 0, 0, 0));
});
