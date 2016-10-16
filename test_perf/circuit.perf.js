import {perfGoal, millis} from "test_perf/TestPerfUtil.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Gate} from "src/circuit/Gate.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"

perfGoal(
    "2-Qubit QFT gate with manual de-QFT",
    millis(15),
    circuit => CircuitStats.fromCircuitAtTime(circuit, 0),
    CircuitDefinition.fromTextDiagram(
        new Map([
            ['•', Gates.Controls.Control],
            ['H', Gates.HalfTurns.H],
            ['1', Gates.QuarterTurns.SqrtZForward],
            ['-', undefined],
            ['/', undefined],
            ['Q', Gates.FourierTransformGates.InverseFourierTransformFamily.ofSize(2)]
        ]),
        `-Q-H-1---
         -/---•-H-`));

perfGoal(
    "4-Qubit QFT gate with manual de-QFT",
    millis(15),
    circuit => CircuitStats.fromCircuitAtTime(circuit, 0),
    CircuitDefinition.fromTextDiagram(
        new Map([
            ['•', Gates.Controls.Control],
            ['H', Gates.HalfTurns.H],
            ['1', Gates.QuarterTurns.SqrtZForward],
            ['2', Gates.OtherZ.Z4],
            ['3', Gates.OtherZ.Z8],
            ['-', undefined],
            ['/', undefined],
            ['Q', Gates.FourierTransformGates.InverseFourierTransformFamily.ofSize(4)]
        ]),
        `-Q-H-1---2---3---
         -/---•-H-1---2---
         -/-------•-H-1---
         -/-----------•-H-`));

perfGoal(
    "8-Qubit QFT gate with manual de-QFT",
    millis(25),
    circuit => CircuitStats.fromCircuitAtTime(circuit, 0),
    CircuitDefinition.fromTextDiagram(
        new Map([
            ['•', Gates.Controls.Control],
            ['H', Gates.HalfTurns.H],
            ['1', Gates.QuarterTurns.SqrtZForward],
            ['2', Gates.OtherZ.Z4],
            ['3', Gates.OtherZ.Z8],
            ['4', Gates.OtherZ.Z16],
            ['5', Gates.OtherZ.Z32],
            ['6', Gates.OtherZ.Z64],
            ['7', Gates.OtherZ.Z128],
            ['-', undefined],
            ['/', undefined],
            ['Q', Gates.FourierTransformGates.InverseFourierTransformFamily.ofSize(8)]
        ]),
        `-Q-H-1---2---3---4---5---6---7---
         -/---•-H-1---2---3---4---5---6---
         -/-------•-H-1---2---3---4---5---
         -/-----------•-H-1---2---3---4---
         -/---------------•-H-1---2---3---
         -/-------------------•-H-1---2---
         -/-----------------------•-H-1---
         -/---------------------------•-H-`));

perfGoal(
    "16-Qubit QFT gate with manual de-QFT",
    millis(200),
    circuit => CircuitStats.fromCircuitAtTime(circuit, 0),
    CircuitDefinition.fromTextDiagram(
        new Map([
            ['•', Gates.Controls.Control],
            ['H', Gates.HalfTurns.H],
            ['1', Gates.QuarterTurns.SqrtZForward],
            ['2', Gates.OtherZ.Z4],
            ['3', Gates.OtherZ.Z8],
            ['4', Gates.OtherZ.Z16],
            ['5', Gates.OtherZ.Z32],
            ['6', Gates.OtherZ.Z64],
            ['7', Gates.OtherZ.Z128],
            ['8', Gate.fromKnownMatrix("8", Matrix.fromPauliRotation(0, 0, 1/(1<<9)))],
            ['9', Gate.fromKnownMatrix("9", Matrix.fromPauliRotation(0, 0, 1/(1<<10)))],
            ['A', Gate.fromKnownMatrix("A", Matrix.fromPauliRotation(0, 0, 1/(1<<11)))],
            ['B', Gate.fromKnownMatrix("B", Matrix.fromPauliRotation(0, 0, 1/(1<<12)))],
            ['C', Gate.fromKnownMatrix("C", Matrix.fromPauliRotation(0, 0, 1/(1<<13)))],
            ['D', Gate.fromKnownMatrix("D", Matrix.fromPauliRotation(0, 0, 1/(1<<14)))],
            ['E', Gate.fromKnownMatrix("E", Matrix.fromPauliRotation(0, 0, 1/(1<<15)))],
            ['F', Gate.fromKnownMatrix("F", Matrix.fromPauliRotation(0, 0, 1/(1<<16)))],
            ['-', undefined],
            ['/', undefined],
            ['Q', Gates.FourierTransformGates.InverseFourierTransformFamily.ofSize(16)]
        ]),
        `-Q-H-1---2---3---4---5---6---7---8---9---A---B---C---D---E---F---
         -/---•-H-1---2---3---4---5---6---7---8---9---A---B---C---D---E---
         -/-------•-H-1---2---3---4---5---6---7---8---9---A---B---C---D---
         -/-----------•-H-1---2---3---4---5---6---7---8---9---A---B---C---
         -/---------------•-H-1---2---3---4---5---6---7---8---9---A---B---
         -/-------------------•-H-1---2---3---4---5---6---7---8---9---A---
         -/-----------------------•-H-1---2---3---4---5---6---7---8---9---
         -/---------------------------•-H-1---2---3---4---5---6---7---8---
         -/-------------------------------•-H-1---2---3---4---5---6---7---
         -/-----------------------------------•-H-1---2---3---4---5---6---
         -/---------------------------------------•-H-1---2---3---4---5---
         -/-------------------------------------------•-H-1---2---3---4---
         -/-----------------------------------------------•-H-1---2---3---
         -/---------------------------------------------------•-H-1---2---
         -/-------------------------------------------------------•-H-1---
         -/-----------------------------------------------------------•-H-`));