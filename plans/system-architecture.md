# Shamus+ System Architecture

## System Overview Diagram

```mermaid
flowchart TB
    subgraph DataLayer["Data Layer"]
        MAP["SHAM_A8.MAP<br/>640-byte segments"]
        ASM["Shamuspl.asm<br/>6502 Assembly"]
        PDF["New Mazes for Shamus.pdf<br/>Technical Specs"]
    end

    subgraph ParserLayer["Parser Layer"]
        BP["BinaryParser.ts<br/>MAP → JSON"]
        AD["AssemblerDecoder.ts<br/>6502 → TS Logic"]
    end

    subgraph CoreEngine["Core Engine"]
        RM["RoomManager<br/>State + Transitions"]
        PE["PhysicsEngine<br/>Collision + Movement"]
        AI["AIController<br/>Enemy Behaviors"]
        SM["StateManager<br/>Game State"]
    end

    subgraph RenderLayer["Render Layer"]
        SR["SpriteRenderer<br/>Pixel-accurate sprites"]
        AG["AtariGlow<br/>CSS/WebGL filters"]
        VW["ViewportWrapper<br/>Canvas management"]
    end

    subgraph AudioLayer["Audio Layer"]
        AS["AudioSystem<br/>Context manager"]
        AP["AtariPing<br/>Enemy shot SFX"]
        CM["C64Mute<br/>Silent mode"]
    end

    subgraph UILayer["UI Layer"]
        OS["OptionSelector<br/>Maze picker"]
        PF["PauseFunction<br/>SPACE handler"]
        HUD["HUDOverlay<br/>Score/Lives"]
    end

    MAP --> BP
    ASM --> AD
    PDF --> BP
    
    BP --> RM
    AD --> AI
    AD --> PE
    
    RM --> SM
    RM --> PE
    PE --> AI
    AI --> SM
    
    SM --> SR
    SM --> AS
    SM --> HUD
    
    SR --> AG
    AG --> VW
    
    AS --> AP
    AS --> CM
    
    OS --> SM
    PF --> SM
```

---

## Room Data Flow

```mermaid
flowchart LR
    subgraph Input["Binary Input"]
        S1["Segment 1<br/>Bits 0-5<br/>Wall Data"]
        S2["Segment 2<br/>Corridor Types"]
        S3["Segment 3<br/>Vertical Exits"]
    end

    subgraph Parse["Parse Phase"]
        CW["Decode Walls<br/>Grid Generation"]
        CC["Classify Corridors<br/>7 Types"]
        CE["Extract Exits<br/>Room IDs"]
    end

    subgraph Output["Room Object"]
        WallGrid["WallTile[][]<br/>Collision Map"]
        Corridors["Corridor[]<br/>Navigation"]
        Exits["ExitPoints<br/>Transitions"]
        Spawns["EnemySpawn[]<br/>Entities"]
    end

    S1 --> CW --> WallGrid
    S2 --> CC --> Corridors
    S3 --> CE --> Exits
    
    WallGrid --> Spawns
    Corridors --> Spawns
```

---

## AI Behavior State Machines

### Whirling Drone
```mermaid
stateDiagram-v2
    [*] --> Patrol
    Patrol --> Detect: Player in range
    Detect --> Chase: Line of sight
    Detect --> Patrol: No LoS
    Chase --> Attack: In attack range
    Chase --> Patrol: Player escaped
    Attack --> Chase: Attack cooldown
    Attack --> Patrol: Player defeated
```

### Snap Jumper
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Crouch: Player proximity
    Crouch --> Jump: Crouch complete
    Jump --> Airborne: Launch
    Airborne --> Landing: Ground contact
    Landing --> Idle: Recovery
    Landing --> Crouch: Player still near
```

### Shadow Enforcer (Atari-style)
```mermaid
stateDiagram-v2
    [*] --> Teleport
    Teleport --> Hunt: Near player
    Hunt --> DespawnItems: Every 3 seconds
    DespawnItems --> Hunt: Continue
    Hunt --> Teleport: Player escaped
```

---

## Tournament Mode Sequence

```mermaid
flowchart LR
    subgraph Tournament["ADVANCETNMT Routine"]
        START([Start]) --> H[Holmes<br/>Maze 1]
        H -->|Clear| HC{High Score?}
        HC -->|Yes| HC1[Bonus Life]
        HC -->|No| C[Cluseau<br/>Maze 2]
        HC1 --> C
        
        C -->|Clear| CC{High Score?}
        CC -->|Yes| CC1[Bonus Life]
        CC -->|No| M[Marlowe<br/>Maze 3]
        CC1 --> M
        
        M -->|Clear| MC{High Score?}
        MC -->|Yes| MC1[Bonus Life]
        MC -->|No| B[Bond<br/>Maze 4]
        MC1 --> B
        
        B -->|Clear| BC{High Score?}
        BC -->|Yes| BC1[Bonus Life]
        BC -->|No| F[Final<br/>Maze 5]
        BC1 --> F
        
        F --> VICTORY([Victory])
    end
    
    style H fill:#4a90e2
    style C fill:#4a90e2
    style M fill:#4a90e2
    style B fill:#4a90e2
    style F fill:#e74c3c
```

---

## Collision System

```mermaid
flowchart TD
    subgraph CollisionCheck["Collision Detection"]
        direction TB
        A[Entity Position] --> B{Wall?}
        B -->|Yes| C[Blocked]
        B -->|No| D{Enemy?}
        D -->|Yes| E[Combat Check]
        D -->|No| F{Item?}
        F -->|Yes| G[Collect]
        F -->|No| H[Free Movement]
        
        E --> I{Shot Type}
        I -->|ION-SHIV| J[Check Wall Penetration Bug]
        I -->|Regular| K[Normal Damage]
        
        E --> L{Hitbox Zone}
        L -->|Hat| M[Hat Gap - Miss!]
        L -->|Body| N[Hit!]
    end
```

---

## Class Hierarchy

```mermaid
classDiagram
    class BinaryParser {
        +parseMapSegment(buffer: Uint8Array): Room
        -decodeWalls(bits: number): WallTile[]
        -classifyCorridor(data: number): CorridorType
        -extractVerticalExits(segment: Uint8Array): number[]
    }

    class Room {
        +id: number
        +walls: WallTile[][]
        +corridors: Corridor[]
        +exits: ExitPoints
        +enemies: EnemySpawn[]
        +items: Item[]
        +cleared: boolean
        +isVerticalExit(): boolean
    }

    class PhysicsEngine {
        +gravity: number
        +shamusSpeed: number
        +checkCollision(entity: Entity, dx: number, dy: number): CollisionResult
        +applyHatGapCheck(shot: Projectile, enemy: Enemy): boolean
        +applyIonShivWallCheck(shot: Projectile): boolean
        +increaseSpeedAfterClear(): void
    }

    class AIController {
        +drones: WhirlingDrone[]
        +jumpers: SnapJumper[]
        +droids: RoboDroid[]
        +enforcer: ShadowEnforcer
        +update(deltaTime: number): void
        +setDifficulty(level: number): void
    }

    class Enemy {
        <<abstract>>
        +x: number
        +y: number
        +state: EnemyState
        +update(deltaTime: number): void
        +onPlayerDetected(player: Player): void
    }

    class WhirlingDrone {
        +trackingTarget: Player
        +patrolPath: Point[]
        +persistentTrack(): void
    }

    class SnapJumper {
        +jumpTimer: number
        +crouchDuration: number
        +performJump(): void
    }

    class ShadowEnforcer {
        +teleportCooldown: number
        +despawnInterval: number
        +immediateMoveTo(target: Point): void
        +despawnItems(): void
    }

    class GameState {
        +currentRoom: number
        +lives: number
        +score: number
        +tournament: TournamentState
        +shamusSpeed: number
        +difficulty: number
        +advanceTournament(): void
        +updateDifficulty(): void
    }

    class AtariRenderer {
        +canvas: HTMLCanvasElement
        +glowFilter: WebGLShader
        +renderRoom(room: Room): void
        +applyAtariGlow(): void
        +renderSprites(sprites: Sprite[]): void
    }

    class AudioSystem {
        +context: AudioContext
        +playAtariPing(): void
        +muteForC64Maze(): void
        +resumeAudio(): void
    }

    BinaryParser --> Room : creates
    Room --> PhysicsEngine : uses
    PhysicsEngine --> AIController : queries
    AIController --> Enemy : manages
    Enemy <|-- WhirlingDrone
    Enemy <|-- SnapJumper
    Enemy <|-- ShadowEnforcer
    GameState --> Room : tracks
    GameState --> AIController : configures
    AtariRenderer --> Room : renders
    AudioSystem --> GameState : responds
```

---

## Memory Map Translation

| Atari Address | Modern Equivalent | Purpose |
|---------------|-------------------|---------|
| $0206 | `difficulty: number` | slx register - scaling difficulty |
| $02xx | `shamusSpeed: number` | Speed increase after room clear |
| $03xx | `currentRoom: number` | Active room ID |
| $04xx | `lives: number` | Player lives counter |
| $05xx | `score: number` | BCD score storage → JS number |
| SHAM_A8.MAP | `Room[]` | Binary → JSON rooms |
| ADVANCETNMT | `advanceTournament()` | Tournament progression routine |

---

## File Structure (Target)

```
shamus-plus-web/
├── public/
│   ├── assets/
│   │   ├── sprites/
│   │   │   ├── shamus-atari.png
│   │   │   ├── enemies.png
│   │   │   └── items.png
│   │   └── audio/
│   │       ├── atari-ping.wav
│   │       └── c64-silent-marker.json
│   └── index.html
├── src/
│   ├── index.ts
│   ├── parser/
│   │   ├── BinaryParser.ts
│   │   ├── MapLoader.ts
│   │   └── CorridorClassifier.ts
│   ├── engine/
│   │   ├── PhysicsEngine.ts
│   │   ├── CollisionSystem.ts
│   │   └── AIController.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Enemy.ts
│   │   ├── WhirlingDrone.ts
│   │   ├── SnapJumper.ts
│   │   ├── RoboDroid.ts
│   │   └── ShadowEnforcer.ts
│   ├── state/
│   │   ├── GameState.ts
│   │   ├── TournamentMode.ts
│   │   └── RoomManager.ts
│   ├── render/
│   │   ├── AtariRenderer.ts
│   │   ├── SpriteSheet.ts
│   │   └── AtariGlow.ts
│   ├── audio/
│   │   ├── AudioSystem.ts
│   │   ├── AtariPing.ts
│   │   └── C64Mute.ts
│   ├── ui/
│   │   ├── OptionSelector.ts
│   │   ├── PauseFunction.ts
│   │   └── HUD.ts
│   └── types/
│       ├── index.ts
│       ├── Room.ts
│       ├── Enemy.ts
│       └── Game.ts
├── tests/
│   ├── parser.test.ts
│   ├── engine.test.ts
│   └── ai.test.ts
├── package.json
├── tsconfig.json
└── webpack.config.js
```
