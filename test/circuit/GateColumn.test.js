import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import GateColumn from "src/circuit/GateColumn.js"

import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"
import Controls from "src/circuit/Controls.js"

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
        [new GateColumn([Gates.HalfTurns.X]), new GateColumn([Gates.HalfTurns.X])],
        [new GateColumn([Gates.Special.Control]), new GateColumn([Gates.Special.Control])],
        [new GateColumn([Gates.HalfTurns.X, null]), new GateColumn([Gates.HalfTurns.X, null])],
        [new GateColumn([null, Gates.HalfTurns.X]), new GateColumn([null, Gates.HalfTurns.X])]
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
    assertFalse(new GateColumn([Gates.Special.Control]).isEmpty());
    assertFalse(new GateColumn([Gates.Special.SwapHalf]).isEmpty());
    assertFalse(new GateColumn([Gates.HalfTurns.X]).isEmpty());
    assertFalse(new GateColumn([Gates.HalfTurns.X, null]).isEmpty());
    assertFalse(new GateColumn([Gates.HalfTurns.X, Gates.HalfTurns.X]).isEmpty());
});

suite.test("swapPairs", () => {
    assertThat(new GateColumn([]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([null, null]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([Gates.HalfTurns.X, null]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([
        Gates.Special.Control, Gates.Special.AntiControl, Gates.Special.SwapHalf
    ]).swapPairs()).isEqualTo([]);
    assertThat(new GateColumn([
        Gates.Special.SwapHalf, Gates.Special.SwapHalf
    ]).swapPairs()).isEqualTo([[0, 1]]);
    assertThat(new GateColumn([
        Gates.Special.SwapHalf, null, Gates.Special.AntiControl, Gates.Special.SwapHalf, null
    ]).swapPairs()).isEqualTo([[0, 3]]);
});

suite.test("controls", () => {
    assertThat(new GateColumn([]).controls()).isEqualTo(Controls.NO_CONTROLS);
    assertThat(new GateColumn([null, null]).controls()).isEqualTo(Controls.NO_CONTROLS);
    assertThat(new GateColumn([null, Gates.HalfTurns.X]).controls()).isEqualTo(Controls.NO_CONTROLS);
    assertThat(new GateColumn([
        Gates.Special.Control, Gates.Special.AntiControl, Gates.Special.SwapHalf
    ]).controls()).isEqualTo(new Controls(3, 1));
    assertThat(new GateColumn([
        Gates.Special.AntiControl, Gates.Special.Control, Gates.Special.SwapHalf
    ]).controls()).isEqualTo(new Controls(3, 2));
    assertThat(new GateColumn([
        Gates.Special.AntiControl, Gates.Special.SwapHalf, Gates.Special.Control
    ]).controls()).isEqualTo(new Controls(5, 4));
});
