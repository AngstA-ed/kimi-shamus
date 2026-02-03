/**
 * Jest Test Suite for BinaryParser
 * Tests 640-byte MAP parsing, corridor types, and room structures
 */

import { BinaryParser } from '../src/parser/BinaryParser';
import { 
  MazeType, 
  CorridorType, 
  ObjectType,
  MAZE_NAMES
} from '../src/types';

describe('BinaryParser', () => {
  let parser: BinaryParser;

  beforeEach(() => {
    parser = new BinaryParser();
  });

  describe('Basic Parsing', () => {
    it('should create a test maze with correct size', () => {
      const testData = parser.createTestMaze();
      expect(testData.length).toBe(640);
    });

    it('should parse a 640-byte maze segment', () => {
      const testData = parser.createTestMaze();
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(result.maze).toBeDefined();
      expect(result.stats.totalRooms).toBe(128);
      expect(result.maze.rooms).toHaveLength(128);
    });

    it('should throw error for invalid maze size', () => {
      const invalidData = new Uint8Array(100); // Wrong size
      expect(() => {
        parser.parseMapSegment(invalidData, MazeType.ORIGINAL_ATARI);
      }).toThrow('Invalid maze size');
    });
  });

  describe('Corridor Types (7 Atari Variants)', () => {
    it('should detect all 7 corridor types', () => {
      // Create test data with each corridor type
      const corridorTypes = [
        { type: CorridorType.DEAD_END_BOTTOM, value: 0x80, desc: 'Dead end bottom' },
        { type: CorridorType.BOTTOM_TO_RIGHT, value: 0x90, desc: 'Bottom to right' },
        { type: CorridorType.BOTTOM_TO_LEFT, value: 0xA0, desc: 'Bottom to left' },
        { type: CorridorType.T_BOTTOM_EXIT, value: 0xB0, desc: 'T-junction bottom' },
        { type: CorridorType.DEAD_END_TOP, value: 0xC0, desc: 'Dead end top' },
        { type: CorridorType.TOP_TO_RIGHT, value: 0xD0, desc: 'Top to right' },
        { type: CorridorType.TOP_TO_LEFT, value: 0xE0, desc: 'Top to left' },
        { type: CorridorType.T_TOP_EXIT, value: 0xF0, desc: 'T-junction top' },
      ];

      corridorTypes.forEach(({ type, value, desc }) => {
        const testData = parser.createTestMaze();
        // Set room 1 to be a specific corridor type
        testData[1] = value; // Segment 1, room 1
        testData[129] = 0x10; // Segment 2, vertical exit to room 16
        
        const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
        const room1 = result.maze.rooms[1];
        
        expect(room1.isCorridor).toBe(true);
        expect(room1.corridor).toBeDefined();
        expect(room1.corridor!.type).toBe(type);
        expect(room1.corridor!.description.toLowerCase()).toContain(
          desc.toLowerCase().split(' ')[0]
        );
      });
    });

    it('should identify non-corridor rooms as chambers', () => {
      const testData = parser.createTestMaze();
      // Room 0 has no corridor flag (bit 7 not set)
      testData[0] = 0x0A; // Just some walls, no corridor
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      const room0 = result.maze.rooms[0];
      
      expect(room0.isCorridor).toBe(false);
      expect(room0.corridor).toBeUndefined();
    });

    it('should extract vertical exit room IDs for corridors', () => {
      const testData = parser.createTestMaze();
      testData[1] = 0x90; // Corridor type
      testData[129] = 0x2A; // Vertical exit to room 42
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      const room1 = result.maze.rooms[1];
      
      expect(room1.corridor!.verticalExitRoomId).toBe(42);
      expect(room1.exits.north).toBe(42);
      expect(room1.exits.south).toBe(42);
    });
  });

  describe('Wall Parsing', () => {
    it('should parse horizontal walls from segment 1', () => {
      const testData = parser.createTestMaze();
      // Set specific wall bits for room 0
      // Bits 0-2: top row, bits 3-5: bottom row
      testData[0] = 0b00001010; // Walls at bits 1 and 3
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      const room0 = result.maze.rooms[0];
      
      expect(room0.horizontalWalls).toHaveLength(6);
      expect(room0.horizontalWalls[0].exists).toBe(false); // bit 0
      expect(room0.horizontalWalls[1].exists).toBe(true);  // bit 1
      expect(room0.horizontalWalls[3].exists).toBe(true);  // bit 3
    });

    it('should parse vertical walls from segment 2', () => {
      const testData = parser.createTestMaze();
      // Bits 0-2: left column, bits 3-5: right column
      testData[128] = 0b00010010; // Walls at bits 1 and 4
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      const room0 = result.maze.rooms[0];
      
      expect(room0.verticalWalls).toHaveLength(6);
      expect(room0.verticalWalls[0].exists).toBe(false); // bit 0
      expect(room0.verticalWalls[1].exists).toBe(true);  // bit 1
      expect(room0.verticalWalls[4].exists).toBe(true);  // bit 4
    });

    it('should have correct grid positions for walls', () => {
      const testData = parser.createTestMaze();
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      const room0 = result.maze.rooms[0];
      
      // Horizontal wall positions
      expect(room0.horizontalWalls[0]).toMatchObject({ x: 0, y: 0, bitIndex: 0 });
      expect(room0.horizontalWalls[1]).toMatchObject({ x: 1, y: 0, bitIndex: 1 });
      expect(room0.horizontalWalls[3]).toMatchObject({ x: 0, y: 2, bitIndex: 3 });
      
      // Vertical wall positions
      expect(room0.verticalWalls[0]).toMatchObject({ x: 0, y: 0, bitIndex: 0 });
      expect(room0.verticalWalls[3]).toMatchObject({ x: 2, y: 0, bitIndex: 3 });
    });
  });

  describe('Object Parsing', () => {
    it('should parse all object types from segment 3', () => {
      const objectTests = [
        { byte: 0x00, type: undefined, desc: 'none' },
        { byte: 0x01, type: ObjectType.KEYHOLE, desc: 'keyhole' },
        { byte: 0x02, type: ObjectType.KEY, desc: 'key' },
        { byte: 0x03, type: ObjectType.MYSTERY, desc: 'mystery' },
        { byte: 0x04, type: ObjectType.POTION, desc: 'potion' },
        { byte: 0x06, type: ObjectType.SHADOW, desc: 'shadow' },
      ];

      objectTests.forEach(({ byte, type, desc }) => {
        const testData = parser.createTestMaze();
        testData[256] = byte; // Segment 3, room 0
        
        const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
        const room0 = result.maze.rooms[0];
        
        if (type === undefined) {
          expect(room0.object).toBeUndefined();
        } else {
          expect(room0.object).toBeDefined();
          expect(room0.object!.type).toBe(type);
        }
      });
    });

    it('should parse color and luma from segment 4', () => {
      const testData = parser.createTestMaze();
      // Color byte: lower nibble = color, bits 5-7 = luma, bit 4 = door position
      testData[384] = 0x64; // luma=3, color=4, doorClosesLeft=false
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      const room0 = result.maze.rooms[0];
      
      expect(room0.object).toBeDefined();
      expect(room0.object!.color).toBe(0x34); // (3 << 4) | 4
      expect(room0.object!.luma).toBe(3);
      expect(room0.object!.doorClosesLeft).toBe(false);
    });
  });

  describe('Pod Rooms', () => {
    it('should parse pod room list from segment 5', () => {
      const testData = parser.createTestMaze();
      testData[512] = 3; // 3 pod rooms
      testData[513] = 18;
      testData[514] = 36;
      testData[515] = 127;
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(result.maze.podRooms).toHaveLength(3);
      expect(result.maze.podRooms[0].roomId).toBe(18);
      expect(result.maze.podRooms[1].roomId).toBe(36);
      expect(result.maze.podRooms[2].roomId).toBe(127);
      
      expect(result.stats.podRoomCount).toBe(3);
    });

    it('should mark pod rooms correctly', () => {
      const testData = parser.createTestMaze();
      testData[512] = 2;
      testData[513] = 5;  // Room 5 is pod
      testData[514] = 10; // Room 10 is pod
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(result.maze.rooms[5].isPodRoom).toBe(true);
      expect(result.maze.rooms[10].isPodRoom).toBe(true);
      expect(result.maze.rooms[0].isPodRoom).toBe(false);
    });
  });

  describe('Level Boundaries', () => {
    it('should parse level boundaries from segment 5', () => {
      const testData = parser.createTestMaze();
      testData[637] = 31;  // Black ends at 31
      testData[638] = 63;  // Blue ends at 63
      testData[639] = 95;  // Green ends at 95
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(result.maze.levelBoundaries.blackLevelEnd).toBe(31);
      expect(result.maze.levelBoundaries.blueLevelEnd).toBe(63);
      expect(result.maze.levelBoundaries.greenLevelEnd).toBe(95);
    });

    it('should determine level colors correctly', () => {
      const testData = parser.createTestMaze();
      testData[637] = 31;
      testData[638] = 63;
      testData[639] = 95;
      
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(parser.getLevelColor(10, result.maze.levelBoundaries)).toBe('BLACK');
      expect(parser.getLevelColor(50, result.maze.levelBoundaries)).toBe('BLUE');
      expect(parser.getLevelColor(80, result.maze.levelBoundaries)).toBe('GREEN');
      expect(parser.getLevelColor(100, result.maze.levelBoundaries)).toBe('RED');
    });
  });

  describe('Room Exits', () => {
    it('should set east/west exits based on room ID', () => {
      const testData = parser.createTestMaze();
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      const room50 = result.maze.rooms[50];
      expect(room50.exits.east).toBe(51);
      expect(room50.exits.west).toBe(49);
    });

    it('should clamp exits at maze boundaries', () => {
      const testData = parser.createTestMaze();
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(result.maze.rooms[0].exits.west).toBe(0); // Can't go below 0
      expect(result.maze.rooms[127].exits.east).toBe(127); // Can't go above 127
    });
  });

  describe('Maze Metadata', () => {
    it('should set correct maze type and name', () => {
      const testData = parser.createTestMaze();
      
      Object.values(MazeType).forEach((mazeType) => {
        if (typeof mazeType === 'number') {
          const result = parser.parseMapSegment(testData, mazeType);
          expect(result.maze.type).toBe(mazeType);
          expect(result.maze.name).toBe(MAZE_NAMES[mazeType]);
        }
      });
    });

    it('should have correct total room count', () => {
      const testData = parser.createTestMaze();
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      expect(result.maze.totalRooms).toBe(128);
      expect(result.stats.totalRooms).toBe(128);
    });
  });

  describe('JSON Export', () => {
    it('should export maze to JSON', () => {
      const testData = parser.createTestMaze();
      const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
      
      const json = parser.mazeToJSON(result.maze);
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(parsed.totalRooms).toBe(128);
      expect(parsed.rooms).toHaveLength(128);
    });
  });

  describe('Full Map Parsing', () => {
    it('should parse multiple mazes from full map data', () => {
      // Create 3200 bytes (5 mazes × 640 bytes)
      const fullMap = new Uint8Array(3200);
      
      // Fill with test data for 5 mazes
      for (let i = 0; i < 5; i++) {
        const testMaze = parser.createTestMaze();
        fullMap.set(testMaze, i * 640);
      }
      
      const results = parser.parseFullMap(fullMap);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.maze.type).toBe(index);
        expect(result.stats.totalRooms).toBe(128);
      });
    });
  });
});
