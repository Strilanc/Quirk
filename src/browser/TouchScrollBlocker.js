import {Point} from "src/math/Point.js"
import {Rect} from "src/math/Rect.js"

class TouchScrollBlocker {
    /**
     * @param {HTMLElement} parentElement
     */
    constructor(parentElement) {
        /**
         * @type {!HTMLElement}
         * @private
         */
        this._parentElement = parentElement;

        /**
         * @type {!HTMLDivElement}
         * @private
         */
        this._blockerDivs = [];
    }

    /**
     * @param {!Array.<!{rect: !Rect, cursor: undefined|!string}>} blockers
     * @param {undefined|!string} overrideCursorStyle
     */
    setBlockers(blockers, overrideCursorStyle) {
        while (this._blockerDivs.length < blockers.length) {
            let blockerDiv = document.createElement('div');
            blockerDiv.style.touchAction = 'none';
            blockerDiv.style.position = 'absolute';
            blockerDiv.style.opacity = 0;
            this._parentElement.appendChild(blockerDiv);
            this._blockerDivs.push(blockerDiv);
        }

        for (let i = 0; i < blockers.length; i++) {
            let s = this._blockerDivs[i].style;
            let r = blockers[i].rect;
            [s.left, s.top, s.width, s.height] = [r.x, r.y, r.w, r.h].map(e => e + "px");
            s.cursor = overrideCursorStyle || blockers[i].cursor || 'auto';
            s.display = 'inline';
        }

        for (let i = blockers.length; i < this._blockerDivs.length; i++) {
            this._blockerDivs[i].style.display = 'none';
        }
    }
}

export {TouchScrollBlocker}
