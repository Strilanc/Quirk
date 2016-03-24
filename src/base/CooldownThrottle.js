/**
 * Performs an action when triggered, but defers the action if it happens too soon after the last one.
 *
 * Triggering multiple times during the cooldown period only results in one action being performed.
 */
export default class CooldownThrottle {
    /**
     * @param {!function(void) : void} action
     * @param {!number} cooldownMs
     * @constructor
     */
    constructor(action, cooldownMs) {
        /** @type {!function(void) : void} */
        this.action = action;
        /** @type {!number} */
        this.cooldownDuration = cooldownMs;

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

    /**
     * Asks for the action to be performed as soon as possible.
     * (No effect if the action was already requested but not performed yet.)
     */
    trigger() {
        switch (this._state) {
            case 'idle':
                let remainingCooldownDuration = this.cooldownDuration - (performance.now() - this._lastCompletionTime);
                if (remainingCooldownDuration > 0) {
                    this._state = 'waiting';
                    this._forceIdleTriggerAfter(remainingCooldownDuration);
                } else {
                    this._state = 'running';
                    try {
                        this.action();
                    } finally {
                        this._lastCompletionTime = performance.now();
                        if (this._state === 'running-and-triggered') {
                            this._state = 'waiting';
                            this._forceIdleTriggerAfter(this.cooldownDuration);
                        } else {
                            this._state = 'idle';
                        }
                    }
                }
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
        setTimeout(() => {
            this._state = 'idle';
            this._lastCompletionTime = -Infinity;
            this.trigger()
        }, duration);
    }
}
