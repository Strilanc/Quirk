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

import {Suite, assertThat} from "test/TestUtil.js"
import {Observable, ObservableValue, ObservableSource} from "src/base/Obs.js"

let suite = new Suite("Obs");

let record = observable => {
    let out = [];
    let stop = observable.subscribe(e => out.push(e));
    return {out, stop};
};

suite.test("Observable.of", () => {
    assertThat(record(Observable.of()).out).isEqualTo([]);
    assertThat(record(Observable.of(1, 2, 3)).out).isEqualTo([1, 2, 3]);
});

suite.test("Observable.snapshot", () => {
    assertThat(Observable.of().snapshot()).isEqualTo([]);
    assertThat(Observable.of(1, 2, 3).snapshot()).isEqualTo([1, 2, 3]);
});

suite.test("Observable.map", () => {
    assertThat(Observable.of(1, 2, 3).map(e => e * 2).snapshot()).isEqualTo([2, 4, 6]);
});

suite.test("Observable.filter", () => {
    assertThat(Observable.of(1, 2, 3).filter(e => e !== 2).snapshot()).isEqualTo([1, 3]);
});

suite.test("Observable.zipLatest", () => {
    let v1 = new ObservableSource();
    let v2 = new ObservableSource();
    let seen = [];
    let unreg = v1.observable().zipLatest(v2.observable(), (e1, e2) => e1 + e2).subscribe(e => seen.push(e));

    assertThat(seen).isEqualTo([]);
    v1.send(1);
    assertThat(seen).isEqualTo([]);
    v1.send(2);
    assertThat(seen).isEqualTo([]);
    v2.send(10);
    assertThat(seen).isEqualTo([12]);
    v1.send(3);
    assertThat(seen).isEqualTo([12, 13]);
    v1.send(4);
    assertThat(seen).isEqualTo([12, 13, 14]);
    v2.send(20);
    assertThat(seen).isEqualTo([12, 13, 14, 24]);
    unreg();
    v2.send(30);
    assertThat(seen).isEqualTo([12, 13, 14, 24]);
});

suite.test("Observable.flattenLatest", () => {
    let c = new ObservableSource();
    let v1 = new ObservableSource();
    let v2 = new ObservableSource();
    let v3 = new ObservableSource();
    let seen = [];
    let unreg = c.observable().flattenLatest().subscribe(e => seen.push(e));

    assertThat(seen).isEqualTo([]);
    c.send(v1.observable());
    assertThat(seen).isEqualTo([]);
    v1.send(1);
    assertThat(seen).isEqualTo([1]);
    v1.send(2);
    assertThat(seen).isEqualTo([1, 2]);
    c.send(v2.observable());
    assertThat(seen).isEqualTo([1, 2]);
    v1.send(3);
    assertThat(seen).isEqualTo([1, 2]);
    v2.send(4);
    assertThat(seen).isEqualTo([1, 2, 4]);
    c.send(v1.observable());
    c.send(v2.observable());
    c.send(v3.observable());
    assertThat(seen).isEqualTo([1, 2, 4]);
    v1.send(5);
    v2.send(6);
    v3.send(7);
    assertThat(seen).isEqualTo([1, 2, 4, 7]);
    unreg();
    v1.send(8);
    v2.send(9);
    v3.send(10);
    assertThat(seen).isEqualTo([1, 2, 4, 7]);
});

suite.test("Observable.whenDifferent", () => {
    assertThat(Observable.of(1, 2, 2, 3).whenDifferent().snapshot()).isEqualTo([1, 2, 3]);
    assertThat(Observable.of(undefined, 2, 2, 3).whenDifferent().snapshot()).isEqualTo([undefined, 2, 3]);
    assertThat(Observable.of(2, 3, 5, 7, 10, 13, 17, 19, 23).whenDifferent((e1, e2) => e1 % 3 === e2 % 3).snapshot()).
        isEqualTo([2, 3, 5, 7, 17, 19, 23]);
});

suite.test("Observable.skip", () => {
    assertThat(Observable.of(1, 2, 3).skip(0).snapshot()).isEqualTo([1, 2, 3]);
    assertThat(Observable.of(1, 2, 3).skip(1).snapshot()).isEqualTo([2, 3]);
    assertThat(Observable.of(1, 2, 3).skip(2).snapshot()).isEqualTo([3]);
    assertThat(Observable.of(1, 2, 3).skip(3).snapshot()).isEqualTo([]);
    assertThat(Observable.of(1, 2, 3).skip(5).snapshot()).isEqualTo([]);
});

suite.test("Observable.flatten", () => {
    assertThat(Observable.of(
        Observable.of(1, 2, 3),
        Observable.of(4, 5, 6),
        Observable.of(7, 8)).flatten().snapshot()).isEqualTo([1, 2, 3, 4, 5, 6, 7, 8]);

    let v1 = new ObservableSource();
    let v2 = new ObservableSource();
    let c = new ObservableSource();
    let {out, stop} = record(c.observable().flatten());
    assertThat(out).isEqualTo([]);
    c.send(v1.observable());
    assertThat(out).isEqualTo([]);
    v1.send('a');
    assertThat(out).isEqualTo(['a']);
    c.send(v2.observable());
    assertThat(out).isEqualTo(['a']);
    c.send(v2.observable());
    assertThat(out).isEqualTo(['a']);
    v2.send('b');
    assertThat(out).isEqualTo(['a', 'b', 'b']);
    stop();
    v1.send('c');
    v2.send('c');
    c.send(new ObservableValue('c').observable());
    assertThat(out).isEqualTo(['a', 'b', 'b']);
});

suite.test("ObservableValue_setVsGet", () => {
    let v = new ObservableValue('a');
    assertThat(v.get()).isEqualTo('a');
    v.set('b');
    assertThat(v.get()).isEqualTo('b');
});

suite.test("ObservableValue_observable", () => {
    let v = new ObservableValue('a');
    let {out, stop} = record(v.observable());
    assertThat(out).isEqualTo(['a']);
    v.set('b');
    assertThat(out).isEqualTo(['a', 'b']);
    v.set('c');
    assertThat(out).isEqualTo(['a', 'b', 'c']);
    stop();
    v.set('d');
    assertThat(out).isEqualTo(['a', 'b', 'c']);
});

suite.test("ObservableValue_observable_multiple", () => {
    let v = new ObservableValue('a');
    let {out: out1, stop: stop1} = record(v.observable());
    let {out: out2, stop: stop2} = record(v.observable());
    assertThat(out1).isEqualTo(['a']);
    assertThat(out2).isEqualTo(['a']);
    stop2();
    assertThat(out1).isEqualTo(['a']);
    assertThat(out2).isEqualTo(['a']);
    v.set('b');
    assertThat(out1).isEqualTo(['a', 'b']);
    assertThat(out2).isEqualTo(['a']);
    stop1();
    assertThat(out1).isEqualTo(['a', 'b']);
    assertThat(out2).isEqualTo(['a']);
});

suite.test("ObservableSource_observable", () => {
    let v = new ObservableSource();
    let {out, stop} = record(v.observable());
    assertThat(out).isEqualTo([]);
    v.send('b');
    assertThat(out).isEqualTo(['b']);
    v.send('c');
    assertThat(out).isEqualTo(['b', 'c']);
    stop();
    v.send('d');
    assertThat(out).isEqualTo(['b', 'c']);
});

suite.test("ObservableSource_observable_multiple", () => {
    let v = new ObservableSource();
    let {out: out1, stop: stop1} = record(v.observable());
    let {out: out2, stop: stop2} = record(v.observable());
    assertThat(out1).isEqualTo([]);
    assertThat(out2).isEqualTo([]);
    v.send('a');
    assertThat(out1).isEqualTo(['a']);
    assertThat(out2).isEqualTo(['a']);
    stop2();
    assertThat(out1).isEqualTo(['a']);
    assertThat(out2).isEqualTo(['a']);
    v.send('b');
    assertThat(out1).isEqualTo(['a', 'b']);
    assertThat(out2).isEqualTo(['a']);
    stop1();
    assertThat(out1).isEqualTo(['a', 'b']);
    assertThat(out2).isEqualTo(['a']);
});

suite.test("peek", () => {
    let a = [];
    let v = new ObservableSource();
    v.observable().peek(e => a.push(e)).subscribe(() => {});
    assertThat(a).isEqualTo([]);
    v.send(2);
    assertThat(a).isEqualTo([2]);
});
