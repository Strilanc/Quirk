import Point from "../src/base/point.js"
alert(new Point(1, 2));

/**
 * @typedef {!{
 *   size: !int,
 *   clear: !function(),
 *   has: !function(K): !boolean,
 *   get: !function(K) : V,
 *   set: !function(K, V) : !Map<K, V>,
 *   delete: !function(K),
 *   entries: !Iterator<!((K|V)[])>,
 *   keys: !function() : !Iterator<K>,
 *   values: !function() : !Iterator<V>
 * }} Map<K, V>
 * @template K, V
 */

/**
 * @typedef {!{
 *   size: !int,
 *   clear: !function(),
 *   has: !function(T): !boolean,
 *   add: !function(T) : !Set<T>,
 *   delete: !function(T),
 *   entries: !Iterator<!((T|T)[])>,
 *   keys: !function() : !Iterator<T>,
 *   values: !function() : !Iterator<T>
 * }} Set<T>
 * @template T
 */
class f {}

////noinspection JSValidateTypes
///** @type {!HTMLCanvasElement} */
//var canvas = document.getElementById("drawCanvas");
////noinspection JSValidateTypes
///** @type {!HTMLDivElement} */
//var canvasDiv = document.getElementById("canvasDiv");
////noinspection JSValidateTypes
//if (canvas === null) {
//    throw new Error("Couldn't find 'drawCanvas'");
//}
//
////noinspection JSValidateTypes
///** @type {!HTMLDivElement} */
//var inspectorDiv = document.getElementById("inspectorDiv");
//
////noinspection JSValidateTypes
///** @type {!HTMLAnchorElement} */
//var currentCircuitLink = document.getElementById("currentCircuitLink");
//
////noinspection JSValidateTypes
///** @type {!HTMLButtonElement} */
//var captureButton = document.getElementById("captureButton");
//$(captureButton).hide();
//
////noinspection JSValidateTypes
///** @type {!HTMLImageElement} */
//var captureImage = document.getElementById("captureImage");
////noinspection JSValidateTypes
///** @type {!HTMLImageElement} */
//var captureImageAnchor = document.getElementById("captureImageAnchor");
//
//var undoHistory = [];
//var redoHistory = [];
//
////noinspection FunctionTooLongJS
//var main = function() {
//    /** @type {!Inspector} */
//    var inspector = Inspector.empty(Config.NUM_INITIAL_WIRES, new Rect(0, 0, canvas.width, canvas.height));
//
//    var ts = 0;
//    var ticker = null;
//    var redraw;
//
//    var tickWhenAppropriate = function() {
//        var shouldBeTicking = inspector.needsContinuousRedraw();
//
//        if (shouldBeTicking) {
//            $(captureButton).show();
//        } else {
//            $(captureButton).hide();
//        }
//
//        var isTicking = ticker !== null;
//        if (isTicking === shouldBeTicking) {
//            return;
//        }
//        if (shouldBeTicking) {
//            ticker = setInterval(function() {
//                ts += 0.01;
//                ts %= 1;
//                redraw();
//            }, 50);
//        } else {
//            clearInterval(ticker);
//            ticker = null;
//        }
//    };
//
//    redraw = function () {
//        canvas.width = canvasDiv.clientWidth;
//        canvas.height = canvasDiv.clientHeight;
//        inspector.updateArea(new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));
//        var painter = new Painter(canvas);
//
//        inspector.previewDrop().paint(painter, ts);
//
//        tickWhenAppropriate();
//    };
//
//    //noinspection JSUnresolvedFunction
//    var $canvas = $(canvas);
//
//    var mousePosToInspectorPos = function(p) {
//        return new Point(
//            p.pageX - $canvas.position().left,
//            p.pageY - $canvas.position().top);
//    };
//
//    var isClicking = function(p) {
//        return p.which === 1;
//    };
//
//    var update = function(newInspector, keepInHistory) {
//        if (inspector.isEqualTo(newInspector)) {
//            return;
//        }
//        var oldSnapshot = snapshot();
//        inspector = newInspector;
//        var jsonText = snapshot();
//        $(currentCircuitLink).attr("href", "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText);
//        if (keepInHistory && oldSnapshot !== jsonText) {
//            undoHistory.push(oldSnapshot);
//            redoHistory = [];
//        }
//
//        redraw();
//    };
//
//    var restore = function(jsonText) {
//        inspector = inspector.withImportedCircuit(JSON.parse(jsonText));
//        $(currentCircuitLink).attr("href", "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText);
//        redraw();
//    };
//
//    //noinspection JSUnresolvedFunction
//    $(canvas).mousedown(function (p) {
//        if (!isClicking(p)) { return; }
//        p.preventDefault();
//
//        update(inspector.move(mousePosToInspectorPos(p)).grab(), true);
//    });
//
//    //noinspection JSUnresolvedFunction
//    $(document).mouseup(function (p) {
//        if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
//            return;
//        }
//        p.preventDefault();
//
//        update(inspector.move(mousePosToInspectorPos(p)).drop(), true);
//    });
//
//    //noinspection JSUnresolvedFunction
//    $(document).mousemove(function (p) {
//        if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
//            return;
//        }
//        p.preventDefault();
//
//        update(inspector.move(mousePosToInspectorPos(p)), false);
//    });
//
//    //noinspection JSUnresolvedFunction
//    $(canvas).mousemove(function (p) {
//        if (inspector.hand.heldGateBlock !== null) {
//            // being handled by document mouse move
//            return;
//        }
//
//        update(inspector.move(mousePosToInspectorPos(p)), false);
//    });
//
//    $(captureButton).text(Config.CAPTURE_BUTTON_CAPTION);
//    $(captureButton).click(function() {
//        $(captureButton).attr('disabled','disabled');
//        inspector.captureCycle(new Painter(canvas), function(p) {
//            $(captureButton).text("Encoding... " + Math.round(p*100) + "%");
//        }, function(url) {
//            captureImage.src = url;
//            $(captureImageAnchor).attr("href", url);
//            $(captureImage).height("150px");
//            $(captureButton).removeAttr('disabled');
//            $(captureButton).text(Config.CAPTURE_BUTTON_CAPTION);
//        });
//    });
//
//    //noinspection JSUnresolvedFunction
//    $(canvas).mouseleave(function () {
//        update(inspector.move(null), false);
//    });
//
//    window.addEventListener('resize', redraw, false);
//
//    var snapshot = function() {
//        return JSON.stringify(inspector.exportCircuit(), null, 0);
//    };
//    var undo = function() {
//        if (undoHistory.length === 0) {
//            return;
//        }
//        redoHistory.push(snapshot());
//        restore(undoHistory.pop());
//    };
//    var redo = function() {
//        if (redoHistory.length === 0) {
//            return;
//        }
//        undoHistory.push(snapshot());
//        restore(redoHistory.pop());
//    };
//
//    $(inspectorDiv).keydown(function(e) {
//        var isUndo = e.keyCode == 90 && e.ctrlKey && !e.shiftKey;
//        var isRedo = e.keyCode == 90 && e.ctrlKey && e.shiftKey;
//        if (isUndo) {
//            undo();
//        }
//        if (isRedo) {
//            redo();
//        }
//    });
//
//    var params = getSearchParameters();
//    if (params.hasOwnProperty(Config.URL_CIRCUIT_PARAM_KEY)) {
//        try {
//            var json = JSON.parse(params[Config.URL_CIRCUIT_PARAM_KEY]);
//            update(inspector.withImportedCircuit(json), false);
//        } catch (ex) {
//            alert("Failed to load circuit: " + ex);
//        }
//    }
//
//    redraw();
//};
//
//
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
//
//main();
