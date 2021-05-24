/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Suite, assertThat, assertTrue, assertFalse} from "../TestUtil.js"
import {Rect} from "../../src/math/Rect.js"

import {Point} from "../../src/math/Point.js"

let suite = new Suite("Rect");

suite.test("isEqualTo", () => {
    let r = new Rect(2, 3, 5, 7);
    assertThat(r).isEqualTo(r);
    assertThat(r).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(1, 2, 3, 4)).isEqualTo(new Rect(1, 2, 3, 4));
    assertThat(r).isNotEqualTo(new Rect(1, 2, 3, 4));

    assertThat(r).isNotEqualTo(new Rect(1, 2, 5, 7));
    assertThat(r).isNotEqualTo(new Rect(2, 1, 5, 7));
    assertThat(r).isNotEqualTo(new Rect(2, 3, 1, 7));
    assertThat(r).isNotEqualTo(new Rect(2, 3, 5, 1));

    assertThat(r).isNotEqualTo(new Rect(2, 2, 5, 7));
    assertThat(r).isNotEqualTo(new Rect(3, 3, 5, 7));
    assertThat(r).isNotEqualTo(new Rect(2, 3, 5, 5));
    assertThat(r).isNotEqualTo(new Rect(2, 3, 7, 7));
});

suite.test("isApproximatelyEqualTo", () => {
    let r = new Rect(2, 3, 5, 7);

    assertFalse(r.isApproximatelyEqualTo(null, 0));
    assertFalse(r.isApproximatelyEqualTo("", 0));
    assertFalse(r.isApproximatelyEqualTo([], 0));

    assertTrue(r.isApproximatelyEqualTo(new Rect(2, 3, 5, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2.1, 3, 5, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3.1, 5, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3, 5.1, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3, 5, 7.1), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2.3, 3, 5, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3.3, 5, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3, 5.3, 7), 0));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3, 5, 7.3), 0));

    assertTrue(r.isApproximatelyEqualTo(new Rect(2, 3, 5, 7), 0.2));
    assertTrue(r.isApproximatelyEqualTo(new Rect(2.1, 3, 5, 7), 0.2));
    assertTrue(r.isApproximatelyEqualTo(new Rect(2, 3.1, 5, 7), 0.2));
    assertTrue(r.isApproximatelyEqualTo(new Rect(2, 3, 5.1, 7), 0.2));
    assertTrue(r.isApproximatelyEqualTo(new Rect(2, 3, 5, 7.1), 0.2));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2.3, 3, 5, 7), 0.2));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3.3, 5, 7), 0.2));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3, 5.3, 7), 0.2));
    assertFalse(r.isApproximatelyEqualTo(new Rect(2, 3, 5, 7.3), 0.2));

    // Interops with testing utils.
    assertThat(r).isApproximatelyEqualTo(new Rect(2, 3, 5, 7));
    assertThat(r).isNotApproximatelyEqualTo(new Rect(3, 3, 5, 7));
});

suite.test("toString", () => {
    assertThat(new Rect(2, 3, 5, 7).toString()).isEqualTo("[2:7]x[3:10]");
});

suite.test("centeredSquareWithRadius", () => {
    assertThat(Rect.centeredSquareWithRadius(new Point(2, 3), 5)).isEqualTo(new Rect(-3, -2, 10, 10));
});

suite.test("center", () => {
    assertThat(new Rect(2, 3, 5, 7).center()).isEqualTo(new Point(4.5, 6.5));
    assertThat(new Rect(2, 3, 5, 6).center()).isEqualTo(new Point(4.5, 6));
});

suite.test("topLeft", () => {
    assertThat(new Rect(2, 3, 5, 7).topLeft()).isEqualTo(new Point(2, 3));
});

suite.test("topRight", () => {
    assertThat(new Rect(2, 3, 5, 7).topRight()).isEqualTo(new Point(7, 3));
});

suite.test("bottomLeft", () => {
    assertThat(new Rect(2, 3, 5, 7).bottomLeft()).isEqualTo(new Point(2, 10));
});

suite.test("bottomRight", () => {
    assertThat(new Rect(2, 3, 5, 7).bottomRight()).isEqualTo(new Point(7, 10));
});

suite.test("centerLeft", () => {
    assertThat(new Rect(2, 3, 5, 7).centerLeft()).isEqualTo(new Point(2, 6.5));
});

suite.test("centerRight", () => {
    assertThat(new Rect(2, 3, 5, 7).centerRight()).isEqualTo(new Point(7, 6.5));
});

suite.test("topCenter", () => {
    assertThat(new Rect(2, 3, 5, 7).topCenter()).isEqualTo(new Point(4.5, 3));
});

suite.test("bottomCenter", () => {
    assertThat(new Rect(2, 3, 5, 7).bottomCenter()).isEqualTo(new Point(4.5, 10));
});

suite.test("right", () => {
    assertThat(new Rect(2, 3, 5, 7).right()).isEqualTo(7);
});

suite.test("bottom", () => {
    assertThat(new Rect(2, 3, 5, 7).bottom()).isEqualTo(10);
});

suite.test("skipLeft", () => {
    assertThat(new Rect(2, 3, 5, 7).skipLeft(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(1)).isEqualTo(new Rect(3, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(4)).isEqualTo(new Rect(6, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(5)).isEqualTo(new Rect(7, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(6)).isEqualTo(new Rect(7, 3, 0, 7));
});

suite.test("skipRight", () => {
    assertThat(new Rect(2, 3, 5, 7).skipRight(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(1)).isEqualTo(new Rect(2, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(4)).isEqualTo(new Rect(2, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(5)).isEqualTo(new Rect(2, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(6)).isEqualTo(new Rect(2, 3, 0, 7));
});

suite.test("skipTop", () => {
    assertThat(new Rect(2, 3, 5, 7).skipTop(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipTop(1)).isEqualTo(new Rect(2, 4, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).skipTop(6)).isEqualTo(new Rect(2, 9, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).skipTop(7)).isEqualTo(new Rect(2, 10, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).skipTop(8)).isEqualTo(new Rect(2, 10, 5, 0));
});

suite.test("skipBottom", () => {
    assertThat(new Rect(2, 3, 5, 7).skipBottom(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(1)).isEqualTo(new Rect(2, 3, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(6)).isEqualTo(new Rect(2, 3, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(7)).isEqualTo(new Rect(2, 3, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(8)).isEqualTo(new Rect(2, 3, 5, 0));
});

suite.test("takeLeft", () => {
    assertThat(new Rect(2, 3, 5, 7).takeLeft(-1)).isEqualTo(new Rect(2, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(0)).isEqualTo(new Rect(2, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(1)).isEqualTo(new Rect(2, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(4)).isEqualTo(new Rect(2, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(5)).isEqualTo(new Rect(2, 3, 5, 7));
});

suite.test("takeRight", () => {
    assertThat(new Rect(2, 3, 5, 7).takeRight(-1)).isEqualTo(new Rect(7, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(0)).isEqualTo(new Rect(7, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(1)).isEqualTo(new Rect(6, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(4)).isEqualTo(new Rect(3, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(5)).isEqualTo(new Rect(2, 3, 5, 7));
});

suite.test("TakeTop", () => {
    assertThat(new Rect(2, 3, 5, 7).takeTop(-1)).isEqualTo(new Rect(2, 3, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeTop(0)).isEqualTo(new Rect(2, 3, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeTop(1)).isEqualTo(new Rect(2, 3, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).takeTop(6)).isEqualTo(new Rect(2, 3, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).takeTop(7)).isEqualTo(new Rect(2, 3, 5, 7));
});

suite.test("takeBottom", () => {
    assertThat(new Rect(2, 3, 5, 7).takeBottom(-1)).isEqualTo(new Rect(2, 10, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(0)).isEqualTo(new Rect(2, 10, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(1)).isEqualTo(new Rect(2, 9, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(6)).isEqualTo(new Rect(2, 4, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(7)).isEqualTo(new Rect(2, 3, 5, 7));
});

suite.test("paddedBy", () => {
    assertThat(new Rect(2, 3, 5, 7).paddedBy(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).paddedBy(1)).isEqualTo(new Rect(1, 2, 7, 9));
    assertThat(new Rect(2, 3, 5, 7).paddedBy(2)).isEqualTo(new Rect(0, 1, 9, 11));
});

suite.test("containsPoint", () => {
    let r = new Rect(2, 3, 5, 7);
    assertTrue(r.containsPoint(r.center()));

    // Strictness
    assertTrue(r.containsPoint(r.topLeft()));
    assertFalse(r.containsPoint(r.topRight()));
    assertFalse(r.containsPoint(r.bottomLeft()));
    assertFalse(r.containsPoint(r.bottomRight()));

    // Left
    assertFalse(r.containsPoint(new Point(2-0.001, 5)));
    assertTrue(r.containsPoint(new Point(2+0.001, 5)));

    // Top
    assertFalse(r.containsPoint(new Point(5, 3-0.001)));
    assertTrue(r.containsPoint(new Point(5, 3+0.001)));

    // Right
    assertTrue(r.containsPoint(new Point(7-0.001, 5)));
    assertFalse(r.containsPoint(new Point(7+0.001, 5)));

    // Bottom
    assertTrue(r.containsPoint(new Point(5, 10-0.001)));
    assertFalse(r.containsPoint(new Point(5, 10+0.001)));
});

suite.test("takeLeftProportion", () => {
    assertThat(new Rect(2, 3, 5, 7).takeLeftProportion(0.25)).isEqualTo(new Rect(2, 3, 1.25, 7));
});

suite.test("takeRightProportion", () => {
    assertThat(new Rect(2, 3, 5, 7).takeRightProportion(0.25)).isEqualTo(new Rect(5.75, 3, 1.25, 7));
});

suite.test("takeTopProportion", () => {
    assertThat(new Rect(2, 3, 5, 7).takeTopProportion(0.25)).isEqualTo(new Rect(2, 3, 5, 1.75));
});

suite.test("takeBottomProportion", () => {
    assertThat(new Rect(2, 3, 5, 7).takeBottomProportion(0.25)).isEqualTo(new Rect(2, 8.25, 5, 1.75));
});

suite.test("leftHalf", () => {
    assertThat(new Rect(2, 3, 5, 7).leftHalf()).isEqualTo(new Rect(2, 3, 2.5, 7));
});

suite.test("rightHalf", () => {
    assertThat(new Rect(2, 3, 5, 7).rightHalf()).isEqualTo(new Rect(4.5, 3, 2.5, 7));
});

suite.test("topHalf", () => {
    assertThat(new Rect(2, 3, 5, 7).topHalf()).isEqualTo(new Rect(2, 3, 5, 3.5));
});

suite.test("bottomHalf", () => {
    assertThat(new Rect(2, 3, 5, 7).bottomHalf()).isEqualTo(new Rect(2, 6.5, 5, 3.5));
});

suite.test("shiftedBy", () => {
    assertThat(new Rect(2, 3, 5, 7).shiftedBy(11, 13)).isEqualTo(new Rect(13, 16, 5, 7));
});

suite.test("proportionalShiftedBy", () => {
    assertThat(new Rect(2, 3, 5, 7).proportionalShiftedBy(11, 13)).isEqualTo(new Rect(57, 94, 5, 7));
});

suite.test("withX", () => {
    assertThat(new Rect(2, 3, 5, 7).withX(11)).isEqualTo(new Rect(11, 3, 5, 7));
});

suite.test("withY", () => {
    assertThat(new Rect(2, 3, 5, 7).withY(11)).isEqualTo(new Rect(2, 11, 5, 7));
});

suite.test("withW", () => {
    assertThat(new Rect(2, 3, 5, 7).withW(11)).isEqualTo(new Rect(2, 3, 11, 7));
});

suite.test("withH", () => {
    assertThat(new Rect(2, 3, 5, 7).withH(11)).isEqualTo(new Rect(2, 3, 5, 11));
});

suite.test("scaledOutwardBy", () => {
    assertThat(new Rect(2, 3, 5, 7).scaledOutwardBy(0)).isEqualTo(new Rect(4.5, 6.5, 0, 0));
    assertThat(new Rect(2, 3, 5, 7).scaledOutwardBy(0.5)).isEqualTo(new Rect(3.25, 4.75, 2.5, 3.5));
    assertThat(new Rect(2, 3, 5, 7).scaledOutwardBy(2)).isEqualTo(new Rect(-0.5, -0.5, 10, 14));
});

suite.test("snapInside", () => {
    // Equal.
    assertThat(new Rect(10, 20, 50, 70).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));

    // Filling.
    assertThat(new Rect(9, 20, 50, 70).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));
    assertThat(new Rect(11, 20, 50, 70).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));
    assertThat(new Rect(10, 19, 50, 70).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));
    assertThat(new Rect(10, 21, 50, 70).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));
    assertThat(new Rect(10, 20, 500, 70).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));
    assertThat(new Rect(10, 20, 50, 700).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 50, 70));

    // X Shift.
    assertThat(new Rect(-1000, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 21, 10, 10));
    assertThat(new Rect(9, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 21, 10, 10));
    assertThat(new Rect(10, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 21, 10, 10));
    assertThat(new Rect(11, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 21, 10, 10));
    assertThat(new Rect(49, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(49, 21, 10, 10));
    assertThat(new Rect(50, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(50, 21, 10, 10));
    assertThat(new Rect(51, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(50, 21, 10, 10));
    assertThat(new Rect(1000, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(50, 21, 10, 10));

    // Y Shift.
    assertThat(new Rect(11, -1000, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 20, 10, 10));
    assertThat(new Rect(11, 19, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 20, 10, 10));
    assertThat(new Rect(11, 20, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 20, 10, 10));
    assertThat(new Rect(11, 21, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 21, 10, 10));
    assertThat(new Rect(11, 79, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 79, 10, 10));
    assertThat(new Rect(11, 80, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 80, 10, 10));
    assertThat(new Rect(11, 81, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 80, 10, 10));
    assertThat(new Rect(11, 1000, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(11, 80, 10, 10));

    // Disjoint.
    assertThat(new Rect(-100, -100, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 20, 10, 10));
    assertThat(new Rect(+100, -100, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(50, 20, 10, 10));
    assertThat(new Rect(+100, +100, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(50, 80, 10, 10));
    assertThat(new Rect(-100, +100, 10, 10).snapInside(new Rect(10, 20, 50, 70))).isEqualTo(new Rect(10, 80, 10, 10));
});
