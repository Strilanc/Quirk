/**
 * Performs an action when triggered, but defers the action if it happens too soon after the last one.
 *
 * Triggering multiple times during the cooldown period only results in one action being performed.
 */
class CooldownThrottle {
    /**
     * @param {!function(void) : void} action
     * @param {!number} cooldownMs
     * @param {!boolean=false} waitWithRequestAnimationFrame
     * @constructor
     */
    constructor(action, cooldownMs, waitWithRequestAnimationFrame=false) {
        /** @type {!function(void) : void} */
        this.action = action;
        /** @type {!number} */
        this.cooldownDuration = cooldownMs;
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
        this._lastCompletionTime = -Infinity;
    }

    _triggerIdle() {
        // Still cooling down?
        let remainingCooldownDuration = this.cooldownDuration - (performance.now() - this._lastCompletionTime);
        if (remainingCooldownDuration > 0) {
            this._forceIdleTriggerAfter(remainingCooldownDuration);
            return;
        }

        // Go go go!
        this._state = 'running';
        try {
            this.action();
        } finally {
            // Were there any triggers while we were running?
            this._lastCompletionTime = performance.now();
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
                this._lastCompletionTime = -Infinity;
                this.trigger()
            };
            iter();
        } else {
            setTimeout(() => {
                this._state = 'idle';
                this._lastCompletionTime = -Infinity;
                this.trigger()
            }, duration);
        }
    }


}

export {CooldownThrottle}
