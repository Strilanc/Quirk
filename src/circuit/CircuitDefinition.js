import CircuitShaders from "src/circuit/CircuitShaders.js"
import DetailedError from "src/base/DetailedError.js"
import GateColumn from "src/circuit/GateColumn.js"
import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"

class CircuitDefinition {
    /**
     * @param {!int} numWires
     * @param {!Array<!GateColumn>} columns
     * @property {!int} numWires
     * @property {!Array<!GateColumn>} columns;
     */
    constructor(numWires, columns) {
        if (numWires < 0) {
            throw new DetailedError("numWires < 0", {numWires})
        }
        if (!columns.every(e => e instanceof GateColumn)) {
            throw new DetailedError("Not a GateColumn", {columns})
        }
        if (!columns.every(e => e.gates.length === numWires)) {
            throw new DetailedError("Wrong gate count", {numWires, columns})
        }

        this.numWires = numWires;
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
    }

    /**
     * @returns {!boolean}
     */
    isTimeDependent() {
        return new Seq(this.columns).any(
                e => new Seq(e.gates).any(
                    g => g !== null && g.isTimeBased()));
    }

    /**
     * @param {!Array.<!Array.<?Gate>>} gates
     * @return {!CircuitDefinition}
     */
    static from(gates) {
        if (gates.length === 0) {
            return new CircuitDefinition(0, []);
        }
        return new CircuitDefinition(gates[0].length, gates.map(c => new GateColumn(c)));
    }

    /**
     * Returns a munged compact text representation of the circuit.
     *
     * The text isn't intended to be particularly understandable, but it should vaguely reflect or at least
     * distinguish the circuit from others when skimming a list of hashes (e.g. links in browser history).
     */
    readableHash() {
        let allGates = new Seq(this.columns)
            .flatMap(e => e.gates)
            .filter(e => e !== null)
            .map(e => e.symbol)
            .toArray();
        if (allGates.length === 0) {
            return "A Toy Quantum Circuit Inspector";
        }
        let allGatesString = `${this.numWires} wires, ${allGates.length} ops, ${allGates.join("").split("^").join("")}`;
        if (allGatesString.length <= 40) {
            return allGatesString;
        }
        return allGatesString.substring(0, 40) + `…`;
    }

    withColumns(cols) {
        return new CircuitDefinition(
            this.numWires,
            cols)
    }

    withoutEmpties() {
        return new CircuitDefinition(
            this.numWires,
            this.columns.filter(e => !e.isEmpty()));
    }

    withWireCount(newWireCount) {
        if (newWireCount === this.numWires) {
            return this;
        }
        return new CircuitDefinition(
            newWireCount,
            this.columns.map(c => new GateColumn(
                new Seq(c.gates).
                    take(newWireCount).
                    padded(newWireCount, null).
                    toArray())));
    }

    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof CircuitDefinition &&
            this.numWires === other.numWires &&
            new Seq(this.columns).isEqualTo(new Seq(other.columns), Util.CUSTOM_IS_EQUAL_TO_EQUALITY);
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locIsMeasured(pt) {
        let col = Math.min(this.columns.length, pt.x);
        let row = pt.y;
        if (col < 0 || row < 0 || row >= this.numWires) {
            return false
        }
        return (this._measureMasks[col] & (1 << row)) !== 0;
    }

    /**
     * @param {!Point} pt
     * @returns {!Gate|null}
     */
    gateAtLoc(pt) {
        if (pt.x < 0 || pt.x >= this.columns.length || pt.y < 0 || pt.y >= this.numWires) {
            return null;
        }
        return this.columns[pt.x].gates[pt.y];
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locIsControl(pt) {
        let gate = this.gateAtLoc(pt);
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
    colHasPairedSwapGate(col) {
        let pts = Seq.range(this.numWires).
            map(row => new Point(col, row)).
            filter(pt => this.gateAtLoc(pt) === Gates.Special.SwapHalf);
        return !pts.any(pt => this.gateAtLocIsDisabledReason(pt) !== undefined) && pts.count() == 2;
    }

    /**
     * @param {!Point} pt
     * @returns {boolean}
     */
    locHasControllableGate(pt) {
        let g = this.gateAtLoc(pt);
        return g !== null &&
            g !== Gates.Special.Control &&
            g !== Gates.Special.AntiControl &&
            g !== Gates.Misc.SpacerGate &&
            (g !== Gates.Special.SwapHalf || this.colHasPairedSwapGate(pt.x));
    }

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
                if (gate === null || this.gateAtLocIsDisabledReason(pt) !== undefined) {
                    return null;
                }
                let m = gate.matrixAt(time);
                if (m.width() !== 2 || m.height() !== 2 || m.isIdentity()) {
                    return null;
                }

                if (gate.customShader !== undefined) {
                    return (inTex, conTex) => gate.customShader(inTex, conTex, i);
                }

                return (inTex, conTex) => CircuitShaders.qubitOperation(inTex, m, i, conTex);
            }).
            filter(e => e !== null);
        let swaps = col.swapPairs().
            map(([i1, i2]) => (inTex, conTex) => CircuitShaders.swap(inTex, i1, i2, conTex));
        return nonSwaps.concat(swaps).toArray();
    }

    toString() {
        let w = "─";
        let self = this;
        return Seq.
            range(self.numWires).
            map(r => w + Seq.
                range(this.columns.length).
                map(c => {
                    let g = self.columns[c].gates[r];
                    let t = g === null ? w : g.symbol;
                    return new Seq(t).padded(7, w).join("");
                }).
                join("")).
            join("\n");
    }
}

export default CircuitDefinition;
