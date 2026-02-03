/**
 * Main Game Class
 * Ties together all systems: rendering, physics, AI, audio, input
 */

import { 
  Room, Maze, MazeType, LevelColor, Direction, RoomExit,
  EnemyType, EnemySpawn, Point, ObjectType
} from './types';
import { GameState } from './state/GameState';
import { AtariRenderer } from './render/AtariRenderer';
import { AudioSystem } from './audio/AudioSystem';
import { UIManager } from './ui/UIManager';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { AIController } from './engine/AIController';
import { Player } from './entities/Player';
import { BinaryParser } from './parser/BinaryParser';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  audioContext?: AudioContext;
  initialMaze?: MazeType;
  difficulty?: 'NOVICE' | 'ADVANCED' | 'EXPERT';
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Core systems
  private renderer: AtariRenderer;
  private audio: AudioSystem;
  private ui: UIManager;
  private physics: PhysicsEngine;
  private ai: AIController;
  private gameState: GameState;
  private parser: BinaryParser;
  
  // Player
  private player: Player;
  
  // Current maze data
  private currentMaze: Maze | null = null;
  private currentRoom: Room | null = null;
  private enemies: EnemySpawn[] = [];
  
  // Game loop
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  
  // Input state
  private keys: Set<string> = new Set();
  private lastShotTime: number = 0;
  private readonly SHOT_COOLDOWN = 200; // ms
  
  constructor(config: GameConfig) {
    this.canvas = config.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
    
    // Initialize systems
    this.renderer = new AtariRenderer(this.canvas);
    this.audio = new AudioSystem(config.audioContext);
    this.ui = new UIManager(this.canvas);
    this.physics = new PhysicsEngine();
    this.ai = new AIController();
    this.parser = new BinaryParser();
    
    // Initialize game state
    this.gameState = new GameState({
      difficulty: config.difficulty || 'NOVICE',
      initialMaze: config.initialMaze || MazeType.ORIGINAL_ATARI
    });
    
    // Initialize player
    this.player = new Player(
      80, 48, // Center of room
      160, 96, // Room dimensions
      (x, y) => this.checkWallCollision(x, y),
      (exit) => this.handleRoomExit(exit)
    );
    
    // Setup input
    this.setupInput();
    
    // Generate initial maze
    this.generateMaze(config.initialMaze || MazeType.ORIGINAL_ATARI);
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
  
  /**
   * Pause/unpause the game
   */
  togglePause(): void {
    this.gameState.togglePause();
  }
  
  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.gameState.isPaused()) {
      this.update(deltaTime);
    }
    
    this.render();
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
  
  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Update player
    this.handleInput();
    this.player.update();
    
    // Update AI
    if (this.currentRoom) {
      this.ai.updateEnemies(this.currentRoom, this.player.getState(), deltaTime);
    }
    
    // Check collisions
    this.checkCollisions();
    
    // Update game state
    this.gameState.update(deltaTime);
  }
  
  /**
   * Render the game
   */
  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render current room
    if (this.currentRoom) {
      const mazeType = this.gameState.getCurrentMaze();
      const levelColor = this.gameState.getCurrentLevel();
      
      this.renderer.renderRoom(this.currentRoom, levelColor, mazeType);
    }
    
    // Render player
    this.player.render(this.ctx);
    
    // Render enemies
    this.renderEnemies();
    
    // Render HUD
    this.renderHUD();
    
    // Render pause overlay
    if (this.gameState.isPaused()) {
      this.renderPauseOverlay();
    }
  }
  
  /**
   * Handle keyboard input
   */
  private handleInput(): void {
    // Movement
    if (this.keys.has('ArrowUp') || this.keys.has('w')) {
      this.player.move(Direction.UP);
    } else if (this.keys.has('ArrowDown') || this.keys.has('s')) {
      this.player.move(Direction.DOWN);
    } else if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
      this.player.move(Direction.LEFT);
    } else if (this.keys.has('ArrowRight') || this.keys.has('d')) {
      this.player.move(Direction.RIGHT);
    } else {
      this.player.stop();
    }
    
    // Shooting
    if (this.keys.has(' ') || this.keys.has('z') || this.keys.has('x')) {
      const now = performance.now();
      if (now - this.lastShotTime > this.SHOT_COOLDOWN) {
        this.player.fire();
        this.audio.play('ion-shiv-fire');
        this.lastShotTime = now;
      }
    } else {
      this.player.releaseFire();
    }
  }
  
  /**
   * Setup keyboard event listeners
   */
  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      
      // Special keys
      if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
      
      if (e.key === 'Escape') {
        // Open maze selector
        console.log('Maze selector would open');
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }
  
  /**
   * Check wall collision at position
   */
  private checkWallCollision(x: number, y: number): boolean {
    if (!this.currentRoom) return false;
    
    // Simple grid-based collision
    const gridX = Math.floor(x / (160 / 3));
    const gridY = Math.floor(y / (96 / 3));
    
    // Check if in wall bounds
    return this.currentRoom.horizontalWalls.some(w => {
      const wx = Math.floor(w.x / (160 / 3));
      const wy = Math.floor(w.y / (96 / 3));
      return wx === gridX && wy === gridY && w.exists;
    }) || this.currentRoom.verticalWalls.some(w => {
      const wx = Math.floor(w.x / (160 / 3));
      const wy = Math.floor(w.y / (96 / 3));
      return wx === gridX && wy === gridY && w.exists;
    });
  }
  
  /**
   * Handle room exit
   */
  private handleRoomExit(exit: RoomExit): void {
    if (!this.currentRoom || !this.currentMaze) return;
    
    let nextRoomId: number | undefined;
    
    switch (exit) {
      case RoomExit.NORTH:
        nextRoomId = this.currentRoom.exits.north;
        break;
      case RoomExit.SOUTH:
        nextRoomId = this.currentRoom.exits.south;
        break;
      case RoomExit.EAST:
        nextRoomId = this.currentRoom.exits.east;
        break;
      case RoomExit.WEST:
        nextRoomId = this.currentRoom.exits.west;
        break;
    }
    
    if (nextRoomId !== undefined && nextRoomId >= 0) {
      this.loadRoom(nextRoomId);
      
      // Position player at opposite exit
      const state = this.player.getState();
      switch (exit) {
        case RoomExit.NORTH:
          this.player.reset(state.x, 88);
          break;
        case RoomExit.SOUTH:
          this.player.reset(state.x, 8);
          break;
        case RoomExit.EAST:
          this.player.reset(8, state.y);
          break;
        case RoomExit.WEST:
          this.player.reset(152, state.y);
          break;
      }
    }
  }
  
  /**
   * Generate a maze
   */
  private generateMaze(mazeType: MazeType): void {
    // For demo, generate a simple procedural maze
    // In full version, would load from binary MAP data
    
    const rooms: Room[] = [];
    
    // Generate 128 rooms
    for (let i = 0; i < 128; i++) {
      const room: Room = {
        id: i,
        horizontalWalls: [],
        verticalWalls: [],
        isCorridor: Math.random() < 0.3,
        isPodRoom: [4, 36, 68, 100].includes(i),
        exits: {
          north: i >= 16 ? i - 16 : undefined,
          south: i < 112 ? i + 16 : undefined,
          east: (i + 1) % 16 !== 0 ? i + 1 : undefined,
          west: i % 16 !== 0 ? i - 1 : undefined
        },
        cleared: false,
        visited: false,
        enemies: this.generateEnemies(i)
      };
      
      // Add some walls
      if (!room.isCorridor) {
        // Top wall
        room.horizontalWalls.push({
          x: 20, y: 10,
          type: 'solid',
          exists: Math.random() < 0.7,
          bitIndex: 0
        });
        // Bottom wall
        room.horizontalWalls.push({
          x: 20, y: 86,
          type: 'solid',
          exists: Math.random() < 0.7,
          bitIndex: 1
        });
        // Left wall
        room.verticalWalls.push({
          x: 10, y: 20,
          type: 'solid',
          exists: Math.random() < 0.7,
          bitIndex: 0
        });
        // Right wall
        room.verticalWalls.push({
          x: 150, y: 20,
          type: 'solid',
          exists: Math.random() < 0.7,
          bitIndex: 1
        });
      }
      
      // Add object to some rooms
      if (Math.random() < 0.1) {
        room.object = {
          type: [ObjectType.KEY, ObjectType.POTION, ObjectType.MYSTERY][Math.floor(Math.random() * 3)],
          color: 0xE8,
          luma: 12,
          doorClosesLeft: false,
          x: 80,
          y: 48
        };
      }
      
      rooms.push(room);
    }
    
    this.currentMaze = {
      type: mazeType,
      name: 'DEMO MAZE',
      rooms,
      podRooms: [
        { roomId: 4, barriersActive: true },
        { roomId: 36, barriersActive: true },
        { roomId: 68, barriersActive: true },
        { roomId: 100, barriersActive: true }
      ],
      levelBoundaries: {
        blackLevelEnd: 31,
        blueLevelEnd: 63,
        greenLevelEnd: 95
      },
      totalRooms: 128
    };
    
    // Load first room
    this.loadRoom(0);
  }
  
  /**
   * Generate enemies for a room
   */
  private generateEnemies(roomId: number): EnemySpawn[] {
    const enemies: EnemySpawn[] = [];
    
    // Don't spawn in starting room
    if (roomId === 0) return enemies;
    
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
      const types = [EnemyType.WHIRLING_DRONE, EnemyType.SNAP_JUMPER, EnemyType.ROBO_DROID];
      enemies.push({
        type: types[Math.floor(Math.random() * types.length)],
        x: 30 + Math.random() * 100,
        y: 20 + Math.random() * 56,
        count: 1
      });
    }
    
    return enemies;
  }
  
  /**
   * Load a room
   */
  private loadRoom(roomId: number): void {
    if (!this.currentMaze) return;
    
    this.currentRoom = this.currentMaze.rooms[roomId];
    this.currentRoom.visited = true;
    this.enemies = this.currentRoom.enemies;
    
    this.gameState.setRoom(roomId);
  }
  
  /**
   * Check collisions between player, enemies, shots, and objects
   */
  private checkCollisions(): void {
    if (!this.currentRoom) return;
    
    const playerState = this.player.getState();
    const shots = this.player.getShots();
    
    // Check shot-enemy collisions
    shots.forEach(shot => {
      this.enemies.forEach(enemy => {
        const dx = shot.x - enemy.x;
        const dy = shot.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 8) {
          shot.active = false;
          // Enemy hit - would reduce health or destroy
          this.audio.play('enemy-death');
          this.gameState.addScore(100);
        }
      });
    });
    
    // Check player-object collisions
    if (this.currentRoom.object) {
      const obj = this.currentRoom.object;
      if (obj.x && obj.y) {
        const dx = playerState.x - obj.x;
        const dy = playerState.y - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
          // Collect object
          this.audio.play('item-collect');
          
          switch (obj.type) {
            case ObjectType.KEY:
              this.player.addKey();
              this.gameState.addScore(500);
              break;
            case ObjectType.POTION:
              this.gameState.addScore(1000);
              break;
            case ObjectType.MYSTERY:
              this.gameState.addScore(2000);
              break;
          }
          
          this.currentRoom.object = undefined;
        }
      }
    }
  }
  
  /**
   * Render enemies
   */
  private renderEnemies(): void {
    this.enemies.forEach(enemy => {
      const state = this.ai.getEnemyState(enemy.type);
      
      // Simple enemy rendering
      this.ctx.fillStyle = state ? '#00ffff' : '#808080';
      this.ctx.fillRect(
        Math.floor(enemy.x) - 4,
        Math.floor(enemy.y) - 4,
        8, 8
      );
    });
  }
  
  /**
   * Render HUD
   */
  private renderHUD(): void {
    const state = this.gameState.getState();
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '10px monospace';
    
    // Score
    this.ctx.fillText(`SCORE: ${state.score}`, 5, 10);
    
    // Lives
    const playerState = this.player.getState();
    this.ctx.fillText(`LIVES: ${playerState.lives}`, 5, 22);
    
    // Keys
    this.ctx.fillText(`KEYS: ${playerState.keys}`, 5, 34);
    
    // Room info
    this.ctx.fillText(`ROOM: ${state.currentRoom}`, 110, 94);
    this.ctx.fillText(`LEVEL: ${state.currentLevel}`, 55, 94);
  }
  
  /**
   * Render pause overlay
   */
  private renderPauseOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '10px monospace';
    this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    this.ctx.textAlign = 'left';
  }
  
  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }
  
  /**
   * Get player
   */
  getPlayer(): Player {
    return this.player;
  }
}

export default Game;
