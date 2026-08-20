import type { Metadata } from "next";
import { ContactClient } from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Contact Bhaktanjaneya Sweets | WhatsApp Orders",
  description:
    "Contact Bhaktanjaneya Sweets for quick WhatsApp orders, bulk sweets enquiries, gifting support, and delivery help across India.",
};

export default function ContactPage() {
  return <ContactClient />;
}
