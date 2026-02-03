# Shamus+ Implementation Roadmap

## Executive Summary

This document provides a complete implementation plan for refactoring Shamus+ (2017 Atari 8-bit patch) into a modern TypeScript/JavaScript web application. The architecture has been designed based on:

1. **Binary Analysis**: Full 640-byte MAP segment structure decoded from PDF specs
2. **Assembly Analysis**: ADVANCETNMT routine and $0206 speed control logic analyzed
3. **Visual References**: Atari Aesthetic specifications from directive

## Key Technical Findings

### Memory Map Translation

| 6502 Address | TypeScript Equivalent | Purpose |
|--------------|----------------------|---------|
| $0206 | `gameState.shamusSpeed` | Delay loop counter (slx patch fixes negative values) |
| $0202 | `gameState.lives` | Lives counter (+1 per tournament maze) |
| $23F2-$2471 | `room.horizontalWalls` | Segment 1: Horizontal walls + corridor flags |
| $2472-$24F1 | `room.verticalWalls` | Segment 2: Vertical walls + vertical exits |
| $1D43-$1DC2 | `room.object` | Segment 3: Objects (key, potion, mystery, Shadow) |
| $1DC3-$1E42 | `room.object.color/luma` | Segment 4: Color data + door position |
| $1EE3-$1EEA | `maze.podRooms` | Segment 5: Pod room list (max 8) |
| $24F8-$24FA | `maze.levelBoundaries` | Last rooms of black/blue/green levels |

### Tournament Mode (ADVANCETNMT)

```
Sequence: Holmes → Cluseau → Marlowe → Bond
- Original C64 skipped (identical to Atari)
- +1 life per maze completed
- Base speed $05 (faster than normal $07)
- After completing all: speed $04, restart at maze 0
```

### Corridor Types (7 Atari Variants)

| Hex | Type | Description |
|-----|------|-------------|
| $80 | DEAD_END_BOTTOM | Dead end open at bottom |
| $90 | BOTTOM_TO_RIGHT | Angled corridor |
| $A0 | BOTTOM_TO_LEFT | Angled corridor |
| $B0 | T_BOTTOM_EXIT | T-junction |
| $C0 | DEAD_END_TOP | Dead end open at top |
| $D0 | TOP_TO_RIGHT | Angled corridor |
| $E0 | TOP_TO_LEFT | Angled corridor |
| $F0 | T_TOP_EXIT | T-junction |

## Implementation Phases

### Phase 1: Foundation (Week 1)

#### 1.1 Project Setup
```
├── src/
│   ├── types/
│   │   └── index.ts          # Core interfaces
│   ├── parser/
│   │   └── BinaryParser.ts   # MAP → JSON
│   └── data/
│       └── SHAM_A8.MAP       # Binary map data
├── tests/
│   └── parser.test.ts
├── public/
│   └── assets/
├── package.json
└── tsconfig.json
```

#### 1.2 Core Types (see [`typescript-interfaces.md`](plans/typescript-interfaces.md))
- `Room` interface with wall grids
- `Enemy` union types for AI behaviors
- `GameState` with tournament logic
- `CorridorType` enum (7 variants)

#### 1.3 Binary Parser (see [`binary-parser-spec.md`](plans/binary-parser-spec.md))
```typescript
class BinaryParser {
  parseMapSegment(buffer: Uint8Array, mazeType: MazeType): ParsedMaze;
  
  private decodeSegment1(byte: number): WallData;
  private decodeSegment2(byte: number): VerticalData;
  private decodeSegment3(byte: number): ObjectType;
  private decodeSegment4(byte: number): ColorData;
  private decodeSegment5(buffer: Uint8Array): PodRoomData;
}
```

**Key parsing logic:**
- Bits 0-5: Wall segments (6 horizontal, 6 vertical)
- Bit 7: Corridor flag
- Bits 4-6: Corridor type (if corridor)
- Bit 4 (Segment 4): Door position

### Phase 2: Engine Core (Week 2)

#### 2.1 Room Manager
- Room transition state machine
- Vertical exit handling (Segment 2)
- Level boundary detection (Segment 5)

#### 2.2 Physics Engine
```typescript
class PhysicsEngine {
  checkCollision(entity: Entity, dx: number, dy: number): CollisionResult;
  
  // Atari quirks
  applyHatGapCheck(shot: Projectile, enemy: Enemy): boolean;
  applyIonShivWallCheck(shot: Projectile): boolean;
  increaseSpeedAfterClear(): void;  // Shamus speed increase
}
```

#### 2.3 AI Controller
```typescript
class AIController {
  // Enemy types
  whirlingDrones: WhirlingDrone[];   // Persistent tracking
  snapJumpers: SnapJumper[];          // Jump patterns
  roboDroids: RoboDroid[];            // Patrol + aggro
  shadowEnforcer: ShadowEnforcer;     // Immediate movement
  
  update(deltaTime: number): void;
  setDifficulty(level: number): void;  // $0206 register logic
}
```

### Phase 3: Game Logic (Week 3)

#### 3.1 State Management
```typescript
class GameState {
  currentMaze: MazeType;
  currentRoom: number;
  lives: number;
  score: number;
  shamusSpeed: number;  // $0206 equivalent
  
  // Tournament
  tournament: TournamentState;
  advanceTournament(): void;  // Port of ADVANCETNMT
  
  // Speed control (slx patch)
  updateSpeed(): void;
  // Ignore negative speed values to prevent slowdown
}
```

#### 3.2 Tournament Mode (ADVANCETNMT)
```typescript
// From Shamuspl.asm lines 498-536
function advanceTournament(): void {
  if (!tournament.active) return;
  
  // Add one life
  lives++;
  
  // Default speed $05 for next maze
  let nextSpeed = 0x05;
  
  // Check if finished all mazes
  if (currentMazeIndex >= mazeSequence.length - 1) {
    // Complete - increase difficulty
    nextSpeed = 0x04;
    currentMazeIndex = 0;
  } else {
    // Advance to next maze
    currentMazeIndex++;
  }
  
  shamusSpeed = nextSpeed;
  loadMaze(mazeSequence[currentMazeIndex]);
}
```

### Phase 4: Rendering & Audio (Week 4)

#### 4.1 Atari Renderer
```typescript
class AtariRenderer {
  canvas: HTMLCanvasElement;
  
  // Atari Glow effect (CSS/WebGL)
  applyAtariGlow(): void {
    // Pulsating wall luma
    // Color register shifts
  }
  
  // Sprite rendering
  renderSprites(sprites: Sprite[]): void;
  
  // Room rendering
  renderRoom(room: Room): void;
}
```

#### 4.2 Audio System
```typescript
class AudioSystem {
  // Atari specific
  playAtariPing(): void;     // Enemy shots
  playBackgroundHum(): void; // Ambient sound
  playWarning(): void;       // Before Shadow
  
  // C64 specific (silent)
  muteForC64Maze(): void;    // No enemy shot sounds
  
  // Dynamic based on current maze
  updateForMazeType(type: MazeType): void;
}
```

### Phase 5: UI & Polish (Week 5)

#### 5.1 UI Overlay
```typescript
class UIManager {
  // OPTION key maze selector
  showMazeSelector(): void;
  selectMaze(index: number): void;
  
  // SPACE bar pause
  togglePause(): void;
  
  // HUD
  updateHUD(state: GameState): void;
}
```

#### 5.2 Keyboard Input
- `OPTION`: Cycle through mazes / Tournament mode
- `SPACE`: Pause game
- `FIRE` (space/enter): Resume from pause

## Atari-Specific Behaviors to Preserve

### 1. "Hat Gap" Hitbox
```typescript
// Shamus has a gap between hat and head
// Shots can pass through this gap
interface PlayerHitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  hatGapY: number;        // Where gap starts
  hatGapHeight: number;   // Gap size
}
```

### 2. ION-SHIV Wall Penetration
```typescript
// Atari ION-SHIVs can kill enemies through walls
// when enemy touches the wall
function checkIonShivCollision(shot: Projectile, enemy: Enemy): boolean {
  if (shot.type === 'ION-SHIV' && enemy.touchingWall) {
    return true;  // Kill through wall
  }
  return false;
}
```

### 3. Shamus Speed Increase
```typescript
// Speed increases after clearing all enemies in room
// Controlled by $0206 register
function increaseSpeedAfterClear(): void {
  if (room.cleared && !speedBoostActive) {
    shamusSpeed -= 1;  // Decrease delay = increase speed
    speedBoostActive = true;
  }
}
```

### 4. Shadow Enforcer Behavior
```typescript
interface ShadowEnforcer {
  // Atari: Immediate movement (not gradual)
  immediateMoveTo(target: Point): void;
  
  // Atari: Items despawn when Shadow appears
  despawnItems(): void;
  
  // Spawns in room 127
  spawnRoom: 127;
}
```

### 5. slx $0206 Register Patch
```typescript
// Original bug: negative speed values cause 65535 loop iterations
// slx fix: ignore negative speed values
function applyDelayLoop(speed: number): void {
  if (speed <= 0) {
    // Execute only one iteration instead of 255
    runDelayIteration();
  } else {
    for (let i = 0; i < speed; i++) {
      runDelayIteration();
    }
  }
}
```

## Visual Reference Requirements

### Atari Aesthetic
- **Pulsating walls**: Color register shifts create "glow" effect
- **Wall luma**: Alternating brightness on wall segments
- **Color palette**: 16 Atari colors (hue + luma)
- **"Space Dungeon" vibe**: Darker, gloomier than C64

### C64 Aesthetic (for C64 mazes)
- **"Wallpaper" look**: Brighter yellow surrounding maze
- **Solid walls**: Cleaner look, no pulsation
- **Silent**: No enemy shot sounds

## File Structure (Final)

```
src/
├── index.ts                    # Entry point
├── types/
│   ├── index.ts               # Core interfaces
│   ├── Room.ts                # Room structures
│   ├── Enemy.ts               # Enemy types
│   └── Game.ts                # Game state types
├── parser/
│   ├── BinaryParser.ts        # MAP → JSON
│   ├── MapLoader.ts           # File loading
│   └── CorridorClassifier.ts  # 7 corridor types
├── engine/
│   ├── PhysicsEngine.ts       # Collision + movement
│   ├── CollisionSystem.ts     # Hit detection with quirks
│   └── AIController.ts        # Enemy behaviors
├── entities/
│   ├── Player.ts              # Shamus
│   ├── Enemy.ts               # Base enemy
│   ├── WhirlingDrone.ts       # Persistent tracking
│   ├── SnapJumper.ts          # Jump patterns
│   ├── RoboDroid.ts           # Patrol logic
│   └── ShadowEnforcer.ts      # Atari immediate move
├── state/
│   ├── GameState.ts           # State management
│   ├── TournamentMode.ts      # ADVANCETNMT port
│   └── RoomManager.ts         # Room transitions
├── render/
│   ├── AtariRenderer.ts       # Canvas/WebGL
│   ├── AtariGlow.ts           # Glow effect shader
│   └── SpriteSheet.ts         # Sprite management
├── audio/
│   ├── AudioSystem.ts         # Context management
│   ├── AtariPing.ts           # Enemy shot sound
│   └── C64Mute.ts             # Silent mode
├── ui/
│   ├── OptionSelector.ts      # [OPTION] maze select
│   ├── PauseFunction.ts       # [SPACE] pause
│   └── HUD.ts                 # Score/lives/level
└── data/
    └── SHAM_A8.MAP            # Binary map data
```

## Testing Checklist

### Parser Tests
- [ ] All 5 mazes parse correctly (640 bytes each)
- [ ] 128 rooms per maze
- [ ] Wall bits correctly decoded (0-5)
- [ ] Corridor flags detected (bit 7)
- [ ] 7 corridor types classified
- [ ] Vertical exits extracted
- [ ] Objects decoded (0,1,2,3,4,6)
- [ ] Colors + luma extracted
- [ ] Pod room list parsed
- [ ] Level boundaries correct

### Engine Tests
- [ ] Room transitions work
- [ ] Vertical exits connect correctly
- [ ] Collision detection accurate
- [ ] Hat gap hitbox works
- [ ] ION-SHIV wall penetration works
- [ ] Speed increases after room clear
- [ ] Speed patch prevents negative slowdown

### AI Tests
- [ ] Whirling Drones track persistently
- [ ] Snap Jumpers follow jump patterns
- [ ] Robo Droids patrol correctly
- [ ] Shadow Enforcer moves immediately
- [ ] Shadow despawns items

### Tournament Tests
- [ ] Sequence: Holmes → Cluseau → Marlowe → Bond
- [ ] +1 life per maze
- [ ] Speed $05 for tournament mazes
- [ ] Loop back with speed $04 after completion

## Next Steps

1. **Review this plan** - Confirm architecture meets requirements
2. **Switch to Code mode** - Begin implementation with BinaryParser
3. **Implement core types** - Room, Enemy, GameState interfaces
4. **Build parser** - Convert 640-byte segments to JSON
5. **Test with real data** - Use extracted SHAM_A8.MAP

## Resources

- [`plans/shamus-plus-refactor-plan.md`](plans/shamus-plus-refactor-plan.md) - High-level architecture
- [`plans/system-architecture.md`](plans/system-architecture.md) - System diagrams
- [`plans/typescript-interfaces.md`](plans/typescript-interfaces.md) - Type definitions
- [`plans/binary-parser-spec.md`](plans/binary-parser-spec.md) - Parser specification
- [`Shamus+/New Mazes for Shamus.pdf`](Shamus+/New Mazes for Shamus.pdf) - Technical reference
- [`Shamus+/Shamuspl.asm`](Shamus+/Shamuspl.asm) - Assembly source
