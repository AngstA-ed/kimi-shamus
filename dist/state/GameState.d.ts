/**
 * Game State Management
 * Implements tournament mode (ADVANCETNMT) and speed control ($0206 patch)
 */
import { GameState as IGameState, MazeType, Difficulty, LevelColor, LevelBoundaries } from '../types';
/**
 * Game State Manager
 * Mirrors 6502 memory layout from Shamuspl.asm:
 * - $0206: shamusSpeed (delay loop counter)
 * - $0202: lives counter
 * - $208, $235: current room
 */
export declare class GameState {
    private state;
    constructor(difficulty?: Difficulty);
    /**
     * Create initial game state
     */
    private createInitialState;
    /**
     * Get base speed for difficulty level
     * Based on $0206 initialization in original game
     */
    private getBaseSpeedForDifficulty;
    /**
     * Get current state (immutable copy)
     */
    getState(): Readonly<IGameState>;
    /**
     * Set current maze
     */
    setMaze(mazeType: MazeType): void;
    /**
     * Advance to next room
     */
    moveToRoom(roomId: number): void;
    /**
     * Mark current room as cleared
     * Triggers Shamus speed increase (Atari-specific behavior)
     */
    clearRoom(): void;
    /**
     * Increase speed after clearing room
     * Atari-specific: Shamus walks faster after clearing enemies
     * Decreases $0206 delay counter
     */
    private increaseSpeedAfterClear;
    /**
     * Update speed when changing levels
     * Based on $0206 register logic from Shamuspl.asm
     */
    updateSpeedForLevel(level: LevelColor, direction: 'up' | 'down'): void;
    /**
     * Apply delay loop with slx patch
     * Original bug: negative speed values cause 65535 iterations
     * slx fix: ignore negative values, execute only one iteration
     *
     * From Shamuspl.asm lines 146-159:
     * "patch main game delay loop to ignore negative speed numbers"
     */
    applySpeedDelay(): void;
    /**
     * Single delay iteration (from $2F98)
     * Counts Y register from $FF to $00
     */
    private executeDelayIteration;
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
    advanceTournament(): boolean;
    /**
     * Check if current maze is a C64 maze (affects audio)
     */
    isC64Maze(): boolean;
    /**
     * Add score
     */
    addScore(points: number): void;
    /**
     * Add life
     */
    addLife(): void;
    /**
     * Lose life
     */
    loseLife(): boolean;
    /**
     * Add key to inventory
     */
    addKey(): void;
    /**
     * Use key
     */
    useKey(): boolean;
    /**
     * Toggle pause
     */
    togglePause(): void;
    /**
     * Determine current level color based on room and boundaries
     */
    updateLevelColor(boundaries: LevelBoundaries): void;
    /**
     * Get tournament progress description
     */
    getTournamentProgress(): string;
    /**
     * Reset game state for new game
     */
    reset(mazeType?: MazeType): void;
    /**
     * Serialize state for save/load
     */
    serialize(): string;
    /**
     * Deserialize state
     */
    deserialize(data: string): void;
}
export default GameState;
//# sourceMappingURL=GameState.d.ts.map