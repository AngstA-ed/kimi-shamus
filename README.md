# Shamus+ Web Port

High-fidelity TypeScript/JavaScript port of Shamus+ (2017 Atari 8-bit patch of the 1982 classic), featuring the C64 maze conversions by slx.

## Project Overview

This project translates the binary data structures and 6502 assembly logic of the original Atari game into a modern, modular web application while preserving the authentic "Atari Aesthetic."

## Architecture

### Source Materials Analyzed
- **New Mazes for Shamus.pdf** - Complete technical specification for binary memory segments
- **Shamuspl.asm** - 6502 assembly source with ADVANCETNMT routine and $0206 speed patch
- **SHAM_A8.MAP** - Binary map data (640-byte segments)

### Core Components Implemented

#### 1. TypeScript Types (`src/types/index.ts`)
- **Room** interface with wall grids and corridor types
- **Enemy** union types for AI behaviors
- **GameState** with tournament logic and 6502 memory mapping
- **7 Corridor Types** (Atari variants from PDF page 856-874)

#### 2. Binary Parser (`src/parser/BinaryParser.ts`)
Converts 640-byte MAP segments into playable JSON room layouts:
- **Segment 1** ($23F2): Horizontal walls + corridor flags (bits 0-5 walls, bit 7 corridor, bits 4-6 type)
- **Segment 2** ($2472): Vertical walls + vertical exits
- **Segment 3** ($1D43): Objects (key, potion, mystery, Shadow)
- **Segment 4** ($1DC3): Colors + door positions
- **Segment 5**: Pod room list + level boundaries

#### 3. Game State (`src/state/GameState.ts`)
- **Tournament Mode** (ADVANCETNMT): Holmes → Cluseau → Marlowe → Bond sequence
- **$0206 Speed Control**: slx patch fixes negative speed bug
- **Room clear speed increase**: Atari-specific behavior

#### 4. Physics Engine (`src/engine/PhysicsEngine.ts`)
- **"Hat Gap" hitbox**: Shots pass between Shamus's hat and head
- **ION-SHIV wall penetration**: Atari bug/feature preserved
- **Electrocuting wall collisions**

#### 5. AI Controller (`src/engine/AIController.ts`)
- **Whirling Drone**: Persistent tracking behavior
- **Snap Jumper**: Crouch → jump pattern
- **Robo Droid**: Patrol + aggro state machine
- **Shadow Enforcer**: Immediate movement, item despawn

## Atari-Specific Behaviors Preserved

1. **Hat Gap** - Projectiles pass through gap between hat and head
2. **ION-SHIV Wall Penetration** - Can kill enemies touching walls
3. **Speed Increase After Room Clear** - Shamus walks faster after defeating enemies
4. **Shadow Enforcer** - Instant movement, items despawn when Shadow appears
5. **slx $0206 Patch** - Prevents game slowdown from negative speed values

## Memory Map Translation

| 6502 Address | TypeScript Equivalent | Purpose |
|--------------|----------------------|---------|
| $0206 | `gameState.shamusSpeed` | Delay loop counter (slx patch) |
| $0202 | `gameState.lives` | Lives counter |
| $23F2 | `room.horizontalWalls` | Segment 1: Horizontal walls |
| $2472 | `room.verticalWalls` | Segment 2: Vertical walls |
| $1D43 | `room.object` | Segment 3: Objects |
| $1DC3 | `room.object.color` | Segment 4: Colors |
| $1EE3 | `maze.podRooms` | Segment 5: Pod rooms |

## Corridor Types (7 Atari Variants)

```
$80 = DEAD_END_BOTTOM
$90 = BOTTOM_TO_RIGHT
$A0 = BOTTOM_TO_LEFT
$B0 = T_BOTTOM_EXIT
$C0 = DEAD_END_TOP
$D0 = TOP_TO_RIGHT
$E0 = TOP_TO_LEFT
$F0 = T_TOP_EXIT
```

## Project Structure

```
src/
├── types/index.ts              # Core TypeScript interfaces + enums
├── parser/BinaryParser.ts      # 640-byte MAP → JSON conversion
├── state/GameState.ts          # Tournament mode, $0206 speed control
├── engine/PhysicsEngine.ts     # Collision with Hat Gap + ION-SHIV quirks
├── engine/AIController.ts      # 4 enemy AI types
├── render/AtariRenderer.ts     # Canvas renderer with Atari Glow
├── render/AtariGlow.ts         # Pulsating wall effects
├── audio/AudioSystem.ts        # Atari ping, C64 silence mode
├── ui/UIManager.ts             # OPTION selector, SPACE pause
├── entities/Player.ts          # Player entity with shooting
├── Game.ts                     # Main game orchestrator
└── index.ts                    # Module exports

tests/
├── BinaryParser.test.ts        # 29 tests for parser
└── GameState.test.ts           # 24 tests for game state

plans/
├── shamus-plus-refactor-plan.md    # High-level architecture
├── system-architecture.md          # System diagrams
├── typescript-interfaces.md        # Type definitions
├── binary-parser-spec.md           # Parser specification
├── implementation-roadmap.md       # Implementation plan
└── visual-research-atari-aesthetic.md  # Visual analysis

.github/workflows/
└── deploy.yml                  # GitHub Pages auto-deployment

index.html                      # Main entry (GitHub Pages)
demo.html                       # Standalone playable demo
atari-screenshot-1.png          # Visual reference
```

## Live Demo

**Play online:** https://yourusername.github.io/shamus-plus-web

Or open `index.html` locally in any modern browser.

## Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests (53 tests passing)
npm test

# Development watch mode
npm run dev

# Serve locally
npm run serve
```

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages.

### Setup

1. **Create a GitHub repository** and push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/shamus-plus-web.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Click Save

3. **Update homepage URL:**
   - Edit `package.json` and replace `yourusername` with your GitHub username

4. **Automatic Deployment:**
   - The GitHub Action in `.github/workflows/deploy.yml` will deploy on every push to main
   - Visit `https://YOUR_USERNAME.github.io/shamus-plus-web`

## Usage

### Play the Demo
Open `index.html` or `demo.html` in a browser:
- **Arrow Keys / WASD** - Move
- **SPACE / Z** - Shoot
- **P** - Pause

### TypeScript API
```typescript
import { BinaryParser, GameState, MazeType } from './src';

// Parse binary MAP data
const parser = new BinaryParser();
const mazeData = new Uint8Array(640); // Your 640-byte segment
const room = parser.parseRoom(mazeData, 0);

// Initialize game state
const gameState = new GameState('NOVICE');
gameState.startTournament();
```

## Credits

- **William Mataga** - Original Shamus (1982)
- **slx** - Shamus+ patch and C64 maze conversion (2017)
- **Jack L. Thornton, Jr.** - C64 level design

## License

MIT License - See original README.TXT for full copyright information.
