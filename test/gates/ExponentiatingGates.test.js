import {Suite, assertThat} from "test/TestUtil.js"
import {Gates} from "src/gates/AllGates.js"
import {Complex} from "src/math/Complex.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("ExponentiatingGates");

suite.test("timeBased_matchUnoptimized", () => {
    let matches = (gate, func) => {
        for (let t = 0; t < 1; t += 0.05) {
            assertThat(gate.knownMatrixAt(t)).isApproximatelyEqualTo(func(t), 0.0000001);
        }
    };

    let i = Complex.I;
    let τ = Math.PI * 2;
    matches(
        Gates.Exponentiating.XForward,
        t => Matrix.PAULI_X.liftApply(c => c.times(τ * -t).times(i).exp()));
    matches(
        Gates.Exponentiating.XBackward,
        t => Matrix.PAULI_X.liftApply(c => c.times(τ * t).times(i).exp()));
    matches(
        Gates.Exponentiating.YForward,
        t => Matrix.PAULI_Y.liftApply(c => c.times(τ * -t).times(i).exp()));
    matches(
        Gates.Exponentiating.YBackward,
        t => Matrix.PAULI_Y.liftApply(c => c.times(τ * t).times(i).exp()));
    matches(
        Gates.Exponentiating.ZForward,
        t => Matrix.PAULI_Z.liftApply(c => c.times(τ * -t).times(i).exp()));
    matches(
        Gates.Exponentiating.ZBackward,
        t => Matrix.PAULI_Z.liftApply(c => c.times(τ * t).times(i).exp()));

    matches(
        Gates.Powering.XForward,
        t => Matrix.PAULI_X.liftApply(c => c.raisedTo(t * 2)));
    matches(
        Gates.Powering.XBackward,
        t => Matrix.PAULI_X.liftApply(c => c.raisedTo(-t * 2)));
    matches(
        Gates.Powering.YForward,
        t => Matrix.PAULI_Y.liftApply(c => c.raisedTo(t * 2)));
    matches(
        Gates.Powering.YBackward,
        t => Matrix.PAULI_Y.liftApply(c => c.raisedTo(-t * 2)));
    matches(
        Gates.Powering.ZForward,
        t => Matrix.PAULI_Z.liftApply(c => c.raisedTo(t * 2)));
    matches(
        Gates.Powering.ZBackward,
        t => Matrix.PAULI_Z.liftApply(c => c.raisedTo(-t * 2)));
});
