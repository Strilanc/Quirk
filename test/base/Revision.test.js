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

import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {Revision} from "src/base/Revision.js"

let suite = new Suite("Revision");

suite.test("constructor_isEqualTo", () => {
    assertThrows(() => new Revision([], 0, false));
    assertThrows(() => new Revision(["a"], -1, false));
    assertThrows(() => new Revision(["a"], 1, false));
    assertThrows(() => new Revision(["a", "b"], 2, false));

    let r = new Revision(["a", "b", "c"], 1, true);
    assertThat(r).isEqualTo(new Revision(["a", "b", "c"], 1, true));
    assertThat(r).isNotEqualTo(new Revision(["a", "b"], 1, true));
    assertThat(r).isNotEqualTo(new Revision(["a", "b", "d"], 1, true));
    assertThat(r).isNotEqualTo(new Revision(["a", "b", "c"], 2, true));
    assertThat(r).isNotEqualTo(new Revision(["a", "b", "c"], 1, false));
    assertThat(r).isNotEqualTo(undefined);
    assertThat(r).isNotEqualTo(5);

    let groups = [
        [
            new Revision(["a"], 0, false),
            new Revision(["a"], 0, false)
        ],
        [
            new Revision(["a"], 0, true),
            new Revision(["a"], 0, true)
        ],
        [
            new Revision(["a", "b"], 0, false),
            new Revision(["a", "b"], 0, false)
        ],
        [
            new Revision(["b", "a"], 0, false),
            new Revision(["b", "a"], 0, false)
        ],
        [
            new Revision(["b", "a"], 1, false),
            new Revision(["b", "a"], 1, false)
        ]
    ];
    for (let g1 of groups) {
        for (let g2 of groups) {
            for (let e1 of g1) {
                for (let e2 of g2) {
                    if (g1 === g2) {
                        assertThat(e1).isEqualTo(e2);
                    } else {
                        assertThat(e1).isNotEqualTo(e2);
                    }
                }
            }
        }
    }
});

suite.test("toString_exists", () => {
    assertThat(new Revision(["a", "b"], 1, false).toString()).isNotEqualTo(undefined);
});

suite.test("startingAt", () => {
    assertThat(Revision.startingAt("abc")).isEqualTo(new Revision(["abc"], 0, false));
});

suite.test("clear", () => {
    let r;

    r = new Revision(["abc"], 0, false);
    r.clear("xyz");
    assertThat(r).isEqualTo(new Revision(["xyz"], 0, false));

    r = new Revision(["r", "s", "t"], 2, true);
    r.clear("wxyz");
    assertThat(r).isEqualTo(new Revision(["wxyz"], 0, false));
});

suite.test("undo", () => {
    let r;

    r = new Revision(["abc"], 0, false);
    assertThat(r.undo()).isEqualTo(undefined);
    assertThat(r).isEqualTo(new Revision(["abc"], 0, false));

    r = new Revision(["abc", "def"], 0, false);
    assertThat(r.undo()).isEqualTo(undefined);
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, false));

    r = new Revision(["abc", "def"], 0, true);
    assertThat(r.undo()).isEqualTo("abc");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, false));

    r = new Revision(["abc", "def"], 1, false);
    assertThat(r.undo()).isEqualTo("abc");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, false));

    r = new Revision(["abc", "def"], 1, true);
    assertThat(r.undo()).isEqualTo("def");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));

    assertThat(new Revision(["abc", "def", "xyz"], 2, true).undo()).isEqualTo("xyz");
    assertThat(new Revision(["abc", "def", "xyz"], 2, false).undo()).isEqualTo("def");
    assertThat(new Revision(["abc", "def", "xyz"], 1, true).undo()).isEqualTo("def");
    assertThat(new Revision(["abc", "def", "xyz"], 1, false).undo()).isEqualTo("abc");
    assertThat(new Revision(["abc", "def", "xyz"], 0, true).undo()).isEqualTo("abc");
    assertThat(new Revision(["abc", "def", "xyz"], 0, false).undo()).isEqualTo(undefined);
});

suite.test("isAtBeginningOfHistory", () => {
    assertTrue(new Revision(["abc"], 0, false).isAtBeginningOfHistory());
    assertFalse(new Revision(["abc"], 0, true).isAtBeginningOfHistory());

    assertTrue(new Revision(["abc", "123"], 0, false).isAtBeginningOfHistory());
    assertFalse(new Revision(["abc", "123"], 0, true).isAtBeginningOfHistory());
    assertFalse(new Revision(["abc", "123"], 1, false).isAtBeginningOfHistory());
    assertFalse(new Revision(["abc", "123"], 1, true).isAtBeginningOfHistory());
});

suite.test("isAtBeginningOfHistory", () => {
    assertTrue(new Revision(["abc"], 0, false).isAtEndOfHistory());
    assertTrue(new Revision(["abc"], 0, true).isAtEndOfHistory());

    assertFalse(new Revision(["abc", "123"], 0, false).isAtEndOfHistory());
    assertFalse(new Revision(["abc", "123"], 0, true).isAtEndOfHistory());
    assertTrue(new Revision(["abc", "123"], 1, false).isAtEndOfHistory());
    assertTrue(new Revision(["abc", "123"], 1, true).isAtEndOfHistory());
});

suite.test("redo", () => {
    let r;

    r = new Revision(["abc"], 0, false);
    assertThat(r.redo()).isEqualTo(undefined);
    assertThat(r).isEqualTo(new Revision(["abc"], 0, false));

    r = new Revision(["abc", "def"], 0, false);
    assertThat(r.redo()).isEqualTo("def");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));

    r = new Revision(["abc", "def"], 0, true);
    assertThat(r.redo()).isEqualTo("def");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));

    r = new Revision(["abc", "def"], 1, false);
    assertThat(r.redo()).isEqualTo(undefined);
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));

    // Redo-ing when working on a commit with no future state shouldn't lose the in-progress work.
    r = new Revision(["abc", "def"], 1, true);
    assertThat(r.redo()).isEqualTo(undefined);
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, true));

    assertThat(new Revision(["abc", "def", "xyz"], 0, false).redo()).isEqualTo("def");
    assertThat(new Revision(["abc", "def", "xyz"], 0, true).redo()).isEqualTo("def");
    assertThat(new Revision(["abc", "def", "xyz"], 1, false).redo()).isEqualTo("xyz");
    assertThat(new Revision(["abc", "def", "xyz"], 1, true).redo()).isEqualTo("xyz");
    assertThat(new Revision(["abc", "def", "xyz"], 2, false).redo()).isEqualTo(undefined);
    assertThat(new Revision(["abc", "def", "xyz"], 2, true).redo()).isEqualTo(undefined);
});

suite.test("startedWorkingOnCommit", () => {
    let r;

    r = new Revision(["abc"], 0, false);
    r.startedWorkingOnCommit();
    assertThat(r).isEqualTo(new Revision(["abc"], 0, true));
    r.startedWorkingOnCommit();
    assertThat(r).isEqualTo(new Revision(["abc"], 0, true));

    r = new Revision(["abc", "def"], 0, false);
    r.startedWorkingOnCommit();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, true));
    r.startedWorkingOnCommit();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, true));

    r = new Revision(["abc", "def"], 1, false);
    r.startedWorkingOnCommit();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, true));
    r.startedWorkingOnCommit();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, true));
});

suite.test("cancelCommitBeingWorkedOn", () => {
    let r;

    r = new Revision(["abc"], 0, true);
    r.cancelCommitBeingWorkedOn();
    assertThat(r).isEqualTo(new Revision(["abc"], 0, false));
    r.cancelCommitBeingWorkedOn();
    assertThat(r).isEqualTo(new Revision(["abc"], 0, false));

    r = new Revision(["abc", "def"], 0, true);
    r.cancelCommitBeingWorkedOn();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, false));
    r.cancelCommitBeingWorkedOn();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 0, false));

    r = new Revision(["abc", "def"], 1, true);
    r.cancelCommitBeingWorkedOn();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));
    r.cancelCommitBeingWorkedOn();
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));
});

suite.test("commit", () => {
    let r;

    r = new Revision(["abc"], 0, false);
    r.commit("def");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));
    r.commit("xyz");
    assertThat(r).isEqualTo(new Revision(["abc", "def", "xyz"], 2, false));

    r = new Revision(["abc"], 0, true);
    r.commit("def");
    assertThat(r).isEqualTo(new Revision(["abc", "def"], 1, false));

    r = new Revision(["abc", "def"], 0, true);
    r.commit("xyz");
    assertThat(r).isEqualTo(new Revision(["abc", "xyz"], 1, false));

    r = new Revision(["abc", "def", "so", "long"], 1, true);
    r.commit("t");
    assertThat(r).isEqualTo(new Revision(["abc", "def", "t"], 2, false));

    r = new Revision(["abc", "def", "so", "long"], 1, false);
    r.commit("t");
    assertThat(r).isEqualTo(new Revision(["abc", "def", "t"], 2, false));
});

suite.test("changes", () => {
    let r = Revision.startingAt('abc');
    let a = [];
    let s = r.changes().subscribe(e => a.push(e));
    assertThat(a).isEqualTo([]);
    r.commit('123');
    assertThat(a).isEqualTo(['123']);
    r.undo();
    assertThat(a).isEqualTo(['123', 'abc']);
    r.undo();
    assertThat(a).isEqualTo(['123', 'abc']);
    r.redo();
    assertThat(a).isEqualTo(['123', 'abc', '123']);
    r.redo();
    assertThat(a).isEqualTo(['123', 'abc', '123']);
    r.startedWorkingOnCommit();
    assertThat(a).isEqualTo(['123', 'abc', '123', undefined]);
    r.cancelCommitBeingWorkedOn();
    assertThat(a).isEqualTo(['123', 'abc', '123', undefined, '123']);
    r.clear('xyz');
    assertThat(a).isEqualTo(['123', 'abc', '123', undefined, '123', 'xyz']);
    s();
    r.clear('nope');
    assertThat(a).isEqualTo(['123', 'abc', '123', undefined, '123', 'xyz']);
});

suite.test("latestActiveCommit", () => {
    let r = Revision.startingAt('abc');
    let a = [];
    let s = r.latestActiveCommit().subscribe(e => a.push(e));
    assertThat(a).isEqualTo(['abc']);
    r.commit('123');
    assertThat(a).isEqualTo(['abc', '123']);
    r.undo();
    assertThat(a).isEqualTo(['abc', '123', 'abc']);
    r.undo();
    assertThat(a).isEqualTo(['abc', '123', 'abc']);
    r.redo();
    assertThat(a).isEqualTo(['abc', '123', 'abc', '123']);
    r.redo();
    assertThat(a).isEqualTo(['abc', '123', 'abc', '123']);
    r.startedWorkingOnCommit();
    assertThat(a).isEqualTo(['abc', '123', 'abc', '123']);
    r.cancelCommitBeingWorkedOn();
    assertThat(a).isEqualTo(['abc', '123', 'abc', '123', '123']);
    r.clear('xyz');
    assertThat(a).isEqualTo(['abc', '123', 'abc', '123', '123', 'xyz']);
    s();
    r.clear('nope');
    assertThat(a).isEqualTo(['abc', '123', 'abc', '123', '123', 'xyz']);
});
