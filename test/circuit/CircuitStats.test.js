import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import CircuitStats from "src/circuit/CircuitStats.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"

let suite = new Suite("CircuitStats");

suite.webGlTest("smoke", () => {
    let circuit = new CircuitDefinition.from([
        [null, Gates.Named.HalfTurns.H],
        [Gates.Named.HalfTurns.X, Gates.Named.Special.Control]
    ]);
    let s = CircuitStats.fromCircuitAtTime(circuit, 0.5);
    assertThat(s.circuitDefinition).isEqualTo(circuit);
    assertThat(s.time).isEqualTo(0.5);
    assertThat(s.wireProbabilityJustBefore(0, 0)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustBefore(1, 0)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustBefore(0, 1)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustBefore(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustBefore(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustBefore(1, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 0)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 0)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 1)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.finalState).isApproximatelyEqualTo([Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]);
});

suite.webGlTest("conditionedWireProbabilityJustBefore_independent", () => {
    let H = Gates.Named.HalfTurns.H;
    let IsOn = Gates.Named.Special.Control;
    let IsOff = Gates.Named.Special.AntiControl;
    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([
        [H, H, H],
        [IsOn, IsOff, null]
    ]), 0);

    assertThat(s.conditionedWireProbabilityJustBefore(0, 0)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 0)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(2, 0)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(2, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(2, 2)).isApproximatelyEqualTo(0.5);
});

suite.webGlTest("wireProbabilityJustBefore", () => {
    let X = Gates.Named.HalfTurns.X;
    let H = Gates.Named.HalfTurns.H;
    let IsOn = Gates.Named.Special.Control;
    let IsOff = Gates.Named.Special.AntiControl;

    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([
        [H, null, null],
        [IsOn, X, X],
        [IsOff, null, null],
        [IsOn, IsOff, null]
    ]), 0);

    for (let wire = 0; wire < 3; wire++) {
        // Before first H, all wires off.
        for (let col = -3; col < 1; col++) {
            assertThat(s.wireProbabilityJustBefore(wire, col)).isApproximatelyEqualTo(0);
        }
        // After GHZ state is made, all wires half.
        for (let col = 2; col < 10; col++) {
            assertThat(s.wireProbabilityJustBefore(wire, col)).isApproximatelyEqualTo(0.5);
        }
        assertThat(s.wireProbabilityJustBefore(wire, Infinity)).isApproximatelyEqualTo(0.5);
    }

    // In middle of GHZ creation, one wire half.
    assertThat(s.wireProbabilityJustBefore(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustBefore(1, 1)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustBefore(2, 1)).isApproximatelyEqualTo(0);
});

suite.webGlTest("conditionedWireProbabilityJustBefore_dependent", () => {
    let X = Gates.Named.HalfTurns.X;
    let H = Gates.Named.HalfTurns.H;
    let IsOn = Gates.Named.Special.Control;
    let IsOff = Gates.Named.Special.AntiControl;

    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([
        [H, null, null],
        [IsOn, X, X],
        [IsOff, null, null],
        [IsOn, IsOff, null]
    ]), 0);

    for (let wire = 0; wire < 3; wire++) {
        // Before first H, all wires off.
        for (let col = -3; col < 1; col++) {
            assertThat(s.conditionedWireProbabilityJustBefore(wire, col)).isApproximatelyEqualTo(0);
        }
        // After circuit, all wires half.
        for (let col = 5; col < 10; col++) {
            assertThat(s.conditionedWireProbabilityJustBefore(wire, col)).isApproximatelyEqualTo(0.5);
        }
        assertThat(s.conditionedWireProbabilityJustBefore(wire, Infinity)).isApproximatelyEqualTo(0.5);
    }

    // In the middle of GHZ creation, one wire half.
    assertThat(s.conditionedWireProbabilityJustBefore(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 1)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(2, 1)).isApproximatelyEqualTo(0);

    // Second part of GHZ creation has a control on first wire.
    assertThat(s.conditionedWireProbabilityJustBefore(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 2)).isApproximatelyEqualTo(1);
    assertThat(s.conditionedWireProbabilityJustBefore(2, 2)).isApproximatelyEqualTo(1);

    // Anti-control on first wire.
    assertThat(s.conditionedWireProbabilityJustBefore(0, 3)).isApproximatelyEqualTo(0.5);
    assertThat(s.conditionedWireProbabilityJustBefore(1, 3)).isApproximatelyEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(2, 3)).isApproximatelyEqualTo(0);

    // Control on first wire, anti-control on second wire.
    //assertThat(s.conditionedWireProbabilityJustBefore(0, 4)).isApproximatelyEqualTo(0);
    //assertThat(s.conditionedWireProbabilityJustBefore(1, 4)).isApproximatelyEqualTo(1);
    //assertThat(s.conditionedWireProbabilityJustBefore(2, 4)).isApproximatelyEqualTo(NaN);
});

suite.webGlTest("wireProbabilities_inControl", () => {
    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([[Gates.Named.Special.Control]]), 0);
    assertThat(s.wireProbabilityJustBefore(0, -1)).isEqualTo(0);
    assertThat(s.wireProbabilityJustBefore(0, 0)).isEqualTo(0);
    assertThat(s.wireProbabilityJustBefore(0, 1)).isEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(0, -1)).isEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 0)).isEqualTo(0);
    assertThat(s.conditionedWireProbabilityJustBefore(0, 1)).isEqualTo(0);
});
