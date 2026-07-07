import { useState, useEffect, useCallback } from "react";

// ===== FIREBASE CONFIG =====
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAml7sIXa1p7orxYMWuBswLBs1VLsx_6js",
  authDomain: "ys-cheques.firebaseapp.com",
  projectId: "ys-cheques",
  storageBucket: "ys-cheques.firebasestorage.app",
  messagingSenderId: "491144612800",
  appId: "1:491144612800:web:622797aea7987d044ed625",
};

// ===== FIREBASE REST API HELPERS =====
// We use Firebase REST API (no npm needed in artifacts)
const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Convert Firestore document to plain object
const fromDoc = (doc) => {
  if (!doc || !doc.fields) return null;
  const obj = { id: doc.name.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.integerValue !== undefined) obj[k] = Number(v.integerValue);
    else if (v.doubleValue !== undefined) obj[k] = Number(v.doubleValue);
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.arrayValue !== undefined) obj[k] = (v.arrayValue.values || []).map(item => {
      if (item.mapValue) return fromFields(item.mapValue.fields || {});
      if (item.stringValue !== undefined) return item.stringValue;
      if (item.integerValue !== undefined) return Number(item.integerValue);
      if (item.doubleValue !== undefined) return Number(item.doubleValue);
      return null;
    });
    else if (v.mapValue !== undefined) obj[k] = fromFields(v.mapValue.fields || {});
    else if (v.timestampValue !== undefined) obj[k] = v.timestampValue;
    else obj[k] = null;
  }
  return obj;
};

const fromFields = (fields) => {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.integerValue !== undefined) obj[k] = Number(v.integerValue);
    else if (v.doubleValue !== undefined) obj[k] = Number(v.doubleValue);
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else obj[k] = null;
  }
  return obj;
};

// Convert plain object to Firestore fields
const toFields = (obj) => {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id") continue;
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number") {
      if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
      else fields[k] = { doubleValue: v };
    } else if (typeof v === "string") fields[k] = { stringValue: v };
    else if (Array.isArray(v)) {
      fields[k] = {
        arrayValue: {
          values: v.map(item => {
            if (typeof item === "object" && item !== null) {
              return { mapValue: { fields: toFields(item) } };
            }
            if (typeof item === "number") return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof v === "object") {
      fields[k] = { mapValue: { fields: toFields(v) } };
    }
  }
  return fields;
};

const db = {
  async getAll(col) {
    const r = await fetch(`${BASE}/${col}?pageSize=500`);
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error?.message || "خطأ في الاتصال");
    }
    const data = await r.json();
    if (!data.documents) return [];
    return data.documents.map(fromDoc);
  },

  async add(col, obj) {
    const r = await fetch(`${BASE}/${col}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: toFields(obj) }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "خطأ"); }
    const doc = await r.json();
    return fromDoc(doc);
  },

  async set(col, id, obj) {
    const fields = toFields(obj);
    const mask = Object.keys(fields).join(",");
    const r = await fetch(`${BASE}/${col}/${id}?updateMask.fieldPaths=${encodeURIComponent(mask)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "خطأ"); }
    return fromDoc(await r.json());
  },

  async delete(col, id) {
    const r = await fetch(`${BASE}/${col}/${id}`, { method: "DELETE" });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "خطأ"); }
  },
};

// ===== HELPERS =====
const fmt = (n) => new Intl.NumberFormat("ar-EG").format(n ?? 0) + " ج.م";
const today = () => new Date().toISOString().split("T")[0];

// ===== ICONS =====
const Icon = ({ name, size = 20 }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    sales: <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.9 18 9 18h12v-2H9.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.36 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>,
    purchase: <path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.96.5 13.46.5c-1.38 0-2.74.65-3.62 1.8L9 3.4l-.84-1.1C7.28 1.15 5.92.5 4.54.5 2.04.5 0 2.54 0 4.66c0 .46.11.9.18 1.34H0v2h20V6zm-9.5 14.5L9 22l-1.5-1.5V15l1.5-1.5h1L11.5 15v5.5zM4 8H2v12h4V8H4zm14 0h-2v12h4V8h-2zm-8-2H8v14h4V6h-2z"/>,
    inventory: <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09A5.91 5.91 0 006 11v1h12v-1c0-.34-.04-.67-.09-1H22V8h-2zM12 7c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5zM4 19h16v2H4zm0-4h16v2H4z"/>,
    customers: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
    suppliers: <path d="M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8l-3-3-3 3v-8h6zm-8 1H2v9h12v-9zm-2 7H4v-5h8v5z"/>,
    employees: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>,
    reports: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>,
    plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>,
    save: <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>,
    money: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>,
    refresh: <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>,
    warehouse: <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/>,
    firebase: <path d="M5.042 14.3l2.01-11.02 3.525 6.37L5.04 14.3zm7.51-8.86l1.757 3.212-5.49 9.5L21 14.3l-8.448-8.86zm2.176 14.56l-8.448-1.56 8.448-14.6 8.448 14.6-8.448 1.56z"/>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">{icons[name]}</svg>;
};

// ===== UI COMPONENTS =====
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e8ecf0", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a2744" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085", padding: 4 }}><Icon name="close" size={22} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, children, half }) => (
  <div style={{ marginBottom: 16, width: half ? "calc(50% - 8px)" : "100%" }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#344054", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d0d5dd", borderRadius: 8, fontSize: 14, color: "#1a2744", outline: "none", boxSizing: "border-box", fontFamily: "inherit", ...props.style }} />
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d0d5dd", borderRadius: 8, fontSize: 14, color: "#1a2744", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" }}>
    {children}
  </select>
);

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 200 }}>
    <div style={{ width: 52, height: 52, borderRadius: 12, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
      <Icon name={icon} size={26} />
    </div>
    <div>
      <div style={{ fontSize: 13, color: "#667085", fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1a2744" }}>{value}</div>
    </div>
  </div>
);

const Table = ({ headers, rows, emptyText = "لا توجد بيانات" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ background: "#f8fafc" }}>
          {headers.map((h, i) => <th key={i} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#344054", borderBottom: "2px solid #e8ecf0", whiteSpace: "nowrap" }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={headers.length} style={{ textAlign: "center", padding: 32, color: "#98a2b3" }}>{emptyText}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f2f4f7" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", color: "#1a2744", verticalAlign: "middle" }}>{cell}</td>)}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({ text }) => {
  const colors = { مدفوع: "#12b76a", جزئي: "#f79009", معلق: "#f04438" };
  const c = colors[text] || "#667085";
  return <span style={{ background: c + "18", color: c, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{text}</span>;
};

const Btn = ({ children, onClick, variant = "primary", size = "md", icon, danger, disabled }) => {
  const styles = {
    primary: { background: "#1a4db5", color: "#fff", border: "none" },
    secondary: { background: "#f2f4f7", color: "#344054", border: "1.5px solid #d0d5dd" },
  };
  const bg = danger ? { background: "#fef3f2", color: "#f04438", border: "1.5px solid #fecdca" } : styles[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...bg, padding: size === "sm" ? "6px 12px" : "10px 20px", borderRadius: 8, fontSize: size === "sm" ? 13 : 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", opacity: disabled ? 0.6 : 1 }}>
      {icon && <Icon name={icon} size={16} />}{children}
    </button>
  );
};

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a2744" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Loader = ({ text = "جاري التحميل..." }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, flexDirection: "column", gap: 12 }}>
    <div style={{ width: 40, height: 40, border: "4px solid #e8ecf0", borderTop: "4px solid #f5820d", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <div style={{ color: "#667085", fontSize: 14 }}>{text}</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrBox = ({ msg, onRetry }) => (
  <div style={{ background: "#fef3f2", border: "1px solid #fecdca", borderRadius: 12, padding: 20, margin: "16px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
    <span style={{ color: "#f04438", flex: 1 }}>⚠️ {msg}</span>
    {onRetry && <Btn size="sm" onClick={onRetry} icon="refresh">إعادة المحاولة</Btn>}
  </div>
);

// ===== useCollection HOOK =====
function useCollection(colName) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRows(await db.getAll(colName)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [colName]);

  useEffect(() => { load(); }, [load]);
  return { rows, setRows, loading, error, reload: load };
}

// ===== DASHBOARD =====
const Dashboard = ({ all }) => {
  const { products, customers, salesInvoices, purchaseInvoices, employees } = all;
  const totalSales = salesInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalReceivable = salesInvoices.reduce((s, i) => s + ((i.total || 0) - (i.paid || 0)), 0);
  const totalPayable = purchaseInvoices.reduce((s, i) => s + ((i.total || 0) - (i.paid || 0)), 0);
  const totalStockValue = products.reduce((s, p) => s + (p.stock || 0) * (p.buyPrice || 0), 0);
  const totalSalaries = employees.reduce((s, e) => s + (e.salary || 0), 0);
  const profit = totalSales - totalPurchases;
  const lowStock = products.filter(p => (p.stock || 0) < 20);

  return (
    <div>
      <SectionHeader title="لوحة التحكم" subtitle={`آخر تحديث: ${new Date().toLocaleDateString("ar-EG")}`} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <StatCard label="إجمالي المبيعات" value={fmt(totalSales)} color="#1a4db5" icon="sales" />
        <StatCard label="إجمالي المشتريات" value={fmt(totalPurchases)} color="#7c3aed" icon="purchase" />
        <StatCard label="صافي الربح" value={fmt(profit)} color="#12b76a" icon="money" />
        <StatCard label="قيمة المخزن" value={fmt(totalStockValue)} color="#f79009" icon="warehouse" />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <StatCard label="ذمم العملاء" value={fmt(totalReceivable)} color="#1a4db5" icon="customers" />
        <StatCard label="مستحقات الموردين" value={fmt(totalPayable)} color="#f04438" icon="suppliers" />
        <StatCard label="رواتب الموظفين / شهر" value={fmt(totalSalaries)} color="#0891b2" icon="employees" />
        <StatCard label="عدد الموظفين" value={employees.length + " موظف"} color="#667085" icon="employees" />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280, background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>آخر فواتير المبيعات</h3>
          <Table headers={["العميل", "المبلغ", "الحالة"]}
            rows={salesInvoices.slice(-5).reverse().map(inv => [
              customers.find(c => c.id === inv.customerId)?.name || "—",
              fmt(inv.total),
              <Badge text={inv.status} />,
            ])} />
        </div>
        {lowStock.length > 0 && (
          <div style={{ flex: 1, minWidth: 280, background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#f04438" }}>⚠️ مخزون منخفض</h3>
            <Table headers={["المنتج", "الكمية", "الوحدة"]} rows={lowStock.map(p => [p.name, p.stock, p.unit])} />
          </div>
        )}
      </div>
    </div>
  );
};

// ===== PRODUCTS =====
const Products = ({ all, reloadAll }) => {
  const { rows, loading, error, reload } = useCollection("products");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "قطعة", buyPrice: "", sellPrice: "", stock: "" });
  const [editId, setEditId] = useState(null);

  const openNew = () => { setForm({ name: "", unit: "قطعة", buyPrice: "", sellPrice: "", stock: "" }); setEditId(null); setModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, unit: p.unit, buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock }); setEditId(p.id); setModal(true); };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const row = { name: form.name, unit: form.unit, buyPrice: +form.buyPrice, sellPrice: +form.sellPrice, stock: +form.stock };
      if (editId) await db.set("products", editId, row);
      else await db.add("products", row);
      setModal(false); reload(); reloadAll();
    } catch (e) { alert("خطأ: " + e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("حذف المنتج؟")) return;
    try { await db.delete("products", id); reload(); reloadAll(); }
    catch (e) { alert("خطأ: " + e.message); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SectionHeader title="المنتجات والبضاعة" subtitle={`${rows.length} منتج`}
        action={<div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" icon="refresh" onClick={reload}>تحديث</Btn><Btn icon="plus" onClick={openNew}>منتج جديد</Btn></div>} />
      {error && <ErrBox msg={error} onRetry={reload} />}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table
          headers={["المنتج", "الوحدة", "سعر الشراء", "سعر البيع", "المخزون", "القيمة", "إجراءات"]}
          rows={rows.map(p => [
            <strong>{p.name}</strong>, p.unit, fmt(p.buyPrice), fmt(p.sellPrice),
            <span style={{ color: (p.stock || 0) < 20 ? "#f04438" : "#12b76a", fontWeight: 700 }}>{p.stock || 0}</span>,
            fmt((p.stock || 0) * (p.buyPrice || 0)),
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" variant="secondary" icon="edit" onClick={() => openEdit(p)}>تعديل</Btn>
              <Btn size="sm" danger onClick={() => del(p.id)}>حذف</Btn>
            </div>
          ])}
        />
      </div>
      {modal && (
        <Modal title={editId ? "تعديل منتج" : "إضافة منتج"} onClose={() => setModal(false)}>
          <Field label="اسم المنتج"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 16 }}>
            <Field label="الوحدة" half><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></Field>
            <Field label="الكمية في المخزن" half><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Field label="سعر الشراء" half><Input type="number" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} /></Field>
            <Field label="سعر البيع" half><Input type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn icon="save" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Btn>
            <Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== INVOICE FORM =====
const InvoiceForm = ({ type, products, parties, onSave, onClose }) => {
  const [partyId, setPartyId] = useState("");
  const [date, setDate] = useState(today());
  const [paid, setPaid] = useState(0);
  const [items, setItems] = useState([{ productId: "", qty: 1, price: "" }]);
  const [saving, setSaving] = useState(false);
  const total = items.reduce((s, it) => s + (+it.qty * +(it.price || 0)), 0);

  const addItem = () => setItems(i => [...i, { productId: "", qty: 1, price: "" }]);
  const updateItem = (idx, field, val) => setItems(items.map((it, i) => {
    if (i !== idx) return it;
    const u = { ...it, [field]: val };
    if (field === "productId") {
      const p = products.find(pr => pr.id === val);
      if (p) u.price = type === "sales" ? p.sellPrice : p.buyPrice;
    }
    return u;
  }));
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const save = async () => {
    if (!partyId || items.some(it => !it.productId)) return alert("يرجى إكمال البيانات");
    setSaving(true);
    try {
      const status = +paid >= total ? "مدفوع" : +paid > 0 ? "جزئي" : "معلق";
      const mappedItems = items.map(it => ({ productId: it.productId, qty: +it.qty, price: +it.price }));
      const row = { date, total, paid: +paid, status, items: mappedItems };
      if (type === "sales") row.customerId = partyId;
      else row.supplierId = partyId;
      await db.add(type === "sales" ? "salesInvoices" : "purchaseInvoices", row);
      // update stock
      for (const it of mappedItems) {
        const p = products.find(pr => pr.id === it.productId);
        if (p) {
          const newStock = type === "sales" ? (p.stock || 0) - it.qty : (p.stock || 0) + it.qty;
          await db.set("products", p.id, { ...p, stock: Math.max(0, newStock) });
        }
      }
      onSave();
    } catch (e) { alert("خطأ: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`فاتورة ${type === "sales" ? "مبيعات" : "مشتريات"} جديدة`} onClose={onClose}>
      <div style={{ display: "flex", gap: 16 }}>
        <Field label={type === "sales" ? "العميل" : "المورد"} half>
          <Select value={partyId} onChange={e => setPartyId(e.target.value)}>
            <option value="">اختر...</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="التاريخ" half><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>البنود</strong>
          <Btn size="sm" icon="plus" onClick={addItem}>إضافة بند</Btn>
        </div>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <div style={{ flex: 2 }}>
              <Select value={it.productId} onChange={e => updateItem(idx, "productId", e.target.value)}>
                <option value="">المنتج...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div style={{ flex: 1 }}><Input type="number" value={it.qty} min={1} onChange={e => updateItem(idx, "qty", e.target.value)} placeholder="كمية" /></div>
            <div style={{ flex: 1 }}><Input type="number" value={it.price} onChange={e => updateItem(idx, "price", e.target.value)} placeholder="سعر" /></div>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 700, color: "#1a4db5", fontSize: 13 }}>{fmt(+it.qty * +(it.price || 0))}</div>
            {items.length > 1 && <Btn size="sm" danger onClick={() => removeItem(idx)}>✕</Btn>}
          </div>
        ))}
        <div style={{ textAlign: "left", fontWeight: 800, fontSize: 16, color: "#1a2744", marginTop: 8 }}>الإجمالي: {fmt(total)}</div>
      </div>
      <Field label="المبلغ المدفوع"><Input type="number" value={paid} onChange={e => setPaid(e.target.value)} /></Field>
      {total > 0 && (
        <div style={{ background: +paid >= total ? "#f0fdf4" : "#fffbeb", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: +paid >= total ? "#15803d" : "#92400e", marginBottom: 16 }}>
          {+paid >= total ? "✅ مدفوع بالكامل" : `⏳ متبقي: ${fmt(total - paid)}`}
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <Btn icon="save" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ الفاتورة"}</Btn>
        <Btn variant="secondary" onClick={onClose}>إلغاء</Btn>
      </div>
    </Modal>
  );
};

// ===== SALES =====
const Sales = ({ all, reloadAll }) => {
  const { rows, loading, error, reload } = useCollection("salesInvoices");
  const [modal, setModal] = useState(false);

  const del = async (id) => {
    if (!confirm("حذف الفاتورة؟")) return;
    try { await db.delete("salesInvoices", id); reload(); reloadAll(); }
    catch (e) { alert("خطأ: " + e.message); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SectionHeader title="فواتير المبيعات" subtitle={`${rows.length} فاتورة`}
        action={<div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" icon="refresh" onClick={reload}>تحديث</Btn><Btn icon="plus" onClick={() => setModal(true)}>فاتورة جديدة</Btn></div>} />
      {error && <ErrBox msg={error} onRetry={reload} />}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table
          headers={["التاريخ", "العميل", "الإجمالي", "المدفوع", "المتبقي", "الحالة", "إجراءات"]}
          rows={rows.map(inv => [
            inv.date,
            all.customers.find(c => c.id === inv.customerId)?.name || "—",
            fmt(inv.total),
            <span style={{ color: "#12b76a", fontWeight: 600 }}>{fmt(inv.paid)}</span>,
            <span style={{ color: "#f04438", fontWeight: 600 }}>{fmt((inv.total || 0) - (inv.paid || 0))}</span>,
            <Badge text={inv.status} />,
            <Btn size="sm" danger onClick={() => del(inv.id)}>حذف</Btn>,
          ])}
        />
      </div>
      {modal && <InvoiceForm type="sales" products={all.products} parties={all.customers}
        onSave={() => { setModal(false); reload(); reloadAll(); }} onClose={() => setModal(false)} />}
    </div>
  );
};

// ===== PURCHASES =====
const Purchases = ({ all, reloadAll }) => {
  const { rows, loading, error, reload } = useCollection("purchaseInvoices");
  const [modal, setModal] = useState(false);

  const del = async (id) => {
    if (!confirm("حذف الفاتورة؟")) return;
    try { await db.delete("purchaseInvoices", id); reload(); reloadAll(); }
    catch (e) { alert("خطأ: " + e.message); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SectionHeader title="فواتير المشتريات" subtitle={`${rows.length} فاتورة`}
        action={<div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" icon="refresh" onClick={reload}>تحديث</Btn><Btn icon="plus" onClick={() => setModal(true)}>فاتورة جديدة</Btn></div>} />
      {error && <ErrBox msg={error} onRetry={reload} />}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table
          headers={["التاريخ", "المورد", "الإجمالي", "المدفوع", "المتبقي", "الحالة", "إجراءات"]}
          rows={rows.map(inv => [
            inv.date,
            all.suppliers.find(s => s.id === inv.supplierId)?.name || "—",
            fmt(inv.total),
            <span style={{ color: "#12b76a", fontWeight: 600 }}>{fmt(inv.paid)}</span>,
            <span style={{ color: "#f04438", fontWeight: 600 }}>{fmt((inv.total || 0) - (inv.paid || 0))}</span>,
            <Badge text={inv.status} />,
            <Btn size="sm" danger onClick={() => del(inv.id)}>حذف</Btn>,
          ])}
        />
      </div>
      {modal && <InvoiceForm type="purchases" products={all.products} parties={all.suppliers}
        onSave={() => { setModal(false); reload(); reloadAll(); }} onClose={() => setModal(false)} />}
    </div>
  );
};

// ===== PARTY SCREEN (Customers / Suppliers) =====
const PartyScreen = ({ title, colName, invoiceCol, partyKey, all, reloadAll }) => {
  const { rows, loading, error, reload } = useCollection(colName);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [editId, setEditId] = useState(null);

  const openNew = () => { setForm({ name: "", phone: "", address: "" }); setEditId(null); setModal(true); };
  const openEdit = (r) => { setForm({ name: r.name, phone: r.phone || "", address: r.address || "" }); setEditId(r.id); setModal(true); };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editId) await db.set(colName, editId, form);
      else await db.add(colName, form);
      setModal(false); reload(); reloadAll();
    } catch (e) { alert("خطأ: " + e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("حذف؟")) return;
    try { await db.delete(colName, id); reload(); reloadAll(); }
    catch (e) { alert("خطأ: " + e.message); }
  };

  const getBalance = (id) => {
    const invoices = invoiceCol === "salesInvoices" ? all.salesInvoices : all.purchaseInvoices;
    return invoices.filter(i => i[partyKey] === id).reduce((s, i) => s + ((i.total || 0) - (i.paid || 0)), 0);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SectionHeader title={title} subtitle={`${rows.length} سجل`}
        action={<div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" icon="refresh" onClick={reload}>تحديث</Btn><Btn icon="plus" onClick={openNew}>إضافة جديد</Btn></div>} />
      {error && <ErrBox msg={error} onRetry={reload} />}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table
          headers={["الاسم", "الهاتف", "العنوان", partyKey === "customerId" ? "الرصيد المستحق" : "المستحق عليك", "إجراءات"]}
          rows={rows.map(r => {
            const bal = getBalance(r.id);
            return [
              <strong>{r.name}</strong>, r.phone || "—", r.address || "—",
              <span style={{ color: bal > 0 ? "#f04438" : "#12b76a", fontWeight: 700 }}>{fmt(bal)}</span>,
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" variant="secondary" icon="edit" onClick={() => openEdit(r)}>تعديل</Btn>
                <Btn size="sm" danger onClick={() => del(r.id)}>حذف</Btn>
              </div>
            ];
          })}
        />
      </div>
      {modal && (
        <Modal title={editId ? "تعديل" : "إضافة جديد"} onClose={() => setModal(false)}>
          <Field label="الاسم"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 16 }}>
            <Field label="الهاتف" half><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field label="العنوان" half><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn icon="save" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Btn>
            <Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== EMPLOYEES =====
const Employees = ({ reloadAll }) => {
  const { rows: employees, loading: loadEmp, error: errEmp, reload: reloadEmp } = useCollection("employees");
  const { rows: payroll, loading: loadPay, error: errPay, reload: reloadPay } = useCollection("payroll");
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", position: "", salary: "", hireDate: today() });
  const [editId, setEditId] = useState(null);
  const [payForm, setPayForm] = useState({ employeeId: "", month: "", bonus: 0, deductions: 0 });

  const openNew = () => { setForm({ name: "", position: "", salary: "", hireDate: today() }); setEditId(null); setModal(true); };
  const openEdit = (e) => { setForm({ name: e.name, position: e.position, salary: e.salary, hireDate: e.hireDate || today() }); setEditId(e.id); setModal(true); };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const row = { name: form.name, position: form.position, salary: +form.salary, hireDate: form.hireDate };
      if (editId) await db.set("employees", editId, row);
      else await db.add("employees", row);
      setModal(false); reloadEmp(); reloadAll();
    } catch (e) { alert("خطأ: " + e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("حذف الموظف؟")) return;
    try { await db.delete("employees", id); reloadEmp(); reloadAll(); }
    catch (e) { alert("خطأ: " + e.message); }
  };

  const payEmployee = async () => {
    const emp = employees.find(e => e.id === payForm.employeeId);
    if (!emp || !payForm.month) return alert("اختر موظف وشهر");
    setSaving(true);
    try {
      const net = (emp.salary || 0) + +payForm.bonus - +payForm.deductions;
      await db.add("payroll", {
        month: payForm.month, employeeId: emp.id,
        salary: emp.salary || 0, bonus: +payForm.bonus,
        deductions: +payForm.deductions, net, date: today()
      });
      setPayModal(false); reloadPay();
    } catch (e) { alert("خطأ: " + e.message); }
    finally { setSaving(false); }
  };

  if (loadEmp || loadPay) return <Loader />;

  return (
    <div>
      <SectionHeader title="الموظفين والرواتب"
        action={<div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" icon="money" onClick={() => setPayModal(true)}>صرف راتب</Btn>
          <Btn icon="plus" onClick={openNew}>موظف جديد</Btn>
        </div>} />
      {errEmp && <ErrBox msg={errEmp} onRetry={reloadEmp} />}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 24 }}>
        <Table
          headers={["الموظف", "الوظيفة", "الراتب", "تاريخ التعيين", "إجراءات"]}
          rows={employees.map(e => [
            <strong>{e.name}</strong>, e.position, fmt(e.salary), e.hireDate || "—",
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" variant="secondary" icon="edit" onClick={() => openEdit(e)}>تعديل</Btn>
              <Btn size="sm" danger onClick={() => del(e.id)}>حذف</Btn>
            </div>
          ])}
        />
      </div>

      <SectionHeader title="سجل الرواتب" action={<Btn variant="secondary" icon="refresh" onClick={reloadPay}>تحديث</Btn>} />
      {errPay && <ErrBox msg={errPay} onRetry={reloadPay} />}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table
          headers={["الشهر", "الموظف", "الراتب", "مكافأة", "خصم", "الصافي"]}
          rows={payroll.map(p => [
            p.month,
            employees.find(e => e.id === p.employeeId)?.name || "—",
            fmt(p.salary),
            p.bonus > 0 ? <span style={{ color: "#12b76a" }}>+{fmt(p.bonus)}</span> : "—",
            p.deductions > 0 ? <span style={{ color: "#f04438" }}>-{fmt(p.deductions)}</span> : "—",
            <strong style={{ color: "#1a4db5" }}>{fmt(p.net)}</strong>
          ])}
        />
      </div>

      {modal && (
        <Modal title={editId ? "تعديل موظف" : "موظف جديد"} onClose={() => setModal(false)}>
          <Field label="الاسم"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 16 }}>
            <Field label="الوظيفة" half><Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} /></Field>
            <Field label="الراتب" half><Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} /></Field>
          </div>
          <Field label="تاريخ التعيين"><Input type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn icon="save" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Btn>
            <Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title="صرف راتب" onClose={() => setPayModal(false)}>
          <Field label="الموظف">
            <Select value={payForm.employeeId} onChange={e => setPayForm(f => ({ ...f, employeeId: e.target.value }))}>
              <option value="">اختر موظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {fmt(e.salary)}</option>)}
            </Select>
          </Field>
          <Field label="الشهر"><Input value={payForm.month} placeholder="يونيو 2026" onChange={e => setPayForm(f => ({ ...f, month: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 16 }}>
            <Field label="مكافأة" half><Input type="number" value={payForm.bonus} onChange={e => setPayForm(f => ({ ...f, bonus: e.target.value }))} /></Field>
            <Field label="خصومات" half><Input type="number" value={payForm.deductions} onChange={e => setPayForm(f => ({ ...f, deductions: e.target.value }))} /></Field>
          </div>
          {payForm.employeeId && (() => {
            const emp = employees.find(e => e.id === payForm.employeeId);
            const net = (emp?.salary || 0) + +payForm.bonus - +payForm.deductions;
            return <div style={{ background: "#f0f9ff", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#0369a1", marginBottom: 16 }}>الراتب الصافي: <strong>{fmt(net)}</strong></div>;
          })()}
          <div style={{ display: "flex", gap: 12 }}>
            <Btn icon="save" onClick={payEmployee} disabled={saving}>{saving ? "جاري الصرف..." : "صرف"}</Btn>
            <Btn variant="secondary" onClick={() => setPayModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== REPORTS =====
const Reports = ({ all }) => {
  const { products, salesInvoices, purchaseInvoices, payroll } = all;
  const totalSales = salesInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalCollected = salesInvoices.reduce((s, i) => s + (i.paid || 0), 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaidPurchases = purchaseInvoices.reduce((s, i) => s + (i.paid || 0), 0);
  const totalSalaries = payroll.reduce((s, p) => s + (p.net || 0), 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalSalaries;

  return (
    <div>
      <SectionHeader title="التقارير المالية" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "إجمالي المبيعات", value: totalSales, color: "#1a4db5" },
          { label: "المبالغ المحصلة", value: totalCollected, color: "#12b76a" },
          { label: "ذمم العملاء", value: totalSales - totalCollected, color: "#f79009" },
          { label: "إجمالي المشتريات", value: totalPurchases, color: "#7c3aed" },
          { label: "المدفوع للموردين", value: totalPaidPurchases, color: "#12b76a" },
          { label: "مستحقات الموردين", value: totalPurchases - totalPaidPurchases, color: "#f04438" },
          { label: "إجمالي الرواتب المصروفة", value: totalSalaries, color: "#0891b2" },
          { label: "مجمل الربح", value: grossProfit, color: grossProfit >= 0 ? "#12b76a" : "#f04438" },
        ].map((item, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, color: "#667085", marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{fmt(item.value)}</div>
          </div>
        ))}
      </div>
      <div style={{ background: netProfit >= 0 ? "linear-gradient(135deg,#1a4db5,#2563eb)" : "linear-gradient(135deg,#b91c1c,#dc2626)", borderRadius: 16, padding: 28, color: "#fff", textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 16, marginBottom: 8, opacity: 0.85 }}>صافي الربح (بعد الرواتب)</div>
        <div style={{ fontSize: 36, fontWeight: 900 }}>{fmt(netProfit)}</div>
        <div style={{ fontSize: 14, marginTop: 8, opacity: 0.75 }}>{netProfit >= 0 ? "✅ الشركة رابحة" : "⚠️ يجب مراجعة المصروفات"}</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>تقرير المخزن</h3>
        <Table
          headers={["المنتج", "المخزون", "سعر الشراء", "قيمة المخزون", "هامش الربح"]}
          rows={products.map(p => {
            const margin = p.buyPrice > 0 ? (((p.sellPrice || 0) - (p.buyPrice || 0)) / p.buyPrice * 100).toFixed(1) : 0;
            return [
              p.name,
              <span style={{ fontWeight: 700, color: (p.stock || 0) < 20 ? "#f04438" : "#1a2744" }}>{p.stock || 0} {p.unit}</span>,
              fmt(p.buyPrice), fmt((p.stock || 0) * (p.buyPrice || 0)),
              <span style={{ color: "#12b76a", fontWeight: 600 }}>{margin}%</span>
            ];
          })}
        />
      </div>
    </div>
  );
};

// ===== NAV =====
const NAV = [
  { id: "dashboard", label: "الرئيسية", icon: "dashboard" },
  { id: "sales", label: "المبيعات", icon: "sales" },
  { id: "purchases", label: "المشتريات", icon: "purchase" },
  { id: "inventory", label: "المخزن", icon: "inventory" },
  { id: "customers", label: "العملاء", icon: "customers" },
  { id: "suppliers", label: "الموردين", icon: "suppliers" },
  { id: "employees", label: "الموظفين", icon: "employees" },
  { id: "reports", label: "التقارير", icon: "reports" },
];

// ===== MAIN APP =====
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [all, setAll] = useState({ products: [], customers: [], suppliers: [], salesInvoices: [], purchaseInvoices: [], employees: [], payroll: [] });
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  const loadAll = useCallback(async () => {
    setGlobalError(null);
    try {
      const [products, customers, suppliers, salesInvoices, purchaseInvoices, employees, payroll] = await Promise.all([
        db.getAll("products"),
        db.getAll("customers"),
        db.getAll("suppliers"),
        db.getAll("salesInvoices"),
        db.getAll("purchaseInvoices"),
        db.getAll("employees"),
        db.getAll("payroll"),
      ]);
      setAll({ products, customers, suppliers, salesInvoices, purchaseInvoices, employees, payroll });
    } catch (e) {
      setGlobalError(e.message);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const screens = {
    dashboard: <Dashboard all={all} />,
    sales: <Sales all={all} reloadAll={loadAll} />,
    purchases: <Purchases all={all} reloadAll={loadAll} />,
    inventory: <Products all={all} reloadAll={loadAll} />,
    customers: <PartyScreen title="حسابات العملاء" colName="customers" invoiceCol="salesInvoices" partyKey="customerId" all={all} reloadAll={loadAll} />,
    suppliers: <PartyScreen title="حسابات الموردين" colName="suppliers" invoiceCol="purchaseInvoices" partyKey="supplierId" all={all} reloadAll={loadAll} />,
    employees: <Employees reloadAll={loadAll} />,
    reports: <Reports all={all} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", direction: "rtl", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <aside style={{ width: sidebarOpen ? 240 : 72, background: "linear-gradient(180deg,#0f1f4b 0%,#1a2d6b 100%)", transition: "width 0.25s", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ padding: "24px 16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: 40, height: 40, background: "#f5820d", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>🔥</div>
          {sidebarOpen && <div><div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>حسابات الشركة</div><div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>متصل بـ Firebase ☁️</div></div>}
        </div>
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, marginBottom: 2, background: page === n.id ? "rgba(255,255,255,0.15)" : "none", border: page === n.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent", color: page === n.id ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: page === n.id ? 700 : 400, textAlign: "right" }}>
              <Icon name={n.icon} size={20} />
              {sidebarOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(o => !o)} style={{ margin: 12, padding: 10, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18 }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      <main style={{ flex: 1, padding: 28, overflowX: "hidden" }}>
        {globalLoading ? (
          <Loader text="جاري الاتصال بـ Firebase..." />
        ) : globalError ? (
          <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔥</div>
            <h2 style={{ color: "#f04438", marginBottom: 8 }}>تعذّر الاتصال بـ Firebase</h2>
            <div style={{ background: "#fef3f2", borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "right" }}>
              <p style={{ color: "#b42318", fontSize: 13, margin: 0 }}>{globalError}</p>
            </div>
            <div style={{ background: "#fffbeb", borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "right" }}>
              <p style={{ color: "#92400e", fontWeight: 700, marginBottom: 8 }}>✅ تأكد من الخطوة التالية في Firebase Console:</p>
              <p style={{ color: "#92400e", fontSize: 13, margin: 0 }}>
                Firestore Database → Rules → غيّر القاعدة لـ:<br />
                <code style={{ background: "#fef3f2", padding: "2px 6px", borderRadius: 4 }}>allow read, write: if true;</code><br />
                ثم اضغط Publish
              </p>
            </div>
            <Btn icon="refresh" onClick={loadAll}>إعادة المحاولة</Btn>
          </div>
        ) : screens[page]}
      </main>
    </div>
  );
}
