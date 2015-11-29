import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import GateColumn from "src/circuit/GateColumn.js"

import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"

let suite = new Suite("GateColumn");

suite.test("isEqualTo", () => {
    // Trivial case:
    assertThat(GateColumn.empty(1)).isEqualTo(GateColumn.empty(1));
    assertThat(GateColumn.empty(2)).isNotEqualTo(GateColumn.empty(1));

    // Equivalence groups:
    let groups = [
        [GateColumn.empty(0), GateColumn.empty(0), new GateColumn([]), new GateColumn([])],
        [GateColumn.empty(1), GateColumn.empty(1), new GateColumn([null]), new GateColumn([null])],
        [GateColumn.empty(2), GateColumn.empty(2), new GateColumn([null, null]), new GateColumn([null, null])],
        [new GateColumn([Gates.Named.HalfTurns.X]), new GateColumn([Gates.Named.HalfTurns.X])],
        [new GateColumn([Gates.Named.Special.Control]), new GateColumn([Gates.Named.Special.Control])],
        [new GateColumn([Gates.Named.HalfTurns.X, null]), new GateColumn([Gates.Named.HalfTurns.X, null])],
        [new GateColumn([null, Gates.Named.HalfTurns.X]), new GateColumn([null, Gates.Named.HalfTurns.X])]
    ];
    for (let g1 of groups) {
        for (let g2 of groups) {
            for (let e1 of g1) {
                for (let e2 of g2) {
                    if (g1 === g2) {
                        assertThat(e1).isEqualTo(e2);
                        assertTrue(e1.isEqualTo(e2));
                    } else {
                        assertThat(e1).isNotEqualTo(e2);
                        assertFalse(e1.isEqualTo(e2));
                    }
                }
            }
        }
    }
});

suite.test("isEmpty", () => {
    assertTrue(GateColumn.empty(0).isEmpty());
    assertTrue(GateColumn.empty(1).isEmpty());
    assertTrue(GateColumn.empty(2).isEmpty());
    assertTrue(GateColumn.empty(10).isEmpty());
    assertTrue(new GateColumn([]).isEmpty());
    assertTrue(new GateColumn([null]).isEmpty());
    assertTrue(new GateColumn([null, null]).isEmpty());
    assertFalse(new GateColumn([Gates.Named.Special.Control]).isEmpty());
    assertFalse(new GateColumn([Gates.Named.Special.SwapHalf]).isEmpty());
    assertFalse(new GateColumn([Gates.Named.HalfTurns.X]).isEmpty());
    assertFalse(new GateColumn([Gates.Named.HalfTurns.X, null]).isEmpty());
    assertFalse(new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.HalfTurns.X]).isEmpty());
});

suite.test("singleQubitOperationsAt", () => {
    assertThat(new GateColumn([]).singleQubitOperationsAt(0)).isEqualTo([]);
    assertThat(new GateColumn([null, null]).singleQubitOperationsAt(0)).isEqualTo([]);
    assertThat(new GateColumn([Gates.Named.HalfTurns.X, null]).singleQubitOperationsAt(0)).isEqualTo([
        {m: Matrix.PAULI_X, i: 0}
    ]);
    assertThat(new GateColumn([null, Gates.Named.HalfTurns.X]).singleQubitOperationsAt(0)).isEqualTo([
        {m: Matrix.PAULI_X, i: 1}
    ]);
    assertThat(new GateColumn([
        Gates.Named.HalfTurns.Y, Gates.Named.HalfTurns.X
    ]).singleQubitOperationsAt(0)).isEqualTo([
        {m: Matrix.PAULI_Y, i: 0},
        {m: Matrix.PAULI_X, i: 1}
    ]);
    assertThat(new GateColumn([
        Gates.Named.Special.Control, Gates.Named.Special.AntiControl, Gates.Named.Special.SwapHalf
    ]).singleQubitOperationsAt(0)).isEqualTo([]);
    assertThat(new GateColumn([
        Gates.Named.Special.SwapHalf, Gates.Named.Special.SwapHalf
    ]).singleQubitOperationsAt(0)).isEqualTo([]);

    assertThat(new GateColumn([Gates.Named.Powering.X]).singleQubitOperationsAt(0)).isEqualTo([]);
    assertThat(new GateColumn([Gates.Named.Powering.X]).singleQubitOperationsAt(0.25)).isEqualTo([
        {m: Matrix.fromPauliRotation(0.25, 0, 0), i: 0}
    ]);
    assertThat(new GateColumn([Gates.Named.Powering.X]).singleQubitOperationsAt(0.5)).isEqualTo([
        {m: Matrix.PAULI_X, i: 0}
    ]);
});

suite.test("swapPairs", () => {
    assertThat(new GateColumn([]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([null, null]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([Gates.Named.HalfTurns.X, null]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([
        Gates.Named.Special.Control, Gates.Named.Special.AntiControl, Gates.Named.Special.SwapHalf
    ]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([
        Gates.Named.Special.SwapHalf, Gates.Named.Special.SwapHalf
    ]).swapPairs()).isEqualTo([[0, 1]]);
    assertThat(new GateColumn([
        Gates.Named.Special.SwapHalf, null, Gates.Named.Special.AntiControl, Gates.Named.Special.SwapHalf, null
    ]).swapPairs()).isEqualTo([[0, 3]]);
});

suite.test("controls", () => {
    assertThat(new GateColumn([]).controls()).isEqualTo(QuantumControlMask.NO_CONTROLS);
    assertThat(new GateColumn([null, null]).controls()).isEqualTo(QuantumControlMask.NO_CONTROLS);
    assertThat(new GateColumn([null, Gates.Named.HalfTurns.X]).controls()).isEqualTo(QuantumControlMask.NO_CONTROLS);
    assertThat(new GateColumn([
        Gates.Named.Special.Control, Gates.Named.Special.AntiControl, Gates.Named.Special.SwapHalf
    ]).controls()).isEqualTo(new QuantumControlMask(3, 1));
    assertThat(new GateColumn([
        Gates.Named.Special.AntiControl, Gates.Named.Special.Control, Gates.Named.Special.SwapHalf
    ]).controls()).isEqualTo(new QuantumControlMask(3, 2));
    assertThat(new GateColumn([
        Gates.Named.Special.AntiControl, Gates.Named.Special.SwapHalf, Gates.Named.Special.Control
    ]).controls()).isEqualTo(new QuantumControlMask(5, 4));
});
