import ArithmeticGates from "src/gates/ArithmeticGates.js"
import AmplitudeDisplayFamily from "src/gates/AmplitudeDisplayFamily.js"
import BlochSphereDisplay from "src/gates/BlochSphereDisplay.js"
import Controls from "src/gates/Controls.js"
import CountingGates from "src/gates/CountingGates.js"
import CycleBitsGates from "src/gates/CycleBitsGates.js"
import DensityMatrixDisplayFamily from "src/gates/DensityMatrixDisplayFamily.js"
import ErrorInjectionGate from "src/gates/Debug_ErrorInjectionGate.js"
import ExponentiatingGates from "src/gates/ExponentiatingGates.js"
import FourierTransformGates from "src/gates/FourierTransformGates.js"
import HalfTurnGates from "src/gates/HalfTurnGates.js"
import MeasurementGate from "src/gates/MeasurementGate.js"
import MultiplyAccumulateGates from "src/gates/MultiplyAccumulateGates.js"
import NeGate from "src/gates/Joke_NeGate.js"
import PhaseGradientGates from "src/gates/PhaseGradientGates.js"
import PostSelectionGates from "src/gates/PostSelectionGates.js"
import PoweringGates from "src/gates/PoweringGates.js"
import ProbabilityDisplayFamily from "src/gates/ProbabilityDisplayFamily.js"
import QuarterTurnGates from "src/gates/QuarterTurnGates.js"
import ReverseBitsGateFamily from "src/gates/ReverseBitsGateFamily.js"
import SampleDisplayFamily from "src/gates/SampleDisplayFamily.js"
import SpacerGate from "src/gates/SpacerGate.js"
import SwapGateHalf from "src/gates/SwapGateHalf.js"
import UniversalNotGate from "src/gates/Impossible_UniversalNotGate.js"
import VariousXGates from "src/gates/VariousXGates.js"
import VariousYGates from "src/gates/VariousYGates.js"
import VariousZGates from "src/gates/VariousZGates.js"
import ZeroGate from "src/gates/Joke_ZeroGate.js"
import {MysteryGateMaker} from "src/gates/Joke_MysteryGate.js"

let Gates = {};
export default Gates;

/** Gates that have special behavior requiring custom code / logic to handle. */
Gates.Special = {
    Measurement: MeasurementGate,
    SwapHalf: SwapGateHalf
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
    BlochSphereDisplay: BlochSphereDisplay
};
Gates.Arithmetic = ArithmeticGates;
Gates.Controls = Controls;
Gates.CountingGates = CountingGates;
Gates.CycleBitsGates = CycleBitsGates;
Gates.Displays.DensityMatrixDisplay = DensityMatrixDisplayFamily.ofSize(1);
Gates.Displays.DensityMatrixDisplay2 = DensityMatrixDisplayFamily.ofSize(2);
Gates.Displays.ChanceDisplay = Gates.Displays.ProbabilityDisplayFamily.ofSize(1);
Gates.ErrorInjection = ErrorInjectionGate;
Gates.Exponentiating = ExponentiatingGates;
Gates.FourierTransformGates = FourierTransformGates;
Gates.HalfTurns = HalfTurnGates;
Gates.MultiplyAccumulateGates = MultiplyAccumulateGates;
Gates.OtherX = VariousXGates;
Gates.OtherY = VariousYGates;
Gates.OtherZ = VariousZGates;
Gates.PhaseGradientGates = PhaseGradientGates;
Gates.PostSelectionGates = PostSelectionGates;
Gates.Powering = PoweringGates;
Gates.QuarterTurns = QuarterTurnGates;
Gates.ReverseBitsGateFamily = ReverseBitsGateFamily;
Gates.SpacerGate = SpacerGate;
Gates.UniversalNot = UniversalNotGate;
Gates.ZeroGate = ZeroGate;
Gates.NeGate = NeGate;

/** @type {!Array.<!Gate>} */
Gates.KnownToSerializer = [
    ...Controls.all,
    MeasurementGate,
    SwapGateHalf,
    SpacerGate,
    UniversalNotGate,
    ErrorInjectionGate,
    ZeroGate,
    NeGate,

    ...AmplitudeDisplayFamily.all,
    ...ProbabilityDisplayFamily.all,
    ...SampleDisplayFamily.all,
    ...DensityMatrixDisplayFamily.all,
    BlochSphereDisplay,

    ...ArithmeticGates.all,
    ...CountingGates.all,
    ...CycleBitsGates.all,
    ...ExponentiatingGates.all,
    ...FourierTransformGates.all,
    ...HalfTurnGates.all,
    ...MultiplyAccumulateGates.all,
    ...QuarterTurnGates.all,
    ...PhaseGradientGates.all,
    ...PostSelectionGates.all,
    ...PoweringGates.all,
    ...ReverseBitsGateFamily.all,
    ...VariousXGates.all,
    ...VariousYGates.all,
    ...VariousZGates.all
];

/** @type {!Array<!{hint: !string, gates: !Array<undefined|!Gate>}>} */
Gates.TopToolboxGroups = [
    {
        hint: "Probes",
        gates: [
            MeasurementGate,                  undefined,
            PostSelectionGates.PostSelectOff, PostSelectionGates.PostSelectOn,
            Controls.AntiControl,             Controls.Control
        ]
    },
    {
        hint: "Displays",
        gates: [
            SampleDisplayFamily.ofSize(3),        undefined,
            DensityMatrixDisplayFamily.ofSize(1), BlochSphereDisplay,
            ProbabilityDisplayFamily.ofSize(1),   AmplitudeDisplayFamily.ofSize(2)
        ]
    },
    {
        hint: "Half Turns",
        gates: [
            HalfTurnGates.Z, SwapGateHalf,
            HalfTurnGates.Y, undefined,
            HalfTurnGates.X, HalfTurnGates.H
        ]
    },
    {
        hint: "Quarter Turns",
        gates: [
            QuarterTurnGates.SqrtZForward, QuarterTurnGates.SqrtZBackward,
            QuarterTurnGates.SqrtYForward, QuarterTurnGates.SqrtYBackward,
            QuarterTurnGates.SqrtXForward, QuarterTurnGates.SqrtXBackward
        ]
    },
    {
        hint: "Eighth Turns",
        gates: [
            VariousZGates.Z4, VariousZGates.Z4i,
            VariousYGates.Y4, VariousYGates.Y4i,
            VariousXGates.X4, VariousXGates.X4i
        ]
    },
    {
        hint: 'Fourier',
        gates: [
            PhaseGradientGates.PhaseGradientFamily.ofSize(2), PhaseGradientGates.PhaseDegradientFamily.ofSize(2),
            undefined, ReverseBitsGateFamily.ofSize(2),
            FourierTransformGates.FourierTransformFamily.ofSize(2),
                FourierTransformGates.InverseFourierTransformFamily.ofSize(2)
        ]
    },
    {
        hint: 'Silly',
        gates: [
            ZeroGate,   MysteryGateMaker(),
            NeGate,     undefined,
            SpacerGate, undefined
        ]
    }
];

/** @type {!Array<!{hint: !string, gates: !Array<undefined|!Gate>}>} */
Gates.BottomToolboxGroups = [
    {
        hint: 'Arithmetic',
        gates: [
            ArithmeticGates.IncrementFamily.ofSize(2), ArithmeticGates.DecrementFamily.ofSize(2),
            ArithmeticGates.AdditionFamily.ofSize(4), ArithmeticGates.SubtractionFamily.ofSize(4),
            MultiplyAccumulateGates.MultiplyAddFamily.ofSize(4),
                MultiplyAccumulateGates.MultiplySubtractFamily.ofSize(4)
        ]
    },
    {
        hint: "Cycling",
        gates: [
            CountingGates.CountingFamily.ofSize(2),          CountingGates.UncountingFamily.ofSize(2),
            CountingGates.LeftShiftRotatingFamily.ofSize(3), CountingGates.RightShiftRotatingFamily.ofSize(3),
            CycleBitsGates.CycleBitsFamily.ofSize(3),        CycleBitsGates.ReverseCycleBitsFamily.ofSize(3)
        ]
    },
    {
        hint: "Raising",
        gates: [
            PoweringGates.XForward, PoweringGates.XBackward,
            PoweringGates.YForward, PoweringGates.YBackward,
            PoweringGates.ZForward, PoweringGates.ZBackward
        ]
    },
    {
        hint: "Exponentiating",
        gates: [
            ExponentiatingGates.XForward, ExponentiatingGates.XBackward,
            ExponentiatingGates.YForward, ExponentiatingGates.YBackward,
            ExponentiatingGates.ZForward, ExponentiatingGates.ZBackward
        ]
    },
    {
        hint: "Various X",
        gates: [
            VariousXGates.X8,  VariousXGates.X8i,
            VariousXGates.X16, VariousXGates.X16i,
            VariousXGates.X3,  VariousXGates.X3i
        ]
    },
    {
        hint: "Various Y",
        gates: [
            VariousYGates.Y8,  VariousYGates.Y8i,
            VariousYGates.Y16, VariousYGates.Y16i,
            VariousYGates.Y3,  VariousYGates.Y3i
        ]
    },
    {
        hint: "Various Z",
        gates: [
            VariousZGates.Z8,  VariousZGates.Z8i,
            VariousZGates.Z16, VariousZGates.Z16i,
            VariousZGates.Z3,  VariousZGates.Z3i
        ]
    },
    {
        hint: "Other Probes",
        gates: [
            Controls.PlusControl, Controls.MinusControl,
            Controls.CrossControl, PostSelectionGates.PostSelectCross,
            PostSelectionGates.PostSelectPlus, PostSelectionGates.PostSelectMinus
        ]
    }
];
