/**
 * UI Manager for Shamus+
 * Implements [OPTION] maze selector and [SPACE] pause function
 * Based on PDF pages 10-11, 20, 550-565
 */
import { MazeType, GameState as IGameState } from '../types';
/**
 * UI configuration
 */
interface UIConfig {
    containerSelector: string;
    canvasSelector: string;
    atariFont: string;
    textColor: string;
    highlightColor: string;
    backgroundColor: string;
}
/**
 * Callback types
 */
type MazeSelectCallback = (maze: MazeType) => void;
type PauseCallback = (paused: boolean) => void;
type InputCallback = (key: string) => void;
/**
 * UI Manager
 * Handles all user interface overlays and input
 */
export declare class UIManager {
    private config;
    private container;
    private canvas;
    private ctx;
    private mazeSelectorOpen;
    private selectedMazeIndex;
    private paused;
    private showHUD;
    private onMazeSelect;
    private onPause;
    private onInput;
    private availableMazes;
    constructor(config?: Partial<UIConfig>);
    /**
     * Initialize UI manager
     */
    init(onMazeSelect: MazeSelectCallback, onPause: PauseCallback, onInput?: InputCallback): void;
    /**
     * Setup keyboard event listeners
     */
    private setupKeyboardListeners;
    /**
     * Handle maze selector navigation
     */
    private handleMazeSelectorInput;
    /**
     * Toggle maze selector visibility
     */
    toggleMazeSelector(): void;
    /**
     * Open maze selector
     */
    openMazeSelector(): void;
    /**
     * Close maze selector
     */
    closeMazeSelector(): void;
    /**
     * Select a maze
     */
    selectMaze(maze: MazeType): void;
    /**
     * Toggle pause state
     */
    togglePause(): void;
    /**
     * Set pause state
     */
    setPaused(paused: boolean): void;
    /**
     * Check if game is paused
     */
    isPaused(): boolean;
    /**
     * Render UI overlay
     */
    render(gameState: IGameState): void;
    /**
     * Render HUD (Heads-Up Display)
     */
    private renderHUD;
    /**
     * Render maze selector overlay
     */
    private renderMazeSelector;
    /**
     * Render pause screen
     */
    private renderPauseScreen;
    /**
     * Get hex color for level
     */
    private getLevelColorHex;
    /**
     * Get tournament progress string
     */
    private getTournamentProgress;
    /**
     * Set available mazes for selector
     */
    setAvailableMazes(mazes: MazeType[]): void;
    /**
     * Set currently selected maze
     */
    setSelectedMaze(maze: MazeType): void;
    /**
     * Show/hide HUD
     */
    toggleHUD(show: boolean): void;
    /**
     * Update configuration
     */
    setConfig(config: Partial<UIConfig>): void;
    /**
     * Clean up event listeners
     */
    destroy(): void;
}
export default UIManager;
//# sourceMappingURL=UIManager.d.ts.map