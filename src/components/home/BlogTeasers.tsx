import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPosts } from "@/lib/api/posts";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

function LeadCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-cream-200 bg-white transition-colors hover:border-saffron-400/50 sm:grid-cols-2"
    >
      <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[260px]">
        <Image
          src={post.cover}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-saffron-600">
          Featured · {formatDate(post.date)} · {post.readMinutes} min read
        </p>
        <h3 className="line-clamp-2 font-serif text-xl font-semibold leading-snug text-maroon-900 transition-colors group-hover:text-saffron-600 sm:text-2xl">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-500">
            {post.excerpt}
          </p>
        )}
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-maroon-800">
          Read article
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function CompactCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-cream-200 bg-white p-3 transition-colors hover:border-saffron-400/50 hover:bg-cream-50"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-100">
        <Image src={post.cover} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {formatDate(post.date)} · {post.readMinutes} min read
        </p>
        <h3 className="mt-1 line-clamp-2 font-serif text-sm font-semibold leading-snug text-maroon-900 transition-colors group-hover:text-saffron-600">
          {post.title}
        </h3>
      </div>
      <ArrowRight
        size={18}
        className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-saffron-600"
      />
    </Link>
  );
}

export async function BlogTeasers() {
  const posts = await getPosts();
  if (!posts.length) return null;

  // The admin-toggled featured post leads; fall back to the newest post so the
  // lead slot is never empty. The next two posts fill the side-by-side row.
  const lead = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== lead.id).slice(0, 2);

  return (
    <section className="py-12">
      <Container>
        <SectionHeading
          eyebrow="From our kitchen"
          title="Stories & guides"
          action={
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-maroon-800 transition-colors hover:text-saffron-600"
            >
              All articles <ArrowRight size={15} />
            </Link>
          }
        />

        <div className="space-y-3">
          {/* Lead article spans the full width — i.e. the width of the two cards below. */}
          <LeadCard post={lead} />

          {rest.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {rest.map((p) => (
                <CompactCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
