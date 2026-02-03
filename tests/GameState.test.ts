/**
 * Jest Test Suite for GameState
 * Tests tournament mode, speed control, and game logic
 */

import { GameState } from '../src/state/GameState';
import { MazeType, TOURNAMENT_SEQUENCE } from '../src/types';

describe('GameState', () => {
  let game: GameState;

  beforeEach(() => {
    game = new GameState('NOVICE');
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const state = game.getState();
      
      expect(state.lives).toBe(3);
      expect(state.score).toBe(0);
      expect(state.currentMaze).toBe(MazeType.ORIGINAL_ATARI);
      expect(state.currentRoom).toBe(0);
      expect(state.difficulty).toBe('NOVICE');
      expect(state.inventory.keys).toBe(0);
      expect(state.inventory.hasIonShiv).toBe(false);
    });

    it('should set correct initial speed for NOVICE', () => {
      const state = game.getState();
      expect(state.shamusSpeed).toBe(0x07); // NOVICE speed
    });

    it('should set correct initial speed for ADVANCED', () => {
      const advancedGame = new GameState('ADVANCED');
      expect(advancedGame.getState().shamusSpeed).toBe(0x05);
    });

    it('should set correct initial speed for EXPERT', () => {
      const expertGame = new GameState('EXPERT');
      expect(expertGame.getState().shamusSpeed).toBe(0x03);
    });
  });

  describe('Maze Selection', () => {
    it('should change current maze', () => {
      game.setMaze(MazeType.HOLMES);
      expect(game.getState().currentMaze).toBe(MazeType.HOLMES);
    });

    it('should detect C64 mazes correctly', () => {
      const c64Mazes = [
        MazeType.ORIGINAL_C64,
        MazeType.HOLMES,
        MazeType.CLUSEAU,
        MazeType.MARLOWE,
        MazeType.BOND
      ];
      
      c64Mazes.forEach(maze => {
        game.setMaze(maze);
        expect(game.isC64Maze()).toBe(true);
      });
    });

    it('should detect Atari maze correctly', () => {
      game.setMaze(MazeType.ORIGINAL_ATARI);
      expect(game.isC64Maze()).toBe(false);
    });

    it('should track room changes', () => {
      game.moveToRoom(42);
      expect(game.getState().currentRoom).toBe(42);
    });
  });

  describe('Tournament Mode', () => {
    it('should activate tournament mode', () => {
      game.setMaze(MazeType.TOURNAMENT);
      const state = game.getState();
      
      expect(state.tournament.active).toBe(true);
      expect(state.currentMaze).toBe(MazeType.HOLMES); // First in sequence
    });

    it('should have correct tournament sequence', () => {
      game.setMaze(MazeType.TOURNAMENT);
      const state = game.getState();
      
      expect(state.tournament.mazeSequence).toEqual(TOURNAMENT_SEQUENCE);
      expect(state.tournament.mazeSequence).toEqual([
        MazeType.HOLMES,
        MazeType.CLUSEAU,
        MazeType.MARLOWE,
        MazeType.BOND
      ]);
    });

    it('should advance through tournament mazes', () => {
      game.setMaze(MazeType.TOURNAMENT);
      
      const initialLives = game.getState().lives;
      
      // Complete first maze
      game.advanceTournament();
      
      expect(game.getState().currentMaze).toBe(MazeType.CLUSEAU);
      expect(game.getState().lives).toBe(initialLives + 1); // +1 life per maze
      expect(game.getState().tournament.currentMazeIndex).toBe(1);
    });

    it('should complete full tournament loop', () => {
      game.setMaze(MazeType.TOURNAMENT);
      const startLives = game.getState().lives;
      
      // Complete all 4 mazes
      for (let i = 0; i < 4; i++) {
        game.advanceTournament();
      }
      
      // Should loop back to first maze
      expect(game.getState().currentMaze).toBe(MazeType.HOLMES);
      expect(game.getState().lives).toBe(startLives + 4); // +4 lives total
      expect(game.getState().tournament.mazesCompleted).toBe(1);
    });

    it('should increase speed after completing all mazes', () => {
      game.setMaze(MazeType.TOURNAMENT);
      
      // Complete all mazes
      for (let i = 0; i < 4; i++) {
        game.advanceTournament();
      }
      
      // Speed should be faster on second loop
      expect(game.getState().shamusSpeed).toBe(0x04); // Tournament loop speed
    });

    it('should return false when not in tournament', () => {
      game.setMaze(MazeType.ORIGINAL_ATARI);
      const result = game.advanceTournament();
      expect(result).toBe(false);
    });

    it('should generate correct tournament progress string', () => {
      game.setMaze(MazeType.TOURNAMENT);
      expect(game.getTournamentProgress()).toContain('1/4');
      
      game.advanceTournament();
      expect(game.getTournamentProgress()).toContain('2/4');
    });
  });

  describe('Speed Control ($0206 patch)', () => {
    it('should increase speed when going up a level', () => {
      const initialSpeed = game.getState().shamusSpeed;
      game.updateSpeedForLevel('BLUE', 'up');
      expect(game.getState().shamusSpeed).toBe(initialSpeed - 1);
    });

    it('should decrease speed when going down a level', () => {
      game.updateSpeedForLevel('BLUE', 'up'); // First increase
      const currentSpeed = game.getState().shamusSpeed;
      
      game.updateSpeedForLevel('BLUE', 'down');
      expect(game.getState().shamusSpeed).toBe(currentSpeed + 1);
    });

    it('should increase speed after clearing room', () => {
      game.moveToRoom(10);
      const beforeSpeed = game.getState().shamusSpeed;
      
      game.clearRoom();
      
      expect(game.getState().shamusSpeed).toBe(beforeSpeed - 1);
      expect(game.getState().roomCleared).toBe(true);
    });

    it('should not double-clear a room', () => {
      game.moveToRoom(10);
      game.clearRoom();
      const speedAfterFirstClear = game.getState().shamusSpeed;
      
      game.clearRoom(); // Try to clear again
      
      expect(game.getState().shamusSpeed).toBe(speedAfterFirstClear);
    });
  });

  describe('Score and Lives', () => {
    it('should add score', () => {
      game.addScore(1000);
      expect(game.getState().score).toBe(1000);
      
      game.addScore(500);
      expect(game.getState().score).toBe(1500);
    });

    it('should add life', () => {
      const initialLives = game.getState().lives;
      game.addLife();
      expect(game.getState().lives).toBe(initialLives + 1);
    });

    it('should lose life and return true if lives remain', () => {
      const result = game.loseLife();
      expect(result).toBe(true);
      expect(game.getState().lives).toBe(2);
    });

    it('should lose life and return false when no lives remain', () => {
      game.loseLife(); // 2 lives
      game.loseLife(); // 1 life
      const result = game.loseLife(); // 0 lives
      
      expect(result).toBe(false);
      expect(game.getState().lives).toBe(0);
    });
  });

  describe('Inventory', () => {
    it('should add key', () => {
      game.addKey();
      expect(game.getState().inventory.keys).toBe(1);
      
      game.addKey();
      expect(game.getState().inventory.keys).toBe(2);
    });

    it('should use key when available', () => {
      game.addKey();
      game.addKey();
      
      const result = game.useKey();
      
      expect(result).toBe(true);
      expect(game.getState().inventory.keys).toBe(1);
    });

    it('should fail to use key when none available', () => {
      const result = game.useKey();
      
      expect(result).toBe(false);
      expect(game.getState().inventory.keys).toBe(0);
    });
  });

  describe('Level Color', () => {
    it('should update level color based on room and boundaries', () => {
      const boundaries = {
        blackLevelEnd: 31,
        blueLevelEnd: 63,
        greenLevelEnd: 95
      };
      
      game.moveToRoom(10);
      game.updateLevelColor(boundaries);
      expect(game.getState().currentLevel).toBe('BLACK');
      
      game.moveToRoom(50);
      game.updateLevelColor(boundaries);
      expect(game.getState().currentLevel).toBe('BLUE');
      
      game.moveToRoom(80);
      game.updateLevelColor(boundaries);
      expect(game.getState().currentLevel).toBe('GREEN');
      
      game.moveToRoom(100);
      game.updateLevelColor(boundaries);
      expect(game.getState().currentLevel).toBe('RED');
    });
  });

  describe('Pause', () => {
    it('should toggle pause', () => {
      expect(game.getState().paused).toBe(false);
      
      game.togglePause();
      expect(game.getState().paused).toBe(true);
      
      game.togglePause();
      expect(game.getState().paused).toBe(false);
    });

    it('should set pause state', () => {
      game.setPaused(true);
      expect(game.getState().paused).toBe(true);
      
      game.setPaused(false);
      expect(game.getState().paused).toBe(false);
    });

    it('should report paused state correctly', () => {
      expect(game.isPaused()).toBe(false);
      game.togglePause();
      expect(game.isPaused()).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      game.addScore(5000);
      game.addLife();
      game.addKey();
      game.moveToRoom(50);
      
      game.reset(MazeType.HOLMES);
      
      const state = game.getState();
      expect(state.score).toBe(0);
      expect(state.lives).toBe(3);
      expect(state.inventory.keys).toBe(0);
      expect(state.currentRoom).toBe(0);
      expect(state.currentMaze).toBe(MazeType.HOLMES);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize state', () => {
      game.addScore(1000);
      game.addLife();
      game.moveToRoom(42);
      
      const serialized = game.serialize();
      
      // Create new game and restore
      const newGame = new GameState('NOVICE');
      newGame.deserialize(serialized);
      
      const restoredState = newGame.getState();
      expect(restoredState.score).toBe(1000);
      expect(restoredState.lives).toBe(4);
      expect(restoredState.currentRoom).toBe(42);
    });
  });
});
