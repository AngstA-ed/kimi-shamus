/**
 * Audio System for Shamus+
 * Implements Atari "ping" for enemy shots and C64 silent mode
 * Based on PDF page 1016-1017: "Enemy shots have a ("ping") sound on the Atari but are silent on the C64"
 */
import { MazeType } from '../types';
/**
 * Sound effect definitions
 */
export type SoundEffect = 'atari-ping' | 'ion-shiv-fire' | 'enemy-death' | 'item-collect' | 'warning' | 'background-hum';
/**
 * Audio configuration
 */
interface AudioSettings {
    masterVolume: number;
    atariPingEnabled: boolean;
    backgroundHumEnabled: boolean;
    warningEnabled: boolean;
    c64SilentMode: boolean;
}
/**
 * Audio System
 * Manages all game audio with platform-specific behaviors
 */
export declare class AudioSystem {
    private ctx;
    private config;
    private currentMazeType;
    private humOscillator;
    private humGain;
    constructor();
    /**
     * Initialize audio context (must be called after user interaction)
     */
    init(): void;
    /**
     * Set current maze type to determine audio behavior
     * C64 mazes are silent for enemy shots
     */
    setMazeType(mazeType: MazeType): void;
    /**
     * Check if current maze is a C64 maze (silent enemy shots)
     */
    private isC64Maze;
    /**
     * Play Atari "ping" sound for enemy shots
     * From PDF: "Enemy shots have a ("ping") sound on the Atari but are silent on the C64"
     */
    playAtariPing(): void;
    /**
     * Play ION-SHIV fire sound
     */
    playIonShivFire(): void;
    /**
     * Play enemy death sound
     */
    playEnemyDeath(): void;
    /**
     * Play item collection sound
     */
    playItemCollect(): void;
    /**
     * Play warning sound before Shadow appears
     * From PDF: "a ?warning? sound a short time before the Shamus actually approaches"
     */
    playWarning(): void;
    /**
     * Start background hum (Atari only)
     * From PDF: "The Atari version plays some background sound during gameplay"
     */
    startBackgroundHum(): void;
    /**
     * Stop background hum
     */
    stopBackgroundHum(): void;
    /**
     * Play sound by name
     */
    play(sound: SoundEffect): void;
    /**
     * Stop all sounds
     */
    stopAll(): void;
    /**
     * Mute/unmute all audio
     */
    setMuted(muted: boolean): void;
    /**
     * Set master volume (0-1)
     */
    setVolume(volume: number): void;
    /**
     * Toggle Atari ping for enemy shots
     */
    toggleAtariPing(enabled: boolean): void;
    /**
     * Toggle background hum
     */
    toggleBackgroundHum(enabled: boolean): void;
    /**
     * Check if audio is currently in C64 silent mode
     */
    isC64SilentMode(): boolean;
    /**
     * Get current configuration
     */
    getConfig(): AudioSettings;
    /**
     * Resume audio context (for browsers that suspend it)
     */
    resume(): void;
    /**
     * Suspend audio context
     */
    suspend(): void;
}
export default AudioSystem;
//# sourceMappingURL=AudioSystem.d.ts.map