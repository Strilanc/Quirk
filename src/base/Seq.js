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

import {DetailedError} from "src/base/DetailedError.js"

export const THROW_IF_EMPTY = { if_same_instance_as_this_then_throw: true };

/**
 * A private sygil/sentinel value that shouldn't ever be present in a sequence, and so can be used as a placeholder for
 * "not set yet" (unlike undefined or null, which are allowed to appear in sequences).
 */
const EMPTY_SYGIL = { not_a_normal_value: true };

const GENERIC_ARRAY_TYPES = [
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray
];

const isIterable = obj => typeof Object(obj)[Symbol.iterator] === 'function';

const emptyFallback = (result, alternative, errorMessage) => {
    if (result !== EMPTY_SYGIL) {
        return result;
    }
    if (alternative === THROW_IF_EMPTY) {
        throw new Error(errorMessage);
    }
    return alternative;
};


/**
 * A fluent wrapper for iterable sequences of values, exposing useful methods and properties.
 */
class Seq {
    /**
     * Wraps the given array, collection, or other iterable.
     * Use fromGenerator for wrapping generator functions.
     *
     * @param {!(T[])|!Seq.<T>|!Iterable.<T>|*} obj
     * @param {!boolean=} isIteratorFunction
     * @template T
     */
    constructor(obj, isIteratorFunction=false) {
        let iterable;
        let iterator;
        if (obj instanceof Seq) {
            // Avoid double-wrapping.
            iterable = obj._iterable;
            iterator = obj[Symbol.iterator];
        } else if (isIteratorFunction) {
            iterable = {[Symbol.iterator]: obj};
            iterator = obj;
        } else {
            if (!isIterable(obj)) {
                throw new Error(`Not iterable: ${obj}`);
            }
            iterable = obj;
            iterator = obj[Symbol.iterator].bind(obj);
        }

        /**
         * The generator, array, or other iterable object wrapped by this Seq instance.
         * @type {!(T[])|!Iterable.<T>|*}
         * @template T
         */
        this._iterable = iterable;

        /**
         * Iterates over the sequence's items.
         * @returns {!Iterator.<T>}
         * @template T
         */
        this[Symbol.iterator] = iterator;
    }

    /**
     * Creates a re-usable iterable from a generator function like <code>function*() { yield 1; }</code>.
     *
     * Note that the obvious alternative, <code>new Seq(function*(){yield 1;}()}</code>, stops working after the
     * iterable has been iterated once.
     *
     * @param {!function() : Iterator.<T>} generatorFunction
     * @returns {!Seq.<T>}
     * @template T
     */
    static fromGenerator(generatorFunction) {
        return new Seq(generatorFunction, true);
    }

    /**
    * Determines if the given iterable contains the same items as this sequence.
    * @param {*|!(T[])|!Seq.<T>|!Iterable.<T>} other
    * @param {!function(T, T|*) : !boolean} comparator
     * @template T
    */
    isEqualTo(other, comparator = (e1, e2) => e1 === e2) {
        if (!isIterable(other)) {
            return false;
        }
        if (other === this) {
            return true;
        }
        let iter2 = other[Symbol.iterator]();
        for (let e1 of this._iterable) {
            let e2 = iter2.next();
            if (e2.done || !comparator(e1, e2.value)) {
                return false;
            }
        }
        return iter2.next().done;
    }

    /**
     * Returns an array containing the items of this sequence.
     * @returns {!(T[])}
     * @template T
     */
    toArray() {
        return Array.from(this._iterable);
    }

    /**
     * Returns a Float32Array containing the items of this sequence.
     * @returns {!Float32Array}
     */
    toFloat32Array() {
        let n = this.tryPeekCount();
        if (n === undefined) {
            return new Float32Array(this.toArray());
        }

        let buf = new Float32Array(n);
        let i = 0;
        for (let item of this._iterable) {
            buf[i++] = item;
        }
        return buf;
    }

    /**
     * Returns a set containing the distinct items of this sequence.
     * @returns {!Set.<T>}
     * @template T
     */
    toSet() {
        return new Set(this._iterable);
    }

    /**
     * Returns a string representation of the receiving sequence's items, separated by the given joiner.
     * @param {!string} joiner
     * @returns {!string}
     */
    join(joiner) {
        return this.toArray().join(joiner);
    }


    /**
     * Returns a string representation of the receiving sequence.
     * @returns {!string}
     */
    toString() {
        return `Seq[${this.join(", ")}]`;
    }

    /**
     * Returns a sequence of natural numbers, starting at 0 and incrementing until just before the given count.
     * @param {!int} count
     * @returns {!Seq.<!int>}
     */
    static range(count) {
        if (!Number.isInteger(count) || count < 0) {
            throw new DetailedError("bad count", {count});
        }

        return Seq.fromGenerator(function*() {
            for (let i = 0; i < count; i++) {
                yield i;
            }
        });
    }

    /**
     * Returns the sequence of natural numbers, starting at 0 and incrementing without bound.
     * @returns {!Seq.<!int>}
     */
    static naturals() {
        return Seq.fromGenerator(function*() {
            let i = 0;
            //noinspection InfiniteLoopJS
            while (true) { //eslint-disable-line no-constant-condition
                yield i;
                i++;
            }
        })
    }

    /**
     * Returns a sequence of the same item repeated the given number of times.
     * @param {T} item
     * @param {!int} repeatCount
     * @returns {!Seq.<T>}
     * @template T
     */
    static repeat(item, repeatCount) {
        if (repeatCount < 0) {
            throw new Error("needed repeatCount >= 0");
        }

        return Seq.fromGenerator(function*() {
            for (let i = 0; i < repeatCount; i++) {
                yield item;
            }
        })
    }

    /**
     * Returns a sequence with the same items, but precomputed and stored. If the sequence is already solid, e.g. it is
     * backed by an array, then it is returned directly (and unchanged).
     * @returns {!Seq.<T>}
     * @template T
     */
    solidify() {
        let knownSolidTypes = [
            Float32Array,
            Float64Array,
            Int8Array,
            Int16Array,
            Int32Array,
            Uint8Array,
            Uint16Array,
            Uint32Array
        ];

        if (Array.isArray(this._iterable)) {
            return this;
        }
        for (let t of knownSolidTypes) {
            if (this._iterable instanceof t) {
                return this;
            }
        }
        return new Seq(this.toArray());
    }

    /**
     * Returns a sequence iterating the results of applying a transformation to the items of the receiving sequence.
     * @param {!function(T): R} projection
     * @returns {!Seq.<T>}
     * @template T, R
     */
    map(projection) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                yield projection(e);
            }
        });
    }

    /**
     * Returns a sequence iterating the results of applying a transformation to the indexed items of the receiving
     * sequence.
     * @param {!function(T, int): R} projection
     * @returns {!Seq.<T>}
     * @template T, R
     */
    mapWithIndex(projection) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let i = 0;
            for (let e of seq) {
                yield projection(e, i);
                i += 1;
            }
        });
    }

    /**
     * Returns a sequence iterating the concatenated results of applying an iterable-returning transformation to the
     * items of the receiving sequence.
     * @param {!function(T): !Iterable<R>} sequenceProjection
     * @returns {!Seq.<T>}
     * @template T, R
     */
    flatMap(sequenceProjection) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                yield* sequenceProjection(e);
            }
        });
    }

    /**
     * Returns a sequence iterating the items of the receiving sequence that match a predicate. Items that don't match
     * the predicate, by causing it to return a falsy value, are skipped.
     * @param {!function(T) : !boolean} predicate
     * @returns {!Seq.<T>}
     * @template T
     */
    filter(predicate) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                if (predicate(e)) {
                    yield e;
                }
            }
        });
    }

    /**
     * Returns a sequence iterating the items of the receiving sequence that match a predicate over the item and the
     * item's index. Items that don't match the predicate are skipped.
     * @param {!function(T, int) : !boolean} predicate
     * @returns {!Seq.<T>}
     * @template T
     */
    filterWithIndex(predicate) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let i = 0;
            for (let e of seq) {
                if (predicate(e, i)) {
                    yield e;
                }
                i++;
            }
        });
    }

    /**
     * Combines the items of a sequence into a single result by iteratively applying a combining function. If the
     * sequence is empty, then either an error is thrown or the given alternative value is returned.
     * @param {!function(T, T) : T} combiner
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template T, A
     */
    fold(combiner, emptyErrorAlternative = THROW_IF_EMPTY) {
        let accumulator = EMPTY_SYGIL;
        for (let e of this._iterable) {
            accumulator = accumulator === EMPTY_SYGIL ? e : combiner(accumulator, e);
        }
        return emptyFallback(
            accumulator,
            emptyErrorAlternative,
            "Folded empty sequence without providing an alternative result.");
    }

    /**
     * Combines the items of a sequence into a single result by starting with a seed accumulator and iteratively
     * applying an aggregation function to the accumulator and next item to get the next accumulator.
     * @param {!function(A, T) : A} aggregator Computes the next accumulator value.
     * @param {A} seed The initial accumulator value.
     * @returns {A}
     * @template T, A
     */
    aggregate(seed, aggregator) {
        let accumulator = seed;
        for (let e of this._iterable) {
            accumulator = aggregator(accumulator, e);
        }
        return accumulator;
    }

    /**
     * Combines this sequence with another by passing items with the same index through a combining function.
     * If one sequence is longer than the other, the lonely tail is discarded.
     *
     * @param {!(T2[])|!Seq.<T2>|!Iterable.<T2>} other
     * @param {!function(T, T2) : R} combiner
     *
     * @returns {!Seq.<R>}
     *
     * @template T, T2, R
     */
    zip(other, combiner) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let iter2 = other[Symbol.iterator]();
            for (let item1 of seq) {
                let item2 = iter2.next();
                if (item2.done) {
                    break;
                }
                yield combiner(item1, item2.value);
            }
        });
    }

    /**
     * Returns the largest value in the sequence, as determined by the `<` operator. If the sequence  is empty, then
     * either an error is thrown or the given alternative value is returned.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template T, A
     */
    max(emptyErrorAlternative = THROW_IF_EMPTY) {
        return this.fold((e1, e2) => e1 < e2 ? e2 : e1, emptyErrorAlternative);
    }

    /**
     * Returns the smallest value in the sequence, as determined by the `<` operator. If the sequence  is empty, then
     * either an error is thrown or the given alternative value is returned.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template T, A
     */
    min(emptyErrorAlternative = THROW_IF_EMPTY) {
        return this.fold((e1, e2) => e1 < e2 ? e1 : e2, emptyErrorAlternative);
    }

    /**
     * Returns the highest-scoring item in the sequence, as determined by a scoring function.
     *
     * @param {!function(T) : !number} projection Determines the score of an item.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @param {(function(A, A): !boolean)=} isALessThanBComparator The operation used to compare scores.
     * @returns {T|A}
     * @template T, A
     */
    maxBy(projection, emptyErrorAlternative = THROW_IF_EMPTY, isALessThanBComparator = (e1, e2) => e1 < e2) {
        let curMaxItem = EMPTY_SYGIL;
        let curMaxScore = EMPTY_SYGIL;
        for (let item of this._iterable) {
            // Delay computing the score for the first item, so that singleton lists never touch the score function.
            if (curMaxItem === EMPTY_SYGIL) {
                curMaxItem = item;
                continue;
            }
            if (curMaxScore === EMPTY_SYGIL) {
                curMaxScore = projection(curMaxItem);
            }

            let score = projection(item);
            if (isALessThanBComparator(curMaxScore, score)) {
                curMaxItem = item;
                curMaxScore = score;
            }
        }

        return emptyFallback(curMaxItem, emptyErrorAlternative, "Can't maxBy an empty sequence.");
    }

    /**
     * Returns the lowest-scoring item in the sequence, as determined by a scoring function.
     *
     * @param {!function(T) : !number} projection Determines the score of an item.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @param {(function(A, A): !boolean)=} isALessThanBComparator The operation used to compare scores.
     * @returns {T|A}
     * @template T, A
     */
    minBy(projection, emptyErrorAlternative = THROW_IF_EMPTY, isALessThanBComparator = (e1, e2) => e1 < e2) {
        return this.maxBy(projection, emptyErrorAlternative, (e1, e2) => isALessThanBComparator(e2, e1));
    }

    /**
     * Determines if any of the items in the sequence matches the given predicate.
     * @param {!function(T) : !boolean} predicate
     * @returns {!boolean}
     * @template T
     */
    any(predicate) {
        for (let e of this._iterable) {
            if (predicate(e)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determines if every item in the sequence matches the given predicate.
     * @param {!function(T) : !boolean} predicate
     * @returns {!boolean}
     * @template T
     */
    every(predicate) {
        return !this.any(e => !predicate(e));
    }

    /**
     * Determines if the sequence contains a given value or not, as determined by the <code>===</code> operator.
     * @param {T|*} value
     * @returns {!boolean}
     * @template T
     */
    contains(value) {
        return this.any(e => e === value);
    }

    /**
     * Adds up the numbers in the sequence, using the `+` operator, and returns the total.
     * The empty sum is defined to be 0, to satisfy the invariant that X.concat([s]).sum() === X.sum() + s.
     * @returns {T|!number|*}
     * @template T
     */
    sum() {
        let total = 0;
        let first = true;
        for (let e of this._iterable) {
            total = first ? e : total + e;
            first = false;
        }
        return total;
    }

    /**
     * Multiplies up the numbers in the sequence, using the `*` operator, and returns the total.
     * The empty product is defined to be 1, to satisfy the invariant that X.concat([s]).product() === X.product() * s.
     * @returns {T|!number|*}
     * @template T
     */
    product() {
        return this.fold((a, e) => a * e, 1);
    }

    /**
     * Accumulates the items of a sequence into a seed, while yielding the results. For example,
     * <code>[1, 2, 3].scan((a, e) => a + e, "a")</code> yields <code>["a", "a1", "a12", "a123"]</code> and
     * <code>[1, 2, 3].scan((e1, e2) => e1 + e2, 0)</code> yields <code>[0, 1, 3, 6]</code<.
     *
     * @param {A} seed
     * @param {!function(A, T) : A} aggregator
     * @returns {!Seq.<A>}
     * @template T, A
     */
    scan(seed, aggregator) {
        let seq = this._iterable;

        return Seq.fromGenerator(function*() {
            let accumulator = seed;
            yield accumulator;
            for (let e of seq) {
                accumulator = aggregator(accumulator, e);
                yield accumulator;
            }
        });
    }

    /**
     * Returns a sequence containing the same items, but in the opposite order.
     * @returns {!Seq.<T>}
     * @template T
     */
    reverse() {
        return new Seq(this.toArray().reverse());
    }

    /**
     * Flattens this sequence of iterables into a concatenated sequence.
     * @returns {!Seq.<C>}
     * @template C
     */
    flatten() {
        let seqSeq = this._iterable;
        return Seq.fromGenerator(function*() {
            for (let seq of seqSeq) {
                yield* seq;
            }
        });
    }

    /**
     * Returns a sequence that iterates the receiving sequence's items and then the given iterable's items.
     * @param {*|!(A[])|!Seq.<A>} other
     * @returns {!Seq.<T|A>}
     * @template T, A
     */
    concat(other) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            yield* seq;
            yield* other;
        });
    }

    /**
     * Returns a sequence with the same items, except the item at the given index is replaced.
     * If the index is not reached during iteration, an exception is thrown.
     * @param {!int} index
     * @param {A} overlayedItem
     * @returns {!Seq.<T|A>}
     * @template T, A
     */
    withOverlayedItem(index, overlayedItem) {
        if (index < 0) {
            throw new Error("needed index >= 0");
        }
        let self = this;
        return Seq.fromGenerator(function*() {
            if (self.tryPeekCount() !== undefined && index >= self.tryPeekCount()) {
                throw new Error("needed index <= count");
            }
            let i = 0;
            for (let e of self._iterable) {
                yield i === index ? overlayedItem : e;
                i++;
            }
            if (i <= index) {
                throw new Error("sequence ended before overlay " +
                    "[withOverlayedItem(${index}, ${overlayedItem})]");
            }
        });
    }

    /**
     * Returns a sequence with the same items, except the item at the given index is transformed by the given function.
     * If the index is not reached during iteration, an exception is thrown.
     * @param {!int} index
     * @param {!function(T) : A} itemTransformation
     * @returns {!Seq.<T|A>}
     * @template T, A
     */
    withTransformedItem(index, itemTransformation) {
        if (index < 0) {
            throw new Error("needed index >= 0");
        }
        let self = this;
        return Seq.fromGenerator(function*() {
            if (self.tryPeekCount() !== undefined && index >= self.tryPeekCount()) {
                throw new Error("needed index <= count");
            }
            let i = 0;
            for (let e of self._iterable) {
                yield i === index ? itemTransformation(e) : e;
                i++;
            }
            if (i <= index) {
                throw new Error("sequence ended before transformation " +
                    "[withTransformedItem(${index}, ${itemTransformation})]");
            }
        });
    }

    /**
     * Returns a sequence with the same items, except the given extra item is yielded when the given index is reached.
     * If the insertion index is the length of the sequence, the inserted item is the last yielded item.
     * If the insertion index is past the length of the sequence, an error is thrown (but only at the end of iteration).
     *
     * @param {A} item
     * @param {!int} index
     * @returns {!Seq.<T|A>}
     * @template T, A
     */
    withInsertedItem(index, item) {
        if (index < 0) {
            throw new Error("needed index >= 0");
        }
        let self = this;
        return Seq.fromGenerator(function*() {
            if (self.tryPeekCount() !== undefined && index > self.tryPeekCount()) {
                throw new Error("needed index <= count");
            }
            let i = 0;
            for (let e of self._iterable) {
                if (i === index) {
                    yield item;
                }
                i++;
                yield e;
            }
            if (i === index) {
                yield item;
            }
            if (i < index) {
                throw new Error("sequence ended before insertion [withInsertedItem(${index}, ${item})]");
            }
        });
    }

    /**
     * Returns a sequence with the same items, until one of the items fails to match the given predicate. Then the
     * sequence is cut short just before yielding that item.
     * @param {!function(T) : !boolean} predicate
     * @returns {!Seq.<T>}
     * @template T
     */
    takeWhile(predicate) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                if (!predicate(e)) {
                    break;
                }
                yield e;
            }
        });
    }

    /**
     * Returns a sequence with the same items, except items are dropped from the end of the sequence until the last item
     * doesn't satisfy the given predicate.
     * @param {!function(T) : !boolean} predicate
     * @returns {!Seq.<T>}
     * @template T
     */
    skipTailWhile(predicate) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let tail = [];
            for (let e of seq) {
                if (predicate(e)) {
                    tail.push(e);
                } else {
                    yield* tail;
                    tail = [];
                    yield e;
                }
            }
        });
    }

    /**
     * Returns a sequence with the same items, except items at the start of the sequence are skipped until an item
     * doesn't satisfy the given predicate.
     * @param {!function(T) : !boolean} predicate
     * @returns {!Seq.<T>}
     * @template T
     */
    skipWhile(predicate) {
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let matched = true;
            for (let e of seq) {
                matched = matched && predicate(e);
                if (!matched) {
                    yield e;
                }
            }
        });
    }

    /**
     * Returns a sequence with the same items, except cut short if it exceeds the given maximum count.
     * @param {!int} maxTakeCount
     * @returns {!Seq.<T>}
     * @template T
     */
    take(maxTakeCount) {
        if (maxTakeCount < 0) {
            throw new Error("needed maxTakeCount >= 0");
        }
        if (maxTakeCount === 0) {
            return new Seq([]);
        }
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let i = 0;
            for (let e of seq) {
                yield e;
                i++;
                if (i >= maxTakeCount) {
                    break;
                }
            }
        });
    }

    /**
     * Returns a sequence with the same items, except the give number are skipped at the start.
     * @param {!int} maxSkipCount
     * @returns {!Seq.<T>}
     * @template T
     */
    skip(maxSkipCount) {
        if (maxSkipCount < 0) {
            throw new Error("needed maxSkipCount >= 0");
        }
        if (maxSkipCount === 0) {
            return this;
        }

        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let i = 0;
            for (let e of seq) {
                if (i >= maxSkipCount) {
                    yield e;
                }
                i++;
            }
        });
    }

    /**
     * Returns a sequence with the same items, except later items with the same key as earlier items get skipped.
     *
     * @param {!function(T) : K} keySelector Items are considered distinct when their image, through this function, is
     * not already in the Set of seen images. The return type must support being inserted into a Set.
     * @returns {!Seq.<T>}
     * @template T, K
     */
    distinctBy(keySelector) {
        let seq = this;
        return Seq.fromGenerator(function() {
            let keySet = new Set();
            return seq.filter(e => {
                let key = keySelector(e);
                if (keySet.has(key)) {
                    return false;
                }
                keySet.add(key);
                return true;
            })[Symbol.iterator]();
        });
    }

    /**
    * Returns a sequence with the same items, except duplicate items are omitted.
    * The items must support being inserted into / found in a Set.
    * @returns {!Seq.<T>}
     * @template T
    */
    distinct() {
        return this.distinctBy(e => e);
    }

    /**
     * @param {!function(T):*} keySelector
     * @returns {!Seq.<T>}
     * @template T
     */
    segmentBy(keySelector) {
        let seq = this;
        return Seq.fromGenerator(function*() {
            let group = [];
            let lastKey = undefined;
            for (let item of seq) {
                let itemKey = keySelector(item);
                if (group.length > 0 && itemKey !== lastKey) {
                    yield group;
                    group = [];
                }
                group.push(item);
                lastKey = itemKey;
            }
            if (group.length > 0) {
                yield group;
            }
        });
    }

    /**
     * Returns the single item in the sequence. If there are no items or multiple items in the sequence, either an error
     * is thrown or an alternative value is returned.
     *
     * @param {=A} emptyManyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty or has more than one value.
     * @returns {T|A}
     * @template T, A
     */
    single(emptyManyErrorAlternative = THROW_IF_EMPTY) {
        let iter = this[Symbol.iterator]();

        let first = iter.next();
        if (!first.done && iter.next().done) {
            return first.value;
        }

        if (emptyManyErrorAlternative === THROW_IF_EMPTY) {
            if (first.done) {
                throw new Error("Empty sequence doesn't contain a single item.")
            } else {
                throw new Error("Sequence contains more than a single item.")
            }
        }

        return emptyManyErrorAlternative;
    }

    /**
     * Returns the first item in the sequence.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template T, A
     */
    first(emptyErrorAlternative = THROW_IF_EMPTY) {
        let iter = this[Symbol.iterator]();

        let first = iter.next();
        if (!first.done) {
            return first.value;
        }

        if (emptyErrorAlternative === THROW_IF_EMPTY) {
            throw new Error("Empty sequence has no first item.")
        }

        return emptyErrorAlternative;
    }

    /**
     * Returns the last item in the sequence.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template T, A
     */
    last(emptyErrorAlternative = THROW_IF_EMPTY) {
        //noinspection JSUnusedAssignment
        let result = EMPTY_SYGIL;
        for (let e of this._iterable) {
            result = e;
        }
        return emptyFallback(result, emptyErrorAlternative, "Empty sequence has no last item.");
    }

    /**
     * If the sequence is of a known type with a known number of items, then returns the length of the sequence.
     * Otherwise, returns undefined.
     * It is guaranteed that the sequence will not be iterated by this method.
     * @returns {!int|undefined}
     */
    tryPeekCount() {
        if (Array.isArray(this._iterable) || !GENERIC_ARRAY_TYPES.every(t => !(this._iterable instanceof t))) {
            return this._iterable.length;
        }
        if (this._iterable instanceof Map || this._iterable instanceof Set) {
            return this._iterable.size;
        }
        return undefined;
    }

    /**
     * Determines the number of items in the sequence.
     * Uses length/size methods of known types, when possible, but otherwise falls back to iterating all the items.
     * Gets stuck in a loop if the sequence is unbounded.
     * @returns {!int}
     */
    count() {
        let known = this.tryPeekCount();
        if (known !== undefined) {
            return known;
        }

        let n = 0;
        //noinspection JSUnusedLocalSymbols
        for (let _ of this._iterable) {
            n++;
        }
        return n;
    }

    /**
     * Returns a sequence starting with the same items, but padded up to the given length with the given item. If the
     * sequence already exceeds the given length, no items are added.
     * @param {!int} minCount
     * @param {A=} paddingItem
     * @returns {!Seq.<T|A>}
     * @template T, A
     */
    padded(minCount, paddingItem=undefined) {
        if (minCount < 0) {
            throw new Error("needed minCount >= 0");
        }
        let seq = this._iterable;
        return Seq.fromGenerator(function*() {
            let remaining = minCount;
            for (let e of seq) {
                yield e;
                remaining -= 1;
            }
            while (remaining > 0) {
                yield paddingItem;
                remaining -= 1;
            }
        });
    }

    /**
     * Returns a sequence containing the same items, but in ascending order.
     * @returns {!Seq.<T>}
     * @template T
     */
    sorted() {
        return seq(this.toArray().sort());
    }

    /**
     * Returns a sequence containing the same items, but in ascending order of outputs from the given function.
     * @returns {!Seq.<T>}
     * @template T
     */
    sortedBy(keySelector) {
        return seq(this.toArray().sort((e1, e2) => {
            let out1 = keySelector(e1);
            let out2 = keySelector(e2);
            return out1 < out2 ? -1 :
                   out1 > out2 ? +1 :
                   0;
        }));
    }

    /**
     * Conditionally applies a transformation to the sequence.
     * If the given condition is false, the original sequence is returned.
     * If the given condition is true, the sequence is run through the given transformation and the result is returned.
     *
     * This method mainly exists for syntactic convenience, so a dotted pipeline can be done in a single expression.
     * For example, <code>seq.map(e => e + 1).ifThen(filterFlag, s => s.filter(e => e == 1)).toArray()</code>
     *
     * @param {!boolean} condition
     * @param {!function(!Seq<T>) : ((!Seq<T>)|(!Iterable.<T>)|(!(T[]))|*)} sequenceTransformation
     * @template T
     */
    ifThen(condition, sequenceTransformation) {
        return condition ? new Seq(sequenceTransformation(this)) : this;
    }

    /**
     * Returns a map containing the key/value pairs created by projecting each of the items in the sequence through
     * key and value selector functions.
     *
     * If any duplicate keys are generated, an exception is thrown.
     *
     * @param {!function(T): K} keySelector
     * @param {!function(T): V} valueSelector
     * @returns {!Map.<K, V>}
     * @template T, K, V
     */
    toMap(keySelector, valueSelector) {
        let map = new Map();
        for (let item of this._iterable) {
            let key = keySelector(item);
            let val = valueSelector(item);

            if (map.has(key)) {
                throw new Error(`Duplicate key <${key}>. Came from item <${item}>.`);
            }
            map.set(key, val);
        }
        return map;
    }

    /**
     * Returns a map where the items from the sequence are indexed by the result of running them through the given key
     * selector function.
     *
     * If any duplicate keys are generated, an exception is thrown.
     *
     * @param {!function(T): K} keySelector
     * @returns {!Map.<K, V>}
     * @template T, K, V
     */
    keyedBy(keySelector) {
        return this.toMap(keySelector, e => e);
    }

    /**
     * Returns a map, with keys generated by passing the sequence's items through the given key selector, where each key
     * maps to an array of the items (from the sequence) that mapped to said key.
     * @param {!function(T): K} keySelector
     * @returns {!Map.<K, !(T[])>}
     * @template T, K
     */
    groupBy(keySelector) {
        let map = new Map();
        for (let item of this._iterable) {
            let key = keySelector(item);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(item);
        }
        return map;
    }

    /**
     * Groups elements into arrays of the given size (except for the last partition, which may be smaller) and yields
     * the groups instead of individual items.
     * @param {!int} partitionSize
     * @returns {!Seq.<!(T[])>}
     * @template T
     */
    partitioned(partitionSize) {
        if (partitionSize <= 0) {
            throw new Error("need partitionSize > 0");
        }
        let seq = this;
        return Seq.fromGenerator(function*() {
            let buffer = [];
            for (let item of seq) {
                buffer.push(item);
                if (buffer.length >= partitionSize) {
                    yield buffer;
                    buffer = [];
                }
            }
            if (buffer.length > 0) {
                yield buffer;
            }
        });
    }

    /**
     * Iterates the elements in the subsequence that are at indices congruent to 0 modulo the given step size.
     * @param stepSize
     */
    stride(stepSize) {
        return this.filterWithIndex((e, i) => i % stepSize === 0);
    }

    /**
     * Iterates elements reachable by starting from the given sequence and applying the given neighbor yielding function
     * to known nodes.
     * @param {!function(T) : !(T[])} neighborSelector
     * @param {!function(T) : K} keySelector
     * @returns {!Seq.<T>}
     * @template T, K
     */
    breadthFirstSearch(neighborSelector, keySelector = e => e) {
        let seq = this;
        return Seq.fromGenerator(function*() {
            let visited = new Set();
            let schedule = seq.toArray();
            for (let i = 0; i < schedule.length; i++) {
                let e = schedule[i];
                let k = keySelector(e);
                if (visited.has(k)) {
                    continue;
                }
                visited.add(k);
                for (let neighbor of neighborSelector(e)) {
                    schedule.push(neighbor);
                }
                yield e;
            }
        });
    }
}

/**
 * Wraps an iterable into a Seq.
 * @param {!(T[])|!Seq.<T>|!Iterable.<T>|*} iterable
 * @returns {!Seq.<T>}
 * @template T
 */
let seq = iterable => new Seq(iterable);

export {seq, Seq};
