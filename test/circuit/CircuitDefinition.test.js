import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"

import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"

let suite = new Suite("CircuitStats");

suite.test("isEqualTo", () => {
    let c1 = new CircuitDefinition(2, [
        new GateColumn([null, Gates.Named.HalfTurns.H]),
        new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.Special.Control])
    ]);
    let c2 = new CircuitDefinition(2, [
        new GateColumn([null, Gates.Named.HalfTurns.H]),
        new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.Special.Control])
    ]);
    let d1 = new CircuitDefinition(2, [
        new GateColumn([null, Gates.Named.HalfTurns.X]),
        new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.Special.Control])
    ]);
    let d2 = new CircuitDefinition(2, [
        new GateColumn([null, Gates.Named.HalfTurns.H])
    ]);
    let d3 = new CircuitDefinition(3, [
        new GateColumn([null, Gates.Named.HalfTurns.X, null]),
        new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.Special.Control, null])
    ]);

    assertThat(c1).isEqualTo(c1);
    assertThat(c1).isEqualTo(c2);
    assertThat(c1).isNotEqualTo(d1);
    assertThat(c1).isNotEqualTo(d2);
    assertThat(c1).isNotEqualTo(d3);

    assertThat(new CircuitDefinition(2, [])).isEqualTo(new CircuitDefinition(2, []));
    assertThat(new CircuitDefinition(2, [])).isNotEqualTo(new CircuitDefinition(3, []));
});
