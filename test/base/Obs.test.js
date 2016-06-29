import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import { Observable, ObservableValue, ObservableSource } from "src/base/Obs.js"

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
