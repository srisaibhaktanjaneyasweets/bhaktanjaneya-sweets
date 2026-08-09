export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Check if the image is hosted on Supabase Storage
  if (src.includes(".supabase.co/storage/v1/object/public/")) {
    // Convert to Supabase's image transformation API
    const renderUrl = src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=${width}&quality=${quality || 75}`;
  }

  // If the image is local or from another external source, return as-is.
  // This completely bypasses Vercel's Image Optimization, keeping it free.
  return src;
}
