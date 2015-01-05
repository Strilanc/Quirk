//noinspection FunctionTooLongJS
var main = function() {
    var possibleCanvas = document.getElementById("drawCanvas");
    if (!(possibleCanvas instanceof HTMLCanvasElement)) {
        // Probably running the tests.
        return;
    }

    //noinspection JSValidateTypes
    /** @type {!HTMLCanvasElement} */
    var canvas = possibleCanvas;

    /** @type {!Inspector} */
    var inspector = Inspector.empty(Config.NUM_INITIAL_WIRES, new Rect(0, 0, canvas.width, canvas.height));

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
                redraw();
            }, 50);
        } else {
            clearInterval(ticker);
            ticker = null;
        }
    };

    redraw = function () {
        var painter = new Painter(canvas);

        // Clear
        painter.fillRect(new Rect(0, 0, canvas.width, canvas.height), Config.BACKGROUND_COLOR);

        inspector.previewDrop().paint(painter, ts);

        tickWhenAppropriate();
    };

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

    var update = function(newInspector) {
        if (inspector.isEqualTo(newInspector)) {
            return;
        }
        inspector = newInspector;
        $(document.getElementById("exportTextBox")).val(inspector.exportCircuit());
        $(document.getElementById("exportTextBox")).css("background-color", "white");
        redraw();
    };

    $(document.getElementById("exportTextBox")).bind('input propertychange', function() {
        try {
            var v = $(document.getElementById("exportTextBox")).val();
            update(inspector.withImportedCircuit(v));
            $(document.getElementById("exportTextBox")).css("background-color", "white");
        } catch (ex) {
            $(document.getElementById("exportTextBox")).css("background-color", "pink");
            alert(ex);
        }
    });

    //noinspection JSUnresolvedFunction
    $(canvas).mousedown(function (p) {
        if (!isClicking(p)) { return; }

        inspector = inspector.move(mousePosToInspectorPos(p)).grab();
        redraw();
    });

    //noinspection JSUnresolvedFunction
    $(document).mouseup(function (p) {
        if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
            return;
        }

        update(inspector.move(mousePosToInspectorPos(p)).drop());
    });

    //noinspection JSUnresolvedFunction
    $(document).mousemove(function (p) {
        if (!isClicking(p) || inspector.hand.heldGateBlock === null ) {
            return;
        }

        update(inspector.move(mousePosToInspectorPos(p)));
    });

    //noinspection JSUnresolvedFunction
    $(canvas).mousemove(function (p) {
        if (inspector.hand.heldGateBlock !== null) {
            // being handled by document mouse move
            return;
        }

        update(inspector.move(mousePosToInspectorPos(p)));
    });

    //noinspection JSValidateTypes
    /** @type {!HTMLButtonElement} */
    var captureButton = document.getElementById("captureButton");

    //noinspection JSValidateTypes
    /** @type {!HTMLImageElement} */
    var captureImage = document.getElementById("captureImage");

    $(captureButton).text(Config.CAPTURE_BUTTON_CAPTION);
    $(captureButton).click(function() {
        $(captureButton).attr('disabled','disabled');
        inspector.captureCycle(new Painter(canvas), function(p) {
            $(captureButton).text("Encoding... " + Math.round(p*100) + "%");
        }, function(url) {
            captureImage.src = url;
            $(captureButton).removeAttr('disabled');
            $(captureButton).text(Config.CAPTURE_BUTTON_CAPTION);
        });
    });

    //noinspection JSUnresolvedFunction
    $(canvas).mouseleave(function () {
        update(inspector.move(null));
    });

    redraw();
};

main();
