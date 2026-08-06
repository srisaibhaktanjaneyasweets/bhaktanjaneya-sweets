import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function optimizeBucket(bucketName, maxWidth, quality) {
  console.log(`\n--- Optimizing bucket: ${bucketName} ---`);
  
  const { data: files, error } = await supabase.storage.from(bucketName).list();
  if (error) {
    console.error(`Failed to list files in ${bucketName}:`, error);
    return;
  }

  // Filter out non-images or folders
  const images = files.filter(
    (f) => f.name.endsWith(".jpg") || f.name.endsWith(".jpeg") || f.name.endsWith(".png") || f.name.endsWith(".webp")
  );

  console.log(`Found ${images.length} images to optimize in ${bucketName}`);

  for (const file of images) {
    console.log(`\nProcessing ${file.name}...`);
    try {
      // 1. Download the original image
      const { data: blob, error: downloadError } = await supabase.storage.from(bucketName).download(file.name);
      if (downloadError) throw downloadError;

      const buffer = Buffer.from(await blob.arrayBuffer());
      
      const metadata = await sharp(buffer).metadata();
      
      let sharpInstance = sharp(buffer);
      
      if (metadata.width && metadata.width > maxWidth) {
        sharpInstance = sharpInstance.resize({ width: maxWidth, withoutEnlargement: true });
        console.log(`  Resizing from ${metadata.width}px to ${maxWidth}px`);
      } else {
        console.log(`  Keeping original width: ${metadata.width}px`);
      }

      // Convert to webp with high compression
      const optimizedBuffer = await sharpInstance
        .webp({ quality })
        .toBuffer();

      const origSize = (buffer.length / 1024).toFixed(2);
      const newSize = (optimizedBuffer.length / 1024).toFixed(2);
      console.log(`  Size change: ${origSize} KB -> ${newSize} KB`);

      if (optimizedBuffer.length >= buffer.length && metadata.format === "webp") {
          console.log(`  Skipping upload: Optimized size is not smaller than original, and already webp.`);
          continue;
      }

      // Overwrite the existing file but set contentType to image/webp.
      // This way DB links stay the same, but the browser sees the webp.
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(file.name, optimizedBuffer, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;
      console.log(`  Successfully overwritten ${file.name}`);

    } catch (err) {
      console.error(`  Error processing ${file.name}:`, err.message);
    }
  }
}

async function main() {
  try {
    await optimizeBucket("category-images", 300, 70);
    await optimizeBucket("product-images2", 800, 80);
    console.log("\nDone optimizing all images!");
  } catch(e) {
    console.error(e)
  }
}

main();
