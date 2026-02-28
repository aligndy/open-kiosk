import sharp from "sharp";

const SQUARE_SIZE = 800;

/**
 * Center-crop an image to 1:1 square and resize to SQUARE_SIZE.
 * Works with any image format sharp supports (JPEG, PNG, WebP, GIF, etc.)
 * Returns a PNG buffer.
 */
export async function cropToSquare(input: Buffer): Promise<Buffer> {
  const metadata = await sharp(input).metadata();
  const w = metadata.width || SQUARE_SIZE;
  const h = metadata.height || SQUARE_SIZE;
  const size = Math.min(w, h);
  const left = Math.floor((w - size) / 2);
  const top = Math.floor((h - size) / 2);

  return sharp(input)
    .extract({ left, top, width: size, height: size })
    .resize(SQUARE_SIZE, SQUARE_SIZE)
    .png()
    .toBuffer();
}
