# Shamus+ TypeScript Interface Definitions

## Core Types

### Wall and Room Structure

```typescript
/**
 * Represents a single wall segment in the grid
 * The grid is arranged in a 3x3 pattern:
 * 
 *     ||
 *   --+--+--
 *     ||
 *   --+--+--
 *     ||
 * 
 * Horizontal walls: bits 0-5 (positions 0-2 top, 3-5 bottom)
 * Vertical walls: bits 0-5 (positions 0-2 left, 3-5 right)
 */
interface WallTile {
  x: number;           // Grid X position (0-2)
  y: number;           // Grid Y position (0-2)
  type: 'solid' | 'breakable' | 'gap' | 'electrocuting';
  exists: boolean;     // Whether wall segment is present
  bitIndex: number;    // Original bit position (0-5)
}

/**
 * Atari corridor types (from PDF page 856-874)
 * High bit (7) set indicates corridor, bits 4-6 define type
 */
enum CorridorType {
  // Dead ends
  DEAD_END_BOTTOM = 0x80,  // $80 - Dead end open at bottom
  DEAD_END_TOP = 0xC0,     // $C0 - Dead end open at top
  
  // Angled corridors
  BOTTOM_TO_RIGHT = 0x90,  // $90 - Bottom to right angled
  BOTTOM_TO_LEFT = 0xA0,   // $A0 - Bottom to left angled
  TOP_TO_RIGHT = 0xD0,     // $D0 - Top to right angled
  TOP_TO_LEFT = 0xE0,      // $E0 - Top to left angled
  
  // T-junctions
  T_BOTTOM_EXIT = 0xB0,    // $B0 - T with bottom exit
  T_TOP_EXIT = 0xF0,       // $F0 - T with top exit
  
  // Not a corridor
  NONE = 0x00
}

/**
 * C64 corridor equivalents (for reference during conversion)
 * Listed in PDF as C64 Segment1/Segment2 pairs
 */
interface C64CorridorEquivalent {
  atariType: CorridorType;
  c64Segment1: number;
  c64Segment2: number;
}

const C64_CORRIDOR_MAP: C64CorridorEquivalent[] = [
  { atariType: CorridorType.DEAD_END_BOTTOM, c64Segment1: 0x40, c64Segment2: 0x6C },
  { atariType: CorridorType.BOTTOM_TO_RIGHT, c64Segment1: 0x64, c64Segment2: 0x64 },
  { atariType: CorridorType.BOTTOM_TO_LEFT, c64Segment1: 0xD0, c64Segment2: 0x2C },
  { atariType: CorridorType.T_BOTTOM_EXIT, c64Segment1: 0xF4, c64Segment2: 0x24 },
  { atariType: CorridorType.DEAD_END_TOP, c64Segment1: 0x08, c64Segment2: 0xD8 },
  { atariType: CorridorType.TOP_TO_RIGHT, c64Segment1: 0x2C, c64Segment2: 0xD0 },
  { atariType: CorridorType.TOP_TO_LEFT, c64Segment1: 0x98, c64Segment2: 0x98 },
  { atariType: CorridorType.T_TOP_EXIT, c64Segment1: 0xBC, c64Segment2: 0x90 },
];

interface Corridor {
  type: CorridorType;
  verticalExitRoomId: number;  // From segment 2 for corridor rooms
  description: string;
}

/**
 * Object types in Segment 3 ($1D43-$1DC2)
 */
enum ObjectType {
  NONE = 0x00,      // $00 - No object
  KEYHOLE = 0x01,   // $01 - Keyhole (lock)
  KEY = 0x02,       // $02 - Key
  MYSTERY = 0x03,   // $03 - Mystery bonus (?)
  POTION = 0x04,    // $04 - Potion (extra life)
  SHADOW = 0x06     // $06 - The Shadow
}

/**
 * Object with color encoding from Segment 4
 * Lower nibble: color, Upper nibble: luma (bits 5-7)
 * Bit 4: door position (0=right exit closed, 1=left exit closed)
 */
interface RoomObject {
  type: ObjectType;
  color: number;           // Atari color value (after rotation)
  luma: number;            // Brightness 0-7 (stored in bits 5-7)
  doorClosesLeft: boolean; // Bit 4: true=left exit closed, false=right exit closed
  x?: number;              // Randomly placed at one of 9 grid positions
  y?: number;
}

/**
 * Room structure - 128 rooms per maze ($00-$7F)
 */
interface Room {
  id: number;              // Room number 0-127
  
  // Wall data from Segment 1 ($23F2-$2471)
  horizontalWalls: WallTile[];  // Bits 0-5
  verticalWalls: WallTile[];    // Bits 0-5 from Segment 2
  
  // Room type
  isCorridor: boolean;
  isPodRoom: boolean;
  corridor?: Corridor;
  
  // Objects from Segment 3
  object?: RoomObject;
  
  // Exits
  exits: {
    north?: number;        // Room ID for vertical exit (from Segment 2 for corridors)
    south?: number;        // Same room ID - both directions lead to same room
    east: number;          // Always room + 1
    west: number;          // Always room - 1
  };
  
  // Room state
  cleared: boolean;        // All enemies defeated
  visited: boolean;        // Player has entered
  
  // Enemy spawns (procedurally generated per PDF)
  enemies: EnemySpawn[];
}

/**
 * Pod room entry from Segment 5
 * Byte 0: count, Bytes 1+: room numbers
 */
interface PodRoomEntry {
  roomId: number;
  barriersActive: boolean;
}

/**
 * Level boundaries from Segment 5 (last 3 bytes $7D-$7F)
 * These are the LAST rooms of each color level
 */
interface LevelBoundaries {
  blackLevelEnd: number;   // Last room of black level
  blueLevelEnd: number;    // Last room of blue level
  greenLevelEnd: number;   // Last room of green level
  // Red level continues to room 127
}
```

## Enemy Types

```typescript
enum EnemyType {
  WHIRLING_DRONE = 'whirling-drone',
  SNAP_JUMPER = 'snap-jumper',
  ROBO_DROID = 'robo-droid',
  SHADOW_ENFORCER = 'shadow-enforcer'
}

interface EnemySpawn {
  type: EnemyType;
  x: number;
  y: number;
  // Procedurally determined per PDF - varies by room/level
  count?: number;
  patrolPath?: Point[];
}

interface Point {
  x: number;
  y: number;
}

/**
 * Whirling Drone - Persistent tracking behavior
 * Atari: Whirls around and tracks player persistently
 */
interface WhirlingDrone {
  type: EnemyType.WHIRLING_DRONE;
  position: Point;
  velocity: Point;
  trackingPlayer: boolean;
  lastKnownPlayerPos: Point;
  
  // AI state
  update(deltaTime: number, player: Player): void;
  persistentTrack(player: Player): void;
}

/**
 * Snap Jumper - Jump pattern behavior
 * Atari: Crouches then jumps in specific pattern
 */
interface SnapJumper {
  type: EnemyType.SNAP_JUMPER;
  position: Point;
  
  // Jump mechanics
  state: 'idle' | 'crouch' | 'jump' | 'airborne' | 'landing';
  crouchTimer: number;
  crouchDuration: number;
  jumpVelocity: number;
  
  // AI
  performJump(): void;
  update(deltaTime: number, player: Player): void;
}

/**
 * Robo Droid - Patrol + aggro behavior
 */
interface RoboDroid {
  type: EnemyType.ROBO_DROID;
  position: Point;
  patrolPath: Point[];
  currentPatrolIndex: number;
  aggroRange: number;
  state: 'patrol' | 'chase' | 'attack';
}

/**
 * Shadow Enforcer - Atari-style immediate movement
 * Key behaviors:
 * - Immediate movement (not gradual)
 * - Items despawn when Shadow appears (Atari specific)
 * - Appears in room 127 (middle of pod room)
 */
interface ShadowEnforcer {
  type: EnemyType.SHADOW_ENFORCER;
  position: Point;
  targetPosition: Point;
  
  // Atari-specific behaviors
  immediateMoveTo(target: Point): void;
  despawnItems(): void;
  
  // Spawn in room 127 only
  spawnRoom: 127;
}
```

## Game State

```typescript
enum MazeType {
  ORIGINAL_ATARI = 0,
  ORIGINAL_C64 = 1,
  HOLMES = 2,
  CLUSEAU = 3,
  MARLOWE = 4,
  BOND = 5,
  TOURNAMENT = 6
}

interface Maze {
  type: MazeType;
  name: string;
  rooms: Room[];
  podRooms: PodRoomEntry[];
  levelBoundaries: LevelBoundaries;
  totalRooms: 128;
}

/**
 * Tournament state machine
 * Based on ADVANCETNMT routine (lines 498-536 in Shamuspl.asm)
 */
interface TournamentState {
  active: boolean;
  currentMazeIndex: number;
  mazesCompleted: number;
  
  // Sequence: Holmes -> Cluseau -> Marlowe -> Bond
  // (Original C64 skipped as it's almost identical to Atari)
  mazeSequence: MazeType[];
  
  // Speed progression: $05 default, $04 after completing all
  baseSpeed: number;
}

/**
 * Game state - mirrors 6502 memory layout
 * Key addresses from assembly:
 * $0206: Speed control variable
 * $0202: Lives counter (tournament adds 1 life per maze)
 * $208, $235: Current room
 */
interface GameState {
  // Current game state
  currentMaze: MazeType;
  currentRoom: number;
  lives: number;
  score: number;
  inventory: {
    keys: number;        // Keys collected
    hasIonShiv: boolean; // Special weapon
  };
  
  // Speed control (from $0206)
  // Controls delay loop at $2F98
  // $07 = NOVICE, decreases by 2 per difficulty, by 1 per level
  // Bug fix: negative values ignored (slx patch)
  shamusSpeed: number;
  
  // Difficulty settings
  difficulty: 'NOVICE' | 'ADVANCED' | 'EXPERT';
  
  // Tournament mode
  tournament: TournamentState;
  
  // Level progression
  currentLevel: 'BLACK' | 'BLUE' | 'GREEN' | 'RED';
  
  // Room state
  roomCleared: boolean;  // Speed increases after clearing (Atari specific)
  enemiesDefeated: number;
  
  // Pause state
  paused: boolean;
  
  // Methods
  advanceTournament(): void;
  updateSpeed(): void;
  increaseSpeedAfterClear(): void;
}

/**
 * Player (Shamus) state
 */
interface Player {
  position: Point;
  velocity: Point;
  facing: 'left' | 'right' | 'up' | 'down';
  
  // Hitbox - "Hat Gap" on Atari
  hitbox: {
    x: number;
    y: number;
    width: number;
    height: number;
    hatGapY: number;      // Y position where shots pass through
    hatGapHeight: number; // Height of gap
  };
  
  // Weapons
  currentWeapon: 'ION-SHIV' | 'regular';
  ionShivsRemaining: number;
  
  // State
  isMoving: boolean;
  speedBoostActive: boolean;  // After clearing room
}
```

## Binary Parser Types

```typescript
/**
 * Atari MAP file structure (640 bytes per maze)
 * From PDF pages 836-959
 */
interface AtariMapData {
  // Segment 1: $23F2-$2471 (128 bytes)
  // Bits 0-5: horizontal walls
  // Bit 7: corridor flag
  // Bits 4-6: corridor type (if bit 7 set)
  segment1: Uint8Array;  // 128 bytes
  
  // Segment 2: $2472-$24F1 (128 bytes)
  // Bits 0-5: vertical walls
  // For corridors: vertical exit room number
  segment2: Uint8Array;  // 128 bytes
  
  // Segment 3: $1D43-$1DC2 (128 bytes)
  // Objects: 0=none, 1=keyhole, 2=key, 3=?, 4=potion, 6=Shadow
  segment3: Uint8Array;  // 128 bytes
  
  // Segment 4: $1DC3-$1E42 (128 bytes)
  // Color: lower nibble = color, bits 5-7 = luma
  // Bit 4: door position
  segment4: Uint8Array;  // 128 bytes
  
  // Segment 5: Pod rooms + level boundaries
  // Byte 0: pod room count
  // Bytes 1-count: pod room numbers
  // Bytes $7D-$7F: level boundaries (last room of black/blue/green)
  segment5: Uint8Array;  // 128 bytes
}

/**
 * Parser configuration
 */
interface ParserConfig {
  // Grid dimensions
  gridWidth: 3;
  gridHeight: 3;
  
  // Wall bit mapping
  horizontalWallBits: [0, 1, 2, 3, 4, 5];
  verticalWallBits: [0, 1, 2, 3, 4, 5];
  
  // Corridor detection
  corridorFlag: 0x80;      // Bit 7
  corridorTypeMask: 0x70;  // Bits 4-6
}

/**
 * Parser result
 */
interface ParsedMaze {
  maze: Maze;
  rawData: AtariMapData;
  warnings: string[];      // Any conversion issues
  stats: {
    totalRooms: number;
    corridorCount: number;
    podRoomCount: number;
    objectCount: number;
  };
}
```

## Physics & Collision

```typescript
interface CollisionResult {
  collided: boolean;
  type?: 'wall' | 'enemy' | 'item' | 'electrocuting';
  target?: WallTile | Enemy | RoomObject;
  
  // Atari-specific quirks
  ionShivPenetration?: boolean;  // ION-SHIVs kill through walls
  hatGapPass?: boolean;          // Shot passed through hat gap
}

interface PhysicsConfig {
  // From slx $0206 patch
  baseSpeed: number;
  speedIncreasePerLevel: number;
  speedIncreasePerDifficulty: number;
  speedIncreaseAfterClear: number;
  
  // Collision
  playerHitboxWidth: number;
  playerHitboxHeight: number;
  hatGapY: number;        // Where shots pass through
  hatGapHeight: number;
  
  // Atari-specific
  ionShivWallPenetration: boolean;
}
```

## Audio Types

```typescript
interface AudioConfig {
  // Atari-specific
  atariPingEnabled: boolean;    // Enemy shots have "ping" sound
  backgroundHum: boolean;       // Atari background sound
  warningSound: boolean;        // Before Shadow appears
  
  // C64-specific (silent)
  c64SilentShots: boolean;      // C64 mazes: enemy shots silent
  
  // Current maze type affects audio
  currentMazeType: MazeType;
}

interface SoundEffect {
  name: 'atari-ping' | 'ion-shiv-fire' | 'enemy-death' | 'item-collect' | 'warning';
  frequency: number;
  duration: number;
  waveForm: 'square' | 'sawtooth' | 'triangle';
}
```

## UI Types

```typescript
interface UIState {
  // OPTION key maze selector
  mazeSelectorOpen: boolean;
  selectedMaze: MazeType;
  availableMazes: MazeType[];
  
  // Pause state
  paused: boolean;
  pauseText: string;
  
  // HUD
  showMapName: boolean;
  showScore: boolean;
  showLives: boolean;
  showLevel: boolean;
  
  // Tournament display
  tournamentProgress?: string;
}

interface RendererConfig {
  // Atari Glow effect
  atariGlowEnabled: boolean;
  glowIntensity: number;
  pulsateSpeed: number;
  
  // Color palettes
  wallColorBase: number;    // Base hue for walls
  levelColors: {
    BLACK: number;
    BLUE: number;
    GREEN: number;
    RED: number;
  };
  
  // CRT effect
  scanlines: boolean;
  curvature: boolean;
  phosphorTrail: boolean;
}
```

## Memory Map (for reference)

```typescript
/**
 * Original Atari memory addresses from assembly
 */
interface AtariMemoryMap {
  // Game variables
  $0206: 'shamusSpeed';        // Speed control (delay loop counter)
  $0202: 'lives';              // Lives counter
  $0208: 'currentRoomLow';     // Current room (low byte)
  $0235: 'currentRoomHigh';    // Current room (high byte)
  
  // Map data locations
  $23F2: 'segment1Horizontal'; // Segment 1: horizontal walls (128 bytes)
  $2472: 'segment2Vertical';   // Segment 2: vertical walls (128 bytes)
  $1D43: 'segment3Objects';    // Segment 3: objects (128 bytes)
  $1DC3: 'segment4Colors';     // Segment 4: colors (128 bytes)
  $1EE3: 'segment5PodRooms';   // Segment 5: pod rooms (8 bytes max)
  $24F8: 'segment5Boundaries'; // Level boundaries (3 bytes)
  
  // Code locations
  $2F98: 'delayLoop';          // Speed delay loop
  $2B6B: 'endOfMazeSpeed';     // Speed adjustment at maze end
  $18AF: 'objectShuffle';      // Object shuffle routine
  $1FEE: 'podRoomCheck';       // Pod room check routine
}
```
