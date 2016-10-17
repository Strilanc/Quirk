import {perfGoal, millis} from "test_perf/TestPerfUtil.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Gate} from "src/circuit/Gate.js"
import {Rect} from "src/math/Rect.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {DisplayedInspector} from "src/ui/DisplayedInspector.js"
import {Serializer} from "src/circuit/Serializer.js"

perfGoal(
    "Update inspector circuit",
    millis(15),
    ([oldInspector, newCircuit]) => {
        let json = JSON.stringify(Serializer.toJson(newCircuit));
        let empty = Serializer.fromJson(CircuitDefinition, {cols: []});
        let parsed = Serializer.fromJson(CircuitDefinition, JSON.parse(json));
        return oldInspector.withCircuitDefinition(parsed).withCircuitDefinition(empty);
    },
    [DisplayedInspector.empty(new Rect(0, 0, 1000, 1000)), CircuitDefinition.fromTextDiagram(new Map([
        ["-", undefined],
        ["/", null],
        ["Q", Gates.FourierTransformGates.FourierTransformFamily]]),
        `QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////
         //////////////////////////////`)]);
