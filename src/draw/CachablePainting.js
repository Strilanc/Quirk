/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Painter} from "./Painter.js"
import {RestartableRng} from "../base/RestartableRng.js"

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
