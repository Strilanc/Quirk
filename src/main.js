import Gate from "src/ui/Gate.js"
import ControlMask from "src/quantum/ControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/math/Complex.js"
import CircuitStats from "src/ui/CircuitStats.js"
import CircuitDefinition from "src/ui/CircuitDefinition.js"
import Matrix from "src/math/Matrix.js"
import PipelineNode from "src/quantum/PipelineNode.js"
import Rect from "src/base/Rect.js"
import Gates from "src/ui/Gates.js"
import GateColumn from "src/ui/GateColumn.js"
import describe from "src/base/Describe.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Config from "src/Config.js"
import Painter from "src/ui/Painter.js"
import Point from "src/base/Point.js"

//let tr1 = Gate.fromTargetedRotation(-1/3, "-1/3");
//let tr2 = Gate.fromTargetedRotation(-2/3, "-2/3");
//let circuit = new CircuitDefinition(9, [
//    new GateColumn([Gates.Named.HalfTurns.H, Gates.Named.HalfTurns.H, Gates.Named.HalfTurns.H, null, null, null, null, null, null]),
//    new GateColumn([Gates.Named.HalfTurns.X, Gates.Named.Special.Control, null, null, null, null, null, null, null]),
//    new GateColumn([Gates.Named.Special.Control, Gates.Named.HalfTurns.H, null, null, null, null, null, null, null]),
//    new GateColumn([Gates.Named.Special.Control, Gates.Named.HalfTurns.X, Gates.Named.Special.Control, null, null, null, null, null, null]),
//    new GateColumn([Gates.Named.HalfTurns.X, null, Gates.Named.Special.Control, null, null, null, null, null, null]),
//    new GateColumn([Gates.Named.Special.SwapHalf, null, Gates.Named.Special.SwapHalf, null, null, null, null, null, null]),
//    new GateColumn([Gates.Named.Special.Control, null, tr1, null, null, null, null, null, null]),
//    new GateColumn([null, Gates.Named.Special.Control, tr2, null, null, null, null, null, null])
//]);
//
//CircuitStats.fromCircuitAtTime(circuit);
//
//alert("Starting 33");
//let t0 = performance.now();
//let n = 100;
//for (let i = 0; i < n; i++) {
//    CircuitStats.fromCircuitAtTime(circuit);
//}
//let t1 = performance.now();
//let dt = (t1 - t0) / n;
//alert(dt + "ms\n" + describe(CircuitStats.fromCircuitAtTime(circuit)));






//noinspection JSValidateTypes
/** @type {!HTMLCanvasElement} */
var canvas = document.getElementById("drawCanvas");
//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
var canvasDiv = document.getElementById("canvasDiv");
//noinspection JSValidateTypes
if (canvas === null) {
    throw new Error("Couldn't find 'drawCanvas'");
}

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
var inspectorDiv = document.getElementById("inspectorDiv");

//noinspection JSValidateTypes
/** @type {!HTMLAnchorElement} */
var currentCircuitLink = document.getElementById("currentCircuitLink");

//var undoHistory = [];
//var redoHistory = [];

//noinspection FunctionTooLongJS
var main = () => {
    /** @type {!InspectorWidget} */
    var inspector = InspectorWidget.empty(Config.NUM_INITIAL_WIRES, new Rect(0, 0, canvas.width, canvas.height));

    var circuitTime = 0;
    //var ticker = null;
    var redraw;

    //var tickWhenAppropriate = function() {
    //    var shouldBeTicking = inspector.needsContinuousRedraw();
    //
    //    var isTicking = ticker !== null;
    //    if (isTicking === shouldBeTicking) {
    //        return;
    //    }
    //    if (shouldBeTicking) {
    //        ticker = setInterval(function() {
    //            ts += 0.01;
    //            ts %= 1;
    //            redraw();
    //        }, 50);
    //    } else {
    //        clearInterval(ticker);
    //        ticker = null;
    //    }
    //};

    redraw = function () {
        canvas.width = canvasDiv.clientWidth;
        canvas.height = canvasDiv.clientHeight;
        inspector.updateArea(new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));
        var painter = new Painter(canvas);

        //inspector.previewDrop().paint(painter, ts);
        inspector.paint(painter, circuitTime);
        painter.paintDeferred();

        //tickWhenAppropriate();
    };

    /**
     * @param {!MouseEvent} mouseEvent
     */
    var mousePosRelativeToCanvas = mouseEvent => {
        let b = canvas.getBoundingClientRect();
        return new Point(mouseEvent.clientX - b.left, mouseEvent.clientY - b.top);
    };

    var isClicking = p => p.which === 1;

    var useInspector = (newInspector, keepInHistory) => {
        if (inspector.isEqualTo(newInspector)) {
            return;
        }
        //var oldSnapshot = snapshot();
        inspector = newInspector;
        //var jsonText = snapshot();
        //$(currentCircuitLink).attr("href", "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText);
        //if (keepInHistory && oldSnapshot !== jsonText) {
        //    undoHistory.push(oldSnapshot);
        //    redoHistory = [];
        //}

        redraw();
    };

    //var restore = jsonText => {
    //    inspector = inspector.withImportedCircuit(JSON.parse(jsonText));
    //    $(currentCircuitLink).attr("href", "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText);
    //    redraw();
    //};

    //noinspection JSUnresolvedFunction
    //$(canvas).mousedown(p => {
    //    if (!isClicking(p)) { return; }
    //    p.preventDefault();
    //
    //    update(inspector.move(mousePosToInspectorPos(p)).grab(), true);
    //});
    //
    ////noinspection JSUnresolvedFunction
    //$(document).mouseup(p => {
    //    if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
    //        return;
    //    }
    //    p.preventDefault();
    //
    //    update(inspector.move(mousePosToInspectorPos(p)).drop(), true);
    //});
    //
    //noinspection JSUnresolvedFunction
    document.addEventListener("mousemove", p => {
        if (!isClicking(p) || !inspector.hand.isBusy()) {
            // Not a drag out of the canvas; don't care.
            return;
        }
        p.preventDefault();

        let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(p));
        useInspector(inspector.withHand(newHand), false);
    });

    //noinspection JSUnresolvedFunction
    canvas.addEventListener("mousemove", p => {
        if (isClicking(p) && inspector.hand.isBusy()) {
            // being handled by document mouse move
            return;
        }
        p.preventDefault();

        let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(p));
        useInspector(inspector.withHand(newHand), false);
    });

    //noinspection JSUnresolvedFunction
    canvas.addEventListener("mouseleave", () => {
        let newHand = inspector.hand.withPos(null);
        useInspector(inspector.withHand(newHand), false)
    });

    window.addEventListener('resize', redraw, false);

    //var snapshot = () => JSON.stringify(inspector.exportCircuit(), null, 0);
    //var undo = () => {
    //    if (undoHistory.length === 0) {
    //        return;
    //    }
    //    redoHistory.push(snapshot());
    //    restore(undoHistory.pop());
    //};
    //var redo = () => {
    //    if (redoHistory.length === 0) {
    //        return;
    //    }
    //    undoHistory.push(snapshot());
    //    restore(redoHistory.pop());
    //};

    //$(inspectorDiv).keydown(e => {
    //    var isUndo = e.keyCode == 90 && e.ctrlKey && !e.shiftKey;
    //    var isRedo = e.keyCode == 90 && e.ctrlKey && e.shiftKey;
    //    if (isUndo) {
    //        undo();
    //    }
    //    if (isRedo) {
    //        redo();
    //    }
    //});

    //var params = getSearchParameters();
    //if (params.hasOwnProperty(Config.URL_CIRCUIT_PARAM_KEY)) {
    //    try {
    //        var json = JSON.parse(params[Config.URL_CIRCUIT_PARAM_KEY]);
    //        update(inspector.withImportedCircuit(json), false);
    //    } catch (ex) {
    //        alert("Failed to load circuit: " + ex);
    //    }
    //}

    redraw();
};


//function getSearchParameters() {
//    var paramsText = window.location.search.substr(1);
//    var paramsObject = {};
//    if (paramsText !== null && paramsText !== "") {
//        var paramsKeyVal = paramsText.split("&");
//        for (var i = 0; i < paramsKeyVal.length; i++) {
//            var keyVal = paramsKeyVal[i];
//            var eq = keyVal.indexOf("=");
//            if (eq === -1) {
//                continue;
//            }
//            var key = decodeURIComponent(keyVal.substring(0, eq));
//            paramsObject[key] = decodeURIComponent(keyVal.substring(eq + 1));
//        }
//    }
//    return paramsObject;
//}

main();
