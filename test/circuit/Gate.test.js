import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import Gate from "src/circuit/Gate.js"

import Matrix from "src/math/Matrix.js"

let suite = new Suite("Gate");

suite.test("isEqualTo", () => {
    let g1 = Gate.fromKnownMatrix("symbol", Matrix.PAULI_X, "name", "blurb");
    let g2 = Gate.fromKnownMatrix("symbol", Matrix.PAULI_X, "name", "blurb");
    let h1 = Gate.fromKnownMatrix("DIF_symbol", Matrix.PAULI_X, "name", "blurb");
    let h2 = Gate.fromVaryingMatrix("symbol", t => Matrix.square(t, 0, 0, 0), "name", "blurb");
    let h3 = Gate.fromKnownMatrix("symbol", Matrix.PAULI_X, "DIF_name", "blurb");
    let h4 = Gate.fromKnownMatrix("symbol", Matrix.PAULI_X, "name", "DIF_blurb");
    let h5 = Gate.fromKnownMatrix("symbol", Matrix.PAULI_X, "name", "blurb").withCustomDrawer(() => { throw null; });

    assertThat(g1).isEqualTo(g1);
    assertThat(g1).isEqualTo(g2);

    assertThat(g1).isNotEqualTo(h1);
    assertThat(g1).isNotEqualTo(h2);
    assertThat(g1).isNotEqualTo(h3);
    assertThat(g1).isNotEqualTo(h4);
    assertThat(g1).isNotEqualTo(h5);

    assertThat(h1).isNotEqualTo(g1);
    assertThat(h2).isNotEqualTo(g1);
    assertThat(h3).isNotEqualTo(g1);
    assertThat(h4).isNotEqualTo(g1);
    assertThat(h5).isNotEqualTo(g1);
});

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
