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
         * @type {null|!{id: !number, cancel: !boolean}}
         * @private
         */
        this._timeoutState = null;
        /**
         * @type {!number}
         * @private
         */
        this._nextAllowedCallTime = performance.now();
    }

    /**
     * Asks for the action to be performed as soon as possible.
     * (No effect if the action was already requested but not performed yet.)
     */
    trigger() {
        // Give it a try.
        let dt = this._tryCallWithoutScheduling();
        if (dt === null) {
            return; // It worked!
        }

        // We need to wait.
        if (this._timeoutState !== null) {
            return; // Already scheduled.
        }

        // Schedule.
        let state = {id: 0, cancel: false};
        this._timeoutState = state;
        state.id = setTimeout(() => {
            if (!state.cancel) {
                this._tryCallWithoutScheduling();
            }
        }, dt);
    }

    /**
     * @returns {null|!number}
     * @private
     */
    _tryCallWithoutScheduling() {
        // Check cooldown.
        let t = performance.now();
        let dt = this._nextAllowedCallTime - t;
        if (dt > 0) {
            return dt;
        }

        // Preempt scheduled call.
        if (this._timeoutState !== null) {
            this._timeoutState.cancel = true;
            clearTimeout(this._timeoutState.id);
            this._timeoutState = null;
        }

        // Run.
        this._nextAllowedCallTime = t + this.cooldownDuration;
        this.action();
        return null;
    }
}
