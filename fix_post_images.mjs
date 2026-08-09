import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPostImages() {
  const { data: posts, error } = await supabase.from('posts').select('*');
  if (error) {
    console.error('Failed to fetch posts:', error);
    return;
  }

  let updatedCount = 0;
  for (const post of posts) {
    if (post.cover && post.cover.endsWith('.png')) {
      const newCover = post.cover.replace('.png', '.webp');
      const { error: updateError } = await supabase
        .from('posts')
        .update({ cover: newCover })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Failed to update post ${post.slug}:`, updateError);
      } else {
        console.log(`Updated post ${post.slug} cover to ${newCover}`);
        updatedCount++;
      }
    }
  }
  console.log(`Fixed ${updatedCount} posts.`);
}

fixPostImages();
