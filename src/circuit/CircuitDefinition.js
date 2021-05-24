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

import {CircuitShaders} from "./CircuitShaders.js"
import {Config} from "../Config.js"
import {Controls} from "./Controls.js"
import {CustomGateSet} from "./CustomGateSet.js"
import {DetailedError} from "../base/DetailedError.js"
import {equate_Maps} from "../base/Equate.js";
import {Gate} from "./Gate.js"
import {GateColumn} from "./GateColumn.js"
import {GateShaders} from "./GateShaders.js"
import {Gates, INITIAL_STATES_TO_GATES} from "../gates/AllGates.js"
import {Point} from "../math/Point.js"
import {seq, Seq} from "../base/Seq.js"
import {Util} from "../base/Util.js"

/**
 * Defines a circuit layout, with wires and columns and gates.
 * Also exposes utility methods for querying useful facts about the layout (e.g. disabled gates).
 *
 * Doesn't compute any amplitudes or probabilities or other possibly-time-dependent stuff. See CircuitStats for that.
 */
class CircuitDefinition {
    /**
     * @param {!int} numWires
     * @param {!Array.<!GateColumn>} columns
     * @param {undefined|!int=} outerRowOffset
     * @param {undefined|!Map.<!string, *>=} outerContext
     * @param {!CustomGateSet} customGateSet
     * @param {!boolean} isNested
     * @param {!Map.<!int, !string>} customInitialValues
     */
    constructor(numWires,
                columns,
                outerRowOffset=0,
                outerContext=new Map(),
                customGateSet=new CustomGateSet(),
                isNested=false,
                customInitialValues=new Map()) {
        if (numWires < 0) {
            throw new DetailedError("Bad numWires", {numWires})
        }
        if (!Array.isArray(columns)) {
            throw new DetailedError("Bad columns", {numWires, columns})
        }
        if (!columns.every(e => e instanceof GateColumn)) {
            throw new DetailedError("Not a GateColumn", {columns})
        }
        if (!columns.every(e => e.gates.length === numWires)) {
            throw new DetailedError("Wrong gate count in a column", {numWires, columns})
        }

        /** @type {!int} */
        this.numWires = numWires;
        /** @type {!Array.<!GateColumn>} */
        this.columns = columns;
        /** @type {!CustomGateSet} */
        this.customGateSet = customGateSet;

        this.outerRowOffset = outerRowOffset;
        this.outerContext = outerContext;
        this.isNested = isNested;
        /** @type {!Map.<!int, !string>} */
        this.customInitialValues = new Map();
        for (let [k, v] of customInitialValues.entries()) {
            if (!Number.isInteger(k) || k < 0) {
                throw new DetailedError('Initial state key out of range.', {customInitialValues, numWires});
            }
            if (k >= this.numWires) {
                continue;
            }
            this.customInitialValues.set(k, v);
        }

        /**
         * @type {!Array.<!Array.<undefined|!string>>}
         * @private
         */
        this._colRowDisabledReason = [];
        /**
         * @type {!Array.<undefined|!int>}
         * @private
         */
        this._measureMasks = [0];
        let mask = 0;
        let prevStickyCtx = new Map();
        for (let col of columns) {
            let {allReasons: rowReasons, stickyCtx} = col.perRowDisabledReasons(
                mask,
                outerRowOffset,
                outerContext,
                prevStickyCtx,
                isNested);
            mask = col.nextMeasureMask(mask, rowReasons);
            this._colRowDisabledReason.push(rowReasons);
            this._measureMasks.push(mask);
            prevStickyCtx = stickyCtx;
        }

        /**
         * @type {!Map.<!string, !{col: !int, row: !int, gate: !Gate}>}
         * @private
         */
        this._gateSlotCoverMap = this._computeGateSlotCoverMap();

        /**
         * @type {!Map.<!string, !Array.<!Map.<!string, *>>>}
         * @private
         */
        this._cachedColumnContexts = new Map();
    }

    /**
     * @returns {!int}
     */
    gateWeight() {
        return seq(this.columns).
            flatMap(e => e.gates).
            filter(e => e !== undefined).
            map(e => e.knownCircuit === undefined ? 1 : e.knownCircuit.gateWeight()).
            sum();
    }

    /**
     * @returns {!boolean}
     */
    hasControls() {
        return !this.columns.every(e => !e.hasControl(-1));
    }

    /**
     * @param {!int} wire
     * @param {!int=} newStateIndex=
     * @returns {!CircuitDefinition}
     */
    withSwitchedInitialStateOn(wire, newStateIndex=undefined) {
        let m = new Map([...this.customInitialValues.entries()]);
        let v = m.get(wire);
        let cycle = [...INITIAL_STATES_TO_GATES.keys()];
        let newVal = cycle[(cycle.indexOf(v) + 1) % cycle.length];
        if (newStateIndex !== undefined) {
            newVal = newStateIndex;
        }
        if (newVal === undefined || newVal === 0) {
            m.delete(wire);
        } else {
            m.set(wire, newVal);
        }
        return this.withInitialStates(m);
    }

    /**
     * @param {!Map.<!int, *>} map
     * @returns {!CircuitDefinition}
     */
    withInitialStates(map) {
        return new CircuitDefinition(
            this.numWires,
            this.columns,
            this.outerRowOffset,
            this.outerContext,
            this.customGateSet,
            this.isNested,
            map);
    }

    /**
     * @returns {!boolean}
     */
    hasOnlyUnitaryGates() {
        return this.columns.every(e => e.indexOfNonUnitaryGate() === undefined);
    }

    /**
     * @returns {!boolean}
     */
    hasNonControlGates() {
        let colHasNonControl = col => !col.gates.every(e => e === undefined || e.isControl());
        return !this.columns.every(e => !colHasNonControl(e));
    }

    /**
     * @param {!int} max
     * @returns {!int}
     */
    countGatesUpTo(max) {
        let n = 0;
        for (let c of this.columns) {
            for (let g of c.gates) {
                if (g !== undefined) {
                    n++;
                    if (n >= max) {
                        return n;
                    }
                }
            }
        }
        return n;
    }

    /**
     * @returns {!Set.<!String>}
     */
    getUnmetContextKeys() {
        let result = new Set();
        for (let c = 0; c < this.columns.length; c++) {
            let col = this.columns[c];
            let ctx = this.colCustomContextFromGates(c, 0);
            for (let gate of col.gates) {
                for (let key of gate === undefined ? [] : gate.getUnmetContextKeys()) {
                    let altKey = key.
                        replace('Input Range ', 'Input Default ').
                        replace('Input NO_DEFAULT Range ', 'Input Range ');
                    if (!ctx.has(key) && !ctx.has(altKey)) {
                        result.add(key);
                    }
                }
            }
        }
        return result;
    }

    /**
     * @param {!int} outerRowOffset
     * @param {!Map.<!string, *>} outerContext
     * @returns {!CircuitDefinition}
     */
    withDisabledReasonsForEmbeddedContext(outerRowOffset, outerContext) {
        return new CircuitDefinition(
            this.numWires,
            this.columns,
            outerRowOffset,
            outerContext,
            this.customGateSet,
            true,
            this.customInitialValues);
    }

    /**
     * @returns {!Map.<!string, !{col: !int, row: !int, gate: !Gate}>}
     * @private
     */
    _computeGateSlotCoverMap() {
        let result = new Map();
        for (let col = 0; col < this.columns.length; col++) {
            for (let row = 0; row < this.numWires; row++) {
                let gate = this.columns[col].gates[row];
                if (gate !== undefined) {
                    for (let i = 0; i < gate.width; i++) {
                        for (let j = 0; j < gate.height; j++) {
                            result.set((col+i)+":"+(row+j), {col, row, gate});
                        }
                    }
                }
            }
        }
        return result;
    }

    /**
     * @returns {!boolean}
     */
    isEmpty() {
        return this.columns.length === 0;
    }

    /**
     * @param {*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof CircuitDefinition &&
            this.numWires === other.numWires &&
            seq(this.columns).isEqualTo(seq(other.columns), Util.CUSTOM_IS_EQUAL_TO_EQUALITY) &&
            equate_Maps(this.customInitialValues, other.customInitialValues);
    }

    /**
     * @returns {!string}
     */
    toString() {
        let wire = n => "─".repeat(n);
        let wireAround = (n, s) =>
            wire(Math.floor(n - s.length)/2) +
            s +
            wire(Math.ceil(n - s.length)/2);
        let colWidths = Seq.range(this.columns.length).
            map(c => seq(this.columns[c].gates).map(e => e === undefined ? 0 : e.serializedId.length).max()).
            toArray();
        return `CircuitDefinition (${this.numWires} wires, ${this.columns.length} cols):\n\t` +
            Seq.range(this.numWires).
                map(r => wire(1) + Seq.range(this.columns.length).
                    map(c => {
                        let g = this.columns[c].gates[r];
                        let label = g === undefined ? "" : g.serializedId;
                        return wireAround(colWidths[c], label);
                    }).
                    join(wire(1)) + wire(1)).
                join('\n\t');
    }

    /**
     * This mainly exists for writing tests that are understandable.
     * @param {!string} diagram
     * @param {!Map.<!string, !Gate|!{ofSize: !function(!int) : !Gate}>} gateMap
     * @returns {!CircuitDefinition}
     */
    static fromTextDiagram(gateMap, diagram) {
        let lines = seq(diagram.split('\n')).map(e => e.trim()).filter(e => e !== '').toArray();
        if (seq(lines.map(e => e.length)).distinct().count() > 1) {
            throw new DetailedError("Uneven diagram", {diagram});
        }

        let rowCount = lines.length;
        let colCount = lines.length > 0 ? lines[0].length : 0;

        let spanAt = (col, row) => {
            for (let d = 1; row + d < lines.length; d++) {
                if (gateMap.get(lines[row + d][col]) !== null) {
                    return d;
                }
            }
            return lines.length - row;
        };

        return new CircuitDefinition(
            rowCount,
            Seq.range(colCount).
                map(col => new GateColumn(seq(lines).mapWithIndex((line, row) => {
                    let char = line[col];
                    if (!gateMap.has(char)) {
                        throw new DetailedError("Unspecified gate", {char});
                    }
                    let gateOrFamily = gateMap.get(char);
                    if (gateOrFamily === null || gateOrFamily === undefined) {
                        return undefined;
                    }
                    if (gateOrFamily.hasOwnProperty('ofSize')) {
                        return gateOrFamily.ofSize(spanAt(col, row));
                    }
                    if (gateOrFamily instanceof Gate) {
                        return gateOrFamily;
                    }

                    throw new DetailedError("Not a gate", gateOrFamily);
                }).toArray())).
                toArray());
    }

    /**
     * @returns {Infinity|!number}
     */
    stableDuration() {
        return seq(this.columns).
            flatMap(c => c.gates).
            filter(g => g !== undefined).
            map(g => g.stableDuration()).
            min(Infinity);
    }

    /**
     * Returns a munged compact text representation of the circuit.
     *
     * The text isn't intended to be particularly understandable, but it should vaguely reflect or at least
     * distinguish the circuit from others when skimming a list of hashes (e.g. links in browser history).
     *
     * @returns {!string}
     */
    readableHash() {
        let allGates = seq(this.columns)
            .flatMap(e => e.gates)
            .filter(e => e !== undefined)
            .map(e => e.symbol)
            .toArray();
        if (allGates.length === 0) {
            return Config.EMPTY_CIRCUIT_TITLE;
        }
        let allGatesString = `${this.numWires} wires, ${allGates.length} ops, ${allGates.join("").split("^").join("")}`;
        if (allGatesString.length <= 40) {
            return allGatesString;
        }
        return allGatesString.substring(0, 40) + `…`;
    }

    /**
     * @param {!Array.<!GateColumn>} cols
     * @returns {!CircuitDefinition}
     */
    withColumns(cols) {
        return new CircuitDefinition(
            this.numWires,
            cols,
            this.outerRowOffset,
            this.outerContext,
            this.customGateSet,
            false,
            this.customInitialValues);
    }

    /**
     * @returns {!Set.<!int>}
     * @private
     */
    _usedColumns() {
        let usedCols = new Set();
        for (let col = 0; col < this.columns.length; col++) {
            for (let i = 0; i < this.columns[col].maximumGateWidth(); i++) {
                usedCols.add(col+i);
            }
        }
        return usedCols;
    }

    /**
     * @param {!int} col
     * @param {!int} row
     * @param {!int} width
     * @param {!int} height
     * @returns {undefined|!{col: !int, row: !int}}
     * @private
     */
    _findWidthWiseOverlapInRect(col, row, width, height) {
        for (let i = 1; i < width && col + i < this.columns.length; i++) {
            for (let j = 0; j < height; j++) {
                let otherGate = this.findGateCoveringSlot(col+i, row+j);
                if (otherGate === undefined || otherGate.col === col) {
                    continue;
                }
                return {col: otherGate.col, row: otherGate.row};
            }
        }
        return undefined;
    }

    /**
     * @returns {!CircuitDefinition}
     */
    withWidthOverlapsFixed() {
        let newCols = [];
        for (let col = 0; col < this.columns.length; col++) {
            let paddingRequired = Seq.range(this.numWires).map(row => {
                let gate = this.columns[col].gates[row];
                if (gate === undefined) {
                    return 0;
                }
                let f = this._findWidthWiseOverlapInRect(col, row, gate.width, gate.height);
                if (f === undefined) {
                    return 0;
                }
                return gate.width - (f.col - col);
            }).max(0);

            newCols.push(this.columns[col]);
            for (let i = 0; i < paddingRequired; i++) {
                newCols.push(GateColumn.empty(this.numWires));
            }
        }

        return this.withColumns(newCols);
    }

    /**
     * @param {!int} col
     * @returns {!Set.<!int>}
     * @private
     */
    _findHeightWiseOverlapsInCol(col) {
        let pushedGates = new Set();
        let h = 0;
        for (let row = 0; row < this.numWires; row++) {
            h -= 1;
            let gate = this.gateInSlot(col, row);
            if (gate !== undefined) {
                if (h > 0) {
                    pushedGates.add(row);
                }
                h = Math.max(h, gate.height);
            }
        }
        return pushedGates;
    }

    /**
     * @param {!int} recurseLimit If a bug causes an infinite height-overlap-fixing loop, this will save us.
     * @returns {!CircuitDefinition}
     */
    withHeightOverlapsFixed(recurseLimit=5) {
        let newCols = [];
        for (let col = 0; col < this.columns.length; col++) {
            let pushedGateIndexes = this._findHeightWiseOverlapsInCol(col);
            if (pushedGateIndexes.size === 0) {
                newCols.push(this.columns[col]);
                continue;
            }

            let keptGates = seq(this.columns[col].gates).
                mapWithIndex((g, row) => pushedGateIndexes.has(row) ? undefined : g).
                toArray();
            let pushedGates = seq(this.columns[col].gates).
                mapWithIndex((g, row) => g !== undefined && (g.isControl() || pushedGateIndexes.has(row)) ?
                    g :
                    undefined).
                toArray();

            newCols.push(new GateColumn(keptGates));
            newCols.push(new GateColumn(pushedGates));
        }

        let result = this.withColumns(newCols);
        if (newCols.length > this.columns.length && recurseLimit > 0) {
            // The pushed gates may still contain more height overlaps.
            result = result.withHeightOverlapsFixed(recurseLimit-1);
        }
        return result;
    }

    /**
     * @param {!int=0} extra
     * @returns {!CircuitDefinition}
     */
    withTrailingSpacersIncluded(extra=0) {
        return this.withColumns([
            ...this.columns,
            ...new Array(Math.max(0, this.minimumRequiredColCount() + extra - this.columns.length)).
                fill(GateColumn.empty(this.numWires))
        ]);
    }

    /**
     * @returns {!CircuitDefinition}
     */
    trimEmptyColumnsAtEndIgnoringGateWidths() {
        for (let n = this.columns.length; ; n--) {
            if (n === 0 || !this.columns[n-1].isEmpty()) {
                return this.withColumns(this.columns.slice(0, n));
            }
        }
    }

    /**
     * @returns {!CircuitDefinition}
     */
    withUncoveredColumnsRemoved() {
        let used = this._usedColumns();
        return new CircuitDefinition(
            this.numWires,
            seq(this.columns).filterWithIndex((e, i) => used.has(i)).toArray(),
            this.outerRowOffset,
            this.outerContext,
            this.customGateSet,
            false,
            this.customInitialValues);
    }

    /**
     * @param {!int} {newWireCount}
     * @returns {!CircuitDefinition}
     */
    withWireCount(newWireCount) {
        if (newWireCount === this.numWires) {
            return this;
        }
        return new CircuitDefinition(
            newWireCount,
            this.columns.map(c => new GateColumn([
                ...c.gates.slice(0, newWireCount),
                ...new Array(Math.max(0, newWireCount - c.gates.length)).fill(undefined)
            ])),
            this.outerRowOffset,
            this.outerContext,
            this.customGateSet,
            false,
            this.customInitialValues);
    }

    /**
     * @returns {!int} The minimum number of wires needed to hold the gates in the circuit, accounting for their height
     * and assuming the gate positions are fixed (i.e. wires can only be added or removed from the bottom).
     */
    minimumRequiredWireCount() {
        let best = 1;
        for (let c of this.columns) {
            best = Math.max(best, c.minimumRequiredWireCount());
        }
        for (let usedWire of this.customInitialValues.keys()) {
            best = Math.max(best, usedWire + 1);
        }
        return best;
    }

    /**
     * @returns {!CircuitDefinition}
     */
    withMinimumWireCount() {
        return this.withWireCount(this.minimumRequiredWireCount());
    }

    /**
     * @returns {!int} The minimum number of columns needed to hold the gates in the circuit, accounting for their width
     * and assuming the gate positions are fixed (i.e. columns can only be added or removed from the right).
     */
    minimumRequiredColCount() {
        let best = 0;
        for (let col = 0; col < this.columns.length; col++) {
            best = Math.max(best, this.columns[col].maximumGateWidth() + col);
        }
        return best;
    }

    /**
     * @param {!int} col
     * @returns {!int}
     */
    colIsMeasuredMask(col) {
        if (col < 0) {
            return 0;
        }
        return this._measureMasks[Math.min(col, this.columns.length)];
    }

    /**
     * @param {!int} col
     * @returns {!int}
     */
    colDesiredSingleQubitStatsMask(col) {
        if (col < 0 || col >= this.columns.length) {
            return 0;
        }
        let c = this.columns[col];
        let total = 0;
        for (let row = 0; row < c.gates.length; row++) {
            if (c.gates[row] !== undefined &&
                    c.gates[row].isSingleQubitDisplay &&
                    this.gateAtLocIsDisabledReason(col, row) === undefined) {
                total |= 1 << row;
            }
        }

        return total;
    }

    /**
     * @param {!int} col
     * @param {!int} outerRowOffset
     * @returns {!Map.<!string, *>}
     */
    colCustomContextFromGates(col, outerRowOffset) {
        if (col < 0 || col >= this.columns.length) {
            return new Map();
        }
        let key = "" + outerRowOffset;
        let result = this._cachedColumnContexts.get(key);
        if (result === undefined) {
            result = this._uncached_customContextFromGates(outerRowOffset);
            this._cachedColumnContexts.set(key, result);
        }
        return result[col];
    }

    /**
     * @param {!int} outerRowOffset
     * @returns {!Array.<!Map.<!string, *>>}
     */
    _uncached_customContextFromGates(outerRowOffset) {
        let results = [];
        let stickyCtx = new Map();
        for (let col = 0; col < this.columns.length; col++) {
            let ctx = new Map(stickyCtx);
            let c = this.columns[col];
            for (let row = 0; row < c.gates.length; row++) {
                let g = c.gates[row];
                if (g === undefined || this.gateAtLocIsDisabledReason(col, row) !== undefined) {
                    continue;
                }

                for (let {key, val} of g.customColumnContextProvider(outerRowOffset + row, g)) {
                    //noinspection JSUnusedAssignment
                    ctx.set(key, val);
                    if (!g.isContextTemporary) {
                        stickyCtx.set(key, val);
                    }
                }
            }
            results.push(ctx);
        }
        return results;
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locIsMeasured(pt) {
        let row = pt.y;
        if (row < 0 || row >= this.numWires) {
            return false;
        }
        return (this.colIsMeasuredMask(pt.x) & (1 << row)) !== 0;
    }

    /**
     * @param {!Point} pt
     * @returns {undefined|boolean}
     */
    locClassifyMeasuredIncludingGateExtension(pt) {
        let row = pt.y;
        if (row < 0 || row >= this.numWires) {
            return false;
        }
        let gate = this.columns[pt.x].gates[row];
        let h = gate === undefined ? 1 : gate.height;
        let r = (this.colIsMeasuredMask(pt.x) >> row) & ((1 << h) - 1);
        return r === 0 ? false : r === (1 << h) - 1 ? true : undefined;
    }

    /**
     * A gate is only "in" the slot at its top left.
     * It "covers" any other slots underneath it.
     * @param {!int} col
     * @param {!int} row
     * @returns {undefined|!Gate}
     */
    gateInSlot(col, row) {
        if (col < 0 || col >= this.columns.length || row < 0 || row >= this.numWires) {
            return undefined;
        }
        let gate = this.columns[col].gates[row];
        return gate === undefined ? undefined : gate;
    }

    /**
     * A slot is covered when a gate is in it or extends over it.
     * @param {!int} col
     * @param {!int} row
     * @returns {undefined|!{col: !int, row: !int, gate: !Gate}}
     */
    findGateCoveringSlot(col, row) {
        let key = col+":"+row;
        if (!this._gateSlotCoverMap.has(key)) {
            return undefined;
        }
        return this._gateSlotCoverMap.get(key);
    }

    /**
     * @param {!Point} pt
     * @returns {!boolean}
     */
    locIsControlWireStarter(pt) {
        let gate = this.gateInSlot(pt.x, pt.y);
        return gate !== undefined && gate.isControlWireSource;
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locStartsSingleControlWire(pt) {
        return this.locIsControlWireStarter(pt) &&
            this.locClassifyMeasuredIncludingGateExtension(pt) !== true &&
            this.gateAtLocIsDisabledReason(pt.x, pt.y) === undefined;
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locStartsDoubleControlWire(pt) {
        return this.locIsControlWireStarter(pt) &&
            this.locClassifyMeasuredIncludingGateExtension(pt) !== false &&
            this.gateAtLocIsDisabledReason(pt.x, pt.y) === undefined;
    }

    /**
     * @param {int} col
     * @returns {undefined|![!int, !int]}
     */
    colGetEnabledSwapGate(col) {
        if (col < 0 || col >= this.columns.length) {
            return undefined;
        }
        let locs = [];
        for (let row = 0; row < this.numWires; row++) {
            if (this.gateInSlot(col, row) === Gates.Special.SwapHalf) {
                if (this.gateAtLocIsDisabledReason(col, row) !== undefined) {
                    return undefined;
                }
                locs.push(row);
            }
        }
        if (locs.length !== 2) {
            return undefined;
        }
        return locs;
    }

    /**
     * @param {!Point} pt
     * @param {!string} key
     * @returns {!boolean}
     */
    locProvidesStat(pt, key) {
        let g = this.gateInSlot(pt.x, pt.y);
        return g !== undefined && !g.customColumnContextProvider(0, g).every(e => e.key !== key);
    }

    /**
     * @param {!Point} pt
     * @param {!string} key
     * @returns {!boolean}
     */
    locNeedsStat(pt, key) {
        let g = this.gateInSlot(pt.x, pt.y);
        return g !== undefined && g.getUnmetContextKeys().has(key);
    }

    /**
     * @param {!Point} pt
     * @returns {!boolean}
     */
    locHasControllableGate(pt) {
        let g = this.gateInSlot(pt.x, pt.y);
        return g !== undefined && g.interestedInControls;
    }

    /**
     * @param {!int} col
     * @returns {!boolean}
     */
    colHasControls(col) {
        if (col < 0 || col >= this.columns.length) {
            return false;
        }
        return this.columns[col].hasControl();
    }

    /**
     * @param {!int} col
     * @returns {boolean}
     */
    colHasSingleWireControl(col) {
        if (col < 0 || col >= this.columns.length) {
            return false;
        }
        return this.columns[col].hasCoherentControl(this._measureMasks[col]);
    }

    /**
     * @param {!int} col
     * @returns {boolean}
     */
    colHasDoubleWireControl(col) {
        if (col < 0 || col >= this.columns.length) {
            return false;
        }
        return this.columns[col].hasMeasuredControl(this._measureMasks[col]);
    }


    /**
     * @params {!int} col
     * @returns {!Controls}
     */
    colControls(col) {
        if (col < 0 || col >= this.columns.length) {
            return Controls.NONE;
        }
        let column = this.columns[col];
        let includeMask = 0;
        let desireMask = 0;
        let parityMask = 0;
        for (let i = 0; i < column.gates.length; i++) {
            let gate = column.gates[i];
            if (gate !== undefined && this.gateAtLocIsDisabledReason(col, i) === undefined) {
                let bit = gate.controlBit();
                if (bit === 'parity') {
                    parityMask |= 1 << i;
                } else if (bit !== undefined) {
                    includeMask |= 1 << i;
                    if (bit) {
                        desireMask |= 1 << i;
                    }
                }
            }
        }
        if (parityMask !== 0) {
            let parityBit = parityMask & ~(parityMask - 1);
            desireMask |= parityBit;
            includeMask |= parityBit;
        }
        return new Controls(includeMask, desireMask, parityMask);
    }

    /**
     * @param {!int} col
     * @param {!int} row
     * @returns {undefined|!string}
     */
    gateAtLocIsDisabledReason(col, row) {
        if (col < 0 || row < 0 || col >= this._colRowDisabledReason.length || row >= this.numWires) {
            return undefined;
        }
        return this._colRowDisabledReason[col][row];
    }

    /**
     * @param {!CircuitEvalContext} ctx
     * @return {void}
     */
    applyInitialStateOperations(ctx) {
        for (let wire = 0; wire < this.numWires; wire++) {
            let state = this.customInitialValues.get(wire);
            if (!INITIAL_STATES_TO_GATES.has(state)) {
                throw new DetailedError('Unrecognized initial state.', {state});
            }
            for (let gate of INITIAL_STATES_TO_GATES.get(state)) {
                GateShaders.applyMatrixOperation(ctx.withRow(ctx.row + wire), gate.knownMatrixAt(ctx.time))
            }
        }
    }

    /**
     * @param {!int} colIndex
     * @param {!CircuitEvalContext} ctx
     * @return {void}
     */
    applyMainOperationsInCol(colIndex, ctx) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return;
        }

        this._applyOpsInCol(colIndex, ctx, gate => {
            if (gate.definitelyHasNoEffect() || gate === Gates.Special.SwapHalf) {
                return undefined;
            }

            if (gate.customOperation !== undefined) {
                return gate.customOperation;
            }

            return ctx => GateShaders.applyMatrixOperation(ctx, gate.knownMatrixAt(ctx.time));
        });

        let swapRows = this.colGetEnabledSwapGate(colIndex);
        if (swapRows !== undefined) {
            let [i, j] = swapRows;
            ctx.applyOperation(CircuitShaders.swap(ctx.withRow(i + ctx.row), j + ctx.row));
        }
    }

    /**
     * @param {!int} colIndex
     * @param {!CircuitEvalContext} ctx
     * @return {void}
     */
    applyBeforeOperationsInCol(colIndex, ctx) {
        this._applyOpsInCol(colIndex, ctx, g => g.customBeforeOperation);
    }

    /**
     * @param {!int} colIndex
     * @param {!CircuitEvalContext} ctx
     * @return {void}
     */
    applyAfterOperationsInCol(colIndex, ctx) {
        this._applyOpsInCol(colIndex, ctx, g => g.customAfterOperation);
    }

    /**
     * @param {!int} colIndex
     * @param {!CircuitEvalContext} ctx
     * @param {!function(!Gate) : !function(!CircuitEvalContext)} opGetter
     * @private
     */
    _applyOpsInCol(colIndex, ctx, opGetter) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return;
        }
        let col = this.columns[colIndex];

        for (let row = 0; row < this.numWires; row++) {
            let gate = col.gates[row];
            if (gate === undefined || this.gateAtLocIsDisabledReason(colIndex, row) !== undefined) {
                continue;
            }

            let op = opGetter(gate);
            if (op !== undefined) {
                op(ctx.withRow(ctx.row + row));
            }
        }
    }

    /**
     * @param {!int} colIndex
     * @returns {!Array.<!int>}
     */
    customStatRowsInCol(colIndex) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return [];
        }

        let col = this.columns[colIndex];
        let result = [];
        for (let row = 0; row < col.gates.length; row++) {
            if (col.gates[row] !== undefined &&
                    col.gates[row].customStatTexturesMaker !== undefined &&
                    this.gateAtLocIsDisabledReason(colIndex, row) === undefined) {
                result.push(row);
            }
        }
        return result;
    }

    /**
     * @param {!int} col
     * @param {!int} row
     * @param {!int} height
     * @returns {!boolean}
     */
    isSlotRectCoveredByGateInSameColumn(col, row, height) {
        for (let j = 0; j < height; j++) {
            let f = this.findGateCoveringSlot(col, row+j);
            if (f !== undefined && f.col === col) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {!Gate} gate
     * @returns {!CircuitDefinition}
     */
    withCustomGate(gate) {
        return new CircuitDefinition(
            this.numWires,
            this.columns,
            this.outerRowOffset,
            this.outerContext,
            this.customGateSet.withGate(gate),
            false,
            this.customInitialValues);
    }

    /**
     * @param {!int} columnIndex
     * @returns {!Array.<!{first: !int, last: !int, measured: !boolean}>}
     */
    controlLinesRanges(columnIndex) {
        let col = this.columns[columnIndex];
        let n = col.gates.length;

        let swapRows = this.colGetEnabledSwapGate(columnIndex);

        let pt = i => new Point(columnIndex, i);
        let hasControllable = i => this.locHasControllableGate(pt(i));
        let hasCoherentControl = i => this.locStartsSingleControlWire(pt(i));
        let hasMeasuredControl = i => this.locStartsDoubleControlWire(pt(i));
        let hasSwap = i => swapRows !== undefined && swapRows.indexOf(i) !== -1;
        let coversCoherentWire = i => this.locClassifyMeasuredIncludingGateExtension(pt(i)) !== true;
        let coversMeasuredWire = i => this.locClassifyMeasuredIncludingGateExtension(pt(i)) !== false;

        // Control connections.
        let result = [
            srcDstMatchInRange(n, hasSwap, hasSwap, false),
            srcDstMatchInRange(n, hasControllable, hasCoherentControl, false),
            srcDstMatchInRange(n, hasControllable, hasMeasuredControl, true),
        ];

        // Input->Output gate connections.
        for (let letter of Gates.InputGates.Letters) {
            let key = `Input Range ${letter}`;
            let altInKey = `Input Default ${letter}`;
            let altOutKey = `Input NO_DEFAULT Range ${letter}`;
            let isInput = i => this.locProvidesStat(pt(i), key) || this.locProvidesStat(pt(i), altInKey);
            let isOutput = i => this.locNeedsStat(pt(i), key) || this.locNeedsStat(pt(i), altOutKey);
            result.push(
                srcDstMatchInRange(n, i => isInput(i) && coversCoherentWire(i), isOutput, false),
                srcDstMatchInRange(n, i => isInput(i) && coversMeasuredWire(i), isOutput, true)
            );
        }

        return result.filter(e => e !== undefined);
    }
}


/**
 * @param {!int} rangeLen
 * @param {!function(!int) : !boolean} srcPredicate
 * @param {!function(!int) : !boolean} dstPredicate
 * @param {!boolean} measured
 * @returns {undefined|!{first:!int, last:!int, measured:!boolean}}
 * @private
 */
function srcDstMatchInRange(rangeLen, srcPredicate, dstPredicate, measured) {
    let [src1, src2] = firstLastMatchInRange(rangeLen, srcPredicate);
    let [dst1, dst2] = firstLastMatchInRange(rangeLen, dstPredicate);
    if (dst1 === undefined || src1 === undefined) {
        return undefined;
    }
    return {
        first: Math.min(src1, dst1),
        last: Math.max(src2, dst2),
        measured: measured
    };
}

/**
 * @param {!int} rangeLen
 * @param {!function(!int): !boolean} predicate
 * @returns {!Array.<undefined|!int>}
 */
function firstLastMatchInRange(rangeLen, predicate){
    let first = undefined;
    let last = undefined;
    for (let i = 0; i < rangeLen; i++) {
        if (predicate(i)) {
            if (first === undefined) {
                first = i;
            }
            last = i;
        }
    }
    return [first, last];
}

CircuitDefinition.EMPTY = new CircuitDefinition(0, []);

export {CircuitDefinition}
