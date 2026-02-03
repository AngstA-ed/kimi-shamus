# Shamus+ High-Fidelity Refactor & Port - Architecture Plan

## Project Overview

Refactoring and porting Shamus+ (2017 Atari 8-bit patch of the 1982 classic) into a modern TypeScript/JavaScript web application. This involves translating binary data structures and 6502 assembly logic into a clean, performant, and modular game engine.

---

## Source Materials Analysis

### Required Files (from Shamus+.zip)
- [ ] `New Mazes for Shamus.pdf` - Technical specification for binary memory segments
- [ ] `SHAM_A8.MAP` - Binary map data (640-byte segments)
- [ ] `Shamuspl.asm` - Assembly source with ADVANCETNMT routine
- [ ] C64 maze files (Holmes, Cluseau, Marlowe, Bond)

### Visual References (External)
- AtariMania: Shamus Profile - "pulsating" wall luma and color registers
- LaunchBox Shamus Gallery - pixel-accurate sprite reference
- Pixelated Arcade - Atari "Space Dungeon" aesthetic vs C64 "Wallpaper" look

---

## Core Architecture

### Module Structure

```
src/
├── parser.ts          # Binary MAP parser → JSON room layouts
├── engine.ts          # AI & Physics engine
├── state.ts           # Game state & Tournament mode
├── renderer/          # Display & visual effects
│   ├── atari-glow.ts  # CSS filters/WebGL shaders
│   └── sprites.ts     # Sprite rendering
├── audio/             # Audio system
│   └── atari-ping.ts  # Atari "ping" recreation
├── ui/                # User interface
│   ├── overlay.ts     # [OPTION] maze selector
│   └── pause.ts       # [SPACE] bar pause
└── types/             # TypeScript interfaces
    └── index.ts       # Room, Enemy, GameState interfaces
```

---

## Component Specifications

### A. Binary Parser (`/src/parser.ts`)

#### Wall Decoding
- Parse SHAM_A8.MAP segments 1 and 2
- Use bits 0-5 to generate grid-based collision map
- 640-byte segment → playable JSON room layout

#### Corridor Mapping
- Implement 7 specific corridor types:
  1. Straight horizontal
  2. Straight vertical
  3. Angled/Corner
  4. T-junction (3-way)
  5. Cross intersection (4-way)
  6. Dead end
  7. Special connectors

#### Vertical Pointers
- Segment 3 contains "Room ID" for vertical exits
- State-based room transition system

### B. AI & Physics Engine (`/src/engine.ts`)

#### Enemy AI Behaviors
| Enemy Type | Behavior Pattern |
|------------|------------------|
| Whirling Drones | Persistent tracking logic |
| Snap Jumpers | Specific jump patterns |
| Robo Droids | Patrol + aggro patterns |
| Shadow Enforcer | Atari-style immediate movement, item-despawning |

#### Physics Quirks
- "Shamus Speed" increase after clearing a room
- Scaling difficulty from slx's $0206 register patch

#### Collision System
- "Hat Gap" hitbox: shots pass between hat and head
- "ION-SHIVs killing through walls" bug/feature (Atari-specific)

### C. Game State & Tournament (`/src/state.ts`)

#### Tournament Mode
- Port ADVANCETNMT routine from Shamuspl.asm
- Sequence: Holmes → Cluseau → Marlowe → Bond → [Final]

#### State Management
- Room transitions
- Score/lives tracking
- Difficulty scaling
- Power-up states

---

## TypeScript Interface Definitions

```typescript
// Core Room Structure
interface Room {
  id: number;
  walls: WallTile[][];        // Grid-based collision map
  corridors: Corridor[];      // 7 corridor types
  exits: {
    north?: number;           // Room ID
    south?: number;
    east?: number;
    west?: number;
    vertical?: number;        // From segment 3
  };
  enemies: EnemySpawn[];
  items: Item[];
  cleared: boolean;
}

interface WallTile {
  x: number;
  y: number;
  type: 'solid' | 'breakable' | 'gap';
  bits: number;               // Original bits 0-5
}

interface Corridor {
  type: 'straight-h' | 'straight-v' | 'angled' | 't-junction' | 'cross' | 'dead-end' | 'special';
  x: number;
  y: number;
  orientation: number;
}

interface EnemySpawn {
  type: 'whirling-drone' | 'snap-jumper' | 'robo-droid' | 'shadow-enforcer';
  x: number;
  y: number;
  patrolPath?: Point[];
}

interface GameState {
  currentRoom: number;
  lives: number;
  score: number;
  inventory: Item[];
  tournament: {
    active: boolean;
    currentMaze: 'holmes' | 'clusseau' | 'marlowe' | 'bond';
    mazeIndex: number;
  };
  shamusSpeed: number;        // Increases per room clear
  difficulty: number;         // From $0206 register logic
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Extract and analyze zip contents
- [ ] Set up TypeScript project structure
- [ ] Create type definitions
- [ ] Implement binary parser core

### Phase 2: Engine
- [ ] Room rendering system
- [ ] Collision detection (with quirks)
- [ ] Enemy AI implementations
- [ ] Physics engine

### Phase 3: Game Logic
- [ ] State management
- [ ] Tournament mode sequencing
- [ ] Room transitions
- [ ] Score/lives tracking

### Phase 4: Polish
- [ ] Audio: Atari "ping" for enemy shots
- [ ] Display: CSS filters/WebGL "Atari Glow"
- [ ] UI: [OPTION] maze selector overlay
- [ ] UI: [SPACE] bar pause function

### Phase 5: Authenticity
- [ ] C64 mazes silent mode
- [ ] Pixel-accurate sprites
- [ ] Atari Aesthetic replication

---

## Next Steps

1. Extract Shamus+.zip to examine source materials
2. Review `New Mazes for Shamus.pdf` for binary segment details
3. Analyze `Shamuspl.asm` for ADVANCETNMT routine
4. Begin implementing Parser class with Room interface
5. Create first iteration: 640-byte MAP segment → JSON

---

## Technical Notes

### Binary Segment Layout (Expected)
```
SHAM_A8.MAP Segment Structure:
- Segment 1: Wall data bits 0-5 (collision map)
- Segment 2: Extended wall/corridor data
- Segment 3: Vertical exit Room IDs
- Total: 640 bytes per room
```

### slx $0206 Register Patch
- Difficulty scaling mechanism
- Enemy speed/behavior modifiers
- Tournament progression trigger

### Atari-Specific Behaviors to Preserve
1. ION-SHIV wall penetration
2. Hat gap hitbox
3. Shadow Enforcer instant movement
4. Item despawn behavior
