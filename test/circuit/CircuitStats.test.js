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

const TEST_GATES = new Map([
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
]);
const circuit = diagram => CircuitDefinition.fromTextDiagram(TEST_GATES, diagram);

suite.webGlTest("smoke", () => {
    let c = circuit(`--X-H---•⊕-
                     --•-H---XX-
                     -H--M--@---`);
    let stats = CircuitStats.fromCircuitAtTime(c, 0.1);
    assertTrue(stats.circuitDefinition.colHasControls(2));
    assertThat(stats.qubitDensityMatrix(2, 7)).isEqualTo(Matrix.square(0.5, 0, 0, 0.5));
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
    assertThat(stats.qubitDensityMatrix(0, Infinity)).isEqualTo(off);
    assertThat(stats.qubitDensityMatrix(1, Infinity)).isEqualTo(on);
    assertThat(stats.qubitDensityMatrix(2, Infinity)).isEqualTo(off);
});
