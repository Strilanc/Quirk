import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"

import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {Gate} from "src/circuit/Gate.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {Seq} from "src/base/Seq.js"

let suite = new Suite("CircuitDefinition");

const X = Gates.HalfTurns.X;
const Y = Gates.HalfTurns.Y;
const Z = Gates.HalfTurns.Z;
const H = Gates.HalfTurns.H;
const C = Gates.Controls.Control;
const A = Gates.Controls.AntiControl;
const _ = undefined;
const M = Gates.Special.Measurement;
const TEST_GATES = new Map([
    ['X', X],
    ['Y', Y],
    ['Z', Z],
    ['H', H],
    ['•', C],
    ['◦', A],
    ['⊖', Gates.Controls.MinusControl],
    ['⊕', Gates.Controls.PlusControl],
    ['⊗', Gates.Controls.CrossControl],
    ['.', Gates.SpacerGate],

    ['a', Gates.InputGates.InputAFamily.ofSize(1)],
    ['A', Gates.InputGates.InputAFamily.ofSize(2)],
    ['b', Gates.InputGates.InputBFamily.ofSize(1)],
    ['B', Gates.InputGates.InputBFamily.ofSize(2)],
    ['⩮', Gates.MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(1)],
    ['⩲', Gates.Arithmetic.PlusAFamily.ofSize(1)],
    ['⨧', Gates.Arithmetic.PlusAFamily.ofSize(2)],


    ['M', M],
    ['%', Gates.Displays.ChanceDisplay],
    ['d', Gates.Displays.DensityMatrixDisplay],
    ['D', Gates.Displays.DensityMatrixDisplay2],
    ['@', Gates.Displays.BlochSphereDisplay],
    ['s', Gates.Special.SwapHalf],
    ['R', Gates.ReverseBitsGateFamily],
    ['↡', Gates.CycleBitsGates.CycleBitsFamily],
    ['!', Gates.PostSelectionGates.PostSelectOn],

    ['-', undefined],
    ['=', undefined],
    ['+', undefined],
    ['|', undefined],
    ['/', null],

    ['#', Gate.fromKnownMatrix('#', Matrix.zero(4, 4), '#', '#').withWidth(2).withHeight(2)],
    ['~', Gate.fromKnownMatrix('~', Matrix.zero(2, 2), '~', '~').withWidth(3)],
    ['2', Gates.Arithmetic.IncrementFamily.ofSize(2)],
    ['3', Gates.Arithmetic.IncrementFamily.ofSize(3)],
    ['4', Gates.Arithmetic.IncrementFamily.ofSize(4)],
    ['Q', Gate.fromKnownMatrix('Q', Matrix.square(1, 1, 1, 1,
                                      1, Complex.I, -1, Complex.I.neg(),
                                      1, -1, 1, -1,
                                      1, Complex.I.neg(), -1, Complex.I), 'Q', 'Q').withHeight(2)],
    ['t', Gates.Exponentiating.XForward]
]);
const circuit = diagram => CircuitDefinition.fromTextDiagram(TEST_GATES, diagram);

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
    assertThat(CircuitDefinition.EMPTY).isEqualTo(new CircuitDefinition(0, []));
});

suite.test("fromTextDiagram", () => {
    assertThrows(() => circuit('∞'));
    assertThrows(() => circuit('--\n-'));

    assertThat(circuit('')).isEqualTo(new CircuitDefinition(0, []));
    assertThat(circuit(`
        -
        `)).isEqualTo(new CircuitDefinition(1, [new GateColumn([_])]));
    assertThat(circuit(`
        -X-
        -Y-
        `)).isEqualTo(new CircuitDefinition(2, [
            new GateColumn([_, _]),
            new GateColumn([X, Y]),
            new GateColumn([_, _])]));
    assertThat(circuit(`
        -•
        -|
        -Z
        `)).isEqualTo(new CircuitDefinition(3, [new GateColumn([_, _, _]), new GateColumn([C, _, Z])]));

    let qftFamily = Gates.FourierTransformGates.FourierTransformFamily;
    let qftMap = new Map([['Q', qftFamily], ['-', undefined], ['/', null]]);
    assertThat(CircuitDefinition.fromTextDiagram(qftMap, `Q`)).
        isEqualTo(new CircuitDefinition(1, [new GateColumn([qftFamily.ofSize(1)])]));
    assertThat(CircuitDefinition.fromTextDiagram(qftMap, `Q
                                                          -`)).
        isEqualTo(new CircuitDefinition(2, [new GateColumn([qftFamily.ofSize(1), _])]));
    assertThat(CircuitDefinition.fromTextDiagram(qftMap, `Q
                                                          /`)).
        isEqualTo(new CircuitDefinition(2, [new GateColumn([qftFamily.ofSize(2), _])]));
    assertThat(CircuitDefinition.fromTextDiagram(qftMap, `QQQ
                                                          //-
                                                          /--`)).
        isEqualTo(new CircuitDefinition(3, [
            new GateColumn([qftFamily.ofSize(3), _, _]),
            new GateColumn([qftFamily.ofSize(2), _, _]),
            new GateColumn([qftFamily.ofSize(1), _, _])]));
});

suite.test("stableDuration", () => {
    assertThat(circuit('----').stableDuration()).isEqualTo(Infinity);
    assertThat(circuit('-XY-').stableDuration()).isEqualTo(Infinity);
    assertThat(circuit(`-XY-
                        --X-`).stableDuration()).isEqualTo(Infinity);
    assertThat(circuit(`•Z#M
                        --X/`).stableDuration()).isEqualTo(Infinity);

    assertThat(circuit('t').stableDuration()).isEqualTo(0);
    assertThat(circuit('---t---').stableDuration()).isEqualTo(0);
    assertThat(circuit('-X-t-Y-').stableDuration()).isEqualTo(0);
    assertThat(circuit('-t-t---').stableDuration()).isEqualTo(0);
    assertThat(circuit(`-t-t---
                        -----X-`).stableDuration()).isEqualTo(0);
    assertThat(circuit(`-------
                        -t-----`).stableDuration()).isEqualTo(0);
});

suite.test("readableHash", () => {
    assertThat(typeof CircuitDefinition.EMPTY.readableHash()).isEqualTo('string');
    assertThat(typeof circuit('----').readableHash()).isEqualTo('string');
    assertThat(typeof circuit('-\n-').readableHash()).isEqualTo('string');
    assertThat(typeof circuit('tXY•').readableHash()).isEqualTo('string');
});

suite.test("readableHash", () => {
    assertThrows(() => circuit('-').withColumns(circuit('-\n-').columns));
    assertThat(circuit('----').withColumns(circuit('XYZt').columns)).isEqualTo(circuit('XYZt'));
    assertThat(circuit('-').withColumns(circuit('XYZt').columns)).isEqualTo(circuit('XYZt'));
    assertThat(circuit('-\n-').withColumns(circuit('X\nY').columns)).isEqualTo(circuit('X\nY'));
});

suite.test("withWidthOverlapsFixed", () => {
    assertThat(circuit('----').withWidthOverlapsFixed()).isEqualTo(circuit('----'));
    assertThat(circuit(`----
                        ----`).withWidthOverlapsFixed()).isEqualTo(circuit(`----
                                                                            ----`));
    assertThat(circuit(`-XZ-
                        -Yt-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-XZ-
                                                                            -Yt-`));
    assertThat(circuit(`-2Z-
                        -Yt-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-2Z-
                                                                            -Yt-`));
    assertThat(circuit(`-#Z-
                        -Yt-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-#-Z-
                                                                            -Y-t-`));
    assertThat(circuit(`-#/-
                        -Yt-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-#---
                                                                            -Y-t-`));
    assertThat(circuit(`-#Z-
                        -Y/-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-#-Z-
                                                                            -Y---`));
    assertThat(circuit(`-#Z-
                        -/t-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-#-Z-
                                                                            ---t-`));
    assertThat(circuit(`--#/-
                        -#//-
                        -//--`).withWidthOverlapsFixed()).isEqualTo(circuit(`---#/-
                                                                             -#///-
                                                                             -//---`));
    assertThat(circuit(`-###/-
                        -/#//-
                        --//--`).withWidthOverlapsFixed()).isEqualTo(circuit(`-#/#/#/-
                                                                              -//#///-
                                                                              ---//---`));
    assertThat(circuit(`--3--
                        -#/--
                        -//--`).withWidthOverlapsFixed()).isEqualTo(circuit(`---3--
                                                                             -#//--
                                                                             -///--`));
    assertThat(circuit(`-3---
                        -/#/-
                        -///-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-3---
                                                                             -/#/-
                                                                             -///-`));
    assertThat(circuit(`-3--
                        -#/-
                        -//-`).withWidthOverlapsFixed()).isEqualTo(circuit(`-3--
                                                                            -#/-
                                                                            -//-`));
    assertThat(circuit(`~3/-
                        -#/-
                        -//-`).withWidthOverlapsFixed()).isEqualTo(circuit(`~//3--
                                                                            ---#/-
                                                                            ---//-`));
    assertThat(circuit(`~~~~//-`).withWidthOverlapsFixed()).isEqualTo(circuit(`~//~//~//~//-`));
});

suite.test("withWidthOverlapsFixed", () => {
    assertThat(circuit('----').withHeightOverlapsFixed()).isEqualTo(circuit('----'));
    assertThat(circuit(`----
                        ----`).withHeightOverlapsFixed()).isEqualTo(circuit(`----
                                                                             ----`));
    assertThat(circuit(`-XZ-
                        -Yt-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-XZ-
                                                                             -Yt-`));
    assertThat(circuit(`-2Z-
                        -Yt-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-2-Z-
                                                                             -/Yt-`));
    assertThat(circuit(`-2Z-
                        -Yt-
                        -•--
                        -◦--`).withHeightOverlapsFixed()).isEqualTo(circuit(`-2-Z-
                                                                             -/Yt-
                                                                             -••--
                                                                             -◦◦--`));
    assertThat(circuit(`-3-
                        -•-
                        -•-
                        -◦-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-3--
                                                                            -/•-
                                                                            -/•-
                                                                            -◦◦-`));
    assertThat(circuit(`-3-
                        -•-
                        -•-
                        -X-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-3--
                                                                            -/•-
                                                                            -/•-
                                                                            -X--`));
    assertThat(circuit(`-3-
                        -3-
                        -2-
                        -X-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-3----
                                                                            -/3---
                                                                            -//2--
                                                                            -///X-`));
    assertThat(circuit(`-3-
                        -2-
                        -Y-
                        -X-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-3---
                                                                            -/2--
                                                                            -//Y-
                                                                            -X---`));
});

suite.test("withTrailingSpacersIncluded", () => {
    assertThat(circuit('---').withTrailingSpacersIncluded()).isEqualTo(circuit('---'));
    assertThat(circuit('~XY').withTrailingSpacersIncluded()).isEqualTo(circuit('~XY'));
    assertThat(circuit('XY~').withTrailingSpacersIncluded()).isEqualTo(circuit('XY~--'));
    assertThat(circuit('#').withTrailingSpacersIncluded()).isEqualTo(circuit('#-'));
    assertThat(circuit(`---
                        --~`).withTrailingSpacersIncluded()).isEqualTo(circuit(`-----
                                                                                --~--`));
});

suite.test("withUncoveredColumnsRemoved", () => {
    assertThat(circuit('---').withUncoveredColumnsRemoved()).isEqualTo(new CircuitDefinition(1, []));
    assertThat(circuit('~XY').withUncoveredColumnsRemoved()).isEqualTo(circuit('~XY'));
    assertThat(circuit('XY~//--').withUncoveredColumnsRemoved()).isEqualTo(circuit('XY~//'));
    assertThat(circuit('XY~//-').withUncoveredColumnsRemoved()).isEqualTo(circuit('XY~//'));
    assertThat(circuit('XY~//').withUncoveredColumnsRemoved()).isEqualTo(circuit('XY~//'));
    assertThat(circuit('XY~/').withUncoveredColumnsRemoved()).isEqualTo(circuit('XY~/'));
    assertThat(circuit('XY~').withUncoveredColumnsRemoved()).isEqualTo(circuit('XY~'));
    assertThat(circuit(`-----
                        --~//`).withUncoveredColumnsRemoved()).isEqualTo(circuit(`---
                                                                                  ~//`));
    assertThat(circuit(`--#/-
                        --//-`).withUncoveredColumnsRemoved()).isEqualTo(circuit(`#/
                                                                                  //`));
});

suite.test("withWireCount", () => {
    assertThat(circuit('---').withWireCount(1)).isEqualTo(circuit('---'));
    assertThat(circuit('-X-').withWireCount(2)).isEqualTo(circuit(`-X-
                                                                   ---`));
    assertThat(circuit('-XY').withWireCount(4)).isEqualTo(circuit(`-XY
                                                                   ---
                                                                   ---
                                                                   ---`));
    assertThat(circuit(`-XY
                        Zt!
                        MMX`).withWireCount(4)).isEqualTo(circuit(`-XY
                                                                   Zt!
                                                                   MMX
                                                                   ---`));
    assertThat(circuit(`-XY
                        Zt!
                        MMX`).withWireCount(3)).isEqualTo(circuit(`-XY
                                                                   Zt!
                                                                   MMX`));
    assertThat(circuit(`-XY
                        Zt!
                        MMX`).withWireCount(2)).isEqualTo(circuit(`-XY
                                                                   Zt!`));
    assertThat(circuit(`-XY
                        Zt!
                        MMX`).withWireCount(1)).isEqualTo(circuit(`-XY`));
});

suite.test("minimumRequiredWireCount", () => {
    assertThat(circuit('---').minimumRequiredWireCount()).isEqualTo(1);
    assertThat(circuit('-X-').minimumRequiredWireCount()).isEqualTo(1);
    assertThat(circuit(`-X-
                        ---`).minimumRequiredWireCount()).isEqualTo(1);
    assertThat(circuit(`---
                        -X-`).minimumRequiredWireCount()).isEqualTo(2);
    assertThat(circuit(`-Y-
                        --X`).minimumRequiredWireCount()).isEqualTo(2);
    assertThat(circuit(`-Y-
                        --2`).minimumRequiredWireCount()).isEqualTo(3);
    assertThat(circuit(`-Y-
                        --3`).minimumRequiredWireCount()).isEqualTo(4);
    assertThat(circuit(`-Y-
                        --#`).minimumRequiredWireCount()).isEqualTo(3);
    assertThat(circuit(`-Y-
                        --~`).minimumRequiredWireCount()).isEqualTo(2);
    assertThat(circuit(`-#-
                        --X`).minimumRequiredWireCount()).isEqualTo(2);
    assertThat(circuit(`-#-
                        ---
                        ---`).minimumRequiredWireCount()).isEqualTo(2);
});

suite.test("minimumRequiredColCount", () => {
    assertThat(circuit('---').minimumRequiredColCount()).isEqualTo(0);
    assertThat(circuit('X--').minimumRequiredColCount()).isEqualTo(1);
    assertThat(circuit('-X-').minimumRequiredColCount()).isEqualTo(2);
    assertThat(circuit('--X').minimumRequiredColCount()).isEqualTo(3);
    assertThat(circuit(`-X-
                        ---`).minimumRequiredColCount()).isEqualTo(2);
    assertThat(circuit(`---
                        -X-`).minimumRequiredColCount()).isEqualTo(2);
    assertThat(circuit(`-Y-
                        --X`).minimumRequiredColCount()).isEqualTo(3);
    assertThat(circuit(`-Y-
                        --2`).minimumRequiredColCount()).isEqualTo(3);
    assertThat(circuit(`-Y-
                        --3`).minimumRequiredColCount()).isEqualTo(3);
    assertThat(circuit(`-Y-
                        --#`).minimumRequiredColCount()).isEqualTo(4);
    assertThat(circuit(`-Y-
                        --~`).minimumRequiredColCount()).isEqualTo(5);
    assertThat(circuit(`-#-
                        --X`).minimumRequiredColCount()).isEqualTo(3);
    assertThat(circuit(`-#-
                        ---`).minimumRequiredColCount()).isEqualTo(3);
});

suite.test("colIsMeasuredMask", () => {
    let assertAbout = diagram => {
        let c = circuit(diagram);
        return assertThat(Seq.range(c.columns.length + 3).map(i => c.colIsMeasuredMask(i-1)).toArray());
    };

    // Measurement measures
    assertAbout('M').isEqualTo([0, 0, 1, 1]);
    // Bit indices
    assertAbout(`-M---
                 ---M-
                 --M--`).isEqualTo([0, 0, 0, 1, 5, 7, 7, 7]);
    // Lack of operation doesn't measure
    assertAbout('-').isEqualTo([0, 0, 0, 0]);
    // Normal operations don't measure
    assertAbout('XYZt!d%').isEqualTo([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // Measurement is idempodent
    assertAbout('MM').isEqualTo([0, 0, 1, 1, 1]);
    // Post-selection clears
    assertAbout(`M!`).isEqualTo([0, 0, 1, 0, 0]);
    // Swap moves measured
    assertAbout(`---s=
                 -M=s-`).isEqualTo([0, 0, 0, 2, 2, 1, 1, 1]);
    // Custom permutations move measured
    assertAbout(`---↡=↡-
                 ---/-/=
                 -M=/-/-`).isEqualTo([0, 0, 0, 4, 4, 1, 1, 2, 2, 2]);
    assertAbout(`---R=R-
                 ---/-/-
                 -M=/-/=`).isEqualTo([0, 0, 0, 4, 4, 1, 1, 4, 4, 4]);

    // Disallowed measurements don't cause measurement. Controlled measurement not allowed.
    assertAbout(`•
                 M`).isEqualTo([0, 0, 0, 0]);
    // Disallowed swaps don't swap.
    assertAbout(`-s
                 Ms
                 -•`).isEqualTo([0, 0, 2, 2, 2]);
    assertAbout(`-s
                 Ms
                 M•`).isEqualTo([0, 0, 6, 6, 6]);
    assertAbout(`-s
                 -s
                 M•`).isEqualTo([0, 0, 4, 4, 4]);
    // Disallowed post-selections don't clear.
    assertAbout(`M!
                 -•`).isEqualTo([0, 0, 1, 1, 1]);
    // Unclear post-selections also don't clear.
    assertAbout(`M!
                 M•`).isEqualTo([0, 0, 3, 3, 3]);
});

suite.test("colDesiredSingleQubitStatsMask", () => {
    let assertAbout = diagram => {
        let c = circuit(diagram);
        return assertThat(Seq.range(c.columns.length + 3).map(i => c.colDesiredSingleQubitStatsMask(i-1)).toArray());
    };

    //noinspection SpellCheckingInspection
    assertAbout('XYZH•◦M%dD@s!-#~23t').isEqualTo([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assertAbout('%d@').isEqualTo([0, 1, 1, 1, 0, 0]);
    assertAbout(`---%--
                 %--%-!
                 --d%--
                 -@-%--`).isEqualTo([0, 2, 8, 4, 15, 0, 0, 0, 0]);
});

suite.test("nonUnitaryGates", () => {
    let c = circuit(`-M-•-
                     --!--
                     ---X-`);
    assertFalse(c.hasOnlyUnitaryGates());
    assertThat(c.columns[0].indexOfNonUnitaryGate()).isEqualTo(undefined);
    assertThat(c.columns[1].indexOfNonUnitaryGate()).isEqualTo(undefined);
    assertThat(c.columns[2].indexOfNonUnitaryGate()).isEqualTo(1);
    assertThat(c.columns[3].indexOfNonUnitaryGate()).isEqualTo(undefined);
    assertThat(c.columns[4].indexOfNonUnitaryGate()).isEqualTo(undefined);
});

suite.test("locIsMeasured", () => {
    let c = circuit(`-M---
                     ---M-
                     --M--`);
    assertFalse(c.locIsMeasured(new Point(100, 100)));
    assertTrue(c.locIsMeasured(new Point(100, 0)));
    assertFalse(c.locIsMeasured(new Point(100, -100)));
    assertFalse(c.locIsMeasured(new Point(-100, 100)));
    assertFalse(c.locIsMeasured(new Point(-100, 0)));
    assertFalse(c.locIsMeasured(new Point(-100, -100)));
    assertFalse(c.locIsMeasured(new Point(0, -100)));

    assertFalse(c.locIsMeasured(new Point(1, 0)));
    assertTrue(c.locIsMeasured(new Point(2, 0)));

    assertFalse(c.locIsMeasured(new Point(3, 1)));
    assertTrue(c.locIsMeasured(new Point(4, 1)));
});

suite.test("gateInSlot", () => {
    let c = circuit(`ZXY--
                     -#/%-
                     -//•-`);

    assertThat(c.gateInSlot(-10, 0)).isEqualTo(undefined);
    assertThat(c.gateInSlot(+10, 0)).isEqualTo(undefined);
    assertThat(c.gateInSlot(0, -10)).isEqualTo(undefined);
    assertThat(c.gateInSlot(0, +10)).isEqualTo(undefined);

    assertThat(c.gateInSlot(0, 0)).isEqualTo(Z);
    assertThat(c.gateInSlot(1, 0)).isEqualTo(X);
    assertThat(c.gateInSlot(2, 0)).isEqualTo(Y);
    assertThat(c.gateInSlot(3, 0)).isEqualTo(undefined);
    assertThat(c.gateInSlot(0, 1)).isEqualTo(undefined);
    assertThat(c.gateInSlot(1, 1)).isEqualTo(TEST_GATES.get('#'));
    assertThat(c.gateInSlot(2, 1)).isEqualTo(undefined);
    assertThat(c.gateInSlot(3, 1)).isEqualTo(Gates.Displays.ChanceDisplay);
    assertThat(c.gateInSlot(0, 2)).isEqualTo(undefined);
    assertThat(c.gateInSlot(1, 2)).isEqualTo(undefined);
    assertThat(c.gateInSlot(2, 2)).isEqualTo(undefined);
    assertThat(c.gateInSlot(3, 2)).isEqualTo(Gates.Controls.Control);
});

suite.test("findGateCoveringSlot", () => {
    let c = circuit(`ZXY--
                     -#/%-
                     -//•-`);

    assertThat(c.findGateCoveringSlot(-10, 0)).isEqualTo(undefined);
    assertThat(c.findGateCoveringSlot(+10, 0)).isEqualTo(undefined);
    assertThat(c.findGateCoveringSlot(0, -10)).isEqualTo(undefined);
    assertThat(c.findGateCoveringSlot(0, +10)).isEqualTo(undefined);

    assertThat(c.findGateCoveringSlot(0, 0)).isEqualTo({col: 0, row: 0, gate: Z});
    assertThat(c.findGateCoveringSlot(1, 0)).isEqualTo({col: 1, row: 0, gate: X});
    assertThat(c.findGateCoveringSlot(2, 0)).isEqualTo({col: 2, row: 0, gate: Y});
    assertThat(c.findGateCoveringSlot(3, 0)).isEqualTo(undefined);
    assertThat(c.findGateCoveringSlot(0, 1)).isEqualTo(undefined);
    assertThat(c.findGateCoveringSlot(1, 1)).isEqualTo({col: 1, row: 1, gate: TEST_GATES.get('#')});
    assertThat(c.findGateCoveringSlot(2, 1)).isEqualTo({col: 1, row: 1, gate: TEST_GATES.get('#')});
    assertThat(c.findGateCoveringSlot(3, 1)).isEqualTo({col: 3, row: 1, gate: Gates.Displays.ChanceDisplay});
    assertThat(c.findGateCoveringSlot(0, 2)).isEqualTo(undefined);
    assertThat(c.findGateCoveringSlot(1, 2)).isEqualTo({col: 1, row: 1, gate: TEST_GATES.get('#')});
    assertThat(c.findGateCoveringSlot(2, 2)).isEqualTo({col: 1, row: 1, gate: TEST_GATES.get('#')});
    assertThat(c.findGateCoveringSlot(3, 2)).isEqualTo({col: 3, row: 2, gate: Gates.Controls.Control});

    // Small following gates take priority when overlap happens somehow.
    assertThat(circuit('#X\nYZ').findGateCoveringSlot(1, 0)).isEqualTo({col: 1, row: 0, gate: X});
    assertThat(circuit('#X\nYZ').findGateCoveringSlot(0, 1)).isEqualTo({col: 0, row: 1, gate: Y});
    assertThat(circuit('#X\nYZ').findGateCoveringSlot(1, 1)).isEqualTo({col: 1, row: 1, gate: Z});
});

suite.test("colControls", () => {
    let c = circuit(`-•-◦-⊖⊗⊕-M-⊕⊗⊖-◦-•-`);
    assertThat(c.colControls(-1)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(0)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(1)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(3)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(5)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(6)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(7)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(9)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(11)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(12)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(13)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(15)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(17)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(102)).isEqualTo(Controls.NONE);

    let c2 = circuit(`--•◦◦-
                      -X◦•s-
                      ---s•-`);
    assertThat(c2.colControls(0)).isEqualTo(Controls.NONE);
    assertThat(c2.colControls(1)).isEqualTo(Controls.NONE);
    assertThat(c2.colControls(2)).isEqualTo(new Controls(3, 1));
    assertThat(c2.colControls(3)).isEqualTo(new Controls(3, 2));
    assertThat(c2.colControls(4)).isEqualTo(new Controls(5, 4));
});

suite.test("locIsControlWireStarter", () => {
    let c = circuit(`Z•Y--
                     -#/%◦
                     -/◦•-`);

    assertFalse(c.locIsControlWireStarter(new Point(-10, 0)));
    assertFalse(c.locIsControlWireStarter(new Point(+10, 0)));
    assertFalse(c.locIsControlWireStarter(new Point(0, -10)));
    assertFalse(c.locIsControlWireStarter(new Point(0, +10)));

    assertFalse(c.locIsControlWireStarter(new Point(0, 0)));
    assertTrue(c.locIsControlWireStarter(new Point(1, 0)));
    assertFalse(c.locIsControlWireStarter(new Point(2, 0)));
    assertFalse(c.locIsControlWireStarter(new Point(3, 0)));
    assertFalse(c.locIsControlWireStarter(new Point(4, 0)));

    assertFalse(c.locIsControlWireStarter(new Point(0, 1)));
    assertFalse(c.locIsControlWireStarter(new Point(1, 1)));
    assertFalse(c.locIsControlWireStarter(new Point(2, 1)));
    assertFalse(c.locIsControlWireStarter(new Point(3, 1)));
    assertTrue(c.locIsControlWireStarter(new Point(4, 1)));

    assertFalse(c.locIsControlWireStarter(new Point(0, 2)));
    assertFalse(c.locIsControlWireStarter(new Point(1, 2)));
    assertTrue(c.locIsControlWireStarter(new Point(2, 2)));
    assertTrue(c.locIsControlWireStarter(new Point(3, 2)));
    assertFalse(c.locIsControlWireStarter(new Point(4, 2)));
});

suite.test("locStartsSingleControlWire", () => {
    let c = circuit(`-M-•-
                     -M-◦-
                     ---•-
                     ---◦-
                     ---X-`);

    assertFalse(c.locStartsSingleControlWire(new Point(-10, 0)));
    assertFalse(c.locStartsSingleControlWire(new Point(+10, 0)));
    assertFalse(c.locStartsSingleControlWire(new Point(0, -10)));
    assertFalse(c.locStartsSingleControlWire(new Point(0, +10)));

    assertFalse(c.locStartsSingleControlWire(new Point(3, 0)));
    assertFalse(c.locStartsSingleControlWire(new Point(3, 1)));
    assertTrue(c.locStartsSingleControlWire(new Point(3, 2)));
    assertTrue(c.locStartsSingleControlWire(new Point(3, 3)));
    assertFalse(c.locStartsSingleControlWire(new Point(3, 4)));

    assertFalse(c.locStartsSingleControlWire(new Point(2, 3)));
    assertFalse(c.locStartsSingleControlWire(new Point(4, 3)));
});

suite.test("locStartsDoubleControlWire", () => {
    let c = circuit(`-M-•-
                     -M-◦-
                     ---•-
                     ---◦-
                     ---X-`);

    assertFalse(c.locStartsDoubleControlWire(new Point(-10, 0)));
    assertFalse(c.locStartsDoubleControlWire(new Point(+10, 0)));
    assertFalse(c.locStartsDoubleControlWire(new Point(0, -10)));
    assertFalse(c.locStartsDoubleControlWire(new Point(0, +10)));

    assertTrue(c.locStartsDoubleControlWire(new Point(3, 0)));
    assertTrue(c.locStartsDoubleControlWire(new Point(3, 1)));
    assertFalse(c.locStartsDoubleControlWire(new Point(3, 2)));
    assertFalse(c.locStartsDoubleControlWire(new Point(3, 3)));
    assertFalse(c.locStartsDoubleControlWire(new Point(3, 4)));

    assertFalse(c.locStartsDoubleControlWire(new Point(2, 1)));
    assertFalse(c.locStartsDoubleControlWire(new Point(4, 1)));
});

suite.test("colHasEnabledSwapGate", () => {
    let c = circuit(`-s-•-s-•-•
                     --ss---sMs
                     --X-ss-s-s
                     ----s-----
                     -----s----`);

    assertFalse(c.colHasEnabledSwapGate(-1));
    assertFalse(c.colHasEnabledSwapGate(0));
    assertFalse(c.colHasEnabledSwapGate(1));
    assertFalse(c.colHasEnabledSwapGate(2));
    assertFalse(c.colHasEnabledSwapGate(3));
    assertFalse(c.colHasEnabledSwapGate(5));
    assertFalse(c.colHasEnabledSwapGate(6));
    assertFalse(c.colHasEnabledSwapGate(8));
    assertFalse(c.colHasEnabledSwapGate(9));
    assertFalse(c.colHasEnabledSwapGate(10));

    assertTrue(c.colHasEnabledSwapGate(4));
    assertTrue(c.colHasEnabledSwapGate(7));
});

suite.test("locHasControllableGate", () => {
    let c = circuit(`•H-M-H-X-----
                     -%-.--s------
                     ------s-s----`);

    assertFalse(c.locHasControllableGate(new Point(-100, 0)));
    assertFalse(c.locHasControllableGate(new Point(+100, 0)));
    assertFalse(c.locHasControllableGate(new Point(0, -100)));
    assertFalse(c.locHasControllableGate(new Point(0, +100)));

    // Empty.
    assertFalse(c.locHasControllableGate(new Point(2, 0)));

    assertTrue(c.locHasControllableGate(new Point(1, 0)));
    assertTrue(c.locHasControllableGate(new Point(1, 1)));
    assertTrue(c.locHasControllableGate(new Point(7, 0)));
    assertTrue(c.locHasControllableGate(new Point(6, 1)));
    assertTrue(c.locHasControllableGate(new Point(6, 2)));

    // Controllable even if disallowed.
    assertTrue(c.locHasControllableGate(new Point(3, 0)));
    assertTrue(c.locHasControllableGate(new Point(5, 0)));

    // Spacer.
    assertFalse(c.locHasControllableGate(new Point(3, 1)));

    // Control.
    assertFalse(c.locHasControllableGate(new Point(0, 0)));

    // Unmatched swap.
    assertFalse(c.locHasControllableGate(new Point(8, 2)));
});

suite.test("colHasControls", () => {
    let c = circuit(`-•-•----
                     M-◦-X-•-
                     ---◦----`);

    assertFalse(c.colHasControls(-1));
    assertFalse(c.colHasControls(0));
    assertTrue(c.colHasControls(1));
    assertTrue(c.colHasControls(2));
    assertTrue(c.colHasControls(3));
    assertFalse(c.colHasControls(4));
    assertFalse(c.colHasControls(5));
    assertTrue(c.colHasControls(6));
    assertFalse(c.colHasControls(7));
    assertFalse(c.colHasControls(8));
    assertFalse(c.colHasControls(9));
});

suite.test("colHasSingleWireControl", () => {
    let c = circuit(`-•-•----
                     M-◦-X-•-
                     ---◦----`);

    assertFalse(c.colHasSingleWireControl(-1));
    assertFalse(c.colHasSingleWireControl(0));
    assertTrue(c.colHasSingleWireControl(1));
    assertFalse(c.colHasSingleWireControl(2));
    assertTrue(c.colHasSingleWireControl(3));
    assertFalse(c.colHasSingleWireControl(4));
    assertFalse(c.colHasSingleWireControl(5));
    assertFalse(c.colHasSingleWireControl(6));
    assertFalse(c.colHasSingleWireControl(7));
    assertFalse(c.colHasSingleWireControl(8));
    assertFalse(c.colHasSingleWireControl(9));
});

suite.test("colHasDoubleWireControl", () => {
    let c = circuit(`-•-•----
                     M-◦-X-•-
                     ---◦----`);

    assertFalse(c.colHasDoubleWireControl(-1));
    assertFalse(c.colHasDoubleWireControl(0));
    assertFalse(c.colHasDoubleWireControl(1));
    assertTrue(c.colHasDoubleWireControl(2));
    assertFalse(c.colHasDoubleWireControl(3));
    assertFalse(c.colHasDoubleWireControl(4));
    assertFalse(c.colHasDoubleWireControl(5));
    assertTrue(c.colHasDoubleWireControl(6));
    assertFalse(c.colHasDoubleWireControl(7));
    assertFalse(c.colHasDoubleWireControl(8));
    assertFalse(c.colHasDoubleWireControl(9));
});

suite.test("gateAtLocIsDisabledReason", () => {
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(-100, 0, `-`);
    good(+100, 0, `-`);
    good(0, -100, `-`);
    good(0, +100, `-`);

    // Controlled measurement.
    bad(1, 1, `-•-
               -M-
               ---`);

    good(1, 1, `---
                -M-
                ---`);

    // Unpaired swap.
    bad(1, 1, `---
               -s-
               ---`);

    bad(1, 1, `-s-
               -s-
               -s-`);

    good(1, 1, `-s-
                -s-
                ---`);

    // Swap that causes a measured value to be affected by a coherent value.
    bad(1, 1, `-s-
               Ms-
               -•-`);

    bad(1, 1, `-s-
               Ms-
               M•-`);

    bad(1, 1, `Ms-
               Ms-
               -•-`);

    good(1, 1, `-s-
                -s-
                -•-`);

    good(1, 1, `-s-
                -s-
                M•-`);

    good(1, 1, `Ms-
                Ms-
                M•-`);

    // Recohering.
    bad(1, 1, `---
               MH-
               ---`);
    good(1, 1, `---
                -H-
                ---`);

    // Permutation of a measured value involving a coherent control or second value.
    bad(1, 1, `---
               MX-
               -•-`);

    good(1, 1, `---
                MX-
                M•-`);

    good(1, 1, `---
                MZ-
                -•-`);

    good(1, 1, `---
                M%-
                -•-`);

    good(1, 1, `---
                -X-
                ---`);

    // Control inside gate.
    bad(1, 1, `---
               -2-
               -•-`);
    bad(1, 1, `---
               -D/
               -◦/`);
    good(1, 1, `---
               -D•
               -X◦`);
});

suite.test("gateAtLocIsDisabledReason_controls", () => {
    assertThat(circuit(`-•-◦-⊖-⊕-M-⊕-⊖-◦-•-`)).isNotEqualTo(undefined);

    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(1, 1, `---
                M•-
                ---`);

    good(1, 1, `---
                M◦-
                ---`);

    bad(1, 1, `---
               M⊖-
               ---`);

    bad(1, 1, `---
               M⊕-
               ---`);

    good(1, 1, `---
                -•M
                ---`);

    good(1, 1, `---
                -◦M
                ---`);

    good(1, 1, `---
                -⊖M
                ---`);

    good(1, 1, `---
                -⊕M
                ---`);
});

suite.test("gateAtLocIsDisabledReason_tagCollision", () => {
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(1, 1, `---
                -a-
                ---`);

    good(1, 1, `---
                aa-
                ---`);

    good(1, 1, `---
                -a-
                -a-`);

    bad(1, 1, `-a-
               -a-
               ---`);

    bad(1, 1, `-a-
               -A-
               -#-`);

    bad(1, 1, `-b-
               -b-
               ---`);

    good(1, 1, `-b-
                -a-
                ---`);
});

suite.test("gateAtLocIsDisabledReason_needInput", () => {
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(1, 1, `---
                -X-
                ---`);

    bad(1, 1, `---
               -⩲-
               ---`);

    bad(1, 1, `-b-
               -⩲-
               ---`);

    good(1, 1, `-a-
                -⩲-
                ---`);

    // Still works when one of the inputs is broken.
    good(1, 1, `-a-
                -⩲-
                -a-`);

    bad(1, 1, `---
               -⨧-
               -#-`);

    good(1, 1, `-a-
                -⨧-
                -#-`);

    // Overlap.
    bad(1, 1, `-A-
               -⨧-
               -#-`);

    bad(1, 1, `---
               -⩮-
               ---`);

    bad(1, 1, `-a-
               -⩮-
               ---`);

    bad(1, 1, `-b-
               -⩮-
               ---`);

    good(1, 1, `-a-
                -⩮-
                -b-`);
});

suite.test("gateAtLocIsDisabledReason_tagWithWrongCoherence", () => {
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);


    good(3, 1, `---a-
                ---⩲-
                -----`);

    good(3, 1, `-M-a-
                ---⩲-
                -----`);

    bad(3, 1, `---a-
               -M-⩲-
               -----`);

    good(3, 1, `-M-a-
                -M-⩲-
                -----`);

    good(3, 2, `---A-
                ---#-
                ---⨧-
                ---#-`);

    good(3, 2, `---A-
                -M-#-
                ---⨧-
                ---#-`);

    bad(3, 2, `---A-
               ---#-
               -M-⨧-
               ---#-`);

    bad(3, 2, `---A-
               ---#-
               ---⨧-
               -M-#-`);

    bad(3, 2, `---A-
               ---#-
               -M-⨧-
               -M-#-`);

    good(3, 2, `-M-A-
                -M-#-
                ---⨧-
                ---#-`);

    good(3, 2, `-M-A-
                -M-#-
                -M-⨧-
                -M-#-`);

    good(3, 1, `---a-
                ---⩮-
                ---b-`);

    good(3, 1, `-M-a-
                ---⩮-
                ---b-`);

    good(3, 1, `---a-
                ---⩮-
                -M-b-`);

    good(3, 1, `-M-a-
                ---⩮-
                -M-b-`);

    bad(3, 1, `---a-
               -M-⩮-
               ---b-`);

    bad(3, 1, `-M-a-
               -M-⩮-
               ---b-`);

    bad(3, 1, `---a-
               -M-⩮-
               -M-b-`);

    good(3, 1, `-M-a-
                -M-⩮-
                -M-b-`);
});

suite.test("gateAtLocIsDisabledReason_multiwireOperations", () => {
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    bad(1, 1, `---
               M2-
               -/-`);

    bad(1, 1, `---
               -2-
               M/-`);

    bad(1, 1, `-•-
               M2-
               M/-`);

    bad(1, 1, `---
               MQ-
               M/-`);

    good(1, 1, `---
                -Q-
                -/-`);

    good(1, 1, `---
                -2-
                -/-`);

    good(1, 1, `---
                M2-
                M/-`);

    good(1, 1, `-•-
                MD/
                M//`);

});

suite.test("colCustomContextFromGates", () => {
    let c = circuit(`-a-b-
                     -a-a-
                     --X--`);
    assertThat(c.colCustomContextFromGates(-10, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(0, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(1, 0)).isEqualTo(new Map([["Input Range A", {offset: 0, length: 1}]]));
    assertThat(c.colCustomContextFromGates(2, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(3, 0)).isEqualTo(new Map([
        ["Input Range A", {offset: 1, length: 1}],
        ["Input Range B", {offset: 0, length: 1}]
    ]));
    assertThat(c.colCustomContextFromGates(3, 10)).isEqualTo(new Map([
        ["Input Range A", {offset: 11, length: 1}],
        ["Input Range B", {offset: 10, length: 1}]
    ]));
    assertThat(c.colCustomContextFromGates(4, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(4, 10)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(5, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(100, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(Infinity, 0)).isEqualTo(new Map());
    assertThat(c.colCustomContextFromGates(Infinity, 1)).isEqualTo(new Map());
});

suite.test("isSlotRectCoveredByGateInSameColumn", () => {
    assertFalse(circuit(`-
                         -
                         -`).isSlotRectCoveredByGateInSameColumn(0, 0, 2));
    assertTrue(circuit(`X
                        -
                        -`).isSlotRectCoveredByGateInSameColumn(0, 0, 2));
    assertFalse(circuit(`X
                         -
                         -`).isSlotRectCoveredByGateInSameColumn(0, 1, 2));
    assertTrue(circuit(`-
                        X
                        -`).isSlotRectCoveredByGateInSameColumn(0, 0, 2));
    assertFalse(circuit(`-
                         X
                         -`).isSlotRectCoveredByGateInSameColumn(0, 0, 1));
    assertTrue(circuit(`2
                        /
                        -`).isSlotRectCoveredByGateInSameColumn(0, 1, 1));
});
