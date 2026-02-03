/**
 * Shamus+ TypeScript Type Definitions
 * Based on technical analysis of New Mazes for Shamus.pdf and Shamuspl.asm
 */
// =============================================================================
// MAZE TYPES
// =============================================================================
export var MazeType;
(function (MazeType) {
    MazeType[MazeType["ORIGINAL_ATARI"] = 0] = "ORIGINAL_ATARI";
    MazeType[MazeType["ORIGINAL_C64"] = 1] = "ORIGINAL_C64";
    MazeType[MazeType["HOLMES"] = 2] = "HOLMES";
    MazeType[MazeType["CLUSEAU"] = 3] = "CLUSEAU";
    MazeType[MazeType["MARLOWE"] = 4] = "MARLOWE";
    MazeType[MazeType["BOND"] = 5] = "BOND";
    MazeType[MazeType["TOURNAMENT"] = 6] = "TOURNAMENT";
})(MazeType || (MazeType = {}));
export const MAZE_NAMES = {
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
export var CorridorType;
(function (CorridorType) {
    CorridorType[CorridorType["NONE"] = 0] = "NONE";
    CorridorType[CorridorType["DEAD_END_BOTTOM"] = 128] = "DEAD_END_BOTTOM";
    CorridorType[CorridorType["BOTTOM_TO_RIGHT"] = 144] = "BOTTOM_TO_RIGHT";
    CorridorType[CorridorType["BOTTOM_TO_LEFT"] = 160] = "BOTTOM_TO_LEFT";
    CorridorType[CorridorType["T_BOTTOM_EXIT"] = 176] = "T_BOTTOM_EXIT";
    CorridorType[CorridorType["DEAD_END_TOP"] = 192] = "DEAD_END_TOP";
    CorridorType[CorridorType["TOP_TO_RIGHT"] = 208] = "TOP_TO_RIGHT";
    CorridorType[CorridorType["TOP_TO_LEFT"] = 224] = "TOP_TO_LEFT";
    CorridorType[CorridorType["T_TOP_EXIT"] = 240] = "T_TOP_EXIT"; // $F0 - T with top exit
})(CorridorType || (CorridorType = {}));
export const CORRIDOR_DESCRIPTIONS = {
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
// OBJECT TYPES (Segment 3: $1D43-$1DC2)
// =============================================================================
export var ObjectType;
(function (ObjectType) {
    ObjectType[ObjectType["NONE"] = 0] = "NONE";
    ObjectType[ObjectType["KEYHOLE"] = 1] = "KEYHOLE";
    ObjectType[ObjectType["KEY"] = 2] = "KEY";
    ObjectType[ObjectType["MYSTERY"] = 3] = "MYSTERY";
    ObjectType[ObjectType["POTION"] = 4] = "POTION";
    ObjectType[ObjectType["SHADOW"] = 6] = "SHADOW";
})(ObjectType || (ObjectType = {}));
// =============================================================================
// ENEMY TYPES
// =============================================================================
export var EnemyType;
(function (EnemyType) {
    EnemyType["WHIRLING_DRONE"] = "whirling-drone";
    EnemyType["SNAP_JUMPER"] = "snap-jumper";
    EnemyType["ROBO_DROID"] = "robo-droid";
    EnemyType["SHADOW_ENFORCER"] = "shadow-enforcer";
})(EnemyType || (EnemyType = {}));
// =============================================================================
// C64 TO ATARI COLOR MAPPING (from PDF page 817-820)
// =============================================================================
export const C64_TO_ATARI_COLOR = {
    0x00: 0x00, // Black -> Black
    0x01: 0x0E, // White -> White
    0x02: 0x26, // Red -> Red
    0x03: 0x9C, // Cyan -> Cyan
    0x04: 0x58, // Purple -> Purple
    0x05: 0xBA, // Green -> Green
    0x06: 0x74, // Blue -> Blue
    0x07: 0xE8, // Yellow -> Yellow
    0x08: 0x18, // Orange -> Orange
    0x09: 0xE6, // Brown -> Brown
    0x0A: 0x2A, // Light Red -> Light Red
    0x0B: 0x06, // Dark Grey -> Dark Grey
    0x0C: 0x0A, // Grey -> Grey
    0x0D: 0xBE, // Light Green -> Light Green
    0x0E: 0x7A, // Light Blue -> Light Blue
    0x0F: 0x0C // Light Grey -> Light Grey
};
export const DEFAULT_PARSER_CONFIG = {
    gridWidth: 3,
    gridHeight: 3,
    horizontalWallBits: [0, 1, 2, 3, 4, 5],
    verticalWallBits: [0, 1, 2, 3, 4, 5],
    corridorFlag: 0x80,
    corridorTypeMask: 0x70
};
//# sourceMappingURL=index.js.map