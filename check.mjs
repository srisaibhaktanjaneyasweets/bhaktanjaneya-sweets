import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPosts() {
  const { data: posts, error } = await supabase.from('posts').select('slug, cover');
  if (error) {
    console.error('Failed to fetch posts:', error);
    return;
  }
  console.log(posts);
}
checkPosts();
