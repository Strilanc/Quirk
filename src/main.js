// Challenge ideas:

// count ones mod n/2
// fourier transform
// Schur transform

// Impossible:
// count set bits

var NUM_INITIAL_WIRES = 6;

//noinspection JSUnusedGlobalSymbols
var print = function(s) {
    $(document.getElementById("debugOutput")).val(s);
};

//noinspection FunctionTooLongJS
new TripWire("start").run(function() {
    var possibleCanvas = document.getElementById("drawCanvas");
    if (!(possibleCanvas instanceof HTMLCanvasElement)) {
        // Probably running the tests.
        return;
    }

    //noinspection JSValidateTypes
    /** @type {!HTMLCanvasElement} */
    var canvas = possibleCanvas;

    /** @type {!Inspector} */
    var inspector = Inspector.empty(NUM_INITIAL_WIRES, new Rect(0, 0, canvas.width, canvas.height));

    var ts = 0;
    var ticker = null;
    var redraw;

    /**
     */
    var tickWhenAppropriate = function() {
        var shouldBeTicking = inspector.needsContinuousRedraw();
        var isTicking = ticker !== null;
        if (isTicking === shouldBeTicking) {
            return;
        }
        if (shouldBeTicking) {
            ticker = setInterval(function() {
                ts += 0.01;
                ts %= 1;
                Gate.updateTimeGates(ts);
                redraw();
            }, 50);
        } else {
            clearInterval(ticker);
            ticker = null;
        }
    };

    redraw = new TripWire("redraw inspector").wrap0(function () {
        var painter = new Painter(canvas.getContext("2d"));

        // Clear
        painter.fillRect(new Rect(0, 0, canvas.width, canvas.height), "white");

        inspector.previewDrop().paint(painter);

        tickWhenAppropriate();
    });

    //noinspection JSUnresolvedFunction
    var $canvas = $(canvas);

    var mousePosToInspectorPos = function(p) {
        return new Point(
            p.pageX - $canvas.position().left,
            p.pageY - $canvas.position().top);
    };

    var isClicking = function(p) {
        return p.which === 1;
    };

    var update = new TripWire("update inspector").wrap1(function(newInspector) {
        if (inspector.isEqualTo(newInspector)) {
            return;
        }
        inspector = newInspector;
        redraw();
    });

    //noinspection JSUnresolvedFunction
    $(canvas).mousedown(new TripWire("canvas mouse down").wrap1(function (p) {
        if (!isClicking(p)) { return; }

        inspector = inspector.move(mousePosToInspectorPos(p)).grab();
        redraw();
    }));

    //noinspection JSUnresolvedFunction
    $(document).mouseup(new TripWire("document mouse up").wrap1(function (p) {
        if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
            return;
        }

        update(inspector.move(mousePosToInspectorPos(p)).drop());
    }));

    //noinspection JSUnresolvedFunction
    $(document).mousemove(new TripWire("document mouse move").wrap1(function (p) {
        if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
            return;
        }

        update(inspector.move(mousePosToInspectorPos(p)));
    }));

    //noinspection JSUnresolvedFunction
    $(canvas).mousemove(new TripWire("canvas mouse move").wrap1(function (p) {
        if (inspector.hand.heldGateBlock !== null) {
            // being handled by document mouse move
            return;
        }

        update(inspector.move(mousePosToInspectorPos(p)));
    }));

    //noinspection JSValidateTypes
    /** @type {!HTMLButtonElement} */
    var captureButton = document.getElementById("captureButton");

    //noinspection JSValidateTypes
    /** @type {!HTMLImageElement} */
    var captureImage = document.getElementById("captureImage");

    $(captureButton).click(new TripWire("capture click").wrap0(function() {
        $(captureButton).attr('disabled','disabled');
        inspector.captureCycle(canvas, function(p) {
            $(captureButton).text(Math.round(p*100) + "%");
        }, function(url) {
            captureImage.src = url;
            $(captureButton).removeAttr('disabled');
            $(captureButton).text("capture");
        });
    }));

    //noinspection JSUnresolvedFunction
    $(canvas).mouseleave(new TripWire("canvas mouse leave").wrap1(function () {
        update(inspector.move(null));
    }));

    redraw();
});
