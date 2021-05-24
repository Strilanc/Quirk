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

import {Suite, assertThat, assertThrows} from "../TestUtil.js"
import {DisplayedCircuit} from "../../src/ui/DisplayedCircuit.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {CircuitStats} from "../../src/circuit/CircuitStats.js"
import {Gates} from "../../src/gates/AllGates.js"
import {Point} from "../../src/math/Point.js"
import {RestartableRng} from "../../src/base/RestartableRng.js"
import {Hand} from "../../src/ui/Hand.js"
import {Painter} from "../../src/draw/Painter.js"

const COMMON_GATES = new Map([
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
    ['Q', Gates.FourierTransformGates.FourierTransformFamily],
    ['•', Gates.Controls.Control],
    ['◦', Gates.Controls.AntiControl],

    ['M', Gates.Special.Measurement],
    ['%', Gates.Displays.ChanceDisplay],
    ['@', Gates.Displays.BlochSphereDisplay],
    ['s', Gates.Special.SwapHalf],
    ['!', Gates.PostSelectionGates.PostSelectOn],

    ['-', undefined],
    ['+', undefined],
    ['0', null],
    ['1', null],
    ['2', null],
    ['3', null],
    ['4', null],
    ['5', null],
    ['6', null],
    ['7', null],
    ['8', null],
    ['9', null],

    ['/', null]
]);

let circuit = (diagramText, ...extraGateEntries) => CircuitDefinition.fromTextDiagram(
    new Map([
        ...COMMON_GATES.entries(),
        ...extraGateEntries
    ]),
    diagramText);

/**
 * @param {!string} diagramText
 * @param {!Array<*>} extraGateEntries
 * @returns {!{circuit: !DisplayedCircuit, pts: !Array.<!Point>}}
 */
let displayedCircuit = (diagramText, ...extraGateEntries) => DisplayedCircuit.fromTextDiagram(
    new Map([
        ...COMMON_GATES.entries(),
        ...extraGateEntries
    ]),
    diagramText);

/**
 * @param {!string} diagramText
 * @param {undefined|!{duplicate: undefined|!boolean, wholeColumn: undefined|!boolean}} options
 * @param {!Array<*>} extraGateEntries
 * @returns {{
 *   beforeGrab: !DisplayedCircuit,
 *   afterGrab: !DisplayedCircuit,
 *   hovers: !Array.<!DisplayedCircuit>,
 *   afterDrop: !DisplayedCircuit,
 *   afterDropAndTidy: !DisplayedCircuit,
 * }}
 */
let simulateDrag = (diagramText, options={}, ...extraGateEntries) => {
    let duplicate = options.duplicate || false;
    let wholeColumn = options.wholeColumn || false;

    let {circuit: beforeGrab, pts} = displayedCircuit(diagramText, ...extraGateEntries);
    let {newCircuit: afterGrab, newHand: fullHand} =
        beforeGrab.tryGrab(Hand.EMPTY.withPos(pts[0]), duplicate, wholeColumn);
    let hovers = [];
    for (let pt of pts) {
        hovers.push(afterGrab.previewDrop(fullHand.withPos(pt)));
    }
    let afterDrop = afterGrab.afterDropping(fullHand.withPos(pts[pts.length - 1]));
    let afterDropAndTidy = afterDrop.afterTidyingUp();
    return {beforeGrab, afterGrab, hovers, afterDrop, afterDropAndTidy};
};

let suite = new Suite("DisplayedCircuit");

suite.test("constructor_vs_isEqualTo", () => {
    let d1 = CircuitDefinition.fromTextDiagram(COMMON_GATES, `+H+
                                                              X+Y`);
    let d2 = CircuitDefinition.fromTextDiagram(COMMON_GATES, `++++
                                                              ZHHH`);
    //noinspection JSCheckFunctionSignatures
    assertThrows(() => new DisplayedCircuit(23, "not a circuit", undefined, undefined, undefined));
    //noinspection JSCheckFunctionSignatures
    assertThrows(() => new DisplayedCircuit("not a number", d1, undefined, undefined, undefined));

    let c1 = new DisplayedCircuit(45, d1, undefined, undefined, undefined);
    let c2 = new DisplayedCircuit(67, d2, 1, {col: 1, row: 1, resizeStyle: true}, 1);
    assertThat(c1.top).isEqualTo(45);
    assertThat(c1.circuitDefinition).isEqualTo(d1);

    assertThat(c1).isEqualTo(c1);
    assertThat(c1).isNotEqualTo(c2);
    assertThat(c2).isEqualTo(c2);
    assertThat(c2).isNotEqualTo(c1);

    assertThat(c1).isEqualTo(new DisplayedCircuit(45, d1, undefined, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(46, d1, undefined, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d2, undefined, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d1, 1, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d1, undefined, {col:1, row:1, resizeStyle:false}, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d1, undefined, undefined, 0));

    assertThat(c2).isEqualTo(new DisplayedCircuit(67, d2, 1, {col: 1, row: 1, resizeStyle: true}, 1));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(68, d2, 1, {col: 1, row: 1, resizeStyle: true}, 1));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d1, 1, {col: 1, row: 1, resizeStyle: true}, 1));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d2, 2, {col: 1, row: 1, resizeStyle: true}, 1));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d2, 1, {col: 2, row: 1, resizeStyle: true}, 1));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d2, 1, {col: 2, row: 1, resizeStyle: true}, 2));
});

suite.test("bootstrap_diagram", () => {
    assertThat(displayedCircuit(`|
                                 |-X-D//-
                                 |   ///
                                 |-+-///-
                                 |`,
                                 ['D', Gates.Displays.DensityMatrixDisplay2])).isEqualTo({
        circuit: new DisplayedCircuit(
            10,
            circuit(`XD/
                     +//`, ['D', Gates.Displays.DensityMatrixDisplay2]),
            undefined,
            undefined,
            undefined),
        pts: []
    });

    assertThat(displayedCircuit(`|
                                 |-+-H-+-
                                 |
                                 |-+-Y-+-
                                 |`)).isEqualTo({
        circuit: new DisplayedCircuit(
            10,
            circuit(`+H+
                     +Y+`),
            undefined,
            undefined,
            undefined),
        pts: []
    });

    assertThat(displayedCircuit(`|01
                                 |2+-H-+-
                                 |  3
                                 |-+-Y4+-
                                 |  5^   `)).isEqualTo({
        circuit: new DisplayedCircuit(
            10,
            circuit(`+H+
                     +Y+`),
            undefined,
            undefined,
            undefined),
        pts: [
            new Point(35.5, 10.5),
            new Point(60.5, 10.5),
            new Point(35.5, 35.5),
            new Point(85.5, 60.5),
            new Point(135.5, 85.5),
            new Point(110.5, 85.5)
        ]
    });
});

suite.test("indexOfDisplayedRowAt", () => {
    let {circuit, pts} = displayedCircuit(`|0
                                           |1+-+-
                                           |   2
                                           |-+3+-
                                           |  4`);

    assertThat(circuit.indexOfDisplayedRowAt(-9999)).isEqualTo(undefined);
    assertThat(circuit.indexOfDisplayedRowAt(+9999)).isEqualTo(undefined);

    assertThat(circuit.indexOfDisplayedRowAt(pts[0].y)).isEqualTo(0);
    assertThat(circuit.indexOfDisplayedRowAt(pts[1].y)).isEqualTo(0);
    assertThat(circuit.indexOfDisplayedRowAt(pts[2].y)).isEqualTo(1);
    assertThat(circuit.indexOfDisplayedRowAt(pts[3].y)).isEqualTo(1);
    assertThat(circuit.indexOfDisplayedRowAt(pts[4].y)).isEqualTo(undefined);
});

suite.testUsingWebGL("drawCircuitCompletes_QuantumTeleportation", () => {
    let teleportCircuit = CircuitDefinition.fromTextDiagram(
        new Map([
            ['X', Gates.HalfTurns.X],
            ['Z', Gates.HalfTurns.Z],
            ['H', Gates.HalfTurns.H],
            ['M', Gates.Special.Measurement],
            ['•', Gates.Controls.Control],
            ['@', Gates.Displays.BlochSphereDisplay],
            ['t', Gates.Powering.YForward],
            ['-', undefined],
            ['=', undefined],
            ['|', undefined]
        ]),
        `------t@--•-H-M===•===
         -H-•------X---M=•=|===
         ---X------------X-Z-@-`);
    let stats = CircuitStats.fromCircuitAtTime(teleportCircuit, 0.1);
    let displayed = DisplayedCircuit.empty(0).withCircuit(teleportCircuit);
    let canvas = /** @type {HTMLCanvasElement} */ document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    let painter = new Painter(canvas, new RestartableRng());

    // We're just checking that this runs to completion without throwing an exception.
    displayed.paint(painter, Hand.EMPTY, stats);

    // And now a superfluous check to avoid the 'no assertions' warning.
    let inputState = stats.qubitDensityMatrix(7, 0);
    let outputState = stats.qubitDensityMatrix(Infinity, 2);
    assertThat(outputState).isApproximatelyEqualTo(inputState);
});

suite.test("dragXIntoCNot", () => {
    let drag = simulateDrag(`|
                             |-H-•-X-
                             |    0^
                             |-+3421-
                             |`);

    assertThat(drag.beforeGrab.circuitDefinition).isEqualTo(circuit(`H•X
                                                                     ---`));
    assertThat(drag.afterGrab.circuitDefinition).isEqualTo(circuit(`H•-
                                                                    ---`));
    assertThat(drag.hovers.map(e => e.circuitDefinition)).isEqualTo([
        circuit(`H•X
                 ---`),
        circuit(`H•-
                 --X`),
        circuit(`H•--
                 --X-`),
        circuit(`H-•-
                 -X--`),
        circuit(`H•-
                 -X-`)]);
    assertThat(drag.afterDrop.circuitDefinition).isEqualTo(circuit(`H•-
                                                                    -X-`));
    assertThat(drag.afterDropAndTidy.circuitDefinition).isEqualTo(circuit(`H•
                                                                           -X`));
});

suite.test("resizeQft", () => {
    let drag = simulateDrag(`|
                             |-Q-
                             | 1
                             |-/-
                             | 0
                             |-+-
                             |
                             |-+-
                             | 2`);

    assertThat(drag.beforeGrab.circuitDefinition).isEqualTo(circuit(`Q
                                                                     /
                                                                     -
                                                                     -`));
    assertThat(drag.afterGrab.circuitDefinition).isEqualTo(circuit(`Q
                                                                    /
                                                                    -
                                                                    -`));
    assertThat(drag.hovers.map(e => e.circuitDefinition)).isEqualTo([
        circuit(`Q
                 /
                 -
                 -`),
        circuit(`Q
                 -
                 -
                 -`),
        circuit(`Q
                 /
                 /
                 /`)]);
    assertThat(drag.afterDrop.circuitDefinition).isEqualTo(circuit(`Q
                                                                    /
                                                                    /
                                                                    /`));
    assertThat(drag.afterDropAndTidy.circuitDefinition).isEqualTo(circuit(`Q
                                                                           /
                                                                           /
                                                                           /`));
});

suite.test("dragQft", () => {
    let drag = simulateDrag(`|
                             |-Q-
                             | 0
                             |-/-
                             |
                             |-+-
                             | 1
                             |-+-
                             |`);

    assertThat(drag.beforeGrab.circuitDefinition).isEqualTo(circuit(`Q
                                                                     /
                                                                     -
                                                                     -`));
    assertThat(drag.afterGrab.circuitDefinition).isEqualTo(circuit(`-
                                                                    -
                                                                    -
                                                                    -`));
    assertThat(drag.hovers.map(e => e.circuitDefinition)).isEqualTo([
        circuit(`Q
                 /
                 -
                 -`),
        circuit(`-
                 -
                 Q
                 /`)]);
    assertThat(drag.afterDrop.circuitDefinition).isEqualTo(circuit(`-
                                                                    -
                                                                    Q
                                                                    /`));
    assertThat(drag.afterDropAndTidy.circuitDefinition).isEqualTo(circuit(`-
                                                                           -
                                                                           Q
                                                                           /`));
});
