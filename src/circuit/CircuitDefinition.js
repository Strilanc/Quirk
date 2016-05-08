import CircuitShaders from "src/circuit/CircuitShaders.js"
import Config from "src/Config.js"
import DetailedError from "src/base/DetailedError.js"
import GateColumn from "src/circuit/GateColumn.js"
import GateShaders from "src/circuit/GateShaders.js"
import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"

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
     */
    constructor(numWires, columns) {
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

        /**
         * @type {!Array.<undefined|!string>}
         * @private
         */
        this._disabledReasons = [];
        /**
         * @type {!Array.<undefined|!int>}
         * @private
         */
        this._measureMasks = [0];
        let mask = 0;
        for (let col of columns) {
            let reasons = col.disabledReasons(mask);
            mask = col.nextMeasureMask(mask, reasons);
            this._disabledReasons.push(reasons);
            this._measureMasks.push(mask);
        }

        /**
         * @type {!Map.<!string, !{col: !int, row: !int, gate: !Gate}>}
         * @private
         */
        this._gateSlotCoverMap = this._computeGateSlotCoverMap();
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
                if (gate !== null) {
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
     * @param {*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof CircuitDefinition &&
            this.numWires === other.numWires &&
            seq(this.columns).isEqualTo(seq(other.columns), Util.CUSTOM_IS_EQUAL_TO_EQUALITY);
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
            map(c => seq(this.columns[c].gates).map(e => e === null ? 0 : e.serializedId.length).max()).
            toArray();
        return `CircuitDefinition (${this.numWires} wires, ${this.columns.length} cols):\n\t` +
            Seq.range(this.numWires).
                map(r => wire(1) + Seq.range(this.columns.length).
                    map(c => {
                        let g = this.columns[c].gates[r];
                        let label = g === null ? "" : g.serializedId;
                        return wireAround(colWidths[c], label);
                    }).
                    join(wire(1)) + wire(1)).
                join('\n\t');
    }

    /**
     * This mainly exists for writing tests that are understandable.
     * @param {!string} diagram
     * @param {!Map.<!string, !Gate>} gateMap
     * @returns {!CircuitDefinition}
     */
    static fromTextDiagram(gateMap, diagram) {
        let lines = seq(diagram.split('\n')).map(e => e.trim()).filter(e => e !== '').toArray();
        let colCount = seq(lines).map(e => e.length).max(0);
        let rowCount = lines.length;
        return new CircuitDefinition(
            rowCount,
            Seq.range(colCount).
                map(c => new GateColumn(lines.map(line => {
                    if (c >= line.length) {
                        throw new DetailedError("Uneven diagram", {diagram});
                    }
                    let g = line[c];
                    if (!gateMap.has(g)) {
                        throw new DetailedError("Unspecified gate", {char: g});
                    }
                    return gateMap.get(g);
                }))).
                toArray());
    }

    /**
     * @returns {!boolean}
     */
    isTimeDependent() {
        return seq(this.columns).any(
                e => seq(e.gates).any(
                    g => g !== null && g.isTimeBased()));
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
            .filter(e => e !== null)
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
     * @oaram {!Array.<!GateColumn>} cols
     * @returns {!CircuitDefinition}
     */
    withColumns(cols) {
        return new CircuitDefinition(
            this.numWires,
            cols)
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
                if (gate === null) {
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

            let isControl = g => g === Gates.Special.Control || g === Gates.Special.AntiControl;
            let keptGates = seq(this.columns[col].gates).
                mapWithIndex((g, row) => pushedGateIndexes.has(row) ? null : g).
                toArray();
            let pushedGates = seq(this.columns[col].gates).
                mapWithIndex((g, row) => isControl(g) || pushedGateIndexes.has(row) ? g : null).
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
     * @returns {!CircuitDefinition}
     */
    withTrailingSpacersIncluded() {
        return this.withColumns(seq(this.columns).
            padded(this.minimumRequiredColCount(), GateColumn.empty(this.numWires)).
            toArray());
    }

    /**
     * @returns {!CircuitDefinition}
     */
    withUncoveredColumnsRemoved() {
        let used = this._usedColumns();
        return new CircuitDefinition(
            this.numWires,
            seq(this.columns).filterWithIndex((e, i) => used.has(i)).toArray());
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
            this.columns.map(c => new GateColumn(
                seq(c.gates).
                    take(newWireCount).
                    padded(newWireCount, null).
                    toArray())));
    }

    /**
     * @returns {!int} The minimum number of wires needed to hold the gates in the circuit, accounting for their height
     * and assuming the gate positions are fixed (i.e. wires can only be added or removed from the bottom).
     */
    minimumRequiredWireCount() {
        return seq(this.columns).map(c => c.minimumRequiredWireCount()).max(0);
    }

    /**
     * @returns {!int} The minimum number of columns needed to hold the gates in the circuit, accounting for their width
     * and assuming the gate positions are fixed (i.e. columns can only be added or removed from the right).
     */
    minimumRequiredColCount() {
        return Math.max(0, seq(this.columns).mapWithIndex((c, i) => c.maximumGateWidth() + i).max(-Infinity));
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
    colHasSingleQubitDisplayMask(col) {
        if (col < 0 || col >= this.columns.length) {
            return 0;
        }
        return this.columns[col].wiresWithSingleQubitDisplaysMask();
    }

    /**
     * @param {!int} col
     * @returns {!int}
     */
    colHasDoubleQubitDisplayMask(col) {
        if (col < 0 || col >= this.columns.length) {
            return 0;
        }
        return this.columns[col].wiresWithTwoQubitDisplaysMask();
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locIsMeasured(pt) {
        let row = pt.y;
        if (row < 0 || row >= this.numWires) {
            return false
        }
        return (this.colIsMeasuredMask(pt.x) & (1 << row)) !== 0;
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
        return gate === null ? undefined : gate;
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
    locIsControl(pt) {
        let gate = this.gateInSlot(pt.x, pt.y);
        return gate === Gates.Special.Control || gate === Gates.Special.AntiControl;
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locStartsSingleControlWire(pt) {
        return this.locIsControl(pt) && !this.locIsMeasured(pt);
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locStartsDoubleControlWire(pt) {
        return this.locIsControl(pt) && this.locIsMeasured(pt);
    }

    /**
     * @param {int} col
     * @returns {boolean}
     */
    colHasEnabledSwapGate(col) {
        let pts = Seq.range(this.numWires).
            map(row => new Point(col, row)).
            filter(pt => this.gateInSlot(pt.x, pt.y) === Gates.Special.SwapHalf);
        return !pts.any(pt => this.gateAtLocIsDisabledReason(pt) !== undefined) && pts.count() === 2;
    }

    /**
     * @param {!Point} pt
     * @returns {!boolean}
     */
    locHasControllableGate(pt) {
        let g = this.gateInSlot(pt.x, pt.y);
        return g !== undefined &&
            g !== Gates.Special.Control &&
            g !== Gates.Special.AntiControl &&
            g !== Gates.Misc.SpacerGate &&
            (g !== Gates.Special.SwapHalf || this.colHasEnabledSwapGate(pt.x));
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
     * @param {!Point} pt
     * @returns {undefined|!string}
     */
    gateAtLocIsDisabledReason(pt) {
        if (pt.x < 0 || pt.y < 0 || pt.x >= this._disabledReasons.length || pt.y >= this.numWires) {
            return undefined;
        }
        return this._disabledReasons[pt.x][pt.y];
    }

    /**
     * @param {!int} colIndex
     * @param {!number} time
     * @returns {!Array.<!function(inputTex:!WglTexture,controlTex:!WglTexture):!WglConfiguredShader>}
     */
    operationShadersInColAt(colIndex, time) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return [];
        }

        let col = this.columns[colIndex];
        let nonSwaps = seq(col.gates).
            mapWithIndex((gate, i) => {
                let pt = new Point(colIndex, i);
                if (gate === null
                        || gate === Gates.Special.SwapHalf
                        || this.gateAtLocIsDisabledReason(pt) !== undefined) {
                    return [];
                }

                if (gate.customShaders !== undefined) {
                    return gate.customShaders.map(f => (inTex, conTex) => f(inTex, conTex, i, time));
                }

                let m = gate.matrixAt(time);
                if (m.isIdentity()) {
                    return [];
                }

                return [(inTex, conTex) => GateShaders.qubitOperation(inTex, m, i, conTex)];
            }).
            flatten();
        let swaps = col.swapPairs().
            map(([i1, i2]) => (inTex, conTex) => CircuitShaders.swap(inTex, i1, i2, conTex));
        return nonSwaps.concat(swaps).toArray();
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
}

CircuitDefinition.EMPTY = new CircuitDefinition(0, []);

export default CircuitDefinition;
