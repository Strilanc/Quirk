# "circuit" Directory

Contains classes that:

- Represent persistent pieces of a quantum circuit
- May depend on things from "base", "math", and "pipeline"
- Currently has some unfortunate cyclic dependencies up to "ui"
- May use config data
- May depend on each other
