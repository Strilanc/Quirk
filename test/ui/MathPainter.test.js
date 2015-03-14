import { Suite, assertThat, fail } from "test/TestUtil.js"
import Painter from "src/ui/Painter.js"
import MathPainter from "src/ui/MathPainter.js"
import Point from "src/base/Point.js"
import Rect from "src/base/Rect.js"
import Complex from "src/math/Complex.js"

let suite = new Suite("MathPainter");

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

suite.canvasAppearanceTest("paintProbabilityBox_p=-", 40, 40, canvas => {
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
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACdklEQVRYhe2ZP66jMBDG5wzpIgUpT9ClpnIBDXIXKVI' +
'kiigNHTQRXdLRJmegccUROICP4JomJ8gNvi2e7IXwL+TtW2nfgjQyfBj888zYGgS5roskSSbZ+XxGlmXfbr7vg5IkgVJqkj0eD/yNI8uyGXAG/FmAcRy' +
'DiEBEKIpiVLdtG0QEzrnRrtcr4jhuA6ZpagAYY5MBi6IwA0kpQUSDupTSgHDOUVUVAJj7LUDLsr4EWD/qIH16F2Acxw0PG0DGGIjIgNUB0zQ14dGT+Pj' +
'46IXT4awP1KfrEMdxjKqqYNt245lRDwohGnqapkjT9KVF0gU5pGvvcc5NXo4C3m63Rm4qpVCW5UuAnHNcr9eXdCklOOem1f2iKJrmQSEEGGOji6SqKhA' +
'RpJS9+jO0lLIbcLvdIs9zEBE2mw3yPDdtnufY7/cmB4kIeZ5jtVrhfr+37Hg8mn6Xy2VUv9/vuFwu8DzPXHueByKC53mf+e/7fquKcBxnsMooy3Ly3vm' +
'OJUnyjwKO2Qw4A86AM+AMOAN+D6AufIkIYRiO6pZlNQplpT5rTt2nARgEwZcA6y9WSoGITD3ZpQshjM4YM+8kom4PLhaLPxpixlir2K3rXYBhGOJ2u7U' +
'BHccBEXVWMUEQmPDoSSyXy0G4sixBRK2JPOs6xGEYoizLRnE86EF9HkVRQw+CAEEQjHrQsiwIIV7WlVLGe/UPuNEQ7/f7Vm6eTqdBwC7PDelK/f6U0K0' +
'O+263GwZ89mAURXAcp3egeoK/otfzUggxDPhKDhJRbw6GYdjop1drn15f/fVtpjfE/8VGPQPOgO8Artdr+L4/yQ6Hw+RfF++Y67r4BXIquDw9whbbAAA' +
'AAElFTkSuQmCC',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);

suite.canvasAppearanceTest("paintConditionalProbabilityBox_100%", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintConditionalProbabilityBox(
        painter,
        1,
        1,
        new Rect(0, 0, 40, 40),
        "red",
        "blue",
        "green");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAA9klEQVRYhe2ZwQ3DIAxF/wxMkEMG4cIGTMACXYHN6QV' +
'LLgSFBlrc1IevYKOYF7CQvgJsSLBCtSEBFglRqKwCKuCdAYGEwGKfc8jjs3wF6NjEPgGuBKQ45PFZvgI0kwBNsXDMT16fQx3lK8A9TxIYB3RsR6gYL9p' +
'zxL54x+RcK9+9g+UXOry2wnJAfwD0uAA4fMS9OxjQ35/lYhwKHfkKsKcHqcC7PUinQTUuXTNco9fMLP0uoBQpoAKulgIq4Gr9NyDwQU8yA64EpHiKJxn' +
'RVzwJl0hPQmOxnoQ3sEhPEhuFxXiSVg9SgeWeRIoUUAFXyyJB+m+IJ4TY5jWQDLdyAAAAAElFTkSuQmCC',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.););

suite.canvasAppearanceTest("paintConditionalProbabilityBox_0%", 40, 40, canvas => {
    let painter = new Painter(canvas);
    MathPainter.paintConditionalProbabilityBox(
        painter,
        0,
        0.5,
        new Rect(0, 0, 40, 40),
        "red",
        "pink",
        "yellow");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABWUlEQVRYhe2ZwY2EMAxFfy9phFsK2A72RhdcqYRCqIN' +
'avIeJZx0rDkwmCEbjw5cQmPCwk8gfMAA03VQDQJgAoptqckAH/CbABSAkLepaAGgrxGSAs7ghngAIgNYkiPObeJ6OyQDDiYCrGp9BODGzEfPLgDGdYDA' +
'JOIu08wABrwEu6p4gyhwTXCnmZy+D+q34bVvmnwWISswu4FIA2jqWeAVorMQ8S3w0gyva52dpkYzIV3R1kRyZgzzwq3OQq6G3Gd5erBhzHzxjm2nR5wL' +
'eRQ7ogFfLAR3wajkgy/IjAXmTQng0J9yCmZ6kt0qtluwFI/67GulXTE/SU0eaVQbU/eETUHsSqXc9Sa3d5xKPCVCPa2aQj3t4khqgFGdPJmu3xD08Sc1' +
'yypiI3FJEVDyJNXirJ7FMOyuK6ybgkTnY6klqnz1m9VyzxHeUAzrg1ZoAwoDrfzdYGgD6A2QemHqQMjYFAAAAAElFTkSuQmCC',
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
