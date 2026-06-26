import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { policies, policySlugs } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { config } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

export function generateStaticParams() {
  return policySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/policies/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const policy = policies[slug];
  if (!policy) return { title: "Policy not found" };
  return {
    title: policy.title,
    description: policy.intro,
  };
}

const NAV: { slug: string; label: string }[] = [
  { slug: "shipping", label: "Shipping" },
  { slug: "returns", label: "Returns & Refunds" },
  { slug: "privacy", label: "Privacy" },
  { slug: "terms", label: "Terms of Service" },
];

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="py-12">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Side nav */}
          <aside className="h-fit lg:sticky lg:top-24">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Policies
            </p>
            <nav className="mt-2 space-y-1">
              {NAV.map((item) => {
                const active = item.slug === slug;
                return (
                  <Link
                    key={item.slug}
                    href={`/policies/${item.slug}`}
                    className={
                      active
                        ? "block rounded-lg bg-maroon-800 px-3 py-2 text-sm font-medium text-cream-50"
                        : "block rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-cream-100"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-4xl">
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron-600">
                Bhaktanjaneya Sweets Policy
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
                {policy.title}
              </h1>
              <p className="mt-2 text-sm text-ink-400">
                Last updated {formatDate(policy.updated)}
              </p>
              <p className="mt-5 text-base leading-relaxed text-ink-600 sm:text-lg">
                {policy.intro}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {policy.sections.map((section, index) => (
                <section
                  key={section.heading}
                  className="rounded-2xl border border-cream-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-sm font-bold text-maroon-900">
                      {index + 1}
                    </span>
                    <h2 className="font-serif text-xl font-semibold text-maroon-900">
                      {section.heading}
                    </h2>
                  </div>
                  <div className="mt-3 space-y-3 text-base leading-relaxed text-ink-600">
                    {section.body.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-saffron-200 bg-saffron-50 p-5">
              <p className="text-sm text-ink-600">
                Need help with an order or a policy question? Message us on
                WhatsApp with your order number, phone number, and photos if the
                issue is about delivery or product condition.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={waLink(
                    `Hello ${config.businessName}! I have a question about the ${policy.title}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#35B664] px-5 text-sm font-semibold text-white hover:bg-[#2E9E57]"
                >
                  <MessageCircle size={17} /> Chat on WhatsApp
                </a>
                <a
                  href={`mailto:${config.contact.email}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-maroon-800/30 px-5 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
                >
                  <Mail size={16} /> {config.contact.email}
                </a>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </div>
  );
}
