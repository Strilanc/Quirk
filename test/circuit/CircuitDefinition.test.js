/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "../TestUtil.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"

import {setGateBuilderEffectToCircuit} from "../../src/circuit/CircuitComputeUtil.js"
import {Complex} from "../../src/math/Complex.js"
import {Controls} from "../../src/circuit/Controls.js"
import {Gate, GateBuilder} from "../../src/circuit/Gate.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {Gates} from "../../src/gates/AllGates.js"
import {Matrix} from "../../src/math/Matrix.js"
import {Point} from "../../src/math/Point.js"
import {Seq, seq} from "../../src/base/Seq.js"
import {Serializer} from "../../src/circuit/Serializer.js"
import {Util} from "../../src/base/Util.js"

let suite = new Suite("CircuitDefinition");

const X = Gates.HalfTurns.X;
const Y = Gates.HalfTurns.Y;
const Z = Gates.HalfTurns.Z;
const H = Gates.HalfTurns.H;
const C = Gates.Controls.Control;
const _ = undefined;
const TEST_GATES = new Map([
    ['X', X],
    ['Y', Y],
    ['Z', Z],
    ['H', H],
    ['●', C],
    ['○', Gates.Controls.AntiControl],
    ['⊖', Gates.Controls.XControl],
    ['⊕', Gates.Controls.XAntiControl],
    ['⊗', Gates.Controls.YAntiControl],
    ['.', Gates.SpacerGate],

    ['A', Gates.InputGates.InputAFamily],
    ['B', Gates.InputGates.InputBFamily],

    ['M', Gates.Special.Measurement],
    ['%', Gates.Displays.ChanceDisplay],
    ['D', Gates.Displays.DensityMatrixDisplayFamily],
    ['@', Gates.Displays.BlochSphereDisplay],
    ['s', Gates.Special.SwapHalf],
    ['!', Gates.PostSelectionGates.PostSelectOn],

    ['-', undefined],
    ['=', undefined],
    ['+', undefined],
    ['|', undefined],
    ['/', null],

    ['#', new GateBuilder().setKnownEffectToMatrix(Matrix.zero(4, 4)).setWidth(2).setHeight(2).gate],
    ['~', new GateBuilder().setKnownEffectToMatrix(Matrix.zero(2, 2)).setWidth(3).gate],
    ['2', Gates.IncrementGates.IncrementFamily.ofSize(2)],
    ['3', Gates.IncrementGates.IncrementFamily.ofSize(3)],
    ['Q', new GateBuilder().
        setKnownEffectToMatrix(Matrix.square(1, 1, 1, 1,
                               1, Complex.I, -1, Complex.I.neg(),
                               1, -1, 1, -1,
                               1, Complex.I.neg(), -1, Complex.I)).
        setHeight(2).
        gate],
    ['t', Gates.Exponentiating.XForward]
]);
const circuit = (diagram, ...extraGates) => CircuitDefinition.fromTextDiagram(
    Util.mergeMaps(TEST_GATES, new Map(extraGates)),
    diagram);

/**
 * @param {!CircuitDefinition} circ
 * @returns {!Gate}
 */
function circuitDefinitionToGate(circ) {
    return setGateBuilderEffectToCircuit(new GateBuilder(), circ).gate;
}

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
        -●
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
    assertThat(circuit(`●Z#M
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
    assertThat(typeof circuit('tXY●').readableHash()).isEqualTo('string');
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
                        -●--
                        -○--`).withHeightOverlapsFixed()).isEqualTo(circuit(`-2-Z-
                                                                             -/Yt-
                                                                             -●●--
                                                                             -○○--`));
    assertThat(circuit(`-3-
                        -●-
                        -●-
                        -○-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-3--
                                                                            -/●-
                                                                            -/●-
                                                                            -○○-`));
    assertThat(circuit(`-3-
                        -●-
                        -●-
                        -X-`).withHeightOverlapsFixed()).isEqualTo(circuit(`-3--
                                                                            -/●-
                                                                            -/●-
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
    let assertAbout = (diagram, ...extraGates) => {
        let c = circuit(
            diagram,
            ['D', Gates.Detectors.ZDetector],
            ['R', Gates.Detectors.ZDetectControlClear],
            ...extraGates);
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
    assertAbout('XYZt!D%').isEqualTo([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // Measurement is idempodent
    assertAbout('MM').isEqualTo([0, 0, 1, 1, 1]);
    // Post-selection clears
    assertAbout(`M!`).isEqualTo([0, 0, 1, 0, 0]);
    // Detector clears.
    assertAbout(`MD`).isEqualTo([0, 0, 1, 0, 0]);
    // Detect-Control-Reset clears.
    assertAbout(`MR`).isEqualTo([0, 0, 1, 0, 0]);
    assertAbout(`MR
                 -X`).isEqualTo([0, 0, 1, 0, 0]);
    // Controlled detector doesn't clear.
    assertAbout(`MD
                 -●`).isEqualTo([0, 0, 1, 1, 1]);
    assertAbout(`MD
                 M●`).isEqualTo([0, 0, 3, 3, 3]);
    // Swap moves measured
    assertAbout(`---s=
                 -M=s-`).isEqualTo([0, 0, 0, 2, 2, 1, 1, 1]);
    // Custom permutations move measured
    assertAbout(`---↡=↡-
                 ---/-/=
                 -M=/-/-`, ['↡', Gates.CycleBitsGates.CycleBitsFamily]).isEqualTo([0, 0, 0, 4, 4, 1, 1, 2, 2, 2]);
    assertAbout(`---R=R-
                 ---/-/-
                 -M=/-/=`, ['R', Gates.ReverseBitsGateFamily]).isEqualTo([0, 0, 0, 4, 4, 1, 1, 4, 4, 4]);

    // Disallowed measurements don't cause measurement. Controlled measurement not allowed.
    assertAbout(`●
                 M`).isEqualTo([0, 0, 0, 0]);
    // Disallowed swaps don't swap.
    assertAbout(`-s
                 Ms
                 -●`).isEqualTo([0, 0, 2, 2, 2]);
    assertAbout(`-s
                 Ms
                 M●`).isEqualTo([0, 0, 6, 6, 6]);
    assertAbout(`-s
                 -s
                 M●`).isEqualTo([0, 0, 4, 4, 4]);
    // Disallowed post-selections don't clear.
    assertAbout(`M!
                 -●`).isEqualTo([0, 0, 1, 1, 1]);
    // Unclear post-selections also don't clear.
    assertAbout(`M!
                 M●`).isEqualTo([0, 0, 3, 3, 3]);
});

suite.test("colDesiredSingleQubitStatsMask", () => {
    let assertAbout = (diagram, ...extraGates) => {
        let c = circuit(diagram, ...extraGates);
        return assertThat(Seq.range(c.columns.length + 3).map(i => c.colDesiredSingleQubitStatsMask(i-1)).toArray());
    };

    //noinspection SpellCheckingInspection
    assertAbout('XYZH●○M%D?@s!-#~23t', ['?', Gates.Displays.DensityMatrixDisplay2]).
        isEqualTo([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assertAbout('%D@').isEqualTo([0, 1, 1, 1, 0, 0]);
    assertAbout(`---%--
                 %--%-!
                 --D%--
                 -@-%--`).isEqualTo([0, 2, 8, 4, 15, 0, 0, 0, 0]);
});

suite.test("nonUnitaryGates", () => {
    let c = circuit(`-M-●-
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
                     -//●-`);

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
                     -//●-`);

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
    let c = circuit(`-●-○-⊖⊗⊕-M-⊕⊗⊖-○-●-`);
    assertThat(c.colControls(-1)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(0)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(1)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(3)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(5)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(6)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(7)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(9)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(11)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(12)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(13)).isEqualTo(Controls.NONE);
    assertThat(c.colControls(15)).isEqualTo(Controls.bit(0, false));
    assertThat(c.colControls(17)).isEqualTo(Controls.bit(0, true));
    assertThat(c.colControls(102)).isEqualTo(Controls.NONE);

    let c2 = circuit(`--●○○-P-
                      -X○●s-P-
                      ---s●-X-`, ['P', Gates.Controls.ZParityControl]);
    assertThat(c2.colControls(0)).isEqualTo(Controls.NONE);
    assertThat(c2.colControls(1)).isEqualTo(Controls.NONE);
    assertThat(c2.colControls(2)).isEqualTo(new Controls(3, 1));
    assertThat(c2.colControls(3)).isEqualTo(new Controls(3, 2));
    assertThat(c2.colControls(4)).isEqualTo(new Controls(5, 4));
    assertThat(c2.colControls(5)).isEqualTo(Controls.NONE);
    assertThat(c2.colControls(6)).isEqualTo(new Controls(1, 1, 3));
    assertThat(c2.colControls(7)).isEqualTo(Controls.NONE);
});

suite.test("locIsControlWireStarter", () => {
    let c = circuit(`Z●Y--
                     -#/%○
                     -/○●-`);

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
    let c = circuit(`-M-●-
                     -M-○-
                     ---●-
                     ---○-
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
    let c = circuit(`-M-●-
                     -M-○-
                     ---●-
                     ---○-
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

suite.test("colGetEnabledSwapGate", () => {
    let c = circuit(`-s-●-s-●-●
                     --ss---sMs
                     --X-ss-s-s
                     ----s-----
                     -----s----`);

    assertThat(c.colGetEnabledSwapGate(-1)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(0)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(1)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(2)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(3)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(5)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(6)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(8)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(9)).isEqualTo(undefined);
    assertThat(c.colGetEnabledSwapGate(10)).isEqualTo(undefined);

    assertThat(c.colGetEnabledSwapGate(4)).isEqualTo([2, 3]);
    assertThat(c.colGetEnabledSwapGate(7)).isEqualTo([1, 2]);
});

suite.test("locHasControllableGate", () => {
    let c = circuit(`●H-M-H-X-----
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
    assertTrue(c.locHasControllableGate(new Point(8, 2)));
});

suite.test("colHasControls", () => {
    let c = circuit(`-●-●----
                     M-○-X-●-
                     ---○----`);

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
    let c = circuit(`-●-●----
                     M-○-X-●-
                     ---○----`);

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
    let c = circuit(`-●-●----
                     M-○-X-●-
                     ---○----`);

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
    let bad = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(diagram, ...extraGates).gateAtLocIsDisabledReason(col, row)).withInfo({diagram}).isNotEqualTo(undefined);
    let good = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(diagram, ...extraGates).gateAtLocIsDisabledReason(col, row)).withInfo({diagram}).isEqualTo(undefined);

    good(-100, 0, `-`);
    good(+100, 0, `-`);
    good(0, -100, `-`);
    good(0, +100, `-`);

    // Controlled measurement.
    bad(1, 1, `-●-
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
               -●-`);

    bad(1, 1, `-s-
               Ms-
               M●-`);

    bad(1, 1, `Ms-
               Ms-
               -●-`);

    good(1, 1, `-s-
                -s-
                -●-`);

    good(1, 1, `-s-
                -s-
                M●-`);

    good(1, 1, `Ms-
                Ms-
                M●-`);

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
               -●-`);

    good(1, 1, `---
                MX-
                M●-`);

    good(1, 1, `---
                MZ-
                -●-`);

    good(1, 1, `---
                M%-
                -●-`);

    good(1, 1, `---
                -X-
                ---`);

    // Control inside gate.
    bad(1, 1, `---
               -2-
               -●-`);
    bad(1, 1, `---
               -?/
               -○/`, ['?', Gates.Displays.DensityMatrixDisplay2]);
    good(1, 1, `---
               -?●
               -X○`, ['?', Gates.Displays.DensityMatrixDisplay2]);

    // Controlled bit permutations.
    good(1, 1, `-●-
                -<-
                -/-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);
    good(1, 1, `M●-
                -<-
                -/-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);
    good(1, 1, `M●-
                M<-
                M/-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);

    bad(1, 1, `M●-
               M<-
               -/-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);
    bad(1, 1, `-●-
               M<-
               -/-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);
    bad(1, 1, `-●-
               M<-
               M/-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);

    // Detectors.
    bad(1, 0, `MD`, ['D', Gates.Detectors.XDetectControlClear]);
    bad(1, 0, `MD`, ['D', Gates.Detectors.YDetectControlClear]);
    good(1, 0, `MD`, ['D', Gates.Detectors.ZDetectControlClear]);
    bad(1, 0, `MR`, ['R', Gates.Detectors.XDetectControlClear]);
    bad(1, 0, `MR`, ['R', Gates.Detectors.YDetectControlClear]);
    good(1, 0, `MR`, ['R', Gates.Detectors.ZDetectControlClear]);
    good(3, 1, `---]-
                -M-X-`, [']', Gates.Detectors.XDetectControlClear]);
    good(3, 1, `---]-
                -M-X-`, [']', Gates.Detectors.YDetectControlClear]);
    good(3, 1, `---]-
                -M-X-`, [']', Gates.Detectors.ZDetectControlClear]);

    // Permutation sub-groups.
    good(2, 0, `--P-
                --/-
                --/-
                --/-
                H-●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    good(2, 0, `-MP-
                --/-
                --/-
                -M/-
                H-●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    good(2, 0, `--P-
                --/-
                --/-
                -M/-
                HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    good(2, 0, `-MP-
                --/-
                --/-
                -M/-
                HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    good(2, 0, `--P-
                -M/-
                -M/-
                --/-
                HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    good(2, 0, `-MP-
                -M/-
                -M/-
                -M/-
                HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    bad(2, 0, `--P-
               -M/-
               -M/-
               --/-
               H-●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    bad(2, 0, `--P-
               -M/-
               --/-
               --/-
               HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);

    // Non-trivial subgroup.
    good(2, 0, `--P-
                -M/-
                -M/-
                --/-
                -M/-
                --/-
                --/-
                HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
    bad(2, 0, `--P-
               -M/-
               --/-
               -M/-
               -M/-
               --/-
               --/-
               HM●-`, ['P', Gates.InterleaveBitsGates.InterleaveBitsGateFamily]);
});

suite.test("gateAtLocIsDisabledReason_controls", () => {
    assertThat(circuit(`-●-○-⊖-⊕-M-⊕-⊖-○-●-`)).isNotEqualTo(undefined);

    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(1, 1, `---
                M●-
                ---`);

    good(1, 1, `---
                M○-
                ---`);

    bad(1, 1, `---
               M⊖-
               ---`);

    bad(1, 1, `---
               M⊕-
               ---`);

    good(1, 1, `---
                -●M
                ---`);

    good(1, 1, `---
                -○M
                ---`);

    good(1, 1, `---
                -⊖M
                ---`);

    good(1, 1, `---
                -⊕M
                ---`);
});

suite.test("gateAtLocIsDisabledReason_tagCollision", () => {
    /**
     * @param {!int} col
     * @param {!int} row
     * @param {!string} diagram
     * @param {![!string, !Gate]} extraGates
     */
    let bad = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(diagram, ...extraGates).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(diagram, ...extraGates).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(1, 1, `---
                -A-
                ---`);

    good(1, 1, `---
                AA-
                ---`);

    good(1, 1, `---
                -A-
                -A-`);

    bad(1, 1, `-A-
               -A-
               ---`);

    bad(1, 1, `-A-
               -?-
               -#-`, ['?', Gates.InputGates.InputAFamily.ofSize(2)]);

    bad(1, 1, `-B-
               -B-
               ---`);

    good(1, 1, `-B-
                -A-
                ---`);
});

suite.test("gateAtLocIsDisabledReason_needInput", () => {
    let ownExtraGates = [
        ['*', Gates.MultiplyAccumulateGates.MultiplyAddInputsFamily],
        ['⩲', Gates.Arithmetic.PlusAFamily],
        ['⨧', Gates.Arithmetic.PlusAFamily.ofSize(2)],
        ['?', Gates.InputGates.InputAFamily.ofSize(2)]
    ];
    let bad = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(
            diagram,
            ...ownExtraGates,
            ...extraGates).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(
            diagram,
            ...ownExtraGates,
            ...extraGates).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    good(1, 1, `---
                -X-
                ---`);

    bad(1, 1, `---
               -⩲-
               ---`);

    bad(1, 1, `-B-
               -⩲-
               ---`);

    good(1, 1, `-A-
                -⩲-
                ---`);

    // Still works when one of the inputs is broken.
    good(1, 1, `-A-
                -⩲-
                -A-`);

    bad(1, 1, `---
               -⨧-
               -#-`);

    good(1, 1, `-A-
                -⨧-
                -#-`);

    // Overlap.
    bad(1, 1, `-?-
               -⨧-
               -#-`);

    bad(1, 1, `---
               -*-
               ---`);

    bad(1, 1, `-A-
               -*-
               ---`);

    bad(1, 1, `-B-
               -*-
               ---`);

    good(1, 1, `-A-
                -*-
                -B-`);
});

suite.test("gateAtLocIsDisabledReason_tagWithWrongCoherence", () => {
    let ownExtraGates = [
        ['*', Gates.MultiplyAccumulateGates.MultiplyAddInputsFamily],
        ['⩲', Gates.Arithmetic.PlusAFamily],
        ['⨧', Gates.Arithmetic.PlusAFamily.ofSize(2)],
        ['?', Gates.InputGates.InputAFamily.ofSize(2)]
    ];
    let bad = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(
            diagram,
            ...ownExtraGates,
            ...extraGates).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(
            diagram,
            ...ownExtraGates,
            ...extraGates).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);


    good(3, 1, `---A-
                ---⩲-
                -----`);

    good(3, 1, `-M-A-
                ---⩲-
                -----`);

    bad(3, 1, `---A-
               -M-⩲-
               -----`);

    good(3, 1, `-M-A-
                -M-⩲-
                -----`);

    good(3, 2, `---?-
                ---#-
                ---⨧-
                ---#-`);

    good(3, 2, `---?-
                -M-#-
                ---⨧-
                ---#-`);

    bad(3, 2, `---?-
               ---#-
               -M-⨧-
               ---#-`);

    bad(3, 2, `---?-
               ---#-
               ---⨧-
               -M-#-`);

    bad(3, 2, `---?-
               ---#-
               -M-⨧-
               -M-#-`);

    good(3, 2, `-M-?-
                -M-#-
                ---⨧-
                ---#-`);

    good(3, 2, `-M-?-
                -M-#-
                -M-⨧-
                -M-#-`);

    good(3, 1, `---A-
                ---*-
                ---B-`);

    good(3, 1, `-M-A-
                ---*-
                ---B-`);

    good(3, 1, `---A-
                ---*-
                -M-B-`);

    good(3, 1, `-M-A-
                ---*-
                -M-B-`);

    bad(3, 1, `---A-
               -M-*-
               ---B-`);

    bad(3, 1, `-M-A-
               -M-*-
               ---B-`);

    bad(3, 1, `---A-
               -M-*-
               -M-B-`);

    good(3, 1, `-M-A-
                -M-*-
                -M-B-`);
});

suite.test("getUnmetContextKeys", () => {
    let ownExtraGates = [
        ['⩲', Gates.Arithmetic.PlusAFamily],
        ['*', Gates.MultiplyAccumulateGates.MultiplyAddInputsFamily],
        ['x', Gates.ParametrizedRotationGates.XToA],
        ['a', Gates.InputGates.SetA]
    ];
    let query = (diagram, ...extraGates) => circuit(
        diagram,
        ...ownExtraGates,
        ...extraGates).getUnmetContextKeys();


    assertThat(query(`---
                      -Y-`)).isEqualTo(new Set());

    assertThat(query(`-A-
                      -x-`)).isEqualTo(new Set());

    assertThat(query(`-A-
                      -⩲-`)).isEqualTo(new Set());

    assertThat(query(`a--
                      -⩲-`)).isEqualTo(new Set());

    assertThat(query(`---
                      -⩲-`)).isEqualTo(new Set(['Input Range A']));

    assertThat(query(`---
                      -*-`)).isEqualTo(new Set(['Input Range A', 'Input Range B']));

    assertThat(query(`-A-
                      -*-`)).isEqualTo(new Set(['Input Range B']));

    assertThat(query(`aB-
                      -*-`)).isEqualTo(new Set());

    assertThat(query(`---
                      -x-`)).isEqualTo(new Set(['Input NO_DEFAULT Range A']));

    assertThat(query(`a--
                      -x-`)).isEqualTo(new Set(['Input NO_DEFAULT Range A']));
});

suite.test("gateAtLocIsDisabledReason_multiwireOperations", () => {
    let bad = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(diagram, ...extraGates).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram, ...extraGates) =>
        assertThat(circuit(diagram, ...extraGates).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    bad(1, 1, `---
               M2-
               -/-`);

    bad(1, 1, `---
               -2-
               M/-`);

    bad(1, 1, `-●-
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

    good(1, 1, `-●-
                MD/
                M//`);

});

suite.test("withSwitchedInitialStateOn", () => {
    let c = circuit(`-
                     -`);
    assertThat(c.customInitialValues).isEqualTo(new Map());

    c = c.withSwitchedInitialStateOn(0);
    assertThat(c.customInitialValues).isEqualTo(new Map([[0, '1']]));

    c = c.withSwitchedInitialStateOn(0);
    assertThat(c.customInitialValues).isEqualTo(new Map([[0, '+']]));

    c = c.withSwitchedInitialStateOn(0, 0);
    assertThat(c.customInitialValues).isEqualTo(new Map());
});

suite.test("colCustomContextFromGates", () => {
    let c = circuit(`-A-B-
                     -A-A-
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

suite.test("controlLineRanges", () => {
    // Basic CNOTs.
    assertControlLinesMatchDiagram(`-●-X-●-X-M=●=
                                         | |   ║
                                    -●-X-X-●---X-`);

    // Mixed measurement CNOTs.
    assertControlLinesMatchDiagram(`---●-X-
                                       | ┃
                                    ---X-●-
                                       ║ ║
                                    -M-●=●=`);

    // Swap gates.
    assertControlLinesMatchDiagram(`-s-s-s-s-s---s===s=
                                       | |   |   |   ┃
                                    ---s-+-s-s-M=s-M=s=
                                         |   |       ║
                                    -----s-s-●-----M=●=`);

    // Input/output gates.
    assertControlLinesMatchDiagram(`-A-A-A-A---A-P-P-P-
                                       | | |   | ┃ ┃ ║
                                    ---/-P-P---P-A-A-+-
                                       |   |   ║ ║ ║ ║
                                    -●-P---●-M=●=●=A=A=`, ['P', Gates.Arithmetic.PlusAFamily]);

    // Custom circuit gate containing outputs.
    let N = circuitDefinitionToGate(circuit(`-P-`, ['P', Gates.Arithmetic.PlusAFamily]));
    assertControlLinesMatchDiagram(`-A-A-A---A-N-
                                       | |   | ┃
                                    ---N-N---N-A-
                                         |   ║ ║
                                    -●---●-M=●=●=`, ['N', N]);

    // Custom circuit gate containing inputs.
    let I = circuitDefinitionToGate(circuit(`-A-`));
    assertControlLinesMatchDiagram(`-I-I-I---I-P-
                                     |   |   ║ ║
                                    -+-P-P---P-I-
                                     |   |   ║ ║
                                    -●---●-M=●=●=`, ['P', Gates.Arithmetic.PlusAFamily], ['I', I]);

    // Custom matrix operations.
    let customIdentityGate = Serializer.fromJson(Gate, {
        id: "~stay",
        name: "id",
        matrix: "{{1,0},{0,1}}"
    });
    let customOtherGate = Serializer.fromJson(Gate, {
        id: "~jump",
        name: "id",
        matrix: "{{1,0},{0,i}}"
    });
    assertControlLinesMatchDiagram(`-I-J-
                                       |
                                    -●-●-`, ['I', customIdentityGate], ['J', customOtherGate]);
});

/**
 * @param {!string} diagram
 * @param {...[!string, !Gate]} extraGates
 */
function assertControlLinesMatchDiagram(diagram, ...extraGates) {
    let lines = diagram.split('\n');
    let indentation = lines[2].search(/\S/);
    let c = circuit(seq(lines).stride(2).join('\n'), ...extraGates);
    let controlLines = seq(lines).
        skip(1).
        stride(2).
        map(e => e.substring(indentation)).
        map(e => seq(e).
            map(c => c === '┃' ? 3 :
                     c === '║' ? 2 :
                     c === '|' || c === '│' ? 1 :
                     0).
            padded(c.columns.length, 0).
            toArray()).
        toArray();

    for (let col = 0; col < c.columns.length; col++) {
        let diagramColControlLines = new Array(c.numWires - 1).fill(0);
        for (let {first, last, measured} of c.controlLinesRanges(col)) {
            for (let i = first; i < last; i++) {
                diagramColControlLines[i] |= measured ? 2 : 1;
            }
        }

        for (let row = 0; row < c.numWires - 1; row++) {
            assertThat(controlLines[row][col]).
                withInfo({col, row, diagram}).
                isEqualTo(diagramColControlLines[row]);
        }
    }
}
