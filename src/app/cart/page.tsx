"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Tag,
  ShoppingBag,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getActiveOffers } from "@/lib/api/offers";
import { lookupPincode } from "@/lib/api/pincode";
import type { PincodeLookup } from "@/lib/api/pincode";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/payments";
import { createOrder } from "@/lib/api/orders";
import { getErrorDetails, getErrorMessage } from "@/lib/api/errors";
import type { ErrorDetails } from "@/lib/api/errors";
import { formatAddressLines, isCompleteAddress } from "@/lib/address";
import { config } from "@/lib/config";
import {
  SERVICEABLE_STATES,
  citiesForState,
  isServiceableCity,
} from "@/lib/constants/serviceable-areas";
import { DeliveryLocationGate } from "@/components/cart/DeliveryLocationGate";
import { Combobox } from "@/components/ui/Combobox";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { formatINR, uid } from "@/lib/utils";
import type { Offer, Order, PaymentMethod, ShippingAddress } from "@/lib/types";

const fieldClass =
  "h-11 w-full rounded-xl border border-cream-300 bg-white px-4 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40";

function discountFor(offer: Offer | null, subtotal: number): number {
  if (!offer) return 0;
  if (offer.minSubtotal && subtotal < offer.minSubtotal) return 0;
  if (offer.type === "percent")
    return Math.round((subtotal * offer.value) / 100);
  if (offer.type === "flat") return Math.min(subtotal, offer.value);
  return 0;
}

export default function CartPage() {
  const { items, subtotal, setQty, remove, clear } = useCart();
  const { customer, updateCustomer } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [code, setCode] = useState("");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [codeError, setCodeError] = useState("");

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    config.razorpayEnabled ? "razorpay" : "cod",
  );

  const [checkoutError, setCheckoutError] = useState<ErrorDetails | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; method: PaymentMethod } | null>(null);
  const [pincodeDetails, setPincodeDetails] = useState<PincodeLookup | null>(null);
  const [lookingUpPincode, setLookingUpPincode] = useState(false);
  const [pincodeHint, setPincodeHint] = useState("");
  const lastLookupPincode = useRef("");

  const hasSavedAddress = isCompleteAddress(customer?.savedAddress);
  const savedAddressServiceable = isServiceableCity(
    customer?.savedAddress?.state,
    customer?.savedAddress?.city,
  );
  const cityOptions = citiesForState(state);

  function confirmDeliveryLocation(nextState: string, nextCity: string) {
    setState(nextState);
    setCity(nextCity);
    setDeliveryConfirmed(true);
    setCheckoutError(null);
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (hasSavedAddress) {
      setAddressMode("saved");
    }
  }, [hasSavedAddress]);

  useEffect(() => {
    if (customer?.name) setName((prev) => prev || customer.name || "");
    if (customer?.phone) setPhone((prev) => prev || customer.phone);
    if (customer?.email) setEmail((prev) => prev || customer.email || "");
    if (customer?.savedAddress) {
      setLine1((prev) => prev || customer.savedAddress?.line1 || "");
      setLine2((prev) => prev || customer.savedAddress?.line2 || "");
      setCity((prev) => prev || customer.savedAddress?.city || "");
      setState((prev) => prev || customer.savedAddress?.state || "");
      setDistrict((prev) => prev || customer.savedAddress?.district || "");
      setPincode((prev) => prev || customer.savedAddress?.pincode || "");
    }
  }, [customer]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    getActiveOffers().then(setOffers).catch(() => setOffers([]));
  }, []);

  const districtOptions = useMemo(() => {
    if (!pincodeDetails?.postOffices?.length) return [];
    return Array.from(new Set(pincodeDetails.postOffices.map((po) => po.district).filter(Boolean)));
  }, [pincodeDetails]);

  const findAddressByPincode = useCallback(async () => {
    if (!/^\d{6}$/.test(pincode.trim())) return;

    setPincodeHint("");
    setLookingUpPincode(true);
    try {
      const details = await lookupPincode(pincode.trim());
      lastLookupPincode.current = pincode.trim();
      setPincodeDetails(details);
      // State & city are chosen from the serviceable-area dropdowns, so the PIN
      // lookup only fills in the district/area hint — it must not override them.
      setDistrict((prev) => prev || details.district);

      const dists = Array.from(new Set(details.postOffices.map((po) => po.district).filter(Boolean)));
      if (dists.length === 1) {
        setDistrict(dists[0]);
      } else if (district && !dists.includes(district)) {
        setDistrict("");
      }
    } catch (error) {
      setPincodeHint(getErrorMessage(error, "Could not find this PIN code."));
    } finally {
      setLookingUpPincode(false);
    }
  }, [district, pincode]);

  useEffect(() => {
    if (addressMode !== "new") return;
    const nextPincode = pincode.trim();
    if (!/^\d{6}$/.test(nextPincode) || nextPincode === lastLookupPincode.current) {
      return;
    }
    void findAddressByPincode();
  }, [pincode, addressMode, findAddressByPincode]);

  const orderedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          a.name.localeCompare(b.name) ||
          a.variantLabel.localeCompare(b.variantLabel),
      ),
    [items],
  );

  const { taxAmount, extraChargesAmount } = useMemo(() => {
    return items.reduce((acc, item) => {
      // item.taxRate is % (e.g. 5), item.extraCharges is flat INR
      const tax = Math.round((item.price * (item.taxRate || 0)) / 100) * item.quantity;
      const extra = (item.extraCharges || 0) * item.quantity;
      return {
        taxAmount: acc.taxAmount + tax,
        extraChargesAmount: acc.extraChargesAmount + extra
      };
    }, { taxAmount: 0, extraChargesAmount: 0 });
  }, [items]);

  const discount = useMemo(() => discountFor(offer, subtotal), [offer, subtotal]);
  const freeShipping =
    subtotal >= config.freeShippingThreshold ||
    (offer?.type === "free_shipping" &&
      (!offer.minSubtotal || subtotal >= offer.minSubtotal));
  const shipping = freeShipping ? 0 : config.shippingFee;
  const total = Math.max(0, subtotal - discount + shipping + taxAmount + extraChargesAmount);

  function applyCode() {
    setCodeError("");
    const found = offers.find(
      (o) => o.code.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!found) {
      setOffer(null);
      setCodeError("That code isn't valid.");
      return;
    }
    if (found.minSubtotal && subtotal < found.minSubtotal) {
      setOffer(null);
      setCodeError(
        `Add ${formatINR(found.minSubtotal - subtotal)} more to use ${found.code}.`,
      );
      return;
    }
    setOffer(found);
  }

  function getShippingAddress(): ShippingAddress {
    if (addressMode === "saved" && customer?.savedAddress && isCompleteAddress(customer.savedAddress)) {
      return customer.savedAddress;
    }
    return {
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state,
      district: district.trim() || undefined,
      pincode: pincode.trim(),
    };
  }

  function validateCheckout(): string | null {
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) return "Please enter your full name.";
    if (digits.length < 10) return "Please enter a valid 10-digit phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (addressMode === "saved") {
      if (!isCompleteAddress(customer?.savedAddress)) {
        return "Your saved address is incomplete. Please choose a different address or update it in your account.";
      }
      if (!isServiceableCity(customer?.savedAddress?.state, customer?.savedAddress?.city)) {
        return "Your saved address is in a city we don't deliver to yet. Choose \"Deliver to a different address\" and pick a serviceable city.";
      }
      return null;
    }
    if (!line1.trim()) return "Please enter your street address.";
    if (!state) return "Please select your state.";
    if (!city.trim()) return "Please select your city.";
    if (!isServiceableCity(state, city)) {
      return "We currently deliver only to selected cities in Andhra Pradesh & Telangana.";
    }
    if (!/^\d{6}$/.test(pincode.trim())) return "Please enter a valid 6-digit PIN code.";
    return null;
  }

  function buildOrder(
    method: PaymentMethod,
    paymentStatus: Order["paymentStatus"],
    extras?: Partial<Order>,
  ): Order {
    return {
      id: uid("ord"),
      customerPhone: phone.replace(/\D/g, ""),
      customerName: name.trim(),
      customerEmail: email.trim(),
      shippingAddress: getShippingAddress(),
      notes: notes.trim() || undefined,
      items: orderedItems.map((it) => ({
        productId: it.productId,
        name: it.name,
        variantLabel: it.variantLabel,
        price: it.price,
        quantity: it.quantity,
      })),
      subtotal,
      discount: discount || undefined,
      shipping,
      taxAmount,
      extraChargesAmount,
      total,
      channel: "online",
      paymentMethod: method,
      paymentStatus,
      status: "new",
      createdAt: new Date().toISOString(),
      ...extras,
    };
  }

  async function saveCheckoutAddressIfNeeded() {
    if (!customer || !saveAddress || addressMode !== "new") return;
    try {
      await updateCustomer({ savedAddress: getShippingAddress() });
    } catch {
      // Don't block checkout if saving the address fails.
    }
  }

  async function placeCodOrder() {
    setCheckoutError(null);
    const validationError = validateCheckout();
    if (validationError) {
      setCheckoutError({ title: "Check your details", message: validationError });
      return;
    }

    setPlacing(true);
    try {
      await saveCheckoutAddressIfNeeded();
      const order = await createOrder(
        buildOrder("cod", "cod"),
      );
      clear();
      setPlaced({ id: order.id, method: "cod" });
    } catch (error) {
      setCheckoutError(getErrorDetails(error, "Could not place order"));
    } finally {
      setPlacing(false);
    }
  }

  async function placeRazorpayOrder() {
    if (!config.razorpayEnabled) {
      setCheckoutError({
        title: "Online payments unavailable",
        message:
          "Razorpay is not configured on the server. Please choose Cash on delivery.",
      });
      return;
    }
    setCheckoutError(null);
    const validationError = validateCheckout();
    if (validationError) {
      setCheckoutError({ title: "Check your details", message: validationError });
      return;
    }

    setPlacing(true);
    try {
      await saveCheckoutAddressIfNeeded();
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");

      const rzOrder = await createRazorpayOrder(total);
      const pendingOrder = buildOrder("razorpay", "pending", {
        razorpayOrderId: rzOrder.id,
      });

      openRazorpayCheckout({
        key: rzOrder.keyId,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        order_id: rzOrder.id,
        name: config.businessName,
        description: "Order payment",
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: phone.replace(/\D/g, ""),
        },
        theme: { color: "#7f1d1d" },
        handler: async (response) => {
          try {
            const { verified } = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verified) throw new Error("Payment verification failed.");

            const order = await createOrder({
              ...pendingOrder,
              paymentStatus: "paid",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
            clear();
            setPlaced({ id: order.id, method: "razorpay" });
          } catch (error) {
            setCheckoutError(
              getErrorDetails(error, "Payment succeeded but order could not be saved"),
            );
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });
    } catch (error) {
      setCheckoutError(
        getErrorDetails(error, "Online payment unavailable"),
      );
      setPlacing(false);
    }
  }

  function goLoginForPurchase() {
    const redirect = `/cart`;
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
  }

  function handlePlaceOrder() {
    if (!deliveryConfirmed) {
      setCheckoutError({
        title: "Confirm delivery location",
        message: "Please check delivery availability for your city before placing the order.",
      });
      return;
    }
    if (!customer) {
      goLoginForPurchase();
      return;
    }
    if (paymentMethod === "cod") void placeCodOrder();
    else void placeRazorpayOrder();
  }


  if (placed) {
    return (
      <Container>
        <div className="mx-auto max-w-lg py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-600/12 text-leaf-600">
            <Check size={32} />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900">
            Order placed!
          </h1>
          <p className="mt-2 text-ink-600">
            {placed.method === "cod"
              ? "Your cash on delivery order is confirmed. We'll call you to confirm delivery details."
              : "Payment received. We're preparing your order and will update you soon."}
          </p>
          <p className="mt-3 text-sm font-medium text-maroon-800">
            Order #{placed.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
            >
              Continue shopping
            </Link>
            {customer && (
              <Link
                href="/account"
                className="inline-flex h-11 items-center rounded-full border border-maroon-800/30 px-6 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
              >
                My account
              </Link>
            )}
          </div>
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container>
        <div className="mx-auto max-w-lg py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-maroon-800">
            <ShoppingBag size={30} />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900">
            Your cart is empty
          </h1>
          <p className="mt-2 text-ink-600">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex h-11 items-center rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
          >
            Browse products
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="py-10">
      <Container>
        <h1 className="font-serif text-3xl font-bold text-maroon-900">Checkout</h1>
        <Link
          href="/shop"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-saffron-600"
        >
          <ArrowLeft size={15} /> Continue shopping
        </Link>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_420px]">
          <div className="min-w-0 space-y-6">
            {/* Cart items */}
            <section className="rounded-2xl border border-cream-200 bg-white">
              <h2 className="border-b border-cream-200 px-5 py-4 font-serif text-lg font-bold text-maroon-900">
                Your items ({items.length})
              </h2>
              <ul className="divide-y divide-cream-200">
                {orderedItems.map((it) => (
                  <li key={it.variantId} className="flex gap-4 p-4 sm:p-5">
                    <Link
                      href={`/product/${it.slug}`}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-cream-200 bg-cream-100"
                    >
                      {it.image && (
                        <Image
                          src={it.image}
                          alt={it.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div>
                          <Link
                            href={`/product/${it.slug}`}
                            className="font-medium text-maroon-900 hover:text-saffron-600"
                          >
                            {it.name}
                          </Link>
                          <p className="text-sm text-ink-400">{it.variantLabel}</p>
                          <p className="mt-0.5 text-sm text-ink-500">
                            {formatINR(it.price)} each
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(it.variantId)}
                          aria-label="Remove item"
                          className="h-fit text-ink-400 hover:text-maroon-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-cream-300 bg-white">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => setQty(it.variantId, it.quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center text-maroon-800 hover:bg-maroon-800/5"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-10 text-center text-sm font-semibold">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => setQty(it.variantId, it.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center text-maroon-800 hover:bg-maroon-800/5"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <span className="font-semibold text-maroon-900">
                          {formatINR(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Delivery serviceability gate */}
            <DeliveryLocationGate
              confirmed={deliveryConfirmed}
              confirmedState={state}
              confirmedCity={city}
              defaultState={
                savedAddressServiceable ? customer?.savedAddress?.state ?? "" : ""
              }
              defaultCity={
                savedAddressServiceable ? customer?.savedAddress?.city ?? "" : ""
              }
              onConfirm={confirmDeliveryLocation}
              onReset={() => setDeliveryConfirmed(false)}
            />

            {deliveryConfirmed && (
              <>
            {/* Contact */}
            <section className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="font-serif text-lg font-bold text-maroon-900">
                Contact details
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Used for order updates and delivery confirmation.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-maroon-900">
                  Full name *
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={`${fieldClass} mt-1.5`}
                  />
                </label>
                <label className="text-sm font-medium text-maroon-900">
                  Phone number *
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="tel"
                    placeholder="9876543210"
                    className={`${fieldClass} mt-1.5`}
                  />
                </label>
                <label className="text-sm font-medium text-maroon-900 sm:col-span-2">
                  Email address *
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    placeholder="you@example.com"
                    className={`${fieldClass} mt-1.5`}
                  />
                </label>
              </div>
            </section>

            {/* Delivery address */}
            <section className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="font-serif text-lg font-bold text-maroon-900">
                Delivery address
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Add a complete address so the courier can find you without follow-up calls.
              </p>

              {hasSavedAddress && customer?.savedAddress ? (
                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 p-4 has-[:checked]:border-maroon-800 has-[:checked]:bg-maroon-800/5">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={addressMode === "saved"}
                      onChange={() => setAddressMode("saved")}
                      className="mt-1 accent-maroon-800"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-maroon-900">
                        Use saved address
                      </span>
                      <span className="mt-1 block text-sm text-ink-600">
                        {formatAddressLines(customer.savedAddress).join(" · ")}
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 p-4 has-[:checked]:border-maroon-800 has-[:checked]:bg-maroon-800/5">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={addressMode === "new"}
                      onChange={() => setAddressMode("new")}
                      className="mt-1 accent-maroon-800"
                    />
                    <span className="text-sm font-semibold text-maroon-900">
                      Deliver to a different address
                    </span>
                  </label>
                </div>
              ) : null}

              {addressMode === "new" ? (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-maroon-900">
                  House / flat / street *
                  <input
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="House no., building, street"
                    className={`${fieldClass} mt-1.5`}
                  />
                </label>
                <label className="block text-sm font-medium text-maroon-900">
                  Area / landmark
                  <input
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    placeholder="Area, landmark, nearby place"
                    className={`${fieldClass} mt-1.5`}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-medium text-maroon-900">
                    State *
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setCity("");
                      }}
                      className={`${fieldClass} mt-1.5`}
                    >
                      <option value="">Select state</option>
                      {SERVICEABLE_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="text-sm font-medium text-maroon-900">
                    <span className="mb-1.5 block">City *</span>
                    <Combobox
                      value={city}
                      onChange={setCity}
                      options={cityOptions}
                      disabled={!state}
                      placeholder={state ? "Type or select your city" : "Select a state first"}
                      ariaLabel="Delivery city"
                      className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-cream-100/60 disabled:opacity-70`}
                    />
                  </div>
                  <label className="text-sm font-medium text-maroon-900">
                    PIN code *
                    <input
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setPincodeHint("");
                        if (e.target.value.replace(/\D/g, "").slice(0, 6).length < 6) {
                          lastLookupPincode.current = "";
                        }
                      }}
                      inputMode="numeric"
                      placeholder="6-digit PIN"
                      className={`${fieldClass} mt-1.5`}
                    />
                    {lookingUpPincode ? (
                      <p className="mt-1 text-xs text-ink-500">Looking up area…</p>
                    ) : pincodeHint ? (
                      <p className="mt-1 text-xs text-maroon-700">{pincodeHint}</p>
                    ) : null}
                  </label>
                </div>
                <label className="block text-sm font-medium text-maroon-900">
                  District
                  {districtOptions.length > 0 ? (
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={`${fieldClass} mt-1.5`}
                    >
                      <option value="">Select district</option>
                      {districtOptions.map((districtName) => (
                        <option key={districtName} value={districtName}>
                          {districtName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Auto-filled from PIN"
                      className={`${fieldClass} mt-1.5`}
                    />
                  )}
                </label>
                <label className="block text-sm font-medium text-maroon-900">
                  Delivery instructions
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Preferred time, gate code, alternate contact..."
                    rows={2}
                    className={`${fieldClass} mt-1.5 h-auto resize-none py-3`}
                  />
                </label>
                {customer && (
                  <label className="flex items-start gap-2 rounded-xl bg-cream-50 px-3 py-2 text-sm text-ink-600">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Save this as my default delivery address for future orders.
                    </span>
                  </label>
                )}
              </div>
              ) : null}
            </section>
              </>
            )}
          </div>

          {/* Summary + payment */}
          <div className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="font-serif text-lg font-bold text-maroon-900">
                Order summary
              </h2>

              <div className="mt-4">
                {offer ? (
                  <div className="flex items-center justify-between rounded-xl bg-leaf-600/10 px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium text-leaf-600">
                      <Tag size={14} /> {offer.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOffer(null);
                        setCode("");
                      }}
                      className="text-ink-500 hover:text-maroon-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Promo code"
                      className="h-10 flex-1 rounded-full border border-cream-300 bg-white px-4 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
                    />
                    <button
                      type="button"
                      onClick={applyCode}
                      className="h-10 rounded-full bg-maroon-800 px-4 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {codeError && (
                  <Alert tone="error" className="mt-2">
                    {codeError}
                  </Alert>
                )}
              </div>

              <dl className="mt-4 space-y-2 border-t border-cream-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd className="font-medium text-maroon-900">{formatINR(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-leaf-600">
                    <dt>Discount</dt>
                    <dd className="font-medium">-{formatINR(discount)}</dd>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-600">GST</dt>
                    <dd className="font-medium text-maroon-900">{formatINR(taxAmount)}</dd>
                  </div>
                )}
                {extraChargesAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-600">Extra Charges</dt>
                    <dd className="font-medium text-maroon-900">{formatINR(extraChargesAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-600">Delivery</dt>
                  <dd className="font-medium text-maroon-900">
                    {shipping === 0 ? "Free" : formatINR(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-cream-200 pt-2 text-base">
                  <dt className="font-semibold text-maroon-900">Total</dt>
                  <dd className="font-bold text-maroon-900">{formatINR(total)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="font-serif text-lg font-bold text-maroon-900">
                Payment method
              </h2>
              <div className="mt-4 space-y-3">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 p-4 has-[:checked]:border-maroon-800 has-[:checked]:bg-maroon-800/5 ${
                    !config.razorpayEnabled ? "opacity-50" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    disabled={!config.razorpayEnabled}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="mt-1 accent-maroon-800"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-maroon-900">
                      <CreditCard size={18} /> Pay online
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      UPI, cards, net banking via Razorpay
                    </span>
                    {!config.razorpayEnabled ? (
                      <span className="mt-1 block text-xs text-maroon-700">
                        Razorpay not configured on this server.
                      </span>
                    ) : null}
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 p-4 has-[:checked]:border-maroon-800 has-[:checked]:bg-maroon-800/5">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 accent-maroon-800"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-maroon-900">
                      <Banknote size={18} /> Cash on delivery
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      Pay when your order is delivered
                    </span>
                  </span>
                </label>
              </div>

              {checkoutError && (
                <Alert title={checkoutError.title} className="mt-4">
                  {checkoutError.message}
                  {checkoutError.hint ? (
                    <p className="mt-1 text-xs opacity-90">{checkoutError.hint}</p>
                  ) : null}
                </Alert>
              )}

              {!deliveryConfirmed ? (
                <p className="mt-4 rounded-xl bg-cream-100 px-3 py-2 text-center text-xs font-medium text-maroon-800">
                  Confirm your delivery location above to continue.
                </p>
              ) : null}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing || !deliveryConfirmed}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing…
                  </>
                ) : paymentMethod === "cod" ? (
                  "Place order (COD)"
                ) : (
                  "Pay & place order"
                )}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
