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
import ProbabilityDisplayFamily from "src/gates/ProbabilityDisplayFamily.js"
import SampleDisplayFamily from "src/gates/SampleDisplayFamily.js"

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
        "Shows a wire's local state as a point on the Bloch Sphere.\nUse controls to see conditional states."
    ).withCustomDrawer(GatePainting.makeDisplayDrawer(args => {
        let {row, col} = args.positionInCircuit;
        let ρ = args.stats.qubitDensityMatrix(row, col);
        MathPainter.paintBlochSphere(args.painter, ρ, args.rect, args.focusPoints);
    }))
};

Gates.Displays.DensityMatrixDisplay = DensityMatrixDisplayFamily.ofSize(1);
Gates.Displays.DensityMatrixDisplay2 = DensityMatrixDisplayFamily.ofSize(2);
Gates.Displays.ChanceDisplay = Gates.Displays.ProbabilityDisplayFamily.ofSize(1);

/**
 * Gates that correspond to 180 degree rotations around the Bloch sphere, so they're their own inverses.
 */
Gates.HalfTurns = {
    X: Gate.fromKnownMatrix(
        "X",
        Matrix.PAULI_X,
        "Pauli X Gate",
        "The NOT gate.\nToggles between ON and OFF."
    ).withCustomDrawer(args => {
        // The X gate is drawn as a crossed circle when it has controls.

        let hasSingleWireControl =
            args.positionInCircuit !== null &&
            args.stats.circuitDefinition.colHasSingleWireControl(args.positionInCircuit.col);
        let hasDoubleWireControl =
            args.positionInCircuit !== null &&
            args.stats.circuitDefinition.colHasDoubleWireControl(args.positionInCircuit.col);
        if ((!hasSingleWireControl && !hasDoubleWireControl) || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
            return;
        }

        let drawArea = args.rect.scaledOutwardBy(0.6);
        args.painter.fillCircle(drawArea.center(), drawArea.w / 2);
        args.painter.strokeCircle(drawArea.center(), drawArea.w / 2);
        if (hasSingleWireControl) {
            args.painter.strokeLine(drawArea.topCenter(), drawArea.bottomCenter());
        }
        if (hasDoubleWireControl) {
            args.painter.strokeLine(drawArea.topCenter().offsetBy(-1, 0), drawArea.bottomCenter().offsetBy(-1, 0));
            args.painter.strokeLine(drawArea.topCenter().offsetBy(+1, 0), drawArea.bottomCenter().offsetBy(+1, 0));
        }
        let isMeasured = args.stats.circuitDefinition.locIsMeasured(
            new Point(args.positionInCircuit.col, args.positionInCircuit.row));
        if (isMeasured) {
            args.painter.strokeLine(drawArea.centerLeft().offsetBy(0, -1), drawArea.centerRight().offsetBy(0, -1));
            args.painter.strokeLine(drawArea.centerLeft().offsetBy(0, +1), drawArea.centerRight().offsetBy(0, +1));
        } else {
            args.painter.strokeLine(drawArea.centerLeft(), drawArea.centerRight());
        }
    }),

    Y: Gate.fromKnownMatrix(
        "Y",
        Matrix.PAULI_Y,
        "Pauli Y Gate",
        "A combination of the X and Z gates."),

    Z: Gate.fromKnownMatrix(
        "Z",
        Matrix.PAULI_Z,
        "Pauli Z Gate",
        "The phase flip gate.\nNegates phases when the qubit is ON."),

    H: Gate.fromKnownMatrix(
        "H",
        Matrix.HADAMARD,
        "Hadamard Gate",
        "Creates simple superpositions.\n" +
        "Maps ON to ON + OFF.\n" +
        "Maps OFF to ON - OFF.")
};

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

const GRADIENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => r === c ? Complex.polar(1, τ*r/(2<<span)) : 0);
const DE_GRADIENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => r === c ? Complex.polar(1, -τ*r/(2<<span)) : 0);

Gates.PhaseGradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^#",
    "Phase Gradient Gate",
    "Phases by an amount proportional to the little endian number represented by a block of qubits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseGradient" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.phaseGradient(val, con, bit, span)));

Gates.PhaseDegradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^-#",
    "Inverse Phase Gradient Gate",
    "Phases by a negative amount proportional to the little endian number represented by a block of qubits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DE_GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseUngradient" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.phaseGradient(val, con, bit, span, -1)));

Gates.QuarterTurns = {
    SqrtXForward: Gate.fromKnownMatrix(
        "X^½",
        Matrix.fromPauliRotation(0.25, 0, 0),
        "√X Gate",
        "Principle square root of Not."),

    SqrtXBackward: Gate.fromKnownMatrix(
        "X^-½",
        Matrix.fromPauliRotation(0.75, 0, 0),
        "X^-½ Gate",
        "Adjoint square root of Not."),

    SqrtYForward: Gate.fromKnownMatrix(
        "Y^½",
        Matrix.fromPauliRotation(0, 0.25, 0),
        "√Y Gate",
        "Principle square root of Y."),

    SqrtYBackward: Gate.fromKnownMatrix(
        "Y^-½",
        Matrix.fromPauliRotation(0, 0.75, 0),
        "Y^-½ Gate",
        "Adjoint square root of Y."),

    SqrtZForward: Gate.fromKnownMatrix(
        "Z^½",
        Matrix.fromPauliRotation(0, 0, 0.25),
        "√Z Gate",
        "Principle square root of Z.\nAlso known as the 'S' gate."),

    SqrtZBackward: Gate.fromKnownMatrix(
        "Z^-½",
        Matrix.fromPauliRotation(0, 0, 0.75),
        "Z^-½ Gate",
        "Adjoint square root of Z.")
};

Gates.OtherZ = {
    Z3: Gate.fromKnownMatrix(
        "Z^⅓",
        Matrix.fromPauliRotation(0, 0, 1 / 6),
        "Z^⅓ Gate",
        "Principle third root of Z."),
    Z3i: Gate.fromKnownMatrix(
        "Z^-⅓",
        Matrix.fromPauliRotation(0, 0, -1 / 6),
        "Z^-⅓ Gate",
        "Adjoint third root of Z."),
    Z4: Gate.fromKnownMatrix(
        "Z^¼",
        Matrix.fromPauliRotation(0, 0, 1 / 8),
        "Z^¼ Gate",
        "Principle fourth root of Z.\nAlso known as the 'T' gate."),
    Z4i: Gate.fromKnownMatrix(
        "Z^-¼",
        Matrix.fromPauliRotation(0, 0, -1 / 8),
        "Z^-¼ Gate",
        "Adjoint fourth root of Z."),
    Z8: Gate.fromKnownMatrix(
        "Z^⅛",
        Matrix.fromPauliRotation(0, 0, 1 / 16),
        "Z^⅛ Gate",
        "Principle eighth root of Z."),
    Z8i: Gate.fromKnownMatrix(
        "Z^-⅛",
        Matrix.fromPauliRotation(0, 0, -1 / 16),
        "Z^-⅛ Gate",
        "Adjoint eighth root of Z."),
    Z16: Gate.fromKnownMatrix(
        "Z^⅟₁₆",
        Matrix.fromPauliRotation(0, 0, 1 / 32),
        "Z^⅟₁₆ Gate",
        "Principle sixteenth root of Z."),
    Z16i: Gate.fromKnownMatrix(
        "Z^-⅟₁₆",
        Matrix.fromPauliRotation(0, 0, -1 / 32),
        "Z^-⅟₁₆ Gate",
        "Adjoint sixteenth root of Z.")
};

Gates.OtherX = {
    X3: Gate.fromKnownMatrix(
        "X^⅓",
        Matrix.fromPauliRotation(1 / 6, 0, 0),
        "X^⅓ Gate",
        "Principle third root of X."),
    X3i: Gate.fromKnownMatrix(
        "X^-⅓",
        Matrix.fromPauliRotation(-1 / 6, 0, 0),
        "X^-⅓ Gate",
        "Adjoint third root of X."),
    X4: Gate.fromKnownMatrix(
        "X^¼",
        Matrix.fromPauliRotation(1 / 8, 0, 0),
        "X^¼ Gate",
        "Principle fourth root of X."),
    X4i: Gate.fromKnownMatrix(
        "X^-¼",
        Matrix.fromPauliRotation(-1 / 8, 0, 0),
        "X^-¼ Gate",
        "Adjoint fourth root of X."),
    X8: Gate.fromKnownMatrix(
        "X^⅛",
        Matrix.fromPauliRotation(1 / 16, 0, 0),
        "X^⅛ Gate",
        "Principle eighth root of X."),
    X8i: Gate.fromKnownMatrix(
        "X^-⅛",
        Matrix.fromPauliRotation(-1 / 16, 0, 0),
        "X^-⅛ Gate",
        "Adjoint eighth root of X."),
    X16: Gate.fromKnownMatrix(
        "X^⅟₁₆",
        Matrix.fromPauliRotation(1 / 32, 0, 0),
        "X^⅟₁₆ Gate",
        "Principle sixteenth root of X."),
    X16i: Gate.fromKnownMatrix(
        "X^-⅟₁₆",
        Matrix.fromPauliRotation(-1 / 32, 0, 0),
        "X^-⅟₁₆ Gate",
        "Adjoint sixteenth root of X.")
};

Gates.OtherY = {
    Y3: Gate.fromKnownMatrix(
        "Y^⅓",
        Matrix.fromPauliRotation(0, 1 / 6, 0),
        "Y^⅓ Gate",
        "Principle third root of Y."),
    Y3i: Gate.fromKnownMatrix(
        "Y^-⅓",
        Matrix.fromPauliRotation(0, -1 / 6, 0),
        "Y^-⅓ Gate",
        "Adjoint third root of Y."),
    Y4: Gate.fromKnownMatrix(
        "Y^¼",
        Matrix.fromPauliRotation(0, 1 / 8, 0),
        "Y^¼ Gate",
        "Principle fourth root of Y."),
    Y4i: Gate.fromKnownMatrix(
        "Y^-¼",
        Matrix.fromPauliRotation(0, -1 / 8, 0),
        "Y^-¼ Gate",
        "Adjoint fourth root of Y."),
    Y8: Gate.fromKnownMatrix(
        "Y^⅛",
        Matrix.fromPauliRotation(0, 1 / 16, 0),
        "Y^⅛ Gate",
        "Principle eighth root of Y."),
    Y8i: Gate.fromKnownMatrix(
        "Y^-⅛",
        Matrix.fromPauliRotation(0, -1 / 16, 0),
        "Y^-⅛ Gate",
        "Adjoint eighth root of Y."),
    Y16: Gate.fromKnownMatrix(
        "Y^⅟₁₆",
        Matrix.fromPauliRotation(0, 1 / 32, 0),
        "Y^⅟₁₆ Gate",
        "Principle sixteenth root of Y."),
    Y16i: Gate.fromKnownMatrix(
        "Y^-⅟₁₆",
        Matrix.fromPauliRotation(0, -1 / 32, 0),
        "Y^-⅟₁₆ Gate",
        "Adjoint sixteenth root of Y.")
};

const XPow = t => {
    let c = Math.cos(τ * t) / 2;
    let s = Math.sin(τ * t) / 2;
    return new Matrix(2, 2, new Float32Array([0.5+c, s, 0.5-c, -s, 0.5-c, -s, 0.5+c, s]));
};
const YPow = t => {
    let c = Math.cos(τ * t) / 2;
    let s = Math.sin(τ * t) / 2;
    return new Matrix(2, 2, new Float32Array([0.5+c, s, -s, c-0.5, s, 0.5-c, 0.5+c, s]));
};
const ZPow = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([1, 0, 0, 0, 0, 0, c, s]));
};
const XExp = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([c, 0, 0, -s, 0, -s, c, 0]));
};
const YExp = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([c, 0, -s, 0, s, 0, c, 0]));
};
const ZExp = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([c, -s, 0, 0, 0, 0, c, s]));
};

Gates.Exponentiating = {
    XForward: Gate.fromVaryingMatrix(
        "e^-iXt",
        XExp,
        "X-Exponentiating Gate (forward)",
        "A continuous right-handed rotation around the X axis.\nPasses through ±iX instead of X.").
        withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER),

    XBackward: Gate.fromVaryingMatrix(
        "e^iXt",
        t => XExp(-t),
        "X-Exponentiating Gate (backward)",
        "A continuous left-handed rotation around the X axis.\nPasses through ±iX instead of X.").
        withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER),

    YForward: Gate.fromVaryingMatrix(
        "e^-iYt",
        YExp,
        "Y-Exponentiating Gate (forward)",
        "A continuous right-handed rotation around the Y axis.\nPasses through ±iY instead of Y.").
        withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER),

    YBackward: Gate.fromVaryingMatrix(
        "e^iYt",
        t => YExp(-t),
        "Y-Exponentiating Gate (backward)",
        "A continuous left-handed rotation around the Y axis.\nPasses through ±iY instead of Y.").
        withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER),

    ZForward: Gate.fromVaryingMatrix(
        "e^-iZt",
        ZExp,
        "Z-Exponentiating Gate (forward)",
        "A continuous right-handed rotation around the Z axis.\nPasses through ±iZ instead of Z.",
        false,
        false).
        withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER),

    ZBackward: Gate.fromVaryingMatrix(
        "e^iZt",
        t => ZExp(-t),
        "Z-Exponentiating Gate (backward)",
        "A continuous left-handed rotation around the Z axis.\nPasses through ±iZ instead of Z.",
        false,
        false).
        withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER)
};

Gates.Powering = {
    XForward: Gate.fromVaryingMatrix(
        "X^t",
        XPow,
        "X-Raising Gate (forward)",
        "A continuous right-handed cycle between the X gate and no-op.").
        withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER),

    XBackward: Gate.fromVaryingMatrix(
        "X^-t",
        t => XPow(-t),
        "X-Raising Gate (backward)",
        "A continuous left-handed cycle between the X gate and no-op.").
        withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER),

    YForward: Gate.fromVaryingMatrix(
        "Y^t",
        YPow,
        "Y-Raising Gate (forward)",
        "A continuous right-handed cycle between the Y gate and no-op.").
        withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER),

    YBackward: Gate.fromVaryingMatrix(
        "Y^-t",
        t => YPow(-t),
        "Y-Raising Gate (backward)",
        "A continuous left-handed cycle between the Y gate and no-op.").
        withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER),

    ZForward: Gate.fromVaryingMatrix(
        "Z^t",
        ZPow,
        "Z-Raising Gate (forward)",
        "A continuous right-handed cycle between the Z gate and no-op.",
        false,
        false).
        withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER),

    ZBackward: Gate.fromVaryingMatrix(
        "Z^-t",
        t => ZPow(-t),
        "Z-Raising Gate (backward)",
        "A continuous left-handed cycle between the Z gate and no-op.",
        false,
        false).
        withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER)
};

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

    PostSelectOff: Gate.fromKnownMatrix(
        "|0⟩⟨0|",
        Matrix.square(1, 0, 0, 0),
        "Post-selection Gate [Off]",
        "Keeps OFF states, discards ON states, and renormalizes\n" +
            "(Corresponds to restarting until the right answer happens.)").
        withCustomDrawer(GatePainting.POST_SELECT_DRAWER),

    PostSelectOn: Gate.fromKnownMatrix(
        "|1⟩⟨1|",
        Matrix.square(0, 0, 0, 1),
        "Post-selection Gate [On]",
        "Keeps ON states, discards OFF states, and renormalizes.\n" +
            "(Corresponds to restarting until the right answer happens.)").
        withCustomDrawer(GatePainting.POST_SELECT_DRAWER),

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
    UniversalNot: Gate.withoutKnownMatrix(
        "UniNot",
        "Universal Not Gate",
        "Mirrors a qubit's state through the origin of the Bloch sphere.\nImpossible in practice.").
        markedAsStable().
        withCustomShader(GateShaders.universalNot).
        withSerializedId("__unstable__UniversalNot"),
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

Gates.Arithmetic = ArithmeticGates;

/** @type {!Array<!{hint: !string, gates: !Array<?Gate>}>} */
Gates.Sets = [
    {
        hint: "Probes",
        gates: [
            Gates.Special.Measurement,
            Gates.Misc.PostSelectOff,
            Gates.Special.AntiControl,
            null,
            Gates.Misc.PostSelectOn,
            Gates.Special.Control
        ]
    },
    {
        hint: "Displays",
        gates: [
            Gates.Displays.SampleDisplayFamily.ofSize(3),
            DensityMatrixDisplayFamily.ofSize(1),
            Gates.Displays.ProbabilityDisplayFamily.ofSize(1),
            null,
            Gates.Displays.BlochSphereDisplay,
            AmplitudeDisplayFamily.ofSize(2)
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
            Gates.PhaseGradientFamily.ofSize(2),
            null,
            Gates.FourierTransformFamily.ofSize(2),
            Gates.PhaseDegradientFamily.ofSize(2),
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
    Gates.Misc.PostSelectOff,
    Gates.Misc.PostSelectOn,
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

    Gates.HalfTurns.H,
    Gates.HalfTurns.X,
    Gates.HalfTurns.Y,
    Gates.HalfTurns.Z,

    Gates.QuarterTurns.SqrtXForward,
    Gates.QuarterTurns.SqrtYForward,
    Gates.QuarterTurns.SqrtZForward,
    Gates.QuarterTurns.SqrtXBackward,
    Gates.QuarterTurns.SqrtYBackward,
    Gates.QuarterTurns.SqrtZBackward,

    Gates.Powering.XForward,
    Gates.Powering.YForward,
    Gates.Powering.ZForward,
    Gates.Powering.XBackward,
    Gates.Powering.YBackward,
    Gates.Powering.ZBackward,

    Gates.Exponentiating.XBackward,
    Gates.Exponentiating.YBackward,
    Gates.Exponentiating.ZBackward,
    Gates.Exponentiating.XForward,
    Gates.Exponentiating.YForward,
    Gates.Exponentiating.ZForward,

    Gates.OtherX.X3,
    Gates.OtherX.X4,
    Gates.OtherX.X8,
    Gates.OtherX.X16,
    Gates.OtherX.X3i,
    Gates.OtherX.X4i,
    Gates.OtherX.X8i,
    Gates.OtherX.X16i,

    Gates.OtherY.Y3,
    Gates.OtherY.Y4,
    Gates.OtherY.Y8,
    Gates.OtherY.Y16,
    Gates.OtherY.Y3i,
    Gates.OtherY.Y4i,
    Gates.OtherY.Y8i,
    Gates.OtherY.Y16i,

    Gates.OtherZ.Z3,
    Gates.OtherZ.Z4,
    Gates.OtherZ.Z8,
    Gates.OtherZ.Z16,
    Gates.OtherZ.Z3i,
    Gates.OtherZ.Z4i,
    Gates.OtherZ.Z8i,
    Gates.OtherZ.Z16i,

    ...Gates.Arithmetic.IncrementFamily.all,
    ...Gates.Arithmetic.DecrementFamily.all,
    ...Gates.Arithmetic.AdditionFamily.all,
    ...Gates.Arithmetic.SubtractionFamily.all,
    ...Gates.Arithmetic.CountingFamily.all,
    ...Gates.Arithmetic.UncountingFamily.all,

    ...Gates.FourierTransformFamily.all,
    ...Gates.PhaseGradientFamily.all,
    ...Gates.PhaseDegradientFamily.all,

    Gates.ExperimentalAndImplausible.UniversalNot,
    Gates.ExperimentalAndImplausible.ErrorInjection,
    ...Gates.ExperimentalAndImplausible.CycleBitsFamily.all
];
