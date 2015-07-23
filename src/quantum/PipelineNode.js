import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"
import Shades from "src/quantum/Shades.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import describe from "src/base/Describe.js"

let nextUniqueId = 0;

/**
 * An operation with dependencies and dependents, that can be computed while automatically managing resources via a
 * graph exploration.
 */
class PipelineNode {
    /**
     * @param {!(!PipelineNode[])} inputNodes Nodes whose results are needed to compute this node's result.
     * @param {!function(!(*[])) : T} operation Computes this node's result, when given the input nodes' results.
     * @param {!function(T)=} cleanupIntermediate Cleans up this node's result when it's only used as an intermediary.
     *
     * @template T
     */
    constructor(inputNodes, operation, cleanupIntermediate = () => {}) {
        Util.need(inputNodes.every(e => e instanceof PipelineNode), "inputNodes.every(e => e instanceof PipelineNode)");
        /**
         * @type {!int}
         */
        this.id = nextUniqueId++;
        /**
         * @type {!(!PipelineNode[])}
         */
        this.inputNodes = inputNodes;
        /**
         * @type {!function(!(*[])) : T}
         * @template T
         */
        this.operation = operation;
        /**
         * @type {!function(T)} cleanup
         * @template T
         */
        this.cleanup = cleanupIntermediate;
    }

    isEqualTo(other) {
        return this === other;
    }

    toString() {
        return `PipelineNode #${this.id}`;
    }

    /**
     * @typedef {!{
     *   pipelineNode: !PipelineNode,
     *   inEdgeIds: !(!int[]),
     *   outEdgeIds: !(!int[]),
     *   unpreparedInputCount: !int,
     *   unsatisfiedOutputCount: !int,
     *   cachedResult: !WglTexture|undefined
     * }} PipelineGraphNode
     */

    /**
     * @param {!(!PipelineNode[])} outputs
     * @returns {!Map.<!int, !PipelineGraphNode>}
     * @VisibleForTesting
     */
    static prepareGraph(outputs) {
        let pipelineTextures = new Seq(outputs).breadthFirstSearch(e => e.inputNodes, e => e.id).toArray();
        let backwardEdges = new Seq(pipelineTextures).toMap(
            e => e.id,
            e => new Seq(e.inputNodes).
                map(e2 => e2.id).
                distinct().
                toArray());
        let forwardEdges = Util.reverseGroupMap(backwardEdges, true);

        return new Seq(pipelineTextures).toMap(
            e => e.id,
            e => {
                let pipelineNode = e;
                let outEdgeIds = forwardEdges.get(pipelineNode.id);
                let inEdgeIds = backwardEdges.get(pipelineNode.id);
                return {
                    pipelineNode,
                    outEdgeIds,
                    inEdgeIds,
                    unpreparedInputCount: inEdgeIds.length,
                    unsatisfiedOutputCount: outEdgeIds.length,
                    cachedResult: undefined
                };
            });
    }

    /**
     * @param {!(!PipelineNode[])} nodesWithDesiredOutputs
     * @returns {!(*[])}
     */
    static computePipeline(nodesWithDesiredOutputs) {
        let outputIdSet = new Seq(nodesWithDesiredOutputs).map(e => e.id).toSet();
        let graph = PipelineNode.prepareGraph(nodesWithDesiredOutputs);
        let initialLeafIds = new Seq(graph).filter(e => e[1].unpreparedInputCount === 0).map(e => e[0]);
        let result = new Map();

        let computation = initialLeafIds.breadthFirstSearch(leafId => {
            let node = graph.get(leafId);
            let inputValues = node.inEdgeIds.map(e => graph.get(e).cachedResult);
            node.cachedResult = node.pipelineNode.operation(inputValues);

            // Free input textures that are no longer needed, now that this texture was computed with them.
            for (let inputId of node.inEdgeIds) {
                let inputNode = graph.get(inputId);
                inputNode.unsatisfiedOutputCount--;
                if (inputNode.unsatisfiedOutputCount === 0) {
                    if (!outputIdSet.has(inputNode.pipelineNode.id)) {
                        inputNode.pipelineNode.cleanup(inputNode.cachedResult);
                    }
                    inputNode.cachedResult = undefined;
                }
            }

            // Build up outputs.
            if (outputIdSet.has(node.pipelineNode.id)) {
                result.set(node.pipelineNode.id, node.cachedResult);
            }

            // Cleanup output textures that are not needed (... how?).
            if (node.unsatisfiedOutputCount === 0) {
                if (!outputIdSet.has(node.pipelineNode.id)) {
                    node.pipelineNode.cleanup(node.cachedResult);
                }
                node.cachedResult = undefined;
            }

            // Schedule textures that have all their inputs available, now that this texture is computed, to go next.
            return node.outEdgeIds.filter(outId => {
                let outputNode = graph.get(outId);
                outputNode.unpreparedInputCount -= 1;
                return outputNode.unpreparedInputCount === 0;
            });
        });

        // Compute
        //noinspection JSUnusedLocalSymbols
        for (let _ of computation){}

        return new Seq(nodesWithDesiredOutputs).map(e => result.get(e.id)).toArray();
    }

    /**
     * @returns {T}
     * @template T
     */
    compute() {
        return PipelineNode.computePipeline([this])[0];
    }
}

export default PipelineNode;
