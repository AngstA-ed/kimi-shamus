/**
 * UI Manager for Shamus+
 * Implements [OPTION] maze selector and [SPACE] pause function
 * Based on PDF pages 10-11, 20, 550-565
 */
import { MazeType, MAZE_NAMES } from '../types';
/**
 * Default UI configuration
 */
const DEFAULT_CONFIG = {
    containerSelector: '#game-container',
    canvasSelector: '#game-canvas',
    atariFont: '"Atari Classic", "Courier New", monospace',
    textColor: '#ffffff',
    highlightColor: '#00ff00',
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
};
/**
 * UI Manager
 * Handles all user interface overlays and input
 */
export class UIManager {
    constructor(config = {}) {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        // UI State
        this.mazeSelectorOpen = false;
        this.selectedMazeIndex = 0;
        this.paused = false;
        this.showHUD = true;
        // Callbacks
        this.onMazeSelect = null;
        this.onPause = null;
        this.onInput = null;
        // Available mazes for selection
        this.availableMazes = [
            MazeType.ORIGINAL_ATARI,
            MazeType.ORIGINAL_C64,
            MazeType.HOLMES,
            MazeType.CLUSEAU,
            MazeType.MARLOWE,
            MazeType.BOND,
            MazeType.TOURNAMENT
        ];
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Initialize UI manager
     */
    init(onMazeSelect, onPause, onInput) {
        this.onMazeSelect = onMazeSelect;
        this.onPause = onPause;
        if (onInput)
            this.onInput = onInput;
        // Get container and canvas
        this.container = document.querySelector(this.config.containerSelector);
        this.canvas = document.querySelector(this.config.canvasSelector);
        if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            if (ctx)
                this.ctx = ctx;
        }
        // Setup keyboard listeners
        this.setupKeyboardListeners();
    }
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // OPTION key - maze selector
            if (e.key === 'F12' || e.key === 'o' || e.key === 'O') {
                e.preventDefault();
                this.toggleMazeSelector();
            }
            // SPACE - pause
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            }
            // Maze selector navigation
            if (this.mazeSelectorOpen) {
                this.handleMazeSelectorInput(e.key);
            }
            // Callback for other inputs
            if (this.onInput) {
                this.onInput(e.key);
            }
        });
    }
    /**
     * Handle maze selector navigation
     */
    handleMazeSelectorInput(key) {
        switch (key) {
            case 'ArrowUp':
                this.selectedMazeIndex = Math.max(0, this.selectedMazeIndex - 1);
                break;
            case 'ArrowDown':
                this.selectedMazeIndex = Math.min(this.availableMazes.length - 1, this.selectedMazeIndex + 1);
                break;
            case 'Enter':
            case ' ':
                this.selectMaze(this.availableMazes[this.selectedMazeIndex]);
                break;
            case 'Escape':
                this.closeMazeSelector();
                break;
        }
    }
    /**
     * Toggle maze selector visibility
     */
    toggleMazeSelector() {
        this.mazeSelectorOpen = !this.mazeSelectorOpen;
        if (this.mazeSelectorOpen) {
            this.paused = true; // Pause game while selecting
        }
    }
    /**
     * Open maze selector
     */
    openMazeSelector() {
        this.mazeSelectorOpen = true;
        this.paused = true;
    }
    /**
     * Close maze selector
     */
    closeMazeSelector() {
        this.mazeSelectorOpen = false;
        this.paused = false;
    }
    /**
     * Select a maze
     */
    selectMaze(maze) {
        if (this.onMazeSelect) {
            this.onMazeSelect(maze);
        }
        this.closeMazeSelector();
    }
    /**
     * Toggle pause state
     */
    togglePause() {
        // Don't toggle if maze selector is open
        if (this.mazeSelectorOpen)
            return;
        this.paused = !this.paused;
        if (this.onPause) {
            this.onPause(this.paused);
        }
    }
    /**
     * Set pause state
     */
    setPaused(paused) {
        this.paused = paused;
        if (this.onPause) {
            this.onPause(this.paused);
        }
    }
    /**
     * Check if game is paused
     */
    isPaused() {
        return this.paused || this.mazeSelectorOpen;
    }
    /**
     * Render UI overlay
     */
    render(gameState) {
        if (!this.ctx || !this.canvas)
            return;
        // Render HUD (always visible during gameplay)
        if (this.showHUD && !this.mazeSelectorOpen) {
            this.renderHUD(gameState);
        }
        // Render maze selector
        if (this.mazeSelectorOpen) {
            this.renderMazeSelector();
        }
        // Render pause screen
        if (this.paused && !this.mazeSelectorOpen) {
            this.renderPauseScreen();
        }
    }
    /**
     * Render HUD (Heads-Up Display)
     */
    renderHUD(gameState) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.save();
        ctx.font = `12px ${this.config.atariFont}`;
        ctx.fillStyle = this.config.textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        // Score (top left)
        ctx.fillText(`SCORE: ${gameState.score.toString().padStart(6, '0')}`, 10, 5);
        // Lives (top center-left)
        ctx.fillText(`LIVES: ${gameState.lives}`, 100, 5);
        // Current level (top center-right)
        const levelColor = gameState.currentLevel;
        ctx.fillStyle = this.getLevelColorHex(levelColor);
        ctx.fillText(`LEVEL: ${levelColor}`, 180, 5);
        ctx.fillStyle = this.config.textColor;
        // Current maze name (top right)
        ctx.textAlign = 'right';
        const mazeName = MAZE_NAMES[gameState.currentMaze];
        ctx.fillText(`MAP: ${mazeName}`, canvas.width - 10, 5);
        // Tournament progress (if active)
        if (gameState.tournament.active) {
            ctx.textAlign = 'left';
            const progress = this.getTournamentProgress(gameState);
            ctx.fillStyle = this.config.highlightColor;
            ctx.fillText(progress, 10, 20);
        }
        // Keys indicator
        if (gameState.inventory.keys > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText(`KEYS: ${gameState.inventory.keys}`, 100, 20);
        }
        // ION-SHIV indicator
        if (gameState.inventory.hasIonShiv) {
            ctx.fillStyle = '#00ffff';
            ctx.fillText('ION', 160, 20);
        }
        ctx.restore();
    }
    /**
     * Render maze selector overlay
     */
    renderMazeSelector() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.save();
        // Semi-transparent background
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Title
        ctx.font = `16px ${this.config.atariFont}`;
        ctx.fillStyle = this.config.highlightColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SELECT MAZE', canvas.width / 2, 40);
        // Maze list
        ctx.font = `14px ${this.config.atariFont}`;
        const startY = 70;
        const lineHeight = 25;
        this.availableMazes.forEach((maze, index) => {
            const y = startY + index * lineHeight;
            const isSelected = index === this.selectedMazeIndex;
            // Highlight selected maze
            if (isSelected) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(canvas.width / 2 - 100, y - 5, 200, lineHeight - 2);
                ctx.fillStyle = this.config.highlightColor;
            }
            else {
                ctx.fillStyle = this.config.textColor;
            }
            // Maze name
            const name = MAZE_NAMES[maze];
            ctx.fillText(name, canvas.width / 2, y);
        });
        // Instructions
        ctx.font = `10px ${this.config.atariFont}`;
        ctx.fillStyle = '#888888';
        ctx.fillText('UP/DOWN: Navigate  ENTER: Select  ESC: Cancel', canvas.width / 2, canvas.height - 30);
        ctx.restore();
    }
    /**
     * Render pause screen
     */
    renderPauseScreen() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.save();
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // PAUSED text
        ctx.font = `bold 20px ${this.config.atariFont}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 10);
        // Resume instruction
        ctx.font = `12px ${this.config.atariFont}`;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('PRESS SPACE TO RESUME', canvas.width / 2, canvas.height / 2 + 15);
        ctx.restore();
    }
    /**
     * Get hex color for level
     */
    getLevelColorHex(level) {
        switch (level) {
            case 'BLACK': return '#ffffff';
            case 'BLUE': return '#4444ff';
            case 'GREEN': return '#44ff44';
            case 'RED': return '#ff4444';
            default: return '#ffffff';
        }
    }
    /**
     * Get tournament progress string
     */
    getTournamentProgress(gameState) {
        const { tournament } = gameState;
        const current = tournament.currentMazeIndex + 1;
        const total = tournament.mazeSequence.length;
        if (tournament.mazesCompleted > 0) {
            return `TOURNAMENT LOOP ${tournament.mazesCompleted + 1}: ${current}/${total}`;
        }
        return `TOURNAMENT: ${current}/${total}`;
    }
    /**
     * Set available mazes for selector
     */
    setAvailableMazes(mazes) {
        this.availableMazes = mazes;
        this.selectedMazeIndex = 0;
    }
    /**
     * Set currently selected maze
     */
    setSelectedMaze(maze) {
        const index = this.availableMazes.indexOf(maze);
        if (index >= 0) {
            this.selectedMazeIndex = index;
        }
    }
    /**
     * Show/hide HUD
     */
    toggleHUD(show) {
        this.showHUD = show;
    }
    /**
     * Update configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Clean up event listeners
     */
    destroy() {
        // Remove event listeners if needed
    }
}
export default UIManager;
//# sourceMappingURL=UIManager.js.map