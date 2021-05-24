/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CircuitEvalContext} from "./CircuitEvalContext.js"
import {CircuitShaders} from "./CircuitShaders.js"
import {DetailedError} from "../base/DetailedError.js"
import {KetTextureUtil} from "./KetTextureUtil.js"
import {Controls} from "./Controls.js"
import {GateBuilder} from "./Gate.js"
import {Gates} from "../gates/AllGates.js"
import {Util} from "../base/Util.js"

/**
 * @param {!GateBuilder} builder
 * @param {!CircuitDefinition} circuitDefinition
 * @returns {!GateBuilder}
 */
function setGateBuilderEffectToCircuit(builder, circuitDefinition) {
    return builder.
        setActualEffectToUpdateFunc(ctx => advanceStateWithCircuit(
            ctx,
            circuitDefinition.withDisabledReasonsForEmbeddedContext(ctx.row, ctx.customContextFromGates),
            false)).
        setKnownEffectToCircuit(circuitDefinition).
        setExtraDisableReasonFinder(args => {
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
 * @param {!CircuitEvalContext} ctx
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!boolean} collectStats
 * @returns {!{
 *     colQubitDensities: !Array.<!WglTexture>,
 *     colNorms: !Array.<!WglTexture>,
 *     customStats: !Array.<*>,
 *     customStatsMap: !Array.<*>
 * }}
 */
function advanceStateWithCircuit(ctx, circuitDefinition, collectStats) {
    // Prep stats collection.
    let colQubitDensities = [];
    let customStats = [];
    let colNorms = [];
    let customStatsMap = [];
    let statsCallback = col => statArgs => {
        if (!collectStats) {
            return;
        }

        let {qubitDensities, norm, customGateStats} = _extractStateStatsNeededByCircuitColumn(
            statArgs,
            circuitDefinition,
            col);
        colQubitDensities.push(qubitDensities);
        colNorms.push(norm);
        for (let {row, stat} of customGateStats) {
            customStatsMap.push({col, row, out: customStats.length});
            customStats.push(stat);
        }
    };

    circuitDefinition.applyInitialStateOperations(ctx);

    // Apply each column in the circuit.
    for (let col = 0; col < circuitDefinition.columns.length; col++) {
        _advanceStateWithCircuitDefinitionColumn(
            ctx,
            circuitDefinition,
            col,
            statsCallback(col));
    }

    if (collectStats) {
        const allWiresMask = (1 << circuitDefinition.numWires) - 1;
        colQubitDensities.push(KetTextureUtil.superpositionToQubitDensities(
            ctx.stateTrader.currentTexture, Controls.NONE, allWiresMask));
    }

    return {
        colQubitDensities,
        colNorms,
        customStats,
        customStatsMap
    };
}

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @private
 * @returns {!{
 *     qubitDensities: !WglTexture,
 *     norm: !WglTexture,
 *     customGateStats: !Array.<!{row: !int, stat: !WglTexture}>
 * }}
 */
function _extractStateStatsNeededByCircuitColumn(
        ctx,
        circuitDefinition,
        col) {
    // Compute custom stats used by display gates.
    let customGateStats = [];
    for (let row of circuitDefinition.customStatRowsInCol(col)) {
        let statCtx = new CircuitEvalContext(
            ctx.time,
            row,
            circuitDefinition.numWires,
            ctx.controls,
            ctx.controlsTexture,
            ctx.controls,
            ctx.stateTrader,
            Util.mergeMaps(
                ctx.customContextFromGates,
                circuitDefinition.colCustomContextFromGates(col, row)));
        let stat = circuitDefinition.columns[col].gates[row].customStatTexturesMaker(statCtx);
        customGateStats.push({row, stat});
    }

    // Compute individual qubit densities, where needed.
    let qubitDensities = KetTextureUtil.superpositionToQubitDensities(
        ctx.stateTrader.currentTexture,
        ctx.controls,
        circuitDefinition.colDesiredSingleQubitStatsMask(col));

    // Compute survival rate.
    let normMayHaveChanged = circuitDefinition.columns[col].indexOfNonUnitaryGate() !== undefined;
    let norm = KetTextureUtil.superpositionToNorm(ctx.stateTrader.currentTexture, normMayHaveChanged);

    return {qubitDensities, norm, customGateStats};
}

/**
 * Advances the state trader inside of the given CircuitEvalContext.
 *
 * @param {!CircuitEvalContext} ctx Evaluation arguments, including the row this column starts at (for when the circuit
 *                                  we're applying is actually a gate embedded inside an outer circuit).
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @param {!function(!CircuitEvalContext)} statsCallback
 * @returns {void}
 * @private
 */
function _advanceStateWithCircuitDefinitionColumn(
        ctx,
        circuitDefinition,
        col,
        statsCallback) {

    let controls = ctx.controls.and(circuitDefinition.colControls(col).shift(ctx.row));
    let controlTex = CircuitShaders.controlMask(controls).toBoolTexture(ctx.wireCount);

    let colContext = Util.mergeMaps(
        ctx.customContextFromGates,
        circuitDefinition.colCustomContextFromGates(col, ctx.row));

    let trader = ctx.stateTrader;
    let aroundCtx = new CircuitEvalContext(
        ctx.time,
        ctx.row,
        ctx.wireCount,
        ctx.controls,
        ctx.controlsTexture,
        controls,
        trader,
        colContext);
    let mainCtx = new CircuitEvalContext(
        ctx.time,
        ctx.row,
        ctx.wireCount,
        controls,
        controlTex,
        controls,
        trader,
        colContext);

    circuitDefinition.applyBeforeOperationsInCol(col, aroundCtx);
    circuitDefinition.applyMainOperationsInCol(col, mainCtx);
    statsCallback(mainCtx);
    circuitDefinition.applyAfterOperationsInCol(col, aroundCtx);

    controlTex.deallocByDepositingInPool("controlTex in _advanceStateWithCircuitDefinitionColumn");
}

export {setGateBuilderEffectToCircuit, advanceStateWithCircuit}
