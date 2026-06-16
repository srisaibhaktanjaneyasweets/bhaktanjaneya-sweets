"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Package, Pencil, Check, User, Truck, MapPin, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";


import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api/client";
import { lookupPincode } from "@/lib/api/pincode";
import type { PincodeLookup } from "@/lib/api/pincode";
import {
  SERVICEABLE_STATES,
  citiesForState,
  isServiceableCity,
} from "@/lib/constants/serviceable-areas";
import { Combobox } from "@/components/ui/Combobox";
import { STATE_DISTRICTS } from "@/lib/constants/india-locations";
import { formatINR, formatDate } from "@/lib/utils";
import { formatAddressLines, isCompleteAddress } from "@/lib/address";
import { getErrorDetails, getErrorMessage } from "@/lib/api/errors";
import { cancelOrder } from "@/lib/api/orders";
import type { Order, ShippingAddress } from "@/lib/types";

const STATUS_LABEL: Record<Order["status"], string> = {
  new: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AccountPage() {
  const router = useRouter();
  const { customer, updateName, updateCustomer, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [orderActionError, setOrderActionError] = useState("");
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [address, setAddress] = useState<ShippingAddress>({
    line1: "",
    line2: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addressMessage, setAddressMessage] = useState("");
  const [addressMessageTone, setAddressMessageTone] = useState<"error" | "success" | "info">("info");
  const [savingAddress, setSavingAddress] = useState(false);
  const [pincodeDetails, setPincodeDetails] = useState<PincodeLookup | null>(null);
  const [lookingUpPincode, setLookingUpPincode] = useState(false);
  const lastLookupPincode = useRef("");

  const districtOptions = useMemo(() => {
    const fromState = address.state ? (STATE_DISTRICTS[address.state] ?? []) : [];
    const fromPincode =
      pincodeDetails?.postOffices
        ?.filter((office) => !address.state || office.state === address.state)
        .map((office) => office.district)
        .filter(Boolean) ?? [];
    return Array.from(new Set([...fromState, ...fromPincode])).sort();
  }, [address.state, pincodeDetails]);

  const findAddressByPincode = useCallback(async () => {
    if (!/^\d{6}$/.test(address.pincode.trim())) return;

    setAddressMessage("");
    setLookingUpPincode(true);
    try {
      const details = await lookupPincode(address.pincode.trim());
      lastLookupPincode.current = address.pincode.trim();
      setPincodeDetails(details);
      // State & city come from the serviceable-area dropdowns; only fill district.
      setAddress((prev) => ({
        ...prev,
        district: prev.district || details.district,
      }));
      setAddressMessageTone("success");
      setAddressMessage("Area updated from your PIN code.");
    } catch (error) {
      setAddressMessageTone("error");
      setAddressMessage(getErrorMessage(error, "Could not find this PIN code."));
    } finally {
      setLookingUpPincode(false);
    }
  }, [address.pincode]);

  // Hydration: intentionally setting state on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (customer) {

      setNameInput(customer.name ?? "");
      setAddress({
        line1: customer.savedAddress?.line1 ?? "",
        line2: customer.savedAddress?.line2 ?? "",
        district: customer.savedAddress?.district ?? "",
        city: customer.savedAddress?.city ?? "",
        state: customer.savedAddress?.state ?? "",
        pincode: customer.savedAddress?.pincode ?? "",
      });
      apiGet<Order[]>("/orders")
        .then((data) => {
          setOrders(data);
          setOrdersError("");
        })
        .catch((error) => {
          setOrders([]);
          setOrdersError(getErrorMessage(error, "Could not load your orders. Please refresh the page."));
        });
    }
  }, [customer]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const nextPincode = address.pincode.trim();
    if (!/^\d{6}$/.test(nextPincode) || nextPincode === lastLookupPincode.current) {
      return;
    }
    void findAddressByPincode();
  }, [address.pincode, findAddressByPincode]);

  if (!mounted) {
    return (
      <Container>
        <div className="py-24" />
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container>
        <div className="mx-auto max-w-md py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-maroon-800">
            <User size={30} />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900">
            You&apos;re not logged in
          </h1>
          <p className="mt-2 text-ink-600">
            Log in to view your orders and save your details.
          </p>
          <Link
            href="/login?redirect=/account"
            className="mt-7 inline-flex h-11 items-center rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
          >
            Login / Sign up
          </Link>
        </div>
      </Container>
    );
  }

  const savedAddress = customer.savedAddress;
  const hasSavedAddress = isCompleteAddress(savedAddress);

  async function saveName() {
    const nextName = nameInput.trim();
    updateName(nextName);
    try {
      await updateCustomer({ name: nextName });
    } finally {
      setEditing(false);
    }
  }

  async function saveAddress() {
    setAddressMessage("");
    if (!address.line1.trim() || !address.city.trim() || !address.state || !/^\d{6}$/.test(address.pincode.trim())) {
      setAddressMessageTone("error");
      setAddressMessage("Please fill house/street, city, state, and a valid 6-digit PIN.");
      return;
    }
    if (!isServiceableCity(address.state, address.city)) {
      setAddressMessageTone("error");
      setAddressMessage("We currently deliver only to selected cities in Andhra Pradesh & Telangana.");
      return;
    }
    setSavingAddress(true);
    try {
      await updateCustomer({ savedAddress: address });
      setAddressMessageTone("success");
      setAddressMessage("Address saved for future orders.");
      setEditingAddress(false);
    } catch (error) {
      setAddressMessageTone("error");
      setAddressMessage(getErrorMessage(error, "Could not save address."));
    } finally {
      setSavingAddress(false);
    }
  }

  function startEditingAddress() {
    setAddress({
      line1: savedAddress?.line1 ?? "",
      line2: savedAddress?.line2 ?? "",
      district: savedAddress?.district ?? "",
      city: savedAddress?.city ?? "",
      state: savedAddress?.state ?? "",
      pincode: savedAddress?.pincode ?? "",
    });
    setAddressMessage("");
    setEditingAddress(true);
  }

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  async function doCancelOrderById(orderId: string) {
    setOrderActionError("");
    setCancellingId(orderId);
    try {
      const updated = await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o)),
      );
      toast({
        tone: "success",
        title: "Order cancelled",
        message: "Your order has been cancelled.",
      });
    } catch (error) {
      const details = getErrorDetails(error, "Could not cancel order");
      setOrderActionError(
        details.hint ? `${details.message} ${details.hint}` : details.message,
      );
      toast({
        tone: "error",
        title: "Could not cancel",
        message:
          (details.hint ? `${details.message} ${details.hint}` : details.message) ||
          "Please try again.",
      });
    } finally {
      setCancellingId(null);
    }
  }

  function requestCancelOrder(orderId: string) {
    setCancelConfirmId(orderId);
    setCancelConfirmOpen(true);
  }


  return (
    <div className="py-10">
      <Container>
        <h1 className="font-serif text-3xl font-bold text-maroon-900">
          My Account
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Profile */}
          <div className="h-fit rounded-2xl border border-cream-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-800 font-serif text-xl font-bold text-cream-50">
                {(customer.name?.[0] ?? customer.phone.slice(-2, -1)).toUpperCase()}
              </span>
              <div className="min-w-0">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Your name"
                      className="h-9 w-full rounded-lg border border-cream-300 px-2 text-sm focus:border-saffron-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveName}
                      aria-label="Save name"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-maroon-800 text-cream-50"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-maroon-900">
                      {customer.name || "Add your name"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      aria-label="Edit name"
                      className="text-ink-400 hover:text-maroon-700"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                <p className="text-sm text-ink-500">+91 {customer.phone}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-maroon-800/30 py-2.5 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
            >
              <LogOut size={16} /> Log out
            </button>

            <div className="mt-6 border-t border-cream-200 pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-saffron-600" />
                  <h2 className="font-serif text-lg font-semibold text-maroon-900">
                    Saved address
                  </h2>
                </div>
                {hasSavedAddress && !editingAddress ? (
                  <button
                    type="button"
                    onClick={startEditingAddress}
                    className="inline-flex items-center gap-1 text-sm font-medium text-maroon-800 hover:text-saffron-600"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                ) : null}
              </div>

              {!editingAddress ? (
                <div className="mt-3">
                  {hasSavedAddress && savedAddress ? (
                    <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink-700">
                      {formatAddressLines(savedAddress).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-500">
                      No saved address yet. Add one for faster checkout.
                    </p>
                  )}
                  {!hasSavedAddress ? (
                    <button
                      type="button"
                      onClick={startEditingAddress}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-800 hover:text-saffron-600"
                    >
                      <Pencil size={14} /> Add address
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    value={address.line1}
                    onChange={(e) => setAddress((prev) => ({ ...prev, line1: e.target.value }))}
                    placeholder="House / flat / street *"
                    className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none"
                  />
                  <input
                    value={address.line2 ?? ""}
                    onChange={(e) => setAddress((prev) => ({ ...prev, line2: e.target.value }))}
                    placeholder="Area / landmark"
                    className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <select
                      value={address.state}
                      onChange={(e) =>
                        setAddress((prev) => ({
                          ...prev,
                          state: e.target.value,
                          city: "",
                          district: "",
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none"
                    >
                      <option value="">Select state *</option>
                      {SERVICEABLE_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <Combobox
                      value={address.city}
                      onChange={(city) => setAddress((prev) => ({ ...prev, city }))}
                      options={citiesForState(address.state)}
                      disabled={!address.state}
                      placeholder={address.state ? "Type or select your city" : "Select a state first"}
                      ariaLabel="City"
                      className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-cream-100/60 disabled:opacity-70"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {districtOptions.length > 0 ? (
                      <select
                        value={address.district ?? ""}
                        onChange={(e) =>
                          setAddress((prev) => ({
                            ...prev,
                            district: e.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none"
                      >
                        <option value="">Select district</option>
                        {districtOptions.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={address.district ?? ""}
                        onChange={(e) => setAddress((prev) => ({ ...prev, district: e.target.value }))}
                        placeholder="District"
                        className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none"
                      />
                    )}
                  </div>
                  <input
                    value={address.pincode}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setAddress((prev) => ({ ...prev, pincode: next }));
                      setAddressMessage("");
                      if (next.length < 6) lastLookupPincode.current = "";
                    }}
                    inputMode="numeric"
                    placeholder="PIN code *"
                    className="h-10 w-full rounded-lg border border-cream-300 px-3 text-sm focus:border-saffron-400 focus:outline-none"
                  />
                  {lookingUpPincode ? (
                    <p className="text-xs text-ink-500">Looking up city and state…</p>
                  ) : null}
                  {addressMessage ? null : null}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(false);
                        setAddressMessage("");
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-maroon-800/30 py-2.5 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveAddress}
                      disabled={savingAddress}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-maroon-800 py-2.5 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
                    >
                      <Check size={16} /> {savingAddress ? "Saving..." : "Save address"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orders */}
          <div>
            <h2 className="mb-4 font-serif text-xl font-semibold text-maroon-900">
              Your Orders
            </h2>
            {ordersError ? null : null}
            {orderActionError ? null : null}

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cream-300 bg-white py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
                  <Package size={26} />
                </span>
                <p className="mt-4 font-medium text-maroon-900">No orders yet</p>
                <p className="mt-1 text-sm text-ink-500">
                  Your placed orders will appear here.
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex h-10 items-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-cream-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-maroon-900">
                          #{o.id.replace(/^ord_/, "").toUpperCase()}
                        </p>
                        <p className="text-xs text-ink-400">
                          {formatDate(o.createdAt)} •{" "}
                          {o.paymentMethod === "cod"
                            ? "Cash on delivery"
                            : o.paymentStatus === "paid"
                              ? "Paid online"
                              : "Online"}
                        </p>
                      </div>
                      <Badge tone={o.status === "delivered" ? "leaf" : o.status === "cancelled" ? "muted" : "saffron"}>
                        {STATUS_LABEL[o.status]}
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-ink-700">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>
                            {it.name}{" "}
                            <span className="text-ink-400">
                              ({it.variantLabel}) × {it.quantity}
                            </span>
                          </span>
                          <span>{formatINR(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    {(o.deliveryCompany || o.deliveryTrackingId) && (
                      <div className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-sm text-ink-600">
                        <p className="flex items-center gap-1.5 font-medium text-maroon-900">
                          <Truck size={15} /> Shipped with{" "}
                          {o.deliveryCompany || "our delivery partner"}
                        </p>
                        {o.deliveryTrackingId && (
                          <p className="mt-1 text-xs">
                            Delivery ID:{" "}
                            <span className="font-semibold text-ink-800">
                              {o.deliveryTrackingId}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-cream-200 pt-3 text-sm">
                      <span className="text-ink-500">
                        Payment: {o.paymentStatus}
                      </span>
                      <div className="flex items-center gap-3">
                        {o.status === "new" ? (
                          <button
                            type="button"
                            onClick={() => requestCancelOrder(o.id)}
                            disabled={cancellingId === o.id}
                            className="text-sm font-semibold text-maroon-700 hover:text-maroon-900 disabled:opacity-60"
                          >
                            {cancellingId === o.id ? "Cancelling…" : "Cancel order"}
                          </button>
                        ) : null}

                        <span className="font-bold text-maroon-900">
                          {formatINR(o.total)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Cancel this order?"
        description="You can only cancel before we confirm it."
        confirmLabel="Yes, cancel"
        tone="danger"
        onCancel={() => {
          setCancelConfirmOpen(false);
          setCancelConfirmId(null);
        }}
        onConfirm={() => {
          if (cancelConfirmId) void doCancelOrderById(cancelConfirmId);
          setCancelConfirmOpen(false);
        }}
      />
    </Container>
    </div>
  );
}

