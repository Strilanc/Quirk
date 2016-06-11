import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import Matrix from "src/math/Matrix.js"

const ZeroGate = Gate.fromKnownMatrix(
    "0",
    Matrix.square(0, 0, 0, 0),
    "Zero Gate",
    "Destroys the universe.").
    withCustomDrawer(GatePainting.MAKE_HIGHLIGHTED_DRAWER('white', '#666'));

export default ZeroGate;
