/**
 * Binary Parser for Shamus+ MAP files
 * Converts 640-byte segments into playable JSON room layouts
 * Based on technical specification from New Mazes for Shamus.pdf
 */
import { MAZE_NAMES, CorridorType, CORRIDOR_DESCRIPTIONS, ObjectType, EnemyType } from '../types';
/**
 * Parser for Atari MAP binary format
 * Each maze is 640 bytes: 5 segments × 128 bytes
 */
export class BinaryParser {
    constructor() {
        this.SEGMENT_SIZE = 128;
        this.MAZE_SIZE = 640; // 5 × 128
        this.TOTAL_ROOMS = 128;
    }
    /**
     * Parse a complete SHAM_A8.MAP file containing all mazes
     * @param buffer - Full map file (3200 bytes = 5 mazes × 640 bytes)
     * @returns Array of parsed mazes
     */
    parseFullMap(buffer) {
        const mazeCount = Math.floor(buffer.length / this.MAZE_SIZE);
        const mazes = [];
        for (let i = 0; i < mazeCount; i++) {
            const offset = i * this.MAZE_SIZE;
            const mazeBuffer = buffer.slice(offset, offset + this.MAZE_SIZE);
            const mazeType = i;
            mazes.push(this.parseMapSegment(mazeBuffer, mazeType));
        }
        return mazes;
    }
    /**
     * Parse a single 640-byte maze segment
     * @param buffer - 640 bytes of maze data
     * @param mazeType - Type of maze being parsed
     * @returns Parsed maze with rooms, pod rooms, and boundaries
     */
    parseMapSegment(buffer, mazeType) {
        if (buffer.length !== this.MAZE_SIZE) {
            throw new Error(`Invalid maze size: ${buffer.length} bytes (expected ${this.MAZE_SIZE})`);
        }
        const rawData = {
            segment1: buffer.slice(0, 128), // $23F2 - horizontal walls
            segment2: buffer.slice(128, 256), // $2472 - vertical walls
            segment3: buffer.slice(256, 384), // $1D43 - objects
            segment4: buffer.slice(384, 512), // $1DC3 - colors
            segment5: buffer.slice(512, 640) // pod rooms + boundaries
        };
        const warnings = [];
        const stats = {
            totalRooms: 0,
            corridorCount: 0,
            podRoomCount: 0,
            objectCount: 0
        };
        // Parse segment 5 for pod rooms and level boundaries
        const { podRooms, levelBoundaries } = this.decodeSegment5(rawData.segment5);
        stats.podRoomCount = podRooms.length;
        // Parse all 128 rooms
        const rooms = [];
        for (let roomId = 0; roomId < this.TOTAL_ROOMS; roomId++) {
            const room = this.constructRoom(roomId, rawData.segment1[roomId], rawData.segment2[roomId], rawData.segment3[roomId], rawData.segment4[roomId], podRooms, levelBoundaries, warnings);
            rooms.push(room);
            stats.totalRooms++;
            if (room.isCorridor)
                stats.corridorCount++;
            if (room.object)
                stats.objectCount++;
        }
        const maze = {
            type: mazeType,
            name: MAZE_NAMES[mazeType],
            rooms,
            podRooms: podRooms.map(id => ({ roomId: id, barriersActive: true })),
            levelBoundaries,
            totalRooms: this.TOTAL_ROOMS
        };
        return {
            maze,
            rawData,
            warnings,
            stats
        };
    }
    /**
     * Decode Segment 1: Horizontal walls and corridor flags
     * Address: $23F2 + roomId
     *
     * Bit 7: Corridor flag (1 = corridor, 0 = chamber)
     * Bits 4-6: Corridor type (if bit 7 set)
     * Bits 0-5: Horizontal wall segments
     */
    decodeSegment1(byte) {
        // Bit 7: Corridor flag
        const isCorridor = (byte & 0x80) !== 0;
        // Extract corridor type if this is a corridor
        let corridorType;
        if (isCorridor) {
            corridorType = this.classifyCorridor(byte & 0xF0);
        }
        // Decode horizontal walls from bits 0-5
        const horizontalWalls = [];
        for (let bit = 0; bit < 6; bit++) {
            const exists = (byte & (1 << bit)) !== 0;
            const { x, y } = this.getHorizontalWallPosition(bit);
            horizontalWalls.push({
                x,
                y,
                type: 'electrocuting',
                exists,
                bitIndex: bit
            });
        }
        return { horizontalWalls, isCorridor, corridorType };
    }
    /**
     * Decode Segment 2: Vertical walls and vertical exits
     * Address: $2472 + roomId
     *
     * For corridors: full byte (or bits 0-6) = vertical exit room ID
     * For all rooms: bits 0-5 = vertical wall segments
     */
    decodeSegment2(byte, isCorridor) {
        // Decode vertical walls from bits 0-5
        const verticalWalls = [];
        for (let bit = 0; bit < 6; bit++) {
            const exists = (byte & (1 << bit)) !== 0;
            const { x, y } = this.getVerticalWallPosition(bit);
            verticalWalls.push({
                x,
                y,
                type: 'electrocuting',
                exists,
                bitIndex: bit
            });
        }
        // For corridors: byte value is vertical exit room ID
        let verticalExit;
        if (isCorridor) {
            verticalExit = byte & 0x7F; // Lower 7 bits (room 0-127)
        }
        return { verticalWalls, verticalExit };
    }
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
    decodeSegment3(byte) {
        switch (byte) {
            case 0x00: return undefined;
            case 0x01: return ObjectType.KEYHOLE;
            case 0x02: return ObjectType.KEY;
            case 0x03: return ObjectType.MYSTERY;
            case 0x04: return ObjectType.POTION;
            case 0x06: return ObjectType.SHADOW;
            default:
                // Unknown object type
                return undefined;
        }
    }
    /**
     * Decode Segment 4: Colors and door positions
     * Address: $1DC3 + roomId
     *
     * Lower nibble (bits 0-3): Color value (after nibble rotation)
     * Bits 5-7: Luma (brightness)
     * Bit 4: Door position (0=right exit closed, 1=left exit closed)
     */
    decodeSegment4(byte) {
        // Lower nibble: color
        const colorNibble = byte & 0x0F;
        // Bits 5-7: Luma (0-7)
        const luma = (byte >> 5) & 0x07;
        // Bit 4: Door position
        const doorClosesLeft = (byte & 0x10) !== 0;
        // Combine for final Atari color (high nibble = luma, low nibble = color)
        const finalColor = (luma << 4) | colorNibble;
        return {
            color: finalColor,
            luma,
            doorClosesLeft
        };
    }
    /**
     * Decode Segment 5: Pod rooms and level boundaries
     * Bytes 0: Pod room count
     * Bytes 1-count: Pod room numbers
     * Bytes $7D-$7F: Level boundaries (last rooms of black/blue/green levels)
     */
    decodeSegment5(buffer) {
        // Byte 0: Count of pod rooms
        const podRoomCount = Math.min(buffer[0], 124); // Max 124 to leave room for boundaries
        // Extract pod room numbers
        const podRooms = [];
        for (let i = 1; i <= podRoomCount && i < 0x7D; i++) {
            podRooms.push(buffer[i]);
        }
        // Last 3 bytes: Level boundaries
        const levelBoundaries = {
            blackLevelEnd: buffer[0x7D],
            blueLevelEnd: buffer[0x7E],
            greenLevelEnd: buffer[0x7F]
        };
        return { podRooms, levelBoundaries };
    }
    /**
     * Construct a complete Room object from decoded segments
     */
    constructRoom(roomId, seg1, seg2, seg3, seg4, podRooms, boundaries, warnings) {
        // Decode each segment
        const s1 = this.decodeSegment1(seg1);
        const s2 = this.decodeSegment2(seg2, s1.isCorridor);
        const s3 = this.decodeSegment3(seg3);
        const s4 = this.decodeSegment4(seg4);
        // Check if this is a pod room
        const isPodRoom = podRooms.includes(roomId);
        // Build corridor info if applicable
        const corridor = s1.corridorType ? {
            type: s1.corridorType,
            verticalExitRoomId: s2.verticalExit || 0,
            description: CORRIDOR_DESCRIPTIONS[s1.corridorType]
        } : undefined;
        // Build object info if present
        const roomObject = s3 ? {
            type: s3,
            color: s4.color,
            luma: s4.luma,
            doorClosesLeft: s4.doorClosesLeft
            // x, y will be assigned randomly when room is entered
        } : undefined;
        // Calculate exits
        const exits = {
            north: s2.verticalExit,
            south: s2.verticalExit, // Same room for both directions
            east: roomId < 127 ? roomId + 1 : 127,
            west: roomId > 0 ? roomId - 1 : 0
        };
        // Generate enemy spawns (procedurally based on room/level)
        const enemies = this.generateEnemies(roomId, boundaries);
        return {
            id: roomId,
            horizontalWalls: s1.horizontalWalls,
            verticalWalls: s2.verticalWalls,
            isCorridor: s1.isCorridor,
            isPodRoom,
            corridor,
            object: roomObject,
            exits,
            cleared: false,
            visited: false,
            enemies
        };
    }
    /**
     * Classify corridor type from byte value
     * Maps bits 4-6 + bit 7 to corridor type
     */
    classifyCorridor(value) {
        // Mask to get corridor type bits (excluding lower nibble)
        const masked = value & 0xF0;
        switch (masked) {
            case 0x80: return CorridorType.DEAD_END_BOTTOM;
            case 0x90: return CorridorType.BOTTOM_TO_RIGHT;
            case 0xA0: return CorridorType.BOTTOM_TO_LEFT;
            case 0xB0: return CorridorType.T_BOTTOM_EXIT;
            case 0xC0: return CorridorType.DEAD_END_TOP;
            case 0xD0: return CorridorType.TOP_TO_RIGHT;
            case 0xE0: return CorridorType.TOP_TO_LEFT;
            case 0xF0: return CorridorType.T_TOP_EXIT;
            default: return CorridorType.NONE;
        }
    }
    /**
     * Get grid position for horizontal wall bit
     * Layout:
     *   bit 0,1,2 = top row (left, center, right)
     *   bit 3,4,5 = bottom row (left, center, right)
     */
    getHorizontalWallPosition(bit) {
        const x = bit % 3; // 0, 1, 2 for left, center, right
        const y = bit < 3 ? 0 : 2; // 0 for top row, 2 for bottom row
        return { x, y };
    }
    /**
     * Get grid position for vertical wall bit
     * Layout:
     *   bit 0,1,2 = left column (top, middle, bottom)
     *   bit 3,4,5 = right column (top, middle, bottom)
     */
    getVerticalWallPosition(bit) {
        const x = bit < 3 ? 0 : 2; // 0 for left, 2 for right
        const y = bit % 3; // 0, 1, 2 for top, middle, bottom
        return { x, y };
    }
    /**
     * Determine level color based on room ID
     */
    getLevelColor(roomId, boundaries) {
        if (roomId <= boundaries.blackLevelEnd)
            return 'BLACK';
        if (roomId <= boundaries.blueLevelEnd)
            return 'BLUE';
        if (roomId <= boundaries.greenLevelEnd)
            return 'GREEN';
        return 'RED';
    }
    /**
     * Generate enemy spawns for a room (procedurally generated)
     * Based on PDF analysis - enemy count varies by room/level
     */
    generateEnemies(roomId, boundaries) {
        const level = this.getLevelColor(roomId, boundaries);
        const enemies = [];
        // Enemy generation is procedurally determined in original game
        // This is a simplified version for the parser
        // Actual counts would be determined by game logic
        // Pod rooms have fewer/no regular enemies
        if (roomId === 127) {
            // Shadow appears in room 127
            enemies.push({
                type: EnemyType.SHADOW_ENFORCER,
                x: 0, // Will be placed in center
                y: 0
            });
            return enemies;
        }
        // Generate appropriate enemies based on level
        const enemyTypes = [EnemyType.WHIRLING_DRONE, EnemyType.SNAP_JUMPER, EnemyType.ROBO_DROID];
        const count = this.getEnemyCountForLevel(level);
        for (let i = 0; i < count; i++) {
            enemies.push({
                type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
                x: 0, // Positioned randomly when room loads
                y: 0
            });
        }
        return enemies;
    }
    /**
     * Get approximate enemy count for level (from PDF analysis)
     */
    getEnemyCountForLevel(level) {
        switch (level) {
            case 'BLACK': return 2;
            case 'BLUE': return 3;
            case 'GREEN': return 4;
            case 'RED': return 5;
            default: return 2;
        }
    }
    /**
     * Export maze data to JSON format
     */
    mazeToJSON(maze) {
        return JSON.stringify(maze, null, 2);
    }
    /**
     * Create a sample/test maze with known values for testing
     */
    createTestMaze() {
        const buffer = new Uint8Array(this.MAZE_SIZE);
        // Create a simple test pattern
        // Room 0: Chamber with some walls
        buffer[0] = 0x0A; // Segment 1: horizontal walls pattern
        buffer[128] = 0x12; // Segment 2: vertical walls pattern
        buffer[256] = 0x04; // Segment 3: potion
        buffer[384] = 0x64; // Segment 4: color + luma
        // Room 1: Corridor
        buffer[1] = 0x90; // Segment 1: corridor type bottom-to-right
        buffer[129] = 0x10; // Segment 2: vertical exit to room 16
        // Segment 5: Pod rooms
        buffer[512] = 3; // 3 pod rooms
        buffer[513] = 18; // Pod room 18
        buffer[514] = 36; // Pod room 36
        buffer[515] = 127; // Pod room 127 (Shadow)
        // Level boundaries
        buffer[637] = 31; // Black level ends at room 31
        buffer[638] = 63; // Blue level ends at room 63
        buffer[639] = 95; // Green level ends at room 95
        return buffer;
    }
}
export default BinaryParser;
//# sourceMappingURL=BinaryParser.js.map