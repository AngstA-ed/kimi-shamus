/**
 * Shamus+ TypeScript Type Definitions
 * Based on technical analysis of New Mazes for Shamus.pdf and Shamuspl.asm
 */
export declare enum MazeType {
    ORIGINAL_ATARI = 0,
    ORIGINAL_C64 = 1,
    HOLMES = 2,
    CLUSEAU = 3,
    MARLOWE = 4,
    BOND = 5,
    TOURNAMENT = 6
}
export declare const MAZE_NAMES: Record<MazeType, string>;
export declare const TOURNAMENT_SEQUENCE: MazeType[];
export declare enum CorridorType {
    NONE = 0,
    DEAD_END_BOTTOM = 128,// $80 - Dead end open at bottom
    BOTTOM_TO_RIGHT = 144,// $90 - Bottom to right angled
    BOTTOM_TO_LEFT = 160,// $A0 - Bottom to left angled
    T_BOTTOM_EXIT = 176,// $B0 - T with bottom exit
    DEAD_END_TOP = 192,// $C0 - Dead end open at top
    TOP_TO_RIGHT = 208,// $D0 - Top to right angled
    TOP_TO_LEFT = 224,// $E0 - Top to left angled
    T_TOP_EXIT = 240
}
export interface Corridor {
    type: CorridorType;
    verticalExitRoomId: number;
    description: string;
}
export declare const CORRIDOR_DESCRIPTIONS: Record<CorridorType, string>;
export type WallType = 'solid' | 'electrocuting' | 'breakable' | 'gap';
export interface WallTile {
    x: number;
    y: number;
    type: WallType;
    exists: boolean;
    bitIndex: number;
}
export declare enum ObjectType {
    NONE = 0,
    KEYHOLE = 1,
    KEY = 2,
    MYSTERY = 3,
    POTION = 4,
    SHADOW = 6
}
export interface RoomObject {
    type: ObjectType;
    color: number;
    luma: number;
    doorClosesLeft: boolean;
    x?: number;
    y?: number;
}
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
export declare enum EnemyType {
    WHIRLING_DRONE = "whirling-drone",
    SNAP_JUMPER = "snap-jumper",
    ROBO_DROID = "robo-droid",
    SHADOW_ENFORCER = "shadow-enforcer"
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
export type LevelColor = 'BLACK' | 'BLUE' | 'GREEN' | 'RED';
export interface LevelBoundaries {
    blackLevelEnd: number;
    blueLevelEnd: number;
    greenLevelEnd: number;
}
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
export interface TournamentState {
    active: boolean;
    currentMazeIndex: number;
    mazesCompleted: number;
    mazeSequence: MazeType[];
    baseSpeed: number;
}
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
    shamusSpeed: number;
    difficulty: Difficulty;
    tournament: TournamentState;
    currentLevel: LevelColor;
    roomCleared: boolean;
    enemiesDefeated: number;
    paused: boolean;
}
export interface AtariMapData {
    segment1: Uint8Array;
    segment2: Uint8Array;
    segment3: Uint8Array;
    segment4: Uint8Array;
    segment5: Uint8Array;
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
export interface AudioConfig {
    atariPingEnabled: boolean;
    backgroundHum: boolean;
    warningSound: boolean;
    c64SilentShots: boolean;
    currentMazeType: MazeType;
}
export type SoundEffectName = 'atari-ping' | 'ion-shiv-fire' | 'enemy-death' | 'item-collect' | 'warning';
export interface SoundEffect {
    name: SoundEffectName;
    frequency: number;
    duration: number;
    waveForm: 'square' | 'sawtooth' | 'triangle';
}
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
export declare const C64_TO_ATARI_COLOR: Record<number, number>;
export interface ParserConfig {
    gridWidth: 3;
    gridHeight: 3;
    horizontalWallBits: readonly [0, 1, 2, 3, 4, 5];
    verticalWallBits: readonly [0, 1, 2, 3, 4, 5];
    corridorFlag: 0x80;
    corridorTypeMask: 0x70;
}
export declare const DEFAULT_PARSER_CONFIG: ParserConfig;
//# sourceMappingURL=index.d.ts.map