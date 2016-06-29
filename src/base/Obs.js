import DetailedError from "src/base/DetailedError.js"

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

export { Observable, ObservableSource, ObservableValue }
