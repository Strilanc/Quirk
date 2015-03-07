import { Suite, assertThat } from "test/TestUtil.js"
import PipelineNode from "src/quantum/PipelineNode.js"

let suite = new Suite("PipelineNode");

suite.test("preparePipelineGraph_singleton", () => {
    let singleton = new PipelineNode([], () => undefined);
    assertThat(PipelineNode.prepareGraph([singleton])).isEqualTo(new Map([
        [singleton.id, {
            pipelineNode: singleton,
            inEdgeIds: [],
            outEdgeIds: [],
            unpreparedInputCount: 0,
            unsatisfiedOutputCount: 0,
            cachedResult: undefined
        }]
    ]));
});

suite.test("preparePipelineGraph_line", () => {
    let line1 = new PipelineNode([], () => undefined);
    let line2 = new PipelineNode([line1], () => undefined);
    let line3 = new PipelineNode([line2], () => undefined);
    assertThat(PipelineNode.prepareGraph([line3])).isEqualTo(new Map([
        [line1.id, {
            pipelineNode: line1,
            inEdgeIds: [],
            outEdgeIds: [line2.id],
            unpreparedInputCount: 0,
            unsatisfiedOutputCount: 1,
            cachedResult: undefined
        }],
        [line2.id, {
            pipelineNode: line2,
            inEdgeIds: [line1.id],
            outEdgeIds: [line3.id],
            unpreparedInputCount: 1,
            unsatisfiedOutputCount: 1,
            cachedResult: undefined
        }],
        [line3.id, {
            pipelineNode: line3,
            inEdgeIds: [line2.id],
            outEdgeIds: [],
            unpreparedInputCount: 1,
            unsatisfiedOutputCount: 0,
            cachedResult: undefined
        }]
    ]));
});

suite.test("preparePipelineGraph_cross", () => {
    let cross1 = new PipelineNode([], () => undefined);
    let cross2 = new PipelineNode([], () => undefined);
    let cross3 = new PipelineNode([cross1, cross2], () => undefined);
    let cross4 = new PipelineNode([cross3], () => undefined);
    let cross5 = new PipelineNode([cross3], () => undefined);
    assertThat(PipelineNode.prepareGraph([cross4, cross5])).isEqualTo(new Map([
        [cross1.id, {
            pipelineNode: cross1,
            inEdgeIds: [],
            outEdgeIds: [cross3.id],
            unpreparedInputCount: 0,
            unsatisfiedOutputCount: 1,
            cachedResult: undefined
        }],
        [cross2.id, {
            pipelineNode: cross2,
            inEdgeIds: [],
            outEdgeIds: [cross3.id],
            unpreparedInputCount: 0,
            unsatisfiedOutputCount: 1,
            cachedResult: undefined
        }],
        [cross3.id, {
            pipelineNode: cross3,
            inEdgeIds: [cross1.id, cross2.id],
            outEdgeIds: [cross4.id, cross5.id],
            unpreparedInputCount: 2,
            unsatisfiedOutputCount: 2,
            cachedResult: undefined
        }],
        [cross4.id, {
            pipelineNode: cross4,
            inEdgeIds: [cross3.id],
            outEdgeIds: [],
            unpreparedInputCount: 1,
            unsatisfiedOutputCount: 0,
            cachedResult: undefined
        }],
        [cross5.id, {
            pipelineNode: cross5,
            inEdgeIds: [cross3.id],
            outEdgeIds: [],
            unpreparedInputCount: 1,
            unsatisfiedOutputCount: 0,
            cachedResult: undefined
        }]
    ]));
});

suite.test("runPipelineGraph_singleton", () => {
    let history = [];
    let maker = e => () => { history.push("make " + e); return e + ""; };
    let free = e => { history.push("free " + e); };

    let singleton = new PipelineNode([], maker("s"), free);
    assertThat(PipelineNode.computePipeline([singleton])).isEqualTo(new Map([[singleton.id, "s"]]));
    assertThat(history).isEqualTo(["make s"]);

});

suite.test("runPipelineGraph_line", () => {
    let history = [];
    let maker = e => () => { history.push("make " + e); return e + ""; };
    let free = e => { history.push("free " + e); };

    let line1 = new PipelineNode([], maker(1), free);
    let line2 = new PipelineNode([line1], maker(2), free);
    let line3 = new PipelineNode([line2], maker(3), free);

    history = [];
    assertThat(PipelineNode.computePipeline([line3])).isEqualTo(new Map([
        [line3.id, "3"]
    ]));
    assertThat(history).isEqualTo([
        "make 1",
        "make 2",
        "free 1",
        "make 3",
        "free 2"]);

    history = [];
    assertThat(PipelineNode.computePipeline([line1, line3])).isEqualTo(new Map([
        [line1.id, "1"],
        [line3.id, "3"]
    ]));
    assertThat(history).isEqualTo([
        "make 1",
        "make 2",
        "make 3",
        "free 2"]);
});

suite.test("runPipelineGraph_cross", () => {
    let history = [];
    let maker = e => () => { history.push("make " + e); return e + ""; };
    let free = e => { history.push("free " + e); };

    let cross1 = new PipelineNode([], maker(1), free);
    let cross2 = new PipelineNode([], maker(2), free);
    let cross3 = new PipelineNode([cross1, cross2], maker(3), free);
    let cross4 = new PipelineNode([cross3], maker(4), free);
    let cross5 = new PipelineNode([cross3], maker(5), free);

    history = [];
    assertThat(PipelineNode.computePipeline([cross4, cross5])).isEqualTo(new Map([
        [cross4.id, "4"],
        [cross5.id, "5"]
    ]));
    assertThat(history).isEqualTo([
        "make 1",
        "make 2",
        "make 3",
        "free 1",
        "free 2",
        "make 4",
        "make 5",
        "free 3"]);

    history = [];
    assertThat(PipelineNode.computePipeline([cross3, cross5])).isEqualTo(new Map([
        [cross3.id, "3"],
        [cross5.id, "5"]
    ]));
    assertThat(history).isEqualTo([
        "make 1",
        "make 2",
        "make 3",
        "free 1",
        "free 2",
        "make 5"]);
});

suite.test("runPipelineGraph_race", () => {
    let history = [];
    let maker = e => () => { history.push("make " + e); return e + ""; };
    let free = e => { history.push("free " + e); };

    let race1 = new PipelineNode([], maker(1), free);
    let race2a3a = new PipelineNode([race1], maker("2a3a"), free);
    let race2b = new PipelineNode([race1], maker("2b"), free);
    let race3b = new PipelineNode([race2b], maker("3b"), free);
    let race4 = new PipelineNode([race3b, race2a3a], maker(4), free);
    let race5 = new PipelineNode([race4], maker(5), free);

    assertThat(PipelineNode.computePipeline([race5])).isEqualTo(new Map([
        [race5.id, "5"]
    ]));
    assertThat(history).isEqualTo([
        "make 1",
        "make 2a3a",
        "make 2b",
        "free 1",
        "make 3b",
        "free 2b",
        "make 4",
        "free 3b",
        "free 2a3a",
        "make 5",
        "free 4"]);
});

suite.test("compute_cross", () => {
    let history = [];
    let maker = e => () => { history.push("make " + e); return e + ""; };
    let free = e => { history.push("free " + e); };

    let cross1 = new PipelineNode([], maker(1), free);
    let cross2 = new PipelineNode([], maker(2), free);
    let cross3 = new PipelineNode([cross1, cross2], maker(3), free);
    //noinspection JSUnusedLocalSymbols
    let cross4 = new PipelineNode([cross3], maker(4), free);
    let cross5 = new PipelineNode([cross3], maker(5), free);

    assertThat(cross5.compute()).isEqualTo("5");
    assertThat(history).isEqualTo([
        "make 1",
        "make 2",
        "make 3",
        "free 1",
        "free 2",
        "make 5",
        "free 3"]);
});
