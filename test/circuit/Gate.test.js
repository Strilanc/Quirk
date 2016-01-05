import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import Gate from "src/circuit/Gate.js"

import Matrix from "src/math/Matrix.js"

let suite = new Suite("Gate");

suite.test("isEqualTo", () => {
    //noinspection JSUnusedLocalSymbols
    let f = _ => {};

    var g1 = new Gate("symbol", Matrix.PAULI_X, "name", "blurb", "details", f);
    var g2 = new Gate("symbol", Matrix.PAULI_X, "name", "blurb", "details", f);
    var h1 = new Gate("DIF_symbol", Matrix.PAULI_X, "name", "blurb", "details", f);
    var h2 = new Gate("symbol", t => Matrix.square([t, 0, 0, 0]), "name", "blurb", "details", f);
    var h3 = new Gate("symbol", Matrix.PAULI_X, "DIF_name", "blurb", "details", f);
    var h4 = new Gate("symbol", Matrix.PAULI_X, "name", "DIF_blurb", "details", f);
    var h5 = new Gate("symbol", Matrix.PAULI_X, "name", "blurb", "DIF_details", f);
    var h6 = new Gate("symbol", Matrix.PAULI_X, "name", "blurb", "details", _ => { throw null; });

    assertThat(g1).isEqualTo(g1);
    assertThat(g1).isEqualTo(g2);

    assertThat(g1).isNotEqualTo(h1);
    assertThat(g1).isNotEqualTo(h2);
    assertThat(g1).isNotEqualTo(h3);
    assertThat(g1).isNotEqualTo(h4);
    assertThat(g1).isNotEqualTo(h5);
    assertThat(g1).isNotEqualTo(h6);

    assertThat(h1).isNotEqualTo(g1);
    assertThat(h2).isNotEqualTo(g1);
    assertThat(h3).isNotEqualTo(g1);
    assertThat(h4).isNotEqualTo(g1);
    assertThat(h5).isNotEqualTo(g1);
    assertThat(h6).isNotEqualTo(g1);
});

suite.test("toString_runsWithoutFailing", () => {
    let g = new Gate("symbol", _ => Matrix.HADAMARD, "name", "blurb", "details", _ => {});
    assertThat(g.toString()).isNotEqualTo(null);
});

suite.test("isTimeBased", () => {
    let m0 = new Gate("symbol", Matrix.HADAMARD, "name", "blurb", "details", _ => {});
    let mt = new Gate("symbol", t => Matrix.square([t, 0, 0, 0]), "name", "blurb", "details", _ => {});

    assertFalse(m0.isTimeBased());
    assertTrue(mt.isTimeBased());
});

suite.test("matrixAt", () => {
    let m0 = new Gate("symbol", Matrix.HADAMARD, "name", "blurb", "details", _ => {});
    let mt = new Gate("symbol", t => Matrix.square([t, 0, 0, 0]), "name", "blurb", "details", _ => {});

    assertThat(m0.matrixAt(0)).isEqualTo(Matrix.HADAMARD);
    assertThat(m0.matrixAt(0.5)).isEqualTo(Matrix.HADAMARD);

    assertThat(mt.matrixAt(0)).isEqualTo(Matrix.square([0, 0, 0, 0]));
    assertThat(mt.matrixAt(0.5)).isEqualTo(Matrix.square([0.5, 0, 0, 0]));
});
