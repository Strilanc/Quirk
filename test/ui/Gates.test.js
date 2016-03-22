import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import Gates from "src/ui/Gates.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

let suite = new Suite("Gates");

suite.test("timeBased_matchUnoptimized", () => {
    let matches = (gate, func) => {
        for (let t = 0; t < 1; t += 0.05) {
            assertThat(gate.matrixAt(t)).isApproximatelyEqualTo(func(t), 0.0000001);
        }
    };

    let i = Complex.I;
    let τ = Math.PI * 2;
    matches(
        Gates.Named.Exponentiating.XForward,
        t => Matrix.PAULI_X.liftApply(c => c.times(τ * -t).times(i).exp()));
    matches(
        Gates.Named.Exponentiating.XBackward,
        t => Matrix.PAULI_X.liftApply(c => c.times(τ * t).times(i).exp()));
    matches(
        Gates.Named.Exponentiating.YForward,
        t => Matrix.PAULI_Y.liftApply(c => c.times(τ * -t).times(i).exp()));
    matches(
        Gates.Named.Exponentiating.YBackward,
        t => Matrix.PAULI_Y.liftApply(c => c.times(τ * t).times(i).exp()));
    matches(
        Gates.Named.Exponentiating.ZForward,
        t => Matrix.PAULI_Z.liftApply(c => c.times(τ * -t).times(i).exp()));
    matches(
        Gates.Named.Exponentiating.ZBackward,
        t => Matrix.PAULI_Z.liftApply(c => c.times(τ * t).times(i).exp()));

    matches(
        Gates.Named.Powering.XForward,
        t => Matrix.PAULI_X.liftApply(c => c.raisedTo(t * 2)));
    matches(
        Gates.Named.Powering.XBackward,
        t => Matrix.PAULI_X.liftApply(c => c.raisedTo(-t * 2)));
    matches(
        Gates.Named.Powering.YForward,
        t => Matrix.PAULI_Y.liftApply(c => c.raisedTo(t * 2)));
    matches(
        Gates.Named.Powering.YBackward,
        t => Matrix.PAULI_Y.liftApply(c => c.raisedTo(-t * 2)));
    matches(
        Gates.Named.Powering.ZForward,
        t => Matrix.PAULI_Z.liftApply(c => c.raisedTo(t * 2)));
    matches(
        Gates.Named.Powering.ZBackward,
        t => Matrix.PAULI_Z.liftApply(c => c.raisedTo(-t * 2)));
});
