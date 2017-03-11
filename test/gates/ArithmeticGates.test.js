import {Suite} from "test/TestUtil.js"
import {Gates} from "src/gates/AllGates.js"
import {incrementShaderFunc, ArithmeticGates} from "src/gates/ArithmeticGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {
    assertThatCircuitShaderActsLikeMatrix,
    assertThatCircuitUpdateActsLikeMatrix
} from "test/CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("ArithmeticGates");

const circuit = (diagram, ...extras) => CircuitDefinition.fromTextDiagram(new Map([
    ...extras,
    ['-', undefined],
    ['/', null],
    ['A', Gates.InputGates.InputAFamily],
    ['B', Gates.InputGates.InputBFamily],
    ['•', Gates.Controls.Control],
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
]), diagram);

suite.testUsingWebGL('increment', () => {
    assertThatCircuitShaderActsLikeMatrix(
        ctx => incrementShaderFunc(ctx, 3, 5),
        Matrix.generateTransition(8, e => (e+5)&7));

    assertThatCircuitShaderActsLikeMatrix(
        ctx => incrementShaderFunc(ctx, 2, -3),
        Matrix.generateTransition(4, e => (e-3)&3));
});

suite.testUsingWebGL('plus_A', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [new GateColumn([
                ArithmeticGates.PlusAFamily.ofSize(2), undefined, InputGates.InputAFamily.ofSize(2), undefined])]),
            false),
        Matrix.generateTransition(16, i => {
            let a = (i >> 2) & 3;
            let t = i & 3;
            return (a<<2) | (t+a)&3;
        }));
});

suite.testUsingWebGL('minus_A', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [new GateColumn([
                InputGates.InputAFamily.ofSize(2), undefined, ArithmeticGates.MinusAFamily.ofSize(2), undefined])]),
            false),
        Matrix.generateTransition(16, i => {
            let a = i & 3;
            let t = (i >> 2) & 3;
            return a | (((t-a)&3)<<2);
        }));
});

suite.testUsingWebGL('A_less_than_B', () => {
    let circ = circuit(`-<-
                        ---
                        -A-
                        -/-
                        -B-
                        -/-`, ['<', ArithmeticGates.ALessThanB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<6, i => {
            let a = (i >> 2) & 3;
            let b = (i >> 4) & 3;
            let t = (i & 1) ^ (a < b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_less_than_larger_B', () => {
    let circ = circuit(`-<-
                        -A-
                        -/-
                        -B-
                        -/-
                        -/-`, ['<', ArithmeticGates.ALessThanB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<6, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 7;
            let t = (i & 1) ^ (a < b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_less_than_smaller_B', () => {
    let circ = circuit(`-<-
                        -A-
                        -/-
                        -/-
                        -B-
                        -/-`, ['<', ArithmeticGates.ALessThanB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<6, i => {
            let a = (i >> 1) & 7;
            let b = (i >> 4) & 3;
            let t = (i & 1) ^ (a < b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_less_than_or_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ArithmeticGates.ALessThanOrEqualToB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a <= b ? 1 : 0);
            return t | (i & ~1)
        }));
});


suite.testUsingWebGL('A_greater_than_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ArithmeticGates.AGreaterThanB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a > b ? 1 : 0);
            return t | (i & ~1)
        }));
});


suite.testUsingWebGL('A_greater_than_or_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ArithmeticGates.AGreaterThanOrEqualToB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a >= b ? 1 : 0);
            return t | (i & ~1)
        }));
});


suite.testUsingWebGL('A_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ArithmeticGates.AEqualToB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a == b ? 1 : 0);
            return t | (i & ~1)
        }));
});


suite.testUsingWebGL('A_not_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ArithmeticGates.ANotEqualToB])
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a != b ? 1 : 0);
            return t | (i & ~1)
        }));
});

