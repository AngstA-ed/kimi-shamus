/**
 * AI Controller with Atari-specific enemy behaviors
 * Implements Whirling Drones, Snap Jumpers, Robo Droids, and Shadow Enforcer
 */
import { EnemyType } from '../types';
import PhysicsEngine from './PhysicsEngine';
/**
 * Whirling Drone - Persistent tracking behavior
 * Atari: Whirls around and tracks player persistently
 */
class WhirlingDrone {
    constructor(id, x, y) {
        this.type = EnemyType.WHIRLING_DRONE;
        this.velocity = { x: 0, y: 0 };
        this.width = 8;
        this.height = 8;
        this.state = 'patrol';
        this.touchingWall = false;
        this.currentPatrolIndex = 0;
        this.trackingPlayer = false;
        this.trackingRange = 100;
        this.speed = 50; // pixels per second
        this.whirlAngle = 0;
        this.id = id;
        this.position = { x, y };
        this.lastKnownPlayerPos = { x, y };
        // Generate patrol path around room
        this.patrolPath = this.generatePatrolPath();
    }
    generatePatrolPath() {
        // Simple box patrol around room center
        return [
            { x: 50, y: 50 },
            { x: 150, y: 50 },
            { x: 150, y: 150 },
            { x: 50, y: 150 }
        ];
    }
    update(deltaTime, player, room) {
        const physics = new PhysicsEngine();
        const distanceToPlayer = physics.distance(this.position, player.position);
        // State machine
        if (distanceToPlayer < this.trackingRange) {
            this.trackingPlayer = true;
            this.lastKnownPlayerPos = { ...player.position };
            this.state = 'chase';
        }
        else if (this.trackingPlayer) {
            // Lost player, go to last known position
            this.state = 'search';
            if (physics.distance(this.position, this.lastKnownPlayerPos) < 5) {
                this.trackingPlayer = false;
                this.state = 'patrol';
            }
        }
        // Execute behavior
        switch (this.state) {
            case 'patrol':
                this.patrol(deltaTime);
                break;
            case 'chase':
                this.persistentTrack(player.position, deltaTime);
                break;
            case 'search':
                this.persistentTrack(this.lastKnownPlayerPos, deltaTime);
                break;
        }
        // Whirling animation
        this.whirlAngle += deltaTime * 5;
    }
    patrol(deltaTime) {
        const target = this.patrolPath[this.currentPatrolIndex];
        this.moveToward(target, deltaTime);
        // Check if reached waypoint
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        if (Math.sqrt(dx * dx + dy * dy) < 5) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.length;
        }
    }
    /**
     * Persistent tracking - Atari behavior
     * Whirling Drone continuously tracks player
     */
    persistentTrack(target, deltaTime) {
        this.moveToward(target, deltaTime);
    }
    moveToward(target, deltaTime) {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            this.velocity.x = (dx / distance) * this.speed;
            this.velocity.y = (dy / distance) * this.speed;
        }
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }
    getWhirlOffset() {
        return {
            x: Math.cos(this.whirlAngle) * 3,
            y: Math.sin(this.whirlAngle) * 3
        };
    }
}
/**
 * Snap Jumper - Jump pattern behavior
 * Atari: Crouches then jumps in specific pattern
 */
class SnapJumper {
    constructor(id, x, y) {
        this.type = EnemyType.SNAP_JUMPER;
        this.velocity = { x: 0, y: 0 };
        this.width = 8;
        this.height = 8;
        this.state = 'idle';
        this.touchingWall = false;
        // Jump mechanics
        this.crouchTimer = 0;
        this.crouchDuration = 0.5; // seconds
        this.jumpVelocity = 150;
        this.gravity = 400;
        this.detectionRange = 80;
        this.id = id;
        this.position = { x, y };
    }
    update(deltaTime, player, room) {
        const physics = new PhysicsEngine();
        const distanceToPlayer = physics.distance(this.position, player.position);
        switch (this.state) {
            case 'idle':
                if (distanceToPlayer < this.detectionRange) {
                    this.state = 'crouch';
                    this.crouchTimer = 0;
                }
                break;
            case 'crouch':
                this.crouchTimer += deltaTime;
                if (this.crouchTimer >= this.crouchDuration) {
                    this.performJump(player.position);
                }
                break;
            case 'jump':
                this.state = 'airborne';
                break;
            case 'airborne':
                // Apply gravity
                this.velocity.y += this.gravity * deltaTime;
                this.position.x += this.velocity.x * deltaTime;
                this.position.y += this.velocity.y * deltaTime;
                // Check landing
                if (this.position.y >= 150) { // Floor level
                    this.position.y = 150;
                    this.velocity.y = 0;
                    this.velocity.x = 0;
                    this.state = 'landing';
                }
                break;
            case 'landing':
                // Brief recovery before idle
                this.state = 'idle';
                break;
        }
    }
    /**
     * Perform jump toward player
     */
    performJump(playerPos) {
        const dx = playerPos.x - this.position.x;
        // Calculate jump velocity to reach player
        this.velocity.x = dx * 2; // Horizontal speed
        this.velocity.y = -this.jumpVelocity; // Upward
        this.state = 'jump';
    }
}
/**
 * Robo Droid - Patrol + aggro behavior
 */
class RoboDroid {
    constructor(id, x, y) {
        this.type = EnemyType.ROBO_DROID;
        this.velocity = { x: 0, y: 0 };
        this.width = 10;
        this.height = 10;
        this.state = 'patrol';
        this.touchingWall = false;
        this.currentPatrolIndex = 0;
        this.aggroRange = 120;
        this.attackRange = 40;
        this.speed = 40;
        this.id = id;
        this.position = { x, y };
        this.patrolPath = this.generatePatrolPath();
    }
    generatePatrolPath() {
        return [
            { x: 40, y: 40 },
            { x: 160, y: 40 },
            { x: 160, y: 160 },
            { x: 40, y: 160 }
        ];
    }
    update(deltaTime, player, room) {
        const physics = new PhysicsEngine();
        const distanceToPlayer = physics.distance(this.position, player.position);
        // State transitions
        switch (this.state) {
            case 'patrol':
                if (distanceToPlayer < this.aggroRange) {
                    this.state = 'chase';
                }
                break;
            case 'chase':
                if (distanceToPlayer > this.aggroRange * 1.5) {
                    this.state = 'patrol';
                }
                else if (distanceToPlayer < this.attackRange) {
                    this.state = 'attack';
                }
                break;
            case 'attack':
                if (distanceToPlayer > this.attackRange * 1.2) {
                    this.state = 'chase';
                }
                break;
        }
        // Execute behavior
        switch (this.state) {
            case 'patrol':
                this.patrol(deltaTime);
                break;
            case 'chase':
                this.chase(player.position, deltaTime);
                break;
            case 'attack':
                this.attack(player.position, deltaTime);
                break;
        }
    }
    patrol(deltaTime) {
        const target = this.patrolPath[this.currentPatrolIndex];
        this.moveToward(target, this.speed, deltaTime);
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        if (Math.sqrt(dx * dx + dy * dy) < 5) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.length;
        }
    }
    chase(target, deltaTime) {
        this.moveToward(target, this.speed * 1.2, deltaTime);
    }
    attack(target, deltaTime) {
        // Circle around player
        const angle = Math.atan2(target.y - this.position.y, target.x - this.position.x);
        const circleAngle = angle + Math.PI / 2;
        this.velocity.x = Math.cos(circleAngle) * this.speed;
        this.velocity.y = Math.sin(circleAngle) * this.speed;
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }
    moveToward(target, speed, deltaTime) {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            this.velocity.x = (dx / distance) * speed;
            this.velocity.y = (dy / distance) * speed;
        }
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }
}
/**
 * Shadow Enforcer - Atari-specific immediate movement
 * Key behaviors:
 * - Immediate movement (not gradual)
 * - Items despawn when Shadow appears
 * - Spawns in room 127
 */
class ShadowEnforcer {
    constructor(id, x, y) {
        this.type = EnemyType.SHADOW_ENFORCER;
        this.velocity = { x: 0, y: 0 };
        this.width = 12;
        this.height = 16;
        this.state = 'spawn';
        this.touchingWall = false;
        this.spawnRoom = 127;
        this.moveDelay = 0;
        this.moveInterval = 2.0; // seconds between moves
        this.despawnedItems = false;
        this.id = id;
        this.position = { x, y };
        this.targetPosition = { x, y };
    }
    update(deltaTime, player, room) {
        // Atari: Shadow despawns items immediately upon appearing
        if (!this.despawnedItems) {
            this.despawnItems(room);
            this.despawnedItems = true;
        }
        this.moveDelay += deltaTime;
        // Atari: Immediate movement to player position
        if (this.moveDelay >= this.moveInterval) {
            this.immediateMoveTo(player.position);
            this.moveDelay = 0;
        }
        // Shadow always faces player
        this.state = 'hunt';
    }
    /**
     * Atari-specific: Immediate movement (teleportation-like)
     * Shadow appears at target position instantly
     */
    immediateMoveTo(target) {
        // Add some randomness so it's not perfect
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        this.position.x = target.x + offsetX;
        this.position.y = target.y + offsetY;
        // Clamp to room bounds
        this.position.x = Math.max(20, Math.min(220, this.position.x));
        this.position.y = Math.max(20, Math.min(180, this.position.y));
    }
    /**
     * Atari-specific: Items despawn when Shadow appears
     * Keys, keyholes, bonuses disappear (they use same player sprite)
     */
    despawnItems(room) {
        if (room.object) {
            // In actual game, items would visually disappear
            console.log('Shadow appeared - items despawned');
        }
    }
    getSpawnRoom() {
        return this.spawnRoom;
    }
}
/**
 * AI Controller
 * Manages all enemy AI in the game
 */
export class AIController {
    constructor() {
        this.enemies = new Map();
        this.physics = new PhysicsEngine();
    }
    /**
     * Spawn enemies for a room
     */
    spawnEnemies(spawns, roomId) {
        // Clear existing enemies for this room
        this.clearRoomEnemies(roomId);
        // Spawn new enemies
        spawns.forEach((spawn, index) => {
            const id = `${roomId}-${index}`;
            let enemy;
            switch (spawn.type) {
                case EnemyType.WHIRLING_DRONE:
                    enemy = new WhirlingDrone(id, spawn.x, spawn.y);
                    break;
                case EnemyType.SNAP_JUMPER:
                    enemy = new SnapJumper(id, spawn.x, spawn.y);
                    break;
                case EnemyType.ROBO_DROID:
                    enemy = new RoboDroid(id, spawn.x, spawn.y);
                    break;
                case EnemyType.SHADOW_ENFORCER:
                    enemy = new ShadowEnforcer(id, spawn.x, spawn.y);
                    break;
                default:
                    enemy = new WhirlingDrone(id, spawn.x, spawn.y);
            }
            this.enemies.set(id, enemy);
        });
    }
    /**
     * Update all enemies
     */
    update(deltaTime, player, room) {
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, player, room);
        });
    }
    /**
     * Get all active enemies
     */
    getEnemies() {
        return Array.from(this.enemies.values());
    }
    /**
     * Get enemies by type
     */
    getEnemiesByType(type) {
        return this.getEnemies().filter(e => e.type === type);
    }
    /**
     * Remove an enemy
     */
    removeEnemy(id) {
        this.enemies.delete(id);
    }
    /**
     * Clear all enemies for a room
     */
    clearRoomEnemies(roomId) {
        const prefix = `${roomId}-`;
        for (const [id] of this.enemies) {
            if (id.startsWith(prefix)) {
                this.enemies.delete(id);
            }
        }
    }
    /**
     * Clear all enemies
     */
    clearAllEnemies() {
        this.enemies.clear();
    }
    /**
     * Set difficulty level (affects enemy behavior)
     */
    setDifficulty(level) {
        // Adjust enemy speeds, detection ranges, etc.
        // Based on $0206 register logic
    }
}
export default AIController;
export { WhirlingDrone, SnapJumper, RoboDroid, ShadowEnforcer };
//# sourceMappingURL=AIController.js.map