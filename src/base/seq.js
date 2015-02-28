//noinspection JSUnresolvedVariable
const iterSymbol = Symbol.iterator;

export const THROW_IF_EMPTY = { if_same_instance_as_this_then_throw: true };

/**
 * A private sygil/sentinel value that shouldn't ever be present in a sequence, and so can be used as a placeholder for
 * "not set yet" (unlike undefined or null, which are allowed to appear in sequences).
 */
const EMPTY_SYGIL = { not_a_normal_value: true };

/**
 * A fluent wrapper for iterable sequences of values, exposing useful methods and properties.
 *
 * @typedef {!{
 *   next: !function() : !{
 *     value: (T|undefined),
 *     done: !boolean
 *   }
 * }} Iterator<T>
 * @typedef {!{
 *   [iterSymbol]: !function(): !Iterator<T>
 * }} Iterable<T>
 */
export default class Seq {
    /**
     * Wraps the given iterable.
     * @param {*|!(T[])|!Seq<T>|!Iterable<T>} iterable
     * @template T
     */
    constructor(iterable) {
        if (iterable[iterSymbol] === undefined) {
            throw new Error(`Not iterable: ${iterable}`);
        }

        if (iterable instanceof Seq) {
            // Avoid double-wrapping.
            this.iterable = iterable.iterable;
        } else {
            this.iterable = iterable;
        }
    }

    /**
     * Iterates over the sequence's items.
     * @returns {!Iterator<T>}
     */
    [iterSymbol]() {
        return this.iterable[iterSymbol]();
    }

    //noinspection JSValidateJSDoc
    /**
     * Creates a re-usable iterable from a generator function like <code>function*() { yield 1; }</code>.
     *
     * Note that the obvious alternative, <code>new Seq(function*(){yield 1;}()}</code>, stops working after the
     * iterable has been iterated once.
     *
     * @param {!function*} generatorFunction
     * @returns {Seq}
     */
    static fromGenerator(generatorFunction) {
        return new Seq({ [iterSymbol]: generatorFunction });
    };

    /**
    * Determines if the given iterable contains the same items as this sequence.
    * @param {*|!(T[])|!Seq<T>|!Iterable<T>} other
    * @param {!function(T, T|*) : !boolean} comparator
    */
    isEqualTo(other, comparator = (e1, e2) => e1 === e2) {
        if (other === undefined || other === null || other[iterSymbol] === undefined) {
            return false;
        }
        if (other === this) {
            return true;
        }
        var iter2 = other[iterSymbol]();
        for (let e1 of this) {
            var e2 = iter2.next();
            if (e2.done || !comparator(e1, e2.value)) {
                return false;
            }
        }
        return iter2.next().done;
    }

    /**
     * Returns an array containing the items of this sequence.
     * @returns {!(T[])}
     */
    toArray() {
        return Array.from(this);
    };

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
        return `[${this.join(", ")}]`;
    };

    /**
     * Returns a sequence of natural numbers, starting at 0 and incrementing until just before the given count.
     * @param {!int} count
     * @returns {!Seq<!int>}
     */
    static range(count) {
        if (count < 0) {
            throw new Error("needed count >= 0");
        }

        return Seq.fromGenerator(function*() {
            for (let i = 0; i < count; i++) {
                yield i;
            }
        })
    };

    /**
     * Returns the sequence of natural numbers, starting at 0 and incrementing without bound.
     * @returns {!Seq<!int>}
     */
    static naturals() {
        return Seq.fromGenerator(function*() {
            let i = 0;
            //noinspection InfiniteLoopJS
            while (true) {
                yield i;
                i++;
            }
        })
    };

    /**
     * Returns a sequence of the same item repeated the given number of times.
     * @param {T} item
     * @param {!int} repeatCount
     * @returns {!Seq<T>}
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
    };

    /**
     * Returns a sequence with the same items, but precomputed and stored. If the sequence is already solid, e.g. it is
     * backed by an array, then it is returned directly (and unchanged).
     * @returns {!Seq<T>}
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

        if (Array.isArray(this.iterable)) {
            return this;
        }
        for (let t of knownSolidTypes) {
            if (this.iterable instanceof t) {
                return this;
            }
        }
        return new Seq(this.toArray());
    };

    /**
     * Returns a sequence iterating the results of applying a transformation to the items of the receiving sequence.
     * @param {!function(T): R} projection
     * @returns {!Seq<T>}
     * @template R
     */
    map(projection) {
        let seq = this.iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                yield projection(e);
            }
        });
    };

    /**
     * Returns a sequence iterating the items of the receiving sequence that match a predicate. Items that don't match
     * the predicate, by causing it to return a falsy value, are skipped.
     * @param {!function(T) : !boolean} predicate
     * @returns {!Seq<T>}
     */
    filter(predicate) {
        let seq = this.iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                if (predicate(e)) {
                    yield e;
                }
            }
        });
    };

    /**
     * Combines the items of a sequence into a single result by iteratively applying a combining function. If the
     * sequence is empty, then either an error is thrown or the given alternative value is returned.
     * @param {!function(T, T) : T} combiner
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template A
     */
    fold(combiner, emptyErrorAlternative = THROW_IF_EMPTY) {
        let accumulator = EMPTY_SYGIL;
        for (let e of this) {
            accumulator = accumulator === EMPTY_SYGIL ? e : combiner(accumulator, e);
        }
        if (accumulator !== EMPTY_SYGIL) {
            return accumulator;
        }
        if (emptyErrorAlternative === THROW_IF_EMPTY) {
            throw new Error("Folded empty sequence without providing an alternative result.");
        }
        return emptyErrorAlternative;
    };

    /**
     * Combines the items of a sequence into a single result by starting with a seed accumulator and iteratively
     * applying an aggregation function to the accumulator and next item to get the next accumulator.
     * @param {!function(A, T) : A} aggregator Computes the next accumulator value.
     * @param {A} seed The initial accumulator value.
     * @returns {A}
     * @template A
     */
    aggregate(seed, aggregator) {
        let accumulator = seed;
        for (let e of this) {
            accumulator = aggregator(accumulator, e);
        }
        return accumulator;
    };

    /**
     * Combines this sequence with another by passing items with the same index through a combining function.
     * If one sequence is longer than the other, the lonely tail is discarded.
     *
     * @param {!(T2[])|!Seq<T2>|!Iterable<T2>} other
     * @param {!function(T, T2) : R} combiner
     *
     * @returns {!Seq<R>}
     *
     * @template T2, R
     */
    zip(other, combiner) {
        let seq = this.iterable;
        return Seq.fromGenerator(function*() {
            let iter2 = other[iterSymbol]();
            for (let item1 of seq) {
                let item2 = iter2.next();
                if (item2.done) {
                    break;
                }
                yield combiner(item1, item2.value);
            }
        });
    };

    /**
     * Returns the largest value in the sequence, as determined by the `<` operator. If the sequence  is empty, then
     * either an error is thrown or the given alternative value is returned.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template A
     */
    max(emptyErrorAlternative = THROW_IF_EMPTY) {
        return this.fold((e1, e2) => e1 < e2 ? e2 : e1, emptyErrorAlternative);
    };

    /**
     * Returns the smallest value in the sequence, as determined by the `<` operator. If the sequence  is empty, then
     * either an error is thrown or the given alternative value is returned.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @returns {T|A}
     * @template A
     */
    min(emptyErrorAlternative = THROW_IF_EMPTY) {
        return this.fold((e1, e2) => e1 < e2 ? e1 : e2, emptyErrorAlternative);
    };

    /**
     * Returns the highest-scoring item in the sequence, as determined by a scoring function.
     *
     * @param {!function(T) : !number} projection Determines the score of an item.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @param {(function(A, A): !boolean)=} isALessThanBComparator The operation used to compare scores.
     * @returns {T|A}
     * @template A
     */
    maxBy(projection, emptyErrorAlternative = THROW_IF_EMPTY, isALessThanBComparator = (e1, e2) => e1 < e2) {
        let curMaxItem = EMPTY_SYGIL;
        let curMaxScore = EMPTY_SYGIL;
        for (let item of this) {
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

        if (curMaxItem !== EMPTY_SYGIL) {
            return curMaxItem;
        }
        if (emptyErrorAlternative === THROW_IF_EMPTY) {
            throw new Error("Can't maxBy an empty sequence.");
        }
        return emptyErrorAlternative;
    };

    /**
     * Returns the lowest-scoring item in the sequence, as determined by a scoring function.
     *
     * @param {!function(T) : !number} projection Determines the score of an item.
     * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty.
     * @param {(function(A, A): !boolean)=} isALessThanBComparator The operation used to compare scores.
     * @returns {T|A}
     * @template A
     */
    minBy(projection, emptyErrorAlternative = THROW_IF_EMPTY, isALessThanBComparator = (e1, e2) => e1 < e2) {
        return this.maxBy(projection, emptyErrorAlternative, (e1, e2) => isALessThanBComparator(e2, e1));
    }

    /**
     * Determines if any of the items in the sequence matches the given predicate.
     * @param {!function(T) : !boolean} predicate
     * @returns {!boolean}
     */
    any(predicate) {
        for (let e of this) {
            if (predicate(e)) {
                return true;
            }
        }
        return false;
    };

    /**
     * Determines if every item in the sequence matches the given predicate.
     * @param {!function(T) : !boolean} predicate
     * @returns {!boolean}
     */
    every(predicate) {
        return !this.any(e => !predicate(e));
    };

    /**
     * Determines if the sequence contains a given value or not, as determined by the <code>===</code> operator.
     * @param {T} value
     * @returns {!boolean}
     */
    contains(value) {
        return this.any(e => e === value);
    };

    /**
     * Adds up the numbers in the sequence, using the `+` operator, and returns the total.
     * The empty sum is defined to be 0, to satisfy the invariant that X.concat([s]).sum() === X.sum() + s.
     * @returns {T|!number|*}
     */
    sum() {
        return this.fold((a, e) => a + e, 0);
    };

    /**
     * Multiplies up the numbers in the sequence, using the `*` operator, and returns the total.
     * The empty product is defined to be 1, to satisfy the invariant that X.concat([s]).product() === X.product() + s.
     * @returns {T|!number|*}
     */
    product() {
        return this.fold((a, e) => a * e, 1);
    };

    /**
     * Accumulates the items of a sequence into a seed, while yielding the results. For example,
     * <code>[1, 2, 3].scan((a, e) => a + e, "a")</code> yields <code>["a", "a1", "a12", "a123"]</code> and
     * <code>[1, 2, 3].scan((e1, e2) => e1 + e2, 0)</code> yields <code>[0, 1, 3, 6]</code<.
     *
     * @param {A} seed
     * @param {!function(A, T) : A} aggregator
     * @returns {!Seq<A>}
     * @template A
     */
    scan(seed, aggregator) {
        let seq = this.iterable;

        return Seq.fromGenerator(function*() {
            let accumulator = seed;
            yield accumulator;
            for (let e of seq) {
                accumulator = aggregator(accumulator, e);
                yield accumulator;
            }
        });
    };

    /**
     * Returns a sequence containing the same items, but in the opposite order.
     * @returns {!Seq<T>}
     */
    reverse() {
        return new Seq(this.toArray().reverse());
    }

    /**
     * Flattens this sequence of iterables into a concatenated sequence.
     * @returns {Seq<C>}
     * @template C
     */
    flatten() {
        let seqSeq = this.iterable;
        return Seq.fromGenerator(function*() {
            for (let seq of seqSeq) {
                for (let item of seq) {
                    yield item;
                }
            }
        });
    };

    ///**
    // * Flattens this sequence of sequences into a concatenated sequence.
    // * @param {*|!!(T[])|!Seq<T>} other
    // */
    //concat(other) {
    //    let seq = this.iterable;
    //    return Seq.fromGenerator(function*() {
    //        for (let e of seq) {
    //            yield e;
    //        }
    //        for (let e of other) {
    //            yield e;
    //        }
    //    });
    //};

    /**
     * Returns a sequence with the same items, except the item at the given index (if reached) is replaced.
     * @param {T} item
     * @param {!int} index
     * @returns {!Seq<T>}
     */
    overlayAt(item, index) {
        if (index < 0) {
            throw new Error("needed index >= 0");
        }
        let seq = this.iterable;
        return Seq.fromGenerator(function*() {
            let i = 0;
            for (let e of seq) {
                yield i === index ? item : e;
                i++;
            }
        });
    };

    /**
     * Returns a sequence with the same items, until one of the items fails to match the given predicate. Then the
     * sequence is cut short just before yielding that item.
     * @param {!function(T) : !boolean} predicate
     * @returns {!Seq<T>}
     */
    takeWhile(predicate) {
        let seq = this.iterable;
        return Seq.fromGenerator(function*() {
            for (let e of seq) {
                if (!predicate(e)) {
                    break;
                }
                yield e;
            }
        });
    };

    /**
     * Returns a sequence with the same items, except cut short if it exceeds the given maximum count.
     * @param {!int} maxTakeCount
     * @returns {!Seq<T>}
     */
    take(maxTakeCount) {
        if (maxTakeCount < 0) {
            throw new Error("needed maxTakeCount >= 0");
        }
        if (maxTakeCount === 0) {
            return new Seq([]);
        }
        let seq = this.iterable;
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
    };
    //
    ///**
    // * Returns a sequence with one item replaced.
    // * @param {!int} maxSkipCount
    // * @returns {!Seq<T>}
    // */
    //skip(maxSkipCount) {
    //    if (maxSkipCount < 0) {
    //        throw new Error("needed maxSkipCount >= 0");
    //    }
    //    if (maxSkipCount === 0) {
    //        return this;
    //    }
    //
    //    let seq = this.iterable;
    //    return Seq.fromGenerator(function*() {
    //        let i = 0;
    //        for (let e of seq) {
    //            if (i >= maxSkipCount) {
    //                yield e;
    //            }
    //            i++;
    //        }
    //    });
    //};

    /**
     * Returns a sequence with the same items, except later items with the same key as earlier items get skipped.
     *
     * @param {!function(T) : K} keySelector Items are considered distinct when their image, through this function, is
     * not already in the Set of seen images. The return type must support being inserted into a Set.
     * @returns {!Seq<T>}
     * @template K
     */
    distinctBy(keySelector) {
        let seq = this;
        return Seq.fromGenerator(function() {
            //noinspection JSUnresolvedFunction
            let keySet = new Set();
            return seq.filter(e => {
                let key = keySelector(e);
                if (keySet.has(key)) {
                    return false;
                }
                keySet.add(key);
                return true;
            })[iterSymbol]();
        });
    };

    /**
    * Returns a sequence with the same items, except duplicate items are omitted.
    * The items must support being inserted into / found in a Set.
    * @returns {!Seq<T>}
    */
    distinct() {
        return this.distinctBy(e => e);
    };

    /**
     * Returns the single item in the sequence. If there are no items or multiple items in the sequence, either an error
     * is thrown or an alternative value is returned.
     *
     * @param {=A} emptyManyErrorAlternative The value to return if the sequence is empty. If not provided, an error
     * is thrown when the sequence is empty or has more than one value.
     * @returns {T|A}
     * @template A
     */
    single(emptyManyErrorAlternative = THROW_IF_EMPTY) {
        let iter = this[iterSymbol]();

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
    };

    ///**
    // * Returns the first item in the sequence.
    // * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
    // * is thrown when the sequence is empty.
    // * @returns {T|A}
    // * @template A
    // */
    //first(emptyErrorAlternative = THROW_IF_EMPTY) {
    //    let iter = this[iterSymbol]();
    //
    //    let first = iter.next();
    //    if (!first.done) {
    //        return first.value;
    //    }
    //
    //    if (emptyErrorAlternative === THROW_IF_EMPTY) {
    //        throw new Error("Empty sequence has no first item.")
    //    }
    //
    //    return emptyErrorAlternative;
    //};
    //
    ///**
    // * Returns the last item in the sequence.
    // * @param {=A} emptyErrorAlternative The value to return if the sequence is empty. If not provided, an error
    // * is thrown when the sequence is empty.
    // * @returns {T|A}
    // * @template A
    // */
    //last(emptyErrorAlternative = THROW_IF_EMPTY) {
    //    //noinspection JSUnusedAssignment
    //    let result = SYGIL;
    //    for (let e of this) {
    //        result = e;
    //    }
    //
    //    if (result !== SYGIL) {
    //        return result;
    //    }
    //
    //    if (emptyErrorAlternative === THROW_IF_EMPTY) {
    //        throw new Error("Empty sequence has no last item.")
    //    }
    //
    //    return emptyErrorAlternative;
    //};
    //
    //count() {
    //    let peekCount = this.iterable["length"];
    //    if (peekCount !== undefined) {
    //        return peekCount;
    //    }
    //
    //    let n = 0;
    //    for (let e in this) {
    //        n++;
    //    }
    //    return n;
    //}
    //
    ///**
    // * Returns a sequence starting with the same items, but padded up to the given length with the given item. If the
    // * sequence already exceeds the given length, no items are added.
    // * @param {A} paddingItem
    // * @param {!int} minCount
    // * @returns {!Seq<T|A>}
    // * @template A
    // */
    //paddedWithTo(paddingItem, minCount) {
    //    if (minCount < 0) {
    //        throw new Error("needed minCount >= 0");
    //    }
    //    let seq = this.iterable;
    //    return Seq.fromGenerator(function*() {
    //        let remaining = minCount;
    //        for (let e of seq) {
    //            yield e;
    //            remaining -= 1;
    //        }
    //        while (remaining > 0) {
    //            yield paddingItem;
    //            remaining -= 1;
    //        }
    //    });
    //};
    //
    ///**
    // * @param {!function(T): K} keySelector
    // * @param {!function(T): V} valueSelector
    // * @returns {!Map<K, V>}
    // * @template K, V
    // */
    //toMap(keySelector, valueSelector) {
    //    //noinspection JSUnresolvedFunction
    //    let map = new Map();
    //    for (let item of this) {
    //        let key = keySelector(item);
    //        let val = valueSelector(item);
    //
    //        if (map.has(key)) {
    //            throw new Error(`Duplicate key <${key}>. Came from item <${item}>.`);
    //        }
    //        map[key] = val;
    //    }
    //    return map;
    //};
    //
    ///**
    // * @param {!function(T): K} keySelector
    // * @returns {!Map<K, !(T[])>}
    // * @template K
    // */
    //groupBy(keySelector) {
    //    //noinspection JSUnresolvedFunction
    //    let map = new Map();
    //    for (let item of this) {
    //        let key = keySelector(item);
    //        if (!map.has(key)) {
    //            map[key] = [];
    //        }
    //        map[key].push(item);
    //    }
    //    return map;
    //};
}
