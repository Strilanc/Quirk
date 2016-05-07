import { Suite, assertThat, assertThrows, fail } from "test/TestUtil.js"
import DisplayedCircuit from "src/widgets/DisplayedCircuit.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Config from "src/Config.js"
import Gates from "src/ui/Gates.js"
import Point from "src/math/Point.js"
import {seq, Seq} from "src/base/Seq.js"

const TEST_GATES = new Map([
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
    ['•', Gates.Special.Control],
    ['◦', Gates.Special.AntiControl],
    ['.', Gates.Misc.SpacerGate],

    ['M', Gates.Special.Measurement],
    ['%', Gates.Displays.ChanceDisplay],
    ['d', Gates.Displays.DensityMatrixDisplay],
    ['D', Gates.Displays.DensityMatrixDisplay2],
    ['@', Gates.Displays.BlochSphereDisplay],
    ['s', Gates.Special.SwapHalf],
    ['!', Gates.Misc.PostSelectOn],

    ['+', null],
    ['/', null],

    ['t', Gates.Exponentiating.XForward]
]);

/**
 * @param {!string} diagramText
 * @returns {!{circuit: !DisplayedCircuit, pts: !Array.<!Point>}}
 */
let diagram = diagramText => {
    let lines = diagramText.split('\n').map(e => {
        let p = e.split('|');
        if (p.length !== 2) {
            fail('Bad diagram: ' + diagramText);
        }
        return p[1];
    });
    let circuitDiagramSubset = seq(lines).
        skip(1).
        stride(2).
        map(line => seq(line).skip(1).stride(2).join("")).
        join('\n');
    let circuit = new DisplayedCircuit(10, CircuitDefinition.fromTextDiagram(TEST_GATES, circuitDiagramSubset));
    let pts = Seq.naturals().
        takeWhile(k => diagramText.indexOf(k) !== -1).
        map(k => {
            let pos = seq(lines).mapWithIndex((line, row) => ({row, col: line.indexOf(k)})).
                filter(e => e.col !== -1).
                single();
            if (lines[pos.row][pos.col + 1] === '^') {
                pos.row -= 1;
                pos.col += 1;
            }
            return new Point(
                pos.col * Config.WIRE_SPACING / 2 + 35.5,
                pos.row * Config.WIRE_SPACING / 2 + 10.5);
        }).toArray();
    return {circuit, pts};
};

let suite = new Suite("DisplayedCircuit");

suite.test("constructor_vs_isEqualTo", () => {
    let d1 = CircuitDefinition.fromTextDiagram(TEST_GATES, '+H+\nX+Y');
    let d2 = CircuitDefinition.fromTextDiagram(TEST_GATES, '++++\ntHHH');
    assertThrows(() => new DisplayedCircuit(23, "not a circuit"));
    assertThrows(() => new DisplayedCircuit("not a number", d1));

    let c1 = new DisplayedCircuit(45, d1, undefined, undefined);
    let c2 = new DisplayedCircuit(67, d2, 1, {col: 1, row: 1, resizeStyle: true});
    assertThat(c1.top).isEqualTo(45);
    assertThat(c1.circuitDefinition).isEqualTo(d1);

    assertThat(c1).isEqualTo(c1);
    assertThat(c1).isNotEqualTo(c2);
    assertThat(c2).isEqualTo(c2);
    assertThat(c2).isNotEqualTo(c1);

    assertThat(c1).isEqualTo(new DisplayedCircuit(45, d1, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(46, d1, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d2, undefined, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d1, 1, undefined));
    assertThat(c1).isNotEqualTo(new DisplayedCircuit(45, d1, undefined, {col: 1, row: 1, resizeStyle: false}));

    assertThat(c2).isEqualTo(new DisplayedCircuit(67, d2, 1, {col: 1, row: 1, resizeStyle: true}));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(68, d2, 1, {col: 1, row: 1, resizeStyle: true}));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d1, 1, {col: 1, row: 1, resizeStyle: true}));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d2, 2, {col: 1, row: 1, resizeStyle: true}));
    assertThat(c2).isNotEqualTo(new DisplayedCircuit(67, d2, 1, {col: 2, row: 1, resizeStyle: true}));
});

suite.test("bootstrap_diagram", () => {
    assertThat(diagram(`|
                        |-X-D//-
                        |   ///
                        |-+-///-
                        |`)).isEqualTo({
        circuit: new DisplayedCircuit(10, CircuitDefinition.fromTextDiagram(TEST_GATES, `XD+
                                                                                         +++`)),
        pts: []
    });

    assertThat(diagram(`|
                        |-+-H-+-
                        |
                        |-+-Y-+-
                        |`)).isEqualTo({
        circuit: new DisplayedCircuit(10, CircuitDefinition.fromTextDiagram(TEST_GATES, `+H+
                                                                                         +Y+`)),
        pts: []
    });

    assertThat(diagram(`|01
                        |2+-H-+-
                        |  3
                        |-+-Y4+-
                        |  5^   `)).isEqualTo({
        circuit: new DisplayedCircuit(10, CircuitDefinition.fromTextDiagram(TEST_GATES, `+H+
                                                                                         +Y+`)),
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

suite.test("findWireAt", () => {
    let {circuit, pts} = diagram(`|0
                                  |1+-+-
                                  |   2
                                  |-+3+-
                                  |  4`);

    assertThat(circuit.findWireAt(-9999)).isEqualTo(undefined);
    assertThat(circuit.findWireAt(+9999)).isEqualTo(undefined);

    assertThat(circuit.findWireAt(pts[0].y)).isEqualTo(0);
    assertThat(circuit.findWireAt(pts[1].y)).isEqualTo(0);
    assertThat(circuit.findWireAt(pts[2].y)).isEqualTo(1);
    assertThat(circuit.findWireAt(pts[3].y)).isEqualTo(1);
    assertThat(circuit.findWireAt(pts[4].y)).isEqualTo(undefined);
});
