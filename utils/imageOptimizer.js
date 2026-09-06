const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Optimizes an uploaded image: resizes to max width 1200px and converts to WebP format
 * @param {string} filePath - Absolute path to the uploaded file
 * @returns {Promise<string>} - The new filename of the optimized WebP image
 */
async function optimizeImage(filePath) {
  const ext = path.extname(filePath);
  const dirname = path.dirname(filePath);
  const basename = path.basename(filePath, ext);
  const outputFilename = `${basename}-optimized.webp`;
  const outputPath = path.join(dirname, outputFilename);

  try {
    await sharp(filePath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Remove original file if different
    if (filePath !== outputPath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return outputFilename;
  } catch (error) {
    console.error('Image optimization failed, falling back to original:', error);
    return path.basename(filePath);
  }
}

module.exports = { optimizeImage };
