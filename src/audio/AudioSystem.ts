/**
 * Audio System for Shamus+
 * Implements Atari "ping" for enemy shots and C64 silent mode
 * Based on PDF page 1016-1017: "Enemy shots have a ("ping") sound on the Atari but are silent on the C64"
 */

import { MazeType, AudioConfig } from '../types';

/**
 * Sound effect definitions
 */
export type SoundEffect = 
  | 'atari-ping'      // Enemy shot - Atari specific
  | 'ion-shiv-fire'   // Player fires ION-SHIV
  | 'enemy-death'     // Enemy destroyed
  | 'item-collect'    // Collect key/potion
  | 'warning'         // Shadow approaching
  | 'background-hum'; // Ambient Atari sound

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
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private config: AudioSettings;
  private currentMazeType: MazeType = MazeType.ORIGINAL_ATARI;
  private humOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  constructor() {
    this.config = {
      masterVolume: 0.5,
      atariPingEnabled: true,
      backgroundHumEnabled: true,
      warningEnabled: true,
      c64SilentMode: false
    };
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Set current maze type to determine audio behavior
   * C64 mazes are silent for enemy shots
   */
  setMazeType(mazeType: MazeType): void {
    this.currentMazeType = mazeType;
    this.config.c64SilentMode = this.isC64Maze(mazeType);
    
    // Adjust background hum based on maze type
    if (this.config.backgroundHumEnabled) {
      if (this.config.c64SilentMode) {
        this.stopBackgroundHum();
      } else {
        this.startBackgroundHum();
      }
    }
  }

  /**
   * Check if current maze is a C64 maze (silent enemy shots)
   */
  private isC64Maze(mazeType: MazeType): boolean {
    return [
      MazeType.ORIGINAL_C64,
      MazeType.HOLMES,
      MazeType.CLUSEAU,
      MazeType.MARLOWE,
      MazeType.BOND
    ].includes(mazeType);
  }

  /**
   * Play Atari "ping" sound for enemy shots
   * From PDF: "Enemy shots have a ("ping") sound on the Atari but are silent on the C64"
   */
  playAtariPing(): void {
    if (!this.ctx || !this.config.atariPingEnabled) return;
    
    // C64 mazes: enemy shots are silent
    if (this.config.c64SilentMode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Ping sound: high frequency square wave with quick decay
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.config.masterVolume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  /**
   * Play ION-SHIV fire sound
   */
  playIonShivFire(): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // ION-SHIV: lower frequency with more body
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.config.masterVolume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Play enemy death sound
   */
  playEnemyDeath(): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(this.config.masterVolume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Play item collection sound
   */
  playItemCollect(): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pleasant chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(this.config.masterVolume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Play warning sound before Shadow appears
   * From PDF: "a ?warning? sound a short time before the Shamus actually approaches"
   */
  playWarning(): void {
    if (!this.ctx || !this.config.warningEnabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Warning: alternating high pitch
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    
    // Create alternating pattern
    for (let i = 0; i < 4; i++) {
      const time = this.ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.setValueAtTime(600, time + 0.075);
    }

    gain.gain.setValueAtTime(this.config.masterVolume * 0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.6);
  }

  /**
   * Start background hum (Atari only)
   * From PDF: "The Atari version plays some background sound during gameplay"
   */
  startBackgroundHum(): void {
    if (!this.ctx || !this.config.backgroundHumEnabled || this.config.c64SilentMode) return;

    // Stop existing hum
    this.stopBackgroundHum();

    // Create low-frequency hum
    this.humOscillator = this.ctx.createOscillator();
    this.humGain = this.ctx.createGain();

    this.humOscillator.type = 'sine';
    this.humOscillator.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.humGain.gain.setValueAtTime(this.config.masterVolume * 0.05, this.ctx.currentTime);

    this.humOscillator.connect(this.humGain);
    this.humGain.connect(this.ctx.destination);

    this.humOscillator.start();
  }

  /**
   * Stop background hum
   */
  stopBackgroundHum(): void {
    if (this.humOscillator) {
      this.humOscillator.stop();
      this.humOscillator.disconnect();
      this.humOscillator = null;
    }
    if (this.humGain) {
      this.humGain.disconnect();
      this.humGain = null;
    }
  }

  /**
   * Play sound by name
   */
  play(sound: SoundEffect): void {
    switch (sound) {
      case 'atari-ping':
        this.playAtariPing();
        break;
      case 'ion-shiv-fire':
        this.playIonShivFire();
        break;
      case 'enemy-death':
        this.playEnemyDeath();
        break;
      case 'item-collect':
        this.playItemCollect();
        break;
      case 'warning':
        this.playWarning();
        break;
      case 'background-hum':
        this.startBackgroundHum();
        break;
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.stopBackgroundHum();
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean): void {
    if (muted) {
      this.config.masterVolume = 0;
      this.stopAll();
    } else {
      this.config.masterVolume = 0.5;
    }
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle Atari ping for enemy shots
   */
  toggleAtariPing(enabled: boolean): void {
    this.config.atariPingEnabled = enabled;
  }

  /**
   * Toggle background hum
   */
  toggleBackgroundHum(enabled: boolean): void {
    this.config.backgroundHumEnabled = enabled;
    if (enabled && !this.config.c64SilentMode) {
      this.startBackgroundHum();
    } else {
      this.stopBackgroundHum();
    }
  }

  /**
   * Check if audio is currently in C64 silent mode
   */
  isC64SilentMode(): boolean {
    return this.config.c64SilentMode;
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioSettings {
    return { ...this.config };
  }

  /**
   * Resume audio context (for browsers that suspend it)
   */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Suspend audio context
   */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }
}

export default AudioSystem;
