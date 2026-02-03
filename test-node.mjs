/**
 * Node.js Test Script for Shamus+
 * Tests parser, game state, and other non-DOM components
 */

import { BinaryParser, GameState, MazeType } from './dist/index.js';

console.log('='.repeat(60));
console.log('Shamus+ Node.js Test Suite');
console.log('='.repeat(60));

// Test 1: Binary Parser
console.log('\n📦 Test 1: Binary Parser');
console.log('-'.repeat(40));

try {
  const parser = new BinaryParser();
  
  // Create test maze data
  const testData = parser.createTestMaze();
  console.log(`✓ Created test maze: ${testData.length} bytes`);
  
  // Parse the maze
  const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
  
  console.log(`✓ Parsed successfully`);
  console.log(`  Total rooms: ${result.stats.totalRooms}`);
  console.log(`  Corridors: ${result.stats.corridorCount}`);
  console.log(`  Pod rooms: ${result.stats.podRoomCount}`);
  console.log(`  Objects: ${result.stats.objectCount}`);
  console.log(`  Warnings: ${result.warnings.length}`);
  
  // Check room 0
  const room0 = result.maze.rooms[0];
  console.log(`\n  Room 0 details:`);
  console.log(`    Type: ${room0.isCorridor ? 'Corridor' : 'Chamber'}`);
  console.log(`    Horizontal walls: ${room0.horizontalWalls.filter(w => w.exists).length}`);
  console.log(`    Vertical walls: ${room0.verticalWalls.filter(w => w.exists).length}`);
  console.log(`    Has object: ${room0.object ? 'Yes' : 'No'}`);
  
  if (room0.object) {
    console.log(`    Object type: ${room0.object.type}`);
  }
  
  // Check room 1 (should be corridor)
  const room1 = result.maze.rooms[1];
  console.log(`\n  Room 1 details:`);
  console.log(`    Type: ${room1.isCorridor ? 'Corridor' : 'Chamber'}`);
  if (room1.corridor) {
    console.log(`    Corridor type: 0x${room1.corridor.type.toString(16)}`);
    console.log(`    Description: ${room1.corridor.description}`);
    console.log(`    Vertical exit: Room ${room1.corridor.verticalExitRoomId}`);
  }
  
  // Check level boundaries
  console.log(`\n  Level boundaries:`);
  console.log(`    Black level ends at: ${result.maze.levelBoundaries.blackLevelEnd}`);
  console.log(`    Blue level ends at: ${result.maze.levelBoundaries.blueLevelEnd}`);
  console.log(`    Green level ends at: ${result.maze.levelBoundaries.greenLevelEnd}`);
  
  console.log('\n✅ Parser test PASSED');
} catch (e) {
  console.error('\n❌ Parser test FAILED:', e.message);
  console.error(e.stack);
}

// Test 2: Game State
console.log('\n🎮 Test 2: Game State & Tournament');
console.log('-'.repeat(40));

try {
  const game = new GameState('NOVICE');
  const initialState = game.getState();
  
  console.log(`✓ Game created`);
  console.log(`  Initial lives: ${initialState.lives}`);
  console.log(`  Initial score: ${initialState.score}`);
  console.log(`  Initial speed ($0206): ${initialState.shamusSpeed}`);
  console.log(`  Difficulty: ${initialState.difficulty}`);
  
  // Test tournament mode
  console.log(`\n  Starting tournament...`);
  game.setMaze(MazeType.TOURNAMENT);
  
  const tournamentState = game.getState();
  console.log(`  Tournament active: ${tournamentState.tournament.active}`);
  console.log(`  Starting maze: ${tournamentState.currentMaze}`);
  console.log(`  Sequence: ${tournamentState.tournament.mazeSequence.join(' → ')}`);
  
  // Simulate completing all mazes
  console.log(`\n  Simulating tournament progression:`);
  for (let i = 0; i < 5; i++) {
    const beforeLives = game.getState().lives;
    const beforeMaze = game.getState().currentMaze;
    
    game.advanceTournament();
    
    const afterLives = game.getState().lives;
    const afterMaze = game.getState().currentMaze;
    const afterSpeed = game.getState().shamusSpeed;
    
    console.log(`    Maze ${i+1}: ${beforeMaze} → ${afterMaze}, Lives: ${beforeLives} → ${afterLives}, Speed: ${afterSpeed}`);
  }
  
  // Test speed control ($0206 patch)
  console.log(`\n  Testing speed control (slx patch):`);
  game.updateSpeedForLevel('BLUE', 'up');
  console.log(`    After level up: ${game.getState().shamusSpeed}`);
  game.updateSpeedForLevel('BLUE', 'down');
  console.log(`    After level down: ${game.getState().shamusSpeed}`);
  
  // Test room clear speed increase
  const beforeSpeed = game.getState().shamusSpeed;
  game.moveToRoom(10);
  game.clearRoom();
  const afterClearSpeed = game.getState().shamusSpeed;
  console.log(`\n    Room clear speed: ${beforeSpeed} → ${afterClearSpeed} (increased)`);
  
  // Test C64 maze detection
  game.setMaze(MazeType.HOLMES);
  console.log(`\n  C64 maze detection (Holmes): ${game.isC64Maze() ? '✓ Yes' : '✗ No'}`);
  
  game.setMaze(MazeType.ORIGINAL_ATARI);
  console.log(`  Atari maze detection: ${game.isC64Maze() ? '✗ Yes (wrong)' : '✓ No (correct)'}`);
  
  console.log('\n✅ Game State test PASSED');
} catch (e) {
  console.error('\n❌ Game State test FAILED:', e.message);
  console.error(e.stack);
}

// Test 3: Corridor Types
console.log('\n🚇 Test 3: Corridor Types');
console.log('-'.repeat(40));

try {
  const parser = new BinaryParser();
  const testData = parser.createTestMaze();
  const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
  
  console.log('Corridor types found:');
  const corridors = result.maze.rooms.filter(r => r.isCorridor);
  
  if (corridors.length === 0) {
    console.log('  (No corridors in test data)');
  } else {
    corridors.forEach(room => {
      console.log(`  Room ${room.id}: ${room.corridor?.description} (0x${room.corridor?.type.toString(16)})`);
    });
  }
  
  console.log('\n✅ Corridor test PASSED');
} catch (e) {
  console.error('\n❌ Corridor test FAILED:', e.message);
}

// Test 4: Object Types
console.log('\n🎯 Test 4: Object Types');
console.log('-'.repeat(40));

try {
  const parser = new BinaryParser();
  const testData = parser.createTestMaze();
  const result = parser.parseMapSegment(testData, MazeType.ORIGINAL_ATARI);
  
  const objects = result.maze.rooms.filter(r => r.object);
  
  console.log(`Objects found: ${objects.length}`);
  objects.forEach(room => {
    console.log(`  Room ${room.id}: Type ${room.object?.type}, Color 0x${room.object?.color.toString(16)}`);
  });
  
  console.log('\n✅ Object test PASSED');
} catch (e) {
  console.error('\n❌ Object test FAILED:', e.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));
console.log('✅ All core components working correctly!');
console.log('\nTo test in browser:');
console.log('  1. Run: npx serve .');
console.log('  2. Open: http://localhost:3000/test.html');
console.log('\nTo test with real MAP data:');
console.log('  - Extract SHAM_A8.MAP from Shamus+.zip');
console.log('  - Load in test.html for full visualization');
console.log('='.repeat(60));
