**Basic Actions**

- **add gate**: `drag` gate from toolbox to circuit
- **move gate**: `drag` gate in circuit
- **copy gate**: `shift + drag` gate in circuit
- **remove gate**: `drag` gate out of circuit **OR** `middle-click` gate
- **undo**: `ctrl + Z`
- **redo**: `ctrl + shift + Z` **OR** `ctrl + Y`
- **save circuit**: bookmark the page with your browser
- **load circuit**: open the bookmark
- **add qubit**: `drag` gate onto extra wire that appears while dragging
- **remove qubit**: re-arrange gates so that the bottom wire is unused
- **show intermediate state**: `drag` a display gate onto the circuit
- **view tips**: `hover` with mouse **OR** awkwardly tap-hold with finger

**Conventions**

- Endianness
  - Bigger is rightward and downward (like English text).
  - Top wire is the low bit. Bottom wire is the high bit.
  - Kets are little-endian. |10100⟩ is 5, not 20.
- Colors
  - Blue: amplitudes
  - Green: probabilities / densities
  - Yellow: change / varying
  - Orange: focused
  - Red: error / attention
