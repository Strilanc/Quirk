import { assertThat } from "test/test.js"
import Point from "src/base/point.js"
import Rect from "src/base/rect.js"

let RectTest = TestCase("RectTest");

RectTest.prototype.testIsEqualTo = () => {
    var r = new Rect(2, 3, 5, 7);
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
};

RectTest.prototype.testToString = () => {
    assertThat(new Rect(2, 3, 5, 7).toString()).isEqualTo("[2:7]x[3:10]");
};

RectTest.prototype.testCenteredSquareWithRadius = () => {
    assertThat(Rect.centeredSquareWithRadius(new Point(2, 3), 5)).isEqualTo(new Rect(-3, -2, 10, 10));
};

RectTest.prototype.testCenter = () => {
    assertThat(new Rect(2, 3, 5, 7).center()).isEqualTo(new Point(4.5, 6.5));
    assertThat(new Rect(2, 3, 5, 6).center()).isEqualTo(new Point(4.5, 6));
};

RectTest.prototype.testTopLeft = () => {
    assertThat(new Rect(2, 3, 5, 7).topLeft()).isEqualTo(new Point(2, 3));
};

RectTest.prototype.testTopRight = () => {
    assertThat(new Rect(2, 3, 5, 7).topRight()).isEqualTo(new Point(7, 3));
};

RectTest.prototype.testBottomLeft = () => {
    assertThat(new Rect(2, 3, 5, 7).bottomLeft()).isEqualTo(new Point(2, 10));
};

RectTest.prototype.testBottomRight = () => {
    assertThat(new Rect(2, 3, 5, 7).bottomRight()).isEqualTo(new Point(7, 10));
};

RectTest.prototype.testCenterLeft = () => {
    assertThat(new Rect(2, 3, 5, 7).centerLeft()).isEqualTo(new Point(2, 6.5));
};

RectTest.prototype.testCenterRight = () => {
    assertThat(new Rect(2, 3, 5, 7).centerRight()).isEqualTo(new Point(7, 6.5));
};

RectTest.prototype.testTopCenter = () => {
    assertThat(new Rect(2, 3, 5, 7).topCenter()).isEqualTo(new Point(4.5, 3));
};

RectTest.prototype.testBottomCenter = () => {
    assertThat(new Rect(2, 3, 5, 7).bottomCenter()).isEqualTo(new Point(4.5, 10));
};

RectTest.prototype.testRight = () => {
    assertThat(new Rect(2, 3, 5, 7).right()).isEqualTo(7);
};

RectTest.prototype.testBottom = () => {
    assertThat(new Rect(2, 3, 5, 7).bottom()).isEqualTo(10);
};

RectTest.prototype.testSkipLeft = () => {
    assertThat(new Rect(2, 3, 5, 7).skipLeft(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(1)).isEqualTo(new Rect(3, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(4)).isEqualTo(new Rect(6, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(5)).isEqualTo(new Rect(7, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).skipLeft(6)).isEqualTo(new Rect(7, 3, 0, 7));
};

RectTest.prototype.testSkipRight = () => {
    assertThat(new Rect(2, 3, 5, 7).skipRight(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(1)).isEqualTo(new Rect(2, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(4)).isEqualTo(new Rect(2, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(5)).isEqualTo(new Rect(2, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).skipRight(6)).isEqualTo(new Rect(2, 3, 0, 7));
};

RectTest.prototype.testSkipTop = () => {
    assertThat(new Rect(2, 3, 5, 7).skipTop(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipTop(1)).isEqualTo(new Rect(2, 4, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).skipTop(6)).isEqualTo(new Rect(2, 9, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).skipTop(7)).isEqualTo(new Rect(2, 10, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).skipTop(8)).isEqualTo(new Rect(2, 10, 5, 0));
};

RectTest.prototype.testSkipBottom = () => {
    assertThat(new Rect(2, 3, 5, 7).skipBottom(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(1)).isEqualTo(new Rect(2, 3, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(6)).isEqualTo(new Rect(2, 3, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(7)).isEqualTo(new Rect(2, 3, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).skipBottom(8)).isEqualTo(new Rect(2, 3, 5, 0));
};

RectTest.prototype.testTakeLeft = () => {
    assertThat(new Rect(2, 3, 5, 7).takeLeft(-1)).isEqualTo(new Rect(2, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(0)).isEqualTo(new Rect(2, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(1)).isEqualTo(new Rect(2, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(4)).isEqualTo(new Rect(2, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).takeLeft(5)).isEqualTo(new Rect(2, 3, 5, 7));
};

RectTest.prototype.testTakeRight = () => {
    assertThat(new Rect(2, 3, 5, 7).takeRight(-1)).isEqualTo(new Rect(7, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(0)).isEqualTo(new Rect(7, 3, 0, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(1)).isEqualTo(new Rect(6, 3, 1, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(4)).isEqualTo(new Rect(3, 3, 4, 7));
    assertThat(new Rect(2, 3, 5, 7).takeRight(5)).isEqualTo(new Rect(2, 3, 5, 7));
};

RectTest.prototype.testTakeTop = () => {
    assertThat(new Rect(2, 3, 5, 7).takeTop(-1)).isEqualTo(new Rect(2, 3, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeTop(0)).isEqualTo(new Rect(2, 3, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeTop(1)).isEqualTo(new Rect(2, 3, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).takeTop(6)).isEqualTo(new Rect(2, 3, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).takeTop(7)).isEqualTo(new Rect(2, 3, 5, 7));
};

RectTest.prototype.testTakeBottom = () => {
    assertThat(new Rect(2, 3, 5, 7).takeBottom(-1)).isEqualTo(new Rect(2, 10, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(0)).isEqualTo(new Rect(2, 10, 5, 0));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(1)).isEqualTo(new Rect(2, 9, 5, 1));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(6)).isEqualTo(new Rect(2, 4, 5, 6));
    assertThat(new Rect(2, 3, 5, 7).takeBottom(7)).isEqualTo(new Rect(2, 3, 5, 7));
};

RectTest.prototype.testPaddedBy = () => {
    assertThat(new Rect(2, 3, 5, 7).paddedBy(0)).isEqualTo(new Rect(2, 3, 5, 7));
    assertThat(new Rect(2, 3, 5, 7).paddedBy(1)).isEqualTo(new Rect(1, 2, 7, 9));
    assertThat(new Rect(2, 3, 5, 7).paddedBy(2)).isEqualTo(new Rect(0, 1, 9, 11));
};

RectTest.prototype.testContainsPoint = () => {
    var r = new Rect(2, 3, 5, 7);
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
};

RectTest.prototype.testTakeLeftProportion = () => {
    assertThat(new Rect(2, 3, 5, 7).takeLeftProportion(0.25)).isEqualTo(new Rect(2, 3, 1.25, 7));
};

RectTest.prototype.testTakeRightProportion = () => {
    assertThat(new Rect(2, 3, 5, 7).takeRightProportion(0.25)).isEqualTo(new Rect(5.75, 3, 1.25, 7));
};

RectTest.prototype.testTakeTopProportion = () => {
    assertThat(new Rect(2, 3, 5, 7).takeTopProportion(0.25)).isEqualTo(new Rect(2, 3, 5, 1.75));
};

RectTest.prototype.testTakeBottomProportion = () => {
    assertThat(new Rect(2, 3, 5, 7).takeBottomProportion(0.25)).isEqualTo(new Rect(2, 8.25, 5, 1.75));
};

RectTest.prototype.testLeftHalf = () => {
    assertThat(new Rect(2, 3, 5, 7).leftHalf()).isEqualTo(new Rect(2, 3, 2.5, 7));
};

RectTest.prototype.testRightHalf = () => {
    assertThat(new Rect(2, 3, 5, 7).rightHalf()).isEqualTo(new Rect(4.5, 3, 2.5, 7));
};

RectTest.prototype.testTopHalf = () => {
    assertThat(new Rect(2, 3, 5, 7).topHalf()).isEqualTo(new Rect(2, 3, 5, 3.5));
};

RectTest.prototype.testBottomHalf = () => {
    assertThat(new Rect(2, 3, 5, 7).bottomHalf()).isEqualTo(new Rect(2, 6.5, 5, 3.5));
};

RectTest.prototype.testShiftedBy = () => {
    assertThat(new Rect(2, 3, 5, 7).shiftedBy(11, 13)).isEqualTo(new Rect(13, 16, 5, 7));
};

RectTest.prototype.testProportionalShiftedBy = () => {
    assertThat(new Rect(2, 3, 5, 7).proportionalShiftedBy(11, 13)).isEqualTo(new Rect(57, 94, 5, 7));
};

RectTest.prototype.testWithX = () => {
    assertThat(new Rect(2, 3, 5, 7).withX(11)).isEqualTo(new Rect(11, 3, 5, 7));
};

RectTest.prototype.testWithY = () => {
    assertThat(new Rect(2, 3, 5, 7).withY(11)).isEqualTo(new Rect(2, 11, 5, 7));
};

RectTest.prototype.testWithW = () => {
    assertThat(new Rect(2, 3, 5, 7).withW(11)).isEqualTo(new Rect(2, 3, 11, 7));
};

RectTest.prototype.testWithH = () => {
    assertThat(new Rect(2, 3, 5, 7).withH(11)).isEqualTo(new Rect(2, 3, 5, 11));
};

RectTest.prototype.testScaledOutwardBy = () => {
    assertThat(new Rect(2, 3, 5, 7).scaledOutwardBy(0)).isEqualTo(new Rect(4.5, 6.5, 0, 0));
    assertThat(new Rect(2, 3, 5, 7).scaledOutwardBy(0.5)).isEqualTo(new Rect(3.25, 4.75, 2.5, 3.5));
    assertThat(new Rect(2, 3, 5, 7).scaledOutwardBy(2)).isEqualTo(new Rect(-0.5, -0.5, 10, 14));
};
