import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import Serializer from "src/circuit/Serializer.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Complex from "src/math/Complex.js"
import Format from "src/base/Format.js"
import Gate from "src/circuit/Gate.js"
import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"

let suite = new Suite("Serializer");

let assertRoundTrip = (t, v, s) => {
    assertThat(Serializer.fromJson(t, s)).isEqualTo(v);
    assertThat(Serializer.toJson(v)).isEqualTo(s);
};

suite.test("roundTrip_Complex", () => {
    assertRoundTrip(Complex, new Complex(1, 0), "1");
    assertRoundTrip(Complex, new Complex(2, -3), "2-3i");
    assertRoundTrip(Complex, Complex.I, "i");
    assertRoundTrip(Complex, new Complex(0, -1), "-i");
    assertRoundTrip(Complex, new Complex(1/3, 0), "\u2153");
    assertRoundTrip(Complex, new Complex(1/3+0.00001, 0), "0.3333433333333333");
});

suite.test("roundTrip_Matrix", () => {
    assertRoundTrip(Matrix, Matrix.row([1, Complex.I]), "{{1,i}}");
    assertRoundTrip(Matrix, Matrix.col([1, Complex.I]), "{{1},{i}}");
    assertRoundTrip(Matrix, Matrix.square([1/3+0.00001, Complex.I.plus(1), -1/3, 0]),
        "{{0.3333433333333333,1+i},{-\u2153,0}}");
});

suite.test("roundTrip_Gate", () => {
    assertRoundTrip(Gate, Gates.Named.HalfTurns.X, "X");
    for (let g of Gates.KnownToSerializer) {
        assertRoundTrip(Gate, g, g.symbol);
    }

    let f = Gates.Named.Silly.FUZZ_MAKER();
    assertThat(Serializer.fromJson(Gate, Serializer.toJson(f))).isEqualTo(f);

    let g = new Gate(
        "custom_id",
        Matrix.square([Complex.I, -1, 2, 3]),
        "custom_name",
        "custom_blurb",
        "custom_details",
        Gate.CYCLE_DRAWER);
    let v = Serializer.toJson(g);
    let g2 = Serializer.fromJson(Gate, v);
    assertThat(v).isEqualTo({id: "custom_id", matrix: "{{i,-1},{2,3}}"});
    assertThat(g.matrixAt(0)).isEqualTo(g2.matrixAt(0));
    assertThat(g.symbol).isEqualTo(g2.symbol);
});

suite.test("roundTrip_GateColumn", () => {
    assertRoundTrip(
        GateColumn,
        new GateColumn([
            null,
            Gates.Named.HalfTurns.X,
            Gates.Named.Evolving.X,
            Gates.Named.Special.SwapHalf,
            Gates.Named.Special.Control,
            null]),
        [1, "X", "X(t)", "Swap", "\u2022", 1]);
});

suite.test("roundTrip_circuitDefinition", () => {
    assertRoundTrip(
        CircuitDefinition,
        new CircuitDefinition(
            7,
            [new GateColumn([null, Gates.Named.HalfTurns.X, null, null, null, null, null])]),
        {wires: 7, cols: [[1, "X"]]});
});
