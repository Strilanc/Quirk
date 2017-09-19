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

import {CooldownThrottle} from "src/base/CooldownThrottle.js"

/**
 * An observable sequence of events.
 *
 * WARNING: this class is not written to be re-entrant safe! If an observable ends up triggering itself, there may be
 * unexpected bugs.
 */
class Observable {
    /**
     * @param {!function(!function(T):void): (!function():void)} subscribe
     * @template T
     */
    constructor(subscribe) {
        /**
         * @type {!(function(!(function(T): void)): !(function(): void))}
         * @template T
         * @private
         */
        this._subscribe = subscribe;
    }

    /**
     * @param {!function(T):void} observer
     * @returns {!function():void} unsubscriber
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
     * @param {!function(T) : !boolean} predicate
     * @returns {!Observable.<T>} An observable with the same items, but skipping items that don't match the predicate.
     * @template T
     */
    filter(predicate) {
        return new Observable(observer => this.subscribe(item => { if (predicate(item)) { observer(item); }}));
    }

    /**
     * @param {!Observable.<T2>} other
     * @param {!function(T1, T2): TOut} mergeFunc
     * @returns {!Observable.<TOut>}
     * @template T1, T2, TOut
     */
    zipLatest(other, mergeFunc) {
        return new Observable(observer => {
            let has1 = false;
            let has2 = false;
            let last1;
            let last2;
            let unreg1 = this.subscribe(e1 => {
                last1 = e1;
                has1 = true;
                if (has2) {
                    observer(mergeFunc(last1, last2));
                }
            });
            let unreg2 = other.subscribe(e2 => {
                last2 = e2;
                has2 = true;
                if (has1) {
                    observer(mergeFunc(last1, last2));
                }
            });
            return () => { unreg1(); unreg2(); };
        });
    }

    /**
     * Returns an observable that keeps requesting animations frame callbacks and calling observers when they arrive.
     * @returns {!Observable.<undefined>}
     */
    static requestAnimationTicker() {
        return new Observable(observer => {
            let iter;
            let isDone = false;
            iter = () => {
                if (!isDone) {
                    observer(undefined);
                    window.requestAnimationFrame(iter);
                }
            };
            iter();
            return () => { isDone = true; };
        });
    }

    /**
     * @returns {!Observable.<T>} An observable that subscribes to each sub-observables arriving on this observable
     * in turns, only forwarding items from the latest sub-observable.
     * @template T
     */
    flattenLatest() {
        return new Observable(observer => {
            let unregLatest = () => {};
            let isDone = false;
            let unregAll = this.subscribe(subObservable => {
                if (isDone) {
                    return;
                }
                let prevUnreg = unregLatest;
                unregLatest = subObservable.subscribe(observer);
                prevUnreg();
            });
            return () => {
                isDone = true;
                unregLatest();
                unregAll();
            }
        });
    }

    /**
     * @param {!function(T):void} action
     * @returns {!Observable.<T>}
     * @template T
     */
    peek(action) {
        return this.map(e => { action(e); return e; });
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
     * @returns {!Observable.<T>}
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
