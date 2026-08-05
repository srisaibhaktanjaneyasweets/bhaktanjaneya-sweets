"use client";

import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { EnquiryForm } from "@/components/EnquiryForm";
import { config } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { useBusinessConfig } from "@/context/BusinessConfigContext";

type ContactDetail = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};

export function ContactClient() {
  const { config: businessConfig } = useBusinessConfig();

  const details: ContactDetail[] = [
    {
      icon: Phone,
      label: "Phone",
      value: businessConfig.phone,
      href: `tel:${businessConfig.phone.replace(/\s/g, "")}`,
    },
    {
      icon: Mail,
      label: "Email",
      value: businessConfig.email,
      href: `mailto:${businessConfig.email}`,
    },
    {
      icon: MapPin,
      label: "Address",
      value: businessConfig.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${config.businessName}, ${businessConfig.address}`,
      )}`,
      external: true,
    },
    {
      icon: Clock,
      label: "Hours",
      value: config.supportHours,
    },
  ];

  return (
    <div className="py-12">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-3 text-ink-500">
            Questions about an order or a product? Reach out and
            we&apos;ll get back to you quickly.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Details */}
          <div className="min-w-0">
            <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-soft">
              <h2 className="font-serif text-xl font-semibold text-maroon-900">
                Contact details
              </h2>
              <ul className="mt-5 space-y-4">
                {details.map(({ icon: Icon, label, value, href, external }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-500">
                        {label}
                      </p>
                      {href ? (
                        <a
                           href={href}
                           {...(external
                             ? { target: "_blank", rel: "noopener noreferrer" }
                             : {})}
                           className="text-sm font-medium text-maroon-900 hover:text-saffron-700"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-maroon-900">
                          {value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-ink-500">
                We usually reply within a few hours during business hours.
              </p>

              <a
                href={waLink(`Hello ${config.businessName}! I have a question.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#35B664] text-sm font-semibold text-white hover:bg-[#2E9E57]"
              >
                <MessageCircle size={18} /> Message us on WhatsApp
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="min-w-0">
            <h2 className="mb-4 font-serif text-xl font-semibold text-maroon-900">
              Send an enquiry
            </h2>
            <EnquiryForm
              prefix="I have an enquiry:"
              messagePlaceholder="How can we help you?"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
