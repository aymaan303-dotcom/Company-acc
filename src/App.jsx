import { useState, useEffect } from "react";
import LoginScreen from "./LoginScreen";
import { supabase } from "./supabaseClient";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: "P001", name: "حديد تسليح 10 مم", type: "تسليح", size: "10 مم", unit: "طن", theoreticalWeight: 617, buyPrice: 14500, sellPrice: 15200, reorderLevel: 10, stock: 85, branch: "الفرع الرئيسي" },
  { id: "P002", name: "حديد تسليح 12 مم", type: "تسليح", size: "12 مم", unit: "طن", theoreticalWeight: 888, buyPrice: 14500, sellPrice: 15200, reorderLevel: 15, stock: 6, branch: "الفرع الرئيسي" },
  { id: "P003", name: "مواسير مجلفنة 2 بوصة", type: "مواسير", size: '2"', unit: "طن", theoreticalWeight: 5600, buyPrice: 18000, sellPrice: 19500, reorderLevel: 5, stock: 3, branch: "الفرع الثاني" },
  { id: "P004", name: "صاج مسطح 2 مم", type: "صاج", size: "2 مم", unit: "طن", theoreticalWeight: 15680, buyPrice: 16200, sellPrice: 17100, reorderLevel: 8, stock: 22, branch: "الفرع الرئيسي" },
  { id: "P005", name: "زاوية 50×50×5", type: "زاوية", size: "50×50×5", unit: "طن", theoreticalWeight: 3770, buyPrice: 15800, sellPrice: 16700, reorderLevel: 10, stock: 4, branch: "الفرع الثاني" },
];

const CUSTOMERS = [
  { id: "C001", name: "شركة البناء الحديث", phone: "0501234567", credit: 200000, balance: 45000, lastPayment: "2024-01-15", overdue: true },
  { id: "C002", name: "مقاولات النيل", phone: "0509876543", credit: 150000, balance: 12000, lastPayment: "2024-01-20", overdue: false },
  { id: "C003", name: "مصنع الهياكل المعدنية", phone: "0507654321", credit: 500000, balance: 87000, lastPayment: "2023-12-28", overdue: true },
  { id: "C004", name: "مشاريع الخليج", phone: "0503456789", credit: 300000, balance: 0, lastPayment: "2024-01-22", overdue: false },
];

const SUPPLIERS = [
  { id: "S001", name: "مصنع حديد المصريين", phone: "0221234567", balance: 320000, lastOrder: "2024-01-18" },
  { id: "S002", name: "شركة الفولاذ الوطني", phone: "0229876543", balance: 180000, lastOrder: "2024-01-20" },
  { id: "S003", name: "مجموعة الحديد المتحدة", phone: "0227654321", balance: 0, lastOrder: "2024-01-10" },
];

const SALES = [
  { id: "INV-001", date: "2024-01-22", customer: "شركة البناء الحديث", items: [{ product: "حديد تسليح 10 مم", qty: 5, price: 15200 }], total: 76000, paid: 30000, status: "جزئي" },
  { id: "INV-002", date: "2024-01-22", customer: "مقاولات النيل", items: [{ product: "صاج مسطح 2 مم", qty: 3, price: 17100 }], total: 51300, paid: 51300, status: "مكتمل" },
  { id: "INV-003", date: "2024-01-21", customer: "مصنع الهياكل المعدنية", items: [{ product: "زاوية 50×50×5", qty: 8, price: 16700 }], total: 133600, paid: 50000, status: "جزئي" },
];

const MANUFACTURING_ORDERS = [
  {
    id: "MFG-001", customer: "شركة البناء الحديث", product: "هياكل معدنية مجلفنة", qty: 12, unit: "قطعة", deliveryDate: "2024-01-28",
    status: "قيد التنفيذ", startDate: "2024-01-20",
    rawMaterials: [
      { item: "صاج مسطح 2 مم", qtyNeeded: 4.5, unit: "طن", unitCost: 16200 },
      { item: "زاوية 50×50×5", qtyNeeded: 1.2, unit: "طن", unitCost: 15800 },
    ],
    waste: 0.15, wasteUnit: "طن",
    operatingCost: 18000, transportCost: 2500,
    expectedRevenue: 145000,
  },
  {
    id: "MFG-002", customer: "مصنع الهياكل المعدنية", product: "مواسير مجلفنة مقاس خاص", qty: 30, unit: "متر", deliveryDate: "2024-01-25",
    status: "مكتمل", startDate: "2024-01-18",
    rawMaterials: [
      { item: "مواسير مجلفنة 2 بوصة", qtyNeeded: 3.0, unit: "طن", unitCost: 18000 },
    ],
    waste: 0.08, wasteUnit: "طن",
    operatingCost: 9500, transportCost: 1200,
    expectedRevenue: 78000,
    actualRevenue: 81000,
  },
  {
    id: "MFG-003", customer: "مقاولات النيل", product: "قواعد تسليح جاهزة", qty: 8, unit: "طن", deliveryDate: "2024-02-02",
    status: "بانتظار المواد", startDate: "2024-01-22",
    rawMaterials: [
      { item: "حديد تسليح 12 مم", qtyNeeded: 8.5, unit: "طن", unitCost: 14500 },
    ],
    waste: 0, wasteUnit: "طن",
    operatingCost: 22000, transportCost: 0,
    expectedRevenue: 168000,
  },
];

const EMPLOYEES = [
  { id: "E001", name: "أحمد محمود", role: "مدير فرع", branch: "الفرع الرئيسي", salary: 8000, attendance: "حاضر" },
  { id: "E002", name: "سارة خالد", role: "محاسب", branch: "الفرع الرئيسي", salary: 5500, attendance: "حاضر" },
  { id: "E003", name: "محمد عمر", role: "مبيعات", branch: "الفرع الثاني", salary: 4500, attendance: "غائب" },
  { id: "E004", name: "فاطمة حسن", role: "مخزن", branch: "الفرع الثاني", salary: 4000, attendance: "حاضر" },
];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    branch: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    products: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    warehouse: "M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    manufacturing: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM9 9l2 2 4-4",
    scale: "M12 3v1m0 16v1M3 12h1m16 0h1m-2.636-6.364l-.707.707M5.343 17.657l-.707.707m12.728 0l-.707-.707M5.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z",
    suppliers: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    customers: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    sales: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
    purchase: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    accounts: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    hr: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    reports: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    permissions: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    backup: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    print: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
    plus: "M12 4v16m8-8H4",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    check: "M5 13l4 4L19 7",
    transfer: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    money: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    truck: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
  };
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons.dashboard} />
    </svg>
  );
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-700",
    gold: "bg-amber-100 text-amber-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>;
};

const StatCard = ({ label, value, sub, icon, color = "blue", trend }) => {
  const colors = {
    blue: "from-blue-600 to-blue-700",
    gold: "from-amber-500 to-amber-600",
    green: "from-emerald-500 to-emerald-600",
    red: "from-red-500 to-red-600",
    steel: "from-slate-600 to-slate-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-4 shadow-lg`}>
      <div className="flex justify-between items-start mb-3">
        <div className="bg-white/20 rounded-lg p-2"><Icon name={icon} size={20} /></div>
        {trend && <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? "bg-green-400/30 text-green-100" : "bg-red-400/30 text-red-100"}`}>{trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%</span>}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
    </div>
  );
};

// ─── SCREENS ──────────────────────────────────────────────────────────────────

// DASHBOARD - LIVE
function Dashboard({ user }) {
  const [stats, setStats] = useState({ salesToday: 0, purchasesToday: 0, totalSales: 0, totalPurchases: 0, stockCount: 0, stockValue: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [overdueCustomers, setOverdueCustomers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    setLoading(true);
    const [salesRes, purchRes, prodRes, custRes] = await Promise.all([
      supabase.from("sales").select("total, paid, created_at, invoice_number, status, customers(name)").order("created_at", { ascending: false }),
      supabase.from("purchases").select("total, paid, created_at").order("created_at", { ascending: false }),
      supabase.from("products").select("name, stock, reorder_level, unit, sell_price"),
      supabase.from("customers").select("name, balance"),
    ]);

    const sales = salesRes.data || [];
    const purchases = purchRes.data || [];
    const products = prodRes.data || [];
    const customers = custRes.data || [];

    const salesToday = sales.filter(s => s.created_at?.startsWith(today)).reduce((sum, s) => sum + Number(s.total || 0), 0);
    const purchasesToday = purchases.filter(p => p.created_at?.startsWith(today)).reduce((sum, p) => sum + Number(p.total || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const stockValue = products.reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.sell_price || 0)), 0);

    setStats({ salesToday, purchasesToday, totalSales, totalPurchases, stockCount: products.length, stockValue });
    setLowStock(products.filter(p => Number(p.stock) <= Number(p.reorder_level || 0)));
    setOverdueCustomers(customers.filter(c => Number(c.balance) > 0));
    setRecentSales(sales.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">لوحة التحكم</h1>
          <p className="text-slate-500 text-sm">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <Badge color="blue">{user?.branch || "الفرع الرئيسي"}</Badge>
          <button onClick={load} className="text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">↻ تحديث</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">جاري تحميل البيانات...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="مبيعات اليوم" value={`${stats.salesToday.toLocaleString()} ج`} icon="sales" color="blue" />
            <StatCard label="مشتريات اليوم" value={`${stats.purchasesToday.toLocaleString()} ج`} icon="purchase" color="steel" />
            <StatCard label="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ج`} icon="money" color="green" />
            <StatCard label="إجمالي المشتريات" value={`${stats.totalPurchases.toLocaleString()} ج`} icon="accounts" color="gold" />
            <StatCard label="عدد الأصناف" value={`${stats.stockCount} صنف`} icon="warehouse" color="steel" />
            <StatCard label="قيمة المخزون" value={`${stats.stockValue.toLocaleString()} ج`} icon="products" color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-yellow-500"><Icon name="warning" size={20} /></div>
                <h3 className="font-bold text-slate-800">أصناف منخفضة الكمية</h3>
                <Badge color={lowStock.length > 0 ? "yellow" : "green"}>{lowStock.length}</Badge>
              </div>
              {lowStock.length === 0 ? (
                <p className="text-sm text-green-600 font-semibold text-center py-4">✓ جميع الأصناف فوق حد إعادة الطلب</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-100">
                      <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">متاح: {p.stock} {p.unit}</span>
                        <Badge color="red">تحت الحد</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-red-500"><Icon name="customers" size={20} /></div>
                <h3 className="font-bold text-slate-800">عملاء لديهم أرصدة مستحقة</h3>
                <Badge color={overdueCustomers.length > 0 ? "red" : "green"}>{overdueCustomers.length}</Badge>
              </div>
              {overdueCustomers.length === 0 ? (
                <p className="text-sm text-green-600 font-semibold text-center py-4">✓ لا توجد أرصدة مستحقة</p>
              ) : (
                <div className="space-y-2">
                  {overdueCustomers.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                      <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                      <span className="text-xs text-red-600 font-bold">{Number(c.balance).toLocaleString()} ج</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-bold text-slate-800 mb-4">آخر الفواتير</h3>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">لا توجد فواتير بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["رقم الفاتورة", "التاريخ", "العميل", "الإجمالي", "المدفوع", "الحالة"].map(h => (
                        <th key={h} className="text-right py-2 px-3 text-slate-500 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map(s => (
                      <tr key={s.invoice_number} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono text-blue-600 font-semibold text-xs">{s.invoice_number}</td>
                        <td className="py-2 px-3 text-slate-600">{s.created_at?.split("T")[0]}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.customers?.name || "—"}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{Number(s.total).toLocaleString()} ج</td>
                        <td className="py-2 px-3 text-green-600 font-semibold">{Number(s.paid).toLocaleString()} ج</td>
                        <td className="py-2 px-3"><Badge color={s.status === "مكتمل" ? "green" : s.status === "جزئي" ? "yellow" : "red"}>{s.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// PRODUCTS
// PRODUCTS & WAREHOUSE - مدمجة
function ProductsScreen({ user }) {
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeType, setActiveType] = useState("الكل");
  const [movements, setMovements] = useState([]);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ product_id: "", type: "استلام", quantity: "", notes: "" });

  const emptyForm = {
    product_code: "", name: "", type: "", size: "", unit: "طن",
    theoretical_weight: "", buy_price: "", sell_price: "", reorder_level: "", stock: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const [prodRes, salesRes, purchRes] = await Promise.all([
      supabase.from("products").select("*").order("type").order("name"),
      supabase.from("sale_items").select("*, products(name,unit), sales(created_at,invoice_number)").order("created_at", { ascending: false }).limit(50),
      supabase.from("purchase_items").select("*, products(name,unit), purchases(created_at,invoice_number)").order("created_at", { ascending: false }).limit(50),
    ]);
    setProducts(prodRes.data || []);
    const salesMov = (salesRes.data || []).map(i => ({ date: i.sales?.created_at?.split("T")[0], ref: i.sales?.invoice_number, product: i.products?.name, unit: i.products?.unit, type: "صرف", qty: i.quantity }));
    const purchMov = (purchRes.data || []).map(i => ({ date: i.purchases?.created_at?.split("T")[0], ref: i.purchases?.invoice_number, product: i.products?.name, unit: i.products?.unit, type: "استلام", qty: i.quantity }));
    setMovements([...salesMov, ...purchMov].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 80));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const types = ["الكل", ...Array.from(new Set(products.map(p => p.type).filter(Boolean))).sort()];
  const typeColors = ["blue","green","gold","red","steel","blue","green","gold"];
  const colorMap = { blue:"bg-blue-100 text-blue-700 border-blue-300", green:"bg-green-100 text-green-700 border-green-300", gold:"bg-amber-100 text-amber-700 border-amber-300", red:"bg-red-100 text-red-700 border-red-300", steel:"bg-slate-100 text-slate-700 border-slate-300" };
  const activeColorMap = { blue:"bg-blue-600 text-white border-blue-600", green:"bg-green-600 text-white border-green-600", gold:"bg-amber-500 text-white border-amber-500", red:"bg-red-600 text-white border-red-600", steel:"bg-slate-600 text-white border-slate-600" };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.includes(search) || p.product_code?.includes(search);
    const matchType = activeType === "الكل" || p.type === activeType;
    return matchSearch && matchType;
  });

  const lowStock = products.filter(p => Number(p.stock) <= Number(p.reorder_level || 0));
  const totalValue = products.reduce((s, p) => s + Number(p.stock || 0) * Number(p.sell_price || 0), 0);

  const openNewForm = () => { setForm({ ...emptyForm, type: activeType !== "الكل" ? activeType : "" }); setEditingId(null); setShowForm(true); };
  const openEditForm = (p) => {
    setForm({ product_code:p.product_code||"", name:p.name||"", type:p.type||"", size:p.size||"", unit:p.unit||"طن", theoretical_weight:p.theoretical_weight??"", buy_price:p.buy_price??"", sell_price:p.sell_price??"", reorder_level:p.reorder_level??"", stock:p.stock??"" });
    setEditingId(p.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.product_code || !form.name) { setErrorMsg("الكود والاسم مطلوبان"); return; }
    setSaving(true); setErrorMsg("");
    const payload = { product_code:form.product_code, name:form.name, type:form.type, size:form.size, unit:form.unit, theoretical_weight:form.theoretical_weight===""?null:Number(form.theoretical_weight), buy_price:form.buy_price===""?0:Number(form.buy_price), sell_price:form.sell_price===""?0:Number(form.sell_price), reorder_level:form.reorder_level===""?0:Number(form.reorder_level), stock:form.stock===""?0:Number(form.stock) };
    let error;
    if (editingId) ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    else ({ error } = await supabase.from("products").insert(payload));
    setSaving(false);
    if (error) { setErrorMsg(error.code==="23505"?"كود الصنف مستخدم بالفعل":"حدث خطأ أثناء الحفظ"); return; }
    setShowForm(false); setForm(emptyForm); setEditingId(null); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الصنف؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) setErrorMsg("تعذر حذف الصنف"); else load();
  };

  const handleAdjust = async () => {
    if (!adjustForm.product_id || !adjustForm.quantity) { setErrorMsg("الصنف والكمية مطلوبان"); return; }
    setSaving(true);
    const prod = products.find(p => p.id === adjustForm.product_id);
    if (!prod) { setSaving(false); return; }
    const newStock = adjustForm.type === "استلام" ? Number(prod.stock) + Number(adjustForm.quantity) : Number(prod.stock) - Number(adjustForm.quantity);
    if (newStock < 0) { setErrorMsg("الكمية أكبر من المخزون المتاح"); setSaving(false); return; }
    await supabase.from("products").update({ stock: newStock }).eq("id", adjustForm.product_id);
    setSaving(false); setShowAdjustForm(false); setAdjustForm({ product_id:"", type:"استلام", quantity:"", notes:"" }); load();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">الأصناف والمخازن</h1>
        <div className="flex gap-2">
          {tab === "products" && (
            <button onClick={openNewForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
              <Icon name="plus" size={16} /> صنف جديد
            </button>
          )}
          {tab === "warehouse" && (
            <button onClick={() => setShowAdjustForm(!showAdjustForm)} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600">
              <Icon name="transfer" size={16} /> تسوية مخزنية
            </button>
          )}
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="إجمالي الأصناف" value={`${products.length} صنف`} icon="products" color="blue" />
        <StatCard label="قيمة المخزون" value={`${totalValue.toLocaleString()} ج`} icon="money" color="green" />
        <StatCard label="أصناف منخفضة" value={lowStock.length} icon="warning" color="gold" />
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      {/* تبويبات رئيسية */}
      <div className="flex gap-2 border-b border-gray-200">
        {[["products","الأصناف"],["warehouse","حركة المخزون"],["lowstock",`منخفضة ${lowStock.length > 0 ? `(${lowStock.length})` : ""}`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${tab===id?"border-blue-600 text-blue-700":"border-transparent text-slate-500 hover:text-slate-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── تبويب الأصناف ─── */}
      {tab === "products" && (
        <>
          {/* فلتر الأنواع */}
          {!loading && (
            <div className="flex flex-wrap gap-2">
              {types.map((type, i) => {
                const col = typeColors[(i-1) % typeColors.length] || "blue";
                const isActive = activeType === type;
                const isAll = type === "الكل";
                return (
                  <button key={type} onClick={() => setActiveType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                      isActive
                        ? isAll ? "bg-slate-700 text-white border-slate-700" : activeColorMap[col]
                        : isAll ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200" : `${colorMap[col]} hover:opacity-80`
                    }`}>
                    {!isAll && <span className={`w-2 h-2 rounded-full ${isActive?"bg-white":col==="blue"?"bg-blue-500":col==="green"?"bg-green-500":col==="gold"?"bg-amber-500":col==="red"?"bg-red-500":"bg-slate-500"}`}></span>}
                    {type}
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/30 font-black">
                      {type==="الكل"?products.length:products.filter(p=>p.type===type).length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* فورم صنف جديد */}
          {showForm && (
            <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
              <h3 className="font-bold text-slate-800 mb-4">{editingId?"تعديل الصنف":"إضافة صنف جديد"}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[["كود الصنف *","product_code","text","P001"],["اسم الصنف *","name","text","حديد تسليح 10 مم"],["النوع","type","text","تسليح"],["المكان","size","text","10 مم"],["الوحدة","unit","text","طن"],["الوزن النظري","theoretical_weight","number","0"],["سعر الشراء","buy_price","number","0"],["سعر البيع","sell_price","number","0"],["حد إعادة الطلب","reorder_level","number","0"],["الكمية الحالية","stock","number","0"]].map(([label,key,type,ph])=>(
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                    <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={ph} />
                  </div>
                ))}
              </div>
              {types.filter(t=>t!=="الكل").length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">اختر من الأنواع الموجودة:</p>
                  <div className="flex flex-wrap gap-2">
                    {types.filter(t=>t!=="الكل").map(t=>(
                      <button key={t} onClick={()=>setForm({...form,type:t})} className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${form.type===t?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":editingId?"حفظ التعديلات":"إضافة الصنف"}</button>
                <button onClick={()=>{setShowForm(false);setErrorMsg("");}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
              </div>
            </Card>
          )}

          {/* بحث */}
          <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={`بحث في ${activeType==="الكل"?"كل الأصناف":activeType}...`} />

          {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري التحميل...</div>
          : filtered.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">لا توجد أصناف{activeType!=="الكل"?` من نوع "${activeType}"`:""}</div>
          : (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 font-semibold">{filtered.length} صنف</p>
                <p className="text-xs text-slate-500">القيمة: <strong className="text-blue-700">{filtered.reduce((s,p)=>s+Number(p.stock||0)*Number(p.sell_price||0),0).toLocaleString()} ج</strong></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {["الكود","الاسم","النوع","المكان","الوحدة","سعر الشراء","سعر البيع","المخزون","الحالة",""].map(h=>(
                        <th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p=>(
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-blue-50/50">
                        <td className="py-3 px-3 font-mono text-xs text-blue-700 font-bold">{p.product_code}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-3">{p.type&&<Badge color="blue">{p.type}</Badge>}</td>
                        <td className="py-3 px-3 text-slate-600">{p.size||"—"}</td>
                        <td className="py-3 px-3 text-slate-600">{p.unit}</td>
                        <td className="py-3 px-3 text-slate-700">{Number(p.buy_price||0).toLocaleString()} ج</td>
                        <td className="py-3 px-3 font-bold text-green-700">{Number(p.sell_price||0).toLocaleString()} ج</td>
                        <td className="py-3 px-3"><span className={`font-bold ${Number(p.stock)<=Number(p.reorder_level||0)?"text-red-600":"text-slate-700"}`}>{p.stock} {p.unit}</span></td>
                        <td className="py-3 px-3"><Badge color={Number(p.stock)<=Number(p.reorder_level||0)?"red":"green"}>{Number(p.stock)<=Number(p.reorder_level||0)?"منخفض":"متاح"}</Badge></td>
                        <td className="py-3 px-3">
                          <div className="flex gap-2">
                            <button onClick={()=>openEditForm(p)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">تعديل</button>
                            <button onClick={()=>handleDelete(p.id)} className="text-xs text-red-600 hover:text-red-800 font-semibold">حذف</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ─── تبويب حركة المخزون ─── */}
      {tab === "warehouse" && (
        <>
          {showAdjustForm && (
            <Card className="p-5 border-2 border-amber-200 bg-amber-50/30">
              <h3 className="font-bold text-slate-800 mb-4">تسوية مخزنية يدوية</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex gap-3">
                    {[["استلام","green","↓"],["صرف","red","↑"]].map(([type,color,arrow])=>(
                      <button key={type} onClick={()=>setAdjustForm({...adjustForm,type})}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${adjustForm.type===type
                          ? color==="green"?"bg-green-100 border-green-500 text-green-700":"bg-red-100 border-red-500 text-red-700"
                          :"bg-gray-50 border-gray-200 text-gray-500"}`}>
                        <span>{arrow}</span> {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">الصنف *</label>
                  <select value={adjustForm.product_id} onChange={e=>setAdjustForm({...adjustForm,product_id:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">-- اختر الصنف --</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name} (متاح: {p.stock} {p.unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">الكمية *</label>
                  <input type="number" value={adjustForm.quantity} onChange={e=>setAdjustForm({...adjustForm,quantity:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">سبب التسوية</label>
                  <input value={adjustForm.notes} onChange={e=>setAdjustForm({...adjustForm,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="مثال: فاقد، جرد، تحويل..." />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAdjust} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":"تطبيق التسوية"}</button>
                <button onClick={()=>setShowAdjustForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
              </div>
            </Card>
          )}
          <Card className="p-4">
            <h3 className="font-bold text-slate-800 mb-4">سجل حركات المخزون</h3>
            {loading ? <div className="text-center py-8 text-slate-400 text-sm">جاري التحميل...</div>
            : movements.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">لا توجد حركات بعد</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {["التاريخ","المرجع","الصنف","نوع الحركة","الكمية"].map(h=>(
                        <th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m,i)=>(
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 text-slate-500">{m.date||"—"}</td>
                        <td className="py-2 px-3 font-mono text-xs text-blue-600 font-bold">{m.ref||"—"}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{m.product||"—"}</td>
                        <td className="py-2 px-3"><Badge color={m.type==="استلام"?"green":"red"}>{m.type}</Badge></td>
                        <td className={`py-2 px-3 font-bold ${m.type==="استلام"?"text-green-600":"text-red-600"}`}>
                          {m.type==="استلام"?"+":"-"}{m.qty} {m.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ─── تبويب المنخفضة ─── */}
      {tab === "lowstock" && (
        <Card className="p-4">
          {lowStock.length === 0 ? (
            <p className="text-center py-8 text-green-600 font-semibold">✓ جميع الأصناف فوق حد إعادة الطلب</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map(p=>(
                <div key={p.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.product_code} · {p.type||"—"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-slate-500">المتاح / الحد الأدنى</p>
                      <p className="font-black text-red-600">{p.stock} / {p.reorder_level} {p.unit}</p>
                    </div>
                    <button onClick={()=>{setTab("products");openEditForm(p);}} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700">تعديل</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// CUSTOMERS
function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    customer_code: "", name: "", phone: "", address: "",
    credit_limit: "", balance: "", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const loadCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErrorMsg("حدث خطأ أثناء تحميل العملاء");
    else setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const filtered = customers.filter(
    c => c.name?.includes(search) || c.customer_code?.includes(search) || c.phone?.includes(search)
  );

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setActive(null);
  };

  const openEditForm = (c) => {
    setForm({
      customer_code: c.customer_code || "",
      name: c.name || "",
      phone: c.phone || "",
      address: c.address || "",
      credit_limit: c.credit_limit ?? "",
      balance: c.balance ?? "",
      notes: c.notes || "",
    });
    setEditingId(c.id);
    setShowForm(true);
    setActive(null);
  };

  const handleSave = async () => {
    if (!form.customer_code || !form.name) {
      setErrorMsg("الكود والاسم مطلوبان");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    const payload = {
      customer_code: form.customer_code,
      name: form.name,
      phone: form.phone,
      address: form.address,
      credit_limit: form.credit_limit === "" ? 0 : Number(form.credit_limit),
      balance: form.balance === "" ? 0 : Number(form.balance),
      notes: form.notes,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("customers").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("customers").insert(payload));
    }
    setSaving(false);
    if (error) {
      setErrorMsg(error.code === "23505" ? "كود العميل ده مستخدم بالفعل" : "حدث خطأ أثناء الحفظ");
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    loadCustomers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) setErrorMsg("تعذر حذف العميل");
    else loadCustomers();
  };

  // صفحة تفاصيل العميل
  if (active) {
    const c = customers.find(x => x.id === active);
    if (!c) return null;
    return (
      <div className="space-y-4">
        <button onClick={() => setActive(null)} className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-800">
          ← العودة للقائمة
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 col-span-1">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-3">
                {c.name[0]}
              </div>
              <h2 className="font-black text-slate-800 text-lg">{c.name}</h2>
              <p className="text-slate-500 text-sm">{c.customer_code}</p>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["الهاتف", c.phone || "—"],
                ["العنوان", c.address || "—"],
                ["الحد الائتماني", `${Number(c.credit_limit || 0).toLocaleString()} ج`],
                ["الرصيد المستحق", `${Number(c.balance || 0).toLocaleString()} ج`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
              {c.notes && <p className="text-xs text-slate-500 pt-2">{c.notes}</p>}
              <div className="pt-2">
                <Badge color={c.balance > 0 ? "red" : "green"}>
                  {c.balance > 0 ? "يوجد رصيد مستحق" : "لا يوجد مديونية"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => openEditForm(c)} className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg text-xs font-semibold hover:bg-blue-100">تعديل</button>
              <button onClick={() => handleDelete(c.id)} className="flex-1 bg-red-50 border border-red-200 text-red-700 py-2 rounded-lg text-xs font-semibold hover:bg-red-100">حذف</button>
            </div>
          </Card>
          <Card className="p-5 col-span-2">
            <h3 className="font-bold text-slate-800 mb-4">كشف الحساب</h3>
            <div className="text-center py-8 text-slate-400 text-sm">
              كشف الحساب سيتوفر بعد ربط جدول المبيعات والمدفوعات
            </div>
            <div className="flex justify-end">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-red-500">إجمالي المديونية</p>
                <p className="font-black text-red-700">{Number(c.balance || 0).toLocaleString()} ج</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">إدارة العملاء</h1>
        <button onClick={openNewForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Icon name="plus" size={16} /> عميل جديد
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>
      )}

      {showForm && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">{editingId ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ["كود العميل *", "customer_code", "text", "مثال: C001"],
              ["اسم العميل *", "name", "text", "الاسم الكامل"],
              ["رقم الهاتف", "phone", "text", "01xxxxxxxxx"],
              ["العنوان", "address", "text", "المدينة - الحي"],
              ["الحد الائتماني", "credit_limit", "number", "0"],
              ["الرصيد الافتتاحي", "balance", "number", "0"],
            ].map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={ph}
                />
              </div>
            ))}
            <div className="col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-16"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">
              {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة العميل"}
            </button>
            <button onClick={() => { setShowForm(false); setErrorMsg(""); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">
              إلغاء
            </button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="بحث بالاسم أو الكود أو الهاتف..." />
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">جاري تحميل العملاء...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">لا يوجد عملاء بعد. اضغط "عميل جديد" للبدء.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-all hover:border-blue-200">
              <div className="flex items-center justify-between mb-3" onClick={() => setActive(c.id)} style={{cursor:"pointer"}}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.phone || "—"} · {c.customer_code}</p>
                  </div>
                </div>
                <Badge color={c.balance > 0 ? "red" : "green"}>
                  {c.balance > 0 ? "مديون" : "سوي"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  ["الحد الائتماني", `${Number(c.credit_limit || 0).toLocaleString()} ج`, "blue"],
                  ["الرصيد المستحق", `${Number(c.balance || 0).toLocaleString()} ج`, c.balance > 0 ? "red" : "green"],
                ].map(([k, v, col]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-slate-500 mb-1">{k}</p>
                    <p className={`text-xs font-bold ${col === "red" ? "text-red-600" : col === "green" ? "text-green-600" : "text-slate-700"}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActive(c.id)} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100">كشف الحساب</button>
                <button onClick={() => openEditForm(c)} className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100">تعديل</button>
                <button onClick={() => handleDelete(c.id)} className="flex-1 bg-red-50 border border-red-200 text-red-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100">حذف</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



// SUPPLIERS
function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { supplier_code:"", name:"", phone:"", address:"", balance:"", notes:"" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) setErrorMsg("حدث خطأ أثناء تحميل الموردين");
    else setSuppliers(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter(s => s.name?.includes(search) || s.supplier_code?.includes(search));
  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({ supplier_code:s.supplier_code||"", name:s.name||"", phone:s.phone||"", address:s.address||"", balance:s.balance??"", notes:s.notes||"" });
    setEditingId(s.id); setShowForm(true);
  };
  const handleSave = async () => {
    if (!form.supplier_code || !form.name) { setErrorMsg("الكود والاسم مطلوبان"); return; }
    setSaving(true); setErrorMsg("");
    const payload = { supplier_code:form.supplier_code, name:form.name, phone:form.phone, address:form.address, balance:form.balance===""?0:Number(form.balance), notes:form.notes };
    let error;
    if (editingId) ({ error } = await supabase.from("suppliers").update(payload).eq("id", editingId));
    else ({ error } = await supabase.from("suppliers").insert(payload));
    setSaving(false);
    if (error) { setErrorMsg(error.code==="23505"?"كود المورد مستخدم بالفعل":"حدث خطأ أثناء الحفظ"); return; }
    setShowForm(false); setForm(emptyForm); setEditingId(null); load();
  };
  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المورد؟")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) setErrorMsg("تعذر حذف المورد"); else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">إدارة الموردين</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Icon name="plus" size={16} /> مورد جديد
        </button>
      </div>
      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}
      {showForm && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">{editingId?"تعديل بيانات المورد":"إضافة مورد جديد"}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[["كود المورد *","supplier_code","text","مثال: S001"],["اسم المورد *","name","text","الاسم الكامل"],["رقم الهاتف","phone","text","01xxxxxxxxx"],["العنوان","address","text","المدينة"],["الرصيد الافتتاحي","balance","number","0"]].map(([label,key,type,ph]) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={ph} />
              </div>
            ))}
            <div className="col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm h-16 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":editingId?"حفظ التعديلات":"إضافة المورد"}</button>
            <button onClick={()=>{setShowForm(false);setErrorMsg("");}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}
      <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="بحث بالاسم أو الكود..." />
      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري التحميل...</div>
      : filtered.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">لا يوجد موردون. اضغط "مورد جديد" للبدء.</div>
      : (
        <div className="space-y-3">
          {filtered.map(s => (
            <Card key={s.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl flex items-center justify-center text-white font-black text-lg">{s.name[0]}</div>
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.phone||"—"} · {s.supplier_code}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-500">المستحقات</p>
                  <p className={`font-black text-lg ${Number(s.balance)>0?"text-red-600":"text-green-600"}`}>{Number(s.balance||0).toLocaleString()} ج</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-semibold border border-slate-200">كشف الحساب</button>
                <button onClick={()=>openEdit(s)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-semibold border border-blue-200">تعديل</button>
                <button onClick={()=>handleDelete(s.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-xs font-semibold border border-red-200">حذف</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// TREASURY - الخزنة مع نظام الموافقة
function TreasuryScreen({ user }) {
  const [treasury, setTreasury] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("movements");

  const isAdmin = user?.roleKey === "admin";

  const emptyForm = { type: "قبض", amount: "", description: "", reference_type: "يدوي" };
  const emptyTransfer = { amount: "", description: "", to_type: "bank", to_bank_id: "" };
  const [form, setForm] = useState(emptyForm);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const load = async () => {
    setLoading(true);
    const [treasRes, txRes, transfersRes, banksRes] = await Promise.all([
      supabase.from("treasury").select("*, branches(name)").order("branch_id"),
      supabase.from("treasury_transactions").select("*, treasury(branches(name))").order("created_at", { ascending: false }).limit(100),
      supabase.from("treasury_transfers").select("*, treasury(branches(name)), banks(name)").order("created_at", { ascending: false }),
      supabase.from("banks").select("id, name, balance"),
    ]);
    setTreasury(treasRes.data || []);
    setTransactions(txRes.data || []);
    setTransfers(transfersRes.data || []);
    setBanks(banksRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalBalance = treasury.reduce((s, t) => s + Number(t.balance || 0), 0);
  const totalIn = transactions.filter(t => t.type === "قبض").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOut = transactions.filter(t => t.type === "صرف").reduce((s, t) => s + Number(t.amount || 0), 0);
  const pendingTransfers = transfers.filter(t => t.status === "بانتظار الموافقة");

  const showMsg = (msg, isError = false) => {
    if (isError) setErrorMsg(msg); else setSuccessMsg(msg);
    setTimeout(() => { setErrorMsg(""); setSuccessMsg(""); }, 3000);
  };

  const handleSave = async () => {
    if (!form.amount) { showMsg("المبلغ مطلوب", true); return; }
    setSaving(true);
    const treas = treasury.find(t => t.branch_id === (user?.branchId || 1));
    if (!treas) { showMsg("لم يتم العثور على خزنة الفرع", true); setSaving(false); return; }
    const newBalance = form.type === "قبض"
      ? Number(treas.balance) + Number(form.amount)
      : Number(treas.balance) - Number(form.amount);
    if (newBalance < 0 && form.type === "صرف") { showMsg("رصيد الخزنة غير كافي", true); setSaving(false); return; }
    const { error } = await supabase.from("treasury_transactions").insert({
      treasury_id: treas.id, type: form.type, amount: Number(form.amount),
      description: form.description, reference_type: form.reference_type, branch_id: user?.branchId || 1,
    });
    if (!error) await supabase.from("treasury").update({ balance: newBalance }).eq("id", treas.id);
    setSaving(false);
    if (error) { showMsg("خطأ أثناء الحفظ", true); return; }
    setShowForm(false); setForm(emptyForm); load(); showMsg("تم تسجيل الحركة بنجاح");
  };

  // طلب توريد (من المحاسب) - لا يخصم من الخزنة فوراً
  const handleTransferRequest = async () => {
    if (!transferForm.amount) { showMsg("المبلغ مطلوب", true); return; }
    setSaving(true);
    const treas = treasury.find(t => t.branch_id === (user?.branchId || 1));
    if (!treas) { showMsg("لم يتم العثور على خزنة الفرع", true); setSaving(false); return; }
    if (Number(transferForm.amount) > Number(treas.balance)) {
      showMsg("المبلغ المطلوب أكبر من رصيد الخزنة", true); setSaving(false); return;
    }
    const { error } = await supabase.from("treasury_transfers").insert({
      from_treasury_id: treas.id,
      to_type: transferForm.to_type,
      to_bank_id: transferForm.to_bank_id || null,
      amount: Number(transferForm.amount),
      description: transferForm.description,
      status: "بانتظار الموافقة",
      branch_id: user?.branchId || 1,
    });
    setSaving(false);
    if (error) { showMsg("خطأ أثناء إرسال الطلب", true); return; }
    setShowTransferForm(false); setTransferForm(emptyTransfer);
    load(); showMsg("تم إرسال طلب التوريد — بانتظار موافقة المدير");
  };

  // موافقة الأدمن على التوريد
  const handleApprove = async (transfer) => {
    setSaving(true);
    const treas = treasury.find(t => t.id === transfer.from_treasury_id);
    if (!treas) { showMsg("خطأ: الخزنة غير موجودة", true); setSaving(false); return; }
    if (Number(transfer.amount) > Number(treas.balance)) {
      showMsg("رصيد الخزنة غير كافٍ لإتمام التحويل", true); setSaving(false); return;
    }

    // خصم من الخزنة
    await supabase.from("treasury").update({ balance: Number(treas.balance) - Number(transfer.amount) }).eq("id", treas.id);

    // تسجيل حركة في الخزنة
    await supabase.from("treasury_transactions").insert({
      treasury_id: treas.id, type: "صرف", amount: Number(transfer.amount),
      description: `توريد معتمد - ${transfer.description || ""}`,
      reference_type: "توريد", branch_id: transfer.branch_id,
    });

    // لو كان التوريد لبنك، يضاف لرصيد البنك
    if (transfer.to_type === "bank" && transfer.to_bank_id) {
      const bank = banks.find(b => b.id === transfer.to_bank_id);
      if (bank) {
        await supabase.from("banks").update({ balance: Number(bank.balance) + Number(transfer.amount) }).eq("id", bank.id);
        await supabase.from("bank_transactions").insert({
          bank_id: bank.id, type: "إيداع", amount: Number(transfer.amount),
          description: `توريد من الخزنة - ${transfer.description || ""}`,
        });
      }
    }

    // تحديث حالة الطلب
    await supabase.from("treasury_transfers").update({
      status: "معتمد",
      approved_at: new Date().toISOString(),
    }).eq("id", transfer.id);

    setSaving(false); load(); showMsg("✅ تم اعتماد التوريد وتحديث الأرصدة");
  };

  // رفض الطلب
  const handleReject = async (id) => {
    await supabase.from("treasury_transfers").update({ status: "مرفوض" }).eq("id", id);
    load(); showMsg("تم رفض طلب التوريد");
  };

  const filtered = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-800">الخزنة</h1>
          {pendingTransfers.length > 0 && isAdmin && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {pendingTransfers.length} طلب بانتظار موافقتك
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransferForm(!showTransferForm)} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600">
            <Icon name="transfer" size={16} /> طلب توريد
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Icon name="plus" size={16} /> حركة جديدة
          </button>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">{successMsg}</div>}

      {/* أرصدة الخزن */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {treasury.map(t => (
          <div key={t.id} className="bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 rounded-lg p-2"><Icon name="money" size={20} /></div>
              <div>
                <p className="text-slate-300 text-xs">خزنة</p>
                <p className="font-bold">{t.branches?.name}</p>
              </div>
            </div>
            <p className={`text-3xl font-black ${Number(t.balance) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {Number(t.balance).toLocaleString()} ج
            </p>
            {pendingTransfers.filter(tr => tr.from_treasury_id === t.id).length > 0 && (
              <p className="text-amber-300 text-xs mt-2 font-semibold">
                ⏳ {pendingTransfers.filter(tr => tr.from_treasury_id === t.id).reduce((s, tr) => s + Number(tr.amount), 0).toLocaleString()} ج بانتظار موافقة
              </p>
            )}
          </div>
        ))}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/20 rounded-lg p-2"><Icon name="accounts" size={20} /></div>
            <p className="font-bold">إجمالي الخزائن</p>
          </div>
          <p className="text-3xl font-black">{totalBalance.toLocaleString()} ج</p>
          <div className="flex gap-4 mt-2">
            <p className="text-green-300 text-xs">↓ {totalIn.toLocaleString()} ج</p>
            <p className="text-red-300 text-xs">↑ {totalOut.toLocaleString()} ج</p>
          </div>
        </div>
      </div>

      {/* فورم حركة يدوية */}
      {showForm && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">تسجيل حركة خزنة</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="flex gap-3">
                {[["قبض", "green", "↓"], ["صرف", "red", "↑"]].map(([type, color, arrow]) => (
                  <button key={type} onClick={() => setForm({ ...form, type })}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${form.type === type
                      ? color === "green" ? "bg-green-100 border-green-500 text-green-700" : "bg-red-100 border-red-500 text-red-700"
                      : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                    <span>{arrow}</span> {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">المبلغ *</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">المصدر</label>
              <select value={form.reference_type} onChange={e => setForm({ ...form, reference_type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="يدوي">يدوي</option>
                <option value="مبيعات">مبيعات</option>
                <option value="مشتريات">مشتريات</option>
                <option value="بنك">تحويل بنكي</option>
                <option value="رواتب">رواتب</option>
                <option value="مصروفات">مصروفات تشغيلية</option>
                <option value="سلف">سلف موظفين</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">البيان</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="وصف الحركة..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">
              {saving ? "جاري الحفظ..." : "حفظ الحركة"}
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* فورم طلب توريد */}
      {showTransferForm && (
        <Card className="p-5 border-2 border-amber-200 bg-amber-50/30">
          <h3 className="font-bold text-slate-800 mb-2">طلب توريد من الخزنة</h3>
          <p className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 mb-4 font-semibold">
            ⚠️ لن يتم خصم المبلغ من الخزنة إلا بعد موافقة مدير النظام
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">المبلغ *</label>
              <input type="number" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">التوريد إلى</label>
              <select value={transferForm.to_type} onChange={e => setTransferForm({ ...transferForm, to_type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="bank">بنك</option>
                <option value="other">جهة أخرى</option>
              </select>
            </div>
            {transferForm.to_type === "bank" && (
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">اختر البنك</label>
                <select value={transferForm.to_bank_id} onChange={e => setTransferForm({ ...transferForm, to_bank_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">-- اختر البنك --</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name} — رصيد: {Number(b.balance).toLocaleString()} ج</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">سبب التوريد</label>
              <input value={transferForm.description} onChange={e => setTransferForm({ ...transferForm, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="وصف سبب التوريد..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleTransferRequest} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">
              {saving ? "جاري الإرسال..." : "إرسال طلب التوريد"}
            </button>
            <button onClick={() => setShowTransferForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* طلبات التوريد المعلقة - للأدمن فقط */}
      {isAdmin && pendingTransfers.length > 0 && (
        <Card className="p-4 border-2 border-red-200 bg-red-50/30">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-red-500"><Icon name="warning" size={18} /></span>
            طلبات التوريد بانتظار موافقتك
            <Badge color="red">{pendingTransfers.length}</Badge>
          </h3>
          <div className="space-y-3">
            {pendingTransfers.map(tr => (
              <div key={tr.id} className="bg-white rounded-xl border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{Number(tr.amount).toLocaleString()} ج</p>
                    <p className="text-xs text-slate-500">
                      من: {tr.treasury?.branches?.name} ·
                      إلى: {tr.to_type === "bank" ? tr.banks?.name || "بنك" : "جهة أخرى"} ·
                      {tr.created_at?.split("T")[0]}
                    </p>
                    {tr.description && <p className="text-sm text-slate-600 mt-1 font-semibold">"{tr.description}"</p>}
                  </div>
                  <Badge color="yellow">بانتظار الموافقة</Badge>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(tr)} disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                    <Icon name="check" size={16} /> موافقة واعتماد التحويل
                  </button>
                  <button onClick={() => handleReject(tr.id)} disabled={saving}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-bold border border-red-200">
                    رفض الطلب
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* تبويبات */}
      <div className="flex gap-2 border-b border-gray-200">
        {[["movements", "حركات الخزنة"], ["transfers", "سجل التوريدات"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${tab === id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري التحميل...</div> : (
        <>
          {tab === "movements" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">كشف حركات الخزنة</h3>
                <div className="flex gap-2">
                  {[["all","الكل"],["قبض","مقبوضات"],["صرف","مصروفات"]].map(([val,label])=>(
                    <button key={val} onClick={()=>setFilter(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter===val?"bg-blue-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length === 0 ? <p className="text-center py-8 text-slate-400 text-sm">لا توجد حركات بعد</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        {["التاريخ","النوع","البيان","المصدر","الفرع","المبلغ"].map(h=>(
                          <th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(t=>(
                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-3 text-slate-500 text-xs">{t.created_at?.split("T")[0]}</td>
                          <td className="py-3 px-3"><Badge color={t.type==="قبض"?"green":"red"}>{t.type}</Badge></td>
                          <td className="py-3 px-3 text-slate-700">{t.description||"—"}</td>
                          <td className="py-3 px-3"><Badge color={t.reference_type==="مبيعات"?"blue":t.reference_type==="مشتريات"?"red":t.reference_type==="بنك"?"gold":"gray"}>{t.reference_type||"يدوي"}</Badge></td>
                          <td className="py-3 px-3 text-slate-500 text-xs">{t.treasury?.branches?.name||"—"}</td>
                          <td className={`py-3 px-3 font-black text-lg ${t.type==="قبض"?"text-green-600":"text-red-600"}`}>
                            {t.type==="قبض"?"+":"-"}{Number(t.amount).toLocaleString()} ج
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {tab === "transfers" && (
            <Card className="p-4">
              <h3 className="font-bold text-slate-800 mb-4">سجل طلبات التوريد</h3>
              {transfers.length === 0 ? <p className="text-center py-8 text-slate-400 text-sm">لا توجد طلبات توريد</p> : (
                <div className="space-y-2">
                  {transfers.map(tr => (
                    <div key={tr.id} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${tr.status==="معتمد"?"bg-green-50 border-green-200":tr.status==="مرفوض"?"bg-red-50 border-red-200":"bg-amber-50 border-amber-200"}`}>
                      <div>
                        <p className="font-bold text-slate-800">{Number(tr.amount).toLocaleString()} ج</p>
                        <p className="text-xs text-slate-500">
                          {tr.created_at?.split("T")[0]} · من: {tr.treasury?.branches?.name} ·
                          إلى: {tr.to_type==="bank"?tr.banks?.name||"بنك":"جهة أخرى"}
                        </p>
                        {tr.description && <p className="text-xs text-slate-600 mt-0.5">"{tr.description}"</p>}
                      </div>
                      <Badge color={tr.status==="معتمد"?"green":tr.status==="مرفوض"?"red":"yellow"}>
                        {tr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// SALES
function SalesScreen({ user }) {  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [active, setActive] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { invoice_number: "", customer_id: "", customer_name: "", notes: "", discount: "0", paid: "0", payment_type: "آجل" };
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ product_id: "", quantity: "", unit_price: "" }]);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const load = async () => {
    setLoading(true);
    const isAdmin = user?.roleKey === "admin";
    const branchFilter = user?.branchId;
    const [salesRes, custRes, prodRes] = await Promise.all([
      isAdmin
        ? supabase.from("sales").select("*, customers(name), sale_items(*, products(name, unit))").order("created_at", { ascending: false })
        : supabase.from("sales").select("*, customers(name), sale_items(*, products(name, unit))").eq("branch_id", branchFilter).order("created_at", { ascending: false }),
      isAdmin
        ? supabase.from("customers").select("id, name, balance")
        : supabase.from("customers").select("id, name, balance").eq("branch_id", branchFilter),
      supabase.from("products").select("id, name, unit, sell_price, stock"),
    ]);
    if (salesRes.error) setErrorMsg("خطأ في تحميل المبيعات");
    else setSales(salesRes.data || []);
    setCustomers(custRes.data || []);
    setProducts(prodRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const itemsTotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price) || 0), 0);
  const netTotal = itemsTotal - Number(form.discount || 0);
  const remaining = netTotal - Number(form.paid || 0);
  const status = remaining <= 0 ? "مكتمل" : Number(form.paid) > 0 ? "جزئي" : "غير مدفوع";

  const addItem = () => setItems([...items, { product_id: "", quantity: "", unit_price: "" }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    if (field === "product_id") {
      const prod = products.find(p => p.id === val);
      if (prod) updated[i].unit_price = prod.sell_price;
    }
    setItems(updated);
  };

  const handleSave = async () => {
    if (!form.invoice_number || (!form.customer_id && !form.customer_name)) { setErrorMsg("رقم الفاتورة واسم العميل مطلوبان"); return; }
    if (items.some(i => !i.product_id || !i.quantity)) { setErrorMsg("تأكد من اختيار الصنف والكمية لكل بند"); return; }
    setSaving(true); setErrorMsg("");

    // إنشاء عميل جديد تلقائياً لو كتب اسم جديد
    let customerId = form.customer_id;
    if (!customerId && form.customer_name) {
      const code = "C-" + Date.now().toString().slice(-6);
      const { data: newCust, error: custErr } = await supabase.from("customers").insert({
        customer_code: code, name: form.customer_name, branch_id: user?.branchId || 1, balance: 0,
      }).select().single();
      if (custErr) { setSaving(false); setErrorMsg("خطأ أثناء إنشاء العميل"); return; }
      customerId = newCust.id;
    }

    const salePayload = {
      invoice_number: form.invoice_number,
      customer_id: customerId,
      branch_id: user?.branchId || null,
      payment_type: form.payment_type,
      total: netTotal,
      paid: form.payment_type === "نقدي" ? netTotal : Number(form.paid || 0),
      discount: Number(form.discount || 0),
      notes: form.notes,
      status: form.payment_type === "نقدي" ? "مكتمل" : status,
    };

    const { data: saleData, error: saleError } = await supabase.from("sales").insert(salePayload).select().single();
    if (saleError) {
      setSaving(false);
      setErrorMsg(saleError.code === "23505" ? "رقم الفاتورة مستخدم بالفعل" : "خطأ أثناء حفظ الفاتورة");
      return;
    }

    const itemsPayload = items.map(i => ({
      sale_id: saleData.id,
      product_id: i.product_id,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      total: Number(i.quantity) * Number(i.unit_price),
    }));
    const { error: itemsError } = await supabase.from("sale_items").insert(itemsPayload);

    // تحديث رصيد العميل
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newBalance = Number(customer.balance || 0) + remaining;
      await supabase.from("customers").update({ balance: newBalance }).eq("id", customerId);
    }

    // تحديث الخزنة تلقائياً لو الدفع نقدي
    if (form.payment_type === "نقدي" || Number(form.paid) > 0) {
      const amountPaid = form.payment_type === "نقدي" ? netTotal : Number(form.paid);
      const { data: treasData } = await supabase.from("treasury").select("*").eq("branch_id", user?.branchId || 1).single();
      if (treasData) {
        await supabase.from("treasury").update({ balance: Number(treasData.balance) + amountPaid }).eq("id", treasData.id);
        await supabase.from("treasury_transactions").insert({
          treasury_id: treasData.id,
          type: "قبض",
          amount: amountPaid,
          description: `مبيعات - فاتورة ${form.invoice_number}`,
          reference_type: "مبيعات",
          branch_id: user?.branchId || 1,
        });
      }
    }

    // خصم من المخزون
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        await supabase.from("products").update({ stock: Number(prod.stock) - Number(item.quantity) }).eq("id", item.product_id);
      }
    }

    setSaving(false);
    if (itemsError) { setErrorMsg("تم حفظ الفاتورة لكن حدث خطأ في البنود"); return; }
    setShowForm(false); setForm(emptyForm); setItems([{ product_id: "", quantity: "", unit_price: "" }]); load();
  };

  const printInvoice = (inv) => {
    const items = (inv.sale_items || []).map(item => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:8px;text-align:right">${item.products?.name || "—"}</td>
        <td style="padding:8px;text-align:center">${item.quantity} ${item.products?.unit || ""}</td>
        <td style="padding:8px;text-align:center">${Number(item.unit_price).toLocaleString()} ج</td>
        <td style="padding:8px;text-align:center;font-weight:bold">${Number(item.total).toLocaleString()} ج</td>
      </tr>`).join("");
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl"><head><title>فاتورة ${inv.invoice_number}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#1e293b} table{width:100%;border-collapse:collapse} th{background:#1e3a5f;color:white;padding:10px;text-align:center} .total-box{background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:15px;margin-top:20px} @media print{button{display:none}}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e3a5f;padding-bottom:15px;margin-bottom:20px">
        <div>
          <h1 style="color:#1e3a5f;font-size:28px;margin:0">AYSC</h1>
          <p style="color:#64748b;margin:5px 0 0">نظام إدارة تجارة الحديد</p>
        </div>
        <div style="text-align:left">
          <h2 style="color:#1e3a5f;margin:0">فاتورة بيع</h2>
          <p style="color:#64748b;margin:5px 0 0">رقم: <strong>${inv.invoice_number}</strong></p>
          <p style="color:#64748b;margin:0">التاريخ: ${inv.created_at?.split("T")[0]}</p>
        </div>
      </div>
      <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:20px">
        <strong>العميل:</strong> ${inv.customers?.name || "—"}
      </div>
      <table>
        <thead><tr><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div class="total-box" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div><span style="color:#64748b">إجمالي الفاتورة:</span> <strong>${Number(inv.total).toLocaleString()} ج</strong></div>
        <div><span style="color:#64748b">الخصم:</span> <strong style="color:#ef4444">${Number(inv.discount||0).toLocaleString()} ج</strong></div>
        <div><span style="color:#64748b">المدفوع:</span> <strong style="color:#16a34a">${Number(inv.paid).toLocaleString()} ج</strong></div>
        <div><span style="color:#64748b">المتبقي:</span> <strong style="color:#ef4444">${(Number(inv.total)-Number(inv.paid)).toLocaleString()} ج</strong></div>
      </div>
      <div style="margin-top:40px;display:flex;justify-content:space-between;color:#64748b;font-size:12px">
        <span>توقيع العميل: _________________</span>
        <span>توقيع المندوب: _________________</span>
      </div>
      <button onclick="window.print()" style="margin-top:20px;background:#1e3a5f;color:white;border:none;padding:10px 30px;border-radius:8px;cursor:pointer;font-size:16px">طباعة</button>
      </body></html>`);
    win.document.close();
  };

  const totalSales = sales.reduce((s, inv) => s + Number(inv.total || 0), 0);
  const totalPaid = sales.reduce((s, inv) => s + Number(inv.paid || 0), 0);
  const totalRemaining = totalSales - totalPaid;

  // صفحة تفاصيل الفاتورة
  if (active) {
    const inv = sales.find(s => s.id === active);
    if (!inv) return null;
    return (
      <div className="space-y-4">
        <button onClick={() => setActive(null)} className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-800">← العودة للفواتير</button>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-black text-xl text-slate-800">{inv.invoice_number}</h2>
                <Badge color={inv.status==="مكتمل"?"green":inv.status==="جزئي"?"yellow":"red"}>{inv.status}</Badge>
              </div>
              <p className="text-slate-500 text-sm">{inv.customers?.name} · {inv.created_at?.split("T")[0]} · <Badge color={inv.payment_type==="نقدي"?"green":inv.payment_type==="شيك"?"gold":"blue"}>{inv.payment_type==="نقدي"?"💵 نقدي":inv.payment_type==="شيك"?"🏦 شيك":"📋 آجل"}</Badge></p>
            </div>
            <button onClick={() => printInvoice(inv)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold">
              <Icon name="print" size={16} /> طباعة
            </button>
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="bg-slate-50">{["الصنف","الكمية","سعر الوحدة","الإجمالي"].map(h=><th key={h} className="text-right py-2 px-3 text-slate-600 font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {(inv.sale_items||[]).map((item,i)=>(
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-semibold text-slate-800">{item.products?.name||"—"}</td>
                  <td className="py-2 px-3 text-slate-600">{item.quantity} {item.products?.unit||""}</td>
                  <td className="py-2 px-3 text-slate-600">{Number(item.unit_price).toLocaleString()} ج</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{Number(item.total).toLocaleString()} ج</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="space-y-2 text-sm w-64">
              {[["الإجمالي قبل الخصم",Number(inv.total)+Number(inv.discount||0),"slate"],["الخصم",Number(inv.discount||0),"red"],["الإجمالي",Number(inv.total),"slate"],["المدفوع",Number(inv.paid),"green"],["المتبقي",Number(inv.total)-Number(inv.paid),"red"]].map(([k,v,col])=>(
                <div key={k} className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-slate-500">{k}</span>
                  <span className={`font-bold ${col==="green"?"text-green-700":col==="red"?"text-red-700":"text-slate-800"}`}>{v.toLocaleString()} ج</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">المبيعات</h1>
        <button onClick={() => { setShowForm(!showForm); setErrorMsg(""); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Icon name="plus" size={16} /> فاتورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="إجمالي المبيعات" value={`${totalSales.toLocaleString()} ج`} icon="sales" color="blue" />
        <StatCard label="إجمالي المحصل" value={`${totalPaid.toLocaleString()} ج`} icon="money" color="green" />
        <StatCard label="إجمالي المتبقي" value={`${totalRemaining.toLocaleString()} ج`} icon="warning" color="gold" />
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      {showForm && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">فاتورة بيع جديدة</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">رقم الفاتورة *</label>
              <input value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="INV-001" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">العميل *</label>
              <div className="relative">
                <input
                  value={form.customer_name}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, customer_name: val, customer_id: "" });
                    const matches = customers.filter(c => c.name.includes(val) && val.length > 0);
                    setCustomerSuggestions(matches);
                    setShowSuggestions(matches.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="اكتب اسم العميل (جديد أو موجود)..." />
                {showSuggestions && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {customerSuggestions.map(c => (
                      <button key={c.id} onMouseDown={() => {
                        setForm({ ...form, customer_id: c.id, customer_name: c.name });
                        setShowSuggestions(false);
                      }} className="w-full text-right px-4 py-2.5 hover:bg-blue-50 text-sm font-semibold text-slate-800 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{Number(c.balance || 0) > 0 ? `رصيد: ${Number(c.balance).toLocaleString()} ج` : "لا يوجد رصيد"}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.customer_id && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-green-500 text-xs">✓</span>
                    <span className="text-xs text-green-600 font-semibold">عميل موجود — سيتم تحديث رصيده</span>
                  </div>
                )}
                {!form.customer_id && form.customer_name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-blue-500 text-xs">✦</span>
                    <span className="text-xs text-blue-600 font-semibold">عميل جديد — سيتم إضافته تلقائياً للعملاء</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الدفع</label>
              <div className="flex gap-3">
                {[["نقدي", "green", "💵"], ["آجل", "blue", "📋"], ["شيك", "gold", "🏦"]].map(([type, color, icon]) => (
                  <button key={type} onClick={() => setForm({ ...form, payment_type: type })}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${form.payment_type === type
                      ? color === "green" ? "bg-green-100 border-green-500 text-green-700"
                      : color === "blue" ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-amber-100 border-amber-500 text-amber-700"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                    <span>{icon}</span> {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-700 text-sm">البنود</h4>
              <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"><Icon name="plus" size={14} /> إضافة بند</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                  <div className="col-span-2">
                    <select value={item.product_id} onChange={e=>updateItem(i,"product_id",e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">-- اختر الصنف --</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.name} (متاح: {p.stock} {p.unit})</option>)}
                    </select>
                  </div>
                  <div>
                    <input type="number" value={item.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="الكمية" />
                  </div>
                  <div className="flex gap-1">
                    <input type="number" value={item.unit_price} onChange={e=>updateItem(i,"unit_price",e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="السعر" />
                    {items.length > 1 && <button onClick={()=>removeItem(i)} className="text-red-500 hover:text-red-700 px-2">✕</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الخصم (ج)</label>
                <input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">المدفوع (ج)</label>
                <input type="number" value={form.paid} onChange={e=>setForm({...form,paid:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex flex-col justify-end">
                <div className="bg-white border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">الإجمالي</p>
                  <p className="font-black text-blue-700 text-lg">{netTotal.toLocaleString()} ج</p>
                  <p className="text-xs text-slate-500 mt-1">متبقي: <span className={`font-bold ${remaining>0?"text-red-600":"text-green-600"}`}>{remaining.toLocaleString()} ج</span></p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm h-16 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":"حفظ الفاتورة"}</button>
            <button onClick={()=>{setShowForm(false);setErrorMsg("");}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري تحميل الفواتير...</div>
      : sales.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">لا توجد فواتير بعد. اضغط "فاتورة جديدة" للبدء.</div>
      : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {["رقم الفاتورة","التاريخ","العميل","نوع الدفع","الإجمالي","المدفوع","المتبقي","الحالة",""].map(h=>(
                    <th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map(s=>(
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer">
                    <td className="py-3 px-3 font-mono text-blue-700 font-bold text-xs">{s.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600">{s.created_at?.split("T")[0]}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{s.customers?.name||"—"}</td>
                    <td className="py-3 px-3">
                      <Badge color={s.payment_type==="نقدي"?"green":s.payment_type==="شيك"?"gold":"blue"}>
                        {s.payment_type==="نقدي"?"💵 نقدي":s.payment_type==="شيك"?"🏦 شيك":"📋 آجل"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{Number(s.total).toLocaleString()} ج</td>
                    <td className="py-3 px-3 text-green-600 font-semibold">{Number(s.paid).toLocaleString()} ج</td>
                    <td className="py-3 px-3 text-red-600 font-semibold">{(Number(s.total)-Number(s.paid)).toLocaleString()} ج</td>
                    <td className="py-3 px-3"><Badge color={s.status==="مكتمل"?"green":s.status==="جزئي"?"yellow":"red"}>{s.status}</Badge></td>
                    <td className="py-3 px-3"><button onClick={()=>setActive(s.id)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// PURCHASES
function PurchasesScreen() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [active, setActive] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { invoice_number:"", supplier_id:"", supplier_name:"", notes:"", discount:"0", paid:"0", payment_type:"آجل" };
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ product_id:"", quantity:"", unit_price:"" }]);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const load = async () => {
    setLoading(true);
    const isAdmin = user?.roleKey === "admin";
    const branchFilter = user?.branchId;
    const [purchRes, suppRes, prodRes] = await Promise.all([
      isAdmin
        ? supabase.from("purchases").select("*, suppliers(name), purchase_items(*, products(name, unit))").order("created_at", { ascending: false })
        : supabase.from("purchases").select("*, suppliers(name), purchase_items(*, products(name, unit))").eq("branch_id", branchFilter).order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id, name, balance"),
      supabase.from("products").select("id, name, unit, buy_price, stock"),
    ]);
    if (purchRes.error) setErrorMsg("خطأ في تحميل المشتريات");
    else setPurchases(purchRes.data || []);
    setSuppliers(suppRes.data || []);
    setProducts(prodRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const itemsTotal = items.reduce((s,i) => s + (Number(i.quantity)*Number(i.unit_price)||0), 0);
  const netTotal = itemsTotal - Number(form.discount||0);
  const remaining = netTotal - Number(form.paid||0);
  const status = remaining <= 0 ? "مكتمل" : Number(form.paid) > 0 ? "جزئي" : "غير مدفوع";

  const addItem = () => setItems([...items, { product_id:"", quantity:"", unit_price:"" }]);
  const removeItem = (i) => setItems(items.filter((_,idx)=>idx!==i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    if (field === "product_id") {
      const prod = products.find(p=>p.id===val);
      if (prod) updated[i].unit_price = prod.buy_price;
    }
    setItems(updated);
  };

  const handleSave = async () => {
    if (!form.invoice_number || (!form.supplier_id && !form.supplier_name)) { setErrorMsg("رقم الفاتورة واسم المورد مطلوبان"); return; }
    if (items.some(i=>!i.product_id||!i.quantity)) { setErrorMsg("تأكد من اختيار الصنف والكمية لكل بند"); return; }
    setSaving(true); setErrorMsg("");

    // إنشاء مورد جديد تلقائياً لو كتب اسم جديد
    let supplierId = form.supplier_id;
    if (!supplierId && form.supplier_name) {
      const code = "S-" + Date.now().toString().slice(-6);
      const { data: newSupp, error: suppErr } = await supabase.from("suppliers").insert({
        supplier_code: code, name: form.supplier_name, branch_id: user?.branchId || 1, balance: 0,
      }).select().single();
      if (suppErr) { setSaving(false); setErrorMsg("خطأ أثناء إنشاء المورد"); return; }
      supplierId = newSupp.id;
    }

    const payload = { invoice_number:form.invoice_number, supplier_id:supplierId, branch_id: user?.branchId || null, payment_type:form.payment_type, total:netTotal, paid:form.payment_type==="نقدي"?netTotal:Number(form.paid||0), discount:Number(form.discount||0), notes:form.notes, status:form.payment_type==="نقدي"?"مكتمل":status };
    const { data: purchData, error: purchError } = await supabase.from("purchases").insert(payload).select().single();
    if (purchError) { setSaving(false); setErrorMsg(purchError.code==="23505"?"رقم الفاتورة مستخدم بالفعل":"خطأ أثناء الحفظ"); return; }

    const itemsPayload = items.map(i=>({ purchase_id:purchData.id, product_id:i.product_id, quantity:Number(i.quantity), unit_price:Number(i.unit_price), total:Number(i.quantity)*Number(i.unit_price) }));
    await supabase.from("purchase_items").insert(itemsPayload);

    // تحديث رصيد المورد
    const supplier = suppliers.find(s=>s.id===supplierId);
    if (supplier) await supabase.from("suppliers").update({ balance: Number(supplier.balance||0) + remaining }).eq("id", supplierId);

    // تحديث الخزنة تلقائياً لو الدفع نقدي
    if (form.payment_type === "نقدي" || Number(form.paid) > 0) {
      const amountPaid = form.payment_type === "نقدي" ? netTotal : Number(form.paid);
      const { data: treasData } = await supabase.from("treasury").select("*").eq("branch_id", user?.branchId || 1).single();
      if (treasData) {
        await supabase.from("treasury").update({ balance: Number(treasData.balance) - amountPaid }).eq("id", treasData.id);
        await supabase.from("treasury_transactions").insert({
          treasury_id: treasData.id,
          type: "صرف",
          amount: amountPaid,
          description: `مشتريات - فاتورة ${form.invoice_number}`,
          reference_type: "مشتريات",
          branch_id: user?.branchId || 1,
        });
      }
    }

    // إضافة للمخزون
    for (const item of items) {
      const prod = products.find(p=>p.id===item.product_id);
      if (prod) await supabase.from("products").update({ stock: Number(prod.stock) + Number(item.quantity) }).eq("id", item.product_id);
    }

    setSaving(false);
    setShowForm(false); setForm(emptyForm); setItems([{ product_id:"", quantity:"", unit_price:"" }]); load();
  };

  const totalPurchases = purchases.reduce((s,p)=>s+Number(p.total||0),0);
  const totalPaid = purchases.reduce((s,p)=>s+Number(p.paid||0),0);

  if (active) {
    const inv = purchases.find(p=>p.id===active);
    if (!inv) return null;
    return (
      <div className="space-y-4">
        <button onClick={()=>setActive(null)} className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-800">← العودة للمشتريات</button>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-black text-xl text-slate-800">{inv.invoice_number}</h2>
                <Badge color={inv.status==="مكتمل"?"green":inv.status==="جزئي"?"yellow":"red"}>{inv.status}</Badge>
              </div>
              <p className="text-slate-500 text-sm">{inv.suppliers?.name} · {inv.created_at?.split("T")[0]}</p>
            </div>
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="bg-slate-50">{["الصنف","الكمية","سعر الوحدة","الإجمالي"].map(h=><th key={h} className="text-right py-2 px-3 text-slate-600 font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {(inv.purchase_items||[]).map((item,i)=>(
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-semibold text-slate-800">{item.products?.name||"—"}</td>
                  <td className="py-2 px-3 text-slate-600">{item.quantity} {item.products?.unit||""}</td>
                  <td className="py-2 px-3 text-slate-600">{Number(item.unit_price).toLocaleString()} ج</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{Number(item.total).toLocaleString()} ج</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="space-y-2 text-sm w-64">
              {[["الإجمالي",Number(inv.total),"slate"],["المدفوع",Number(inv.paid),"green"],["المتبقي",Number(inv.total)-Number(inv.paid),"red"]].map(([k,v,col])=>(
                <div key={k} className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-slate-500">{k}</span>
                  <span className={`font-bold ${col==="green"?"text-green-700":col==="red"?"text-red-700":"text-slate-800"}`}>{v.toLocaleString()} ج</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">المشتريات</h1>
        <button onClick={()=>{setShowForm(!showForm);setErrorMsg("");}} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Icon name="plus" size={16} /> فاتورة شراء جديدة
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="إجمالي المشتريات" value={`${totalPurchases.toLocaleString()} ج`} icon="purchase" color="steel" />
        <StatCard label="إجمالي المدفوع" value={`${totalPaid.toLocaleString()} ج`} icon="money" color="green" />
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      {showForm && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">فاتورة شراء جديدة</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">رقم الفاتورة *</label>
              <input value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="PUR-001" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">المورد *</label>
              <div className="relative">
                <input
                  value={form.supplier_name}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, supplier_name: val, supplier_id: "" });
                    const matches = suppliers.filter(s => s.name.includes(val) && val.length > 0);
                    setSupplierSuggestions(matches);
                    setShowSuggestions(matches.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="اكتب اسم المورد (جديد أو موجود)..." />
                {showSuggestions && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {supplierSuggestions.map(s => (
                      <button key={s.id} onMouseDown={() => {
                        setForm({ ...form, supplier_id: s.id, supplier_name: s.name });
                        setShowSuggestions(false);
                      }} className="w-full text-right px-4 py-2.5 hover:bg-blue-50 text-sm font-semibold text-slate-800 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{Number(s.balance || 0) > 0 ? `مستحق: ${Number(s.balance).toLocaleString()} ج` : "لا يوجد مستحق"}</span>
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.supplier_id && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-green-500 text-xs">✓</span>
                    <span className="text-xs text-green-600 font-semibold">مورد موجود — سيتم تحديث رصيده</span>
                  </div>
                )}
                {!form.supplier_id && form.supplier_name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-blue-500 text-xs">✦</span>
                    <span className="text-xs text-blue-600 font-semibold">مورد جديد — سيتم إضافته تلقائياً للموردين</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الدفع</label>
              <div className="flex gap-3">
                {[["نقدي","green","💵"],["آجل","blue","📋"],["شيك","gold","🏦"]].map(([type,color,icon])=>(
                  <button key={type} onClick={()=>setForm({...form,payment_type:type})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${form.payment_type===type
                      ? color==="green"?"bg-green-100 border-green-500 text-green-700"
                      : color==="blue"?"bg-blue-100 border-blue-500 text-blue-700"
                      :"bg-amber-100 border-amber-500 text-amber-700"
                      :"bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                    <span>{icon}</span> {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-700 text-sm">البنود</h4>
              <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"><Icon name="plus" size={14} /> إضافة بند</button>
            </div>
            <div className="space-y-2">
              {items.map((item,i)=>(
                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                  <div className="col-span-2">
                    <select value={item.product_id} onChange={e=>updateItem(i,"product_id",e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">-- اختر الصنف --</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <input type="number" value={item.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="الكمية" />
                  <div className="flex gap-1">
                    <input type="number" value={item.unit_price} onChange={e=>updateItem(i,"unit_price",e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="السعر" />
                    {items.length>1 && <button onClick={()=>removeItem(i)} className="text-red-500 hover:text-red-700 px-2">✕</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الخصم (ج)</label>
                <input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">المدفوع (ج)</label>
                <input type="number" value={form.paid} onChange={e=>setForm({...form,paid:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex flex-col justify-end">
                <div className="bg-white border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">الإجمالي</p>
                  <p className="font-black text-blue-700 text-lg">{netTotal.toLocaleString()} ج</p>
                  <p className="text-xs text-slate-500 mt-1">متبقي: <span className={`font-bold ${remaining>0?"text-red-600":"text-green-600"}`}>{remaining.toLocaleString()} ج</span></p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":"حفظ الفاتورة"}</button>
            <button onClick={()=>{setShowForm(false);setErrorMsg("");}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري تحميل المشتريات...</div>
      : purchases.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">لا توجد فواتير مشتريات بعد.</div>
      : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {["رقم الفاتورة","التاريخ","المورد","نوع الدفع","الإجمالي","المدفوع","المتبقي","الحالة",""].map(h=>(
                    <th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map(p=>(
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-blue-50/50">
                    <td className="py-3 px-3 font-mono text-blue-700 font-bold text-xs">{p.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600">{p.created_at?.split("T")[0]}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.suppliers?.name||"—"}</td>
                    <td className="py-3 px-3">
                      <Badge color={p.payment_type==="نقدي"?"green":p.payment_type==="شيك"?"gold":"blue"}>
                        {p.payment_type==="نقدي"?"💵 نقدي":p.payment_type==="شيك"?"🏦 شيك":"📋 آجل"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{Number(p.total).toLocaleString()} ج</td>
                    <td className="py-3 px-3 text-green-600 font-semibold">{Number(p.paid).toLocaleString()} ج</td>
                    <td className="py-3 px-3 text-red-600 font-semibold">{(Number(p.total)-Number(p.paid)).toLocaleString()} ج</td>
                    <td className="py-3 px-3"><Badge color={p.status==="مكتمل"?"green":p.status==="جزئي"?"yellow":"red"}>{p.status}</Badge></td>
                    <td className="py-3 px-3"><button onClick={()=>setActive(p.id)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// HR - LIVE
function HRScreen() {
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advForm, setAdvForm] = useState({ employee_id: "", amount: "", reason: "" });
  const [payForm, setPayForm] = useState({ employee_id: "", month: "", basic_salary: "", bonus: "0", deductions: "0", advances: "0", notes: "" });

  const load = async () => {
    setLoading(true);
    const [empRes, advRes, payRes] = await Promise.all([
      supabase.from("employees").select("*, roles(name_ar), branches(name)").order("created_at"),
      supabase.from("advances").select("*, employees(full_name)").order("created_at", { ascending: false }),
      supabase.from("payroll").select("*, employees(full_name)").order("created_at", { ascending: false }),
    ]);
    setEmployees(empRes.data || []);
    setAdvances(advRes.data || []);
    setPayroll(payRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalSalaries = employees.reduce((s, e) => s + Number(e.salary || 0), 0);

  const saveAdvance = async () => {
    if (!advForm.employee_id || !advForm.amount) { setErrorMsg("الموظف والمبلغ مطلوبان"); return; }
    setSaving(true);
    const { error } = await supabase.from("advances").insert({ employee_id: advForm.employee_id, amount: Number(advForm.amount), reason: advForm.reason });
    setSaving(false);
    if (error) { setErrorMsg("خطأ أثناء الحفظ"); return; }
    setShowAdvForm(false); setAdvForm({ employee_id: "", amount: "", reason: "" }); load();
  };

  const savePayroll = async () => {
    if (!payForm.employee_id || !payForm.month) { setErrorMsg("الموظف والشهر مطلوبان"); return; }
    setSaving(true);
    const net = Number(payForm.basic_salary || 0) + Number(payForm.bonus || 0) - Number(payForm.deductions || 0) - Number(payForm.advances || 0);
    const { error } = await supabase.from("payroll").insert({ ...payForm, basic_salary: Number(payForm.basic_salary || 0), bonus: Number(payForm.bonus || 0), deductions: Number(payForm.deductions || 0), advances: Number(payForm.advances || 0), net_salary: net });
    setSaving(false);
    if (error) { setErrorMsg("خطأ أثناء الحفظ"); return; }
    setShowPayForm(false); setPayForm({ employee_id: "", month: "", basic_salary: "", bonus: "0", deductions: "0", advances: "0", notes: "" }); load();
  };

  const markAttendance = async (empId, status) => {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("attendance").upsert({ employee_id: empId, date: today, status }, { onConflict: "employee_id,date" });
    load();
  };

  const tabs = [
    { id: "employees", label: "الموظفون" },
    { id: "attendance", label: "الحضور" },
    { id: "advances", label: "السلف" },
    { id: "payroll", label: "الرواتب" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">الموارد البشرية</h1>
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      <div className="grid grid-cols-3 gap-4">
        {[["إجمالي الموظفين", employees.length, "blue"], ["إجمالي الرواتب", `${totalSalaries.toLocaleString()} ج`, "gold"], ["السلف المستحقة", `${advances.filter(a => a.status === "غير مسدد").reduce((s, a) => s + Number(a.amount || 0), 0).toLocaleString()} ج`, "red"]].map(([k, v, col]) => (
          <Card key={k} className={`p-4 border-r-4 ${col === "blue" ? "border-blue-500" : col === "gold" ? "border-amber-500" : "border-red-500"}`}>
            <p className="text-2xl font-black text-slate-800">{v}</p>
            <p className="text-sm text-slate-500">{k}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري التحميل...</div> : (
        <>
          {/* الموظفون */}
          {tab === "employees" && (
            <Card className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {["الكود", "الاسم", "الوظيفة", "الفرع", "الراتب الأساسي"].map(h => (
                        <th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(e => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono text-xs text-blue-700 font-bold">{e.employee_code}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{e.full_name}</td>
                        <td className="py-3 px-3"><Badge color="blue">{e.roles?.name_ar || "—"}</Badge></td>
                        <td className="py-3 px-3 text-slate-600">{e.branches?.name || "—"}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{Number(e.salary || 0).toLocaleString()} ج</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* الحضور */}
          {tab === "attendance" && (
            <Card className="p-4">
              <p className="text-sm text-slate-500 mb-4">تسجيل حضور وغياب اليوم: <strong>{new Date().toLocaleDateString("ar-EG")}</strong></p>
              <div className="space-y-2">
                {employees.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">{e.full_name[0]}</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{e.full_name}</p>
                        <p className="text-xs text-slate-500">{e.roles?.name_ar}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => markAttendance(e.id, "حاضر")} className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200">✓ حاضر</button>
                      <button onClick={() => markAttendance(e.id, "غائب")} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200">✕ غائب</button>
                      <button onClick={() => markAttendance(e.id, "إجازة")} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200">إجازة</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* السلف */}
          {tab === "advances" && (
            <div className="space-y-3">
              <button onClick={() => setShowAdvForm(!showAdvForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                <Icon name="plus" size={16} /> سلفة جديدة
              </button>
              {showAdvForm && (
                <Card className="p-4 border-2 border-blue-200 bg-blue-50/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">الموظف *</label>
                      <select value={advForm.employee_id} onChange={e => setAdvForm({ ...advForm, employee_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- اختر الموظف --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">المبلغ *</label>
                      <input type="number" value={advForm.amount} onChange={e => setAdvForm({ ...advForm, amount: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">السبب</label>
                      <input value={advForm.reason} onChange={e => setAdvForm({ ...advForm, reason: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="سبب السلفة..." />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveAdvance} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving ? "جاري الحفظ..." : "حفظ السلفة"}</button>
                    <button onClick={() => setShowAdvForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
                  </div>
                </Card>
              )}
              <Card className="p-4">
                {advances.length === 0 ? <p className="text-center py-6 text-slate-400 text-sm">لا توجد سلف مسجلة</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50">{["الموظف", "المبلغ", "السبب", "التاريخ", "الحالة"].map(h => <th key={h} className="text-right py-2 px-3 text-slate-600 font-bold">{h}</th>)}</tr></thead>
                    <tbody>
                      {advances.map(a => (
                        <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{a.employees?.full_name || "—"}</td>
                          <td className="py-2 px-3 font-bold text-red-600">{Number(a.amount).toLocaleString()} ج</td>
                          <td className="py-2 px-3 text-slate-600">{a.reason || "—"}</td>
                          <td className="py-2 px-3 text-slate-500">{a.created_at?.split("T")[0]}</td>
                          <td className="py-2 px-3"><Badge color={a.status === "مسدد" ? "green" : "red"}>{a.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          )}

          {/* الرواتب */}
          {tab === "payroll" && (
            <div className="space-y-3">
              <button onClick={() => setShowPayForm(!showPayForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                <Icon name="plus" size={16} /> صرف راتب
              </button>
              {showPayForm && (
                <Card className="p-4 border-2 border-blue-200 bg-blue-50/30">
                  <h3 className="font-bold text-slate-800 mb-4">صرف راتب موظف</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">الموظف *</label>
                      <select value={payForm.employee_id} onChange={e => {
                        const emp = employees.find(em => em.id === e.target.value);
                        setPayForm({ ...payForm, employee_id: e.target.value, basic_salary: emp?.salary || "" });
                      }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- اختر الموظف --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">الشهر *</label>
                      <input type="month" value={payForm.month} onChange={e => setPayForm({ ...payForm, month: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    {[["الراتب الأساسي", "basic_salary"], ["المكافآت", "bonus"], ["الخصومات", "deductions"], ["استقطاع السلف", "advances"]].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                        <input type="number" value={payForm[key]} onChange={e => setPayForm({ ...payForm, [key]: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                    ))}
                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-500 mb-1">صافي الراتب</p>
                      <p className="font-black text-2xl text-blue-700">
                        {(Number(payForm.basic_salary || 0) + Number(payForm.bonus || 0) - Number(payForm.deductions || 0) - Number(payForm.advances || 0)).toLocaleString()} ج
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={savePayroll} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving ? "جاري الحفظ..." : "صرف الراتب"}</button>
                    <button onClick={() => setShowPayForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
                  </div>
                </Card>
              )}
              <Card className="p-4">
                {payroll.length === 0 ? <p className="text-center py-6 text-slate-400 text-sm">لا توجد رواتب مسجلة</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50">{["الموظف", "الشهر", "الأساسي", "المكافآت", "الخصومات", "الصافي", "الحالة"].map(h => <th key={h} className="text-right py-2 px-3 text-slate-600 font-bold">{h}</th>)}</tr></thead>
                    <tbody>
                      {payroll.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{p.employees?.full_name || "—"}</td>
                          <td className="py-2 px-3 text-slate-600">{p.month}</td>
                          <td className="py-2 px-3 text-slate-700">{Number(p.basic_salary).toLocaleString()} ج</td>
                          <td className="py-2 px-3 text-green-600">{Number(p.bonus).toLocaleString()} ج</td>
                          <td className="py-2 px-3 text-red-600">{Number(p.deductions).toLocaleString()} ج</td>
                          <td className="py-2 px-3 font-black text-blue-700">{Number(p.net_salary).toLocaleString()} ج</td>
                          <td className="py-2 px-3"><Badge color={p.status === "مدفوع" ? "green" : "yellow"}>{p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// BANKS - LIVE
// BANKS & ACCOUNTS & TRANSFERS
function AccountsScreen({ user }) {
  const [tab, setTab] = useState("payments");
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stockTransfers, setStockTransfers] = useState([]);
  const [moneyTransfers, setMoneyTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [showStockTransfer, setShowStockTransfer] = useState(false);
  const [showMoneyTransfer, setShowMoneyTransfer] = useState(false);

  const isAdmin = user?.roleKey === "admin";
  const isMainBranch = user?.branchId === 1;

  const emptyPayment = { type: "customer", customer_id: "", supplier_id: "", customer_name: "", supplier_name: "", amount: "", payment_method: "نقدي", notes: "" };
  const [payForm, setPayForm] = useState(emptyPayment);
  const [bankForm, setBankForm] = useState({ name: "", account_number: "", balance: "" });
  const [txForm, setTxForm] = useState({ bank_id: "", type: "إيداع", amount: "", description: "", reference: "" });
  const [stForm, setStForm] = useState({ to_branch_id: "", product_id: "", quantity: "", notes: "" });
  const [mtForm, setMtForm] = useState({ to_branch_id: "", amount: "", notes: "" });
  const [custSug, setCustSug] = useState([]);
  const [suppSug, setSuppSug] = useState([]);

  const showMsg = (msg, isError = false) => {
    if (isError) setErrorMsg(msg); else setSuccessMsg(msg);
    setTimeout(() => { setErrorMsg(""); setSuccessMsg(""); }, 3000);
  };

  const load = async () => {
    setLoading(true);
    const [banksRes, txRes, custRes, suppRes, branchRes, prodRes, payRes, stRes, mtRes] = await Promise.all([
      supabase.from("banks").select("*").order("created_at"),
      supabase.from("bank_transactions").select("*, banks(name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("customers").select("id, name, balance"),
      supabase.from("suppliers").select("id, name, balance"),
      supabase.from("branches").select("*").order("id"),
      supabase.from("products").select("id, name, unit, stock"),
      supabase.from("payments").select("*, customers(name), suppliers(name)").order("created_at", { ascending: false }),
      supabase.from("stock_transfers").select("*, products(name,unit), branches!stock_transfers_from_branch_id_fkey(name), branches!stock_transfers_to_branch_id_fkey(name)").order("created_at", { ascending: false }),
      supabase.from("money_transfers").select("*, branches!money_transfers_from_branch_id_fkey(name), branches!money_transfers_to_branch_id_fkey(name)").order("created_at", { ascending: false }),
    ]);
    setBanks(banksRes.data || []);
    setTransactions(txRes.data || []);
    setCustomers(custRes.data || []);
    setSuppliers(suppRes.data || []);
    setBranches(branchRes.data || []);
    setProducts(prodRes.data || []);
    setPayments(payRes.data || []);
    setStockTransfers(stRes.data || []);
    setMoneyTransfers(mtRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalBalance = banks.reduce((s, b) => s + Number(b.balance || 0), 0);
  const pendingStock = stockTransfers.filter(t => t.status === "بانتظار الموافقة");
  const pendingMoney = moneyTransfers.filter(t => t.status === "بانتظار الموافقة");
  const pendingCount = pendingStock.length + pendingMoney.length;

  // سداد عميل/مورد
  const handlePayment = async () => {
    const amount = Number(payForm.amount);
    if (!amount) { showMsg("المبلغ مطلوب", true); return; }
    setSaving(true);

    let custId = payForm.customer_id;
    let suppId = payForm.supplier_id;

    if (payForm.type === "customer") {
      if (!custId && payForm.customer_name) {
        const { data: c } = await supabase.from("customers").insert({ customer_code: "C-" + Date.now().toString().slice(-6), name: payForm.customer_name, balance: 0, branch_id: user?.branchId || 1 }).select().single();
        custId = c?.id;
      }
      if (!custId) { showMsg("اسم العميل مطلوب", true); setSaving(false); return; }
      const cust = customers.find(c => c.id === custId);
      const newBal = Number(cust?.balance || 0) - amount;
      await supabase.from("customers").update({ balance: newBal }).eq("id", custId);
    } else {
      if (!suppId && payForm.supplier_name) {
        const { data: s } = await supabase.from("suppliers").insert({ supplier_code: "S-" + Date.now().toString().slice(-6), name: payForm.supplier_name, balance: 0, branch_id: user?.branchId || 1 }).select().single();
        suppId = s?.id;
      }
      if (!suppId) { showMsg("اسم المورد مطلوب", true); setSaving(false); return; }
      const supp = suppliers.find(s => s.id === suppId);
      const newBal = Number(supp?.balance || 0) - amount;
      await supabase.from("suppliers").update({ balance: newBal }).eq("id", suppId);
    }

    // خصم من الخزنة لو نقدي
    if (payForm.payment_method === "نقدي") {
      const { data: treas } = await supabase.from("treasury").select("*").eq("branch_id", user?.branchId || 1).single();
      if (treas) {
        await supabase.from("treasury").update({ balance: Number(treas.balance) + (payForm.type === "customer" ? amount : -amount) }).eq("id", treas.id);
        await supabase.from("treasury_transactions").insert({ treasury_id: treas.id, type: payForm.type === "customer" ? "قبض" : "صرف", amount, description: payForm.type === "customer" ? `سداد عميل - ${payForm.customer_name}` : `سداد مورد - ${payForm.supplier_name}`, reference_type: payForm.type === "customer" ? "سداد عميل" : "سداد مورد", branch_id: user?.branchId || 1 });
      }
    }

    await supabase.from("payments").insert({ type: payForm.type, customer_id: custId || null, supplier_id: suppId || null, amount, payment_method: payForm.payment_method, notes: payForm.notes, branch_id: user?.branchId || 1 });
    setSaving(false); setShowForm(false); setPayForm(emptyPayment); load();
    showMsg(`✅ تم تسجيل السداد وخصم ${amount.toLocaleString()} ج من الرصيد تلقائياً`);
  };

  // تحويل بضاعة
  const handleStockTransfer = async () => {
    if (!stForm.to_branch_id || !stForm.product_id || !stForm.quantity) { showMsg("كل الحقول مطلوبة", true); return; }
    const prod = products.find(p => p.id === stForm.product_id);
    if (Number(stForm.quantity) > Number(prod?.stock || 0)) { showMsg("الكمية المطلوبة أكبر من المخزون المتاح", true); return; }
    setSaving(true);
    await supabase.from("stock_transfers").insert({ from_branch_id: user?.branchId || 1, to_branch_id: Number(stForm.to_branch_id), product_id: stForm.product_id, quantity: Number(stForm.quantity), notes: stForm.notes, status: "بانتظار الموافقة" });
    setSaving(false); setShowStockTransfer(false); setStForm({ to_branch_id: "", product_id: "", quantity: "", notes: "" });
    load(); showMsg("✅ تم إرسال طلب تحويل البضاعة — بانتظار موافقة المدير");
  };

  // تحويل أموال
  const handleMoneyTransfer = async () => {
    if (!mtForm.to_branch_id || !mtForm.amount) { showMsg("الفرع المستلم والمبلغ مطلوبان", true); return; }
    setSaving(true);
    await supabase.from("money_transfers").insert({ from_branch_id: user?.branchId || 1, to_branch_id: Number(mtForm.to_branch_id), amount: Number(mtForm.amount), notes: mtForm.notes, status: "بانتظار الموافقة" });
    setSaving(false); setShowMoneyTransfer(false); setMtForm({ to_branch_id: "", amount: "", notes: "" });
    load(); showMsg("✅ تم إرسال طلب تحويل الأموال — بانتظار موافقة المدير");
  };

  // موافقة تحويل بضاعة
  const approveStock = async (tr) => {
    setSaving(true);
    const prod = products.find(p => p.id === tr.product_id);
    if (!prod || Number(tr.quantity) > Number(prod.stock)) { showMsg("المخزون غير كافٍ", true); setSaving(false); return; }
    await supabase.from("products").update({ stock: Number(prod.stock) - Number(tr.quantity) }).eq("id", tr.product_id);
    await supabase.from("stock_transfers").update({ status: "معتمد", approved_at: new Date().toISOString() }).eq("id", tr.id);
    setSaving(false); load(); showMsg("✅ تم اعتماد تحويل البضاعة وخصمها من المخزون");
  };

  // موافقة تحويل أموال
  const approveMoney = async (tr) => {
    setSaving(true);
    const { data: fromTreas } = await supabase.from("treasury").select("*").eq("branch_id", tr.from_branch_id).single();
    const { data: toTreas } = await supabase.from("treasury").select("*").eq("branch_id", tr.to_branch_id).single();
    if (!fromTreas || Number(fromTreas.balance) < Number(tr.amount)) { showMsg("رصيد الخزنة غير كافٍ", true); setSaving(false); return; }
    await supabase.from("treasury").update({ balance: Number(fromTreas.balance) - Number(tr.amount) }).eq("id", fromTreas.id);
    if (toTreas) await supabase.from("treasury").update({ balance: Number(toTreas.balance) + Number(tr.amount) }).eq("id", toTreas.id);
    await supabase.from("money_transfers").update({ status: "معتمد", approved_at: new Date().toISOString() }).eq("id", tr.id);
    setSaving(false); load(); showMsg("✅ تم اعتماد تحويل الأموال وتحديث خزائن الفروع");
  };

  const rejectTransfer = async (table, id) => {
    await supabase.from(table).update({ status: "مرفوض" }).eq("id", id);
    load(); showMsg("تم رفض الطلب");
  };

  const bankTx = transactions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-800">الحسابات والتحويلات</h1>
          {isAdmin && pendingCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">{pendingCount} طلب معلق</span>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700">
            <Icon name="money" size={14} /> سداد
          </button>
          {(isAdmin || isMainBranch) && (
            <>
              <button onClick={() => setShowStockTransfer(!showStockTransfer)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700">
                <Icon name="transfer" size={14} /> تحويل بضاعة
              </button>
              <button onClick={() => setShowMoneyTransfer(!showMoneyTransfer)} className="flex items-center gap-1 bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600">
                <Icon name="transfer" size={14} /> تحويل أموال
              </button>
            </>
          )}
          <button onClick={() => setShowBankForm(!showBankForm)} className="flex items-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-700">
            <Icon name="plus" size={14} /> بنك جديد
          </button>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">{successMsg}</div>}

      {/* إجمالي البنوك */}
      <div className="bg-gradient-to-l from-blue-700 to-blue-900 text-white rounded-2xl p-5 shadow-lg">
        <p className="text-blue-200 text-sm mb-1">إجمالي أرصدة البنوك</p>
        <p className="text-4xl font-black">{totalBalance.toLocaleString()} ج</p>
        <p className="text-blue-200 text-xs mt-1">{banks.length} حساب بنكي</p>
      </div>

      {/* ─── فورم السداد ─── */}
      {showForm && (
        <Card className="p-5 border-2 border-green-200 bg-green-50/30">
          <h3 className="font-bold text-slate-800 mb-4">تسجيل سداد</h3>
          <div className="flex gap-3 mb-4">
            {[["customer","سداد من عميل","green"],["supplier","سداد لمورد","red"]].map(([type,label,color])=>(
              <button key={type} onClick={()=>setPayForm({...payForm,type,customer_id:"",supplier_id:"",customer_name:"",supplier_name:""})}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${payForm.type===type
                  ? color==="green"?"bg-green-100 border-green-500 text-green-700":"bg-red-100 border-red-500 text-red-700"
                  :"bg-gray-50 border-gray-200 text-gray-500"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 relative">
              <label className="block text-sm font-semibold text-slate-700 mb-1">{payForm.type==="customer"?"العميل *":"المورد *"}</label>
              <input
                value={payForm.type==="customer"?payForm.customer_name:payForm.supplier_name}
                onChange={e=>{
                  const val=e.target.value;
                  if(payForm.type==="customer"){
                    setPayForm({...payForm,customer_name:val,customer_id:""});
                    setCustSug(customers.filter(c=>c.name.includes(val)&&val.length>0));
                  } else {
                    setPayForm({...payForm,supplier_name:val,supplier_id:""});
                    setSuppSug(suppliers.filter(s=>s.name.includes(val)&&val.length>0));
                  }
                }}
                onBlur={()=>setTimeout(()=>{setCustSug([]);setSuppSug([]);},200)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={payForm.type==="customer"?"اكتب اسم العميل...":"اكتب اسم المورد..."} />
              {(payForm.type==="customer"?custSug:suppSug).length>0&&(
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {(payForm.type==="customer"?custSug:suppSug).map(item=>(
                    <button key={item.id} onMouseDown={()=>{
                      if(payForm.type==="customer") setPayForm({...payForm,customer_id:item.id,customer_name:item.name});
                      else setPayForm({...payForm,supplier_id:item.id,supplier_name:item.name});
                      setCustSug([]); setSuppSug([]);
                    }} className="w-full text-right px-4 py-2.5 hover:bg-green-50 text-sm font-semibold text-slate-800 border-b border-gray-50 flex justify-between">
                      <span className={`text-xs font-bold ${Number(item.balance)>0?"text-red-500":"text-green-500"}`}>{Number(item.balance).toLocaleString()} ج</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">المبلغ *</label>
              <input type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">طريقة الدفع</label>
              <select value={payForm.payment_method} onChange={e=>setPayForm({...payForm,payment_method:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="نقدي">💵 نقدي (يخصم من الخزنة)</option>
                <option value="شيك">🏦 شيك</option>
                <option value="تحويل">📱 تحويل بنكي</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
              <input value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="رقم الشيك أو أي ملاحظات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handlePayment} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري التسجيل...":"تسجيل السداد"}</button>
            <button onClick={()=>setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* ─── فورم تحويل بضاعة ─── */}
      {showStockTransfer && (isAdmin || isMainBranch) && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-2">طلب تحويل بضاعة بين الفروع</h3>
          <p className="text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 mb-4 font-semibold">⚠️ لن يتم خصم البضاعة إلا بعد موافقة المدير المسؤول</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">الفرع المستلم *</label>
              <select value={stForm.to_branch_id} onChange={e=>setStForm({...stForm,to_branch_id:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">-- اختر الفرع --</option>
                {branches.filter(b=>b.id!==(user?.branchId||1)).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">الصنف *</label>
              <select value={stForm.product_id} onChange={e=>setStForm({...stForm,product_id:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">-- اختر الصنف --</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} (متاح: {p.stock} {p.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">الكمية *</label>
              <input type="number" value={stForm.quantity} onChange={e=>setStForm({...stForm,quantity:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
              <input value={stForm.notes} onChange={e=>setStForm({...stForm,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="سبب التحويل..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleStockTransfer} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الإرسال...":"إرسال طلب التحويل"}</button>
            <button onClick={()=>setShowStockTransfer(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* ─── فورم تحويل أموال ─── */}
      {showMoneyTransfer && (isAdmin || isMainBranch) && (
        <Card className="p-5 border-2 border-amber-200 bg-amber-50/30">
          <h3 className="font-bold text-slate-800 mb-2">طلب تحويل أموال بين الفروع</h3>
          <p className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 mb-4 font-semibold">⚠️ لن يتم خصم الأموال إلا بعد موافقة المدير</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">الفرع المستلم *</label>
              <select value={mtForm.to_branch_id} onChange={e=>setMtForm({...mtForm,to_branch_id:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">-- اختر الفرع --</option>
                {branches.filter(b=>b.id!==(user?.branchId||1)).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">المبلغ *</label>
              <input type="number" value={mtForm.amount} onChange={e=>setMtForm({...mtForm,amount:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
              <input value={mtForm.notes} onChange={e=>setMtForm({...mtForm,notes:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="سبب التحويل..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleMoneyTransfer} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الإرسال...":"إرسال طلب التحويل"}</button>
            <button onClick={()=>setShowMoneyTransfer(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* ─── طلبات معلقة للمدير ─── */}
      {isAdmin && pendingCount > 0 && (
        <Card className="p-4 border-2 border-red-200 bg-red-50/30">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-red-500"><Icon name="warning" size={18}/></span>
            طلبات تحويل بانتظار موافقتك
            <Badge color="red">{pendingCount}</Badge>
          </h3>
          <div className="space-y-3">
            {pendingStock.map(tr=>(
              <div key={tr.id} className="bg-white rounded-xl border border-blue-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2"><Badge color="blue">بضاعة</Badge><span className="font-bold text-slate-800">{tr.products?.name}</span></div>
                    <p className="text-xs text-slate-500 mt-1">الكمية: {tr.quantity} {tr.products?.unit} · من: {tr["branches"]?.name||"—"} → إلى: {tr.to_branch_id}</p>
                    {tr.notes&&<p className="text-xs text-slate-600 mt-1">"{tr.notes}"</p>}
                  </div>
                  <Badge color="yellow">بانتظار الموافقة</Badge>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>approveStock(tr)} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-60"><Icon name="check" size={14}/>موافقة</button>
                  <button onClick={()=>rejectTransfer("stock_transfers",tr.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-bold border border-red-200">رفض</button>
                </div>
              </div>
            ))}
            {pendingMoney.map(tr=>(
              <div key={tr.id} className="bg-white rounded-xl border border-amber-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2"><Badge color="gold">أموال</Badge><span className="font-black text-slate-800 text-lg">{Number(tr.amount).toLocaleString()} ج</span></div>
                    <p className="text-xs text-slate-500 mt-1">من: فرع {tr.from_branch_id} → إلى: فرع {tr.to_branch_id}</p>
                    {tr.notes&&<p className="text-xs text-slate-600 mt-1">"{tr.notes}"</p>}
                  </div>
                  <Badge color="yellow">بانتظار الموافقة</Badge>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>approveMoney(tr)} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-60"><Icon name="check" size={14}/>موافقة وتحويل</button>
                  <button onClick={()=>rejectTransfer("money_transfers",tr.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-bold border border-red-200">رفض</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* تبويبات */}
      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        {[["payments","سجل السداد"],["banks","البنوك"],["stock_transfers","تحويلات البضاعة"],["money_transfers","تحويلات الأموال"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${tab===id?"border-blue-600 text-blue-700":"border-transparent text-slate-500 hover:text-slate-800"}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري التحميل...</div> : (
        <>
          {/* سجل السداد */}
          {tab==="payments"&&(
            <Card className="p-4">
              {payments.length===0?<p className="text-center py-8 text-slate-400 text-sm">لا توجد عمليات سداد بعد</p>:(
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50">{["التاريخ","النوع","الطرف","المبلغ","طريقة الدفع","ملاحظات"].map(h=><th key={h} className="text-right py-3 px-3 text-slate-600 font-bold">{h}</th>)}</tr></thead>
                    <tbody>
                      {payments.map(p=>(
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-3 text-slate-500 text-xs">{p.created_at?.split("T")[0]}</td>
                          <td className="py-3 px-3"><Badge color={p.type==="customer"?"green":"red"}>{p.type==="customer"?"سداد عميل":"سداد مورد"}</Badge></td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{p.customers?.name||p.suppliers?.name||"—"}</td>
                          <td className="py-3 px-3 font-black text-green-700">{Number(p.amount).toLocaleString()} ج</td>
                          <td className="py-3 px-3"><Badge color={p.payment_method==="نقدي"?"green":p.payment_method==="شيك"?"gold":"blue"}>{p.payment_method}</Badge></td>
                          <td className="py-3 px-3 text-slate-500 text-xs">{p.notes||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* البنوك */}
          {tab==="banks"&&(
            <div className="space-y-4">
              {showBankForm&&(
                <Card className="p-4 border-2 border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-3">إضافة بنك جديد</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[["اسم البنك *","name","text","بنك مصر"],["رقم الحساب","account_number","text","0000000000"],["الرصيد الافتتاحي","balance","number","0"]].map(([label,key,type,ph])=>(
                      <div key={key}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
                        <input type={type} value={bankForm[key]} onChange={e=>setBankForm({...bankForm,[key]:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={ph} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={async()=>{if(!bankForm.name)return;setSaving(true);await supabase.from("banks").insert({name:bankForm.name,account_number:bankForm.account_number,balance:Number(bankForm.balance||0)});setSaving(false);setShowBankForm(false);setBankForm({name:"",account_number:"",balance:""});load();}} disabled={saving} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":"إضافة البنك"}</button>
                    <button onClick={()=>setShowBankForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
                  </div>
                </Card>
              )}
              {showTxForm&&(
                <Card className="p-4 border-2 border-blue-200 bg-blue-50/30">
                  <h3 className="font-bold text-slate-800 mb-3">تسجيل حركة بنكية</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">البنك *</label>
                      <select value={txForm.bank_id} onChange={e=>setTxForm({...txForm,bank_id:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- اختر البنك --</option>
                        {banks.map(b=><option key={b.id} value={b.id}>{b.name} — {Number(b.balance).toLocaleString()} ج</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">نوع الحركة</label>
                      <select value={txForm.type} onChange={e=>setTxForm({...txForm,type:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        {["إيداع","سحب","تحويل صادر","تحويل وارد"].map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">المبلغ *</label>
                      <input type="number" value={txForm.amount} onChange={e=>setTxForm({...txForm,amount:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">المرجع</label>
                      <input value={txForm.reference} onChange={e=>setTxForm({...txForm,reference:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="رقم الشيك..." />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">البيان</label>
                      <input value={txForm.description} onChange={e=>setTxForm({...txForm,description:e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="وصف الحركة..." />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={async()=>{if(!txForm.bank_id||!txForm.amount)return;setSaving(true);const bank=banks.find(b=>b.id===txForm.bank_id);const newBal=(txForm.type==="إيداع"||txForm.type==="تحويل وارد")?Number(bank.balance)+Number(txForm.amount):Number(bank.balance)-Number(txForm.amount);await supabase.from("bank_transactions").insert({bank_id:txForm.bank_id,type:txForm.type,amount:Number(txForm.amount),description:txForm.description,reference:txForm.reference});await supabase.from("banks").update({balance:newBal}).eq("id",txForm.bank_id);setSaving(false);setShowTxForm(false);setTxForm({bank_id:"",type:"إيداع",amount:"",description:"",reference:""});load();}} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving?"جاري الحفظ...":"حفظ الحركة"}</button>
                    <button onClick={()=>setShowTxForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
                  </div>
                </Card>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {banks.map(b=>(
                  <Card key={b.id} className="p-4 hover:shadow-md cursor-pointer" onClick={()=>setShowTxForm(true)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-black">{b.name[0]}</div>
                        <div><p className="font-black text-slate-800">{b.name}</p><p className="text-xs text-slate-500">{b.account_number||"بدون رقم حساب"}</p></div>
                      </div>
                      <p className={`font-black text-xl ${Number(b.balance)>=0?"text-green-700":"text-red-700"}`}>{Number(b.balance).toLocaleString()} ج</p>
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="p-4">
                <h3 className="font-bold text-slate-800 mb-3">آخر الحركات البنكية</h3>
                {bankTx.length===0?<p className="text-center py-6 text-slate-400 text-sm">لا توجد حركات</p>:(
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50">{["التاريخ","البنك","النوع","البيان","المبلغ"].map(h=><th key={h} className="text-right py-2 px-3 text-slate-600 font-bold">{h}</th>)}</tr></thead>
                      <tbody>
                        {bankTx.map(t=>(
                          <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3 text-slate-500 text-xs">{t.created_at?.split("T")[0]}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{t.banks?.name||"—"}</td>
                            <td className="py-2 px-3"><Badge color={t.type==="إيداع"||t.type==="تحويل وارد"?"green":"red"}>{t.type}</Badge></td>
                            <td className="py-2 px-3 text-slate-600">{t.description||"—"}</td>
                            <td className={`py-2 px-3 font-black ${t.type==="إيداع"||t.type==="تحويل وارد"?"text-green-700":"text-red-700"}`}>{t.type==="إيداع"||t.type==="تحويل وارد"?"+":"-"}{Number(t.amount).toLocaleString()} ج</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* تحويلات البضاعة */}
          {tab==="stock_transfers"&&(
            <Card className="p-4">
              {stockTransfers.length===0?<p className="text-center py-8 text-slate-400 text-sm">لا توجد تحويلات بضاعة</p>:(
                <div className="space-y-2">
                  {stockTransfers.map(tr=>(
                    <div key={tr.id} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${tr.status==="معتمد"?"bg-green-50 border-green-200":tr.status==="مرفوض"?"bg-red-50 border-red-200":"bg-amber-50 border-amber-200"}`}>
                      <div>
                        <p className="font-bold text-slate-800">{tr.products?.name} — {tr.quantity} {tr.products?.unit}</p>
                        <p className="text-xs text-slate-500">{tr.created_at?.split("T")[0]} · من فرع {tr.from_branch_id} → فرع {tr.to_branch_id}</p>
                        {tr.notes&&<p className="text-xs text-slate-600">"{tr.notes}"</p>}
                      </div>
                      <Badge color={tr.status==="معتمد"?"green":tr.status==="مرفوض"?"red":"yellow"}>{tr.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* تحويلات الأموال */}
          {tab==="money_transfers"&&(
            <Card className="p-4">
              {moneyTransfers.length===0?<p className="text-center py-8 text-slate-400 text-sm">لا توجد تحويلات أموال</p>:(
                <div className="space-y-2">
                  {moneyTransfers.map(tr=>(
                    <div key={tr.id} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${tr.status==="معتمد"?"bg-green-50 border-green-200":tr.status==="مرفوض"?"bg-red-50 border-red-200":"bg-amber-50 border-amber-200"}`}>
                      <div>
                        <p className="font-black text-slate-800 text-lg">{Number(tr.amount).toLocaleString()} ج</p>
                        <p className="text-xs text-slate-500">{tr.created_at?.split("T")[0]} · من فرع {tr.from_branch_id} → فرع {tr.to_branch_id}</p>
                        {tr.notes&&<p className="text-xs text-slate-600">"{tr.notes}"</p>}
                      </div>
                      <Badge color={tr.status==="معتمد"?"green":tr.status==="مرفوض"?"red":"yellow"}>{tr.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// BRANCHES
// BRANCHES
function BranchesScreen({ user }) {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ name: "", address: "" });
  const [editingId, setEditingId] = useState(null);

  const isAdmin = user?.roleKey === "admin";

  const load = async () => {
    setLoading(true);
    const [branchRes, salesRes, purchRes, empRes, prodRes, treasRes] = await Promise.all([
      supabase.from("branches").select("*").order("id"),
      supabase.from("sales").select("branch_id, total, paid"),
      supabase.from("purchases").select("branch_id, total"),
      supabase.from("employees").select("branch_id, is_active"),
      supabase.from("products").select("branch_id, stock, sell_price"),
      supabase.from("treasury").select("branch_id, balance"),
    ]);

    const branchStats = {};
    (branchRes.data || []).forEach(b => {
      const bSales = (salesRes.data || []).filter(s => s.branch_id === b.id);
      const bPurch = (purchRes.data || []).filter(p => p.branch_id === b.id);
      const bEmps = (empRes.data || []).filter(e => e.branch_id === b.id && e.is_active);
      const bTreas = (treasRes.data || []).find(t => t.branch_id === b.id);
      branchStats[b.id] = {
        totalSales: bSales.reduce((s, r) => s + Number(r.total || 0), 0),
        totalCollected: bSales.reduce((s, r) => s + Number(r.paid || 0), 0),
        totalPurchases: bPurch.reduce((s, r) => s + Number(r.total || 0), 0),
        employees: bEmps.length,
        treasury: Number(bTreas?.balance || 0),
        invoicesCount: bSales.length,
      };
    });

    setBranches(branchRes.data || []);
    setStats(branchStats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name) { setErrorMsg("اسم الفرع مطلوب"); return; }
    setSaving(true); setErrorMsg("");
    let error;
    if (editingId) {
      ({ error } = await supabase.from("branches").update({ name: form.name, address: form.address }).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("branches").insert({ name: form.name, address: form.address }));
      // إنشاء خزنة للفرع الجديد تلقائياً
      if (!error) {
        const { data: newBranch } = await supabase.from("branches").select("id").order("id", { ascending: false }).limit(1).single();
        if (newBranch) await supabase.from("treasury").insert({ branch_id: newBranch.id, balance: 0 });
      }
    }
    setSaving(false);
    if (error) { setErrorMsg("خطأ أثناء الحفظ"); return; }
    setShowForm(false); setForm({ name: "", address: "" }); setEditingId(null); load();
  };

  const totalSalesAll = Object.values(stats).reduce((s, b) => s + (b.totalSales || 0), 0);
  const totalPurchAll = Object.values(stats).reduce((s, b) => s + (b.totalPurchases || 0), 0);
  const totalTreasAll = Object.values(stats).reduce((s, b) => s + (b.treasury || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">إدارة الفروع</h1>
        {isAdmin && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", address: "" }); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Icon name="plus" size={16} /> فرع جديد
          </button>
        )}
      </div>

      {/* إحصائيات إجمالية */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="إجمالي مبيعات الفروع" value={`${totalSalesAll.toLocaleString()} ج`} icon="sales" color="blue" />
        <StatCard label="إجمالي مشتريات الفروع" value={`${totalPurchAll.toLocaleString()} ج`} icon="purchase" color="steel" />
        <StatCard label="إجمالي الخزائن" value={`${totalTreasAll.toLocaleString()} ج`} icon="money" color="green" />
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      {/* فورم فرع جديد */}
      {showForm && isAdmin && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">{editingId ? "تعديل بيانات الفرع" : "إضافة فرع جديد"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">اسم الفرع *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="مثال: الفرع الثالث" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">العنوان</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="المدينة - الحي" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3 font-semibold">✦ سيتم إنشاء خزنة للفرع الجديد تلقائياً</p>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">
              {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الفرع"}
            </button>
            <button onClick={() => { setShowForm(false); setErrorMsg(""); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* بطاقات الفروع */}
      {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري تحميل بيانات الفروع...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {branches.map((b, idx) => {
            const s = stats[b.id] || {};
            const profit = (s.totalSales || 0) - (s.totalPurchases || 0);
            const colors = ["from-blue-600 to-blue-800", "from-slate-600 to-slate-800", "from-emerald-600 to-emerald-800", "from-amber-600 to-amber-800"];
            const bgColor = colors[idx % colors.length];
            return (
              <Card key={b.id} className="overflow-hidden hover:shadow-lg transition-all">
                {/* Header */}
                <div className={`bg-gradient-to-l ${bgColor} text-white p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-xl p-2.5"><Icon name="branch" size={22} /></div>
                      <div>
                        <h3 className="font-black text-xl">{b.name}</h3>
                        <p className="text-white/70 text-xs">{b.address || "بدون عنوان"}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setForm({ name: b.name, address: b.address || "" }); setEditingId(b.id); setShowForm(true); }}
                        className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                        تعديل
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="text-center">
                      <p className="text-white/70 text-xs">الموظفون</p>
                      <p className="font-black text-2xl">{s.employees || 0}</p>
                    </div>
                    <div className="h-10 w-px bg-white/20"></div>
                    <div className="text-center">
                      <p className="text-white/70 text-xs">عدد الفواتير</p>
                      <p className="font-black text-2xl">{s.invoicesCount || 0}</p>
                    </div>
                    <div className="h-10 w-px bg-white/20"></div>
                    <div className="text-center">
                      <p className="text-white/70 text-xs">رصيد الخزنة</p>
                      <p className="font-black text-2xl">{Number(s.treasury || 0).toLocaleString()} ج</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 grid grid-cols-3 gap-3">
                  {[
                    ["إجمالي المبيعات", s.totalSales || 0, "text-blue-700", "bg-blue-50"],
                    ["إجمالي المشتريات", s.totalPurchases || 0, "text-slate-700", "bg-slate-50"],
                    ["صافي الربح", profit, profit >= 0 ? "text-green-700" : "text-red-700", profit >= 0 ? "bg-green-50" : "bg-red-50"],
                  ].map(([label, val, textCol, bgCol]) => (
                    <div key={label} className={`${bgCol} rounded-xl p-3 text-center`}>
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className={`font-black text-sm ${textCol}`}>{Number(val).toLocaleString()} ج</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar - نسبة المبيعات */}
                {totalSalesAll > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>نسبة المبيعات</span>
                      <span>{Math.round(((s.totalSales || 0) / totalSalesAll) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`bg-gradient-to-l ${bgColor} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.round(((s.totalSales || 0) / totalSalesAll) * 100)}%` }}></div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// TRANSACTIONS MANAGER - إدارة الحركات
function TransactionsScreen({ user }) {
  const isAdmin = user?.roleKey === "admin";
  const [activeTable, setActiveTable] = useState("sales");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showMsg = (msg, isError = false) => {
    if (isError) setErrorMsg(msg); else setSuccessMsg(msg);
    setTimeout(() => { setErrorMsg(""); setSuccessMsg(""); }, 3000);
  };

  const tables = [
    { id: "sales", label: "المبيعات", color: "blue" },
    { id: "purchases", label: "المشتريات", color: "steel" },
    { id: "payments", label: "السداد", color: "green" },
    { id: "treasury_transactions", label: "حركات الخزنة", color: "gold" },
    { id: "bank_transactions", label: "حركات البنوك", color: "blue" },
    { id: "stock_transfers", label: "تحويلات البضاعة", color: "blue" },
    { id: "money_transfers", label: "تحويلات الأموال", color: "gold" },
    { id: "advances", label: "السلف", color: "red" },
    { id: "payroll", label: "الرواتب", color: "green" },
  ];

  const load = async () => {
    setLoading(true);
    setData([]);
    let query;
    switch (activeTable) {
      case "sales": query = supabase.from("sales").select("*, customers(name)").order("created_at", { ascending: false }); break;
      case "purchases": query = supabase.from("purchases").select("*, suppliers(name)").order("created_at", { ascending: false }); break;
      case "payments": query = supabase.from("payments").select("*, customers(name), suppliers(name)").order("created_at", { ascending: false }); break;
      case "treasury_transactions": query = supabase.from("treasury_transactions").select("*, treasury(branches(name))").order("created_at", { ascending: false }); break;
      case "bank_transactions": query = supabase.from("bank_transactions").select("*, banks(name)").order("created_at", { ascending: false }); break;
      case "stock_transfers": query = supabase.from("stock_transfers").select("*, products(name,unit)").order("created_at", { ascending: false }); break;
      case "money_transfers": query = supabase.from("money_transfers").select("*").order("created_at", { ascending: false }); break;
      case "advances": query = supabase.from("advances").select("*, employees(full_name)").order("created_at", { ascending: false }); break;
      case "payroll": query = supabase.from("payroll").select("*, employees(full_name)").order("created_at", { ascending: false }); break;
      default: query = supabase.from(activeTable).select("*").order("created_at", { ascending: false });
    }
    const { data: rows, error } = await query.limit(100);
    if (error) showMsg("خطأ أثناء تحميل البيانات", true);
    else setData(rows || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeTable]);

  const handleDelete = async (id) => {
    setSaving(true);
    const { error } = await supabase.from(activeTable).delete().eq("id", id);
    setSaving(false);
    if (error) { showMsg("تعذر الحذف — قد يكون مرتبطاً ببيانات أخرى", true); }
    else { showMsg("تم الحذف بنجاح"); setConfirmDelete(null); load(); }
  };

  const handleEdit = async () => {
    if (!editingRow) return;
    setSaving(true);
    const { error } = await supabase.from(activeTable).update(editForm).eq("id", editingRow);
    setSaving(false);
    if (error) showMsg("خطأ أثناء التعديل", true);
    else { showMsg("تم التعديل بنجاح"); setEditingRow(null); setEditForm({}); load(); }
  };

  const getColumns = (row) => {
    const exclude = ["id", "created_at", "updated_at", "auth_user_id", "treasury_id", "bank_id", "customer_id", "supplier_id", "employee_id", "branch_id", "product_id", "from_branch_id", "to_branch_id", "requested_by", "approved_by", "approved_at", "created_by"];
    return Object.keys(row).filter(k => !exclude.includes(k) && !k.endsWith("_id") && typeof row[k] !== "object");
  };

  const formatValue = (key, val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "نعم" : "لا";
    if (["amount", "total", "paid", "discount", "balance", "salary", "net_salary", "basic_salary", "bonus", "deductions", "advances"].includes(key)) return `${Number(val).toLocaleString()} ج`;
    if (key === "created_at" || key === "approved_at") return val?.split("T")[0] || "—";
    return String(val);
  };

  const getLabel = (row) => {
    if (row.customers?.name) return row.customers.name;
    if (row.suppliers?.name) return row.suppliers.name;
    if (row.employees?.full_name) return row.employees.full_name;
    if (row.banks?.name) return row.banks.name;
    if (row.products?.name) return row.products.name;
    if (row.treasury?.branches?.name) return row.treasury.branches.name;
    return null;
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-slate-800">إدارة الحركات</h1>
        <Card className="p-8 text-center">
          <div className="text-slate-300 flex justify-center mb-4"><Icon name="permissions" size={48} /></div>
          <p className="text-slate-600 font-bold">هذه الشاشة متاحة لمدير النظام فقط</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">إدارة الحركات</h1>
        <div className="flex items-center gap-2">
          <Badge color="red">مدير النظام فقط</Badge>
          <button onClick={load} className="text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">↻ تحديث</button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-amber-700 text-sm font-semibold">⚠️ تحذير: أي حذف أو تعديل هنا مباشر على قاعدة البيانات ولا يمكن التراجع عنه. تأكد جيداً قبل الحذف.</p>
      </div>

      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold">{successMsg}</div>}

      {/* اختيار الجدول */}
      <div className="flex flex-wrap gap-2">
        {tables.map(t => (
          <button key={t.id} onClick={() => { setActiveTable(t.id); setEditingRow(null); setConfirmDelete(null); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${activeTable === t.id
              ? "bg-slate-700 text-white border-slate-700"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* فورم التعديل */}
      {editingRow && (
        <Card className="p-5 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-slate-800 mb-4">تعديل السجل</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(editForm).map(key => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{key}</label>
                <input value={editForm[key] ?? ""} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleEdit} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</button>
            <button onClick={() => { setEditingRow(null); setEditForm({}); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* تأكيد الحذف */}
      {confirmDelete && (
        <Card className="p-5 border-2 border-red-300 bg-red-50">
          <h3 className="font-bold text-red-700 mb-2">⚠️ تأكيد الحذف</h3>
          <p className="text-slate-600 text-sm mb-4">هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذه العملية.</p>
          <div className="flex gap-2">
            <button onClick={() => handleDelete(confirmDelete)} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving ? "جاري الحذف..." : "نعم، احذف"}</button>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">إلغاء</button>
          </div>
        </Card>
      )}

      {/* الجدول */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">{tables.find(t => t.id === activeTable)?.label} <span className="text-slate-400 text-sm font-normal">({data.length} سجل)</span></h3>
        </div>

        {loading ? <div className="text-center py-10 text-slate-400 text-sm">جاري التحميل...</div>
          : data.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">لا توجد بيانات</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-right py-3 px-3 text-slate-600 font-bold">التاريخ</th>
                    <th className="text-right py-3 px-3 text-slate-600 font-bold">الطرف</th>
                    {data[0] && getColumns(data[0]).slice(0, 5).map(col => (
                      <th key={col} className="text-right py-3 px-3 text-slate-600 font-bold">{col}</th>
                    ))}
                    <th className="text-right py-3 px-3 text-slate-600 font-bold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50 ${confirmDelete === row.id ? "bg-red-50" : ""}`}>
                      <td className="py-3 px-3 text-slate-500 text-xs">{row.created_at?.split("T")[0]}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 text-xs">{getLabel(row) || "—"}</td>
                      {getColumns(row).slice(0, 5).map(col => (
                        <td key={col} className="py-3 px-3 text-slate-700 text-xs">{formatValue(col, row[col])}</td>
                      ))}
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setEditingRow(row.id);
                            const editable = {};
                            getColumns(row).forEach(k => { editable[k] = row[k]; });
                            setEditForm(editable);
                            setConfirmDelete(null);
                          }} className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">تعديل</button>
                          <button onClick={() => { setConfirmDelete(row.id); setEditingRow(null); }}
                            className="text-xs text-red-600 hover:text-red-800 font-bold bg-red-50 px-2 py-1 rounded border border-red-200">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "الرئيسية", icon: "dashboard" },
  { id: "branches", label: "الفروع", icon: "branch" },
  { id: "products", label: "الأصناف والمخازن", icon: "products" },
  { id: "treasury", label: "الخزنة", icon: "money" },
  { id: "suppliers", label: "الموردون", icon: "suppliers" },
  { id: "customers", label: "العملاء", icon: "customers" },
  { id: "sales", label: "المبيعات", icon: "sales" },
  { id: "purchases", label: "المشتريات", icon: "purchase" },
  { id: "accounts", label: "الحسابات", icon: "accounts" },
  { id: "hr", label: "الموارد البشرية", icon: "hr" },
  { id: "reports", label: "التقارير", icon: "reports" },
  { id: "transactions", label: "إدارة الحركات", icon: "accounts" },
  { id: "permissions", label: "الصلاحيات", icon: "permissions" },
  { id: "backup", label: "النسخ الاحتياطي", icon: "backup" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const renderScreen = () => {
    switch (active) {
      case "dashboard": return <Dashboard user={user} />;
      case "branches": return <BranchesScreen user={user} />;
      case "products": return <ProductsScreen user={user} />;
      case "customers": return <CustomersScreen />;
      case "suppliers": return <SuppliersScreen />;
      case "sales": return <SalesScreen user={user} />;
      case "purchases": return <PurchasesScreen user={user} />;
      case "treasury": return <TreasuryScreen user={user} />;
      case "hr": return <HRScreen />;
      case "accounts": return <AccountsScreen user={user} />;
      case "reports": return <ReportsScreen user={user} />;
      case "transactions": return <TransactionsScreen user={user} />;
      case "permissions": return <PermissionsScreen user={user} />;
      case "backup": return <BackupScreen />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-slate-300 mb-4 flex justify-center"><Icon name={NAV_ITEMS.find(n => n.id === active)?.icon || "dashboard"} size={48} /></div>
              <h2 className="text-xl font-bold text-slate-600">{NAV_ITEMS.find(n => n.id === active)?.label}</h2>
              <p className="text-slate-400 text-sm mt-2">هذه الشاشة قيد التطوير</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans" dir="rtl" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-slate-900 font-black text-sm">A</span>
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-black text-sm">AYSC</div>
              <div className="text-slate-400 text-xs">تجارة الحديد</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all ${active === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
              <span className="flex-shrink-0"><Icon name={item.icon} size={17} /></span>
              {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.name[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-bold truncate">{user.name}</div>
                <div className="text-slate-400 text-xs truncate">{user.role}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="mt-2 w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs py-1 px-2 rounded-lg hover:bg-slate-700 transition-all">
              <Icon name="logout" size={14} /> تسجيل الخروج
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-gray-100">
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <span className="font-black text-slate-800">{NAV_ITEMS.find(n => n.id === active)?.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-amber-700">الحديد 14,850 ج/طن</span>
            </div>
            <button className="relative text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-gray-100">
              <Icon name="bell" size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {user.name[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{user.role}</p>
                <p className="text-xs text-slate-500">{user.branch}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
