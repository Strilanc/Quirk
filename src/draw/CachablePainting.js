import {Painter} from "src/draw/Painter.js"
import {RestartableRng} from "src/base/RestartableRng.js"

const fixedRng = new RestartableRng();

/**
 * A drawing process that always has the same result, so its output can be cached and pasted instead of recreated anew.
 */
class CachablePainting {
    /**
     * @param {!int} width
     * @param {!int} height
     * @param {!function(painter: !Painter) : void} drawingFunc
     */
    constructor(width, height, drawingFunc) {
        /** @type {!int} */
        this.width = width;
        /** @type {!int} */
        this.height = height;
        /**
         * @type {!(function(!Painter): void)}
         * @private
         */
        this._drawingFunc = drawingFunc;
        /**
         * @type {undefined|!HTMLCanvasElement}
         * @private
         */
        this._cacheCanvas = undefined;
    }

    /**
     * @param {!int} x
     * @param {!int} y
     * @param {!Painter} painter
     */
    paint(x, y, painter) {
        if (this._cacheCanvas === undefined) {
            this._initCache();
        }
        painter.ctx.drawImage(this._cacheCanvas, x, y);
    }

    _initCache() {
        this._cacheCanvas = document.createElement('canvas');
        this._cacheCanvas.width = this.width;
        this._cacheCanvas.height = this.height;
        this._drawingFunc(new Painter(this._cacheCanvas, fixedRng.restarted()));
    }
}

export {CachablePainting}
