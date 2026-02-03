/**
 * Physics Engine with Atari-specific quirks
 * Implements collision detection with Hat Gap and ION-SHIV wall penetration
 */

import {
  Point,
  WallTile,
  Room,
  EnemySpawn,
  CollisionResult,
  RoomObject,
  PhysicsConfig
} from '../types';

/**
 * Player hitbox configuration
 * Atari-specific: "Hat Gap" allows shots to pass between hat and head
 */
const DEFAULT_HITBOX = {
  width: 8,
  height: 16,
  hatGapY: 2,      // Gap starts 2 pixels from top
  hatGapHeight: 4  // Gap is 4 pixels tall
};

/**
 * Default physics configuration with Atari quirks
 */
const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  baseSpeed: 0x07,
  speedIncreasePerLevel: 1,
  speedIncreasePerDifficulty: 2,
  speedIncreaseAfterClear: 1,
  playerHitboxWidth: DEFAULT_HITBOX.width,
  playerHitboxHeight: DEFAULT_HITBOX.height,
  hatGapY: DEFAULT_HITBOX.hatGapY,
  hatGapHeight: DEFAULT_HITBOX.hatGapHeight,
  ionShivWallPenetration: true  // Atari-specific: ION-SHIVs kill through walls
};

/**
 * Entity in the game world
 */
interface Entity {
  position: Point;
  velocity: Point;
  width: number;
  height: number;
}

/**
 * Projectile (shot/ION-SHIV)
 */
interface Projectile extends Entity {
  type: 'regular' | 'ION-SHIV';
  owner: 'player' | 'enemy';
}

/**
 * Physics Engine
 * Handles movement, collision detection, and Atari-specific behaviors
 */
export class PhysicsEngine {
  private config: PhysicsConfig;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  }

  /**
   * Check collision between entity and room
   * Returns collision result with Atari-specific quirks
   */
  checkRoomCollision(entity: Entity, room: Room): CollisionResult {
    // Check horizontal wall collisions
    for (const wall of room.horizontalWalls) {
      if (wall.exists && this.intersectsWall(entity, wall, 'horizontal')) {
        return {
          collided: true,
          type: 'electrocuting',
          target: wall
        };
      }
    }

    // Check vertical wall collisions
    for (const wall of room.verticalWalls) {
      if (wall.exists && this.intersectsWall(entity, wall, 'vertical')) {
        return {
          collided: true,
          type: 'electrocuting',
          target: wall
        };
      }
    }

    return { collided: false };
  }

  /**
   * Check if entity intersects with a wall
   */
  private intersectsWall(
    entity: Entity,
    wall: WallTile,
    orientation: 'horizontal' | 'vertical'
  ): boolean {
    // Convert grid position to pixel coordinates
    const wallX = wall.x * 32 + 16;  // Center of grid cell
    const wallY = wall.y * 32 + 16;
    
    const wallWidth = orientation === 'horizontal' ? 32 : 4;
    const wallHeight = orientation === 'horizontal' ? 4 : 32;

    return this.rectIntersect(
      entity.position.x, entity.position.y, entity.width, entity.height,
      wallX - wallWidth / 2, wallY - wallHeight / 2, wallWidth, wallHeight
    );
  }

  /**
   * Rectangle intersection check
   */
  private rectIntersect(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
  }

  /**
   * Check collision between projectile and enemy
   * Implements Atari "Hat Gap" hitbox behavior
   * 
   * Atari-specific: Shamus has a gap between hat and head
   * Shots can pass through this gap without hitting
   */
  checkProjectileEnemyCollision(
    projectile: Projectile,
    enemy: Entity & { touchingWall?: boolean }
  ): CollisionResult {
    // Check basic collision
    const hit = this.rectIntersect(
      projectile.position.x, projectile.position.y,
      projectile.width, projectile.height,
      enemy.position.x, enemy.position.y,
      enemy.width, enemy.height
    );

    if (!hit) {
      return { collided: false };
    }

    // Atari "Hat Gap" check
    // If projectile passes through the gap between hat and head, it's a miss
    if (this.isHatGapHit(projectile, enemy)) {
      return {
        collided: false,
        hatGapPass: true
      };
    }

    // Atari ION-SHIV wall penetration check
    // ION-SHIVs can kill enemies through walls when enemy touches wall
    if (projectile.type === 'ION-SHIV' && enemy.touchingWall) {
      return {
        collided: true,
        type: 'enemy',
        ionShivPenetration: true
      };
    }

    return {
      collided: true,
      type: 'enemy'
    };
  }

  /**
   * Check if projectile hit is in the "Hat Gap"
   * Atari-specific behavior: gap between Shamus's hat and head
   */
  private isHatGapHit(projectile: Projectile, enemy: Entity): boolean {
    // Calculate relative Y position of hit
    const hitY = projectile.position.y - enemy.position.y;
    
    // Check if hit is within hat gap zone
    const gapTop = this.config.hatGapY;
    const gapBottom = this.config.hatGapY + this.config.hatGapHeight;
    
    return hitY >= gapTop && hitY <= gapBottom;
  }

  /**
   * Check collision between player and enemy shot
   * Applies Hat Gap logic for player protection
   */
  checkEnemyShotCollision(
    player: Entity,
    projectile: Projectile
  ): CollisionResult {
    // Check basic collision
    const hit = this.rectIntersect(
      player.position.x, player.position.y,
      player.width, player.height,
      projectile.position.x, projectile.position.y,
      projectile.width, projectile.height
    );

    if (!hit) {
      return { collided: false };
    }

    // Check if shot passed through hat gap
    if (this.isHatGapHit(projectile, player)) {
      return {
        collided: false,
        hatGapPass: true
      };
    }

    return {
      collided: true,
      type: 'enemy'
    };
  }

  /**
   * Check collision with collectible object
   */
  checkObjectCollision(
    player: Entity,
    object: RoomObject,
    objectPosition: Point
  ): CollisionResult {
    // Objects are smaller than enemies
    const objectSize = 8;
    
    const hit = this.rectIntersect(
      player.position.x, player.position.y,
      player.width, player.height,
      objectPosition.x - objectSize / 2,
      objectPosition.y - objectSize / 2,
      objectSize, objectSize
    );

    if (hit) {
      return {
        collided: true,
        type: 'item'
      };
    }

    return { collided: false };
  }

  /**
   * Move entity with collision detection
   * Returns new position and collision info
   */
  moveEntity(
    entity: Entity,
    dx: number,
    dy: number,
    room: Room
  ): { position: Point; collision: CollisionResult } {
    // Try X movement
    let newX = entity.position.x + dx;
    const testEntityX = { ...entity, position: { x: newX, y: entity.position.y } };
    const collisionX = this.checkRoomCollision(testEntityX, room);
    
    if (collisionX.collided) {
      newX = entity.position.x; // Revert X
    }

    // Try Y movement
    let newY = entity.position.y + dy;
    const testEntityY = { ...entity, position: { x: newX, y: newY } };
    const collisionY = this.checkRoomCollision(testEntityY, room);
    
    if (collisionY.collided) {
      newY = entity.position.y; // Revert Y
    }

    // Return whichever collision was more significant
    const finalCollision = collisionX.collided ? collisionX : collisionY;

    return {
      position: { x: newX, y: newY },
      collision: finalCollision
    };
  }

  /**
   * Calculate distance between two points
   */
  distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Normalize a vector
   */
  normalize(vector: Point): Point {
    const len = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (len === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / len,
      y: vector.y / len
    };
  }

  /**
   * Update physics configuration
   */
  setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current physics configuration
   */
  getConfig(): PhysicsConfig {
    return { ...this.config };
  }
}

export default PhysicsEngine;
