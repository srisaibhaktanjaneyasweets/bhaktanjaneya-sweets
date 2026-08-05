export type FAQItem = {
  question: string;
  answer: string;
};

const SWEETS_FAQS: FAQItem[] = [
  {
    question: "Is this made with 100% pure desi ghee?",
    answer:
      "Yes, all our traditional sweets are prepared exclusively using 100% pure desi ghee to ensure authentic taste, superior quality, and longer shelf life. We never use refined oils or dalda.",
  },
  {
    question: "How long does it stay fresh?",
    answer:
      "Most of our ghee sweets have a shelf life of 15 to 20 days when stored in an airtight container at room temperature. Please keep them away from direct sunlight.",
  },
  {
    question: "Do you use artificial preservatives?",
    answer:
      "No! We strictly avoid artificial preservatives, colors, and flavors. Our recipes rely on traditional cooking methods and pure ingredients to maintain freshness.",
  },
];

const NAMKEEN_FAQS: FAQItem[] = [
  {
    question: "What oil is used for frying?",
    answer:
      "Our namkeen and savory snacks are fried in fresh, high-quality, double-refined groundnut or sunflower oil for the best taste and crispiness.",
  },
  {
    question: "How long will this stay crispy?",
    answer:
      "When stored properly in an airtight container, our namkeen will remain crunchy and fresh for up to 30 days.",
  },
  {
    question: "Is it very spicy?",
    answer:
      "Our traditional Andhra namkeen has a moderate, authentic spice level. It offers a flavorful kick without being overwhelmingly hot, perfect for evening tea.",
  },
];

const PICKLE_FAQS: FAQItem[] = [
  {
    question: "How should I store this pickle?",
    answer:
      "To preserve the best flavor and extend the shelf life up to 6 months, store the pickle in a cool, dry place. Always use a clean, dry spoon to serve.",
  },
  {
    question: "Are there artificial preservatives?",
    answer:
      "We do not use any artificial preservatives. The natural blend of premium oil, salt, and spices acts as a traditional preservative.",
  },
];

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "How many days will it take for delivery?",
    answer:
      "We offer fast, pan-India delivery. Orders are typically processed within 24 hours and delivered to your doorstep within 3 to 6 working days, depending on your location.",
  },
  {
    question: "How can I order in bulk for events?",
    answer:
      "For bulk orders, corporate gifting, or wedding sweets, please contact us directly on WhatsApp. We offer special packaging and bulk rates.",
  },
];

export function getProductFAQs(productName: string, category: string): FAQItem[] {
  const normalizedCategory = category.toLowerCase();
  const normalizedName = productName.toLowerCase();
  
  let contextualFAQs: FAQItem[] = [];

  if (
    normalizedCategory.includes("sweet") ||
    normalizedCategory.includes("special") ||
    normalizedName.includes("kaja") ||
    normalizedName.includes("laddu") ||
    normalizedName.includes("putharekulu")
  ) {
    contextualFAQs = [...SWEETS_FAQS];
  } else if (
    normalizedCategory.includes("namkeen") ||
    normalizedCategory.includes("snack") ||
    normalizedCategory.includes("mixture")
  ) {
    contextualFAQs = [...NAMKEEN_FAQS];
  } else if (normalizedCategory.includes("pickle")) {
    contextualFAQs = [...PICKLE_FAQS];
  }

  // Always append the default shipping/bulk FAQs.
  return [...contextualFAQs, ...DEFAULT_FAQS];
}
