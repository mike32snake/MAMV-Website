# How to Add Pokémon Sprites to Your Game

## Best Sources for Sprites

### 1. **PokémonDB (Recommended)**
- URL: https://pokemondb.net/sprites
- Best for: Official game sprites
- Formats: Individual PNGs with transparent backgrounds
- Games available: All generations (Red/Blue through Scarlet/Violet)

### 2. **Spriters Resource**
- URL: https://www.spriters-resource.com/ds_dsi/pokemonblackwhite/
- Best for: Sprite sheets and animations
- Formats: Full sprite sheets, overworld sprites

### 3. **Bulbapedia**
- URL: https://bulbapedia.bulbagarden.net/wiki/Category:Sprites
- Best for: Comprehensive sprite collection
- Formats: Individual sprites, all games

## Step-by-Step Process

### Method 1: Download and Save Locally (Most Reliable)

1. **Find the sprite on PokémonDB:**
   - Go to https://pokemondb.net/sprites/[pokemon-name]
   - Right-click the sprite you want
   - Choose "Save Image As..."

2. **Prepare the sprite:**
   ```bash
   # Save to sprites folder
   mkdir sprites
   # Save as: sprites/pikachu.png
   ```

3. **Make background transparent (if needed):**
   ```python
   from PIL import Image
   
   img = Image.open('sprites/pikachu.png')
   img = img.convert("RGBA")
   
   # Make white background transparent
   pixels = img.getdata()
   new_pixels = []
   for pixel in pixels:
       if pixel[:3] == (255, 255, 255):  # White
           new_pixels.append((0, 0, 0, 0))  # Transparent
       else:
           new_pixels.append(pixel)
   
   img.putdata(new_pixels)
   img.save('sprites/pikachu.png')
   ```

4. **Add to game:**
   ```javascript
   // In character-sprites.js, add to spriteDefinitions:
   {
       name: 'Pikachu',
       imagePath: 'sprites/pikachu.png',
       gridX: 40,
       gridY: 20,
       width: 1,
       height: 1,
       blocking: false,
       interactive: true,
       dialogue: "Pika pika!"
   }
   ```

### Method 2: Direct Download with curl

```bash
# For PokémonDB sprites (Gen 5 sprites are best quality)
curl -o sprites/pikachu.png "https://img.pokemondb.net/sprites/black-white/normal/pikachu.png"

# For shiny versions
curl -o sprites/pikachu-shiny.png "https://img.pokemondb.net/sprites/black-white/shiny/pikachu.png"

# For animated sprites (Gen 5)
curl -o sprites/pikachu-anim.gif "https://img.pokemondb.net/sprites/black-white/anim/normal/pikachu.gif"
```

## Recommended Sprite Versions

### Best for Your Game:
- **Black/White sprites** - High quality, good size (96x96)
- **HeartGold/SoulSilver sprites** - Classic look (80x80)
- **Emerald sprites** - Retro GBA style (64x64)

### Sprite URLs Pattern:
```
https://img.pokemondb.net/sprites/[game]/[variant]/[pokemon].png

Games: black-white, heartgold-soulsilver, emerald, etc.
Variants: normal, shiny, back-normal, back-shiny
```

## Quick Add Function

Add this helper function to easily add sprites:

```javascript
// Add to your game console:
game.characterSprites.addSprite({
    name: 'Pikachu',
    imagePath: 'sprites/pikachu.png',
    gridX: 40,
    gridY: 20,
    width: 1,
    height: 1,
    blocking: false,
    interactive: true,
    dialogue: "Pika! Pikachu!"
});
```

## Batch Download Script

```bash
#!/bin/bash
# download-sprites.sh

SPRITES_DIR="sprites"
mkdir -p $SPRITES_DIR

# List of Pokémon to download
POKEMON=(
    "pikachu"
    "charizard"
    "blastoise"
    "venusaur"
    "mewtwo"
    "mew"
)

for poke in "${POKEMON[@]}"
do
    echo "Downloading $poke..."
    curl -s -o "$SPRITES_DIR/$poke.png" \
        "https://img.pokemondb.net/sprites/black-white/normal/$poke.png"
done

echo "All sprites downloaded!"
```

## Tips for Success

1. **Always download locally** - Avoids CORS issues
2. **Use PNG format** - Best for transparency
3. **Stick to one game's sprites** - Consistent art style
4. **Test transparency** - White backgrounds look bad
5. **Keep sprites small** - 32x32 to 96x96 pixels ideal

## Example: Adding Multiple Sprites

```javascript
// In character-sprites.js
this.spriteDefinitions = [
    {
        name: 'Pikachu',
        imagePath: 'sprites/pikachu.png',
        gridX: 25,
        gridY: 15,
        width: 1,
        height: 1,
        blocking: false,
        interactive: true,
        dialogue: "Pika pika! I'm Pikachu!"
    },
    {
        name: 'Charmander',
        imagePath: 'sprites/charmander.png',
        gridX: 35,
        gridY: 20,
        width: 1,
        height: 1,
        blocking: false,
        interactive: true,
        dialogue: "Char! Charmander!"
    },
    {
        name: 'Nurse Joy',
        imagePath: 'sprites/nurse-joy.png',
        gridX: 20,
        gridY: 10,
        width: 1,
        height: 1,
        blocking: true,
        interactive: true,
        dialogue: "Welcome to the Pokémon Center! We heal your Pokémon to perfect health!"
    }
];
```

## Troubleshooting

- **Sprite not showing?** Check console for 404 errors
- **White background?** Run the transparency script
- **Too big/small?** Adjust width/height in definition
- **CORS error?** Download sprite locally first
- **Sprite cut off?** Check the image dimensions