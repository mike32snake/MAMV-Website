// New Game System - Background Image with Grid Overlay
class PokemonPortfolio {
    constructor() {
        // Configuration
        this.TILE_SIZE = 16; // Size of each grid square
        this.SCALE = 2.0; // Scale factor for display - zoomed out 25% from 2.66
        this.MAP_WIDTH = 80; // Width in tiles (based on the image)
        this.MAP_HEIGHT = 40; // Height in tiles
        
        // Get elements
        this.backgroundImg = document.getElementById('backgroundImage');
        this.gridOverlay = document.getElementById('gridOverlay');
        this.characterCanvas = document.getElementById('characterCanvas');
        this.animationCanvas = document.getElementById('animationCanvas');
        this.buildingInfo = document.getElementById('buildingInfo');
        
        // Contexts
        this.charCtx = this.characterCanvas.getContext('2d');
        this.animCtx = this.animationCanvas.getContext('2d');
        
        // Player state - start in the center of town (between buildings)
        this.player = {
            gridX: 35, // Starting position in grid (center path)
            gridY: 17, // Starting position (main road area) - shifted up by 1
            pixelX: 35 * this.TILE_SIZE * this.SCALE,
            pixelY: 17 * this.TILE_SIZE * this.SCALE,
            facing: 'down',
            isMoving: false,
            moveProgress: 0,
            speed: 6, // pixels per frame (increased for smoother movement)
            sprite: null,
            spriteLoaded: false
        };
        
        // Camera
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Input
        this.keys = {};
        this.debugMode = false;
        
        // Load interactive zones from localStorage
        this.interactiveZones = [];
        this.loadInteractiveZones();
        
        // Buildings are now part of the background image
        // Interactions are defined through the collision editor only
        this.buildings = [];
        
        this.animations = [];
        this.animationTime = 0;
        this.currentZone = null;
        
        // Define walkable areas (1 = walkable, 0 = blocked)
        // This is a simplified collision map - you can make it more detailed
        this.collisionMap = this.generateCollisionMap();
        
        // Character sprite system
        this.characterSprites = null;
        
        // Building overlays
        this.buildingOverlays = [];
        
        this.init();
    }
    
    init() {
        // Buildings are now merged into the background image
        // No need for overlay system anymore
        this.buildingOverlays = [];
        // this.loadBuildingOverlays(); // DISABLED - buildings in background
        // this.setupBuildingUpdateListener(); // DISABLED - no dynamic buildings
        
        // Set up the background image
        this.setupBackground();
        
        // Set up canvases
        this.setupCanvases();
        
        // Set up grid overlay
        this.setupGrid();
        
        // Set up controls
        this.setupControls();
        
        // Load player sprite
        this.loadPlayerSprite();
        
        // Initialize character sprite system
        if (window.CharacterSpriteSystem) {
            this.characterSprites = new CharacterSpriteSystem(this);
        }
        
        // Start game loop
        this.gameLoop();
    }
    
    setupBackground() {
        // Use the Pokemon town screenshot as background
        // Using a data URL or you can host the image
        this.backgroundImg.src = 'pokemon-town-merged.png'; // Merged background with buildings
        this.backgroundImg.style.width = (this.MAP_WIDTH * this.TILE_SIZE * this.SCALE) + 'px';
        this.backgroundImg.style.height = (this.MAP_HEIGHT * this.TILE_SIZE * this.SCALE) + 'px';
        
        this.backgroundImg.onerror = () => {
            // Fallback to a colored background if image doesn't load
            console.log('Image not found, using fallback background');
            this.createFallbackBackground();
        };
        
        this.backgroundImg.onload = () => {
            this.updateCamera();
        };
    }
    
    createFallbackBackground() {
        // Create a canvas-based fallback that looks like the Pokemon town
        const canvas = document.createElement('canvas');
        canvas.width = this.MAP_WIDTH * this.TILE_SIZE * this.SCALE;
        canvas.height = this.MAP_HEIGHT * this.TILE_SIZE * this.SCALE;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple town layout
        // Grass background
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add paths
        ctx.fillStyle = '#D4A76A';
        ctx.fillRect(canvas.width * 0.3, 0, canvas.width * 0.4, canvas.height);
        ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.2);
        
        // Add water
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(0, 0, canvas.width * 0.1, canvas.height);
        ctx.fillRect(canvas.width * 0.9, 0, canvas.width * 0.1, canvas.height);
        
        // Add some buildings
        const buildings = [
            {x: 0.2, y: 0.2, w: 0.08, h: 0.06, color: '#FF5722'},
            {x: 0.4, y: 0.2, w: 0.08, h: 0.06, color: '#3F51B5'},
            {x: 0.6, y: 0.2, w: 0.08, h: 0.06, color: '#00BCD4'},
            {x: 0.3, y: 0.5, w: 0.08, h: 0.06, color: '#FF9800'},
            {x: 0.5, y: 0.5, w: 0.08, h: 0.06, color: '#9C27B0'},
        ];
        
        buildings.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(
                canvas.width * b.x,
                canvas.height * b.y,
                canvas.width * b.w,
                canvas.height * b.h
            );
            // Add roof
            ctx.fillStyle = '#333';
            ctx.fillRect(
                canvas.width * b.x,
                canvas.height * b.y,
                canvas.width * b.w,
                canvas.height * b.h * 0.3
            );
        });
        
        // Convert canvas to image
        this.backgroundImg.src = canvas.toDataURL();
    }
    
    setupCanvases() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Character canvas
        this.characterCanvas.width = width;
        this.characterCanvas.height = height;
        this.charCtx.imageSmoothingEnabled = false;
        
        // Animation canvas
        this.animationCanvas.width = width;
        this.animationCanvas.height = height;
        this.animCtx.imageSmoothingEnabled = false;
    }
    
    setupGrid() {
        const width = this.MAP_WIDTH * this.TILE_SIZE * this.SCALE;
        const height = this.MAP_HEIGHT * this.TILE_SIZE * this.SCALE;
        
        this.gridOverlay.setAttribute('width', width);
        this.gridOverlay.setAttribute('height', height);
        this.gridOverlay.style.width = width + 'px';
        this.gridOverlay.style.height = height + 'px';
        
        this.drawGrid();
    }
    
    drawGrid() {
        // Clear existing grid
        this.gridOverlay.innerHTML = '';
        
        if (!this.debugMode) return;
        
        const tileSize = this.TILE_SIZE * this.SCALE;
        
        // Draw grid lines
        for (let x = 0; x <= this.MAP_WIDTH; x++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x * tileSize);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x * tileSize);
            line.setAttribute('y2', this.MAP_HEIGHT * tileSize);
            line.setAttribute('class', 'debug-grid');
            this.gridOverlay.appendChild(line);
        }
        
        for (let y = 0; y <= this.MAP_HEIGHT; y++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y * tileSize);
            line.setAttribute('x2', this.MAP_WIDTH * tileSize);
            line.setAttribute('y2', y * tileSize);
            line.setAttribute('class', 'debug-grid');
            this.gridOverlay.appendChild(line);
        }
        
        // Draw walkable/blocked areas
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x * tileSize);
                rect.setAttribute('y', y * tileSize);
                rect.setAttribute('width', tileSize);
                rect.setAttribute('height', tileSize);
                rect.setAttribute('class', this.collisionMap[y][x] ? 'walkable' : 'blocked');
                this.gridOverlay.appendChild(rect);
            }
        }
    }
    
    loadInteractiveZones() {
        // HARDCODED INTERACTIVE ZONES - No localStorage
        this.interactiveZones = this.getHardcodedInteractiveZones();
        console.log('Loaded', this.interactiveZones.length, 'hardcoded interactive zones');
    }
    
    ensureNPCDialogue() {
        // Always update zones to ensure latest content
        // Remove old NPC zones first
        this.interactiveZones = this.interactiveZones.filter(zone => !zone.isNPC && zone.name !== 'MAMV Ventures Building');
        
        // Add NPC dialogue zones at the exact coordinates specified
        const npcZones = [
            {
                tiles: [{x: 27, y: 6}, {x: 28, y: 6}],
                title: "MAMV Ventures",
                content: `
                    <div style="text-align: center; padding: 10px;">
                        <h2 style="color: #4A90E2; margin-bottom: 20px;">MAMV Ventures</h2>
                        <div class="hovering-logo" style="margin-bottom: 20px;">
                            <img src="https://mamv.co/assets/images/image02.png?v=144d8a42" alt="MAMV Ventures" style="width: 300px; height: auto; border-radius: 8px; filter: invert(1);">
                        </div>
                        <p style="font-size: 20px; margin-bottom: 15px; color: #FFD700;">
                            Building & Scaling Tomorrow's Start Ups & Leaders
                        </p>
                        
                        <div style="margin: 20px 0; padding: 15px; background: rgba(255, 215, 0, 0.1); border-radius: 8px;">
                            <p style="font-weight: bold; margin-bottom: 10px;">Mike Maseda - Former Founder & Operator</p>
                            <p style="margin-bottom: 10px; font-size: 14px;">
                                Startup growth expert specializing in rapid scaling and operational excellence
                            </p>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background: rgba(74, 144, 226, 0.1); border-radius: 8px;">
                            <p style="font-weight: bold;">Track Record:</p>
                            <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 14px;">
                                <li><strong>VC/PE Experience</strong> - Worked across 3 VC/PE backed startups</li>
                                <li><strong>Hold Co Operations</strong> - Previously managed operations across 5 businesses</li>
                                <li><strong>Team Building</strong> - Recruited and led high-performance teams</li>
                                <li><strong>Market Research</strong> - Strategic insights for healthcare organizations</li>
                                <li><strong>Operational Excellence</strong> - Streamlined processes across portfolio</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 15px; padding: 12px; background: rgba(0, 255, 0, 0.05); border-radius: 8px;">
                            <p style="font-size: 13px; color: #2d7a2d; font-weight: bold;">Current Focus:</p>
                            <p style="font-size: 12px; margin-top: 5px;">
                                Helping startups build, scale, and achieve sustainable growth through strategic operations and go-to-market excellence
                            </p>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 12px;">
                            <a href="mailto:mike@mamv.co" style="color: #306850; text-decoration: underline; font-weight: bold;">Contact Us</a>
                        </p>
                    </div>
                `,
                triggerType: 'walk-over',
                isNPC: false,
                name: "MAMV Ventures Building",
                entryX: 27,
                entryY: 7
            },
            {
                tiles: [{x: 11, y: 6}, {x: 12, y: 6}],
                title: "GenHealth.ai",
                content: `
                    <div style="text-align: center; padding: 10px;">
                        <h2 style="color: #8B5CF6; margin-bottom: 20px;">GenHealth.ai</h2>
                        
                        <div class="hovering-logo" style="margin-bottom: 20px;">
                            <a href="https://genhealth.ai/" target="_blank" style="text-decoration: none;">
                                <img src="genhealth-logo.png" alt="GenHealth.ai" style="width: 350px; height: auto; border-radius: 8px; cursor: pointer;">
                            </a>
                        </div>
                        
                        <p style="font-size: 20px; margin-bottom: 15px; color: #8B5CF6; font-weight: bold;">
                            Revolutionizing Healthcare with AI-Powered Automation
                        </p>
                        
                        <div style="margin: 20px 0; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
                            <p style="font-weight: bold; margin-bottom: 10px;">Head of Sales & Operations</p>
                            <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                                <li><strong>GTM Strategy</strong> - Built entire go-to-market motion from zero</li>
                                <li><strong>Enterprise Sales</strong> - Closing major DME suppliers and health systems</li>
                                <li><strong>Operational Excellence</strong> - Streamlining all internal processes</li>
                                <li><strong>Team Building</strong> - Recruiting and developing top-tier talent</li>
                                <li><strong>Partner Network</strong> - Strategic alliances with payers and providers</li>
                            </ul>
                            <p style="font-size: 13px; color: #8B5CF6; font-weight: bold; margin-top: 15px;">Mission:</p>
                            <p style="font-size: 12px; margin-top: 5px;">
                                Eliminating 90% of healthcare admin burden through AI-powered automation
                            </p>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background: rgba(74, 144, 226, 0.1); border-radius: 8px;">
                            <p style="font-weight: bold;">What We're Building:</p>
                            <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 14px;">
                                <li><strong>DME Intake Automation</strong> - Eliminating manual data entry for durable medical equipment orders</li>
                                <li><strong>AI Prior Auth</strong> - Automating insurance approvals in minutes, not days</li>
                                <li><strong>Smart Document Processing</strong> - OCR + AI for instant medical record extraction</li>
                                <li><strong>Payer Integration</strong> - Seamless connectivity with insurance systems</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 12px;">
                            <a href="https://genhealth.ai/" target="_blank" style="color: #306850; text-decoration: underline; font-weight: bold;">Learn More</a>
                        </p>
                    </div>
                `,
                triggerType: 'walk-over',
                isNPC: false,
                name: "GenHealth.ai Building",
                entryX: 11,
                entryY: 7
            },
            {
                tiles: [{x: 12, y: 32}, {x: 13, y: 32}],
                title: "Sub-Agents.ai",
                content: `
                    <div style="text-align: center; padding: 10px;">
                        <h2 style="color: #00D4FF; margin-bottom: 20px;">Sub-Agents.ai</h2>
                        
                        <div class="hovering-logo" style="margin-bottom: 20px;">
                            <a href="https://sub-agents.ai/" target="_blank" style="text-decoration: none; display: inline-block;">
                                <img src="subagents-logo.png" alt="Sub-Agents.ai" style="width: 350px; height: auto; cursor: pointer; display: block;">
                            </a>
                        </div>
                        
                        <p style="font-size: 20px; margin-bottom: 15px; color: #00D4FF; font-weight: bold;">
                            Your Sub-Agent Database
                        </p>
                        
                        <p style="font-size: 14px; margin-bottom: 20px; color: #888;">
                            Access hundreds of carefully crafted .md templates and configurations to quickly<br>
                            setup specialized Sub-Agents for your specific use cases.
                        </p>
                        
                        <div style="margin: 20px 0; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                            <p style="font-weight: bold; margin-bottom: 10px;">Expert Templates</p>
                            <p style="font-size: 12px; margin-bottom: 10px;">Curated .md files with proven Sub-Agent configurations for specific domains and use cases.</p>
                            <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                                <li><strong>Domain-specific setups</strong> - Tailored for your industry or field</li>
                                <li><strong>Battle-tested configs</strong> - Proven to work in production environments</li>
                                <li><strong>Expert-crafted prompts</strong> - Written by AI engineering professionals</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 15px; padding: 15px; background: rgba(0, 255, 0, 0.05); border-radius: 8px;">
                            <p style="font-weight: bold; color: #2d7a2d; margin-bottom: 10px;">Ready-to-Use Configs</p>
                            <p style="font-size: 12px; margin-bottom: 10px;">Pre-configured .md templates that you can immediately use to setup your Sub-Agents.</p>
                            <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                                <li><strong>Instant implementation</strong> - Start using agents in minutes</li>
                                <li><strong>No setup required</strong> - Pre-configured for immediate deployment</li>
                                <li><strong>Copy-paste ready</strong> - Drop directly into your workflow</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 12px;">
                            <a href="https://sub-agents.ai/" target="_blank" style="color: #306850; text-decoration: underline; font-weight: bold;">Learn More</a>
                        </p>
                    </div>
                `,
                triggerType: 'walk-over',
                isNPC: false,
                name: "Sub-Agents.ai Building",
                entryX: 12,
                entryY: 33
            },
            {
                tiles: [{x: 73, y: 15}],
                content: "A wild Snorlax was here earlier... It ate all the berries, took a nap, and left a bad Yelp review about the lack of snacks!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Mysterious Voice"
            },
            {
                tiles: [{x: 16, y: 9}],
                content: "Welcome to our town! Did you know Claude is helping revolutionize healthcare? GenHealth.ai uses AI to automate prior authorizations!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Town Greeter"
            },
            {
                tiles: [{x: 15, y: 18}],
                content: "I used ChatGPT for my fantasy football draft... big mistake. It suggested players from 2019. Claude actually knows current rosters!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Fantasy Football Fan"
            },
            {
                tiles: [{x: 21, y: 15}],
                content: "My medical supply company switched to GenHealth's DME automation. What used to take 3 hours now takes 3 minutes. It's super effective!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Business Owner"
            },
            {
                tiles: [{x: 38, y: 9}],
                content: "The Pokémon Center uses AI now! Just like how GenHealth.ai streamlines DME intake - healing people AND processes!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Nurse Joy's Assistant"
            },
            {
                tiles: [{x: 32, y: 20}],
                content: "Fun fact: Claude can analyze an entire season of fantasy football stats in seconds. My team 'The Snorlax Squad' is crushing it!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Stats Nerd"
            },
            {
                tiles: [{x: 16, y: 23}],
                content: "This mart uses AI for inventory now! Speaking of AI, have you tried Claude? It's like having a Psychic-type Pokémon for your brain!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Mart Customer"
            },
            {
                tiles: [{x: 50, y: 7}],
                content: "I work in healthcare billing. GenHealth.ai's DME automation is saving us thousands of hours per month. The future is here!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Healthcare Worker"
            },
            {
                tiles: [{x: 57, y: 17}],
                content: "ChatGPT is good for basic stuff, but Claude? That's what the pros use. Especially for healthcare and fantasy sports analysis!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "AI Enthusiast"
            },
            {
                tiles: [{x: 41, y: 25}],
                content: "Did you hear? Hospitals using GenHealth's AI are processing claims 10x faster. It's like they used a Rare Candy on their workflow!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Hospital Admin"
            },
            {
                tiles: [{x: 40, y: 25}],
                content: "I manage a fantasy football league with 20 teams. Claude helps me generate weekly power rankings and injury reports. Total game changer!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "League Commissioner"
            },
            {
                tiles: [{x: 35, y: 27}],
                content: "The beach is nice, but you know what's nicer? Not spending 6 hours on prior authorizations. Thanks GenHealth.ai!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Beach Goer"
            },
            {
                tiles: [{x: 28, y: 28}],
                content: "Pro tip: Use Claude for complex healthcare questions and GenHealth.ai for automating the boring stuff. It's like having the ultimate Pokémon team!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Tech Enthusiast"
            },
            {
                tiles: [{x: 16, y: 34}],
                content: "The lake is so peaceful... Unlike healthcare paperwork! Good thing GenHealth is automating all that administrative nightmare.",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Fisherman"
            },
            {
                tiles: [{x: 16, y: 35}],
                content: "I've been using Claude to help analyze my business metrics. It's like having a data scientist on demand, but way more affordable!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Entrepreneur"
            },
            {
                tiles: [{x: 16, y: 25}],
                content: "I asked both ChatGPT and Claude about injury reports for fantasy football. Claude understood context way better - it knew 'questionable' doesn't mean the player is questioning life!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Sports Analyst"
            },
            {
                tiles: [{x: 34, y: 37}],
                content: "As a doctor, I love that GenHealth.ai handles insurance paperwork. More time for patients, less time fighting with forms!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Doctor"
            },
            {
                tiles: [{x: 35, y: 37}],
                content: "I run a DME company. GenHealth's automation reduced our claim denials by 75%. It's like evolving from Magikarp to Gyarados overnight!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "DME Owner"
            },
            {
                tiles: [{x: 73, y: 15}],
                content: "I've been watching the AI revolution from the edge of town. Claude's ability to understand context is unmatched - it's like having a conversation with someone who actually gets it!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Tech Observer"
            },
            {
                tiles: [{x: 27, y: 60}],
                content: "Ever wonder how insurance companies process so many claims? Companies like GenHealth.ai are using AI to speed everything up. The future is now!",
                triggerType: 'spacebar',
                isNPC: true,
                name: "Tech Enthusiast"
            }
        ];
        
        // Add all NPC zones to the zones array
        this.interactiveZones.push(...npcZones);
        
        // Save to localStorage
        localStorage.setItem('pokemonInteractiveZones', JSON.stringify(this.interactiveZones));
        
        console.log(`Added ${npcZones.length} NPC dialogue zones automatically!`);
    }
    
    checkInteractiveZone() {
        const playerX = Math.floor(this.player.gridX);
        const playerY = Math.floor(this.player.gridY);
        
        for (const zone of this.interactiveZones) {
            // Check if player is in zone based on x, y, width, height
            const inZone = playerX >= zone.x && playerX < zone.x + zone.width &&
                           playerY >= zone.y && playerY < zone.y + zone.height;
            
            if (inZone && !this.currentZone) {
                this.currentZone = zone;
                // Store entry position so we can exit one tile below
                this.entryPosition = { x: playerX, y: playerY };
                // Mark this as a walk-over interaction
                this.interactionType = 'walk-over';
                
                // Only trigger walk-over zones automatically (buildings)
                if (zone.triggerType === 'walk-over') {
                    this.showModal('', zone.content);
                }
                // NPCs and spacebar zones do nothing on walk-over
                break;
            }
        }
        
        // Clear current zone if player left all zones
        const stillInZone = this.interactiveZones.some(zone => {
            return playerX >= zone.x && playerX < zone.x + zone.width &&
                   playerY >= zone.y && playerY < zone.y + zone.height;
        });
        if (!stillInZone) {
            this.currentZone = null;
        }
    }
    
    checkFacingInteraction() {
        // Check if player is facing an interactive blocked tile
        const facingX = Math.floor(this.player.gridX + (this.player.facing === 'left' ? -1 : this.player.facing === 'right' ? 1 : 0));
        const facingY = Math.floor(this.player.gridY + (this.player.facing === 'up' ? -1 : this.player.facing === 'down' ? 1 : 0));
        
        // First check for any interactive zones (including NPCs)
        if (facingX >= 0 && facingX < this.MAP_WIDTH && facingY >= 0 && facingY < this.MAP_HEIGHT) {
            for (const zone of this.interactiveZones) {
                // Check if facing position is in zone based on x, y, width, height
                const inZone = facingX >= zone.x && facingX < zone.x + zone.width &&
                               facingY >= zone.y && facingY < zone.y + zone.height;
                
                if (inZone && (zone.triggerType === 'spacebar' || zone.isNPC || zone.isCharacter)) {
                    // Show appropriate display based on zone type
                    if (zone.isNPC || zone.isCharacter) {
                        this.showTextBox(zone.content);
                    } else {
                        this.showModal('', zone.content);
                    }
                    return true;
                }
            }
        }
        return false;
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const fadeTransition = document.getElementById('fadeTransition');
        
        if (modal && modalTitle && modalBody) {
            // Start fade to black transition
            if (fadeTransition) {
                fadeTransition.classList.add('active');
                
                // After fade completes, show modal
                setTimeout(() => {
                    modalTitle.textContent = title;
                    modalBody.innerHTML = content;
                    modal.style.display = 'block';
                    
                    // Fade back from black
                    setTimeout(() => {
                        fadeTransition.classList.remove('active');
                    }, 100);
                }, 500);
            } else {
                // Fallback if no fade transition element
                modalTitle.textContent = title;
                modalBody.innerHTML = content;
                modal.style.display = 'block';
            }
        }
    }
    
    // DISABLED - Buildings are now part of the background image
    loadBuildingOverlays_DISABLED() {
        console.log('🏗️ Loading building overlays...');
        console.log('  Window origin:', window.location.origin);
        console.log('  Window href:', window.location.href);
        
        // FORCE FRESH READ - Clear any potential cache
        const timestamp = Date.now().toString();
        const testWrite = localStorage.setItem('_test_sync', timestamp);
        const testRead = localStorage.getItem('_test_sync');
        localStorage.removeItem('_test_sync');
        
        // Get game container for DOM operations
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) {
            console.error('Game container not found!');
            return;
        }
        
        // ROBUST DOM CLEANUP - Remove by querying the actual DOM
        // This ensures we remove ALL building elements, even if references are stale
        const existingBuildingElements = gameContainer.querySelectorAll('img[data-name]');
        console.log(`Removing ${existingBuildingElements.length} existing building DOM elements`);
        existingBuildingElements.forEach(element => {
            element.parentNode.removeChild(element);
        });
        
        // Clear the array AFTER DOM cleanup
        this.buildingOverlays = [];
        
        // Load buildings from localStorage with timestamp verification
        const currentTimestamp = localStorage.getItem('buildingOverlaysTimestamp');
        const savedBuildings = localStorage.getItem('buildingOverlays');
        console.log('Loading with timestamp:', currentTimestamp);
        console.log('Checking for saved buildings:', savedBuildings ? 'FOUND' : 'NOT FOUND');
        
        if (savedBuildings && savedBuildings !== 'undefined' && savedBuildings !== 'null') {
            try {
                const buildings = JSON.parse(savedBuildings);
                console.log('Parsed buildings:', buildings);
                console.log(`Creating ${buildings.length} new building overlays...`);
                
                buildings.forEach((building, index) => {
                    console.log(`Creating building ${index + 1}: ${building.name} at grid (${building.gridX.toFixed(2)}, ${building.gridY.toFixed(2)})`);
                    this.createBuildingOverlay(building);
                });
                
                // Update our cached timestamp AFTER successful load
                this.lastBuildingTimestamp = localStorage.getItem('buildingOverlaysTimestamp') || '0';
                
                // Apply camera transform to all newly created buildings at once
                const transform = `translate(${-this.camera.x}px, ${-this.camera.y}px)`;
                this.buildingOverlays.forEach(overlay => {
                    overlay.style.transform = transform;
                });
                console.log(`Applied camera transform to ${this.buildingOverlays.length} buildings`);
                
                console.log(`✅ Successfully loaded ${buildings.length} building overlays from localStorage`);
                console.log(`DOM now contains ${gameContainer.querySelectorAll('img[data-name]').length} building elements`);
            } catch (e) {
                console.error('Error parsing saved buildings:', e);
                console.log('Falling back to defaults');
                this.loadDefaultBuildings();
            }
        } else {
            // Default buildings if none saved
            console.log('No saved buildings found, loading defaults');
            this.loadDefaultBuildings();
        }
    }
    
    loadDefaultBuildings() {
            const defaultBuildings = [
                {
                    name: 'MAMV Ventures',
                    src: 'mamv-ventures-building.png',
                    gridX: 21.787499999999994,
                    gridY: -0.8749999999999987,
                    tileWidth: 8,
                    tileHeight: 6,
                    scale: 1.44
                },
                {
                    name: 'GenHealth.ai',
                    src: 'genhealth-building.png',
                    gridX: 9,
                    gridY: 3,
                    tileWidth: 8,
                    tileHeight: 6,
                    scale: 1.44
                },
                {
                    name: 'Sub-Agents.ai',
                    src: 'sub-agents-building.png',
                    gridX: 7.687500000000015,
                    gridY: 25.824999999999967,
                    tileWidth: 8,
                    tileHeight: 6,
                    scale: 1.45
                }
            ];
            defaultBuildings.forEach(building => {
                this.createBuildingOverlay(building);
            });
            console.log('Loaded default building overlays');
    }
    
    createBuildingOverlay(buildingData) {
        const overlay = document.createElement('img');
        overlay.src = buildingData.src;
        overlay.style.position = 'absolute';
        overlay.style.imageRendering = 'pixelated';
        overlay.style.imageRendering = '-moz-crisp-edges';
        overlay.style.imageRendering = 'crisp-edges';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '4'; // Above background but below sprites
        overlay.dataset.name = buildingData.name;
        
        // Calculate dimensions from grid coordinates
        const baseWidth = buildingData.tileWidth * this.TILE_SIZE * this.SCALE;
        const baseHeight = buildingData.tileHeight * this.TILE_SIZE * this.SCALE;
        
        // Scale the building (keeping bottom-left corner anchored)
        const scale = buildingData.scale || 1.0;
        const width = baseWidth * scale;
        const height = baseHeight * scale;
        
        // Position (accounting for scale anchored at bottom-left)
        const left = buildingData.gridX * this.TILE_SIZE * this.SCALE;
        const baseTop = buildingData.gridY * this.TILE_SIZE * this.SCALE;
        const adjustedTop = baseTop - (baseHeight * (scale - 1)); // Move up to account for scaling
        
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        overlay.style.left = left + 'px';
        overlay.style.top = adjustedTop + 'px';
        
        // Apply current camera transform
        const transform = `translate(${-this.camera.x}px, ${-this.camera.y}px)`;
        overlay.style.transform = transform;
        
        // Add to game container and track it
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(overlay);
            this.buildingOverlays.push(overlay);
        }
    }
    
    // DISABLED - Buildings are now part of the background image
    setupBuildingUpdateListener_DISABLED() {
        // Method 1: Listen for storage events from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'buildingOverlays' || e.key === 'buildingOverlaysTimestamp') {
                console.log('Storage event: Building overlays updated from another tab');
                this.loadBuildingOverlays();
            }
        });
        
        // Method 2: Listen for custom events (same-tab communication)
        window.addEventListener('buildingUpdate', (e) => {
            console.log('Custom event: Building update received', e.detail);
            this.loadBuildingOverlays();
        });
        
        // Method 3: BroadcastChannel for cross-tab communication
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('building_updates');
            channel.onmessage = (e) => {
                console.log('BroadcastChannel: Building update received', e.data);
                if (e.data.type === 'update') {
                    this.loadBuildingOverlays();
                }
            };
        }
        
        // Method 4: ULTRA-AGGRESSIVE periodic check
        // Check both timestamp AND building content for changes
        this.lastBuildingTimestamp = '0';
        this.lastBuildingHash = '';
        
        setInterval(() => {
            try {
                // Force a fresh read every time
                const testKey = '_sync_' + Date.now();
                localStorage.setItem(testKey, '1');
                localStorage.removeItem(testKey);
                
                // Read current state
                const currentTimestamp = localStorage.getItem('buildingOverlaysTimestamp') || '0';
                const currentBuildings = localStorage.getItem('buildingOverlays') || '';
                const currentHash = currentBuildings.substring(0, 100); // Quick hash of content
                
                // Check BOTH timestamp and content changes
                const timestampChanged = currentTimestamp !== this.lastBuildingTimestamp;
                const contentChanged = currentHash !== this.lastBuildingHash;
                
                if (timestampChanged || contentChanged) {
                    console.log(`🔄 Change detected! Timestamp: ${timestampChanged}, Content: ${contentChanged}`);
                    console.log(`  Old timestamp: ${this.lastBuildingTimestamp}, New: ${currentTimestamp}`);
                    
                    // Only reload if we had a previous timestamp (not first load)
                    if (this.lastBuildingTimestamp !== '0') {
                        this.loadBuildingOverlays();
                    }
                    
                    this.lastBuildingTimestamp = currentTimestamp;
                    this.lastBuildingHash = currentHash;
                }
            } catch (e) {
                console.error('Sync check error:', e);
            }
        }, 250); // Check every 250ms for even faster updates
        
        // Method 5: Create global sync function
        window.syncBuildings = () => {
            console.log('Manual sync triggered');
            this.loadBuildingOverlays();
        };
        
        console.log('Building update listeners initialized (5 methods active)');
    }
    
    
    generateCollisionMap() {
        // HARDCODED COLLISION MAP - No localStorage
        console.log('Using hardcoded collision map');
        return this.getHardcodedCollisionMap();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key.toLowerCase() === 'g') {
                this.toggleDebug();
            }
            
            // Check if modal is open and handle exit
            const modal = document.getElementById('modalOverlay');
            const isModalOpen = modal && modal.style.display === 'block';
            
            if (isModalOpen) {
                // Exit building on any arrow key or space
                if (e.key === ' ' || e.key === 'Enter' || 
                    e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                    e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                    e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'a' ||
                    e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'd') {
                    e.preventDefault();
                    this.exitBuilding();
                }
                return; // Don't process other inputs while modal is open
            }
            
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                // Only allow interaction if text box is not open
                const textBox = document.getElementById('textBox');
                const isTextBoxOpen = textBox && textBox.style.display === 'block';
                
                if (!isTextBoxOpen) {
                    this.interact();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Debug toggle button (only if it exists)
        const debugBtn = document.getElementById('debugToggle');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                this.toggleDebug();
            });
        }
    }
    
    toggleDebug() {
        this.debugMode = !this.debugMode;
        this.drawGrid();
    }
    
    loadPlayerSprite() {
        // Load the actual sprite sheet
        this.player.spriteSheet = new Image();
        this.player.spriteSheet.src = 'player-sprite.png';
        this.player.spriteSheet.onload = () => {
            console.log('Player sprite loaded successfully');
            console.log('Sprite sheet dimensions:', this.player.spriteSheet.width, 'x', this.player.spriteSheet.height);
            this.player.spriteLoaded = true;
            
            // Force a render to ensure the sprite appears
            this.render();
        };
        this.player.spriteSheet.onerror = (e) => {
            console.error('Failed to load player sprite sheet:', e);
            console.log('Attempted to load:', this.player.spriteSheet.src);
        };
        
        // Sprite animation configuration
        // The actual sprite sheet is 392x201 pixels
        // Let's try common sprite sheet layouts
        // If 4 rows: 201/4 = 50.25 pixels per row
        // Common frame sizes are powers of 2 or clean divisions
        this.player.sprite = {
            width: 32,  // 392/12 = 32.67 pixels per frame (12 frames per row)
            height: 50, // 201/4 = 50.25, round to 50 pixels per frame
            currentFrame: 0,
            animationSpeed: 5, // Frames between animation updates (smoother)
            animationCounter: 0
        };
        
        // Animation frames for each direction (based on sprite sheet layout)
        // Sprite sheet layout: 392x201 = 12 frames per row × 4 rows
        // Row 0 (down): frames 0-11
        // Row 1 (left): frames 12-23  
        // Row 2 (right): frames 24-35
        // Row 3 (up): frames 36-47
        this.player.animations = {
            down: [0, 1, 2, 1],     // Row 0: frames for walking cycle
            left: [12, 13, 14, 13],    // Row 1: frames for left
            right: [24, 25, 26, 25], // Row 2: frames for right  
            up: [36, 37, 38, 37]    // Row 3: frames for up
        };
    }
    
    update() {
        // Check if modal is open - if so, block all movement
        const modal = document.getElementById('modalOverlay');
        const isModalOpen = modal && modal.style.display === 'block';
        
        // Handle player movement (only if modal or text box is not open)
        if (!this.player.isMoving && !isModalOpen && !this.textBoxOpen) {
            let dx = 0, dy = 0;
            
            if (this.keys['arrowup'] || this.keys['w']) {
                dy = -1;
                this.player.facing = 'up';
            } else if (this.keys['arrowdown'] || this.keys['s']) {
                dy = 1;
                this.player.facing = 'down';
            } else if (this.keys['arrowleft'] || this.keys['a']) {
                dx = -1;
                this.player.facing = 'left';
            } else if (this.keys['arrowright'] || this.keys['d']) {
                dx = 1;
                this.player.facing = 'right';
            }
            
            if (dx !== 0 || dy !== 0) {
                const newGridX = this.player.gridX + dx;
                const newGridY = this.player.gridY + dy;
                
                if (this.canMove(newGridX, newGridY)) {
                    this.player.gridX = newGridX;
                    this.player.gridY = newGridY;
                    this.player.isMoving = true;
                    this.player.moveProgress = 0;
                }
            }
        }
        
        // Smooth movement animation (also blocked when modal is open)
        if (this.player.isMoving && !isModalOpen) {
            this.player.moveProgress += this.player.speed;
            
            const targetX = this.player.gridX * this.TILE_SIZE * this.SCALE;
            const targetY = this.player.gridY * this.TILE_SIZE * this.SCALE;
            
            const dx = targetX - this.player.pixelX;
            const dy = targetY - this.player.pixelY;
            
            if (Math.abs(dx) < this.player.speed && Math.abs(dy) < this.player.speed) {
                this.player.pixelX = targetX;
                this.player.pixelY = targetY;
                this.player.isMoving = false;
            } else {
                this.player.pixelX += Math.sign(dx) * this.player.speed;
                this.player.pixelY += Math.sign(dy) * this.player.speed;
            }
        } else if (this.player.isMoving && isModalOpen) {
            // Stop any in-progress movement if modal opens
            this.player.isMoving = false;
        }
        
        // Update camera to follow player
        this.updateCamera();
        
        // Check for walk-over interactive zones
        this.checkInteractiveZone();
    }
    
    canMove(gridX, gridY) {
        if (gridX < 0 || gridX >= this.MAP_WIDTH || gridY < 0 || gridY >= this.MAP_HEIGHT) {
            return false;
        }
        return this.collisionMap[gridY][gridX] === 1;
    }
    
    updateCamera() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Center camera on player
        this.camera.x = this.player.pixelX - screenWidth / 2;
        this.camera.y = this.player.pixelY - screenHeight / 2;
        
        // Clamp camera to map bounds
        const maxX = this.MAP_WIDTH * this.TILE_SIZE * this.SCALE - screenWidth;
        const maxY = this.MAP_HEIGHT * this.TILE_SIZE * this.SCALE - screenHeight;
        
        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
        
        // Apply camera transform to all layers
        const transform = `translate(${-this.camera.x}px, ${-this.camera.y}px)`;
        this.backgroundImg.style.transform = transform;
        this.gridOverlay.style.transform = transform;
        
        // Move all building overlays with the camera
        this.buildingOverlays.forEach(overlay => {
            overlay.style.transform = transform;
        });
    }
    
    interact() {
        // Check for character sprite interaction first
        if (this.characterSprites) {
            const sprite = this.characterSprites.checkInteraction(
                Math.floor(this.player.gridX),
                Math.floor(this.player.gridY),
                this.player.facing
            );
            
            if (sprite) {
                // Show text box for sprite interactions
                this.showTextBox(sprite.dialogue);
                return;
            }
        }
        
        // Check if player is facing an interactive blocked tile
        // This allows interaction with buildings without walking into them
        this.checkFacingInteraction();
    }
    
    showBuildingInfo(building) {
        // Deprecated - using interactive zones instead
    }
    
    updateAnimations() {
        // Animations removed - interactions now handled only through collision editor
        // Buildings are part of the background image, no overlay animations needed
    }
    
    drawPulseAnimation(x, y, size) {
        // Removed - no visual animations
    }
    
    drawGlowAnimation(x, y, size) {
        // Removed - no visual animations
    }
    
    drawSparkleAnimation(x, y, size) {
        // Removed - no visual animations
    }
    
    drawFloatAnimation(x, y, size) {
        // Removed - no visual animations
    }
    
    render() {
        // Clear canvases
        this.charCtx.clearRect(0, 0, this.characterCanvas.width, this.characterCanvas.height);
        this.animCtx.clearRect(0, 0, this.animationCanvas.width, this.animationCanvas.height);
        
        // Draw building animations
        this.updateAnimations();
        
        // Update and render character sprites
        if (this.characterSprites) {
            this.characterSprites.update();
            this.characterSprites.render();
        }
        
        // Draw player (on top of other sprites)
        this.drawPlayer();
    }
    
    drawPlayer() {
        const screenX = this.player.pixelX - this.camera.x;
        const screenY = this.player.pixelY - this.camera.y;
        const size = this.TILE_SIZE * this.SCALE;
        
        // Only draw if sprite is loaded
        if (!this.player.spriteLoaded) {
            // Draw a simple placeholder if sprite not loaded
            
            // Shadow removed as requested
            
            // Simple red square as placeholder
            this.charCtx.fillStyle = '#ff0000';
            this.charCtx.fillRect(screenX, screenY, size, size);
            
            // Draw position text
            this.charCtx.fillStyle = 'yellow';
            this.charCtx.font = '16px Arial';
            this.charCtx.fillText(`Player (${screenX}, ${screenY})`, screenX, screenY - 10);
            
            return;
        }
        
        const sprite = this.player.sprite;
        
        // Use smaller scaling for the sprite to make character smaller
        const spriteScale = 1.01; // Reduced by 25% to match zoom out (was 1.35)
        
        // Adjust Y position so sprite bottom aligns with tile bottom
        // Since sprite is taller than tile, offset appropriately
        const spriteOffsetY = (sprite.height * spriteScale) - (this.TILE_SIZE * this.SCALE);
        const adjustedScreenY = screenY - spriteOffsetY;
        
        // Update animation
        if (this.player.isMoving) {
            this.player.sprite.animationCounter++;
            if (this.player.sprite.animationCounter >= this.player.sprite.animationSpeed) {
                this.player.sprite.animationCounter = 0;
                this.player.sprite.currentFrame = (this.player.sprite.currentFrame + 1) % 4;
            }
        } else {
            this.player.sprite.currentFrame = 0; // Standing frame
        }
        
        // Get the current animation frame
        const animation = this.player.animations[this.player.facing];
        const frameIndex = animation[this.player.sprite.currentFrame];
        
        // Calculate sprite sheet position
        const framesPerRow = 12; // 12 frames per row in the sprite sheet
        const sourceX = (frameIndex % framesPerRow) * sprite.width;
        const sourceY = Math.floor(frameIndex / framesPerRow) * sprite.height;
        
        // Calculate display dimensions using the spriteScale
        const displayWidth = sprite.width * spriteScale;
        const displayHeight = sprite.height * spriteScale;
        
        // Debug logging (remove after fixing)
        if (this.debugMode && frameIndex !== this.lastLoggedFrame) {
            console.log('Drawing sprite:', {
                frameIndex, 
                sourceX, sourceY, 
                spriteWidth: sprite.width, spriteHeight: sprite.height,
                displayWidth, displayHeight,
                screenX, screenY,
                facing: this.player.facing
            });
            this.lastLoggedFrame = frameIndex;
        }
        
        // Shadow removed as requested
        
        // Ensure the canvas context is in a clean state
        this.charCtx.save();
        
        // Validate source bounds before drawing
        if (sourceX + sprite.width > this.player.spriteSheet.width || 
            sourceY + sprite.height > this.player.spriteSheet.height ||
            sourceX < 0 || sourceY < 0) {
            console.warn('Invalid sprite bounds:', {
                sourceX, sourceY, 
                width: sprite.width, height: sprite.height,
                sheetWidth: this.player.spriteSheet.width,
                sheetHeight: this.player.spriteSheet.height,
                frameIndex
            });
            return;
        }
        
        // Draw the sprite with proper bounds checking
        try {
            this.charCtx.drawImage(
                this.player.spriteSheet,
                sourceX, sourceY,                                    // Source position
                sprite.width, sprite.height,                         // Source size from sprite sheet
                Math.round(screenX), Math.round(adjustedScreenY),    // Destination position (adjusted for sprite height)
                displayWidth, displayHeight                          // Destination size (scaled)
            );
        } catch (error) {
            console.warn('Error drawing player sprite:', error);
            console.log('Source bounds:', {sourceX, sourceY, width: sprite.width, height: sprite.height});
            console.log('Dest bounds:', {screenX, screenY, displayWidth, displayHeight});
        }
        
        this.charCtx.restore();
        
        // Debug info (uncomment to troubleshoot)
        if (this.debugMode) {
            // Draw sprite bounding box
            this.charCtx.strokeStyle = 'red';
            this.charCtx.strokeRect(screenX, adjustedScreenY, displayWidth, displayHeight);
            
            // Draw tile bounding box for comparison
            this.charCtx.strokeStyle = 'blue';
            this.charCtx.strokeRect(screenX, screenY, this.TILE_SIZE * this.SCALE, this.TILE_SIZE * this.SCALE);
            
            // Debug text
            this.charCtx.fillStyle = 'yellow';
            this.charCtx.font = '12px Arial';
            this.charCtx.fillText(`Frame: ${frameIndex} (${sourceX},${sourceY})`, screenX, adjustedScreenY - 10);
            this.charCtx.fillText(`Offset: ${spriteOffsetY}px`, screenX, adjustedScreenY - 25);
        }
    }
    
    exitBuilding() {
        const modal = document.getElementById('modalOverlay');
        const fadeTransition = document.getElementById('fadeTransition');
        
        if (modal) {
            // Start fade to black
            if (fadeTransition) {
                fadeTransition.classList.add('active');
                
                setTimeout(() => {
                    modal.style.display = 'none';
                    
                    // Position player at exit location (one cell below entry)
                    if (this.currentZone && this.currentZone.entryX !== undefined && this.currentZone.entryY !== undefined) {
                        // Use the zone's specified exit position
                        this.player.gridX = this.currentZone.entryX;
                        this.player.gridY = this.currentZone.entryY;
                    } else if (this.entryPosition) {
                        // Fallback to one cell below entry position
                        this.player.gridX = this.entryPosition.x;
                        this.player.gridY = this.entryPosition.y + 1;
                    }
                    
                    // Update pixel position
                    this.player.pixelX = this.player.gridX * this.TILE_SIZE * this.SCALE;
                    this.player.pixelY = this.player.gridY * this.TILE_SIZE * this.SCALE;
                    
                    // Clear the current zone
                    this.currentZone = null;
                    this.entryPosition = null;
                    
                    // Fade back from black
                    setTimeout(() => {
                        fadeTransition.classList.remove('active');
                    }, 100);
                }, 300);
            } else {
                // No fade transition
                modal.style.display = 'none';
                
                // Position player at exit location
                if (this.currentZone && this.currentZone.entryX !== undefined && this.currentZone.entryY !== undefined) {
                    this.player.gridX = this.currentZone.entryX;
                    this.player.gridY = this.currentZone.entryY;
                } else if (this.entryPosition) {
                    this.player.gridX = this.entryPosition.x;
                    this.player.gridY = this.entryPosition.y + 1;
                }
                
                this.player.pixelX = this.player.gridX * this.TILE_SIZE * this.SCALE;
                this.player.pixelY = this.player.gridY * this.TILE_SIZE * this.SCALE;
                
                this.currentZone = null;
                this.entryPosition = null;
            }
        }
    }
    
    showTextBox(text) {
        console.log('showTextBox called with text:', text);
        const textBox = document.getElementById('textBox');
        const textBoxContent = document.getElementById('textBoxContent');
        
        console.log('textBox element:', textBox);
        console.log('textBoxContent element:', textBoxContent);
        
        if (textBox && textBoxContent) {
            textBoxContent.textContent = text;
            
            // Set a flag to prevent immediate closing
            this.textBoxJustOpened = true;
            
            // Use a small timeout to ensure the display change happens after the current event
            setTimeout(() => {
                textBox.style.display = 'block';
                console.log('Text box should now be visible');
                console.log('Text box computed style:', window.getComputedStyle(textBox).display);
                
                // Reset the flag after a delay to allow closing
                setTimeout(() => {
                    this.textBoxJustOpened = false;
                }, 200);
            }, 10);
            
            // Block movement while text box is open
            this.textBoxOpen = true;
        } else {
            console.error('Text box elements not found!');
        }
    }
    
    closeTextBox() {
        const textBox = document.getElementById('textBox');
        if (textBox) {
            textBox.style.display = 'none';
            this.textBoxOpen = false;
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // HARDCODED DATA METHODS - Replace localStorage dependencies
    getHardcodedCollisionMap() {
        // Returns the hardcoded collision map - SHIFTED UP BY 1 ROW for proper alignment
        return [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
    }
    
    getHardcodedInteractiveZones() {
        // FULLY HARDCODED interactive zones - NO localStorage, NO ensureNPCDialogue
        const zones = [];
        
        // Building zones - MAMV Ventures
        zones.push({
            x: 27,
            y: 6,  // Back to original position
            width: 2,
            height: 1,
            triggerType: 'walk-over',
            content: `
                <div style="text-align: center; padding: 10px;">
                    <h2 style="color: #4A90E2; margin-bottom: 20px;">MAMV Ventures</h2>
                    <div class="hovering-logo" style="margin-bottom: 20px;">
                        <img src="mamv-logo.png" alt="MAMV Ventures" style="width: 300px; height: auto; border-radius: 8px;">
                    </div>
                    <p style="font-size: 20px; margin-bottom: 15px; color: black;">
                        Building & Scaling Tomorrow's Start Ups & Leaders
                    </p>
                    
                    <div style="margin: 20px 0; padding: 15px; background: rgba(255, 215, 0, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Mike Maseda - Former Founder & Operator</p>
                        <p style="margin-bottom: 10px; font-size: 14px;">
                            Startup growth expert specializing in rapid scaling and operational excellence
                        </p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: rgba(74, 144, 226, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold;">Track Record:</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 14px;">
                            <li><strong>VC/PE Experience</strong> - Worked across 3 VC/PE backed startups</li>
                            <li><strong>Hold Co Operations</strong> - Previously managed operations across 5 businesses</li>
                            <li><strong>Team Building</strong> - Recruited and led high-performance teams</li>
                            <li><strong>Market Research</strong> - Strategic insights for healthcare organizations</li>
                            <li><strong>Operational Excellence</strong> - Streamlined processes across portfolio</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 12px; background: rgba(0, 255, 0, 0.05); border-radius: 8px;">
                        <p style="font-size: 13px; color: #2d7a2d; font-weight: bold;">Current Focus:</p>
                        <p style="font-size: 12px; margin-top: 5px;">
                            Helping startups build, scale, and achieve sustainable growth through strategic operations and go-to-market excellence
                        </p>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px;">
                        <a href="mailto:mike@mamv.co" style="color: #306850; text-decoration: underline; font-weight: bold;">Contact Us</a>
                    </p>
                </div>
            `,
            entryPosition: { x: 28, y: 8 }
        });
        
        // GenHealth.ai building (shifted up by 1)
        zones.push({
            x: 11,
            y: 5,  // Changed from 6 to 5
            width: 2,
            height: 1,
            triggerType: 'walk-over',
            content: `
                <div style="text-align: center; padding: 10px;">
                    <h2 style="color: #8B5CF6; margin-bottom: 20px;">GenHealth.ai</h2>
                    
                    <div class="hovering-logo" style="margin-bottom: 20px;">
                        <a href="https://genhealth.ai/" target="_blank" style="text-decoration: none;">
                            <img src="genhealth-logo.png" alt="GenHealth.ai" style="width: 350px; height: auto; border-radius: 8px; cursor: pointer;">
                        </a>
                    </div>
                    
                    <p style="font-size: 20px; margin-bottom: 15px; color: #8B5CF6; font-weight: bold;">
                        Revolutionizing Healthcare with AI-Powered Automation
                    </p>
                    
                    <div style="margin: 20px 0; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Head of Sales & Operations</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                            <li><strong>GTM Strategy</strong> - Built entire go-to-market motion from zero</li>
                            <li><strong>Enterprise Sales</strong> - Closing major DME suppliers and health systems</li>
                            <li><strong>Operational Excellence</strong> - Streamlining all internal processes</li>
                            <li><strong>Team Building</strong> - Recruiting and developing top-tier talent</li>
                            <li><strong>Partner Network</strong> - Strategic alliances with payers and providers</li>
                        </ul>
                        <p style="font-size: 13px; color: #8B5CF6; font-weight: bold; margin-top: 15px;">Mission:</p>
                        <p style="font-size: 12px; margin-top: 5px;">
                            Eliminating 90% of healthcare admin burden through AI-powered automation
                        </p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: rgba(74, 144, 226, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold;">What We're Building:</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 14px;">
                            <li><strong>DME Intake Automation</strong> - Eliminating manual data entry for durable medical equipment orders</li>
                            <li><strong>AI Prior Auth</strong> - Automating insurance approvals in minutes, not days</li>
                            <li><strong>Smart Document Processing</strong> - OCR + AI for instant medical record extraction</li>
                            <li><strong>Payer Integration</strong> - Seamless connectivity with insurance systems</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px;">
                        <a href="https://genhealth.ai/" target="_blank" style="color: #306850; text-decoration: underline; font-weight: bold;">Learn More</a>
                    </p>
                </div>
            `,
            entryPosition: { x: 12, y: 8 }
        });
        
        // Sub-Agents.ai building (shifted up by 1)
        zones.push({
            x: 12,
            y: 31,  // Changed from 32 to 31
            width: 2,
            height: 1,
            triggerType: 'walk-over',
            content: `
                <div class="modal-building-header">
                    <img src="subagents-logo.png" alt="Sub-Agents.ai" class="modal-logo" style="max-height: 60px; width: auto;">
                </div>
                <div class="modal-content-section">
                    <h3>Sub-Agent Database</h3>
                    <p>Access our comprehensive database of .md files containing ready-to-use Sub-Agent configurations. Transform your workflow with pre-built templates and setups.</p>
                </div>
                <div class="modal-content-section" style="background: #e6fffa;">
                    <h3>Core Features</h3>
                    <ul>
                        <li><strong>Expert Templates</strong> - Domain-specific agent configs</li>
                        <li><strong>Organized Categories</strong> - Easy navigation</li>
                        <li><strong>Ready-to-Use Configs</strong> - Instant implementation</li>
                        <li><strong>Plug-and-play setup</strong> - Quick deployment</li>
                    </ul>
                </div>
                <div class="modal-content-section">
                    <h3>Why Choose Our Database?</h3>
                    <ul>
                        <li><strong>Instant Access</strong> - Download configurations immediately</li>
                        <li><strong>Battle-tested configs</strong> - Production-ready setups</li>
                        <li><strong>Expert-crafted prompts</strong> - Optimized for performance</li>
                        <li><strong>Copy-paste ready</strong> - Simple integration</li>
                    </ul>
                </div>
            `,
            entryPosition: { x: 13, y: 34 }
        });
        
        // Building zones - GenHealth.ai
        zones.push({
            x: 11,
            y: 6,
            width: 2,
            height: 1,
            triggerType: 'walk-over',
            content: `
                <div style="text-align: center; padding: 10px;">
                    <h2 style="color: #8B5CF6; margin-bottom: 20px;">GenHealth.ai</h2>
                    
                    <div class="hovering-logo" style="margin-bottom: 20px;">
                        <a href="https://genhealth.ai/" target="_blank" style="text-decoration: none;">
                            <img src="genhealth-logo.png" alt="GenHealth.ai" style="width: 350px; height: auto; border-radius: 8px; cursor: pointer;">
                        </a>
                    </div>
                    
                    <p style="font-size: 20px; margin-bottom: 15px; color: #8B5CF6; font-weight: bold;">
                        Revolutionizing Healthcare with AI-Powered Automation
                    </p>
                    
                    <div style="margin: 20px 0; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Head of Sales & Operations</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                            <li><strong>GTM Strategy</strong> - Built entire go-to-market motion from zero</li>
                            <li><strong>Enterprise Sales</strong> - Closing major DME suppliers and health systems</li>
                            <li><strong>Operational Excellence</strong> - Streamlining all internal processes</li>
                            <li><strong>Team Building</strong> - Recruiting and developing top-tier talent</li>
                            <li><strong>Partner Network</strong> - Strategic alliances with payers and providers</li>
                        </ul>
                        <p style="font-size: 13px; color: #8B5CF6; font-weight: bold; margin-top: 15px;">Mission:</p>
                        <p style="font-size: 12px; margin-top: 5px;">
                            Eliminating 90% of healthcare admin burden through AI-powered automation
                        </p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: rgba(74, 144, 226, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold;">What We're Building:</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 14px;">
                            <li><strong>DME Intake Automation</strong> - Eliminating manual data entry for durable medical equipment orders</li>
                            <li><strong>AI Prior Auth</strong> - Automating insurance approvals in minutes, not days</li>
                            <li><strong>Smart Document Processing</strong> - OCR + AI for instant medical record extraction</li>
                            <li><strong>Payer Integration</strong> - Seamless connectivity with insurance systems</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px;">
                        <a href="https://genhealth.ai/" target="_blank" style="color: #306850; text-decoration: underline; font-weight: bold;">Learn More</a>
                    </p>
                </div>
            `,
            isNPC: false,
            name: "GenHealth.ai Building",
            entryX: 11,
            entryY: 7
        });

        // Coming Soon modal at position 23,24
        zones.push({
            x: 23,
            y: 24,
            width: 1,
            height: 1,
            triggerType: 'walk-over',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <h2 style="color: #4A90E2; margin-bottom: 20px;">Coming Soon!</h2>
                </div>
            `,
            isNPC: false,
            name: "Coming Soon"
        });

        // Building zones - Sub-Agents.ai
        zones.push({
            x: 12,
            y: 32,
            width: 2,
            height: 1,
            triggerType: 'walk-over',
            content: `
                <div style="text-align: center; padding: 10px;">
                    <h2 style="color: #00D4FF; margin-bottom: 20px;">Sub-Agents.ai</h2>
                    
                    <div class="hovering-logo" style="margin-bottom: 20px;">
                        <a href="https://sub-agents.ai/" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="subagents-logo.png" alt="Sub-Agents.ai" style="width: 350px; height: auto; cursor: pointer; display: block;">
                        </a>
                    </div>
                    
                    <p style="font-size: 20px; margin-bottom: 15px; color: #00D4FF; font-weight: bold;">
                        Your Sub-Agent Database
                    </p>
                    
                    <p style="font-size: 14px; margin-bottom: 20px; color: #888;">
                        Access hundreds of carefully crafted .md templates and configurations to quickly<br>
                        setup specialized Sub-Agents for your specific use cases.
                    </p>
                    
                    <div style="margin: 20px 0; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Expert Templates</p>
                        <p style="font-size: 12px; margin-bottom: 10px;">Curated .md files with proven Sub-Agent configurations for specific domains and use cases.</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                            <li><strong>Domain-specific setups</strong> - Tailored for your industry or field</li>
                            <li><strong>Battle-tested configs</strong> - Proven to work in production environments</li>
                            <li><strong>Expert-crafted prompts</strong> - Written by AI engineering professionals</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 15px; background: rgba(0, 255, 0, 0.05); border-radius: 8px;">
                        <p style="font-weight: bold; color: #2d7a2d; margin-bottom: 10px;">Ready-to-Use Configs</p>
                        <p style="font-size: 12px; margin-bottom: 10px;">Pre-configured .md templates that you can immediately use to setup your Sub-Agents.</p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px; font-size: 12px;">
                            <li><strong>Instant implementation</strong> - Start using agents in minutes</li>
                            <li><strong>No setup required</strong> - Pre-configured for immediate deployment</li>
                            <li><strong>Copy-paste ready</strong> - Drop directly into your workflow</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px;">
                        <a href="https://sub-agents.ai/" target="_blank" style="color: #306850; text-decoration: underline; font-weight: bold;">Learn More</a>
                    </p>
                </div>
            `,
            isNPC: false,
            name: "Sub-Agents.ai Building",
            entryX: 12,
            entryY: 33
        });

        // Add all NPCs
        const npcs = [
            { x: 73, y: 15, content: "A wild Snorlax was here earlier... It ate all the berries, took a nap, and left a bad Yelp review about the lack of snacks!", name: "Mysterious Voice" },
            { x: 16, y: 9, content: "Welcome to our town! Did you know Claude is helping revolutionize healthcare? GenHealth.ai uses AI to automate prior authorizations!", name: "Town Greeter" },
            { x: 15, y: 18, content: "I used ChatGPT for my fantasy football draft... big mistake. It suggested players from 2019. Claude actually knows current rosters!", name: "Fantasy Football Fan" },
            { x: 21, y: 15, content: "My medical supply company switched to GenHealth's DME automation. What used to take 3 hours now takes 3 minutes. It's super effective!", name: "Business Owner" },
            { x: 38, y: 9, content: "The Pokémon Center uses AI now! Just like how GenHealth.ai streamlines DME intake - healing people AND processes!", name: "Nurse Joy's Assistant" },
            { x: 32, y: 20, content: "Fun fact: Claude can analyze an entire season of fantasy football stats in seconds. My team 'The Snorlax Squad' is crushing it!", name: "Stats Nerd" },
            { x: 16, y: 23, content: "This mart uses AI for inventory now! Speaking of AI, have you tried Claude? It's like having a Psychic-type Pokémon for your brain!", name: "Mart Customer" },
            { x: 50, y: 7, content: "I work in healthcare billing. GenHealth.ai's DME automation is saving us thousands of hours per month. The future is here!", name: "Healthcare Worker" },
            { x: 57, y: 17, content: "ChatGPT is good for basic stuff, but Claude? That's what the pros use. Especially for healthcare and fantasy sports analysis!", name: "AI Enthusiast" },
            { x: 41, y: 25, content: "Did you hear? Hospitals using GenHealth's AI are processing claims 10x faster. It's like they used a Rare Candy on their workflow!", name: "Hospital Admin" },
            { x: 40, y: 25, content: "I manage a fantasy football league with 20 teams. Claude helps me generate weekly power rankings and injury reports. Total game changer!", name: "League Commissioner" },
            { x: 35, y: 27, content: "The beach is nice, but you know what's nicer? Not spending 6 hours on prior authorizations. Thanks GenHealth.ai!", name: "Beach Goer" },
            { x: 28, y: 28, content: "Pro tip: Use Claude for complex healthcare questions and GenHealth.ai for automating the boring stuff. It's like having the ultimate Pokémon team!", name: "Tech Enthusiast" },
            { x: 16, y: 34, content: "The lake is so peaceful... Unlike healthcare paperwork! Good thing GenHealth is automating all that administrative nightmare.", name: "Fisherman" },
            { x: 16, y: 35, content: "I've been using Claude to help analyze my business metrics. It's like having a data scientist on demand, but way more affordable!", name: "Entrepreneur" },
            { x: 16, y: 25, content: "I asked both ChatGPT and Claude about injury reports for fantasy football. Claude understood context way better - it knew 'questionable' doesn't mean the player is questioning life!", name: "Sports Analyst" },
            { x: 34, y: 37, content: "As a doctor, I love that GenHealth.ai handles insurance paperwork. More time for patients, less time fighting with forms!", name: "Doctor" },
            { x: 35, y: 37, content: "I run a DME company. GenHealth's automation reduced our claim denials by 75%. It's like evolving from Magikarp to Gyarados overnight!", name: "DME Owner" },
            { x: 27, y: 60, content: "Ever wonder how insurance companies process so many claims? Companies like GenHealth.ai are using AI to speed everything up. The future is now!", name: "Tech Enthusiast 2" }
        ];
        
        // Add each NPC to zones
        npcs.forEach(npc => {
            zones.push({
                x: npc.x,
                y: npc.y,
                width: 1,
                height: 1,
                triggerType: 'spacebar',
                content: npc.content,
                isNPC: true,
                isCharacter: true,
                name: npc.name
            });
        });
        
        // Return the hardcoded zones
        return zones;
    }
}

// Start the game
const game = new PokemonPortfolio();
window.game = game; // Make game accessible globally for exit positioning
