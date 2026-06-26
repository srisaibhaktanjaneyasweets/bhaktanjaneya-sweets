import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getPosts } from "@/lib/api/posts";
import { formatDate } from "@/lib/utils";

// ISR: cached blog index, rebuilt at most once a minute (new posts within ~60s).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Stories, recipes, and gifting ideas from Bhaktanjaneya Sweets — celebrating pure-ghee tradition one post at a time.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="py-12">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            From our kitchen
          </h1>
          <p className="mt-3 text-ink-500">
            Tradition, taste, and the little things that make our sweets
            special.
          </p>
        </div>

        {/* Featured */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-10 grid overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft md:grid-cols-2"
          >
            <div className="relative aspect-[16/10] md:aspect-auto">
              <Image
                src={featured.cover}
                alt={featured.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-9">
              <div className="flex items-center gap-4 text-xs text-ink-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> {formatDate(featured.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} /> {featured.readMinutes} min read
                </span>
              </div>
              <h2 className="mt-3 font-serif text-2xl font-bold text-maroon-900 group-hover:text-maroon-700">
                {featured.title}
              </h2>
              <p className="mt-3 text-ink-600">{featured.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-600">
                Read article
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-4 text-xs text-ink-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} /> {formatDate(post.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} /> {post.readMinutes} min
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-maroon-900 group-hover:text-maroon-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-500">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-600">
                    Read more
                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
