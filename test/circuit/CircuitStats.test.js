import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import CircuitStats from "src/circuit/CircuitStats.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"

let suite = new Suite("CircuitStats");

suite.webGlTest("smoke", () => {
    let circuit = new CircuitDefinition(2, [
        new GateColumn([null, Gates.Named.HalfTurns.H]),
        new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.Special.Control])
    ]);
    let stats = CircuitStats.fromCircuitAtTime(circuit, 0.5);
    assertThat(stats.circuitDefinition).isEqualTo(circuit);
    assertThat(stats.time).isEqualTo(0.5);
    assertThat(stats.wireProbabilities).isApproximatelyEqualTo([
        [0, 0],
        [0, 0.5],
        [0.5, 0.5]
    ]);
    assertThat(stats.finalState).isApproximatelyEqualTo([Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]);
});
