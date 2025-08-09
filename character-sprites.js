// Character Sprite System for placing Pokémon and other characters on the map
class CharacterSpriteSystem {
    constructor(game) {
        this.game = game;
        this.sprites = [];
        this.spritesLoaded = false;
        
        // Define sprites and their positions
        // Easy to add more sprites here
        this.spriteDefinitions = [
            {
                name: 'Team Rocket Grunt',
                imagePath: 'sprites/team-rocket.png',
                gridX: 11,
                gridY: 23,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,  // Move sprite left by 4 pixels
                offsetY: -8,  // Move sprite up by 8 pixels
                blocking: true,
                interactive: true,
                dialogue: "You're not allowed in here! This area is under development."
            },
            {
                name: 'Team Rocket Grunt 2',
                imagePath: 'sprites/team-rocket.png',
                gridX: 12,
                gridY: 15,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "Team Rocket is conducting important business here. Move along!"
            },
            {
                name: 'Team Rocket Grunt 3',
                imagePath: 'sprites/team-rocket.png',
                gridX: 24,
                gridY: 15,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "This facility is off-limits to civilians!"
            },
            {
                name: 'Team Rocket Grunt 4',
                imagePath: 'sprites/team-rocket.png',
                gridX: 36,
                gridY: 7,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "Boss Giovanni wouldn't be happy to see you here!"
            },
            {
                name: 'Team Rocket Grunt 5',
                imagePath: 'sprites/team-rocket.png',
                gridX: 42,
                gridY: 7,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "We're protecting valuable assets. Keep walking!"
            },
            {
                name: 'Team Rocket Grunt 6',
                imagePath: 'sprites/team-rocket.png',
                gridX: 55,
                gridY: 16,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "Nothing to see here. Team Rocket business only!"
            },
            {
                name: 'Team Rocket Grunt 7',
                imagePath: 'sprites/team-rocket.png',
                gridX: 39,
                gridY: 15,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "Hey! You shouldn't be wandering around here!"
            },
            {
                name: 'Team Rocket Grunt 8',
                imagePath: 'sprites/team-rocket.png',
                gridX: 37,
                gridY: 25,
                width: 1,
                height: 1,
                scale: 1.52,
                offsetX: -4,
                offsetY: -8,
                blocking: true,
                interactive: true,
                dialogue: "This area is restricted. Turn back now!"
            }
            // Add more Pokemon here using the same format
        ];
        
        this.init();
    }
    
    init() {
        // Create a canvas for sprites
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'characterSpriteCanvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        this.canvas.style.zIndex = '5'; // Above background, below character (which is at z-index 10)
        
        // Insert after grid overlay but before character canvas
        const gameContainer = document.getElementById('gameContainer');
        const characterCanvas = document.getElementById('characterCanvas');
        gameContainer.insertBefore(this.canvas, characterCanvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Set canvas size
        this.resize();
        
        // Load sprite images
        this.loadSprites();
    }
    
    resize() {
        // Canvas should be the full map size, not just viewport
        this.canvas.width = this.game.MAP_WIDTH * this.game.TILE_SIZE * this.game.SCALE;
        this.canvas.height = this.game.MAP_HEIGHT * this.game.TILE_SIZE * this.game.SCALE;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    loadSprites() {
        let loadedCount = 0;
        const totalSprites = this.spriteDefinitions.length;
        
        if (totalSprites === 0) {
            this.spritesLoaded = true;
            return;
        }
        
        this.spriteDefinitions.forEach(spriteDef => {
            const sprite = {
                ...spriteDef,
                image: new Image()
            };
            
            // Load sprite from specified path or create placeholder
            if (spriteDef.imagePath) {
                // Use the specified image path
                sprite.image.src = spriteDef.imagePath;
                console.log(`Loading ${spriteDef.name} sprite from ${spriteDef.imagePath}`);
            } else {
                // Create a placeholder if no image specified
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 32;
                tempCanvas.height = 32;
                const tempCtx = tempCanvas.getContext('2d');
                
                // Draw a simple placeholder
                tempCtx.fillStyle = '#FF69B4';
                tempCtx.fillRect(0, 0, 32, 32);
                tempCtx.fillStyle = '#000';
                tempCtx.font = '10px monospace';
                tempCtx.fillText(spriteDef.name.substring(0, 3), 2, 20);
                
                sprite.image.src = tempCanvas.toDataURL();
            }
            
            sprite.image.onload = () => {
                loadedCount++;
                if (loadedCount === totalSprites) {
                    this.spritesLoaded = true;
                    console.log('All character sprites loaded');
                    // Update collision map after sprites are loaded
                    this.updateCollisionMap();
                }
            };
            
            sprite.image.onerror = () => {
                console.error(`Failed to load sprite: ${spriteDef.name}`);
                loadedCount++;
                if (loadedCount === totalSprites) {
                    this.spritesLoaded = true;
                }
            };
            
            this.sprites.push(sprite);
        });
    }
    
    updateCollisionMap() {
        // Add blocking sprites to the collision map
        if (!this.game || !this.game.collisionMap) return;
        
        this.sprites.forEach(sprite => {
            if (sprite.blocking) {
                for (let y = 0; y < sprite.height; y++) {
                    for (let x = 0; x < sprite.width; x++) {
                        const gridY = sprite.gridY + y;
                        const gridX = sprite.gridX + x;
                        if (gridY >= 0 && gridY < this.game.MAP_HEIGHT && 
                            gridX >= 0 && gridX < this.game.MAP_WIDTH) {
                            this.game.collisionMap[gridY][gridX] = 0; // Mark as blocked
                        }
                    }
                }
            }
        });
    }
    
    update() {
        // Update canvas position based on camera
        if (this.canvas) {
            this.canvas.style.transform = `translate(${-this.game.camera.x}px, ${-this.game.camera.y}px)`;
        }
    }
    
    render() {
        if (!this.spritesLoaded) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw each sprite
        this.sprites.forEach(sprite => {
            // Only draw if image is loaded
            if (!sprite.image || !sprite.image.complete || sprite.image.naturalWidth === 0) {
                return;
            }
            
            const x = sprite.gridX * this.game.TILE_SIZE * this.game.SCALE + (sprite.offsetX || 0) * this.game.SCALE;
            const y = sprite.gridY * this.game.TILE_SIZE * this.game.SCALE + (sprite.offsetY || 0) * this.game.SCALE;
            const width = sprite.width * this.game.TILE_SIZE * this.game.SCALE * (sprite.scale || 1);
            const height = sprite.height * this.game.TILE_SIZE * this.game.SCALE * (sprite.scale || 1);
            
            // Only draw if on screen
            const screenX = x - this.game.camera.x;
            const screenY = y - this.game.camera.y;
            
            if (screenX > -width && screenX < this.canvas.width &&
                screenY > -height && screenY < this.canvas.height) {
                try {
                    this.ctx.drawImage(
                        sprite.image,
                        x, y,
                        width, height
                    );
                } catch (e) {
                    console.warn('Failed to draw sprite:', sprite.name, e);
                }
            }
        });
    }
    
    checkInteraction(playerX, playerY, facing) {
        // Check if player is facing any interactive sprite
        const facingX = playerX + (facing === 'left' ? -1 : facing === 'right' ? 1 : 0);
        const facingY = playerY + (facing === 'up' ? -1 : facing === 'down' ? 1 : 0);
        
        console.log(`Checking interaction: Player at (${playerX}, ${playerY}), facing ${facing}, checking (${facingX}, ${facingY})`);
        
        for (const sprite of this.sprites) {
            if (sprite.interactive) {
                console.log(`Sprite ${sprite.name} at (${sprite.gridX}, ${sprite.gridY})`);
                // Check if facing position overlaps with sprite
                const inSpriteArea = 
                    facingX >= sprite.gridX && 
                    facingX < sprite.gridX + sprite.width &&
                    facingY >= sprite.gridY && 
                    facingY < sprite.gridY + sprite.height;
                    
                if (inSpriteArea) {
                    console.log(`Interaction found with ${sprite.name}!`);
                    return sprite;
                }
            }
        }
        return null;
    }
    
    // Method to add new sprites dynamically
    addSprite(spriteData) {
        const sprite = {
            name: spriteData.name || 'Custom Sprite',
            gridX: spriteData.gridX || 20,
            gridY: spriteData.gridY || 20,
            width: spriteData.width || 1,
            height: spriteData.height || 1,
            blocking: spriteData.blocking !== undefined ? spriteData.blocking : true,
            interactive: spriteData.interactive !== undefined ? spriteData.interactive : true,
            dialogue: spriteData.dialogue || 'This is a custom sprite!',
            image: new Image()
        };
        
        // If image data is provided as base64 or URL
        if (spriteData.imageData) {
            sprite.image.src = spriteData.imageData;
        } else if (spriteData.imageSrc) {
            sprite.image.src = spriteData.imageSrc;
        } else {
            // Create a placeholder
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 32;
            tempCanvas.height = 32;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.fillStyle = '#FF69B4';
            tempCtx.fillRect(0, 0, 32, 32);
            tempCtx.fillStyle = '#000';
            tempCtx.font = '10px monospace';
            tempCtx.fillText(sprite.name.substring(0, 3), 2, 20);
            
            sprite.image.src = tempCanvas.toDataURL();
        }
        
        sprite.image.onload = () => {
            console.log(`Custom sprite ${sprite.name} loaded`);
            // Update collision map if blocking
            if (sprite.blocking) {
                this.updateCollisionMap();
            }
        };
        
        this.sprites.push(sprite);
        return sprite;
    }
}

// Export for use in main game
window.CharacterSpriteSystem = CharacterSpriteSystem;