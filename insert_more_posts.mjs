import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const posts = [
  {
    slug: 'history-of-tapeswaram-kaja',
    title: 'Tapeswaram Kaja: The Legendary Layered Sweet of Coastal Andhra',
    excerpt: 'Discover the rich history and unique preparation method of Tapeswaram Kaja, a juicy, multi-layered traditional sweet from the Godavari districts.',
    author: 'Admin',
    cover: '/images/hero/hero-laddu.png',
    date: '2026-08-06',
    read_minutes: 5,
    active: true,
    featured: true,
    content: [
      '### The Origins in Tapeswaram',
      'The tiny village of Tapeswaram in the East Godavari district of Andhra Pradesh holds a massive reputation in the world of Indian sweets. It is the birthplace of the famous **Tapeswaram Kaja** (also known as Madatha Kaja), a sweet that perfectly balances a crispy, flaky exterior with a rich, syrup-soaked interior.',
      'Unlike standard sweets that are simply mixed and shaped, the Tapeswaram Kaja requires a high level of artisanal skill and patience.',
      '### The Art of the Fold (Madatha)',
      'The word *Madatha* translates to "fold" in Telugu, which describes the defining characteristic of this sweet. A dough made of refined wheat flour (maida) and pure desi ghee is rolled out into an incredibly thin sheet. This sheet is then carefully folded over itself multiple times, creating numerous delicate layers.',
      'Once the layered dough is cut into diamond or rectangular shapes, it is deep-fried in pure ghee until it puffs up, separating the layers and achieving a perfect golden-brown crispness.',
      '### The Secret of the Syrup',
      'Immediately after frying, the hot Kajas are submerged in a thick sugar syrup flavored with cardamom. Because of the folded layers, the syrup seeps deep into the core of the sweet. When you bite into a Tapeswaram Kaja, you first experience the shatter of the crispy outer crust, followed instantly by a burst of sweet, aromatic syrup from the inside.',
      '### Buy Authentic Tapeswaram Kaja',
      'To experience the true taste of this Godavari delicacy, it must be prepared using traditional methods and 100% pure ghee. At **Bhaktanjaneya Sweets**, we honor the original recipe to bring you the most authentic Tapeswaram Kaja. Order a box today and taste a piece of Andhra\'s culinary history!'
    ]
  },
  {
    slug: 'gottam-kaja-kakinada-crispy-delicacy',
    title: 'Gottam Kaja: The Crunchy, Syrup-Filled Marvel from Kakinada',
    excerpt: 'Often overshadowed by its softer cousin, Gottam Kaja is the undisputed king of crunch. Learn what makes this Kakinada specialty so irresistible.',
    author: 'Admin',
    cover: '/images/hero/hero-laddu.png',
    date: '2026-08-05',
    read_minutes: 4,
    active: true,
    featured: false,
    content: [
      '### The Pride of Kakinada',
      'While Tapeswaram is famous for the folded Madatha Kaja, the coastal city of Kakinada boasts its own legendary variation: the **Gottam Kaja**. Also known as Kakinada Kaja, this sweet is completely different in texture, shape, and experience.',
      '### What is a Gottam Kaja?',
      'The word *Gottam* means "tube" or "cylinder" in Telugu. Unlike the flat, layered Madatha Kaja, the Gottam Kaja is shaped like a small, hollow cylinder. The dough is rolled thick, shaped into a tube, and deep-fried slowly over a low flame. This slow frying process is crucial—it ensures the exterior becomes incredibly hard and crunchy while the inside remains hollow and slightly soft.',
      '### A Textural Masterpiece',
      'Once fried, these crunchy tubes are soaked in a rich sugar syrup. The hard, almost shell-like exterior prevents the sweet from becoming soggy, while the hollow center acts as a reservoir, trapping the delicious syrup inside.',
      'The result is a textural masterpiece: an aggressively crunchy bite that immediately yields to a gush of sweet syrup. It is a sweet that demands to be eaten fresh and is an absolute favorite at traditional Andhra weddings.',
      '### Madatha Kaja vs. Gottam Kaja',
      'If you prefer a soft, flaky, melt-in-the-mouth texture, the Tapeswaram Madatha Kaja is for you. But if you love a satisfying crunch followed by a burst of liquid sweetness, the Gottam Kaja is unmatched.',
      'At **Bhaktanjaneya Sweets**, we perfectly execute the slow-frying technique required for authentic Gottam Kaja. Add a box to your cart and experience the iconic crunch of Kakinada.'
    ]
  },
  {
    slug: 'bestsellers-guide-bhaktanjaneya-sweets',
    title: 'First Time Here? A Guide to Our Bestselling Sweets & Namkeen',
    excerpt: 'Not sure what to order? Explore our top-selling traditional sweets, crispy namkeen, and authentic pickles that keep our customers coming back for more.',
    author: 'Admin',
    cover: '/images/hero/hero-laddu.png',
    date: '2026-08-04',
    read_minutes: 6,
    active: true,
    featured: true,
    content: [
      '### Welcome to Bhaktanjaneya Sweets',
      'If it is your first time ordering from us, you might be overwhelmed by the variety of traditional sweets, crispy namkeen, and spicy pickles on our menu. To help you build the perfect order, we have compiled a list of our all-time bestsellers—the items our customers simply cannot get enough of.',
      '### 1. The Legendary Kajas',
      'You cannot visit our store without trying our signature Kajas.',
      '- **Tapeswaram Madatha Kaja:** A flaky, layered pastry deep-fried in pure ghee and soaked in syrup. It is soft, juicy, and melts in your mouth.',
      '- **Gottam Kaja:** The crunchy cousin from Kakinada. It features a hard, crisp shell with a hollow center filled with sweet syrup.',
      '### 2. Atreyapuram Pootharekulu',
      'Often called the "paper sweet," these translucent sheets of rice batter are stuffed with pure ghee and your choice of Jaggery (Bellam) or Sugar, mixed with premium dry fruits. The Bellam Pootharekulu is our highest-rated traditional sweet.',
      '### 3. Classic Pure Ghee Sweets',
      '- **Ghee Mysore Pak:** Unlike the hard, porous versions found elsewhere, our Mysore Pak is incredibly soft, rich, and dripping with pure desi ghee.',
      '- **Bandar Laddu (Tokkudu Laddu):** A smooth, creamy laddu made by pounding besan and jaggery together, originating from Machilipatnam.',
      '### 4. Crunchy Namkeen & Mixture',
      'Balance the sweetness with our savory bestsellers.',
      '- **Agra Mixture:** A tangy, sweet, and spicy blend of sev, lentils, and peanuts. It is our most popular tea-time snack.',
      '- **Karappusa:** Traditional, minimalist sev that is perfectly crisp and lightly spiced.',
      '### 5. Authentic Andhra Pickles',
      'Finish your order with a jar of our famous pickles.',
      '- **Mango Avakaya:** The undisputed king of Andhra pickles, made with raw mangoes, pungent mustard powder, and fiery red chilies.',
      '- **Chicken Pickle:** Our bestselling Non-Veg pickle, featuring deep-fried, heavily spiced chunks of chicken that act as a perfect side dish for rice.',
      '### Build Your Box',
      'Ready to taste the authentic flavors of Andhra Pradesh? Head over to our **Shop** page and add these bestsellers to your cart today!'
    ]
  }
];

async function insert() {
  const { data, error } = await supabase.from('posts').upsert(posts, { onConflict: 'slug' });
  if (error) {
    console.error('Error inserting posts:', error);
  } else {
    console.log('Successfully inserted', posts.length, 'new posts.');
  }
}

insert();
