const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, "public", "icons");

// Create a simple mountain icon using SVG
const createMountainIcon = (size) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${
    size * 0.2
  }" />
      <path d="M ${size * 0.5} ${size * 0.25} L ${size * 0.75} ${
    size * 0.65
  } L ${size * 0.25} ${size * 0.65} Z" fill="white" opacity="0.9"/>
      <path d="M ${size * 0.35} ${size * 0.5} L ${size * 0.5} ${
    size * 0.35
  } L ${size * 0.65} ${size * 0.5} L ${size * 0.65} ${size * 0.65} L ${
    size * 0.35
  } ${size * 0.65} Z" fill="white" opacity="0.7"/>
      <circle cx="${size * 0.5}" cy="${size * 0.28}" r="${
    size * 0.04
  }" fill="#fbbf24"/>
    </svg>
  `;
  return Buffer.from(svg);
};

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate all icon sizes
Promise.all(
  sizes.map((size) => {
    const svgBuffer = createMountainIcon(size);
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    return sharp(svgBuffer)
      .png()
      .toFile(outputPath)
      .then(() => console.log(`✓ Generated icon-${size}x${size}.png`));
  })
)
  .then(() => {
    console.log("\n✓ All PWA icons generated successfully!");
    console.log("Icons location:", outputDir);
  })
  .catch((err) => {
    console.error("Error generating icons:", err);
    process.exit(1);
  });
