import CircuitShaders from "src/circuit/CircuitShaders.js"
import DetailedError from "src/base/DetailedError.js"
import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import DisplayShaders from "src/circuit/DisplayShaders.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import ShaderPipeline from "src/circuit/ShaderPipeline.js"
import Shaders from "src/webgl/Shaders.js"

import ArithmeticGates from "src/gates/ArithmeticGates.js"
import AmplitudeDisplayFamily from "src/gates/AmplitudeDisplayFamily.js"
import Controls from "src/gates/Controls.js"
import CountingGates from "src/gates/CountingGates.js"
import DensityMatrixDisplayFamily from "src/gates/DensityMatrixDisplayFamily.js"
import ExponentiatingGates from "src/gates/ExponentiatingGates.js"
import FourierTransformGates from "src/gates/FourierTransformGates.js"
import HalfTurnGates from "src/gates/HalfTurnGates.js"
import PhaseGradientGates from "src/gates/PhaseGradientGates.js"
import PostSelectionGates from "src/gates/PostSelectionGates.js"
import PoweringGates from "src/gates/PoweringGates.js"
import ProbabilityDisplayFamily from "src/gates/ProbabilityDisplayFamily.js"
import QuarterTurnGates from "src/gates/QuarterTurnGates.js"
import SampleDisplayFamily from "src/gates/SampleDisplayFamily.js"
import SpacerGate from "src/gates/SpacerGate.js"
import UniversalNotGate from "src/gates/Impossible_UniversalNotGate.js"
import VariousXGates from "src/gates/VariousXGates.js"
import VariousYGates from "src/gates/VariousYGates.js"
import VariousZGates from "src/gates/VariousZGates.js"

const τ = Math.PI * 2;

let Gates = {};
export default Gates;

/**
 * Gates that have special behavior requiring custom code / logic to handle.
 */
Gates.Special = {
    Control: Controls.Control,
    AntiControl: Controls.AntiControl,
    Measurement: Gate.fromIdentity(
        "Measure",
        "Measurement Gate",
        "Measures a wire's qubit, along the Z axis."
    ).withCustomDrawer(args => {
        let backColor = Config.GATE_FILL_COLOR;
        if (args.isHighlighted) {
            backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
        }
        args.painter.fillRect(args.rect, backColor);
        args.painter.strokeRect(args.rect);

        let r = args.rect.w*0.4;
        let {x, y} = args.rect.center();
        y += r*0.6;
        let a = -τ/6;
        let [c, s] = [Math.cos(a)*r*1.5, Math.sin(a)*r*1.5];
        let [p, q] = [x + c, y + s];

        // Draw the dial and shaft.
        args.painter.trace(trace => {
            trace.ctx.arc(x, y, r, τ/2, τ);
            trace.line(x, y, p, q);
        }).thenStroke('black');
        // Draw the indicator head.
        args.painter.trace(trace => trace.arrowHead(p, q, r*0.3, a, τ/4)).thenFill('black');
    }),

    SwapHalf: Gate.fromKnownMatrix(
        "Swap",
        Matrix.square(
            1, 0, 0, 0,
            0, 0, 1, 0,
            0, 1, 0, 0,
            0, 0, 0, 1),
        "Swap Gate [Half]",
        "Swaps the values of two qubits.\nPlace two swap gate halves in the same column to form a swap gate."
    ).withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
            return;
        }

        // A swap gate half is shown as a small X (joined by a line to the other half; that's handled elsewhere).
        let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
        args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
        args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
    })
};

/**
 * Gates that display information without affecting the state.
 * (In reality these would require multiple runs of the circuit to do tomography.)
 */
Gates.Displays = {
    AmplitudeDisplayFamily: AmplitudeDisplayFamily,
    ProbabilityDisplayFamily: ProbabilityDisplayFamily,
    SampleDisplayFamily: SampleDisplayFamily,
    DensityMatrixDisplayFamily: DensityMatrixDisplayFamily,

    BlochSphereDisplay: Gate.fromIdentity(
        "Bloch",
        "Bloch Sphere Display",
        "Shows a wire's local state as a point on the Bloch Sphere.\nUse controls to see conditional states.").
        withCustomDrawer(GatePainting.makeDisplayDrawer(args => {
            let {row, col} = args.positionInCircuit;
            let ρ = args.stats.qubitDensityMatrix(row, col);
            MathPainter.paintBlochSphere(args.painter, ρ, args.rect, args.focusPoints);
        }))
};

Gates.Arithmetic = ArithmeticGates;
Gates.CountingGates = CountingGates;
Gates.Displays.DensityMatrixDisplay = DensityMatrixDisplayFamily.ofSize(1);
Gates.Displays.DensityMatrixDisplay2 = DensityMatrixDisplayFamily.ofSize(2);
Gates.Displays.ChanceDisplay = Gates.Displays.ProbabilityDisplayFamily.ofSize(1);
Gates.Exponentiating = ExponentiatingGates;
Gates.FourierTransformGates = FourierTransformGates;
Gates.HalfTurns = HalfTurnGates;
Gates.OtherX = VariousXGates;
Gates.OtherY = VariousYGates;
Gates.OtherZ = VariousZGates;
Gates.PhaseGradientGates = PhaseGradientGates;
Gates.PostSelectionGates = PostSelectionGates;
Gates.Powering = PoweringGates;
Gates.QuarterTurns = QuarterTurnGates;

const FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => Complex.polar(Math.pow(0.5, span/2), τ*r*c/(1<<span)));


Gates.Misc = {
    MysteryGateSymbol: "?",
    MysteryGateMakerWithMatrix: matrix => Gate.fromKnownMatrix(
        Gates.Misc.MysteryGateSymbol,
        matrix,
        "Mystery Gate",
        "Every time you grab this gate out of the toolbox, it changes.\n" +
        "Duplicate gates in the circuit by holding shift before dragging.").
        withCustomDrawer(GatePainting.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX),
    MysteryGateMaker: () => Gates.Misc.MysteryGateMakerWithMatrix(Matrix.square(
            new Complex(Math.random() - 0.5, Math.random() - 0.5),
            new Complex(Math.random() - 0.5, Math.random() - 0.5),
            new Complex(Math.random() - 0.5, Math.random() - 0.5),
            new Complex(Math.random() - 0.5, Math.random() - 0.5)
        ).closestUnitary()),
    SpacerGate: SpacerGate
};

const CYCLE_BITS_MATRIX_MAKER = span => Matrix.generate(1<<span, 1<<span, (r, c) => {
    let expected = r;
    let input = c;
    let actual = input << 1;
    actual = (actual & ((1 << span) - 1)) | (actual >> span);
    return expected === actual ? 1 : 0;
});

Gates.ExperimentalAndImplausible = {
    UniversalNot: UniversalNotGate,
    ErrorInjection: Gate.withoutKnownMatrix(
        "ERR!",
        "Error Injection Gate",
        "Throws an exception during circuit stat computations, for testing error paths.").
        markedAsStable().
        withCustomShader((inputTex, controlTex, qubit) => {
            throw new DetailedError("Applied an Error Injection Gate", {qubit});
        }).
        withSerializedId("__debug__ErrorInjection").
        withCustomDrawer(GatePainting.MAKE_HIGHLIGHTED_DRAWER('red', 'red')),
    CycleBitsFamily: Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
        "<<=1",
        "Bit Cycle Gate",
        "Swaps bits in a cycle.").
        markedAsStable().
        markedAsOnlyPermutingAndPhasing().
        withKnownMatrix(span >= 4 ? undefined : CYCLE_BITS_MATRIX_MAKER(span)).
        withSerializedId("__unstable__cycle" + span).
        withHeight(span).
        withCustomShader((val, con, bit) => GateShaders.cycleBits(val, con, bit, span, 1)))
};

/** @type {!Array<!{hint: !string, gates: !Array<?Gate>}>} */
Gates.Sets = [
    {
        hint: "Probes",
        gates: [
            Gates.Special.Measurement,
            PostSelectionGates.PostSelectOff,
            Controls.AntiControl,
            null,
            PostSelectionGates.PostSelectOn,
            Controls.Control
        ]
    },
    {
        hint: "Displays",
        gates: [
            SampleDisplayFamily.ofSize(3),
            DensityMatrixDisplayFamily.ofSize(1),
            ProbabilityDisplayFamily.ofSize(1),
            null,
            Gates.Displays.BlochSphereDisplay,
            AmplitudeDisplayFamily.ofSize(2)
        ]
    },
    {
        hint: "Half Turns",
        gates: [
            HalfTurnGates.Z,
            HalfTurnGates.Y,
            HalfTurnGates.X,
            Gates.Special.SwapHalf,
            null,
            HalfTurnGates.H
        ]
    },
    {
        hint: "Quarter Turns",
        gates: [
            QuarterTurnGates.SqrtZForward,
            QuarterTurnGates.SqrtYForward,
            QuarterTurnGates.SqrtXForward,
            QuarterTurnGates.SqrtZBackward,
            QuarterTurnGates.SqrtYBackward,
            QuarterTurnGates.SqrtXBackward
        ]
    },
    {
        hint: "Eighth Turns",
        gates: [
            VariousZGates.Z4,
            VariousYGates.Y4,
            VariousXGates.X4,
            VariousZGates.Z4i,
            VariousYGates.Y4i,
            VariousXGates.X4i
        ]
    },
    {
        hint: 'Misc',
        gates: [
            PhaseGradientGates.PhaseGradientFamily.ofSize(2),
            null,
            FourierTransformGates.FourierTransformFamily.ofSize(2),
            PhaseGradientGates.PhaseDegradientFamily.ofSize(2),
            Gates.Misc.MysteryGateMaker(),
            SpacerGate
        ]
    },
    {
        hint: 'Arithmetic',
        gates: [

            CountingGates.CountingFamily.ofSize(2),
            ArithmeticGates.AdditionFamily.ofSize(4),
            ArithmeticGates.IncrementFamily.ofSize(2),
            CountingGates.UncountingFamily.ofSize(2),
            ArithmeticGates.SubtractionFamily.ofSize(4),
            ArithmeticGates.DecrementFamily.ofSize(2)
        ]
    },
    {
        hint: "Raising",
        gates: [
            PoweringGates.ZForward,
            PoweringGates.YForward,
            PoweringGates.XForward,
            PoweringGates.ZBackward,
            PoweringGates.YBackward,
            PoweringGates.XBackward
        ]
    },
    {
        hint: "Exponentiating",
        gates: [
            ExponentiatingGates.ZForward,
            ExponentiatingGates.YForward,
            ExponentiatingGates.XForward,
            ExponentiatingGates.ZBackward,
            ExponentiatingGates.YBackward,
            ExponentiatingGates.XBackward
        ]
    },
    {
        hint: "Other X",
        gates: [
            VariousXGates.X16,
            VariousXGates.X8,
            VariousXGates.X3,
            VariousXGates.X16i,
            VariousXGates.X8i,
            VariousXGates.X3i
        ]
    },
    {
        hint: "Other Y",
        gates: [
            VariousYGates.Y16,
            VariousYGates.Y8,
            VariousYGates.Y3,
            VariousYGates.Y16i,
            VariousYGates.Y8i,
            VariousYGates.Y3i
        ]
    },
    {
        hint: "Other Z",
        gates: [
            VariousZGates.Z16,
            VariousZGates.Z8,
            VariousZGates.Z3,
            VariousZGates.Z16,
            VariousZGates.Z8i,
            VariousZGates.Z3i
        ]
    }
];

/** @type {!Array.<!Gate>} */
Gates.KnownToSerializer = [
    ...Controls.all,
    Gates.Special.Measurement,
    Gates.Special.SwapHalf,

    ...AmplitudeDisplayFamily.all,
    ...ProbabilityDisplayFamily.all,
    ...SampleDisplayFamily.all,
    ...DensityMatrixDisplayFamily.all,
    Gates.Displays.BlochSphereDisplay,

    ...ArithmeticGates.all,
    ...CountingGates.all,
    ...ExponentiatingGates.all,
    ...HalfTurnGates.all,
    ...QuarterTurnGates.all,
    ...PhaseGradientGates.all,
    ...PostSelectionGates.all,
    ...PoweringGates.all,
    ...VariousXGates.all,
    ...VariousYGates.all,
    ...VariousZGates.all,
    ...FourierTransformGates.all,

    SpacerGate,
    UniversalNotGate,
    Gates.ExperimentalAndImplausible.ErrorInjection,
    ...Gates.ExperimentalAndImplausible.CycleBitsFamily.all
];
