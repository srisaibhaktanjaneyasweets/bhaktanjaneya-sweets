import sharp from "sharp";

interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
}

/**
 * Optimizes an image buffer by resizing it (if it exceeds maxWidth) 
 * and compressing it while keeping the original file format (MIME type)
 * to comply with Supabase bucket constraints.
 */
export async function optimizeUploadedImage(
  buffer: Buffer,
  originalContentType: string,
  options: OptimizeOptions = {}
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const { maxWidth = 1000, quality = 75 } = options;

  try {
    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // Rotate image based on EXIF metadata (e.g. phone camera orientation)
    pipeline = pipeline.rotate();

    // Resize if width is larger than maxWidth
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    let optimizedBuffer: Buffer;
    let contentType = originalContentType;
    let ext = "jpg";

    if (originalContentType === "image/png") {
      // Compress PNG
      optimizedBuffer = await pipeline
        .png({ quality, compressionLevel: 8 })
        .toBuffer();
      contentType = "image/png";
      ext = "png";
    } else if (originalContentType === "image/gif") {
      // Keep GIF or process static
      optimizedBuffer = await pipeline.toBuffer();
      contentType = "image/gif";
      ext = "gif";
    } else {
      // Default to JPEG optimization
      optimizedBuffer = await pipeline
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      contentType = "image/jpeg";
      ext = "jpg";
    }

    return {
      buffer: optimizedBuffer,
      ext,
      contentType,
    };
  } catch (error) {
    console.error("Image optimization failed, falling back to original:", error);
    throw error;
  }
}
