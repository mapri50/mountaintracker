# App Icon Generation

## Required Icons

For the PWA to work properly, you need to create the following icon sizes:

- 72x72 (icon-72x72.png)
- 96x96 (icon-96x96.png)
- 128x128 (icon-128x128.png)
- 144x144 (icon-144x144.png)
- 152x152 (icon-152x152.png)
- 192x192 (icon-192x192.png)
- 384x384 (icon-384x384.png)
- 512x512 (icon-512x512.png)

## Design Suggestions

Create an icon that represents mountain tracking:

- Mountain silhouette (peaks)
- Compass or navigation theme
- Trail markers
- Climbing/hiking motif

Recommended colors from the MountainTracker theme:

- Primary: #1e40af (blue-800)
- Accent: #3b82f6 (blue-500)
- Background: White or gradient

## Quick Generation Options

### Option 1: Use an Online Tool

1. Visit https://realfavicongenerator.net or https://www.pwabuilder.com/imageGenerator
2. Upload your 512x512 base icon
3. Download the generated icon pack
4. Place all icons in this directory

### Option 2: Use ImageMagick

If you have a 512x512 source icon (`source.png`):

```bash
convert source.png -resize 72x72 icon-72x72.png
convert source.png -resize 96x96 icon-96x96.png
convert source.png -resize 128x128 icon-128x128.png
convert source.png -resize 144x144 icon-144x144.png
convert source.png -resize 152x152 icon-152x152.png
convert source.png -resize 192x192 icon-192x192.png
convert source.png -resize 384x384 icon-384x384.png
convert source.png -resize 512x512 icon-512x512.png
```

### Option 3: Use Sharp (Node.js)

Create a script `generate-icons.js`:

```javascript
const sharp = require("sharp");
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach((size) => {
  sharp("source.png").resize(size, size).toFile(`icon-${size}x${size}.png`);
});
```

## Temporary Placeholder

For development, you can use a simple colored square as a placeholder.
The PWA will still work, but the icon won't look professional until replaced.
