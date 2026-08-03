"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  Users,
  Search,
  Mail,
  Phone,
  ArrowUpRight,
  Filter,
  DollarSign,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { formatINR } from "@/lib/utils";

type PresetRange =
  | "weekly"
  | "15days"
  | "30days"
  | "3months"
  | "6months"
  | "1year"
  | "5years"
  | "all";

export default function AnalyticsPage() {
  const { orders } = useAdmin();

  // Filters State
  const [preset, setPreset] = useState<PresetRange>("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Get all unique months available in orders
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    orders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        months.add(`${year}-${month}`);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [orders]);

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  // Apply filters to orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      result = result.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
      });
    } else if (preset !== "all") {
      const now = new Date();
      let cutoff = new Date();
      switch (preset) {
        case "weekly":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "15days":
          cutoff.setDate(now.getDate() - 15);
          break;
        case "30days":
          cutoff.setDate(now.getDate() - 30);
          break;
        case "3months":
          cutoff.setMonth(now.getMonth() - 3);
          break;
        case "6months":
          cutoff.setMonth(now.getMonth() - 6);
          break;
        case "1year":
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
        case "5years":
          cutoff.setFullYear(now.getFullYear() - 5);
          break;
      }
      result = result.filter((o) => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        return d >= cutoff;
      });
    } else if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        result = result.filter((o) => {
          const d = o.createdAt ? new Date(o.createdAt) : new Date();
          return d >= start;
        });
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter((o) => {
          const d = o.createdAt ? new Date(o.createdAt) : new Date();
          return d <= end;
        });
      }
    }

    // Sort chronologically for charting
    return result.sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
    );
  }, [orders, preset, startDate, endDate, selectedMonth]);

  // Overall statistics calculations
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter((o) => o.paymentStatus === "paid" || o.status === "delivered" || o.status === "confirmed" || o.status === "shipped")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pending = filteredOrders.filter(
      (o) => o.status === "new" || o.status === "confirmed" || o.status === "packed",
    ).length;
    const shipped = filteredOrders.filter((o) => o.status === "shipped").length;
    const delivered = filteredOrders.filter((o) => o.status === "delivered").length;
    const cancelled = filteredOrders.filter((o) => o.status === "cancelled").length;

    return { totalOrders, totalRevenue, aov, pending, shipped, delivered, cancelled };
  }, [filteredOrders]);

  // Grouped sales data for line/area chart
  const salesChartData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const formatKey = (d: Date) => {
      // Group by month if range is > 30 days and no month is selected
      if (!selectedMonth && (preset === "3months" || preset === "6months" || preset === "1year" || preset === "5years")) {
        return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      }
      // Group by day otherwise
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    };

    const groups: Record<string, { revenue: number; count: number }> = {};

    filteredOrders.forEach((o) => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      const key = formatKey(d);
      const isPaid = o.paymentStatus === "paid" || o.status === "delivered" || o.status === "confirmed" || o.status === "shipped";
      
      if (!groups[key]) {
        groups[key] = { revenue: 0, count: 0 };
      }
      
      groups[key].count += 1;
      if (isPaid) {
        groups[key].revenue += o.total || 0;
      }
    });

    return Object.entries(groups).map(([label, val]) => ({
      label,
      revenue: Math.round(val.revenue),
      count: val.count,
    }));
  }, [filteredOrders, preset, selectedMonth]);

  // Customer Loyalty & Reordering Analysis
  const customerAnalytics = useMemo(() => {
    const clients: Record<
      string,
      {
        name: string;
        phone: string;
        email: string;
        ordersCount: number;
        spent: number;
        lastOrderDate: string;
        ordersList: typeof orders;
      }
    > = {};

    orders.forEach((o) => {
      const key = o.customerPhone ? o.customerPhone.trim() : (o.customerEmail ?? "guest").trim();
      if (!key || key === "guest") return;

      if (!clients[key]) {
        clients[key] = {
          name: o.customerName || "Guest Customer",
          phone: o.customerPhone || "",
          email: o.customerEmail || "",
          ordersCount: 0,
          spent: 0,
          lastOrderDate: o.createdAt || "",
          ordersList: [],
        };
      }

      clients[key].ordersCount += 1;
      clients[key].ordersList.push(o);
      
      if (o.paymentStatus === "paid" || o.status === "delivered" || o.status === "confirmed" || o.status === "shipped") {
        clients[key].spent += o.total || 0;
      }

      const currentLast = new Date(clients[key].lastOrderDate);
      const checkDate = new Date(o.createdAt || 0);
      if (checkDate > currentLast) {
        clients[key].lastOrderDate = o.createdAt || "";
      }
    });

    const clientList = Object.values(clients).sort((a, b) => b.spent - a.spent);

    const totalCustomers = clientList.length;
    const repeatCustomers = clientList.filter((c) => c.ordersCount >= 2).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    
    const dist = { one: 0, two: 0, three: 0, more: 0 };
    clientList.forEach((c) => {
      if (c.ordersCount === 1) dist.one++;
      else if (c.ordersCount === 2) dist.two++;
      else if (c.ordersCount === 3) dist.three++;
      else dist.more++;
    });

    return { clientList, totalCustomers, repeatCustomers, repeatRate, dist };
  }, [orders]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const search = searchCustomer.trim().toLowerCase();
    if (!search) return customerAnalytics.clientList;

    return customerAnalytics.clientList.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search),
    );
  }, [customerAnalytics.clientList, searchCustomer]);

  // Selected customer history details
  const activeCustomerDetails = useMemo(() => {
    if (!selectedCustomer) return null;
    return customerAnalytics.clientList.find((c) => c.phone === selectedCustomer || c.email === selectedCustomer) ?? null;
  }, [customerAnalytics.clientList, selectedCustomer]);

  // Dynamic SVG Area Chart Dimensions & calculations
  const chartProps = useMemo(() => {
    const data = salesChartData;
    if (data.length === 0) return null;

    const width = 800;
    const height = 260;
    const paddingLeft = 70;
    const paddingRight = 40;
    const paddingTop = 35;
    const paddingBottom = 45;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    const points = data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
      const y = height - paddingBottom - (d.revenue / maxRevenue) * chartHeight;
      return { x, y, label: d.label, val: d.revenue };
    });

    const barPoints = data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
      const h = (d.count / maxCount) * chartHeight;
      const y = height - paddingBottom - h;
      return { x, y, h, label: d.label, val: d.count };
    });

    // Construct SVG path for area/line chart
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    
    // Construct SVG path for filled gradient area underneath the line
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : "";

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartWidth,
      chartHeight,
      points,
      barPoints,
      linePath,
      areaPath,
      maxRevenue,
      maxCount,
    };
  }, [salesChartData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
            Sweets Shop Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Deep dive into order trends, customer reordering analytics, and financials.
          </p>
        </div>
      </div>

      {/* Date, Preset & Month Filters Section */}
      <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Preset buttons row - scrollable on mobile, wraps on desktop */}
          <div className="flex items-center gap-1.5 overflow-x-auto lg:overflow-x-visible lg:flex-wrap pb-2 lg:pb-0 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider mr-2 flex items-center gap-1 shrink-0">
              <Filter size={14} /> Ranges:
            </span>
            {(
              [
                ["weekly", "Weekly"],
                ["15days", "15 Days"],
                ["30days", "30 Days"],
                ["3months", "3 Months"],
                ["6months", "6 Months"],
                ["1year", "1 Year"],
                ["5years", "5 Years"],
                ["all", "All-Time"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setPreset(val);
                  setStartDate("");
                  setEndDate("");
                  setSelectedMonth("");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  preset === val && !startDate && !endDate && !selectedMonth
                    ? "bg-maroon-900 text-cream-50"
                    : "bg-cream-50 text-ink-600 hover:bg-cream-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Month Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                Month:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPreset("all");
                  setStartDate("");
                  setEndDate("");
                }}
                className="rounded-lg border border-cream-300 bg-cream-50/50 px-2 py-1.5 text-xs font-medium text-ink-700 outline-hidden focus:border-maroon-800 focus:bg-white"
              >
                <option value="">-- Choose Month --</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Range Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Calendar size={14} /> Custom:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset("all");
                  setSelectedMonth("");
                }}
                className="rounded-lg border border-cream-300 bg-cream-50/50 px-2 py-1.5 text-xs font-medium text-ink-700 outline-hidden focus:border-maroon-800"
              />
              <span className="text-xs text-ink-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset("all");
                  setSelectedMonth("");
                }}
                className="rounded-lg border border-cream-300 bg-cream-50/50 px-2 py-1.5 text-xs font-medium text-ink-700 outline-hidden focus:border-maroon-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid - 2 columns on mobile for compactness */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink-400">Total Revenue</span>
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-leaf-600/10 text-leaf-600">
              <DollarSign size={18} />
            </span>
          </div>
          <p className="mt-2 sm:mt-3 font-serif text-xl sm:text-2xl font-black text-maroon-900 tracking-tight">{formatINR(stats.totalRevenue)}</p>
          <p className="mt-1 text-[10px] sm:text-xs text-ink-500 font-medium">All confirmed paid totals</p>
        </div>

        {/* Total Orders */}
        <div className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink-400">Total Orders</span>
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <ShoppingBag size={18} />
            </span>
          </div>
          <p className="mt-2 sm:mt-3 font-serif text-xl sm:text-2xl font-black text-maroon-900 tracking-tight">{stats.totalOrders}</p>
          <p className="mt-1 text-[10px] sm:text-xs text-ink-500 font-medium">Orders within filtered range</p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink-400">Average (AOV)</span>
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-saffron-600/10 text-saffron-600">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-2 sm:mt-3 font-serif text-xl sm:text-2xl font-black text-maroon-900 tracking-tight">{formatINR(stats.aov)}</p>
          <p className="mt-1 text-[10px] sm:text-xs text-ink-500 font-medium">Revenue divided by count</p>
        </div>

        {/* Delivery Rates */}
        <div className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft hover:-translate-y-1 hover:shadow-md transition-all duration-300 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ink-400">Status Ratios</span>
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-sm">{stats.delivered} Del</span>
            <span className="text-saffron-700 bg-saffron-50 px-1.5 sm:px-2 py-0.5 rounded-sm">{stats.pending} Pen</span>
            <span className="text-red-700 bg-red-50 px-1.5 sm:px-2 py-0.5 rounded-sm">{stats.cancelled} Can</span>
          </div>
          <p className="mt-1.5 text-[9px] sm:text-[10px] text-ink-400 uppercase font-bold">Delivered vs Pending vs Cancelled</p>
        </div>
      </div>

      {/* Visual Analytics Section (Charts) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales & Revenue Trend Chart */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-maroon-900">
              Sales Revenue Trend
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-leaf-600 bg-leaf-50 px-2 py-1 rounded-full">
              Paid Revenue
            </span>
          </div>

          {chartProps ? (
            <div className="w-full overflow-x-auto no-scrollbar">
              <svg
                viewBox={`0 0 ${chartProps.width} ${chartProps.height}`}
                className="w-full min-w-[580px]"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C2410C" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#C2410C" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                  const y = chartProps.paddingTop + r * chartProps.chartHeight;
                  const gridVal = chartProps.maxRevenue - r * chartProps.maxRevenue;
                  const formattedVal = "₹" + (gridVal >= 1000 ? (gridVal / 1000).toFixed(1).replace(/\.0$/, "") + "k" : gridVal);
                  return (
                    <g key={i}>
                      <line
                        x1={chartProps.paddingLeft}
                        y1={y}
                        x2={chartProps.width - chartProps.paddingRight}
                        y2={y}
                        stroke="#F4EFEA"
                        strokeWidth="1"
                      />
                      <text
                        x={chartProps.paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#78716C"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {formattedVal}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area */}
                {chartProps.areaPath && (
                  <path d={chartProps.areaPath} fill="url(#areaGrad)" />
                )}

                {/* Trend Line */}
                {chartProps.linePath && (
                  <path
                    d={chartProps.linePath}
                    fill="none"
                    stroke="#881337"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points & Labels */}
                {chartProps.points.map((p, i) => {
                  const showLabel =
                    chartProps.points.length < 15 ||
                    i === 0 ||
                    i === chartProps.points.length - 1 ||
                    i % Math.round(chartProps.points.length / 5) === 0;

                  return (
                    <g key={i} className="group/dot cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="#881337"
                        stroke="#FFF"
                        strokeWidth="2.5"
                        className="transition-transform group-hover/dot:scale-150"
                      />
                      {showLabel && (
                        <text
                          x={p.x}
                          y={chartProps.height - 15}
                          textAnchor="middle"
                          fill="#78716C"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {p.label}
                        </text>
                      )}
                      {/* Value Label above dot */}
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fill="#881337"
                        fontSize="8.5"
                        fontWeight="black"
                        className={`transition-opacity duration-200 ${
                          chartProps.points.length <= 12
                            ? "opacity-100"
                            : "opacity-0 group-hover/dot:opacity-100"
                        }`}
                      >
                        ₹{p.val >= 1000 ? (p.val / 1000).toFixed(1).replace(/\.0$/, "") + "k" : p.val}
                      </text>
                      <title>{`${p.label}: ₹${p.val}`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl bg-cream-50/50 text-ink-400 text-xs">
              No sales data found for this range.
            </div>
          )}
        </div>

        {/* Order Count Bar Chart */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-maroon-900">
              Order Volume
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Order Count
            </span>
          </div>

          {chartProps ? (
            <div className="w-full overflow-x-auto no-scrollbar">
              <svg
                viewBox={`0 0 ${chartProps.width} ${chartProps.height}`}
                className="w-full min-w-[580px]"
              >
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                  const y = chartProps.paddingTop + r * chartProps.chartHeight;
                  const gridVal = Math.round(chartProps.maxCount - r * chartProps.maxCount);
                  return (
                    <g key={i}>
                      <line
                        x1={chartProps.paddingLeft}
                        y1={y}
                        x2={chartProps.width - chartProps.paddingRight}
                        y2={y}
                        stroke="#F4EFEA"
                        strokeWidth="1"
                      />
                      <text
                        x={chartProps.paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#78716C"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {gridVal}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {chartProps.barPoints.map((p, i) => {
                  const barWidth = Math.max(
                    12,
                    Math.min(30, (chartProps.chartWidth) / chartProps.barPoints.length - 8),
                  );
                  const showLabel =
                    chartProps.barPoints.length < 15 ||
                    i === 0 ||
                    i === chartProps.barPoints.length - 1 ||
                    i % Math.round(chartProps.barPoints.length / 5) === 0;

                  return (
                    <g key={i} className="group/bar cursor-pointer">
                      <rect
                        x={p.x - barWidth / 2}
                        y={p.y}
                        width={barWidth}
                        height={p.h}
                        fill="#D97706"
                        rx="4"
                        className="opacity-85 hover:opacity-100 transition-opacity"
                      />
                      {showLabel && (
                        <text
                          x={p.x}
                          y={chartProps.height - 15}
                          textAnchor="middle"
                          fill="#78716C"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {p.label}
                        </text>
                      )}
                      {/* Value Label above bar */}
                      <text
                        x={p.x}
                        y={p.y - 6}
                        textAnchor="middle"
                        fill="#D97706"
                        fontSize="8.5"
                        fontWeight="black"
                        className={`transition-opacity duration-200 ${
                          chartProps.barPoints.length <= 15
                            ? "opacity-100"
                            : "opacity-0 group-hover/bar:opacity-100"
                        }`}
                      >
                        {p.val}
                      </text>
                      <title>{`${p.label}: ${p.val} order(s)`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl bg-cream-50/50 text-ink-400 text-xs">
              No orders found for this range.
            </div>
          )}
        </div>
      </div>

      {/* Loyalty & Customer Reordering Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reordering Summary Panel */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft space-y-5 lg:col-span-1">
          <h3 className="font-serif text-base font-bold text-maroon-900 border-b border-cream-100 pb-2">
            Reordering Summary
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-cream-50/60 p-4 border border-cream-100">
              <div>
                <p className="text-[10px] uppercase font-bold text-ink-400">Repeat Customer Rate</p>
                <p className="mt-1 font-serif text-2xl sm:text-3xl font-black text-maroon-900">
                  {customerAnalytics.repeatRate.toFixed(1)}%
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800/10 text-maroon-800">
                <Users size={20} />
              </span>
            </div>

            {/* Distribution Graph List */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                Order Frequency Distribution
              </h4>

              <div className="space-y-2 text-xs">
                {/* 1 Order */}
                <div>
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span>1 Order Customers</span>
                    <span>{customerAnalytics.dist.one}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-cream-100">
                    <div
                      className="h-2 rounded-full bg-ink-400"
                      style={{
                        width: `${
                          customerAnalytics.totalCustomers > 0
                            ? (customerAnalytics.dist.one / customerAnalytics.totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 2 Orders */}
                <div>
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span>2 Orders (Repeat)</span>
                    <span>{customerAnalytics.dist.two}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-cream-100">
                    <div
                      className="h-2 rounded-full bg-saffron-500"
                      style={{
                        width: `${
                          customerAnalytics.totalCustomers > 0
                            ? (customerAnalytics.dist.two / customerAnalytics.totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3 Orders */}
                <div>
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span>3 Orders (Loyal)</span>
                    <span>{customerAnalytics.dist.three}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-cream-100">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{
                        width: `${
                          customerAnalytics.totalCustomers > 0
                            ? (customerAnalytics.dist.three / customerAnalytics.totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4+ Orders */}
                <div>
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span>4+ Orders (VIP)</span>
                    <span>{customerAnalytics.dist.more}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-cream-100">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{
                        width: `${
                          customerAnalytics.totalCustomers > 0
                            ? (customerAnalytics.dist.more / customerAnalytics.totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reorder Search & Table */}
        <div className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5 shadow-soft space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-serif text-base font-bold text-maroon-900">
              Customer Loyalty & Spend Analysis
            </h3>

            {/* Loyalty Search */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
                <Search size={14} />
              </span>
              <input
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="Search phone, email, or name..."
                className="w-full rounded-lg border border-cream-300 bg-cream-50/50 py-1.5 pl-9 pr-4 text-xs outline-hidden focus:border-maroon-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            {/* Added collapse class admin-table for perfect mobile card styling */}
            <table className="w-full admin-table">
              <thead className="border-b border-cream-200 bg-cream-50/70 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-center">Orders</th>
                  <th className="px-4 py-2.5 text-right">Total Spent</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 text-xs text-ink-700">
                {filteredCustomers.slice(0, 10).map((c, i) => (
                  <tr key={i} className="hover:bg-cream-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-800">{c.name}</p>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-[10px] text-ink-400">
                        {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" data-label="Orders">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        c.ordersCount >= 4 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : c.ordersCount >= 2 
                            ? "bg-saffron-50 text-saffron-700 border border-saffron-200" 
                            : "bg-cream-100 text-ink-600"
                      }`}>
                        {c.ordersCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-ink-800" data-label="Total Spent">
                      {formatINR(c.spent)}
                    </td>
                    <td className="px-4 py-3 text-right" data-label="Actions">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c.phone || c.email)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-maroon-800 hover:text-maroon-900 bg-maroon-50 border border-maroon-200 px-2.5 py-1.5 rounded-lg hover:bg-maroon-100 transition-colors cursor-pointer"
                      >
                        <ArrowUpRight size={12} /> View History
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink-400">
                      No matching loyalty records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer History Details Modal */}
      {activeCustomerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white p-4 sm:p-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-cream-200 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-maroon-900">
                  Customer Order History
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Detailed view for {activeCustomerDetails.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-cream-100 hover:text-ink-700 cursor-pointer"
              >
                <span className="text-lg font-bold">×</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-cream-50/50 p-3 sm:p-4 border border-cream-100 text-xs my-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-ink-400">Contact Phone</p>
                <p className="mt-0.5 font-semibold text-ink-800">{activeCustomerDetails.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-ink-400">Email Address</p>
                <p className="mt-0.5 font-semibold text-ink-800 truncate">{activeCustomerDetails.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-ink-400">Total Placed Orders</p>
                <p className="mt-0.5 font-bold text-maroon-900">{activeCustomerDetails.ordersCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-ink-400">Total Spent Amount</p>
                <p className="mt-0.5 font-bold text-emerald-700 font-mono">{formatINR(activeCustomerDetails.spent)}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">
                All Orders Placed
              </h4>

              {activeCustomerDetails.ordersList.map((o, idx) => {
                const isPaid = o.paymentStatus === "paid" || o.status === "delivered" || o.status === "confirmed" || o.status === "shipped";
                const shortId = o.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
                const orderDate = o.createdAt 
                  ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) 
                  : "N/A";

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-cream-200 bg-white p-3.5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-ink-800">Order #{shortId}</span>
                        <span className="text-[10px] text-ink-400 ml-2">{orderDate}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'delivered' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : o.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-saffron-50 text-saffron-700 border border-saffron-100'
                      }`}>
                        {o.status}
                      </span>
                    </div>

                    <ul className="divide-y divide-cream-100 text-xs">
                      {(o.items ?? []).map((it, i) => (
                        <li key={i} className="py-1 flex justify-between">
                          <span>
                            {it.name}{" "}
                            <span className="text-[10px] text-ink-400">
                              ({it.variantLabel}) × {it.quantity}
                            </span>
                          </span>
                          <span>{formatINR(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between border-t border-cream-100 pt-2 text-xs">
                      <span className="text-[10px] text-ink-400 uppercase font-bold flex items-center gap-1">
                        Payment: 
                        <span className={`px-1.5 py-0.5 rounded-sm ${
                          isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </span>
                      <span className="font-bold text-ink-800 font-mono">
                        Total: {formatINR(o.total ?? 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
