// Editable marketing & policy copy. Kept in one place so the owner (or the
// backend later) can update wording without touching page components.

import { config } from "@/lib/config";
import { formatINR } from "@/lib/utils";

export const aboutContent = {
  intro:
    "Bhaktanjaneya Sweets began in a family kitchen in Tapeswaram with a simple promise — pure ghee, fresh ingredients, and absolutely no artificial flavour. Today we bring those same time-honoured Andhra recipes to your doorstep across India.",
  story: [
    "Tapeswaram is famous for its kaja, and our story grew from that same tradition — sweets made for family and festivals that slowly became a small-batch kitchen trusted by Telugu homes across the country.",
    "We still make everything the way we always have: in small batches, with premium ingredients, and with the patience that traditional recipes demand. Nothing leaves our kitchen unless we would happily serve it at our own table.",
    "Whether it is a festive box of Kaju Patisa or an everyday packet of Agra Mixture, every order carries the same care that started it all.",
  ],
  stats: [
    { value: "100%", label: "Pure ghee" },
    { value: "8+", label: "Signature items" },
    { value: "4.6★", label: "Customer rated" },
    { value: "Fresh", label: "Made to order" },
  ],
};

export const bulkContent = {
  intro:
    "Planning a wedding, festival, or corporate gifting order? We make bulk ordering simple, with custom packaging and pricing for large quantities.",
  benefits: [
    {
      title: "Festivals & Weddings",
      text: "Assorted boxes and hampers in the quantities you need, packed fresh for the occasion.",
    },
    {
      title: "Corporate Gifting",
      text: "Branded or custom-packed gift boxes for clients and teams, delivered on schedule.",
    },
    {
      title: "Best Bulk Pricing",
      text: "Special per-kg pricing on large orders — the bigger the order, the better the rate.",
    },
    {
      title: "Made to Order",
      text: "Everything is prepared fresh for your delivery date, never sitting on a shelf.",
    },
  ],
};

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: "How do I place an order?",
    a: "Add items to your cart, choose your delivery address and payment method, and place the order from checkout. Logged-in customers can track orders from My Account.",
  },
  {
    q: "Do you use pure ghee?",
    a: "Yes. Every sweet is made with 100% pure ghee and natural ingredients — never any artificial flavour or hydrogenated fats.",
  },
  {
    q: "How fresh are the products?",
    a: "We make everything in small batches, often to order, so your sweets and namkeen reach you as fresh as possible.",
  },
  {
    q: "What areas do you deliver to?",
    a: `We deliver across serviceable Indian PIN codes through trusted courier and postal partners. Shipping is free on eligible orders above ${formatINR(config.freeShippingThreshold)}; smaller orders show a delivery charge at checkout before you pay.`,
  },
  {
    q: "What payment methods do you accept?",
    a: "You can pay securely online via UPI, debit/credit cards, and net banking through our payment partner. You can also place your order directly on WhatsApp and we'll guide you through payment.",
  },
  {
    q: "Can I place a bulk or gifting order?",
    a: "Absolutely. Visit our Bulk Orders page or message us on WhatsApp and we'll help you put together the perfect order with custom packaging and the best per-kg pricing.",
  },
  {
    q: "Can I cancel or change my order?",
    a: "Cancellations and changes are easiest before we prepare or dispatch your order, so contact us as soon as possible with your order number. Once food is prepared or shipped, cancellation and refund options may be limited.",
  },
  {
    q: "Can I save my delivery address?",
    a: "Yes. Create an account and save your default delivery address from My Account, or choose to save the address while checking out.",
  },
];

export interface PolicySection {
  heading: string;
  body: string[];
}

export interface Policy {
  title: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
}

export const policies: Record<string, Policy> = {
  shipping: {
    title: "Shipping Policy",
    updated: "2026-06-12",
    intro:
      "We prepare and pack every order with freshness in mind. This policy explains where we ship, when orders are dispatched, how tracking works, and what happens if a delivery is delayed.",
    sections: [
      {
        heading: "Delivery areas & charges",
        body: [
          "We deliver across serviceable PIN codes in India through trusted courier and postal partners. If a PIN code is temporarily not serviceable, we will contact you before processing the order.",
          "Shipping is free on eligible orders above the free-shipping threshold shown at checkout. Orders below that threshold may include a standard delivery charge, shown before payment or order confirmation.",
          "For bulk, wedding, corporate, or fragile gifting orders, delivery charges and timelines may vary based on quantity, packaging, destination, and urgency.",
        ],
      },
      {
        heading: "Processing, dispatch & delivery time",
        body: [
          "Most regular orders are prepared and dispatched within 1-3 business days. Freshly made or high-volume orders may need extra preparation time.",
          "After dispatch, typical delivery takes 2-7 business days depending on city, state, courier route, holidays, weather, and local restrictions.",
          "Dispatch and delivery timelines are estimates, not guarantees. We will keep you informed if we notice an unusual delay.",
        ],
      },
      {
        heading: "Tracking updates",
        body: [
          "Once an order is shipped, our admin team can add the delivery company and delivery/tracking ID. Logged-in customers can view those details from My Account.",
          "Courier tracking may take a few hours to become active after dispatch. If a tracking ID does not update immediately, please check again later or contact us.",
          "For local or hand-delivered orders, tracking may be shared as a delivery ID or manual update instead of a courier tracking URL.",
        ],
      },
      {
        heading: "Packaging & freshness",
        body: [
          "Products are sealed and packed to protect freshness during transit. We choose packaging based on product type, weight, and expected travel time.",
          "Some sweets are delicate by nature. Minor movement, light surface marks, or shape variation may happen during transit and does not usually affect quality or taste.",
          "Please store products as instructed after delivery. Heat, sunlight, and moisture can affect sweets and namkeen quickly.",
        ],
      },
      {
        heading: "Incorrect address or missed delivery",
        body: [
          "Customers are responsible for entering a complete and reachable delivery address, including house number, street, area, city, state, and PIN code.",
          "If a courier cannot deliver due to an incorrect address, unavailable recipient, refused delivery, or repeated failed attempts, extra re-shipping charges may apply.",
          "Please contact us quickly if you notice an address mistake after placing an order. We can update it only before dispatch.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    updated: "2026-06-12",
    intro:
      "Because we sell food products, returns and refunds are handled carefully for hygiene, safety, and fairness. This policy explains when we can help with a replacement, refund, or support review.",
    sections: [
      {
        heading: "Food-safety return rule",
        body: [
          "Sweets, namkeen, pickles, podi, and other edible items cannot be returned once delivered because we cannot resell or reuse food products after they leave our control.",
          "Please check the package as soon as it arrives. If something looks wrong, keep the product, packaging, and invoice/order details until our team reviews the issue.",
        ],
      },
      {
        heading: "Damaged or incorrect orders",
        body: [
          "If your order arrives damaged, spoiled, leaking, missing items, or different from what you ordered, contact us within 24 hours of delivery.",
          "Please share clear photos or videos of the outer package, inner packing, product condition, shipping label, and order number. This helps us verify the issue with our packing and courier partners.",
          "After verification, we may offer a replacement, store credit, partial refund, full refund, or another fair resolution depending on the situation.",
        ],
      },
      {
        heading: "Refund timelines",
        body: [
          "Approved refunds are processed to the original payment method where possible. Bank, UPI, card, or payment-gateway timelines may vary after we initiate the refund.",
          "Shipping charges may be non-refundable unless the issue was caused by us or the courier partner.",
        ],
      },
      {
        heading: "What is not covered",
        body: [
          "Taste preference, minor handmade shape variation, slight color variation, delayed consumption, improper storage after delivery, or damage caused after delivery usually does not qualify for refund.",
          "We cannot approve claims reported after 24 hours unless there is a clear, verifiable reason for the delay.",
          "Orders cancelled after preparation or dispatch may not be eligible for a full refund.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "2026-06-12",
    intro:
      "We collect only the information needed to create accounts, process orders, deliver products, provide support, and improve the shopping experience.",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "When you sign up or place an order, we may collect your name, phone number, email address, saved delivery address, order items, payment method, and order history.",
          "Your phone number is used for delivery coordination, order support, and important order updates.",
          "If you save an address in your account, we use it to prefill checkout and reduce mistakes in future orders.",
        ],
      },
      {
        heading: "How we use your information",
        body: [
          "We use your information to confirm orders, collect payment, dispatch products, share tracking updates, handle refunds or replacements, and respond to support requests.",
          "We may use order history to improve our catalog, packaging, availability planning, and customer experience.",
          "If we send promotional messages, we aim to keep them relevant and limited. You can ask us to stop promotional communication at any time.",
        ],
      },
      {
        heading: "Sharing with service providers",
        body: [
          "We share only necessary information with delivery partners, payment processors, hosting/database providers, and support tools required to run the business.",
          "We do not sell your personal information to third parties.",
          "Payment details are handled by payment partners such as Razorpay. We do not store card numbers, CVV, UPI PINs, or netbanking passwords.",
        ],
      },
      {
        heading: "Data security & retention",
        body: [
          "We use reasonable technical and operational safeguards to protect customer data. No online system can be guaranteed 100% secure, but we work to reduce risk.",
          "We retain account, order, and invoice information as needed for service, legal, tax, fraud-prevention, and customer-support purposes.",
          "You can contact us to correct your profile details or ask questions about your stored information.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "2026-06-12",
    intro:
      "By using this website, creating an account, or placing an order, you agree to these terms. Please read them together with our Shipping, Returns, and Privacy policies.",
    sections: [
      {
        heading: "Orders & pricing",
        body: [
          "All prices are shown in Indian Rupees and may change without prior notice. The final payable amount is shown at checkout before order confirmation.",
          "Orders are subject to product availability, payment confirmation, delivery serviceability, and our internal acceptance.",
          "We may cancel or modify an order if an item is unavailable, pricing is incorrect, payment fails, delivery is not serviceable, or the order appears fraudulent. If payment was collected, eligible refunds will be initiated.",
        ],
      },
      {
        heading: "Product information",
        body: [
          "We try to keep product descriptions, images, ingredients, weights, and prices accurate. However, handmade products may have natural variation in shape, color, size, and finish.",
          "Images are for representation. Actual packaging and presentation may vary based on stock, season, courier requirements, and product type.",
          "Customers with allergies should contact us before ordering. Our kitchen may handle nuts, dairy, gluten, spices, and other allergens.",
        ],
      },
      {
        heading: "Customer responsibilities",
        body: [
          "You agree to provide accurate account, contact, delivery, and payment information. Incorrect details can delay or prevent delivery.",
          "You are responsible for keeping your account access secure. Do not share passwords, verification links, or one-time codes from email with anyone claiming to be from our team.",
          "You agree not to misuse the website, interfere with its operation, or place fraudulent or abusive orders.",
        ],
      },
      {
        heading: "Payments, cancellations & support",
        body: [
          "Payments are made securely online through our third-party payment partners (UPI, cards, and net banking).",
          "Cancellation requests are easiest to accept before preparation or dispatch. Once food is prepared or shipped, cancellation and refund options may be limited.",
          "For any question about an order, contact us with your order number and registered phone number so we can help quickly.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "We are responsible for preparing and dispatching your order with reasonable care. We are not liable for indirect losses, missed occasions, or delays caused by events outside our control.",
          "Nothing in these terms limits rights that cannot be limited under applicable law.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "For questions about these terms or any order, please contact us via WhatsApp or email using the details available on the website.",
          "We may update these terms from time to time. The latest version will always be available on this page.",
        ],
      },
    ],
  },
};

export const policySlugs = Object.keys(policies);
