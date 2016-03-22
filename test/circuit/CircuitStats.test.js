import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import CircuitStats from "src/circuit/CircuitStats.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"

let suite = new Suite("CircuitStats");

suite.webGlTest("smoke", () => {
    let circuit = new CircuitDefinition.from([
        [null, Gates.Named.HalfTurns.H],
        [Gates.Named.HalfTurns.X, Gates.Named.Special.Control]
    ]);
    let s = CircuitStats.fromCircuitAtTime(circuit, 0.5);
    assertThat(s.circuitDefinition).isEqualTo(circuit);
    assertThat(s.time).isEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(0, 0)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(1, 0)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(0, 0)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(1, 0)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(0, 1)).isApproximatelyEqualTo(1);
    assertThat(s.controlledWireProbabilityJustAfter(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.finalState).isApproximatelyEqualTo(Matrix.col([Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]));
});

suite.webGlTest("wireProbabilityJustAfter", () => {
    let X = Gates.Named.HalfTurns.X;
    let H = Gates.Named.HalfTurns.H;
    let IsOn = Gates.Named.Special.Control;
    let IsOff = Gates.Named.Special.AntiControl;

    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([
        [H, null, null],
        [IsOn, X, X],
        [IsOn, IsOff, null]
    ]), 0);

    // Before any operations, all wires off.
    assertThat(s.wireProbabilityJustAfter(0, -1)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(1, -1)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(2, -1)).isApproximatelyEqualTo(0);

    // In middle of GHZ creation, one wire half.
    assertThat(s.wireProbabilityJustAfter(0, 0)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(1, 0)).isApproximatelyEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(2, 0)).isApproximatelyEqualTo(0);

    // Afterwards created, all wires half.
    assertThat(s.wireProbabilityJustAfter(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(2, 1)).isApproximatelyEqualTo(0.5);

    // Controls have no effect.
    assertThat(s.wireProbabilityJustAfter(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(1, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(2, 2)).isApproximatelyEqualTo(0.5);

    // Long term.
    assertThat(s.wireProbabilityJustAfter(0, Infinity)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(1, Infinity)).isApproximatelyEqualTo(0.5);
    assertThat(s.wireProbabilityJustAfter(2, Infinity)).isApproximatelyEqualTo(0.5);
});

suite.webGlTest("controlledWireProbabilityJustAfter_independent", () => {
    let H = Gates.Named.HalfTurns.H;
    let IsOn = Gates.Named.Special.Control;
    let IsOff = Gates.Named.Special.AntiControl;
    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([
        [H, H, H],
        [IsOn, IsOff, null]
    ]), 0);

    assertThat(s.controlledWireProbabilityJustAfter(0, -1)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(1, -1)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(2, -1)).isApproximatelyEqualTo(0);

    assertThat(s.controlledWireProbabilityJustAfter(0, 0)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 0)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(2, 0)).isApproximatelyEqualTo(0.5);

    assertThat(s.controlledWireProbabilityJustAfter(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(2, 1)).isApproximatelyEqualTo(0.5);

    assertThat(s.controlledWireProbabilityJustAfter(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(2, 2)).isApproximatelyEqualTo(0.5);

    assertThat(s.controlledWireProbabilityJustAfter(0, Infinity)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, Infinity)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(2, Infinity)).isApproximatelyEqualTo(0.5);
});

suite.webGlTest("controlledWireProbabilityJustAfter_dependent", () => {
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

    assertThat(s.controlledWireProbabilityJustAfter(0, -1)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(1, -1)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(2, -1)).isApproximatelyEqualTo(0);

    assertThat(s.controlledWireProbabilityJustAfter(0, 0)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 0)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(2, 0)).isApproximatelyEqualTo(0);

    assertThat(s.controlledWireProbabilityJustAfter(0, 1)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 1)).isApproximatelyEqualTo(1);
    assertThat(s.controlledWireProbabilityJustAfter(2, 1)).isApproximatelyEqualTo(1);

    assertThat(s.controlledWireProbabilityJustAfter(0, 2)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 2)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(2, 2)).isApproximatelyEqualTo(0);

    assertThat(s.controlledWireProbabilityJustAfter(0, 3)).isApproximatelyEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(1, 3)).isApproximatelyEqualTo(1);
    assertThat(s.controlledWireProbabilityJustAfter(2, 3)).isApproximatelyEqualTo(NaN);

    assertThat(s.controlledWireProbabilityJustAfter(0, 4)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, 4)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(2, 4)).isApproximatelyEqualTo(0.5);

    assertThat(s.controlledWireProbabilityJustAfter(0, Infinity)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(1, Infinity)).isApproximatelyEqualTo(0.5);
    assertThat(s.controlledWireProbabilityJustAfter(2, Infinity)).isApproximatelyEqualTo(0.5);
});

suite.webGlTest("wireProbabilities_inControl", () => {
    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([[Gates.Named.Special.Control]]), 0);
    assertThat(s.wireProbabilityJustAfter(0, -1)).isEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(0, 0)).isEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(0, 1)).isEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(0, -1)).isEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(0, 0)).isEqualTo(0);
    assertThat(s.controlledWireProbabilityJustAfter(0, 1)).isEqualTo(0);
});

suite.webGlTest("wireProbabilities_severalQubits", () => {
    let s = CircuitStats.fromCircuitAtTime(CircuitDefinition.from([
        [null, null, null, null, Gates.Named.HalfTurns.X]
    ]), 0);
    assertThat(s.wireProbabilityJustAfter(0, Infinity)).isEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(1, Infinity)).isEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(2, Infinity)).isEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(3, Infinity)).isEqualTo(0);
    assertThat(s.wireProbabilityJustAfter(4, Infinity)).isEqualTo(1);
});
