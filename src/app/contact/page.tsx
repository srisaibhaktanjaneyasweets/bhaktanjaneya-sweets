import type { Metadata } from "next";
import { ContactClient } from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Bhaktanjaneya Sweets. Order on WhatsApp, call us, or send an enquiry about our sweets and namkeen.",
};

export default function ContactPage() {
  return <ContactClient />;
}
