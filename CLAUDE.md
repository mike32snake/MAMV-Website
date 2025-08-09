# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive Pokémon-style portfolio website built as a browser-based game. Users navigate a character around a town map, interacting with buildings and NPCs to discover portfolio information presented in a gamified format.

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Assets**: PNG sprites, custom pixel art
- **Audio**: Background music with toggle controls
- **Storage**: localStorage for collision maps and game state

## Key Architecture

### Core Game Engine (`new-game.js`)
- **PokemonPortfolio** class: Main game controller
- Tile-based movement system (16px tiles, 3x scale)
- Camera following with viewport boundaries
- Collision detection using grid-based maps
- Interactive zone system for building/NPC interactions

### Sprite Systems
- **CharacterSpriteSystem** (`character-sprites.js`): Manages NPCs and Pokémon placement
- Player sprite with directional animations (up/down/left/right)
- Support for both static and animated sprites

### Map & Collision System
- 80x40 tile grid (1280x640 base resolution)
- Collision map stored in localStorage
- Visual collision editor (`collision-editor.html`) for map design
- Interactive zones with walk-over and spacebar triggers

### UI Components
- Modal system for building interactions
- Pokémon-style text boxes for dialogue
- Trainer card display with badge system
- Fade transitions between scenes

## Development Commands

```bash
# Run locally (no build process needed - vanilla JS)
# Simply open index.html in a browser or use a local server:
python3 -m http.server 8000
# Then navigate to http://localhost:8000

# For live reload during development:
npx live-server
```

## Common Development Tasks

### Adding New NPCs/Pokémon
Edit `character-sprites.js` spriteDefinitions array:
```javascript
{
    name: 'Pikachu',
    imagePath: 'sprites/pikachu.png',
    gridX: 25,  // X position on grid
    gridY: 15,  // Y position on grid
    width: 1,   // Tiles wide
    height: 1,  // Tiles tall
    blocking: false,
    interactive: true,
    dialogue: "Pika pika!"
}
```

### Creating Interactive Zones
Use the collision editor at `collision-editor.html`:
1. Open in browser
2. Draw walkable (green) and blocked (red) areas
3. Create interactive zones with custom content
4. Export and save to localStorage

### Modifying Building Interactions
Interactive zones are stored in localStorage. Each zone has:
- Grid coordinates (x, y, width, height)
- Trigger type (walk-over or spacebar)
- Modal content (HTML for display)
- Entry position for player placement

## Asset Management

### Sprite Sources
- Player sprites: 32x32px base, scaled 3x
- NPC sprites: Various sizes, typically 16-32px
- Background: `pokemon-town.png` (1280x640)
- See `SPRITE_GUIDE.md` for detailed sprite sourcing instructions

### Adding Sprites
1. Save to `/sprites/` directory
2. Ensure transparent background (PNG format)
3. Reference in `character-sprites.js`

## Key Files Reference

- `index.html`: Main game page
- `new-game.js`: Core game engine
- `character-sprites.js`: NPC/sprite management
- `collision-editor.html`: Visual map editor tool
- `SPRITE_GUIDE.md`: Sprite sourcing documentation

## Debugging

- Press 'G' to toggle debug grid (if enabled)
- Check localStorage for saved collision maps
- Console logs sprite loading status
- Use collision editor to visualize walkable areas

## Performance Considerations

- Canvas rendering optimized with pixelated image-rendering
- Sprites loaded once and cached
- Movement uses requestAnimationFrame for smooth 60fps
- Audio volume set to 30% to avoid overwhelming users