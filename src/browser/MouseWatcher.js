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

import {Point} from "../math/Point.js"

const ALLOW_REGRAB_WATCHDOG_TIME_MS = 5000;
const MOUSE_ID = "mouse!";

/**
 * @param {!TouchEvent|!MouseEvent} ev
 * @returns {!boolean}
 */
let isLeftClicking = ev => (window.TouchEvent !== undefined && ev instanceof TouchEvent) || ev.which === 1;

/**
 * @param {!MouseEvent} ev
 * @returns {!boolean}
 */
let isMiddleClicking = ev => ev.which === 2;

/**
 * @param {!MouseEvent|!Touch} ev
 * @param {!HTMLElement} element
 * @returns {!Point}
 */
function eventPosRelativeTo(ev, element) {
    let b = element.getBoundingClientRect();
    return new Point(ev.clientX - b.left, ev.clientY - b.top);
}

/**
 * @param {!HTMLElement} element
 * @param {!function(!Point, !MouseEvent|!TouchEvent) : void} grabHandler
 * @param {!function(!MouseEvent|!TouchEvent) : void} cancelHandler
 * @param {!function(undefined|!Point, !MouseEvent|!TouchEvent) : void} dragHandler
 * @param {!function(undefined|!Point, !MouseEvent|!TouchEvent) : void} dropHandler
 * @returns {!function() : void} Call this to dispose the watcher (removing any global callbacks it added).
 */
function watchDrags(element, grabHandler, cancelHandler, dragHandler, dropHandler) {
    return new DragWatcher(element, grabHandler, cancelHandler, dragHandler, dropHandler)
        .addListenersUntilResultInvoked();
}

/**
 * @param {!EventTarget} target
 * @param {!string} type
 * @param {!EventListener|!Function} listener
 * @returns {!function() : void}
 */
let addListenerUntilResultInvoked = (target, type, listener) => {
    target.addEventListener(type, listener);
    return () => target.removeEventListener(type, listener);
};

class DragWatcher {
    /**
     * @param {!HTMLElement} element
     * @param {!function(!Point, !MouseEvent|!TouchEvent) : void} grabHandler
     * @param {!function(!MouseEvent|!TouchEvent) : void} cancelHandler
     * @param {!function(undefined|!Point, !MouseEvent|!TouchEvent) : void} dragHandler
     * @param {!function(undefined|!Point, !MouseEvent|!TouchEvent) : void} dropHandler
     */
    constructor(element, grabHandler, cancelHandler, dragHandler, dropHandler) {
        /** @type {!HTMLElement} */
        this._element = element;
        /** @type {!function(!Point, !MouseEvent|!TouchEvent) : void} */
        this._grabHandler = grabHandler;
        /** @type {!function(!MouseEvent|!TouchEvent) : void} */
        this._cancelHandler = cancelHandler;
        /** @type {!function(undefined|!Point, !MouseEvent|!TouchEvent) : void} */
        this._dragHandler = dragHandler;
        /** @type {!function(undefined|!Point, !MouseEvent|!TouchEvent) : void} */
        this._dropHandler = dropHandler;
        /** @type {undefined|*} */
        this._grabPointerId = undefined;
        /** @type {!number} */
        this._grabActivityTime = window.performance.now();
        /** @type {undefined|!Point} */
        this._lastPos = undefined;
        /** @type {undefined|!MouseEvent|!TouchEvent} */
        this._lastEv = undefined;
    }

    addListenersUntilResultInvoked() {
        let e = this._element;
        let unregCalls = [
            addListenerUntilResultInvoked(e, 'mousedown', ev => this.handleMouseEventWith(ev, this.onDown)),
            addListenerUntilResultInvoked(document, 'mousemove', ev => this.handleMouseEventWith(ev, this.onMove)),
            addListenerUntilResultInvoked(document, 'mouseup', ev => this.handleMouseEventWith(ev, this.onUp)),
            addListenerUntilResultInvoked(document, 'mouseleave', ev => this.handleMouseEventWith(ev, this.onLeave)),
            addListenerUntilResultInvoked(document, 'mouseenter', ev => this.handleMouseEventWith(ev, this.onEnter)),

            addListenerUntilResultInvoked(e, 'touchstart', ev => this.handleTouchEventWith(ev, this.onDown)),
            addListenerUntilResultInvoked(e, 'touchmove', ev => this.handleTouchEventWith(ev, this.onMove)),
            addListenerUntilResultInvoked(e, 'touchend', ev => this.handleTouchEventWith(ev, this.onUp)),
            addListenerUntilResultInvoked(e, 'touchcancel', ev => this.handleTouchEventWith(ev, this.onCancel))
        ];

        return () => {
            for (let unregCall of unregCalls) {
                unregCall();
            }
        }
    }

    canRegrab() {
        return window.performance.now() >= this._grabActivityTime + ALLOW_REGRAB_WATCHDOG_TIME_MS;
    }

    /**
     * @param {!Point} pt
     * @param {*} id
     * @param {!MouseEvent|!TouchEvent} ev
     */
    onDown(pt, id, ev) {
        if (!isLeftClicking(ev)) {
            return;
        }
        if (this._grabPointerId !== undefined) {
            if (!this.canRegrab()) {
                return;
            }

            this._dropHandler(this._lastPos, this._lastEv);
        }

        this._grabPointerId = id;
        this._grabActivityTime = window.performance.now();
        this._lastPos = pt;
        this._lastEv = ev;

        this._grabHandler(pt, ev);
    }

    /**
     * @param {!Point} pt
     * @param {*} id
     * @param {!MouseEvent|!TouchEvent} ev
     */
    onMove(pt, id, ev) {
        if (this._grabPointerId !== id) {
            return;
        }

        if (!isLeftClicking(ev)) {
            // Dropped on another window with browser out of focus.
            this._lastPos = undefined;
            this._lastEv = undefined;
            this._grabPointerId = undefined;
            this._dropHandler(undefined, ev);
            return;
        }

        this._grabActivityTime = window.performance.now();
        this._lastPos = pt;
        this._lastEv = ev;

        this._dragHandler(pt, ev);
    }

    //noinspection JSUnusedLocalSymbols
    /**
     * @param {!Point} pt
     * @param {*} id
     * @param {!MouseEvent|!TouchEvent} ev
     */
    onCancel(pt, id, ev) {
        if (this._grabPointerId !== id) {
            return;
        }

        this._lastPos = undefined;
        this._lastEv = undefined;
        this._grabPointerId = undefined;

        this._cancelHandler(ev);
    }

    /**
     * @param {!Point} pt
     * @param {*} id
     * @param {!MouseEvent|!TouchEvent} ev
     */
    onUp(pt, id, ev) {
        if (!isLeftClicking(ev) || this._grabPointerId !== id) {
            return;
        }

        this._lastPos = undefined;
        this._lastEv = undefined;
        this._grabPointerId = undefined;

        this._dropHandler(pt, ev);
    }

    //noinspection JSUnusedLocalSymbols
    /**
     * @param {!Point} pt
     * @param {*} id
     * @param {!MouseEvent|!TouchEvent} ev
     */
    onLeave(pt, id, ev) {
        if (!isLeftClicking(ev) || this._grabPointerId !== id) {
            return;
        }

        this._grabActivityTime = window.performance.now();
        this._lastPos = undefined;
        this._lastEv = ev;

        this._dragHandler(undefined, ev);
    }

    //noinspection JSUnusedLocalSymbols
    /**
     * @param {!Point} pt
     * @param {*} id
     * @param {!MouseEvent|!TouchEvent} ev
     */
    onEnter(pt, id, ev) {
        if (isLeftClicking(ev) || this._grabPointerId !== id) {
            return;
        }

        this._lastPos = undefined;
        this._lastEv = undefined;
        this._grabPointerId = undefined;

        this._dropHandler(undefined, ev);
    }

    /**
     * @param {!MouseEvent|!Touch} ev
     * @returns {!Point}
     */
    relativeEventPos(ev) {
        return eventPosRelativeTo(ev, this._element);
    }

    /**
     * @param {!TouchEvent} ev
     * @param {!function(!Point, *, !MouseEvent|!TouchEvent) : void} handler
     */
    handleTouchEventWith(ev, handler) {
        for (let i = 0; i < ev.changedTouches.length; i++) {
            let touch = ev.changedTouches[i];
            handler.call(this, this.relativeEventPos(touch), touch.identifier, ev);
        }
    }

    /**
     * @param {!MouseEvent} ev
     * @param {!function(!Point, *, !MouseEvent|!TouchEvent) : void} handler
     */
    handleMouseEventWith(ev, handler) {
        handler.call(this, this.relativeEventPos(ev), MOUSE_ID, ev);
    }
}

export {watchDrags, isLeftClicking, isMiddleClicking, eventPosRelativeTo};
