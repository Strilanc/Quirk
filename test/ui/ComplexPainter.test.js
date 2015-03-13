import { Suite, assertThat, fail } from "test/TestUtil.js"
import Painter from "src/ui/Painter.js"
import ComplexPainter from "src/ui/ComplexPainter.js"
import Point from "src/base/Point.js"
import Rect from "src/base/Rect.js"

let suite = new Suite("ComplexPainter");

suite.canvasAppearanceTest("paintConditionalProbabilityBox_c=2/3_p|c=1/3", 40, 40, canvas => {
    let painter = new Painter(canvas);
    ComplexPainter.paintConditionalProbabilityBox(
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
    ComplexPainter.paintConditionalProbabilityBox(
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
        ComplexPainter.paintConditionalProbabilityBox(
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
