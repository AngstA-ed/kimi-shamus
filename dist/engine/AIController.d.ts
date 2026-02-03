/**
 * AI Controller with Atari-specific enemy behaviors
 * Implements Whirling Drones, Snap Jumpers, Robo Droids, and Shadow Enforcer
 */
import { Point, Room, EnemyType, EnemySpawn } from '../types';
/**
 * Base enemy interface
 */
interface Enemy {
    id: string;
    type: EnemyType;
    position: Point;
    velocity: Point;
    width: number;
    height: number;
    state: string;
    touchingWall: boolean;
    update(deltaTime: number, player: Entity, room: Room): void;
}
/**
 * Player entity reference
 */
interface Entity {
    position: Point;
    velocity: Point;
}
/**
 * Whirling Drone - Persistent tracking behavior
 * Atari: Whirls around and tracks player persistently
 */
declare class WhirlingDrone implements Enemy {
    id: string;
    type: EnemyType;
    position: Point;
    velocity: Point;
    width: number;
    height: number;
    state: string;
    touchingWall: boolean;
    private patrolPath;
    private currentPatrolIndex;
    private trackingPlayer;
    private lastKnownPlayerPos;
    private trackingRange;
    private speed;
    private whirlAngle;
    constructor(id: string, x: number, y: number);
    private generatePatrolPath;
    update(deltaTime: number, player: Entity, room: Room): void;
    private patrol;
    /**
     * Persistent tracking - Atari behavior
     * Whirling Drone continuously tracks player
     */
    private persistentTrack;
    private moveToward;
    getWhirlOffset(): Point;
}
/**
 * Snap Jumper - Jump pattern behavior
 * Atari: Crouches then jumps in specific pattern
 */
declare class SnapJumper implements Enemy {
    id: string;
    type: EnemyType;
    position: Point;
    velocity: Point;
    width: number;
    height: number;
    state: 'idle' | 'crouch' | 'jump' | 'airborne' | 'landing';
    touchingWall: boolean;
    private crouchTimer;
    private crouchDuration;
    private jumpVelocity;
    private gravity;
    private detectionRange;
    constructor(id: string, x: number, y: number);
    update(deltaTime: number, player: Entity, room: Room): void;
    /**
     * Perform jump toward player
     */
    private performJump;
}
/**
 * Robo Droid - Patrol + aggro behavior
 */
declare class RoboDroid implements Enemy {
    id: string;
    type: EnemyType;
    position: Point;
    velocity: Point;
    width: number;
    height: number;
    state: 'patrol' | 'chase' | 'attack';
    touchingWall: boolean;
    private patrolPath;
    private currentPatrolIndex;
    private aggroRange;
    private attackRange;
    private speed;
    constructor(id: string, x: number, y: number);
    private generatePatrolPath;
    update(deltaTime: number, player: Entity, room: Room): void;
    private patrol;
    private chase;
    private attack;
    private moveToward;
}
/**
 * Shadow Enforcer - Atari-specific immediate movement
 * Key behaviors:
 * - Immediate movement (not gradual)
 * - Items despawn when Shadow appears
 * - Spawns in room 127
 */
declare class ShadowEnforcer implements Enemy {
    id: string;
    type: EnemyType;
    position: Point;
    velocity: Point;
    width: number;
    height: number;
    state: string;
    touchingWall: boolean;
    private spawnRoom;
    private targetPosition;
    private moveDelay;
    private moveInterval;
    private despawnedItems;
    constructor(id: string, x: number, y: number);
    update(deltaTime: number, player: Entity, room: Room): void;
    /**
     * Atari-specific: Immediate movement (teleportation-like)
     * Shadow appears at target position instantly
     */
    immediateMoveTo(target: Point): void;
    /**
     * Atari-specific: Items despawn when Shadow appears
     * Keys, keyholes, bonuses disappear (they use same player sprite)
     */
    despawnItems(room: Room): void;
    getSpawnRoom(): number;
}
/**
 * AI Controller
 * Manages all enemy AI in the game
 */
export declare class AIController {
    private enemies;
    private physics;
    constructor();
    /**
     * Spawn enemies for a room
     */
    spawnEnemies(spawns: EnemySpawn[], roomId: number): void;
    /**
     * Update all enemies
     */
    update(deltaTime: number, player: Entity, room: Room): void;
    /**
     * Get all active enemies
     */
    getEnemies(): Enemy[];
    /**
     * Get enemies by type
     */
    getEnemiesByType(type: EnemyType): Enemy[];
    /**
     * Remove an enemy
     */
    removeEnemy(id: string): void;
    /**
     * Clear all enemies for a room
     */
    clearRoomEnemies(roomId: number): void;
    /**
     * Clear all enemies
     */
    clearAllEnemies(): void;
    /**
     * Set difficulty level (affects enemy behavior)
     */
    setDifficulty(level: number): void;
}
export default AIController;
export { WhirlingDrone, SnapJumper, RoboDroid, ShadowEnforcer };
//# sourceMappingURL=AIController.d.ts.map