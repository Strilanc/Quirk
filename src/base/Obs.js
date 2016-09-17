import {DetailedError} from "src/base/DetailedError.js"
import {CooldownThrottle} from "src/base/CooldownThrottle.js"

/**
 * An observable sequence of events.
 */
class Observable {
    /**
     * @param {!function(!function(T):void): (!function(void):void)} subscribe
     * @template T
     */
    constructor(subscribe) {
        /**
         * @type {!(function(!(function(T): void)): !(function(void): void))}
         * @template T
         * @private
         */
        this._subscribe = subscribe;
    }

    /**
     * @param {!function(T):void} observer
     * @returns {!function(void):void} unsubscriber
     * @template T
     */
    subscribe(observer) {
        return this._subscribe(observer);
    }

    /**
     * @param {T} items
     * @returns {!Observable.<T>} An observable that immediately forwards all the given items to any new subscriber.
     * @template T
     */
    static of(...items) {
        return new Observable(observer => {
            for (let item of items) {
                observer(item);
            }
            return () => {};
        });
    }

    /**
     * Subscribes to the receiving observable for a moment and returns any collected items.
     * @returns {!Array.<T>}
     * @template T
     */
    snapshot() {
        let result = [];
        let unsub = this.subscribe(e => result.push(e));
        unsub();
        return result;
    }

    /**
     * @param {!function(TIn) : TOut} transformFunc
     * @returns {!Observable.<TOut>} An observable with the same items, but transformed by the given function.
     * @template TIn, TOut
     */
    map(transformFunc) {
        return new Observable(observer => this.subscribe(item => observer(transformFunc(item))));
    }

    /**
     * @param {!function(T):void} action
     * @returns {!Observable.<T>}
     * @template T
     */
    peek(action) {
        return this.map(e => { action(); return e; });
    }

    /**
     * @returns {!Observable.<T>} An observable that forwards all the items from all the observables observed by the
     * receiving observable of observables.
     * @template T
     */
    flatten() {
        return new Observable(observer => {
            let unsubs = [];
            unsubs.push(this.subscribe(observable => unsubs.push(observable.subscribe(observer))));
            return () => {
                for (let unsub of unsubs) {
                    unsub()
                }
            }
        });
    }

    /**
     * Starts a timer after each completed send, delays sending any more values until the timer expires, and skips
     * intermediate values when a newer value arrives from the source while the timer is still running down.
     * @param {!number} cooldownMillis
     * @returns {!Observable.<T>}
     * @template T
     */
    throttleLatest(cooldownMillis) {
        return new Observable(observer => {
            let latest = undefined;
            let isKilled = false;
            let throttle = new CooldownThrottle(() => {
                if (!isKilled) {
                    observer(latest);
                }
            }, cooldownMillis);
            let unsub = this.subscribe(e => {
                latest = e;
                throttle.trigger();
            });
            return () => {
                isKilled = true;
                unsub();
            };
        });
    }

    /**
     * @param {!HTMLElement|!HTMLDocument} element
     * @param {!string} eventKey
     * @returns {!Observable.<*>} An observable corresponding to an event fired from an element.
     */
    static elementEvent(element, eventKey) {
        return new Observable(observer => {
            element.addEventListener(eventKey, observer);
            return () => element.removeEventListener(eventKey, observer);
        });
    }

    /**
     *
     * @param {!int} count
     * @returns {!Observable.<T>
     * @template T
     */
    skip(count) {
        return new Observable(observer => {
            let remaining = count;
            return this.subscribe(item => {
                if (remaining > 0) {
                    remaining -= 1;
                } else {
                    observer(item);
                }
            })
        })
    }

    /**
     * @returns {!Observable.<T>} An observable with the same events, but filtering out any event value that's the same
     * as the previous one.
     * @template T
     */
    whenDifferent(equater = undefined) {
        let eq = equater || ((e1, e2) => e1 === e2);
        return new Observable(observer => {
            let hasLast = false;
            let last = undefined;
            return this.subscribe(item => {
                if (!hasLast || !eq(last, item)) {
                    last = item;
                    hasLast = true;
                    observer(item);
                }
            });
        });
    }
}

class ObservableSource {
    constructor() {
        /**
         * @type {!Array.<!function(T):void>}
         * @private
         * @template T
         */
        this._observers = [];
        /**
         * @type {!Observable.<T>}
         * @private
         * @template T
         */
        this._observable = new Observable(observer => {
            // HACK: not re-entrant safe!
            this._observers.push(observer);
            let didRun = false;
            return () => {
                if (!didRun) {
                    didRun = true;
                    this._observers.splice(this._observers.indexOf(observer), 1);
                }
            };
        });
    }

    /**
     * @returns {!Observable.<T>}
     * @template T
     */
    observable() {
        return this._observable;
    }

    /**
     * @param {T} eventValue
     * @template T
     */
    send(eventValue) {
        // HACK: not re-entrant safe!
        for (let obs of this._observers) {
            obs(eventValue);
        }
    }
}

class ObservableValue {
    /**
     * @param {T=undefined} initialValue
     * @template T
     */
    constructor(initialValue=undefined) {
        this._value = initialValue;
        this._source = new ObservableSource();
        this._observable = new Observable(observer => {
            // HACK: not re-entrant safe!
            observer(this._value);
            return this._source.observable().subscribe(observer);
        });
    }

    /**
     * @returns {!Observable}
     */
    observable() {
        return this._observable;
    }

    /**
     * @param {T} newValue
     * @template T
     */
    set(newValue) {
        this._value = newValue;
        this._source.send(newValue);
    }

    /**
     * @returns {T} The current value.
     * @template T
     */
    get() {
        return this._value;
    }
}

export {Observable, ObservableSource, ObservableValue}
