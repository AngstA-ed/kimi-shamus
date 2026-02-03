/**
 * Binary Parser for Shamus+ MAP files
 * Converts 640-byte segments into playable JSON room layouts
 * Based on technical specification from New Mazes for Shamus.pdf
 */
import { MazeType, Maze, LevelBoundaries, LevelColor, ParsedMaze } from '../types';
/**
 * Parser for Atari MAP binary format
 * Each maze is 640 bytes: 5 segments × 128 bytes
 */
export declare class BinaryParser {
    private readonly SEGMENT_SIZE;
    private readonly MAZE_SIZE;
    private readonly TOTAL_ROOMS;
    /**
     * Parse a complete SHAM_A8.MAP file containing all mazes
     * @param buffer - Full map file (3200 bytes = 5 mazes × 640 bytes)
     * @returns Array of parsed mazes
     */
    parseFullMap(buffer: Uint8Array): ParsedMaze[];
    /**
     * Parse a single 640-byte maze segment
     * @param buffer - 640 bytes of maze data
     * @param mazeType - Type of maze being parsed
     * @returns Parsed maze with rooms, pod rooms, and boundaries
     */
    parseMapSegment(buffer: Uint8Array, mazeType: MazeType): ParsedMaze;
    /**
     * Decode Segment 1: Horizontal walls and corridor flags
     * Address: $23F2 + roomId
     *
     * Bit 7: Corridor flag (1 = corridor, 0 = chamber)
     * Bits 4-6: Corridor type (if bit 7 set)
     * Bits 0-5: Horizontal wall segments
     */
    private decodeSegment1;
    /**
     * Decode Segment 2: Vertical walls and vertical exits
     * Address: $2472 + roomId
     *
     * For corridors: full byte (or bits 0-6) = vertical exit room ID
     * For all rooms: bits 0-5 = vertical wall segments
     */
    private decodeSegment2;
    /**
     * Decode Segment 3: Objects
     * Address: $1D43 + roomId
     *
     * $00 = no object
     * $01 = keyhole (lock)
     * $02 = key
     * $03 = mystery bonus (?)
     * $04 = potion (extra life)
     * $06 = The Shadow
     */
    private decodeSegment3;
    /**
     * Decode Segment 4: Colors and door positions
     * Address: $1DC3 + roomId
     *
     * Lower nibble (bits 0-3): Color value (after nibble rotation)
     * Bits 5-7: Luma (brightness)
     * Bit 4: Door position (0=right exit closed, 1=left exit closed)
     */
    private decodeSegment4;
    /**
     * Decode Segment 5: Pod rooms and level boundaries
     * Bytes 0: Pod room count
     * Bytes 1-count: Pod room numbers
     * Bytes $7D-$7F: Level boundaries (last rooms of black/blue/green levels)
     */
    private decodeSegment5;
    /**
     * Construct a complete Room object from decoded segments
     */
    private constructRoom;
    /**
     * Classify corridor type from byte value
     * Maps bits 4-6 + bit 7 to corridor type
     */
    private classifyCorridor;
    /**
     * Get grid position for horizontal wall bit
     * Layout:
     *   bit 0,1,2 = top row (left, center, right)
     *   bit 3,4,5 = bottom row (left, center, right)
     */
    private getHorizontalWallPosition;
    /**
     * Get grid position for vertical wall bit
     * Layout:
     *   bit 0,1,2 = left column (top, middle, bottom)
     *   bit 3,4,5 = right column (top, middle, bottom)
     */
    private getVerticalWallPosition;
    /**
     * Determine level color based on room ID
     */
    getLevelColor(roomId: number, boundaries: LevelBoundaries): LevelColor;
    /**
     * Generate enemy spawns for a room (procedurally generated)
     * Based on PDF analysis - enemy count varies by room/level
     */
    private generateEnemies;
    /**
     * Get approximate enemy count for level (from PDF analysis)
     */
    private getEnemyCountForLevel;
    /**
     * Export maze data to JSON format
     */
    mazeToJSON(maze: Maze): string;
    /**
     * Create a sample/test maze with known values for testing
     */
    createTestMaze(): Uint8Array;
}
export default BinaryParser;
//# sourceMappingURL=BinaryParser.d.ts.map