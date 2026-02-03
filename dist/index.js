/**
 * Shamus+ Web Application Entry Point
 * High-fidelity port of Atari 8-bit classic with C64 mazes
 */
import BinaryParser from './parser/BinaryParser';
import GameState from './state/GameState';
import { MazeType, MAZE_NAMES } from './types';
/**
 * Main Shamus+ Game Class
 */
export class ShamusPlus {
    constructor() {
        this.mazes = new Map();
        this.parser = new BinaryParser();
        this.gameState = new GameState('NOVICE');
    }
    /**
     * Load maze data from binary file
     */
    async loadMazes(url) {
        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const data = new Uint8Array(buffer);
            const parsedMazes = this.parser.parseFullMap(data);
            parsedMazes.forEach((parsed, index) => {
                this.mazes.set(index, parsed.maze);
                console.log(`Loaded maze: ${parsed.maze.name}`);
                console.log(`  Rooms: ${parsed.stats.totalRooms}`);
                console.log(`  Corridors: ${parsed.stats.corridorCount}`);
                console.log(`  Pod Rooms: ${parsed.stats.podRoomCount}`);
                console.log(`  Objects: ${parsed.stats.objectCount}`);
            });
        }
        catch (error) {
            console.error('Failed to load mazes:', error);
        }
    }
    /**
     * Start a new game
     */
    startGame(mazeType = MazeType.ORIGINAL_ATARI) {
        this.gameState.reset(mazeType);
        console.log(`Starting game on ${MAZE_NAMES[mazeType]}`);
    }
    /**
     * Get current game state
     */
    getState() {
        return this.gameState.getState();
    }
    /**
     * Export parser for testing
     */
    getParser() {
        return this.parser;
    }
    /**
     * Export game state for testing
     */
    getGameState() {
        return this.gameState;
    }
}
// Export all modules
export { BinaryParser, GameState };
export { AtariRenderer } from './render/AtariRenderer';
export { AtariGlow } from './render/AtariGlow';
export { AudioSystem } from './audio/AudioSystem';
export { UIManager } from './ui/UIManager';
export * from './types';
// Default export
export default ShamusPlus;
// Initialize if running in browser
if (typeof window !== 'undefined') {
    window.ShamusPlus = ShamusPlus;
}
//# sourceMappingURL=index.js.map