// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Performs an action when triggered, but defers the action if it happens too soon after the last one.
 *
 * Triggering multiple times during the cooldown period only results in one action being performed.
 */
class CooldownThrottle {
    /**
     * @param {!function() : void} action
     * @param {!number} cooldownMs
     * @param {!number} slowActionCooldownPumpUpFactor
     * @param {!boolean=false} waitWithRequestAnimationFrame
     * @constructor
     */
    constructor(action, cooldownMs, slowActionCooldownPumpUpFactor=0, waitWithRequestAnimationFrame=false) {
        /** @type {!function() : void} */
        this.action = action;
        /** @type {!number} */
        this.cooldownDuration = cooldownMs;
        /** @type {!number} */
        this.slowActionCooldownPumpupFactor = slowActionCooldownPumpUpFactor;
        /** @type {!boolean} */
        this._waitWithRequestAnimationFrame = waitWithRequestAnimationFrame;

        /**
         * @type {!string}
         * @private
         */
        this._state = 'idle';
        /**
         * @type {!number}
         * @private
         */
        this._cooldownStartTime = -Infinity;
    }

    _triggerIdle() {
        // Still cooling down?
        let remainingCooldownDuration = this.cooldownDuration - (performance.now() - this._cooldownStartTime);
        if (remainingCooldownDuration > 0) {
            this._forceIdleTriggerAfter(remainingCooldownDuration);
            return;
        }

        // Go go go!
        this._state = 'running';
        let t0 = performance.now();
        try {
            this.action();
        } finally {
            let dt = performance.now() - t0;
            this._cooldownStartTime = performance.now() + (dt * this.slowActionCooldownPumpupFactor);
            // Were there any triggers while we were running?
            if (this._state === 'running-and-triggered') {
                this._forceIdleTriggerAfter(this.cooldownDuration);
            } else {
                this._state = 'idle';
            }
        }
    }

    /**
     * Asks for the action to be performed as soon as possible.
     * (No effect if the action was already requested but not performed yet.)
     */
    trigger() {
        switch (this._state) {
            case 'idle':
                this._triggerIdle();
                break;
            case 'waiting':
                // Already triggered. Do nothing.
                break;
            case 'running':
                // Re-trigger.
                this._state = 'running-and-triggered';
                break;
            case 'running-and-triggered':
                // Already re-triggered. Do nothing.
                break;
            default:
                throw new Error('Unrecognized throttle state: ' + this._state);
        }
    }

    /**
     * @private
     */
    _forceIdleTriggerAfter(duration) {
        this._state = 'waiting';

        // setTimeout seems to refuse to run while I'm scrolling with my mouse wheel on chrome in windows.
        // So, for stuff that really has to come back in that case, we also support requestAnimationFrame looping.
        if (this._waitWithRequestAnimationFrame) {
            let iter;
            let start = performance.now();
            iter = () => {
                if (performance.now() < start + duration) {
                    requestAnimationFrame(iter);
                    return;
                }
                this._state = 'idle';
                this._cooldownStartTime = -Infinity;
                this.trigger()
            };
            iter();
        } else {
            setTimeout(() => {
                this._state = 'idle';
                this._cooldownStartTime = -Infinity;
                this.trigger()
            }, duration);
        }
    }


}

export {CooldownThrottle}
