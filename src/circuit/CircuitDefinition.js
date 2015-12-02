import GateColumn from "src/circuit/GateColumn.js"
import Seq from "src/base/Seq.js"
import Util from "src/base/Util.js"
import Gates from "src/ui/Gates.js"

class CircuitDefinition {
    /**
     * @param {!int} numWires
     * @param {!Array<!GateColumn>} columns
     * @property {!int} numWires
     * @property {!Array<!GateColumn>} columns;
     */
    constructor(numWires, columns) {
        Util.need(numWires >= 0, "numWires >= 0");
        Util.need(columns.every(e => e instanceof GateColumn), "columns.every(e => e instanceof GateColumn)");
        Util.need(columns.every(e => e.gates.length === numWires), "columns.every(e => e.gates.length === numWires)");
        this.numWires = numWires;
        this.columns = columns;
    }

    withColumns(columns) {
        return new CircuitDefinition(
            this.numWires,
            columns)
    }

    withoutEmpties() {
        return new CircuitDefinition(
            this.numWires,
            this.columns.filter(e => !e.isEmpty()));
    }

    /**
     * Determines at what point each wire is measured (if ever).
     * @returns {!Array.<int>}
     */
    wireMeasuredColumns() {
        if (this.__cachedMeasureIndices === undefined) {
            this.__cachedMeasureIndices = Seq.
                range(this.numWires).
                map(r => Seq.
                    range(this.columns.length).
                    skipWhile(c => this.columns[c].gates[r] !== Gates.Named.Special.Measurement).
                    first(Infinity)).
                toArray();
        }
        return this.__cachedMeasureIndices;
    }

    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof CircuitDefinition &&
            this.numWires === other.numWires &&
            new Seq(this.columns).isEqualTo(new Seq(other.columns), Util.CUSTOM_IS_EQUAL_TO_EQUALITY);
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
