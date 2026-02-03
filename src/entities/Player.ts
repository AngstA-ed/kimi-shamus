/**
 * Player Entity - Shamus Character
 * Implements movement, shooting, collision with Atari quirks (Hat Gap)
 */

import { Direction, RoomExit } from '../types';

export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  isFiring: boolean;
  lives: number;
  keys: number;
  invulnerable: boolean;
  invulnerableTime: number;
}

export interface Shot {
  x: number;
  y: number;
  direction: Direction;
  active: boolean;
}

export class Player {
  // Atari sprite dimensions (in pixels)
  public static readonly WIDTH = 8;
  public static readonly HEIGHT = 16;
  
  // Movement speed (pixels per frame)
  private static readonly BASE_SPEED = 2;
  private static readonly MAX_SPEED = 4;
  
  // Shot cooldown (frames)
  private static readonly SHOT_COOLDOWN = 15;
  private static readonly INVULNERABILITY_TIME = 60; // 1 second at 60fps
  
  private state: PlayerState;
  private shots: Shot[] = [];
  private shotCooldown: number = 0;
  private speed: number = Player.BASE_SPEED;
  
  // Room boundaries
  private roomWidth: number;
  private roomHeight: number;
  
  // Collision callbacks
  private onWallCollision: (x: number, y: number) => boolean;
  private onExit: (exit: RoomExit) => void;
  
  constructor(
    startX: number = 80,
    startY: number = 48,
    roomWidth: number = 160,
    roomHeight: number = 96,
    onWallCollision: (x: number, y: number) => boolean = () => false,
    onExit: (exit: RoomExit) => void = () => {}
  ) {
    this.state = {
      x: startX,
      y: startY,
      direction: Direction.RIGHT,
      isMoving: false,
      isFiring: false,
      lives: 4,
      keys: 0,
      invulnerable: false,
      invulnerableTime: 0
    };
    
    this.roomWidth = roomWidth;
    this.roomHeight = roomHeight;
    this.onWallCollision = onWallCollision;
    this.onExit = onExit;
  }
  
  /**
   * Get current player state
   */
  getState(): PlayerState {
    return { ...this.state };
  }
  
  /**
   * Get active shots
   */
  getShots(): Shot[] {
    return this.shots.filter(s => s.active);
  }
  
  /**
   * Set movement speed (for tournament/scaling logic)
   */
  setSpeed(multiplier: number): void {
    this.speed = Math.min(
      Player.BASE_SPEED * multiplier,
      Player.MAX_SPEED
    );
  }
  
  /**
   * Move in a direction
   */
  move(direction: Direction): void {
    this.state.direction = direction;
    this.state.isMoving = true;
    
    let newX = this.state.x;
    let newY = this.state.y;
    
    switch (direction) {
      case Direction.UP:
        newY -= this.speed;
        break;
      case Direction.DOWN:
        newY += this.speed;
        break;
      case Direction.LEFT:
        newX -= this.speed;
        break;
      case Direction.RIGHT:
        newX += this.speed;
        break;
    }
    
    // Check exit boundaries first
    const exit = this.checkExit(newX, newY);
    if (exit) {
      this.onExit(exit);
      return;
    }
    
    // Check wall collision (Atari-style bounding box)
    if (!this.checkWallCollision(newX, newY)) {
      this.state.x = newX;
      this.state.y = newY;
    }
    
    // Keep in bounds
    this.state.x = Math.max(4, Math.min(this.roomWidth - 4, this.state.x));
    this.state.y = Math.max(4, Math.min(this.roomHeight - 4, this.state.y));
  }
  
  /**
   * Stop moving
   */
  stop(): void {
    this.state.isMoving = false;
  }
  
  /**
   * Fire a shot in current direction
   */
  fire(): void {
    if (this.shotCooldown > 0) return;
    
    this.state.isFiring = true;
    this.shotCooldown = Player.SHOT_COOLDOWN;
    
    // Create shot at player position + offset in facing direction
    let shotX = this.state.x;
    let shotY = this.state.y;
    
    switch (this.state.direction) {
      case Direction.UP:
        shotY -= 8;
        break;
      case Direction.DOWN:
        shotY += 8;
        break;
      case Direction.LEFT:
        shotX -= 8;
        break;
      case Direction.RIGHT:
        shotX += 8;
        break;
    }
    
    this.shots.push({
      x: shotX,
      y: shotY,
      direction: this.state.direction,
      active: true
    });
  }
  
  /**
   * Release fire button
   */
  releaseFire(): void {
    this.state.isFiring = false;
  }
  
  /**
   * Take damage
   */
  takeDamage(): boolean {
    if (this.state.invulnerable) return false;
    
    this.state.lives--;
    this.state.invulnerable = true;
    this.state.invulnerableTime = Player.INVULNERABILITY_TIME;
    
    return this.state.lives <= 0; // true if dead
  }
  
  /**
   * Add a key
   */
  addKey(): void {
    this.state.keys++;
  }
  
  /**
   * Use a key
   */
  useKey(): boolean {
    if (this.state.keys > 0) {
      this.state.keys--;
      return true;
    }
    return false;
  }
  
  /**
   * Update player state (call every frame)
   */
  update(): void {
    // Update invulnerability
    if (this.state.invulnerable) {
      this.state.invulnerableTime--;
      if (this.state.invulnerableTime <= 0) {
        this.state.invulnerable = false;
      }
    }
    
    // Update shot cooldown
    if (this.shotCooldown > 0) {
      this.shotCooldown--;
    }
    
    // Update shots
    this.shots.forEach(shot => {
      if (!shot.active) return;
      
      const shotSpeed = 4;
      switch (shot.direction) {
        case Direction.UP:
          shot.y -= shotSpeed;
          break;
        case Direction.DOWN:
          shot.y += shotSpeed;
          break;
        case Direction.LEFT:
          shot.x -= shotSpeed;
          break;
        case Direction.RIGHT:
          shot.x += shotSpeed;
          break;
      }
      
      // Check bounds
      if (shot.x < 0 || shot.x > this.roomWidth ||
          shot.y < 0 || shot.y > this.roomHeight) {
        shot.active = false;
      }
      
      // Check wall collision (shots can hit walls)
      if (this.onWallCollision(shot.x, shot.y)) {
        shot.active = false;
      }
    });
    
    // Clean up inactive shots
    this.shots = this.shots.filter(s => s.active);
  }
  
  /**
   * Check if player collision with wall (Atari-style "Hat Gap" aware)
   */
  private checkWallCollision(x: number, y: number): boolean {
    // Main body collision box
    const hitBox = {
      x: x - 3,
      y: y - 6,
      width: 6,
      height: 12
    };
    
    // Check multiple points around the hitbox
    const checkPoints = [
      { x: hitBox.x, y: hitBox.y },
      { x: hitBox.x + hitBox.width, y: hitBox.y },
      { x: hitBox.x, y: hitBox.y + hitBox.height },
      { x: hitBox.x + hitBox.width, y: hitBox.y + hitBox.height },
      { x: x, y: y }
    ];
    
    // The "Hat Gap" - shots can pass between hat and head
    // But player body still collides normally
    return checkPoints.some(pt => this.onWallCollision(pt.x, pt.y));
  }
  
  /**
   * Check if player is at room exit
   */
  private checkExit(x: number, y: number): RoomExit | null {
    const margin = 8;
    
    if (x < margin) return RoomExit.WEST;
    if (x > this.roomWidth - margin) return RoomExit.EAST;
    if (y < margin) return RoomExit.NORTH;
    if (y > this.roomHeight - margin) return RoomExit.SOUTH;
    
    return null;
  }
  
  /**
   * Render player to canvas context
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Don't render if invulnerable and blinking
    if (this.state.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }
    
    const x = Math.floor(this.state.x);
    const y = Math.floor(this.state.y);
    
    // Draw Shamus (simple 8-bit representation)
    ctx.fillStyle = '#ffff00'; // Yellow body
    
    // Body (hat + head + body)
    // Hat (top)
    ctx.fillRect(x - 4, y - 8, 8, 3);
    
    // Head
    ctx.fillStyle = '#ffccaa'; // Skin tone
    ctx.fillRect(x - 2, y - 5, 4, 3);
    
    // Body
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x - 3, y - 2, 6, 6);
    
    // Gun if firing
    if (this.state.isFiring) {
      ctx.fillStyle = '#ffffff';
      let gunX = x;
      let gunY = y;
      
      switch (this.state.direction) {
        case Direction.UP:
          gunY -= 8;
          break;
        case Direction.DOWN:
          gunY += 6;
          break;
        case Direction.LEFT:
          gunX -= 8;
          break;
        case Direction.RIGHT:
          gunX += 6;
          break;
      }
      
      ctx.fillRect(gunX - 1, gunY - 1, 2, 2);
    }
    
    // Direction indicator
    ctx.fillStyle = '#000000';
    let eyeX = x;
    let eyeY = y - 4;
    
    switch (this.state.direction) {
      case Direction.UP:
        eyeY -= 1;
        break;
      case Direction.DOWN:
        eyeY += 1;
        break;
      case Direction.LEFT:
        eyeX -= 2;
        break;
      case Direction.RIGHT:
        eyeX += 2;
        break;
    }
    
    ctx.fillRect(eyeX - 1, eyeY - 1, 2, 2);
    
    // Render shots
    ctx.fillStyle = '#00ffff'; // Cyan shots
    this.shots.forEach(shot => {
      if (shot.active) {
        ctx.fillRect(Math.floor(shot.x) - 1, Math.floor(shot.y) - 1, 2, 2);
      }
    });
  }
  
  /**
   * Reset player to room center
   */
  reset(x?: number, y?: number): void {
    this.state.x = x ?? this.roomWidth / 2;
    this.state.y = y ?? this.roomHeight / 2;
    this.shots = [];
    this.shotCooldown = 0;
  }
  
  /**
   * Full respawn (after death)
   */
  respawn(): void {
    this.state.lives = 4;
    this.state.keys = 0;
    this.reset();
  }
}

export default Player;
