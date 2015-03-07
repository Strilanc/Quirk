import { Suite, skipTestIfWebGlNotAvailable, assertThat, assertThrows } from "test/TestUtil.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglDirector from "src/webgl/WglDirector.js"
import Rect from "src/base/Rect.js"
import Shades from "src/quantum/Shades.js"
import ControlMask from "src/quantum/ControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/linalg/Complex.js"
import Matrix from "src/linalg/Matrix.js"
import PipelineTexture from "src/quantum/PipelineTexture.js"

let suite = new Suite("PipelineTexture");

suite.webGlTest("computePipelineGraph", () => {
    let singleton = new PipelineTexture([], () => undefined);
    assertThat(PipelineTexture.computePipelineGraph([singleton])).isEqualTo(new Map([
        [singleton.id, {
            pipelineValue: singleton,
            inEdgeIds: [],
            outEdgeIds: [],
            unpreparedInputs: 0,
            unsatisfiedOutputs: 0,
            cachedResult: undefined
        }]
    ]));

    let line1 = new PipelineTexture([], () => undefined);
    let line2 = new PipelineTexture([line1], () => undefined);
    let line3 = new PipelineTexture([line2], () => undefined);
    assertThat(PipelineTexture.computePipelineGraph([line3])).isEqualTo(new Map([
        [line1.id, {
            pipelineValue: line1,
            inEdgeIds: [],
            outEdgeIds: [line2.id],
            unpreparedInputs: 0,
            unsatisfiedOutputs: 1,
            cachedResult: undefined
        }],
        [line2.id, {
            pipelineValue: line2,
            inEdgeIds: [line1.id],
            outEdgeIds: [line3.id],
            unpreparedInputs: 1,
            unsatisfiedOutputs: 1,
            cachedResult: undefined
        }],
        [line3.id, {
            pipelineValue: line3,
            inEdgeIds: [line2.id],
            outEdgeIds: [],
            unpreparedInputs: 1,
            unsatisfiedOutputs: 0,
            cachedResult: undefined
        }]
    ]));


    let cross1 = new PipelineTexture([], () => undefined);
    let cross2 = new PipelineTexture([], () => undefined);
    let cross3 = new PipelineTexture([cross1, cross2], () => undefined);
    let cross4 = new PipelineTexture([cross3], () => undefined);
    let cross5 = new PipelineTexture([cross3], () => undefined);
    assertThat(PipelineTexture.computePipelineGraph([cross4, cross5])).isEqualTo(new Map([
        [cross1.id, {
            pipelineValue: cross1,
            inEdgeIds: [],
            outEdgeIds: [cross3.id],
            unpreparedInputs: 0,
            unsatisfiedOutputs: 1,
            cachedResult: undefined
        }],
        [cross2.id, {
            pipelineValue: cross2,
            inEdgeIds: [],
            outEdgeIds: [cross3.id],
            unpreparedInputs: 0,
            unsatisfiedOutputs: 1,
            cachedResult: undefined
        }],
        [cross3.id, {
            pipelineValue: cross3,
            inEdgeIds: [cross1.id, cross2.id],
            outEdgeIds: [cross4.id, cross5.id],
            unpreparedInputs: 2,
            unsatisfiedOutputs: 2,
            cachedResult: undefined
        }],
        [cross4.id, {
            pipelineValue: cross4,
            inEdgeIds: [cross3.id],
            outEdgeIds: [],
            unpreparedInputs: 1,
            unsatisfiedOutputs: 0,
            cachedResult: undefined
        }],
        [cross5.id, {
            pipelineValue: cross5,
            inEdgeIds: [cross3.id],
            outEdgeIds: [],
            unpreparedInputs: 1,
            unsatisfiedOutputs: 0,
            cachedResult: undefined
        }]
    ]));
});
