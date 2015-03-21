import { Suite, assertThat, fail } from "test/TestUtil.js"
import Painter from "src/ui/Painter.js"
import MathPainter from "src/ui/MathPainter.js"
import Point from "src/base/Point.js"
import Rect from "src/base/Rect.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

let suite = new Suite("MathPainter");

suite.test("paintableArea", () => {
    let c = document.createElement("canvas");
    c.width = 23;
    c.height = 34;
    assertThat(new Painter(c).paintableArea()).isEqualTo(new Rect(0, 0, 23, 34));
});

suite.test("describeProbability", () => {
    assertThat(MathPainter.describeProbability(0, 0)).isEqualTo("0%");
    assertThat(MathPainter.describeProbability(0, 1)).isEqualTo("0%");
    assertThat(MathPainter.describeProbability(0, 2)).isEqualTo("0%");

    assertThat(MathPainter.describeProbability(0.00001, 0)).isEqualTo("0%");
    assertThat(MathPainter.describeProbability(0.00001, 1)).isEqualTo("0%");
    assertThat(MathPainter.describeProbability(0.00001, 2)).isEqualTo("0%");

    assertThat(MathPainter.describeProbability(0.004, 0)).isEqualTo("1%");
    assertThat(MathPainter.describeProbability(0.0004, 1)).isEqualTo("0.1%");
    assertThat(MathPainter.describeProbability(0.0004, 2)).isEqualTo("0.04%");

    assertThat(MathPainter.describeProbability(1/3, 0)).isEqualTo("33%");
    assertThat(MathPainter.describeProbability(1/3, 1)).isEqualTo("33.3%");
    assertThat(MathPainter.describeProbability(1/3, 2)).isEqualTo("33.33%");

    assertThat(MathPainter.describeProbability(1/2, 0)).isEqualTo("50%");
    assertThat(MathPainter.describeProbability(1/2, 1)).isEqualTo("50.0%");
    assertThat(MathPainter.describeProbability(1/2, 2)).isEqualTo("50.00%");

    assertThat(MathPainter.describeProbability(2/3, 0)).isEqualTo("67%");
    assertThat(MathPainter.describeProbability(2/3, 1)).isEqualTo("66.7%");
    assertThat(MathPainter.describeProbability(2/3, 2)).isEqualTo("66.67%");

    assertThat(MathPainter.describeProbability(0.996, 0)).isEqualTo("99%");
    assertThat(MathPainter.describeProbability(0.9996, 1)).isEqualTo("99.9%");
    assertThat(MathPainter.describeProbability(0.9996, 2)).isEqualTo("99.96%");

    assertThat(MathPainter.describeProbability(0.99999, 0)).isEqualTo("100%");
    assertThat(MathPainter.describeProbability(0.99999, 1)).isEqualTo("100%");
    assertThat(MathPainter.describeProbability(0.99999, 2)).isEqualTo("100%");

    assertThat(MathPainter.describeProbability(1, 0)).isEqualTo("100%");
    assertThat(MathPainter.describeProbability(1, 1)).isEqualTo("100%");
    assertThat(MathPainter.describeProbability(1, 2)).isEqualTo("100%");
});

suite.canvasAppearanceTest("paintProbabilityBox_p=0", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintProbabilityBox(
        painter,
        0,
        new Rect(0, 0, 40, 40),
        "green",
        "yellow");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAA0UlEQVRYhe3ZvQ3EIAwF4DcDE1CwAj1NNrgJWIAV2Nz' +
'XgGQh56TLD+R0r3hKQizli02qAB6C9NB4CJAgqA9NIpBAAgkkkEACCfxPoIMALUWtx7bmjPrXLGBsqRBsClPUeWz3aoPFL59xCggIsnGdIQgK3lFu6PK' +
'twGKMtY/P6uCZ7h0C5g9Aaw9CHaHGvqSDY+025Mi4L92DVl3van+BsFN7KTDA/op1NGp6B/WeGsddW4dGdK+9fQ/ODoEErg6BBK4OgQSuzm8APdb/bti' +
'Lh7wB158Xo9Pcvh8AAAAASUVORK5CYII=',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);

suite.canvasAppearanceTest("paintProbabilityBox_p=2/3", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintProbabilityBox(
        painter,
        2/3,
        new Rect(0, 0, 40, 40),
        "lightgray",
        "gray");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABPUlEQVRYhe2WsY3GIAyFPYMnSMEK9DS0VJ6AkoYVGCR' +
'bZSBfcTLiEuCnC//JxZMiPYQ/PztRwFrLKaUtZa1lSCnxdV1bKqWkgAqogAqogAr47wFDCHye55YKITA457iUsqWcc18KiIgMAAwA7L1f9kop7L2vfis' +
'i4lLK7z8eACPi4145MwU0xvwpDACcc/7ojUREFSbnXJ+ttfUuImJr7ecEc84MAN1CM2+mtokYIxtjatIChYjdRh+AcoGMoR3NzBuphRglOEpvCNgWJqK' +
'awMxbSU9030GZSm+vh4C95Z15o92Tcc4SbnUf99IOCsTM6xVvX4JZwnJW7jHGcIxx7S2WMa54dyFiLTRqQKCWE2w7E92L9LxeurP9jDE+voNLO7ibFFA' +
'B35YCKuDbUkAFfFvfAXgcBzvnttRxHPwD4P59Pa2DvqEAAAAASUVORK5CYII=',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);

suite.canvasAppearanceTest("paintProbabilityBox_p=1", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintProbabilityBox(
        painter,
        1,
        new Rect(0, 0, 40, 40),
        "lightgray",
        "gray");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABCklEQVRYhe2Zy5HEIAxEOwZFwEEp6M6FDIhACZACmWt' +
'PUDMGPDtsTdmzpUOXP03JTx98ASEEizHeUiEEQ4zRaq23VIzRAR3QAR3QAR3QAR3wPwPmnI2IhvdEZAAMgJVSfuWJiAEY4hGR5ZzfB8w5TwOKiImI1Vo' +
'tpfTkr7xSSr8XEUsp9W+09W8BMnPP7AgIwFR1+rzyVNWYuYM3KCIaOvCnFpdShta1RF55xwq+qt4WoKouIc682QwC6FcAve2XVPAYN6X0pFW7t3bxzgw' +
'e47bqiUhPgJmHtVuAzLzcxWde0yPURyr4ODez/+CZp6rTjmzP4NVyQAe8Wg7ogFfLAR3wan0H4N2PIX4Ao6mbAPrVBusAAAAASUVORK5CYII=',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);

suite.canvasAppearanceTest("paintConditionalProbabilityBox_c=2/3_p|c=1/3", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintConditionalProbabilityBox(
        painter,
        2/3,
        1/3,
        new Rect(0, 0, 40, 40),
        "white",
        "lightgray",
        "gray");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACi0lEQVRYhe2ZoY7jMBCG5xkqLVgQqauEFRcZNCQyW7R' +
'SwLKwhFRGLTRt8MIQo6LgPECWLzAuyRP0Df4DlX1O6zRttbe6OyXSr1R/HefLzDgdq7RcLlEUxV3abreQUv5xxXEMKooCWuu7dDwe8ROHlHICnAAnwB8' +
'DzPMcRAQiwn6/H/XDMAQRgXNuvd1uhzzP/YBCCAvAGLsLcL/f2xu1bQsiuuq3bWtBOOc4HA4AYL/3AgZB8DCge7ggQ74PMM/zXoR7gIwxEJEFcwGFEDZ' +
'F5iFeXl68cCad5zfy+SbFeZ7jcDggDMOL+UYjqJTq+UIICCFGF4kP8ppvosc579XlKGBZlr3a1FqjaZpRQM45drvdTX7btuCc27MZ17btCfD19RVVVeH' +
'p6QlVVaGqKiwWC1RVhc1m0/M3mw0WiwW+vr7QdZ3Vx8cHVqsVuq7D5+cniAh1XQ/67rWr1Qp1XaOuazvWeEIIUBzHJ1IiRFEEKaU9SymRJImtQSKClBL' +
'Pz88XCydNUzvGjfqQb0rGrffztVAUxW9AVy6gT03T3P3ufET/LuCYJsAJcAKcACfACfD7Ac0PPREhTdNRPwiCXmOg9al5cMf0AJMkeRjwfGIisr2kz1d' +
'KWZ8xZucjouEIzmazb0sxY+yitXJ9H2CapijL0g8YRVGvH3Tl9oPmIXz9oFHTNCCii4c4902K0zRF0zS9jn40guZzlmU9P0kSJElyNYJBEEApdbOvtbb' +
'Ru9qw+lL89vZ2UZvr9XoQ0Be5a77Wp40ZY8yeTdqVUuOA5xHMsgxRFA1CDEGP1atSahzwlhoc2pO4+w6jsiwHfXf1P7Qn+S9f1BPgXws4n88Rx/Fden9' +
'/v/uvi0e0XC7xC/Smv9d1hsJpAAAAAElFTkSuQmCC',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);

suite.canvasAppearanceTest("paintConditionalProbabilityBox_100%", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintConditionalProbabilityBox(
        painter,
        1,
        1,
        new Rect(0, 0, 40, 40),
        "green",
        "blue",
        "orange");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABKUlEQVRYhe2ZzQ2DMAyFvUUH6IlLZ+CA1AE4ZQSkzIC' +
'45sQUVQZhDmZJD5GVxA0loArc1ocngfP3+WEkLKCuwA0tT9UVOBhacO7BU0MrgAIogD8EaFQYuN+2b2YUOKvTPQDSvWhs6v09QJhzvSwAxgNbAbvGH4K' +
'AVvsYjlmdjxnlITE5q/39CyDNLAY0KmSJScTJIFDsIB6MLhmVj1EHMYFiB6c+jeNBa4+4a1KYrsnHaJKxe0WA6Ey8aB7XAUsdpGUyj8HRedzh4NQv12c' +
'MWFqD1D2ch8YkgCU1iLVCa3DvW0wNeetgbsHZ+l5ALhJAATxbAiiAZ0sAPwq49CFaqkN7kq06vCehzrDrSfCabU9CnYljLHoSFNueZKkG2fQkXCSA/wH' +
'I/TfEEw/gBHN9O/+AAAAAAElFTkSuQmCC',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.););

suite.canvasAppearanceTest("paintConditionalProbabilityBox_0%", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintConditionalProbabilityBox(
        painter,
        0,
        0.5,
        new Rect(0, 0, 40, 40),
        "yellow",
        "pink",
        "orange");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABkElEQVRYhe2Zv7GDMAzGtUgqxqCh8wjM4DoLuHXFGDR' +
's4ZoRMoteYfQsKyY2Dnfw7rn4LvEfyI9PMiddYBgAjbmnhgEQjAFEvKeMaYANsAFeBLgAImyfNPdIjFcxHj8AWhsWlDoJsN8BXMXaso0FdATYdScDkiM' +
'ExQGfm2j/CIjT+/wvoFKAAAGMA1rr1wDCQ/CH+Qi4srBxwF6EG5izjwMOOhfPWxunQhaQ3FkFILC9E8S5R26WAM7zO9DrdRCQXCTARQD1GzBXX+mgc4X' +
'5yQE5BMFN6ZBGIV8FYEkOAhzMQXmqeW5SOJ+J60ev3ffg16f4JP1dwLuoATbAq9UAG+DVaoCIvmSjQmOew3zXxQUKoi9MtN4BLCpEKwTgyzTnQjXkXAB' +
'RKtSYtJ4EzJZQFZL1JIeVgFrHDkeAsifhqupJWHj53q4LEBRirT1g6p67DtL36p6kAJCL3JNGZUNc3ZNkQiz3KBW3EzTOAlb3JJlDwkUwWcCSHCzuSUQ' +
'UUq8Zujf/zY8hvqMa4P8AvPvfED+kTxzfJn6sBQAAAABJRU5ErkJggg==',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.););

suite.canvasAppearanceTest("paintAmplitude_half", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintAmplitude(
        painter,
        new Complex(Math.sqrt(0.5), 0),
        new Rect(0, 0, 40, 40),
        "green",
        "pink",
        "yellow");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADDUlEQVRYhe3XP0gbURwH8AfGTXBxcTKTmMwZFToGRNB' +
'2UuifwbS7Wyk0Kll65boIwtFdQS1prAmJyd29yxmUeLgVShVabLG16pmkOU978b4d2pRSY5K75GKHPPjO78P73e+93xHSXu3VXq1biCu9iCu9N+0ghBC' +
'CpNINSZlQU/xqUUirJt02czw9y6ckzaTbZlFIq2qKX4WkTCCpdLcOximdurAxa4hbRio8nwtwo/CxHrhmOkCmCcg0gWumAz7WiwA3hlR4PlcStwxd2Jg' +
'Fp3Q6i6PZEU2Q1cWlkNbP9P0B1Uo/04fFpZCmCbIKmh1xBHeQTDzReFkfnhusG/ZvhucGoQmy/im+9rSpOEPYnNKFTMnDuG3jyhlg3NCFTOlc2JxqCg4' +
'0O6Lxsj7QBFw5HsYNTZD1k2TyTmM4TunUBFltpKzVyv2dl3INNc5+Yu1FeOX5YbNx5awsPzvZjb2as3d6SaW7JG4ZVrrVavqZPhjilmHrnoSkTNDX3JF' +
'TuHL48PxpQZTuWwZ+TkTXH3K3L50GBrhRfIhHBMvAopBWfazXURyZJvCxHhR4mrMMNOm2+ffz5VRcMx0w6bZpCYe40ptPSZqtTW9Zz+N7Dy6vx4DgSi5' +
'6UBAT9k7FDvD+XeCi56oDBJWBIDBpFq0rcbaioSqwKEXhYz0taBIvCjRqHXikhPDo5ajjwAA3hi/ZkHUgDv3IxFjHgVKUxY8Dvw2g0YUSzcDxp45mAKP' +
'LBhAEp+8mEXsTdAy4Ggni29vJa/evCYTpwlk6BqfGraIUA0xXA0AQmMdD0CiPZkzT5Qwwbmgij/OvQ1X3rgsIEFzuj0MXZTRjqvYwbuiijPOP4zX3rRs' +
'IEKi749BEvqFyD88NQhN5HL2vD2cJCBDgeAhFKYaF5aCl7u5n+rCwHPz1zR3XLqt94O/G0fcmYdAM1iMsAtwYfKy3wo+7BwFuFIkIC4NmoO9N1myI5gD' +
'LMbqAQz/UnRAKNAqTZpEXE8iLCZg0iwKNQt0JAYf+qvecc8BKuei5dir5P4AOpA1sA286PwH/HDkhH5+FvgAAAABJRU5ErkJggg==');

suite.canvasAppearanceTest("paintAmplitude_diag1", 20, 20, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintAmplitude(
        painter,
        new Complex(-Math.sqrt(0.5), Math.sqrt(0.5)),
        new Rect(0, 0, 20, 20),
        "gray",
        "black",
        "lightgray");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABU0lEQVQ4jaWVMY6DMBBFXY3kghP4CgO3sEJBTKgicYM' +
'Q494d9ZzE9/GB/hYRaLNLSLxb/MYaP+nL/49Vzhl7EhG0bQtjDLTW0FrDGIO2bSEiu3dyzlA/D1JKaJoGzIyu6+C9R4wRMUZ479F1Heq6RtM0SCkdA+/' +
'3O4gIl8sFy7IcahgGEBGmadoHhhCglIJz7i1sVQgBVVVhnudnYEoJRATnHJRSGMexCEpEm32VcwYzYxgGLMuCcRyLoX3fg5kfQBFBXddPA3+BMjNEBMp' +
'ai77vfw2UQp1zsNZCGWPgvd8dKoF672GMgdJaI8b4cnCFvgPGGHG9Xt8DP1WMEVrrY8sl2ixba4vC/Ern8/nxKCICZv43cIvNGuxP+nsUmS3Y36sXQii' +
'G7VYv54x5nlFVVRH05XJYNU0TiGi3OXs2iQi32+3/C5aZP1uwn3wBp9Pp8Av4AmKW1g/+js/uAAAAAElFTkSuQmCC');

suite.canvasAppearanceTest("paintAmplitude_zero", 20, 20, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintAmplitude(
        painter,
        Complex.from(0),
        new Rect(0, 0, 20, 20),
        "red",
        "blue",
        "green");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAFUlEQVQ4jWNgGAWjYBSMglEwCqgDAAZUAAHyXCJfAAA' +
'AAElFTkSuQmCC');

suite.canvasAppearanceTest("paintMatrix", 20, 20, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintMatrix(
        painter,
        Matrix.square([
            1, 0, Complex.I,
            new Complex(0.5, -0.5), 0, 0,
            -1, 0.5, 0.25]),
        new Rect(0, 0, 20, 20),
        []);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAChklEQVQ4jaWVsWvbUBDG3+YhQ5eImkDAFrWHJ7QGsmT' +
'NUPCkOz3JMp5CpkCiEtujl2DyB3STEAg6WDRbvWRrB3V5tB7SBpqlJJlCodBCt/brkFg0JkqKc/ANb7gf37t3d08YhgEpJWzbhmVZsG0bUkqYpnkihBj' +
'eJdM0T2Y5lUoFzWYTlmXBMAwIKSU8z0OapsjzHFEUwXVdMPNElAQzT1zXRRRFqNVqGI1G8H0fUkoI27aRpim01tBaI8sydLtdMPPnMiARfdrd3YXWGvV' +
'6HVmWIU1T2LYNYVkW8jyH1hpbW1uo1+tYWVmBlPJHGVApdZ4kSWFAa408z2FZ1rXDOI4Lh1prDAYDENH0HofTXq93KyeO42uHUkq4roswDJEkCQaDAYI' +
'gADNn99Qw830f/X4fSZIgDEO4rntdQ9M0T5h5opQ6bbfbl0Q0ZeaMmYf3AIfMnBHRtN1uXyqlTpl5ctMZYiiEEJ7nPSWiVhnkP2MohBBDx3FeENGfnZ2' +
'dK8/zrojo2aOAnU7nYjweQ2uNg4OD74eHh87CQCklgiDAeDzG2toaNjY2Zn1Y+igPAokIzIzt7W1Uq9XZ+XHAeS0MbDQaF47jfCCiS6XUN8dxvhLRe2Z' +
'+ubBD13Wxt7eHJEnQ6/Xg+/7iDm3bRhRFt8ao3+8Xo0dE60EQnAVBcEZE6w8CK5UKarVasTW01jg6OoLv++dCCKGUerW/v/97eXkZpml+nCdsbm7CMIz' +
'XBbDZbGI0GhUwrTXCMIRS6lQIIZi52+l0frZarV/M3J0HEtFzInpSAC3Lgu/7xYKN43i2YN/ezHRGRMdEdPzPWZZeuewLaDQaF1JK3KXV1dV31Wr1zby' +
'Wlpa+/AVU9LeqRT4BRAAAAABJRU5ErkJggg==');

suite.canvasAppearanceTest("paintMatrixTooltip", 100, 100, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintMatrix(
        painter,
        Matrix.square([
            0.5, 0.5,
            Complex.I, 0.5]),
        new Rect(0, 0, 100, 100),
        [new Point(25, 75)]);
    painter.clear("#FF0000");
    painter.paintDeferred();
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACS0lEQVR4nO3awW2DMBSH8beLF+HmWdjC10zCGD14DmZ' +
'5PVGlVNiuY4e/ou9J36GFtha/EgKKuZmTTnb3AggQ6QARCxCxABELELEAEQsQsQARCxCxABELELEAEQsQsQARCxCxABELELEAEQsQsSyZOY3vqxdkWRZ' +
'PKdHAlmXx1H2GpOTM2EkpjQMJIbiZuZn5vu/TFr1tm4cQpv3+O2cYyLquvq6ru7s/Ho9pB2zbNjczQGogZuY558uvR0yM0UMInCE1kH3f/7xMHQduxgB' +
'SAck5DwHJOXuMsbofIG88Q45rRG0fQAZcQ46DXSvGWMQEpAEkxvjyu6yc88/vKA0gjfchz//l3If0zVAQ5vUBRGwAEZtbQFqfeZX2691Wm5br08h1Hbc' +
'MxzvSt4O0PvMq7de7rTYtz8lmr+vtIK3PvEr79W57/t55Wp+TjV7XlDPk6obvfCBa7+hL+/VuOx/UqymBzFjXrS9Zrc+8Svv1brv6pzn/7RLIjHXdCsI' +
'Z8iaQ1pes42AoXkOO+YhryH+m9ZlXab/ebS1TAxm9rttB3P3XWXR+P17b79VttTmDzF6XBAhzPYCIDSBiA4jYvATCR0nVPkpqdvsHkz+xr16Qnh+ieQE' +
'iFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhY' +
'gYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYn0DITjKQ+HlPi8AAAAASUVORK5CYII='
    , 3000); // Text rendering differs between browsers.
