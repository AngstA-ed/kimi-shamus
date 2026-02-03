/**
 * Atari Glow Effect Manager
 * Handles pulsating wall luma, color register shifts, and phosphor glow
 * Replicates the authentic "Atari Aesthetic" from CRT displays
 */
/**
 * Default glow configuration
 */
export const DEFAULT_GLOW_CONFIG = {
    enabled: true,
    intensity: 0.5,
    pulsateSpeed: 0.05,
    pulsateAmount: 0.3,
    blurAmount: 4,
    brightnessBoost: 0.3,
    colorShift: true
};
/**
 * Color shift values for Atari color registers
 * Simulates the hardware color cycling effect
 */
const COLOR_SHIFTS = [
    { r: 0, g: 0, b: 0 },
    { r: 10, g: 0, b: 0 },
    { r: 20, g: 5, b: 0 },
    { r: 10, g: 10, b: 0 },
    { r: 0, g: 15, b: 5 },
    { r: 0, g: 10, b: 10 },
    { r: 5, g: 0, b: 15 },
    { r: 15, g: 0, b: 10 }
];
/**
 * Atari Glow Effect Manager
 */
export class AtariGlow {
    constructor(config = {}) {
        this.phase = 0;
        this.colorShiftIndex = 0;
        this.canvas = null;
        this.ctx = null;
        this.config = { ...DEFAULT_GLOW_CONFIG, ...config };
    }
    /**
     * Set up glow effect on a canvas
     */
    attach(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            this.ctx = ctx;
        }
    }
    /**
     * Update glow animation state
     * Call this each frame
     */
    update() {
        if (!this.config.enabled)
            return;
        // Update pulsation phase
        this.phase += this.config.pulsateSpeed;
        if (this.phase > Math.PI * 2) {
            this.phase = 0;
        }
        // Update color shift
        if (this.config.colorShift) {
            this.colorShiftIndex = Math.floor(this.phase / (Math.PI * 2) * COLOR_SHIFTS.length);
        }
    }
    /**
     * Get current glow intensity with pulsation applied
     */
    getCurrentIntensity() {
        if (!this.config.enabled)
            return 0;
        const pulse = Math.sin(this.phase) * this.config.pulsateAmount;
        return this.config.intensity * (1 + pulse);
    }
    /**
     * Get current color shift offset
     */
    getColorShift() {
        if (!this.config.colorShift)
            return { r: 0, g: 0, b: 0 };
        return COLOR_SHIFTS[this.colorShiftIndex % COLOR_SHIFTS.length];
    }
    /**
     * Apply glow effect to a canvas context
     * This should be called before rendering walls
     */
    preRender(ctx) {
        if (!this.config.enabled)
            return;
        const intensity = this.getCurrentIntensity();
        // Set up glow filter
        const blur = this.config.blurAmount * intensity;
        const brightness = 1 + (this.config.brightnessBoost * intensity);
        ctx.filter = `blur(${blur}px) brightness(${brightness})`;
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity;
    }
    /**
     * Reset canvas context after glow rendering
     */
    postRender(ctx) {
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }
    /**
     * Render a glow layer for walls
     * This creates the characteristic Atari wall glow
     */
    renderWallGlow(ctx, x, y, width, height, baseColor) {
        if (!this.config.enabled)
            return;
        const intensity = this.getCurrentIntensity();
        const colorShift = this.getColorShift();
        // Parse base color and apply shift
        const glowColor = this.shiftColor(baseColor, colorShift);
        ctx.save();
        // Draw glow halo
        const gradient = ctx.createRadialGradient(x + width / 2, y + height / 2, 0, x + width / 2, y + height / 2, Math.max(width, height) * 2 * intensity);
        gradient.addColorStop(0, glowColor + '80'); // 50% opacity
        gradient.addColorStop(0.5, glowColor + '40'); // 25% opacity
        gradient.addColorStop(1, glowColor + '00'); // 0% opacity
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(x - Math.max(width, height), y - Math.max(width, height), width * 3, height * 3);
        ctx.restore();
    }
    /**
     * Shift a hex color by RGB offset
     */
    shiftColor(hex, shift) {
        // Parse hex color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Apply shift
        const newR = Math.min(255, Math.max(0, r + shift.r));
        const newG = Math.min(255, Math.max(0, g + shift.g));
        const newB = Math.min(255, Math.max(0, b + shift.b));
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    /**
     * Create a phosphor trail effect
     * Simulates CRT phosphor persistence
     */
    renderPhosphorTrail(ctx, x, y, width, height, age // 0-1, how old the trail is
    ) {
        const alpha = (1 - age) * 0.3;
        ctx.save();
        ctx.fillStyle = `rgba(100, 255, 100, ${alpha})`;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }
    /**
     * Create color cycling effect (Atari color register shift)
     * This simulates the hardware color cycling used for animations
     */
    getCycledColor(baseHue, cycle) {
        // Shift hue by cycle amount
        const shiftedHue = (baseHue + cycle) % 360;
        return `hsl(${shiftedHue}, 100%, 50%)`;
    }
    /**
     * Update configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Enable/disable glow effect
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
    /**
     * Check if glow is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    /**
     * Set glow intensity (0-1)
     */
    setIntensity(intensity) {
        this.config.intensity = Math.max(0, Math.min(1, intensity));
    }
    /**
     * Set pulsation speed
     */
    setPulsateSpeed(speed) {
        this.config.pulsateSpeed = speed;
    }
    /**
     * Reset animation phase
     */
    reset() {
        this.phase = 0;
        this.colorShiftIndex = 0;
    }
    /**
     * Get current animation phase (0-2π)
     */
    getPhase() {
        return this.phase;
    }
}
export default AtariGlow;
//# sourceMappingURL=AtariGlow.js.map