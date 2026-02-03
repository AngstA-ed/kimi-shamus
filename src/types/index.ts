/**
 * Shamus+ TypeScript Type Definitions
 * Based on technical analysis of New Mazes for Shamus.pdf and Shamuspl.asm
 */

// =============================================================================
// MAZE TYPES
// =============================================================================

export enum MazeType {
  ORIGINAL_ATARI = 0,
  ORIGINAL_C64 = 1,
  HOLMES = 2,
  CLUSEAU = 3,
  MARLOWE = 4,
  BOND = 5,
  TOURNAMENT = 6
}

export const MAZE_NAMES: Record<MazeType, string> = {
  [MazeType.ORIGINAL_ATARI]: 'ORIGINAL ATARI MAP',
  [MazeType.ORIGINAL_C64]: 'original C64 map',
  [MazeType.HOLMES]: 'holmes',
  [MazeType.CLUSEAU]: 'cluseau',
  [MazeType.MARLOWE]: 'marlowe',
  [MazeType.BOND]: 'bond',
  [MazeType.TOURNAMENT]: 'TOURNAMENT'
};

export const TOURNAMENT_SEQUENCE = [
  MazeType.HOLMES,
  MazeType.CLUSEAU,
  MazeType.MARLOWE,
  MazeType.BOND
];

// =============================================================================
// CORRIDOR TYPES (7 Atari variants from PDF page 856-874)
// =============================================================================

export enum CorridorType {
  NONE = 0x00,
  DEAD_END_BOTTOM = 0x80,   // $80 - Dead end open at bottom
  BOTTOM_TO_RIGHT = 0x90,   // $90 - Bottom to right angled
  BOTTOM_TO_LEFT = 0xA0,    // $A0 - Bottom to left angled
  T_BOTTOM_EXIT = 0xB0,     // $B0 - T with bottom exit
  DEAD_END_TOP = 0xC0,      // $C0 - Dead end open at top
  TOP_TO_RIGHT = 0xD0,      // $D0 - Top to right angled
  TOP_TO_LEFT = 0xE0,       // $E0 - Top to left angled
  T_TOP_EXIT = 0xF0         // $F0 - T with top exit
}

export interface Corridor {
  type: CorridorType;
  verticalExitRoomId: number;
  description: string;
}

export const CORRIDOR_DESCRIPTIONS: Record<CorridorType, string> = {
  [CorridorType.NONE]: 'Standard chamber',
  [CorridorType.DEAD_END_BOTTOM]: 'Dead end open at bottom',
  [CorridorType.BOTTOM_TO_RIGHT]: 'Angled: bottom to right',
  [CorridorType.BOTTOM_TO_LEFT]: 'Angled: bottom to left',
  [CorridorType.T_BOTTOM_EXIT]: 'T-junction with bottom exit',
  [CorridorType.DEAD_END_TOP]: 'Dead end open at top',
  [CorridorType.TOP_TO_RIGHT]: 'Angled: top to right',
  [CorridorType.TOP_TO_LEFT]: 'Angled: top to left',
  [CorridorType.T_TOP_EXIT]: 'T-junction with top exit'
};

// =============================================================================
// WALL TYPES
// =============================================================================

export type WallType = 'solid' | 'electrocuting' | 'breakable' | 'gap';

export interface WallTile {
  x: number;
  y: number;
  type: WallType;
  exists: boolean;
  bitIndex: number;
}

// =============================================================================
// OBJECT TYPES (Segment 3: $1D43-$1DC2)
// =============================================================================

export enum ObjectType {
  NONE = 0x00,
  KEYHOLE = 0x01,
  KEY = 0x02,
  MYSTERY = 0x03,
  POTION = 0x04,
  SHADOW = 0x06
}

export interface RoomObject {
  type: ObjectType;
  color: number;
  luma: number;
  doorClosesLeft: boolean;
  x?: number;
  y?: number;
}

// =============================================================================
// ROOM STRUCTURE
// =============================================================================

export interface RoomExits {
  north?: number;
  south?: number;
  east: number;
  west: number;
}

export interface Room {
  id: number;
  horizontalWalls: WallTile[];
  verticalWalls: WallTile[];
  isCorridor: boolean;
  isPodRoom: boolean;
  corridor?: Corridor;
  object?: RoomObject;
  exits: RoomExits;
  cleared: boolean;
  visited: boolean;
  enemies: EnemySpawn[];
}

// =============================================================================
// ENEMY TYPES
// =============================================================================

export enum EnemyType {
  WHIRLING_DRONE = 'whirling-drone',
  SNAP_JUMPER = 'snap-jumper',
  ROBO_DROID = 'robo-droid',
  SHADOW_ENFORCER = 'shadow-enforcer'
}

export interface Point {
  x: number;
  y: number;
}

export interface EnemySpawn {
  type: EnemyType;
  x: number;
  y: number;
  count?: number;
  patrolPath?: Point[];
}

// =============================================================================
// LEVEL TYPES
// =============================================================================

export type LevelColor = 'BLACK' | 'BLUE' | 'GREEN' | 'RED';

export interface LevelBoundaries {
  blackLevelEnd: number;
  blueLevelEnd: number;
  greenLevelEnd: number;
}

// =============================================================================
// MAZE STRUCTURE
// =============================================================================

export interface PodRoomEntry {
  roomId: number;
  barriersActive: boolean;
}

export interface Maze {
  type: MazeType;
  name: string;
  rooms: Room[];
  podRooms: PodRoomEntry[];
  levelBoundaries: LevelBoundaries;
  totalRooms: 128;
}

// =============================================================================
// TOURNAMENT STATE
// =============================================================================

export interface TournamentState {
  active: boolean;
  currentMazeIndex: number;
  mazesCompleted: number;
  mazeSequence: MazeType[];
  baseSpeed: number;
}

// =============================================================================
// GAME STATE
// =============================================================================

export type Difficulty = 'NOVICE' | 'ADVANCED' | 'EXPERT';

export interface PlayerInventory {
  keys: number;
  hasIonShiv: boolean;
}

export interface GameState {
  currentMaze: MazeType;
  currentRoom: number;
  lives: number;
  score: number;
  inventory: PlayerInventory;
  shamusSpeed: number;  // $0206 equivalent
  difficulty: Difficulty;
  tournament: TournamentState;
  currentLevel: LevelColor;
  roomCleared: boolean;
  enemiesDefeated: number;
  paused: boolean;
}

// =============================================================================
// BINARY MAP DATA
// =============================================================================

export interface AtariMapData {
  segment1: Uint8Array;  // 128 bytes: horizontal walls + corridor flags
  segment2: Uint8Array;  // 128 bytes: vertical walls + vertical exits
  segment3: Uint8Array;  // 128 bytes: objects
  segment4: Uint8Array;  // 128 bytes: colors + door positions
  segment5: Uint8Array;  // 128 bytes: pod rooms + level boundaries
}

export interface ParsedMaze {
  maze: Maze;
  rawData: AtariMapData;
  warnings: string[];
  stats: {
    totalRooms: number;
    corridorCount: number;
    podRoomCount: number;
    objectCount: number;
  };
}

// =============================================================================
// PHYSICS & COLLISION
// =============================================================================

export interface CollisionResult {
  collided: boolean;
  type?: 'wall' | 'enemy' | 'item' | 'electrocuting';
  target?: WallTile | EnemySpawn | RoomObject;
  ionShivPenetration?: boolean;
  hatGapPass?: boolean;
}

export interface PhysicsConfig {
  baseSpeed: number;
  speedIncreasePerLevel: number;
  speedIncreasePerDifficulty: number;
  speedIncreaseAfterClear: number;
  playerHitboxWidth: number;
  playerHitboxHeight: number;
  hatGapY: number;
  hatGapHeight: number;
  ionShivWallPenetration: boolean;
}

// =============================================================================
// RENDERER
// =============================================================================

export interface RendererConfig {
  atariGlowEnabled: boolean;
  glowIntensity: number;
  pulsateSpeed: number;
  wallColorBase: number;
  levelColors: Record<LevelColor, number>;
  scanlines: boolean;
  curvature: boolean;
  phosphorTrail: boolean;
}

// =============================================================================
// AUDIO
// =============================================================================

export interface AudioConfig {
  atariPingEnabled: boolean;
  backgroundHum: boolean;
  warningSound: boolean;
  c64SilentShots: boolean;
  currentMazeType: MazeType;
}

export type SoundEffectName = 
  | 'atari-ping' 
  | 'ion-shiv-fire' 
  | 'enemy-death' 
  | 'item-collect' 
  | 'warning';

export interface SoundEffect {
  name: SoundEffectName;
  frequency: number;
  duration: number;
  waveForm: 'square' | 'sawtooth' | 'triangle';
}

// =============================================================================
// UI
// =============================================================================

export interface UIState {
  mazeSelectorOpen: boolean;
  selectedMaze: MazeType;
  availableMazes: MazeType[];
  paused: boolean;
  pauseText: string;
  showMapName: boolean;
  showScore: boolean;
  showLives: boolean;
  showLevel: boolean;
  tournamentProgress?: string;
}

// =============================================================================
// C64 TO ATARI COLOR MAPPING (from PDF page 817-820)
// =============================================================================

export const C64_TO_ATARI_COLOR: Record<number, number> = {
  0x00: 0x00,  // Black -> Black
  0x01: 0x0E,  // White -> White
  0x02: 0x26,  // Red -> Red
  0x03: 0x9C,  // Cyan -> Cyan
  0x04: 0x58,  // Purple -> Purple
  0x05: 0xBA,  // Green -> Green
  0x06: 0x74,  // Blue -> Blue
  0x07: 0xE8,  // Yellow -> Yellow
  0x08: 0x18,  // Orange -> Orange
  0x09: 0xE6,  // Brown -> Brown
  0x0A: 0x2A,  // Light Red -> Light Red
  0x0B: 0x06,  // Dark Grey -> Dark Grey
  0x0C: 0x0A,  // Grey -> Grey
  0x0D: 0xBE,  // Light Green -> Light Green
  0x0E: 0x7A,  // Light Blue -> Light Blue
  0x0F: 0x0C   // Light Grey -> Light Grey
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ParserConfig {
  gridWidth: 3;
  gridHeight: 3;
  horizontalWallBits: readonly [0, 1, 2, 3, 4, 5];
  verticalWallBits: readonly [0, 1, 2, 3, 4, 5];
  corridorFlag: 0x80;
  corridorTypeMask: 0x70;
}

export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  gridWidth: 3,
  gridHeight: 3,
  horizontalWallBits: [0, 1, 2, 3, 4, 5],
  verticalWallBits: [0, 1, 2, 3, 4, 5],
  corridorFlag: 0x80,
  corridorTypeMask: 0x70
};

// =============================================================================
// PLAYER DIRECTION & MOVEMENT
// =============================================================================

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

export enum RoomExit {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west'
}
