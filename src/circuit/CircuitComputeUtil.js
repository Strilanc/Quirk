import {CircuitEvalArgs} from "src/circuit/CircuitEvalArgs.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {Controls} from "src/circuit/Controls.js"
import {Gate} from "src/circuit/Gate.js"
import {Gates} from "src/gates/AllGates.js"
import {Point} from "src/math/Point.js"
import {Util} from "src/base/Util.js"
import {seq, Seq} from "src/base/Seq.js"
import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"
import {WglTexturePool, WglTextureTrader} from "src/webgl/WglTexturePool.js"

/**
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!string=""} symbol
 * @param {!string=""} name
 * @param {!string=""} blurb
 * @returns {!Gate}
 */
function circuitDefinitionToGate(circuitDefinition, symbol="", name="", blurb="") {
    return Gate.withoutKnownMatrix(symbol, name, blurb).
        withKnownCircuit(circuitDefinition).
        withStableDuration(circuitDefinition.stableDuration()).
        withCustomOperation(args => advanceStateWithCircuit(
            args,
            circuitDefinition.withDisabledReasonsForEmbeddedContext(args.row, args.customContextFromGates),
            false)).
        withHeight(circuitDefinition.numWires).
        withCustomDisableReasonFinder(args => {
            let def = circuitDefinition.withDisabledReasonsForEmbeddedContext(args.outerRow, args.context);
            for (let row = 0; row < def.numWires; row++) {
                for (let col = 0; col < def.columns.length; col++) {
                    let r = def.gateAtLocIsDisabledReason(col, row);
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
 * @param {!CircuitEvalArgs} args
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!boolean} collectStats
 * @returns {!{output:!WglTexture, colQubitDensities:!Array.<!WglTexture>,customStats:!Array, customStatsMap:!Array}}
 */
function advanceStateWithCircuit(args, circuitDefinition, collectStats) {
    // Prep stats collection.
    let colQubitDensities = [];
    let customStats = [];
    let customStatsMap = [];
    let statsCallback = col => statArgs => {
        if (!collectStats) {
            return;
        }

        let {qubitDensities, customGateStats} = _extractStateStatsNeededByCircuitColumn(
            statArgs,
            circuitDefinition,
            col);
        colQubitDensities.push(qubitDensities);
        for (let {row, stat} of customGateStats) {
            //noinspection JSUnusedAssignment
            customStatsMap.push({col, row, out: customStats.length});
            //noinspection JSUnusedAssignment
            customStats.push(stat);
        }
    };

    // Apply each column in the circuit.
    for (let col = 0; col < circuitDefinition.columns.length; col++) {
        _advanceStateWithCircuitDefinitionColumn(
            args,
            circuitDefinition,
            col,
            statsCallback(col));
    }

    if (collectStats) {
        const allWiresMask = (1 << circuitDefinition.numWires) - 1;
        colQubitDensities.push(KetTextureUtil.superpositionToQubitDensities(
            args.stateTrader.currentTexture, Controls.NONE, allWiresMask));
    }

    return {
        output: args.stateTrader.currentTexture,
        colQubitDensities,
        customStats,
        customStatsMap
    };
}

/**
 * @param {!CircuitEvalArgs} args
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @private
 * @returns {!{qubitDensities:!WglTexture, customGateStats:!Array.<!{row:!int,stat:!WglTexture}>}}
 */
function _extractStateStatsNeededByCircuitColumn(
        args,
        circuitDefinition,
        col) {
    // Compute custom stats used by display gates.
    let customGateStats = [];
    for (let row of circuitDefinition.customStatRowsInCol(col)) {
        let statArgs = new CircuitEvalArgs(
            args.time,
            row,
            circuitDefinition.numWires,
            args.controls,
            args.controlsTexture,
            args.stateTrader,
            circuitDefinition.colCustomContextFromGates(col, row));
        let stat = circuitDefinition.columns[col].gates[row].customStatTexturesMaker(statArgs);
        customGateStats.push({row, stat});
    }

    // Compute individual qubit densities, where needed.
    let qubitDensities = KetTextureUtil.superpositionToQubitDensities(
        args.stateTrader.currentTexture,
        args.controls,
        circuitDefinition.colHasSingleQubitDisplayMask(col));

    return {qubitDensities, customGateStats};
}

/**
 * Advances the state trader inside of the given CircuitEvalArgs.
 *
 * @param {!CircuitEvalArgs} args Evaluation arguments, including the row this column starts at (for when the circuit
 *                                we're applying is actually a gate embedded inside an outer circuit).
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @param {!function(!CircuitEvalArgs)} statsCallback
 * @returns {void}
 * @private
 */
function _advanceStateWithCircuitDefinitionColumn(
        args,
        circuitDefinition,
        col,
        statsCallback) {

    let controls = args.controls.and(circuitDefinition.colControls(col).shift(args.row));
    let controlTex = CircuitShaders.controlMask(controls).toBoolTexture(args.wireCount);

    let colContext = Util.mergeMaps(
        args.customContextFromGates,
        circuitDefinition.colCustomContextFromGates(col, args.row));

    let trader = args.stateTrader;
    let aroundArgs = new CircuitEvalArgs(
        args.time,
        args.row,
        args.wireCount,
        args.controls,
        args.controlsTexture,
        trader,
        colContext);
    let mainArgs = new CircuitEvalArgs(
        args.time,
        args.row,
        args.wireCount,
        controls,
        controlTex,
        trader,
        colContext);

    circuitDefinition.applyBeforeOperationsInCol(col, aroundArgs);
    circuitDefinition.applyMainOperationsInCol(col, mainArgs);
    statsCallback(mainArgs);
    circuitDefinition.applyAfterOperationsInCol(col, aroundArgs);

    controlTex.deallocByDepositingInPool("controlTex in _advanceStateWithCircuitDefinitionColumn");
}

export {circuitDefinitionToGate, advanceStateWithCircuit}
