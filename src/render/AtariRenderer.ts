/**
 * Atari Renderer with Glow Effects
 * Replicates the "Atari Aesthetic" - pulsating walls, color registers, CRT effects
 */

import { Room, WallTile, CorridorType, LevelColor, MazeType, ObjectType, RoomObject } from '../types';

/**
 * Color palette for Atari 8-bit (hue + luma)
 * Based on Atari GTIA color palette
 */
const ATARI_COLORS: Record<number, string> = {
  0x00: '#000000', 0x02: '#1a1a1a', 0x04: '#2a2a2a', 0x06: '#3a3a3a',
  0x08: '#4a4a4a', 0x0A: '#5a5a5a', 0x0C: '#6a6a6a', 0x0E: '#7a7a7a',
  0x10: '#8a8a8a', 0x12: '#9a9a9a', 0x14: '#aaaaaa', 0x16: '#bababa',
  0x18: '#cacaca', 0x1A: '#dadada', 0x1C: '#eaeaea', 0x1E: '#ffffff',
  // Reds
  0x20: '#1a0000', 0x22: '#3a0000', 0x24: '#5a0000', 0x26: '#7a0000',
  0x28: '#9a0000', 0x2A: '#ba0000', 0x2C: '#da0000', 0x2E: '#ff0000',
  // Oranges
  0x30: '#1a0a00', 0x32: '#3a1a00', 0x34: '#5a2a00', 0x36: '#7a3a00',
  0x38: '#9a4a00', 0x3A: '#ba5a00', 0x3C: '#da6a00', 0x3E: '#ff7a00',
  // Yellows
  0x60: '#1a1a00', 0x62: '#3a3a00', 0x64: '#5a5a00', 0x66: '#7a7a00',
  0x68: '#9a9a00', 0x6A: '#baba00', 0x6C: '#dada00', 0x6E: '#ffff00',
  // Greens
  0xB0: '#001a00', 0xB2: '#003a00', 0xB4: '#005a00', 0xB6: '#007a00',
  0xB8: '#009a00', 0xBA: '#00ba00', 0xBC: '#00da00', 0xBE: '#00ff00',
  // Blues
  0x70: '#00001a', 0x72: '#00003a', 0x74: '#00005a', 0x76: '#00007a',
  0x78: '#00009a', 0x7A: '#0000ba', 0x7C: '#0000da', 0x7E: '#0000ff',
  // Cyans
  0x90: '#001a1a', 0x92: '#003a3a', 0x94: '#005a5a', 0x96: '#007a7a',
  0x98: '#009a9a', 0x9A: '#00baba', 0x9C: '#00dada', 0x9E: '#00ffff',
  // Purples
  0x50: '#0a001a', 0x52: '#1a003a', 0x54: '#2a005a', 0x56: '#3a007a',
  0x58: '#4a009a', 0x5A: '#5a00ba', 0x5C: '#6a00da', 0x5E: '#7a00ff',
};

/**
 * Level color mapping for background
 */
const LEVEL_BACKGROUNDS: Record<LevelColor, string> = {
  BLACK: '#000000',
  BLUE: '#000040',
  GREEN: '#004000',
  RED: '#400000'
};

/**
 * Wall color by level
 */
const LEVEL_WALL_COLORS: Record<LevelColor, number> = {
  BLACK: 0x0E,  // White-ish
  BLUE: 0x7A,   // Light blue
  GREEN: 0xBA,  // Light green
  RED: 0x2A     // Light red
};

/**
 * Sprite definitions (simplified for prototype)
 */
interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/**
 * Atari Renderer
 * Handles all rendering with authentic Atari 8-bit aesthetics
 */
export class AtariRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private glowIntensity: number = 0.5;
  private pulsatePhase: number = 0;
  private scanlinesEnabled: boolean = true;
  private glowEnabled: boolean = true;
  
  // Room dimensions
  private readonly ROOM_WIDTH = 240;
  private readonly ROOM_HEIGHT = 200;
  private readonly WALL_THICKNESS = 4;
  private readonly GRID_SIZE = 32;
  private readonly GRID_OFFSET_X = 40;
  private readonly GRID_OFFSET_Y = 20;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    
    // Set canvas size
    this.canvas.width = this.ROOM_WIDTH;
    this.canvas.height = this.ROOM_HEIGHT;
  }

  /**
   * Render a complete room
   */
  renderRoom(room: Room, levelColor: LevelColor, mazeType: MazeType): void {
    // Clear and set background
    this.clear(LEVEL_BACKGROUNDS[levelColor]);

    // Apply Atari Glow effect
    if (this.glowEnabled) {
      this.applyAtariGlow();
    }

    // Render room based on type
    if (room.isPodRoom) {
      this.renderPodRoom(room, levelColor);
    } else if (room.isCorridor && room.corridor) {
      this.renderCorridor(room, room.corridor.type, levelColor);
    } else {
      this.renderChamber(room, levelColor);
    }

    // Render objects
    if (room.object) {
      this.renderObject(room.object);
    }

    // Apply CRT effects
    if (this.scanlinesEnabled) {
      this.applyScanlines();
    }

    // Update glow pulsation
    this.updateGlow();
  }

  /**
   * Clear canvas with background color
   */
  private clear(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Apply Atari Glow effect
   * Creates pulsating wall luma and color shifts
   */
  private applyAtariGlow(): void {
    // Create glow layer
    this.ctx.save();
    
    // Set composite operation for glow
    this.ctx.globalCompositeOperation = 'screen';
    
    // Calculate pulsation
    const pulse = Math.sin(this.pulsatePhase) * 0.3 + 0.7;
    this.ctx.globalAlpha = this.glowIntensity * pulse;
    
    // Apply glow filter if supported
    this.ctx.filter = `blur(${4 * pulse}px) brightness(${1 + pulse * 0.3})`;
    
    this.ctx.restore();
  }

  /**
   * Update glow pulsation phase
   */
  private updateGlow(): void {
    this.pulsatePhase += 0.05;
    if (this.pulsatePhase > Math.PI * 2) {
      this.pulsatePhase = 0;
    }
  }

  /**
   * Render a standard chamber room
   */
  private renderChamber(room: Room, levelColor: LevelColor): void {
    const wallColor = ATARI_COLORS[LEVEL_WALL_COLORS[levelColor]] || '#ffffff';
    this.ctx.strokeStyle = wallColor;
    this.ctx.lineWidth = this.WALL_THICKNESS;

    // Draw outer walls (electrocuting maze boundary)
    this.ctx.strokeRect(
      this.GRID_OFFSET_X - 8,
      this.GRID_OFFSET_Y - 8,
      this.GRID_SIZE * 3 + 16,
      this.GRID_SIZE * 3 + 16
    );

    // Draw internal horizontal walls
    room.horizontalWalls.forEach(wall => {
      if (wall.exists) {
        this.drawHorizontalWall(wall, wallColor);
      }
    });

    // Draw internal vertical walls
    room.verticalWalls.forEach(wall => {
      if (wall.exists) {
        this.drawVerticalWall(wall, wallColor);
      }
    });

    // Draw exit indicators
    this.renderExits(room);
  }

  /**
   * Render a corridor room
   */
  private renderCorridor(room: Room, corridorType: CorridorType, levelColor: LevelColor): void {
    const wallColor = ATARI_COLORS[LEVEL_WALL_COLORS[levelColor]] || '#ffffff';
    this.ctx.fillStyle = wallColor;
    this.ctx.strokeStyle = wallColor;
    this.ctx.lineWidth = this.WALL_THICKNESS;

    // Draw based on corridor type
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    switch (corridorType) {
      case CorridorType.DEAD_END_BOTTOM:
        this.drawDeadEnd(cx, cy, 'bottom');
        break;
      case CorridorType.DEAD_END_TOP:
        this.drawDeadEnd(cx, cy, 'top');
        break;
      case CorridorType.BOTTOM_TO_RIGHT:
        this.drawAngledCorridor(cx, cy, 'bottom', 'right');
        break;
      case CorridorType.BOTTOM_TO_LEFT:
        this.drawAngledCorridor(cx, cy, 'bottom', 'left');
        break;
      case CorridorType.TOP_TO_RIGHT:
        this.drawAngledCorridor(cx, cy, 'top', 'right');
        break;
      case CorridorType.TOP_TO_LEFT:
        this.drawAngledCorridor(cx, cy, 'top', 'left');
        break;
      case CorridorType.T_BOTTOM_EXIT:
        this.drawTJunection(cx, cy, 'bottom');
        break;
      case CorridorType.T_TOP_EXIT:
        this.drawTJunection(cx, cy, 'top');
        break;
    }

    // Draw walls from room data
    room.horizontalWalls.forEach(wall => {
      if (wall.exists) this.drawHorizontalWall(wall, wallColor);
    });
    room.verticalWalls.forEach(wall => {
      if (wall.exists) this.drawVerticalWall(wall, wallColor);
    });
  }

  /**
   * Render a pod room with barriers
   */
  private renderPodRoom(room: Room, levelColor: LevelColor): void {
    const wallColor = ATARI_COLORS[LEVEL_WALL_COLORS[levelColor]] || '#ffffff';
    
    // Draw chamber outline
    this.ctx.strokeStyle = wallColor;
    this.ctx.lineWidth = this.WALL_THICKNESS;
    this.ctx.strokeRect(
      this.GRID_OFFSET_X - 8,
      this.GRID_OFFSET_Y - 8,
      this.GRID_SIZE * 3 + 16,
      this.GRID_SIZE * 3 + 16
    );

    // Draw vertical moving barriers (pods)
    const barrierX1 = this.GRID_OFFSET_X + this.GRID_SIZE - 4;
    const barrierX2 = this.GRID_OFFSET_X + this.GRID_SIZE * 2 - 4;
    
    this.ctx.fillStyle = wallColor;
    
    // Animate barriers (simplified)
    const barrierOffset = Math.sin(this.pulsatePhase * 2) * 10;
    
    // Left barrier
    this.ctx.fillRect(barrierX1, this.GRID_OFFSET_Y + 20 + barrierOffset, 8, 40);
    // Right barrier
    this.ctx.fillRect(barrierX2, this.GRID_OFFSET_Y + 20 - barrierOffset, 8, 40);

    // Small slit in center
    const slitY = this.GRID_OFFSET_Y + this.GRID_SIZE * 1.5;
    this.ctx.clearRect(
      this.GRID_OFFSET_X + this.GRID_SIZE,
      slitY - 4,
      this.GRID_SIZE,
      8
    );
  }

  /**
   * Draw a horizontal wall segment
   */
  private drawHorizontalWall(wall: WallTile, color: string): void {
    const x = this.GRID_OFFSET_X + wall.x * this.GRID_SIZE;
    const y = this.GRID_OFFSET_Y + wall.y * this.GRID_SIZE;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y - 2, this.GRID_SIZE, 4);
  }

  /**
   * Draw a vertical wall segment
   */
  private drawVerticalWall(wall: WallTile, color: string): void {
    const x = this.GRID_OFFSET_X + wall.x * this.GRID_SIZE;
    const y = this.GRID_OFFSET_Y + wall.y * this.GRID_SIZE;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - 2, y, 4, this.GRID_SIZE);
  }

  /**
   * Draw dead end corridor
   */
  private drawDeadEnd(cx: number, cy: number, direction: 'top' | 'bottom'): void {
    const size = 60;
    this.ctx.beginPath();
    
    if (direction === 'bottom') {
      this.ctx.moveTo(cx - size/2, cy - size);
      this.ctx.lineTo(cx + size/2, cy - size);
      this.ctx.lineTo(cx + size/2, cy + size/2);
      this.ctx.lineTo(cx - size/2, cy + size/2);
    } else {
      this.ctx.moveTo(cx - size/2, cy + size);
      this.ctx.lineTo(cx + size/2, cy + size);
      this.ctx.lineTo(cx + size/2, cy - size/2);
      this.ctx.lineTo(cx - size/2, cy - size/2);
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
  }

  /**
   * Draw angled corridor
   */
  private drawAngledCorridor(
    cx: number, 
    cy: number, 
    from: 'top' | 'bottom', 
    to: 'left' | 'right'
  ): void {
    const size = 60;
    this.ctx.beginPath();
    
    if (from === 'bottom' && to === 'right') {
      this.ctx.moveTo(cx - size/2, cy - size);
      this.ctx.lineTo(cx + size/2, cy - size);
      this.ctx.lineTo(cx + size/2, cy + size/2);
      this.ctx.lineTo(cx, cy + size/2);
      this.ctx.lineTo(cx, cy);
      this.ctx.lineTo(cx - size/2, cy);
    } else if (from === 'bottom' && to === 'left') {
      this.ctx.moveTo(cx + size/2, cy - size);
      this.ctx.lineTo(cx - size/2, cy - size);
      this.ctx.lineTo(cx - size/2, cy + size/2);
      this.ctx.lineTo(cx, cy + size/2);
      this.ctx.lineTo(cx, cy);
      this.ctx.lineTo(cx + size/2, cy);
    } else if (from === 'top' && to === 'right') {
      this.ctx.moveTo(cx - size/2, cy + size);
      this.ctx.lineTo(cx + size/2, cy + size);
      this.ctx.lineTo(cx + size/2, cy - size/2);
      this.ctx.lineTo(cx, cy - size/2);
      this.ctx.lineTo(cx, cy);
      this.ctx.lineTo(cx - size/2, cy);
    } else if (from === 'top' && to === 'left') {
      this.ctx.moveTo(cx + size/2, cy + size);
      this.ctx.lineTo(cx - size/2, cy + size);
      this.ctx.lineTo(cx - size/2, cy - size/2);
      this.ctx.lineTo(cx, cy - size/2);
      this.ctx.lineTo(cx, cy);
      this.ctx.lineTo(cx + size/2, cy);
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
  }

  /**
   * Draw T-junction corridor
   */
  private drawTJunection(cx: number, cy: number, stemDirection: 'top' | 'bottom'): void {
    const size = 60;
    this.ctx.beginPath();
    
    if (stemDirection === 'bottom') {
      // T with bottom exit
      this.ctx.moveTo(cx - size, cy - size);
      this.ctx.lineTo(cx + size, cy - size);
      this.ctx.lineTo(cx + size, cy + size/2);
      this.ctx.lineTo(cx + size/3, cy + size/2);
      this.ctx.lineTo(cx + size/3, cy + size);
      this.ctx.lineTo(cx - size/3, cy + size);
      this.ctx.lineTo(cx - size/3, cy + size/2);
      this.ctx.lineTo(cx - size, cy + size/2);
    } else {
      // T with top exit
      this.ctx.moveTo(cx - size, cy + size);
      this.ctx.lineTo(cx + size, cy + size);
      this.ctx.lineTo(cx + size, cy - size/2);
      this.ctx.lineTo(cx + size/3, cy - size/2);
      this.ctx.lineTo(cx + size/3, cy - size);
      this.ctx.lineTo(cx - size/3, cy - size);
      this.ctx.lineTo(cx - size/3, cy - size/2);
      this.ctx.lineTo(cx - size, cy - size/2);
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
  }

  /**
   * Render room exits
   */
  private renderExits(room: Room): void {
    this.ctx.fillStyle = '#000000';
    
    // North/South exits (vertical)
    if (room.exits.north !== undefined) {
      // Clear top
      this.ctx.clearRect(this.canvas.width/2 - 10, 0, 20, 10);
    }
    if (room.exits.south !== undefined) {
      // Clear bottom
      this.ctx.clearRect(this.canvas.width/2 - 10, this.canvas.height - 10, 20, 10);
    }
    
    // East/West exits (always available)
    this.ctx.clearRect(0, this.canvas.height/2 - 10, 10, 20);
    this.ctx.clearRect(this.canvas.width - 10, this.canvas.height/2 - 10, 10, 20);
  }

  /**
   * Render an object in the room
   */
  private renderObject(obj: RoomObject): void {
    const color = ATARI_COLORS[obj.color] || '#ffffff';
    this.ctx.fillStyle = color;
    
    // Position randomly in one of 9 grid positions
    // (would be determined by game logic)
    const gridX = 1; // Center for now
    const gridY = 1;
    
    const x = this.GRID_OFFSET_X + gridX * this.GRID_SIZE + this.GRID_SIZE / 2;
    const y = this.GRID_OFFSET_Y + gridY * this.GRID_SIZE + this.GRID_SIZE / 2;
    
    switch (obj.type) {
      case ObjectType.POTION:
        // Draw potion bottle
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(x - 2, y - 10, 4, 4);
        break;
        
      case ObjectType.KEY:
        // Draw key
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(x, y, 8, 3);
        break;
        
      case ObjectType.KEYHOLE:
        // Draw keyhole
        this.ctx.beginPath();
        this.ctx.arc(x, y - 2, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(x - 2, y, 4, 6);
        break;
        
      case ObjectType.MYSTERY:
        // Draw question mark
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('?', x, y);
        break;
        
      case ObjectType.SHADOW:
        // Draw Shadow (enforcer)
        this.ctx.fillStyle = '#880000';
        this.ctx.fillRect(x - 8, y - 12, 16, 24);
        // Glowing eyes
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(x - 4, y - 6, 2, 2);
        this.ctx.fillRect(x + 2, y - 6, 2, 2);
        break;
    }
  }

  /**
   * Apply CRT scanline effect
   */
  private applyScanlines(): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    
    for (let y = 0; y < this.canvas.height; y += 2) {
      this.ctx.fillRect(0, y, this.canvas.width, 1);
    }
    
    this.ctx.restore();
  }

  /**
   * Render player (Shamus)
   */
  renderPlayer(x: number, y: number, facing: 'left' | 'right'): void {
    // Body
    this.ctx.fillStyle = '#00BA00'; // Green trench coat
    this.ctx.fillRect(x - 4, y - 8, 8, 16);
    
    // Hat
    this.ctx.fillStyle = '#3A5A00'; // Darker green hat
    this.ctx.fillRect(x - 6, y - 12, 12, 4);
    this.ctx.fillRect(x - 3, y - 16, 6, 4);
    
    // Face (shows hat gap)
    this.ctx.fillStyle = '#FFAA00'; // Skin tone
    this.ctx.fillRect(x - 2, y - 8, 4, 4);
    
    // Gun
    this.ctx.fillStyle = '#888888';
    if (facing === 'right') {
      this.ctx.fillRect(x + 4, y - 2, 6, 2);
    } else {
      this.ctx.fillRect(x - 10, y - 2, 6, 2);
    }
  }

  /**
   * Render enemy
   */
  renderEnemy(enemy: { type: string; x: number; y: number }): void {
    switch (enemy.type) {
      case 'whirling-drone':
        this.ctx.fillStyle = '#BA0000';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        // Whirl effect
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, 10, this.pulsatePhase, this.pulsatePhase + Math.PI);
        this.ctx.stroke();
        break;
        
      case 'snap-jumper':
        this.ctx.fillStyle = '#0000BA';
        this.ctx.fillRect(enemy.x - 4, enemy.y - 4, 8, 8);
        break;
        
      case 'robo-droid':
        this.ctx.fillStyle = '#BABA00';
        this.ctx.fillRect(enemy.x - 5, enemy.y - 5, 10, 10);
        break;
    }
  }

  /**
   * Set glow intensity (0-1)
   */
  setGlowIntensity(intensity: number): void {
    this.glowIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Toggle scanlines
   */
  toggleScanlines(enabled: boolean): void {
    this.scanlinesEnabled = enabled;
  }

  /**
   * Toggle Atari Glow effect
   */
  toggleGlow(enabled: boolean): void {
    this.glowEnabled = enabled;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

export default AtariRenderer;
