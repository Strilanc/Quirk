import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import CircuitStats from "src/circuit/CircuitStats.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/gates/AllGates.js"
import Matrix from "src/math/Matrix.js"

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

    ['-', null],
    ['+', null],
    ['|', null],
    ['/', null]
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
        filter(e => e !== Gates.Special.Measurement && e !== Gates.ErrorInjection && e.height <= 8).
        map(e => new GateColumn([e, null, null, null, null, null, null, null]));
    let c = new CircuitDefinition(8, cols);
    let stats = CircuitStats.fromCircuitAtTime(c, 0.1);
    assertThat(stats).isNotEqualTo(undefined);
});
