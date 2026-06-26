import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { NewsletterForm } from "@/components/NewsletterForm";
import {
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
} from "@/components/icons/BrandIcons";
import { config } from "@/lib/config";

const companyLinks = [
  { href: "/about", label: "Our Story" },
  { href: "/bulk-orders", label: "Bulk & Corporate Orders" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

const policyLinks = [
  { href: "/policies/shipping", label: "Shipping Policy" },
  { href: "/policies/returns", label: "Returns & Refunds" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms of Service" },
];

const socials = [
  { href: config.social.instagram, label: "Instagram", icon: InstagramIcon },
  { href: config.social.facebook, label: "Facebook", icon: FacebookIcon },
  { href: config.social.youtube, label: "YouTube", icon: YoutubeIcon },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-saffron-400">
        {title}
      </h3>
      <ul className="space-y-2.5 text-sm text-cream-100/80">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="transition-colors hover:text-saffron-300">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 bg-maroon-900 text-cream-50 sm:mt-10">
      <Container>
        <div className="grid min-w-0 gap-y-9 py-12 lg:grid-cols-[2fr_1fr_1fr_1.7fr] lg:gap-10 lg:py-14">
          {/* Brand */}
          <div className="min-w-0 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Bhaktanjaneya Sweets"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-full"
              />
              <span className="font-serif text-xl font-bold leading-tight">
                Bhaktanjaneya
                <span className="block text-sm font-medium text-saffron-300">
                  Sweets
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/80">
              {config.tagline} Traditional recipes, premium ingredients, and pure
              ghee in every bite.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 transition-colors hover:bg-saffron-500 hover:text-maroon-900"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — 2-up on mobile, inline on desktop */}
          <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-9 lg:contents">
            <FooterColumn title="Company" links={companyLinks} />
            <FooterColumn title="Policies" links={policyLinks} />
          </div>

          {/* Newsletter + contact */}
          <div className="min-w-0 text-center lg:col-span-1 lg:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-saffron-400">
              Stay in touch
            </h3>
            <NewsletterForm stacked />
            <ul className="mt-5 flex flex-col items-center space-y-2.5 text-sm text-cream-100/80 lg:items-start">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-saffron-400" />
                <span className="min-w-0">{config.contact.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-saffron-400" />
                <a href={`tel:${config.contact.phone.replace(/\s/g, "")}`} className="hover:text-saffron-300">
                  {config.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-saffron-400" />
                <a href={`mailto:${config.contact.email}`} className="min-w-0 break-all hover:text-saffron-300">
                  {config.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      <div className="border-t border-cream-50/10">
        <Container>
          <div className="flex min-w-0 flex-col items-center justify-center gap-3 py-5 text-center text-xs text-cream-100/70">
            <p className="min-w-0">
              &copy; {new Date().getFullYear()} {config.businessName}. All rights
              reserved.
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
