/**
 * Shamus+ Web Application Entry Point
 * High-fidelity port of Atari 8-bit classic with C64 mazes
 */
import BinaryParser from './parser/BinaryParser';
import GameState from './state/GameState';
import { MazeType } from './types';
/**
 * Main Shamus+ Game Class
 */
export declare class ShamusPlus {
    private parser;
    private gameState;
    private mazes;
    constructor();
    /**
     * Load maze data from binary file
     */
    loadMazes(url: string): Promise<void>;
    /**
     * Start a new game
     */
    startGame(mazeType?: MazeType): void;
    /**
     * Get current game state
     */
    getState(): Readonly<import("./types").GameState>;
    /**
     * Export parser for testing
     */
    getParser(): BinaryParser;
    /**
     * Export game state for testing
     */
    getGameState(): GameState;
}
export { BinaryParser, GameState };
export { AtariRenderer } from './render/AtariRenderer';
export { AtariGlow } from './render/AtariGlow';
export { AudioSystem } from './audio/AudioSystem';
export { UIManager } from './ui/UIManager';
export * from './types';
export default ShamusPlus;
//# sourceMappingURL=index.d.ts.map