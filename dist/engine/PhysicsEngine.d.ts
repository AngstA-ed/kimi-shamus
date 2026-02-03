/**
 * Physics Engine with Atari-specific quirks
 * Implements collision detection with Hat Gap and ION-SHIV wall penetration
 */
import { Point, Room, CollisionResult, RoomObject, PhysicsConfig } from '../types';
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
export declare class PhysicsEngine {
    private config;
    constructor(config?: Partial<PhysicsConfig>);
    /**
     * Check collision between entity and room
     * Returns collision result with Atari-specific quirks
     */
    checkRoomCollision(entity: Entity, room: Room): CollisionResult;
    /**
     * Check if entity intersects with a wall
     */
    private intersectsWall;
    /**
     * Rectangle intersection check
     */
    private rectIntersect;
    /**
     * Check collision between projectile and enemy
     * Implements Atari "Hat Gap" hitbox behavior
     *
     * Atari-specific: Shamus has a gap between hat and head
     * Shots can pass through this gap without hitting
     */
    checkProjectileEnemyCollision(projectile: Projectile, enemy: Entity & {
        touchingWall?: boolean;
    }): CollisionResult;
    /**
     * Check if projectile hit is in the "Hat Gap"
     * Atari-specific behavior: gap between Shamus's hat and head
     */
    private isHatGapHit;
    /**
     * Check collision between player and enemy shot
     * Applies Hat Gap logic for player protection
     */
    checkEnemyShotCollision(player: Entity, projectile: Projectile): CollisionResult;
    /**
     * Check collision with collectible object
     */
    checkObjectCollision(player: Entity, object: RoomObject, objectPosition: Point): CollisionResult;
    /**
     * Move entity with collision detection
     * Returns new position and collision info
     */
    moveEntity(entity: Entity, dx: number, dy: number, room: Room): {
        position: Point;
        collision: CollisionResult;
    };
    /**
     * Calculate distance between two points
     */
    distance(p1: Point, p2: Point): number;
    /**
     * Normalize a vector
     */
    normalize(vector: Point): Point;
    /**
     * Update physics configuration
     */
    setConfig(config: Partial<PhysicsConfig>): void;
    /**
     * Get current physics configuration
     */
    getConfig(): PhysicsConfig;
}
export default PhysicsEngine;
//# sourceMappingURL=PhysicsEngine.d.ts.map