import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Config} from "src/Config.js"
import {Controls} from "src/circuit/Controls.js"
import {CustomGateSet} from "src/circuit/CustomGateSet.js"
import {DetailedError} from "src/base/DetailedError.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {seq, Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"

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
     */
    constructor(numWires,
                columns,
                outerRowOffset=0,
                outerContext=new Map(),
                customGateSet=new CustomGateSet(),
                isNested=false) {
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
            let reasons = col.disabledReasons(mask, outerRowOffset, outerContext, isNested);
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
     * @returns {!Set.<!String>}
     */
    getUnmetContextKeys() {
        let result = new Set();
        for (let c = 0; c < this.columns.length; c++) {
            let col = this.columns[c];
            let ctx = this.colCustomContextFromGates(c);
            for (let gate of col.gates) {
                for (let key of gate === undefined ? [] : gate.getUnmetContextKeys()) {
                    if (!ctx.has(key)) {
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
            true);
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
            this.customGateSet);
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
            this.customGateSet);
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
                    padded(newWireCount, undefined).
                    toArray())),
            this.outerRowOffset,
            this.outerContext,
            this.customGateSet);
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
        let c = this.columns[col];
        return Seq.range(c.gates.length).
            filter(row => c.gates[row] === Gates.Displays.ChanceDisplay ||
                c.gates[row] === Gates.Displays.BlochSphereDisplay ||
                c.gates[row] === Gates.Displays.DensityMatrixDisplay).
            filter(row => this.gateAtLocIsDisabledReason(new Point(col, row)) === undefined).
            aggregate(0, (a, i) => a | (1 << i));
    }

    /**
     * @param {!int} col
     * @returns {!Map.<!string, *>}
     */
    colCustomContextFromGates(col) {
        let result = new Map();
        if (col < 0 || col >= this.columns.length) {
            return result;
        }
        let c = this.columns[col];
        for (let row = 0; row < c.gates.length; row++) {
            let g = c.gates[row];
            if (g !== undefined && this.gateAtLocIsDisabledReason(new Point(col, row)) === undefined) {
                for (let {key, val} of g.customColumnContextProvider(row)) {
                    //noinspection JSUnusedAssignment
                    result.set(key, val);
                }
            }
        }
        return result;
    }

    /**
     * @param {!int} col
     * @returns {!int}
     */
    colHasDoubleQubitDisplayMask(col) {
        if (col < 0 || col >= this.columns.length) {
            return 0;
        }
        let c = this.columns[col];
        return Seq.range(c.gates.length).
            filter(row => c.gates[row] === Gates.Displays.DensityMatrixDisplay2).
            filter(row => this.gateAtLocIsDisabledReason(new Point(col, row)) === undefined).
            aggregate(0, (a, i) => a | (1 << i));
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
            this.gateAtLocIsDisabledReason(pt) === undefined;
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locStartsDoubleControlWire(pt) {
        return this.locIsControlWireStarter(pt) &&
            this.locClassifyMeasuredIncludingGateExtension(pt) !== false &&
            this.gateAtLocIsDisabledReason(pt) === undefined;
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
     * @param {int} col
     * @returns {boolean}
     */
    colHasNonLocalGates(col) {
        if (col < 0 || col >= this.columns.length) {
            return false;
        }
        return seq(this.columns[col].gates).any(e => e !== undefined && e.affectsOtherWires());
    }

    /**
     * @param {!Point} pt
     * @returns {!boolean}
     */
    locHasControllableGate(pt) {
        let g = this.gateInSlot(pt.x, pt.y);
        return g !== undefined &&
            !g.isControl() &&
            g !== Gates.SpacerGate &&
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
     * @params {!int} col
     * @returns {!Controls}
     */
    colControls(col) {
        if (col < 0 || col >= this.columns.length) {
            return Controls.NONE;
        }
        return Seq.
            range(this.columns[col].gates.length).
            map(i => {
                let g = this.columns[col].gates[i];
                let isEnabled = this.gateAtLocIsDisabledReason(new Point(col, i)) === undefined;
                let b = g !== undefined && isEnabled ? g.controlBit() : undefined;
                return b === undefined ? Controls.NONE :
                    b === false ? Controls.bit(i, false) :
                    Controls.bit(i, true);
            }).
            aggregate(Controls.NONE, (a, e) => a.and(e));
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
     * @param {!int} rowOffset
     * @returns {!Array.<!function(!CircuitEvalArgs):!WglConfiguredShader>}
     */
    operationShadersInColAt(colIndex, rowOffset=0) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return [];
        }

        let col = this.columns[colIndex];
        let nonSwaps = seq(col.gates).
            mapWithIndex((gate, row) => {
                let pt = new Point(colIndex, row);
                if (gate === undefined ||
                        gate.definitelyHasNoEffect() ||
                        gate === Gates.Special.SwapHalf ||
                        this.gateAtLocIsDisabledReason(pt) !== undefined) {
                    return [];
                }

                if (gate.customShaders !== undefined) {
                    return gate.customShaders.map(f => e => f(e.withRow(row + rowOffset)));
                }

                if (gate.customTextureTransform !== undefined) {
                    return [];
                }

                return [args => GateShaders.matrixOperation(
                    args.stateTexture,
                    gate.knownMatrixAt(args.time),
                    row + rowOffset,
                    args.controlsTexture)];
            }).
            flatten();
        let swaps = col.swapPairs().
            map(([i1, i2]) => args => CircuitShaders.swap(args.stateTexture,
                                                          i1 + rowOffset,
                                                          i2 + rowOffset,
                                                          args.controlsTexture));
        return nonSwaps.concat(swaps).toArray();
    }

    /**
     * @param {!int} colIndex
     * @param {!int} rowOffset
     * @returns {!Array.<!function(!CircuitEvalArgs):!WglTexture>}
     */
    textureTransformsInColAt(colIndex, rowOffset=0) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return [];
        }
        return seq(this.columns[colIndex].gates).
            mapWithIndex((gate, row) => {
                if (gate === undefined ||
                        gate.customTextureTransform === undefined ||
                        this.gateAtLocIsDisabledReason(new Point(colIndex, row)) !== undefined) {
                    return undefined;
                }
                return args => gate.customTextureTransform(args.withRow(row + rowOffset));
            }).
            filter(e => e !== undefined).
            toArray();
    }

    /**
     * @param {!int} colIndex
     * @param {!boolean} beforeNotAfter
     * @param {!int} rowOffset
     * @returns {!Array.<!function(!CircuitEvalArgs):!WglConfiguredShader>}
     */
    getSetupShadersInCol(colIndex, beforeNotAfter, rowOffset) {
        if (colIndex < 0 || colIndex >= this.columns.length) {
            return [];
        }
        let col = this.columns[colIndex];
        return seq(col.gates).
            mapWithIndex((gate, i) => {
                let pt = new Point(colIndex, i);
                if (gate === undefined || this.gateAtLocIsDisabledReason(pt) !== undefined) {
                    return [];
                }
                let shaders = beforeNotAfter ? gate.preShaders : gate.postShaders;
                return shaders.map(f => e => f(e.withRow(i + rowOffset)));
            }).
            flatten().
            toArray();
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
        return Seq.range(col.gates.length).
            filter(row =>
                col.gates[row] !== undefined &&
                col.gates[row].customStatPostProcesser !== undefined &&
                this.gateAtLocIsDisabledReason(new Point(colIndex, row)) === undefined).
            toArray();
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
            this.customGateSet.withGate(gate));
    }
}

CircuitDefinition.EMPTY = new CircuitDefinition(0, []);

export {CircuitDefinition}
