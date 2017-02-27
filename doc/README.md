**Basic Actions**

- **add gate**: `drag` gate from toolbox to circuit
- **move gate**: `drag` gate in circuit
- **remove gate**: `drag` gate out of circuit **OR** `middle-click` gate
- **undo**: `ctrl + Z` **OR** click 'undo' button
- **redo**: `ctrl + shift + Z` **OR** `ctrl + Y` **OR** click 'redo' button
- **save circuit**: bookmark the page with your browser
- **load circuit**: open the bookmark
- **add qubit**: `drag` gate onto extra wire that appears while dragging
- **remove qubit**: re-arrange gates so that the bottom wire is unused
- **show intermediate state**: `drag` a display gate onto the circuit
- **view tips**: `hover` with mouse **OR** awkwardly tap-hold with finger

**Advanced Actions**

- **copy gate**: `shift + drag` gate in circuit
- **move column**: `ctrl + drag` in circuit
- **copy column**: `ctrl + shift + drag` in circuit
- **create custom gate**: click 'Make Gate' button
- **remove custom gate**: [crummy support] have to use undo or clear all or manually edit URL

**Conventions**

- Coordinates
  - Right-handed
  - X is +right/-left
  - Y is +forward/-backward
  - Z is +up/-down
- Ordering
  - Top wire is the low bit. Bottom wire is the high bit.
  - Kets are big-endian. |00101⟩ is 5, not 20.
  - Listed/grided values are in ascending row-major order from top left to bottom right.
- Colors
  - Blue: amplitudes
  - Green: probabilities / densities
  - Yellow: change / varying
  - Orange: focused
  - Red: error / attention
