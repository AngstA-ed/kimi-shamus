/**
 * Game State Management
 * Implements tournament mode (ADVANCETNMT) and speed control ($0206 patch)
 */

import {
  GameState as IGameState,
  MazeType,
  TOURNAMENT_SEQUENCE,
  Difficulty,
  LevelColor,
  TournamentState,
  PlayerInventory,
  LevelBoundaries
} from '../types';

/**
 * Default game configuration
 */
const DEFAULT_CONFIG = {
  STARTING_LIVES: 3,
  STARTING_SCORE: 0,
  STARTING_ROOM: 0,
  
  // Speed values (from $0206 register)
  SPEED_NOVICE: 0x07,
  SPEED_ADVANCED: 0x05,
  SPEED_EXPERT: 0x03,
  SPEED_PER_LEVEL_DECREASE: 1,
  SPEED_PER_DIFFICULTY_DECREASE: 2,
  SPEED_TOURNAMENT_DEFAULT: 0x05,
  SPEED_TOURNAMENT_LOOP: 0x04,
  
  // Room clear speed boost
  SPEED_BOOST_AFTER_CLEAR: 1,
  
  // Tournament
  TOURNAMENT_START_MAZE: 0,
  LIVES_PER_MAZE: 1
};

/**
 * Game State Manager
 * Mirrors 6502 memory layout from Shamuspl.asm:
 * - $0206: shamusSpeed (delay loop counter)
 * - $0202: lives counter
 * - $208, $235: current room
 */
export class GameState {
  private state: IGameState;

  constructor(difficulty: Difficulty = 'NOVICE') {
    this.state = this.createInitialState(difficulty);
  }

  /**
   * Create initial game state
   */
  private createInitialState(difficulty: Difficulty): IGameState {
    const baseSpeed = this.getBaseSpeedForDifficulty(difficulty);
    
    return {
      currentMaze: MazeType.ORIGINAL_ATARI,
      currentRoom: DEFAULT_CONFIG.STARTING_ROOM,
      lives: DEFAULT_CONFIG.STARTING_LIVES,
      score: DEFAULT_CONFIG.STARTING_SCORE,
      inventory: {
        keys: 0,
        hasIonShiv: false
      },
      shamusSpeed: baseSpeed,
      difficulty,
      tournament: {
        active: false,
        currentMazeIndex: 0,
        mazesCompleted: 0,
        mazeSequence: TOURNAMENT_SEQUENCE,
        baseSpeed: DEFAULT_CONFIG.SPEED_TOURNAMENT_DEFAULT
      },
      currentLevel: 'BLACK',
      roomCleared: false,
      enemiesDefeated: 0,
      paused: false
    };
  }

  /**
   * Get base speed for difficulty level
   * Based on $0206 initialization in original game
   */
  private getBaseSpeedForDifficulty(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'NOVICE': return DEFAULT_CONFIG.SPEED_NOVICE;
      case 'ADVANCED': return DEFAULT_CONFIG.SPEED_ADVANCED;
      case 'EXPERT': return DEFAULT_CONFIG.SPEED_EXPERT;
      default: return DEFAULT_CONFIG.SPEED_NOVICE;
    }
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): Readonly<IGameState> {
    return { ...this.state };
  }

  /**
   * Set current maze
   */
  setMaze(mazeType: MazeType): void {
    this.state.currentMaze = mazeType;
    this.state.tournament.active = (mazeType === MazeType.TOURNAMENT);
    
    if (mazeType === MazeType.TOURNAMENT) {
      // Tournament starts with Holmes (skip Original C64 as per PDF)
      this.state.tournament.currentMazeIndex = 0;
      this.state.currentMaze = TOURNAMENT_SEQUENCE[0];
    }
  }

  /**
   * Advance to next room
   */
  moveToRoom(roomId: number): void {
    this.state.currentRoom = roomId;
    this.state.roomCleared = false;
    this.state.enemiesDefeated = 0;
  }

  /**
   * Mark current room as cleared
   * Triggers Shamus speed increase (Atari-specific behavior)
   */
  clearRoom(): void {
    if (!this.state.roomCleared) {
      this.state.roomCleared = true;
      this.increaseSpeedAfterClear();
    }
  }

  /**
   * Increase speed after clearing room
   * Atari-specific: Shamus walks faster after clearing enemies
   * Decreases $0206 delay counter
   */
  private increaseSpeedAfterClear(): void {
    // Decrease speed value = increase actual speed
    this.state.shamusSpeed = Math.max(
      0,
      this.state.shamusSpeed - DEFAULT_CONFIG.SPEED_BOOST_AFTER_CLEAR
    );
  }

  /**
   * Update speed when changing levels
   * Based on $0206 register logic from Shamuspl.asm
   */
  updateSpeedForLevel(level: LevelColor, direction: 'up' | 'down'): void {
    if (direction === 'up') {
      // Entering higher level: decrease speed value (faster)
      this.state.shamusSpeed -= DEFAULT_CONFIG.SPEED_PER_LEVEL_DECREASE;
    } else {
      // Returning to lower level: increase speed value (slower)
      // slx patch: allow speed to go below zero but ignore in delay loop
      this.state.shamusSpeed += DEFAULT_CONFIG.SPEED_PER_LEVEL_DECREASE;
    }
  }

  /**
   * Apply delay loop with slx patch
   * Original bug: negative speed values cause 65535 iterations
   * slx fix: ignore negative values, execute only one iteration
   * 
   * From Shamuspl.asm lines 146-159:
   * "patch main game delay loop to ignore negative speed numbers"
   */
  applySpeedDelay(): void {
    const speed = this.state.shamusSpeed;
    
    if (speed <= 0) {
      // slx patch: execute only one iteration
      this.executeDelayIteration();
    } else {
      // Normal: execute speed number of iterations
      for (let i = 0; i < speed; i++) {
        this.executeDelayIteration();
      }
    }
  }

  /**
   * Single delay iteration (from $2F98)
   * Counts Y register from $FF to $00
   */
  private executeDelayIteration(): void {
    // In actual implementation, this would be the delay
    // For now, it's a placeholder
    // Original: for (let y = 0xFF; y >= 0; y--) { /* wait */ }
  }

  /**
   * ADVANCETNMT - Tournament mode advancement
   * Ported from Shamuspl.asm lines 498-536
   * 
   * When completing a maze in tournament mode:
   * 1. Add one life
   * 2. Advance to next maze
   * 3. Set speed for next maze
   * 4. If completed all, loop back with faster speed
   */
  advanceTournament(): boolean {
    if (!this.state.tournament.active) {
      return false;
    }

    const tournament = this.state.tournament;
    const sequence = tournament.mazeSequence;
    
    // Add one life (per maze completion)
    this.state.lives += DEFAULT_CONFIG.LIVES_PER_MAZE;
    
    // Check if we're at the last maze
    if (tournament.currentMazeIndex >= sequence.length - 1) {
      // Completed all mazes - loop back with increased difficulty
      tournament.currentMazeIndex = 0;
      tournament.mazesCompleted++;
      
      // Set faster speed for next loop
      this.state.shamusSpeed = DEFAULT_CONFIG.SPEED_TOURNAMENT_LOOP;
      
      // Start from first maze again
      this.state.currentMaze = sequence[0];
    } else {
      // Advance to next maze
      tournament.currentMazeIndex++;
      this.state.currentMaze = sequence[tournament.currentMazeIndex];
      
      // Set default tournament speed
      this.state.shamusSpeed = DEFAULT_CONFIG.SPEED_TOURNAMENT_DEFAULT;
    }
    
    // Reset to room 0 of new maze
    this.state.currentRoom = 0;
    this.state.roomCleared = false;
    
    return true;
  }

  /**
   * Check if current maze is a C64 maze (affects audio)
   */
  isC64Maze(): boolean {
    return [
      MazeType.ORIGINAL_C64,
      MazeType.HOLMES,
      MazeType.CLUSEAU,
      MazeType.MARLOWE,
      MazeType.BOND
    ].includes(this.state.currentMaze);
  }

  /**
   * Add score
   */
  addScore(points: number): void {
    this.state.score += points;
  }

  /**
   * Add life
   */
  addLife(): void {
    this.state.lives++;
  }

  /**
   * Lose life
   */
  loseLife(): boolean {
    this.state.lives--;
    return this.state.lives > 0;
  }

  /**
   * Add key to inventory
   */
  addKey(): void {
    this.state.inventory.keys++;
  }

  /**
   * Use key
   */
  useKey(): boolean {
    if (this.state.inventory.keys > 0) {
      this.state.inventory.keys--;
      return true;
    }
    return false;
  }

  /**
   * Toggle pause
   */
  togglePause(): void {
    this.state.paused = !this.state.paused;
  }

  /**
   * Set pause state
   */
  setPaused(paused: boolean): void {
    this.state.paused = paused;
  }

  /**
   * Check if game is paused
   */
  isPaused(): boolean {
    return this.state.paused;
  }

  /**
   * Determine current level color based on room and boundaries
   */
  updateLevelColor(boundaries: LevelBoundaries): void {
    const roomId = this.state.currentRoom;
    
    if (roomId <= boundaries.blackLevelEnd) {
      this.state.currentLevel = 'BLACK';
    } else if (roomId <= boundaries.blueLevelEnd) {
      this.state.currentLevel = 'BLUE';
    } else if (roomId <= boundaries.greenLevelEnd) {
      this.state.currentLevel = 'GREEN';
    } else {
      this.state.currentLevel = 'RED';
    }
  }

  /**
   * Get tournament progress description
   */
  getTournamentProgress(): string {
    if (!this.state.tournament.active) {
      return '';
    }
    
    const { currentMazeIndex, mazeSequence, mazesCompleted } = this.state.tournament;
    const current = mazeSequence[currentMazeIndex];
    const total = mazeSequence.length;
    const position = currentMazeIndex + 1;
    
    if (mazesCompleted > 0) {
      return `Tournament Loop ${mazesCompleted + 1}: ${position}/${total}`;
    }
    return `Tournament: ${position}/${total}`;
  }

  /**
   * Reset game state for new game
   */
  reset(mazeType: MazeType = MazeType.ORIGINAL_ATARI): void {
    this.state = this.createInitialState(this.state.difficulty);
    this.setMaze(mazeType);
  }

  /**
   * Serialize state for save/load
   */
  serialize(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Deserialize state
   */
  deserialize(data: string): void {
    this.state = JSON.parse(data);
  }
}

export default GameState;
