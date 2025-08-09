# Deployment Analysis - MAMV Ventures Portfolio

## Files Required for Production

### Core HTML & JavaScript Files
✅ **index.html** - Main entry point
✅ **new-game.js** - Main game engine (hardcoded collision map & zones)
✅ **character-sprites.js** - NPC sprite management (Team Rocket grunts)
✅ **styles.css** - Main stylesheet (embedded in index.html)

### Image Assets Required
✅ **pokemon-town-merged.png** - Main background with buildings merged
✅ **player-sprite.png** - Player character sprite sheet
✅ **sprites/team-rocket.png** - Team Rocket NPC sprites
✅ **mamv-logo.png** - MAMV Ventures logo for modal
✅ **genhealth-logo.png** - GenHealth.ai logo for modal
✅ **subagents-logo.png** - Sub-Agents.ai logo for modal
✅ **favicon.ico** - Browser favicon
✅ **favicon.png** - 32x32 favicon
✅ **favicon-16.png** - 16x16 favicon

### Audio Assets
✅ **pokemon-music.mp3** - Background music

### Documentation Files (Optional for repo)
- **CLAUDE.md** - Development instructions
- **SPRITE_GUIDE.md** - Sprite sourcing guide

## Files NOT Needed (Development/Testing Only)

### Development/Testing HTML Files (54 files)
❌ add-interaction-73-15.html
❌ apply-exported-positions.html
❌ apply-position-fix.html
❌ building-editor.html
❌ cache-diagnostic.html
❌ check-localstorage.html
❌ check-origin.html
❌ clear-building-storage.html
❌ clear-buildings.html
❌ clear-zones.html
❌ collision-editor.html
❌ create-subagents-logo.html
❌ debug-buildings.html
❌ debug-localStorage.html
❌ debug-sync.html
❌ drag-merge.html
❌ fix-building-sync.html
❌ fix-buildings-now.html
❌ fix-npc-zones.html
❌ fix-sync-issue.html
❌ force-buildings-ingame.html
❌ force-fix.html
❌ force-reload-buildings.html
❌ force-update-buildings.html
❌ index-backup.html
❌ index-loader.html
❌ inspect-buildings.html
❌ merge-buildings.html
❌ new-index.html
❌ reset-to-editor.html
❌ setup-images.html
❌ simple-merge.html
❌ sprite-test.html
❌ sync-buildings.html
❌ sync-test.html
❌ test-buildings.html
❌ test-cache.html
❌ test-positions.html
❌ test-sync-fix.html
❌ tree-test.html

### Unused JavaScript Files
❌ add-building-overlay.js - Old building system
❌ add-npc-dialogue.js - Old NPC system
❌ cache-bust.js - Development utility
❌ emerald-exact-map.js - Test map data
❌ emerald-exact-sprites.js - Test sprites
❌ emerald-sprites.js - Test sprites
❌ final-perfect-tree.js - Test data
❌ game.js - Old game engine
❌ hardcoded-map-data.js - Old map approach
❌ high-quality-player.js - Test player
❌ perfect-emerald-tree.js - Test data
❌ perfect-tree.js - Test data
❌ player-sprite.js - Old player system
❌ script.js - Old scripts
❌ sprites.js - Old sprite system
❌ tilemap-emerald.js - Test tilemap
❌ tilemap.js - Old tilemap

### Unused Image Assets
❌ custom-building.png - Test asset
❌ genhealth-building.png - Old building overlay
❌ mamv-ventures-building.png - Old building overlay
❌ pokemon-town.png - Unmerged background
❌ pokemon-town-grid.png - Development grid
❌ real-snorlax.png - Test sprite
❌ snorlax-sprite.png - Test sprite
❌ snorlax-transparent.png - Test sprite
❌ snorlax.png - Test sprite
❌ sub-agents-building.png - Old building overlay

### Server Files (Not needed for static hosting)
❌ dev-server.py
❌ server.py
❌ start-dev-server.sh

### Other Files
❌ collison-map-manual-save.txt - Backup data

## Key Architectural Decisions

1. **Hardcoded Data**: All collision maps and interactive zones are hardcoded in `new-game.js` - NO localStorage dependencies
2. **Merged Background**: Buildings are pre-merged into `pokemon-town-merged.png` - no dynamic overlays
3. **Simple Asset Loading**: Direct image paths, no complex loaders
4. **Walk-over vs Spacebar**: Buildings trigger on walk-over, NPCs on spacebar

## Deployment Checklist

### Required Files Structure:
```
/
├── index.html
├── new-game.js
├── character-sprites.js
├── pokemon-town-merged.png
├── player-sprite.png
├── mamv-logo.png
├── genhealth-logo.png
├── subagents-logo.png
├── pokemon-music.mp3
├── favicon.ico
├── favicon.png
├── favicon-16.png
└── sprites/
    └── team-rocket.png
```

### Total Files Needed: 14 files (+ 2 optional docs)
### Files to Remove: 70+ development files

## Performance Notes

- All critical assets are loaded with cache-busting in production
- No localStorage reads/writes during gameplay
- Single merged background image reduces HTTP requests
- Sprites are preloaded before game starts

## Browser Compatibility

- Requires modern browser with ES6 support
- Canvas API for rendering
- Audio element for background music
- CSS Grid and Flexbox for modals

## Deployment Commands

```bash
# Create deployment folder with only needed files
mkdir mamv-portfolio-deploy
cp index.html new-game.js character-sprites.js mamv-portfolio-deploy/
cp pokemon-town-merged.png player-sprite.png mamv-portfolio-deploy/
cp mamv-logo.png genhealth-logo.png subagents-logo.png mamv-portfolio-deploy/
cp pokemon-music.mp3 favicon.ico favicon.png favicon-16.png mamv-portfolio-deploy/
mkdir mamv-portfolio-deploy/sprites
cp sprites/team-rocket.png mamv-portfolio-deploy/sprites/
```

## Testing Deployment

1. Open index.html in browser
2. Verify player movement with arrow keys/WASD
3. Test building interactions (MAMV, GenHealth, Sub-Agents)
4. Test all 19 NPCs respond to spacebar
5. Test "Coming Soon" modal at position 23,24
6. Verify Team Rocket grunts block paths
7. Test music toggle
8. Check all modals display correctly