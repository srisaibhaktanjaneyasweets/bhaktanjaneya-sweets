import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getPost, getPosts } from "@/lib/api/posts";
import { formatDate } from "@/lib/utils";
import { config } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [post.cover],
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const more = (await getPosts()).filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <article className="py-10">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-saffron-600"
          >
            <ArrowLeft size={16} /> Back to blog
          </Link>

          <h1 className="mt-5 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} /> {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} /> {post.readMinutes} min read
            </span>
            <span>By {post.author}</span>
          </div>

          <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-3xl border border-cream-200">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-700">
            {post.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-maroon-900 px-6 py-9 text-center text-cream-50">
            <h2 className="font-serif text-2xl font-bold">
              Hungry for the real thing?
            </h2>
            <p className="max-w-md text-sm text-cream-100/85">
              Order our fresh, pure-ghee sweets and namkeen today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex h-11 items-center rounded-full bg-saffron-400 px-6 text-sm font-semibold text-maroon-900 hover:bg-saffron-300"
              >
                Shop now
              </Link>
              <a
                href={waLink(`Hello ${config.businessName}!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#35B664] px-6 text-sm font-semibold text-white hover:bg-[#2E9E57]"
              >
                <MessageCircle size={17} /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* More posts */}
        {more.length > 0 && (
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="font-serif text-xl font-semibold text-maroon-900">
              Keep reading
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {more.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={p.cover}
                      alt={p.title}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-semibold text-maroon-900 group-hover:text-maroon-700">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                      {p.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </article>
  );
}
