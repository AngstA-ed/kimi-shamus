/**
 * Atari Renderer with Glow Effects
 * Replicates the "Atari Aesthetic" - pulsating walls, color registers, CRT effects
 */
import { Room, LevelColor, MazeType } from '../types';
/**
 * Atari Renderer
 * Handles all rendering with authentic Atari 8-bit aesthetics
 */
export declare class AtariRenderer {
    private canvas;
    private ctx;
    private glowIntensity;
    private pulsatePhase;
    private scanlinesEnabled;
    private glowEnabled;
    private readonly ROOM_WIDTH;
    private readonly ROOM_HEIGHT;
    private readonly WALL_THICKNESS;
    private readonly GRID_SIZE;
    private readonly GRID_OFFSET_X;
    private readonly GRID_OFFSET_Y;
    constructor(canvas: HTMLCanvasElement);
    /**
     * Render a complete room
     */
    renderRoom(room: Room, levelColor: LevelColor, mazeType: MazeType): void;
    /**
     * Clear canvas with background color
     */
    private clear;
    /**
     * Apply Atari Glow effect
     * Creates pulsating wall luma and color shifts
     */
    private applyAtariGlow;
    /**
     * Update glow pulsation phase
     */
    private updateGlow;
    /**
     * Render a standard chamber room
     */
    private renderChamber;
    /**
     * Render a corridor room
     */
    private renderCorridor;
    /**
     * Render a pod room with barriers
     */
    private renderPodRoom;
    /**
     * Draw a horizontal wall segment
     */
    private drawHorizontalWall;
    /**
     * Draw a vertical wall segment
     */
    private drawVerticalWall;
    /**
     * Draw dead end corridor
     */
    private drawDeadEnd;
    /**
     * Draw angled corridor
     */
    private drawAngledCorridor;
    /**
     * Draw T-junction corridor
     */
    private drawTJunection;
    /**
     * Render room exits
     */
    private renderExits;
    /**
     * Render an object in the room
     */
    private renderObject;
    /**
     * Apply CRT scanline effect
     */
    private applyScanlines;
    /**
     * Render player (Shamus)
     */
    renderPlayer(x: number, y: number, facing: 'left' | 'right'): void;
    /**
     * Render enemy
     */
    renderEnemy(enemy: {
        type: string;
        x: number;
        y: number;
    }): void;
    /**
     * Set glow intensity (0-1)
     */
    setGlowIntensity(intensity: number): void;
    /**
     * Toggle scanlines
     */
    toggleScanlines(enabled: boolean): void;
    /**
     * Toggle Atari Glow effect
     */
    toggleGlow(enabled: boolean): void;
    /**
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement;
}
export default AtariRenderer;
//# sourceMappingURL=AtariRenderer.d.ts.map