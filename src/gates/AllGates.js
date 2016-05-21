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
import DensityMatrixDisplayFamily from "src/gates/DensityMatrixDisplayFamily.js"
import ExponentiatingGates from "src/gates/ExponentiatingGates.js"
import HalfTurnGates from "src/gates/HalfTurnGates.js"
import PhaseGradientGates from "src/gates/PhaseGradientGates.js"
import PostSelectionGates from "src/gates/PostSelectionGates.js"
import PoweringGates from "src/gates/PoweringGates.js"
import ProbabilityDisplayFamily from "src/gates/ProbabilityDisplayFamily.js"
import QuarterTurnGates from "src/gates/QuarterTurnGates.js"
import SampleDisplayFamily from "src/gates/SampleDisplayFamily.js"
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
    Control: Gate.fromIdentity(
        "•",
        "Control",
        "Conditions on a qubit being ON.\nGates in the same column will only apply to states meeting the condition."
    ).withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        args.painter.fillCircle(args.rect.center(), 5, "black");
    }),

    AntiControl: Gate.fromIdentity(
        "◦",
        "Anti-Control",
        "Conditions on a qubit being OFF.\nGates in the same column will only apply to states meeting the condition."
    ).withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
    }),

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
Gates.Displays.DensityMatrixDisplay = DensityMatrixDisplayFamily.ofSize(1);
Gates.Displays.DensityMatrixDisplay2 = DensityMatrixDisplayFamily.ofSize(2);
Gates.Displays.ChanceDisplay = Gates.Displays.ProbabilityDisplayFamily.ofSize(1);
Gates.Exponentiating = ExponentiatingGates;
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

Gates.FourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT",
    "Fourier Transform Gate",
    "Transforms to/from phase frequency space.").
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT" + span).
    withHeight(span).
    withCustomShaders(
        Seq.range(Math.floor(span/2)).
            map(i => (val, con, bit) => CircuitShaders.swap(val, bit + i, bit + span - i - 1, con)).
            concat(Seq.range(span).
                map(i => (val, con, bit) => GateShaders.fourierTransformStep(val, con, bit, i))).
            toArray()));

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

    ClockPulseGate: Gate.fromVaryingMatrix(
        "X^⌈t⌉",
        t => (t % 1) < 0.5 ? Matrix.identity(2) : Matrix.PAULI_X,
        "Clock Pulse Gate",
        "Xors a square wave into the target wire.").
        withCustomDrawer(GatePainting.SQUARE_WAVE_DRAWER_MAKER(0, 2)).
        withStableDuration(0.5),

    QuarterPhaseClockPulseGate: Gate.fromVaryingMatrix(
        "X^⌈t-¼⌉",
        t => ((t+0.75) % 1) < 0.5 ? Matrix.identity(2) : Matrix.PAULI_X,
        "Clock Pulse Gate (Quarter Phase)",
        "Xors a quarter-phased square wave into the target wire.").
        withCustomDrawer(GatePainting.SQUARE_WAVE_DRAWER_MAKER(0.75, 2)).
        withStableDuration(0.25),

    SpacerGate: Gate.fromIdentity(
        "…",
        "Spacer",
        "A gate with no effect.").
        withCustomDrawer(args => {
            // Drawn as an ellipsis.
            if (args.isInToolbox || args.isHighlighted) {
                let backColor = Config.GATE_FILL_COLOR;
                if (args.isHighlighted) {
                    backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
                }
                args.painter.fillRect(args.rect, backColor);
                args.painter.strokeRect(args.rect);
            } else {
                let {x, y} = args.rect.center();
                let r = new Rect(x - 14, y - 2, 28, 4);
                args.painter.fillRect(r, Config.BACKGROUND_COLOR_CIRCUIT);
            }
            args.painter.fillCircle(args.rect.center().offsetBy(7, 0), 2, "black");
            args.painter.fillCircle(args.rect.center(), 2, "black");
            args.painter.fillCircle(args.rect.center().offsetBy(-7, 0), 2, "black");
        })
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
            Gates.Special.AntiControl,
            null,
            PostSelectionGates.PostSelectOn,
            Gates.Special.Control
        ]
    },
    {
        hint: "Displays",
        gates: [
            Gates.Displays.SampleDisplayFamily.ofSize(3),
            Gates.Displays.DensityMatrixDisplayFamily.ofSize(1),
            Gates.Displays.ProbabilityDisplayFamily.ofSize(1),
            null,
            Gates.Displays.BlochSphereDisplay,
            Gates.Displays.AmplitudeDisplayFamily.ofSize(2)
        ]
    },
    {
        hint: "Half Turns",
        gates: [
            Gates.HalfTurns.Z,
            Gates.HalfTurns.Y,
            Gates.HalfTurns.X,
            Gates.Special.SwapHalf,
            null,
            Gates.HalfTurns.H
        ]
    },
    {
        hint: "Quarter Turns",
        gates: [
            Gates.QuarterTurns.SqrtZForward,
            Gates.QuarterTurns.SqrtYForward,
            Gates.QuarterTurns.SqrtXForward,
            Gates.QuarterTurns.SqrtZBackward,
            Gates.QuarterTurns.SqrtYBackward,
            Gates.QuarterTurns.SqrtXBackward
        ]
    },
    {
        hint: "Eighth Turns",
        gates: [
            Gates.OtherZ.Z4,
            Gates.OtherY.Y4,
            Gates.OtherX.X4,
            Gates.OtherZ.Z4i,
            Gates.OtherY.Y4i,
            Gates.OtherX.X4i
        ]
    },
    {
        hint: 'Misc',
        gates: [
            Gates.PhaseGradientGates.PhaseGradientFamily.ofSize(2),
            null,
            Gates.FourierTransformFamily.ofSize(2),
            Gates.PhaseGradientGates.PhaseDegradientFamily.ofSize(2),
            Gates.Misc.MysteryGateMaker(),
            Gates.Misc.SpacerGate
        ]
    },
    {
        hint: 'Arithmetic',
        gates: [
            Gates.Arithmetic.CountingFamily.ofSize(2),
            Gates.Arithmetic.AdditionFamily.ofSize(4),
            Gates.Arithmetic.IncrementFamily.ofSize(2),
            Gates.Arithmetic.UncountingFamily.ofSize(2),
            Gates.Arithmetic.SubtractionFamily.ofSize(4),
            Gates.Arithmetic.DecrementFamily.ofSize(2)
        ]
    },
    {
        hint: "Raising",
        gates: [
            Gates.Powering.ZForward,
            Gates.Powering.YForward,
            Gates.Powering.XForward,
            Gates.Powering.ZBackward,
            Gates.Powering.YBackward,
            Gates.Powering.XBackward
        ]
    },
    {
        hint: "Exponentiating",
        gates: [
            Gates.Exponentiating.ZForward,
            Gates.Exponentiating.YForward,
            Gates.Exponentiating.XForward,
            Gates.Exponentiating.ZBackward,
            Gates.Exponentiating.YBackward,
            Gates.Exponentiating.XBackward
        ]
    },
    {
        hint: "Other X",
        gates: [
            Gates.OtherX.X16,
            Gates.OtherX.X8,
            Gates.OtherX.X3,
            Gates.OtherX.X16i,
            Gates.OtherX.X8i,
            Gates.OtherX.X3i
        ]
    },
    {
        hint: "Other Y",
        gates: [
            Gates.OtherY.Y16,
            Gates.OtherY.Y8,
            Gates.OtherY.Y3,
            Gates.OtherY.Y16i,
            Gates.OtherY.Y8i,
            Gates.OtherY.Y3i
        ]
    },
    {
        hint: "Other Z",
        gates: [
            Gates.OtherZ.Z16,
            Gates.OtherZ.Z8,
            Gates.OtherZ.Z3,
            Gates.OtherZ.Z16,
            Gates.OtherZ.Z8i,
            Gates.OtherZ.Z3i
        ]
    }
];

/** @type {!Array.<!Gate>} */
Gates.KnownToSerializer = [
    Gates.Special.Control,
    Gates.Special.AntiControl,
    Gates.Special.Measurement,
    Gates.Special.SwapHalf,

    ...AmplitudeDisplayFamily.all,
    ...Gates.Displays.ProbabilityDisplayFamily.all,
    ...Gates.Displays.SampleDisplayFamily.all,
    ...DensityMatrixDisplayFamily.all,
    Gates.Displays.BlochSphereDisplay,

    Gates.Misc.SpacerGate,
    Gates.Misc.ClockPulseGate,
    Gates.Misc.QuarterPhaseClockPulseGate,

    ...ArithmeticGates.all,
    ...ExponentiatingGates.all,
    ...HalfTurnGates.all,
    ...QuarterTurnGates.all,
    ...PostSelectionGates.all,
    ...PoweringGates.all,
    ...VariousXGates.all,
    ...VariousYGates.all,
    ...VariousZGates.all,
    ...Gates.FourierTransformFamily.all,
    ...Gates.PhaseGradientGates.PhaseGradientFamily.all,
    ...Gates.PhaseGradientGates.PhaseDegradientFamily.all,

    Gates.ExperimentalAndImplausible.UniversalNot,
    Gates.ExperimentalAndImplausible.ErrorInjection,
    ...Gates.ExperimentalAndImplausible.CycleBitsFamily.all
];
