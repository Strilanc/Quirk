import {Suite, assertThat, assertTrue, assertFalse} from "test/TestUtil.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {Serializer} from "src/circuit/Serializer.js"

let suite = new Suite("CircuitStats");

const circuit = (diagram, ...extras) => CircuitDefinition.fromTextDiagram(new Map([
    ...extras,
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
    ['•', Gates.Controls.Control],
    ['⊕', Gates.Controls.PlusControl],

    ['M', Gates.Special.Measurement],
    ['@', Gates.Displays.BlochSphereDisplay],

    ['-', undefined],
    ['+', undefined],
    ['|', undefined],
    ['/', undefined]
]), diagram);

suite.webGlTest("smoke", () => {
    let c = circuit(`--X-H---•⊕-
                     --•-H---XX-
                     -H--M--@---`);
    let stats = CircuitStats.fromCircuitAtTime(c, 0.1);
    assertTrue(stats.circuitDefinition.colHasControls(2));
    assertThat(stats.qubitDensityMatrix(7, 2)).isEqualTo(Matrix.square(0.5, 0, 0, 0.5));
});

suite.webGlTest("all-gates-in-sequence", () => {
    let cols = Gates.KnownToSerializer.
        filter(e => e !== Gates.Special.Measurement && e !== Gates.ErrorInjection && e.height <= 6).
        map(e => new GateColumn([e, undefined, undefined, undefined, undefined, undefined]));
    let c = new CircuitDefinition(6, cols);
    let stats = CircuitStats.fromCircuitAtTime(c, 0.1);
    assertThat(stats).isNotEqualTo(undefined);
});

suite.webGlTest("nested-addition-gate", () => {
    let circuitDef = Serializer.fromJson(
        CircuitDefinition,
        {cols:[[1,"X"],[1,"~f2fa"]],gates:[{id:"~f2fa",circuit:{cols:[["+=A1","inputA1"]]}}]});
    let stats = CircuitStats.fromCircuitAtTime(circuitDef, 0);
    let off = Matrix.square(1, 0, 0, 0);
    let on = Matrix.square(0, 0, 0, 1);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isEqualTo(off);
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isEqualTo(on);
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isEqualTo(off);
});

suite.webGlTest('controlled-displays', () => {
    let c = circuit(`-H-•-@@-
                     ---X-⊕•-`);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(5, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5));
    assertThat(stats.qubitDensityMatrix(6, 0)).isApproximatelyEqualTo(Matrix.square(0, 0, 0, 1));
});

suite.webGlTest('incoherent-amplitude-display', () => {
    let c = circuit(`-H-•-a-
                     ---X---`, ['a', Gates.Displays.AmplitudeDisplayFamily.ofSize(1)]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.customStatsForSlot(5, 0)).isApproximatelyEqualTo({
        probabilities: Matrix.row(1, 1).times(Math.sqrt(0.5)),
        superposition: undefined,
        phaseLockIndex: undefined
    });
});

suite.webGlTest('probability-display', () => {
    let c = circuit(`-H-•-%-
                     ---X-/-`, ['%', Gates.Displays.ProbabilityDisplayFamily.ofSize(2)]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.customStatsForSlot(5, 0)).isApproximatelyEqualTo(
        Matrix.col(0.5, 0, 0, 0.5));
});

suite.webGlTest('density-display', () => {
    let c = circuit(`-d/-
                     -//-`, ['d', Gates.Displays.DensityMatrixDisplayFamily.ofSize(2)]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.customStatsForSlot(1, 0)).isApproximatelyEqualTo(
        Matrix.square(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0));
});

suite.webGlTest('shifted-density-display', () => {
    let c = circuit(`----
                     -d/-
                     -//-`, ['d', Gates.Displays.DensityMatrixDisplayFamily.ofSize(2)]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.customStatsForSlot(1, 1)).isApproximatelyEqualTo(
        Matrix.square(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0));
});
