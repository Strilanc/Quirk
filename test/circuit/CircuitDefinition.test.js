import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"

import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Seq from "src/base/Seq.js"

let suite = new Suite("CircuitStats");

let X = Gates.Named.HalfTurns.X;
let Y = Gates.Named.HalfTurns.Y;
let Z = Gates.Named.HalfTurns.Z;
let H = Gates.Named.HalfTurns.H;
let C = Gates.Named.Special.Control;
let A = Gates.Named.Special.AntiControl;
let _ = null;
let M = Gates.Named.Special.Measurement;

suite.test("isEqualTo", () => {
    let c1 = new CircuitDefinition(2, [
        new GateColumn([_, H]),
        new GateColumn([X, C])
    ]);
    let c2 = new CircuitDefinition(2, [
        new GateColumn([_, H]),
        new GateColumn([X, C])
    ]);
    let d1 = new CircuitDefinition(2, [
        new GateColumn([_, X]),
        new GateColumn([X, C])
    ]);
    let d2 = new CircuitDefinition(2, [
        new GateColumn([_, H])
    ]);
    let d3 = new CircuitDefinition(3, [
        new GateColumn([_, X, _]),
        new GateColumn([X, C, _])
    ]);

    assertThat(c1).isEqualTo(c1);
    assertThat(c1).isEqualTo(c2);
    assertThat(c1).isNotEqualTo(d1);
    assertThat(c1).isNotEqualTo(d2);
    assertThat(c1).isNotEqualTo(d3);

    assertThat(new CircuitDefinition(2, [])).isEqualTo(new CircuitDefinition(2, []));
    assertThat(new CircuitDefinition(2, [])).isNotEqualTo(new CircuitDefinition(3, []));
});

suite.test("from", () => {
    assertThat(CircuitDefinition.from([
        [X, _],
        [Y, Z]
    ])).isEqualTo(new CircuitDefinition(2, [
        new GateColumn([X, _]),
        new GateColumn([Y, Z])
    ]));
});

suite.test("wireMeasuredColumns", () => {
    assertThat(
        CircuitDefinition.from([
            [_, _, _],
            [_, _, M],
            [M, _, _],
            [_, _, _]]
        ).wireMeasuredColumns()
    ).isEqualTo([2, Infinity, 1]);
});


suite.test("singleQubitOperationsInColAt", () => {
    assertThat(CircuitDefinition.from([]).singleQubitOperationsInColAt(0, 0)).isEqualTo([]);
    assertThat(CircuitDefinition.from([[]]).singleQubitOperationsInColAt(0, 0)).isEqualTo([]);
    assertThat(CircuitDefinition.from([
        [_, _]
    ]).singleQubitOperationsInColAt(0, 0)).isEqualTo([]);
    assertThat(CircuitDefinition.from([
        [X, _]
    ]).singleQubitOperationsInColAt(0, 0)).isEqualTo([
        {m: Matrix.PAULI_X, i: 0}
    ]);
    assertThat(CircuitDefinition.from([
        [_, X]
    ]).singleQubitOperationsInColAt(0, 0)).isEqualTo([
        {m: Matrix.PAULI_X, i: 1}
    ]);
    assertThat(CircuitDefinition.from([
        [Y, X]
    ]).singleQubitOperationsInColAt(0, 0)).isEqualTo([
        {m: Matrix.PAULI_Y, i: 0},
        {m: Matrix.PAULI_X, i: 1}
    ]);
    assertThat(CircuitDefinition.from([[
        C, Gates.Named.Special.AntiControl, Gates.Named.Special.SwapHalf
    ]]).singleQubitOperationsInColAt(0, 0)).isEqualTo([]);
    assertThat(CircuitDefinition.from([
        [Gates.Named.Special.SwapHalf, Gates.Named.Special.SwapHalf]
    ]).singleQubitOperationsInColAt(0, 0)).isEqualTo([]);

    let t0 = CircuitDefinition.from([[
        Gates.Named.Powering.XForward
    ]]).singleQubitOperationsInColAt(0, 0);
    if (t0.length !== 0) {
        assertThat(t0).isApproximatelyEqualTo([
            {m: Matrix.identity(2), i: 0}
        ]);
    }
    assertThat(CircuitDefinition.from([[
        Gates.Named.Powering.XForward
    ]]).singleQubitOperationsInColAt(0, 0.25)).isApproximatelyEqualTo([
        {m: Matrix.fromPauliRotation(0.25, 0, 0), i: 0}
    ]);
    assertThat(CircuitDefinition.from([
        [Gates.Named.Powering.XForward]
    ]).singleQubitOperationsInColAt(0, 0.5)).isApproximatelyEqualTo([
        {m: Matrix.PAULI_X, i: 0}
    ]);

    assertThat(CircuitDefinition.from([
        [X, _],
        [Y, Z]
    ]).singleQubitOperationsInColAt(0, 0)).isEqualTo([
        {m: Matrix.PAULI_X, i: 0}
    ]);

    assertThat(CircuitDefinition.from([
        [X, _],
        [Y, Z]
    ]).singleQubitOperationsInColAt(1, 0)).isEqualTo([
        {m: Matrix.PAULI_Y, i: 0},
        {m: Matrix.PAULI_Z, i: 1}
    ]);
});

suite.test("gateAtLocIsDisabledReason_swaps", () => {
    let W = Gates.Named.Special.SwapHalf;
    let circuit = CircuitDefinition.from([
        [W, W, _, _],
        [W, W, W, _], // too many
        [M, _, M, _],
        [W, _, W, _],
        [_, W, _, W],
        [W, _, _, _], // too few
        [W, W, W, _],
        [W, _, _, W], // measure mismatch
        [_, W, W, W], // too many
        [_, _, _, W], // too few
        [W, _, W, C], // unmeasured control
        [C, W, _, W]
    ]);
    let pts = Seq.range(circuit.columns.length).
        flatMap(c => Seq.range(4).map(r => new Point(c, r))).
        filter(pt => circuit.gateAtLocIsDisabledReason(pt, 0) !== null).
        map(pt => [pt.x, pt.y]).
        toArray();
    assertThat(pts).isEqualTo([
        [1, 0], [1, 1], [1, 2], // Too many.
        [5, 0], // Too few (measured).
        [6, 0], [6, 1], [6, 2],
        [7, 0], [7, 3], // Measure-mismatch.
        [8, 1], [8, 2], [8, 3], // Too many and measure-mismatch.
        [9, 3], // Too few (unmeasured).
        [10, 0], [10, 2] // Control mismatch.
    ])
});

suite.test("gateAtLocIsDisabledReason_recohere", () => {
    let W = Gates.Named.Special.SwapHalf;
    let circuit = CircuitDefinition.from([
        [M, M, _, _],
        [X, Y, Z, H],
        [H, Z, Y, X], // Bad H.
        [C, _, H, _],
        [_, H, _, C], // Bad H.
        [C, _, X, _],
        [_, X, _, C], // Quantum control for classical bit.
        [C, H, _, _], // Bad H.
        [C, X, _, _]
    ]);
    let pts = Seq.range(circuit.columns.length).
        flatMap(c => Seq.range(4).map(r => new Point(c, r))).
        filter(pt => circuit.gateAtLocIsDisabledReason(pt, 0) !== null).
        map(pt => [pt.x, pt.y]).
        toArray();
    assertThat(pts).isEqualTo([
        [2, 0],
        [4, 1],
        [6, 1],
        [7, 1]
    ]);
});

suite.test("colHasDoubleWireControl", () => {
    let circuit = CircuitDefinition.from([
        [M, M, _],
        [_, _, _],
        [C, _, _],
        [_, C, _],
        [C, C, _],
        [_, _, C],
        [C, _, C],
        [_, A, C],
        [C, C, C]
    ]);
    let pts = Seq.range(circuit.columns.length).
        filter(c => circuit.colHasDoubleWireControl(c)).
        toArray();
    assertThat(pts).isEqualTo([2, 3, 4, 6, 7, 8]);
});

suite.test("colHasSingleWireControl", () => {
    let circuit = CircuitDefinition.from([
        [_, _, M],
        [_, _, _],
        [C, _, _],
        [_, C, _],
        [C, C, _],
        [_, _, C],
        [C, _, C],
        [_, A, C],
        [C, C, C]
    ]);
    let pts = Seq.range(circuit.columns.length).
        filter(c => circuit.colHasSingleWireControl(c)).
        toArray();
    assertThat(pts).isEqualTo([2, 3, 4, 6, 7, 8]);
});

suite.test("withWireCount", () => {
    let circuit = CircuitDefinition.from([
        [_, X, Y],
        [_, _, _],
        [C, _, H]
    ]);

    assertThat(circuit.withWireCount(0)).isEqualTo(CircuitDefinition.from([
        [],
        [],
        []
    ]));
    assertThat(circuit.withWireCount(1)).isEqualTo(CircuitDefinition.from([
        [_],
        [_],
        [C]
    ]));
    assertThat(circuit.withWireCount(2)).isEqualTo(CircuitDefinition.from([
        [_, X],
        [_, _],
        [C, _]
    ]));
    assertThat(circuit.withWireCount(3)).isEqualTo(circuit);
    assertThat(circuit.withWireCount(4)).isEqualTo(CircuitDefinition.from([
        [_, X, Y, _],
        [_, _, _, _],
        [C, _, H, _]
    ]));
    assertThat(circuit.withWireCount(5)).isEqualTo(CircuitDefinition.from([
        [_, X, Y, _, _],
        [_, _, _, _, _],
        [C, _, H, _, _]
    ]));
});

// untested:
//locHasControllableGate
//colHasPairedSwapGate
//locStartsDoubleControlWire
//locStartsSingleControlWire
//locIsControl
//gateAtLoc
//locIsMeasured
