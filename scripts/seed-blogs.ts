import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot seed database.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const blogs = [
  {
    slug: "authentic-taste-of-tapeswaram-sweets",
    title: "The Authentic Taste of Tapeswaram Sweets: A Journey Through Tradition",
    excerpt: "Discover why Tapeswaram Sweets, especially the famous Tapeswaram Kaja, are celebrated across the globe. A deep dive into pure ghee traditions.",
    author: "Bhaktanjaneya Sweets",
    cover: "https://placehold.co/800x600/orange/white?text=Tapeswaram+Sweets",
    date: new Date().toISOString().split("T")[0],
    readMinutes: 4,
    content: [
      "When it comes to authentic Andhra sweets, **Tapeswaram Sweets** hold a legendary status. Tapeswaram is not just a small town; it is the birthplace of the world-famous Tapeswaram Kaja, a delicacy that has won hearts for generations.",
      "At Sri Sai Bhaktanjaneya Sweets, we take immense pride in carrying forward this rich culinary heritage. Our Tapeswaram Kaja—whether it's the syrupy, layered *Madatha Kaja* or the crisp, juicy *Gottam Kaja*—is prepared using the same traditional methods passed down through generations.",
      "What makes Tapeswaram Sweets so special? It's the uncompromising quality of ingredients. We use only 100% pure ghee, premium flour, and just the right amount of sweetness. Every batch is handcrafted with love to ensure that authentic, melt-in-the-mouth texture.",
      "Whether you are celebrating a festival, a wedding, or just craving a taste of home, ordering our authentic Tapeswaram Sweets online brings that traditional joy right to your doorstep. Experience the magic of pure ghee and time-honored recipes today!"
    ],
    active: true,
    featured: true
  },
  {
    slug: "why-rajamundry-sweets-are-famous",
    title: "Why Rajamundry Sweets are Famous Across Andhra Pradesh",
    excerpt: "Explore the culinary magic of Rajamundry Sweets. From pure ghee Ariselu to delicate Putharekulu, learn what makes them so special.",
    author: "Bhaktanjaneya Sweets",
    cover: "https://placehold.co/800x600/red/white?text=Rajamundry+Sweets",
    date: new Date().toISOString().split("T")[0],
    readMinutes: 3,
    content: [
      "Rajamundry is celebrated for many things—its rich culture, the majestic Godavari river, and its incredible culinary traditions. **Rajamundry Sweets** have carved out a special place in the hearts of food lovers across India.",
      "The secret behind the fame of Rajamundry Sweets lies in the meticulous preparation and the use of locally sourced, high-quality ingredients. Sweets like *Ariselu*, *Pootharekulu* (Paper Sweets), and the classic pure ghee *Laddu* are staples that represent the essence of Andhra festivities.",
      "At Sri Sai Bhaktanjaneya Sweets, we bring you the finest selection of Rajamundry Sweets. Our Ariselu are perfectly golden and crisp, made with pure ghee and jaggery, offering a taste that is both rich and nostalgic.",
      "Don't miss out on the authentic flavors of Rajamundry. We deliver these pure ghee delicacies pan-India so you can enjoy the traditional taste of Andhra Pradesh wherever you are."
    ],
    active: true,
    featured: false
  },
  {
    slug: "secret-behind-pure-ghee-tapeswaram-kaja",
    title: "The Secret Behind Our Pure Ghee Tapeswaram Kaja",
    excerpt: "Ever wondered how the Tapeswaram Kaja gets its perfect flaky layers and syrupy center? We reveal the magic behind our most loved sweet.",
    author: "Bhaktanjaneya Sweets",
    cover: "https://placehold.co/800x600/yellow/black?text=Tapeswaram+Kaja",
    date: new Date().toISOString().split("T")[0],
    readMinutes: 5,
    content: [
      "The **Tapeswaram Kaja** is an engineering marvel in the world of sweets. With its distinct flaky layers on the outside and a juicy, syrup-filled core, it offers a texture profile that is hard to replicate.",
      "The secret begins with the dough. It requires the perfect balance of moisture and resting time. Once rolled out into thin sheets, it is carefully folded (hence the name *Madatha Kaja*, meaning 'folded') to trap air between the layers.",
      "Frying is where the magic happens. We fry our Kaja exclusively in pure, aromatic ghee at a precisely controlled temperature. This ensures the layers puff up beautifully without absorbing excess fat.",
      "Finally, the hot Kaja is dropped into a fragrant sugar syrup infused with cardamom. The hot pastry immediately drinks up the syrup, securing that juicy burst in every bite. Order your box of authentic Tapeswaram Kaja today and taste the tradition yourself!"
    ],
    active: true,
    featured: false
  }
];

async function seed() {
  console.log("Seeding blogs...");
  
  for (const blog of blogs) {
    // Note: read_minutes vs readMinutes matching Supabase schema. 
    // In types.ts it is readMinutes, in db it might be read_minutes.
    // I will use read_minutes if it fails, but types.ts has readMinutes. Let's map it.
    const dbBlog = {
      ...blog,
      read_minutes: blog.readMinutes,
    };
    delete (dbBlog as any).readMinutes;

    const { error } = await supabaseAdmin
      .from("posts")
      .upsert(dbBlog, { onConflict: "slug" });
      
    if (error) {
      console.error(`Failed to insert blog: ${blog.slug}`, error);
    } else {
      console.log(`Successfully inserted blog: ${blog.slug}`);
    }
  }
  
  console.log("Seeding complete!");
}

seed();
