import {CircuitEvalArgs} from "src/circuit/CircuitEvalArgs.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {Controls} from "src/circuit/Controls.js"
import {Gate} from "src/circuit/Gate.js"
import {Gates} from "src/gates/AllGates.js"
import {Point} from "src/math/Point.js"
import {Util} from "src/base/Util.js"
import {seq, Seq} from "src/base/Seq.js"
import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"

/**
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!string} symbol
 * @param {!string} name
 * @param {!string} blurb
 * @returns {!Gate}
 */
function circuitDefinitionToGate(circuitDefinition, symbol, name, blurb) {
    return Gate.withoutKnownMatrix(symbol, name, blurb).
        withKnownCircuit(circuitDefinition).
        withCustomTextureTransform(args => advanceStateWithCircuit(
            args.stateTexture,
            circuitDefinition.withDisabledReasonsForEmbeddedContext(args.row, args.customContextFromGates),
            args.time,
            args.row,
            args.wireCount,
            args.controls,
            args.customContextFromGates,
            false).output).
        withHeight(circuitDefinition.numWires).
        withCustomDisableReasonFinder(args => {
            let def = circuitDefinition.withDisabledReasonsForEmbeddedContext(args.outerRow, args.context);
            for (let row = 0; row < def.numWires; row++) {
                for (let col = 0; col < def.columns.length; col++) {
                    let r = def.gateAtLocIsDisabledReason(new Point(col, row));
                    if (r !== undefined) {
                        return r;
                    }
                    if (def.gateInSlot(col, row) === Gates.Special.Measurement) {
                        return "hidden\nmeasure\nbroken";
                    }
                }
            }
            return undefined;
        });
}

/**
 * @param {!WglTexture} inputState
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!number} time
 * @param {!boolean} collectStats
 * @param {!int} outerStartingRow
 * @param {!int} outerNumWires
 * @param {!Controls} outerControls
 * @param {!Map.<!string, *>} outerContext
 * @returns {!{output:!WglTexture,colQubitDensities:!Array.<!WglTexture>,customStats:!Array,customStatsMap:!Array}}
 */
function advanceStateWithCircuit(
        inputState,
        circuitDefinition,
        time,
        outerStartingRow,
        outerNumWires,
        outerControls,
        outerContext,
        collectStats) {
    const numCols = circuitDefinition.columns.length;

    let colQubitDensities = [];
    let customStats = [];
    let customStatsMap = [];
    let noControlsTex = KetTextureUtil.control(outerNumWires, Controls.NONE);
    let output = KetTextureUtil.aggregateReusingIntermediates(
        inputState,
        Seq.range(numCols),
        (inputState, col) => {
            let controls = outerControls.and(circuitDefinition.colControls(col).shift(outerStartingRow));
            let controlTex = KetTextureUtil.control(outerNumWires, controls);

            let nextState = _advanceStateWithCircuitDefinitionColumn(
                outerStartingRow,
                outerNumWires,
                outerContext,
                inputState,
                circuitDefinition,
                col,
                noControlsTex,
                controls,
                controlTex,
                time);

            if (collectStats) {
                let {qubitDensities, customGateStats} = _extractStateStatsNeededByCircuitColumn(
                    nextState, // We want to show stats after post-selection, so we use 'next' instead of 'input'.
                    circuitDefinition,
                    col,
                    controls,
                    controlTex,
                    time);
                colQubitDensities.push(qubitDensities);
                for (let {row, stat} of customGateStats) {
                    //noinspection JSUnusedAssignment
                    customStatsMap.push({
                        col,
                        row,
                        out: customStats.length
                    });
                    //noinspection JSUnusedAssignment
                    customStats.push(stat);
                }
            }

            KetTextureUtil.doneWithTexture(controlTex, "controlTex in advanceStateWithCircuit");
            return nextState;
        });

    if (collectStats) {
        const allWiresMask = (1 << circuitDefinition.numWires) - 1;
        colQubitDensities.push(KetTextureUtil.superpositionToQubitDensities(output, Controls.NONE, allWiresMask));
    }

    KetTextureUtil.doneWithTexture(noControlsTex, "noControlsTex in advanceStateWithCircuit");
    return {output, colQubitDensities, customStats, customStatsMap};
}

/**
 * @param {!WglTexture} state
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @param {!Controls} controls
 * @param {!WglTexture} controlTex
 * @param {!number} time
 * @private
 * @returns {!{qubitDensities:!WglTexture, customGateStats:!Array.<!{row:!int,stat:!WglTexture}>}}
 */
function _extractStateStatsNeededByCircuitColumn(
        state,
        circuitDefinition,
        col,
        controls,
        controlTex,
        time) {
    // Compute custom stats used by display gates.
    let customGateStats = [];
    for (let row of circuitDefinition.customStatRowsInCol(col)) {
        let statArgs = new CircuitEvalArgs(
            time,
            row,
            circuitDefinition.numWires,
            controls,
            controlTex,
            state,
            circuitDefinition.colCustomContextFromGates(col));
        let pipeline = circuitDefinition.columns[col].gates[row].customStatPipelineMaker(statArgs);
        let stat = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(state, pipeline);
        customGateStats.push({row, stat});
    }

    // Compute individual qubit densities, where needed.
    let qubitDensities = KetTextureUtil.superpositionToQubitDensities(
        state,
        controls,
        circuitDefinition.colHasSingleQubitDisplayMask(col));

    return {qubitDensities, customGateStats};
}

/**
 * @param {!int} outerStartingRow
 * @param {!int} outerWireCount
 * @param {!Map.<!string, *>} outerContext
 * @param {!WglTexture} inputState
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @param {!WglTexture} noControlsTex
 * @param {!Controls} controls
 * @param {!WglTexture} controlsTex
 * @param {!number} time
 * @returns {!WglTexture}
 * @private
 */
function _advanceStateWithCircuitDefinitionColumn(
        outerStartingRow,
        outerWireCount,
        outerContext,
        inputState,
        circuitDefinition,
        col,
        noControlsTex,
        controls,
        controlsTex,
        time) {

    let colContext = Util.mergeMaps(outerContext, circuitDefinition.colCustomContextFromGates(col));

    let setupArgs = new CircuitEvalArgs(
        time,
        undefined,
        outerWireCount,
        Controls.NONE,
        noControlsTex,
        undefined,
        colContext);
    let colArgs = new CircuitEvalArgs(
        time,
        undefined,
        outerWireCount,
        controls,
        controlsTex,
        undefined,
        colContext);

    // Apply 'before column' setup shaders.
    let preparedState = KetTextureUtil.aggregateReusingIntermediates(
        inputState,
        circuitDefinition.getSetupShadersInCol(col, true, outerStartingRow),
        (v, f) => KetTextureUtil.applyCustomShader(f, setupArgs.withStateTexture(v)));

    // Apply gates in column.
    let almostNextState = KetTextureUtil.aggregateWithReuse(
        preparedState,
        circuitDefinition.operationShadersInColAt(col, outerStartingRow),
        (v, f) => KetTextureUtil.applyCustomShader(f, colArgs.withStateTexture(v)));
    let almostAlmostNextState = KetTextureUtil.aggregateWithReuse(
        almostNextState,
        circuitDefinition.textureTransformsInColAt(col, outerStartingRow),
        (v, f) => f(colArgs.withStateTexture(v)));

    // Apply 'after column' un-setup shaders.
    let nextState = KetTextureUtil.aggregateWithReuse(
        almostAlmostNextState,
        circuitDefinition.getSetupShadersInCol(col, false, outerStartingRow),
        (v, f) => KetTextureUtil.applyCustomShader(f, setupArgs.withStateTexture(v)));

    return nextState;
}

export {circuitDefinitionToGate, advanceStateWithCircuit}
