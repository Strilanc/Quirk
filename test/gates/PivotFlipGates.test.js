import {Suite} from "test/TestUtil.js"
import {assertThatCircuitOutputsBasisKet} from "test/CircuitOperationTestUtil.js"

import {PivotFlipGates} from "src/gates/PivotFlipGates.js"
import {Gates} from "src/gates/AllGates.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"

let suite = new Suite("PivotFlipGates");

suite.testUsingWebGL('pivot_flip', () => {
    let circ = diagram => CircuitDefinition.fromTextDiagram(new Map([
        ['5', Gates.InputGates.SetA.withParam(5)],
        ['X', Gates.HalfTurns.X],
        ['F', PivotFlipGates.FlipUnderA],
        ['-', undefined],
        ['/', null],
    ]), diagram);

    assertThatCircuitOutputsBasisKet(circ(`-5-F-
                                           ---/-
                                           ---/-
                                           ---/-`), 4);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -----/-
                                           -----/-
                                           -----/-`), 3);

    assertThatCircuitOutputsBasisKet(circ(`---5-F-
                                           -X---/-
                                           -----/-
                                           -----/-`), 2);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -X---/-
                                           -----/-
                                           -----/-`), 1);

    assertThatCircuitOutputsBasisKet(circ(`---5-F-
                                           -----/-
                                           -X---/-
                                           -----/-`), 0);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -----/-
                                           -X---/-
                                           -----/-`), 5);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -----/-
                                           -X---/-
                                           -X---/-`), 13);
});
