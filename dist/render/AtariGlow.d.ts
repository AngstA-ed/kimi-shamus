/**
 * Atari Glow Effect Manager
 * Handles pulsating wall luma, color register shifts, and phosphor glow
 * Replicates the authentic "Atari Aesthetic" from CRT displays
 */
/**
 * Glow effect configuration
 */
export interface GlowConfig {
    enabled: boolean;
    intensity: number;
    pulsateSpeed: number;
    pulsateAmount: number;
    blurAmount: number;
    brightnessBoost: number;
    colorShift: boolean;
}
/**
 * Default glow configuration
 */
export declare const DEFAULT_GLOW_CONFIG: GlowConfig;
/**
 * Atari Glow Effect Manager
 */
export declare class AtariGlow {
    private config;
    private phase;
    private colorShiftIndex;
    private canvas;
    private ctx;
    constructor(config?: Partial<GlowConfig>);
    /**
     * Set up glow effect on a canvas
     */
    attach(canvas: HTMLCanvasElement): void;
    /**
     * Update glow animation state
     * Call this each frame
     */
    update(): void;
    /**
     * Get current glow intensity with pulsation applied
     */
    getCurrentIntensity(): number;
    /**
     * Get current color shift offset
     */
    getColorShift(): {
        r: number;
        g: number;
        b: number;
    };
    /**
     * Apply glow effect to a canvas context
     * This should be called before rendering walls
     */
    preRender(ctx: CanvasRenderingContext2D): void;
    /**
     * Reset canvas context after glow rendering
     */
    postRender(ctx: CanvasRenderingContext2D): void;
    /**
     * Render a glow layer for walls
     * This creates the characteristic Atari wall glow
     */
    renderWallGlow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, baseColor: string): void;
    /**
     * Shift a hex color by RGB offset
     */
    private shiftColor;
    /**
     * Create a phosphor trail effect
     * Simulates CRT phosphor persistence
     */
    renderPhosphorTrail(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, age: number): void;
    /**
     * Create color cycling effect (Atari color register shift)
     * This simulates the hardware color cycling used for animations
     */
    getCycledColor(baseHue: number, cycle: number): string;
    /**
     * Update configuration
     */
    setConfig(config: Partial<GlowConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): GlowConfig;
    /**
     * Enable/disable glow effect
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if glow is enabled
     */
    isEnabled(): boolean;
    /**
     * Set glow intensity (0-1)
     */
    setIntensity(intensity: number): void;
    /**
     * Set pulsation speed
     */
    setPulsateSpeed(speed: number): void;
    /**
     * Reset animation phase
     */
    reset(): void;
    /**
     * Get current animation phase (0-2π)
     */
    getPhase(): number;
}
export default AtariGlow;
//# sourceMappingURL=AtariGlow.d.ts.map