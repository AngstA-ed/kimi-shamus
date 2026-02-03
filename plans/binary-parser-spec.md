# Binary Parser Specification

## Overview

The Binary Parser converts 640-byte segments from [`SHAM_A8.MAP`](Shamus+/Shamuspl.asm:643) into playable JSON room layouts. This document specifies the exact bit-level decoding logic based on the technical reference from the PDF.

## MAP File Structure

Each maze is exactly **640 bytes** (5 segments × 128 bytes), stored contiguously:

```
MAZE DATA LAYOUT (640 bytes total)
===================================
Segment 1: bytes 0-127   ($23F2)  Horizontal walls + corridor flags
Segment 2: bytes 128-255 ($2472)  Vertical walls + vertical exits
Segment 3: bytes 256-383 ($1D43)  Objects (keys, potions, etc.)
Segment 4: bytes 384-511 ($1DC3)  Colors + door positions
Segment 5: bytes 512-639          Pod room list + level boundaries
```

## Parser Class Interface

```typescript
class BinaryParser {
  /**
   * Parse a single 640-byte maze segment into a Maze object
   * @param buffer - 640-byte Uint8Array from SHAM_A8.MAP
   * @param mazeType - Which maze this is (0-6)
   * @returns ParsedMaze with rooms, pod rooms, and level boundaries
   */
  parseMapSegment(buffer: Uint8Array, mazeType: MazeType): ParsedMaze;

  /**
   * Parse all 5 mazes from the complete map file
   * @param buffer - Full 3200-byte SHAM_A8.MAP file (5 mazes × 640 bytes)
   * @returns Array of 5 ParsedMaze objects
   */
  parseFullMap(buffer: Uint8Array): ParsedMaze[];

  private decodeSegment1(byte: number, roomId: number): {
    horizontalWalls: WallTile[];
    isCorridor: boolean;
    corridorType?: CorridorType;
  };

  private decodeSegment2(byte: number, isCorridor: boolean): {
    verticalWalls: WallTile[];
    verticalExit?: number;
  };

  private decodeSegment3(byte: number): ObjectType;

  private decodeSegment4(byte: number): {
    color: number;
    luma: number;
    doorClosesLeft: boolean;
  };

  private decodeSegment5(buffer: Uint8Array): {
    podRooms: number[];
    levelBoundaries: LevelBoundaries;
  };
}
```

## Segment 1: Horizontal Walls ($23F2-$2471)

**Address**: $23F2 + roomId (128 bytes)

### Wall Grid Layout

The room interior follows a 3×3 grid pattern:

```
    ||
  --+--+--
    ||
  --+--+--
    ||
```

**Horizontal wall positions (bits 0-5):**

```
Bit positions for horizontal walls:

Top row:    bits 0, 1, 2    (left, center, right)
Bottom row: bits 3, 4, 5    (left, center, right)

Bit map:
    ||      <- Top vertical connectors
  -0-1-2-   <- Top horizontal walls
    ||
  -3-4-5-   <- Bottom horizontal walls
    ||      <- Bottom vertical connectors
```

### Corridor Detection

```typescript
function decodeSegment1(byte: number, roomId: number): Segment1Data {
  // Bit 7: Corridor flag
  const isCorridor = (byte & 0x80) !== 0;
  
  // Bits 4-6: Corridor type (only valid if bit 7 set)
  const corridorTypeValue = byte & 0x70;
  let corridorType: CorridorType | undefined;
  
  if (isCorridor) {
    corridorType = classifyCorridor(corridorTypeValue);
  }
  
  // Bits 0-5: Horizontal walls (always valid)
  const horizontalWalls: WallTile[] = [];
  for (let bit = 0; bit < 6; bit++) {
    const exists = (byte & (1 << bit)) !== 0;
    const { x, y } = getWallPosition(bit, 'horizontal');
    
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
 * Map bit position to grid coordinates for horizontal walls
 */
function getWallPosition(bit: number, orientation: 'horizontal'): { x: number; y: number } {
  // Horizontal walls:
  // bit 0: top-left,    bit 1: top-center,    bit 2: top-right
  // bit 3: bottom-left, bit 4: bottom-center, bit 5: bottom-right
  
  const x = bit % 3;  // 0, 1, 2 for left, center, right
  const y = bit < 3 ? 0 : 2;  // 0 for top, 2 for bottom
  
  return { x, y };
}
```

### Corridor Types (Bits 4-6 + Bit 7)

| Value | Hex | Type | Description | C64 Equivalent |
|-------|-----|------|-------------|----------------|
| 1000 0000 | $80 | DEAD_END_BOTTOM | Dead end, exit at bottom | $40/$6C |
| 1001 0000 | $90 | BOTTOM_TO_RIGHT | Angled: bottom to right | $64/$64 |
| 1010 0000 | $A0 | BOTTOM_TO_LEFT | Angled: bottom to left | $D0/$2C |
| 1011 0000 | $B0 | T_BOTTOM_EXIT | T-junction with bottom exit | $F4/$24 |
| 1100 0000 | $C0 | DEAD_END_TOP | Dead end, exit at top | $08/$D8 |
| 1101 0000 | $D0 | TOP_TO_RIGHT | Angled: top to right | $2C/$D0 |
| 1110 0000 | $E0 | TOP_TO_LEFT | Angled: top to left | $98/$98 |
| 1111 0000 | $F0 | T_TOP_EXIT | T-junction with top exit | $BC/$90 |

```typescript
function classifyCorridor(value: number): CorridorType {
  switch (value) {
    case 0x00: return CorridorType.DEAD_END_BOTTOM;  // $80 & $70 = $00
    case 0x10: return CorridorType.BOTTOM_TO_RIGHT;  // $90 & $70 = $10
    case 0x20: return CorridorType.BOTTOM_TO_LEFT;   // $A0 & $70 = $20
    case 0x30: return CorridorType.T_BOTTOM_EXIT;    // $B0 & $70 = $30
    case 0x40: return CorridorType.DEAD_END_TOP;     // $C0 & $70 = $40
    case 0x50: return CorridorType.TOP_TO_RIGHT;     // $D0 & $70 = $50
    case 0x60: return CorridorType.TOP_TO_LEFT;      // $E0 & $70 = $60
    case 0x70: return CorridorType.T_TOP_EXIT;       // $F0 & $70 = $70
    default: return CorridorType.NONE;
  }
}
```

## Segment 2: Vertical Walls ($2472-$24F1)

**Address**: $2472 + roomId (128 bytes)

### Wall Grid Layout

**Vertical wall positions (bits 0-5):**

```
Bit positions for vertical walls:

Left column:   bits 0, 1, 2  (top, middle, bottom)
Right column:  bits 3, 4, 5  (top, middle, bottom)

Bit map:
  0 || 3
  ---+---
  1 || 4
  ---+---
  2 || 5
```

### Vertical Exit Room ID

For corridor rooms (where Segment 1 bit 7 is set), Segment 2 contains the room ID for vertical movement:

```typescript
function decodeSegment2(byte: number, isCorridor: boolean): Segment2Data {
  // Bits 0-5: Vertical walls (always valid)
  const verticalWalls: WallTile[] = [];
  for (let bit = 0; bit < 6; bit++) {
    const exists = (byte & (1 << bit)) !== 0;
    const { x, y } = getVerticalWallPosition(bit);
    
    verticalWalls.push({
      x,
      y,
      type: 'electrocuting',
      exists,
      bitIndex: bit
    });
  }
  
  // For corridors: entire byte (or bits 0-6) is vertical exit room ID
  // Both north and south exits lead to the same room
  let verticalExit: number | undefined;
  if (isCorridor) {
    verticalExit = byte & 0x7F;  // Lower 7 bits (room 0-127)
  }
  
  return { verticalWalls, verticalExit };
}

function getVerticalWallPosition(bit: number): { x: number; y: number } {
  // Vertical walls:
  // bit 0: left-top,    bit 1: left-middle,    bit 2: left-bottom
  // bit 3: right-top,   bit 4: right-middle,   bit 5: right-bottom
  
  const x = bit < 3 ? 0 : 2;  // 0 for left, 2 for right
  const y = bit % 3;  // 0, 1, 2 for top, middle, bottom
  
  return { x, y };
}
```

## Segment 3: Objects ($1D43-$1DC2)

**Address**: $1D43 + roomId (128 bytes)

Object types are encoded directly in the byte value:

```typescript
enum ObjectType {
  NONE = 0x00,      // $00 - Empty
  KEYHOLE = 0x01,   // $01 - Keyhole (lock that requires matching key)
  KEY = 0x02,       // $02 - Key (colored, matches keyhole)
  MYSTERY = 0x03,   // $03 - Mystery bonus (? points)
  POTION = 0x04,    // $04 - Potion (extra life)
  // 0x05 - Unused
  SHADOW = 0x06     // $06 - The Shadow (appears in room 127)
}

function decodeSegment3(byte: number): ObjectType | undefined {
  switch (byte) {
    case 0x00: return undefined;  // No object
    case 0x01: return ObjectType.KEYHOLE;
    case 0x02: return ObjectType.KEY;
    case 0x03: return ObjectType.MYSTERY;
    case 0x04: return ObjectType.POTION;
    case 0x06: return ObjectType.SHADOW;
    default:
      console.warn(`Unknown object type: $${byte.toString(16)}`);
      return undefined;
  }
}
```

### Object Placement

Objects are randomly placed at one of the 9 grid positions when entering a room:
```
Positions 0-8:

0 | 1 | 2
--+---+--
3 | 4 | 5
--+---+--
6 | 7 | 8
```

## Segment 4: Colors ($1DC3-$1E42)

**Address**: $1DC3 + roomId (128 bytes)

Color encoding uses an extended format to support C64 color conversion:

```typescript
function decodeSegment4(byte: number): ColorData {
  // Lower nibble (bits 0-3): Atari color value (after rotation)
  // Note: Original Atari format has luma in high nibble
  // Shamus+ rotates nibbles at runtime for C64 compatibility
  
  const colorNibble = byte & 0x0F;
  
  // Bits 5-7: Luma (brightness) value 0-7
  // Bit 4 is skipped in luma to preserve door position flag
  const luma = (byte >> 5) & 0x07;
  
  // Bit 4: Door position
  // 0 = right exit closed (need key to open left)
  // 1 = left exit closed (need key to open right)
  const doorClosesLeft = (byte & 0x10) !== 0;
  
  // Combine color and luma to get final Atari color
  // Atari format: high nibble = luma, low nibble = color
  const finalColor = (luma << 4) | colorNibble;
  
  return {
    color: finalColor,
    luma,
    doorClosesLeft
  };
}
```

### C64 to Atari Color Mapping

| C64 Value | C64 Color | Atari Equiv |
|-----------|-----------|-------------|
| $00 | Black | $00 |
| $01 | White | $0E |
| $02 | Red | $26 |
| $03 | Cyan | $9C |
| $04 | Purple | $58 |
| $05 | Green | $BA |
| $06 | Blue | $74 |
| $07 | Yellow | $E8 |
| $08 | Orange | $18 |
| $09 | Brown | $E6 |
| $0A | Light Red | $2A |
| $0B | Dark Grey | $06 |
| $0C | Grey | $0A |
| $0D | Light Green | $BE |
| $0E | Light Blue | $7A |
| $0F | Light Grey | $0C |

### Fixed Object Colors by Level

| Level | Mystery Bonus | Potion |
|-------|---------------|--------|
| Black | Violet ($04) | Light Green ($0D) |
| Blue | Violet ($04) | Light Blue ($0E) |
| Green | Green ($05) | Brown ($09) |
| Red | Orange ($08) | Brown ($09) |

## Segment 5: Pod Rooms & Level Boundaries

**Address**: Bytes 512-639 of maze data

### Structure

```
Byte 0:        Pod room count (including room 127 for Shadow)
Bytes 1-(n):   Pod room numbers (up to 8 rooms)
Bytes $7D:     Last room of BLACK level
Bytes $7E:     Last room of BLUE level
Bytes $7F:     Last room of GREEN level
               (RED level continues to room 127)
```

```typescript
function decodeSegment5(buffer: Uint8Array): Segment5Data {
  // Byte 0: Count of pod rooms
  const podRoomCount = buffer[0];
  
  // Bytes 1 to podRoomCount: Pod room numbers
  const podRooms: number[] = [];
  for (let i = 1; i <= podRoomCount && i < 0x7D; i++) {
    podRooms.push(buffer[i]);
  }
  
  // Last 3 bytes: Level boundaries
  // These are the LAST rooms of each level (not first of next)
  const levelBoundaries: LevelBoundaries = {
    blackLevelEnd: buffer[0x7D],
    blueLevelEnd: buffer[0x7E],
    greenLevelEnd: buffer[0x7F]
    // Red level = rooms (greenLevelEnd + 1) to 127
  };
  
  return { podRooms, levelBoundaries };
}

/**
 * Determine level color based on room ID
 */
function getLevelColor(roomId: number, boundaries: LevelBoundaries): LevelColor {
  if (roomId <= boundaries.blackLevelEnd) return 'BLACK';
  if (roomId <= boundaries.blueLevelEnd) return 'BLUE';
  if (roomId <= boundaries.greenLevelEnd) return 'GREEN';
  return 'RED';
}
```

## Complete Room Construction

```typescript
function constructRoom(
  roomId: number,
  seg1: number,
  seg2: number,
  seg3: number,
  seg4: number,
  podRooms: number[],
  boundaries: LevelBoundaries
): Room {
  // Decode segments
  const s1 = decodeSegment1(seg1, roomId);
  const s2 = decodeSegment2(seg2, s1.isCorridor);
  const s3 = decodeSegment3(seg3);
  const s4 = decodeSegment4(seg4);
  
  // Check if pod room
  const isPodRoom = podRooms.includes(roomId);
  
  // Build room object
  const room: Room = {
    id: roomId,
    
    // Walls
    horizontalWalls: s1.horizontalWalls,
    verticalWalls: s2.verticalWalls,
    
    // Room type
    isCorridor: s1.isCorridor,
    isPodRoom,
    corridor: s1.corridorType ? {
      type: s1.corridorType,
      verticalExitRoomId: s2.verticalExit || 0,
      description: getCorridorDescription(s1.corridorType)
    } : undefined,
    
    // Object
    object: s3 ? {
      type: s3,
      color: s4.color,
      luma: s4.luma,
      doorClosesLeft: s4.doorClosesLeft,
      // x, y assigned randomly when room is entered
    } : undefined,
    
    // Exits
    exits: {
      north: s2.verticalExit,
      south: s2.verticalExit,  // Same room for both directions
      east: roomId < 127 ? roomId + 1 : 127,
      west: roomId > 0 ? roomId - 1 : 0
    },
    
    // State
    cleared: false,
    visited: false,
    
    // Enemies (procedurally generated based on room/level)
    enemies: generateEnemies(roomId, boundaries)
  };
  
  return room;
}
```

## Room Exit Rules

```typescript
function calculateExits(roomId: number, verticalExit: number | undefined, walls: WallTile[]): RoomExits {
  // Horizontal movement: always possible by room number
  // (electrocuting walls at edges prevent leaving maze)
  const exits: RoomExits = {
    east: roomId < 127 ? roomId + 1 : roomId,
    west: roomId > 0 ? roomId - 1 : roomId
  };
  
  // Vertical movement: only through corridors
  if (verticalExit !== undefined) {
    exits.north = verticalExit;
    exits.south = verticalExit;
    // Both directions lead to the same room
  }
  
  return exits;
}
```

## Usage Example

```typescript
// Load the MAP file
const mapData = await fetch('SHAM_A8.MAP').then(r => r.arrayBuffer());
const mapBuffer = new Uint8Array(mapData);

// Parse all 5 mazes
const parser = new BinaryParser();
const mazes = parser.parseFullMap(mapBuffer);

// Access specific maze
const holmesMaze = mazes[2];  // Holmes is maze index 2
const room42 = holmesMaze.rooms[42];

console.log(`Room 42 is a ${room42.isCorridor ? 'corridor' : 'chamber'}`);
console.log(`Has ${room42.horizontalWalls.filter(w => w.exists).length} horizontal walls`);
```

## Validation Checklist

- [ ] All 128 rooms parsed per maze
- [ ] Horizontal walls correctly mapped to bits 0-5
- [ ] Vertical walls correctly mapped to bits 0-5
- [ ] Corridor flag (bit 7) detected
- [ ] Corridor types classified correctly
- [ ] Vertical exit room IDs extracted for corridors
- [ ] All object types decoded (0, 1, 2, 3, 4, 6)
- [ ] Color + luma rotation handled
- [ ] Door position (bit 4) preserved
- [ ] Pod room list extracted
- [ ] Level boundaries parsed from last 3 bytes
- [ ] Room exit logic follows Atari rules
