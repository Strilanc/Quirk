import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import GateColumn from "src/ui/GateColumn.js"
import Gate from "src/ui/Gate.js"
import SuperpositionNode from "src/quantum/SuperpositionNode.js"
import Shades from "src/quantum/Shades.js"
import PipelineNode from "src/quantum/PipelineNode.js"
import ControlMask from "src/quantum/ControlMask.js"

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
