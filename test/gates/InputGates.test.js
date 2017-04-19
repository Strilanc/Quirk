import {assertThat, Suite} from "test/TestUtil.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("InputGates");

const TEST_GATES = new Map([
    ['$', Gates.ModularArithmeticGates.DecrementModRFamily],
    ['*', Gates.MultiplyAccumulateGates.MultiplyAddInputsFamily],
    ['X', Gates.HalfTurns.X],
    ['⊕', Gates.XorGates.XorAFamily],
    ['A', Gates.InputGates.InputAFamily],
    ['B', Gates.InputGates.InputBFamily],
    ['R', Gates.InputGates.InputRFamily],
    ['∀', Gates.InputGates.InputRevAFamily],
    ['ᗺ', Gates.InputGates.InputRevBFamily],
    ['-', undefined],
    ['/', null],
]);
const circuit = (diagram, ...extraGates) => CircuitDefinition.fromTextDiagram(
    Util.mergeMaps(TEST_GATES, new Map(extraGates)),
    diagram);

suite.testUsingWebGL('endianness', () => {
    let output = diagram => {
        let stats = CircuitStats.fromCircuitAtTime(circuit(diagram), 0);
        return Seq.range(stats.finalState.height()).
            filter(i => stats.finalState.cell(0, i).isEqualTo(1)).
            first();
    };

    assertThat(output(`-X-A-
                       ---/-
                       ---/-
                       -----
                       ---⊕-
                       ---/-
                       ---/-`)).isEqualTo(0b0010001);

    assertThat(output(`-X-∀-
                       ---/-
                       ---/-
                       -----
                       ---⊕-
                       ---/-
                       ---/-`)).isEqualTo(0b1000001);

    assertThat(output(`---$-
                       ---/-
                       ---/-
                       ---/-
                       -X-R-
                       -X-/-
                       ---/-
                       -X-/-`)).isEqualTo(0b10111010);

    assertThat(output(`---*-
                       ---/-
                       -X-A-
                       -X-B-
                       ---/-`)).isEqualTo(0b01101);

    assertThat(output(`---*-
                       ---/-
                       -X-A-
                       -X-ᗺ-
                       ---/-`)).isEqualTo(0b01110);
});
