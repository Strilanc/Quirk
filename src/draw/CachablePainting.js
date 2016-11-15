import {Painter} from "src/draw/Painter.js"
import {RestartableRng} from "src/base/RestartableRng.js"

const fixedRng = new RestartableRng();

/**
 * A drawing process that always has the same result, so its output can be cached and pasted instead of recreated anew.
 */
class CachablePainting {
    /**
     * @param {!function(key: *) : !{width: !int, height: !int}} sizeFunc
     * @param {!function(painter: !Painter | !(function(!Painter, !string): void)) : void} drawingFunc
     */
    constructor(sizeFunc, drawingFunc) {
        /** @type {!function(key: *) : !{width: !int, height: !int}} */
        this.sizeFunc = sizeFunc;
        /**
         * @type {!(function(!Painter): void) | !(function(!Painter, !string): void)}
         * @private
         */
        this._drawingFunc = drawingFunc;
        /**
         * @type {!Map.<!string, !HTMLCanvasElement>}
         * @private
         */
        this._cachedCanvases = new Map();
    }

    /**
     * @param {!int} x
     * @param {!int} y
     * @param {!Painter} painter
     * @param {!*=} key
     */
    paint(x, y, painter, key=undefined) {
        if (!this._cachedCanvases.has(key)) {
            let canvas = /** @type {!HTMLCanvasElement} */ document.createElement('canvas');
            let {width, height} = this.sizeFunc(key);
            canvas.width = width;
            canvas.height = height;
            this._drawingFunc(new Painter(canvas, fixedRng.restarted()), key);
            this._cachedCanvases.set(key, canvas);
        }
        painter.ctx.drawImage(this._cachedCanvases.get(key), x, y);
    }
}

export {CachablePainting}
