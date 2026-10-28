import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import { ErrorNote, Spinner } from "../../components/Feedback.jsx";
import { api } from "../../services/api.js";
import { formatCurrency } from "../../utils/format.js";

const input =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500";

function isoDay(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
}

function csvCell(value) {
  const text = String(value ?? "");
  // Prefix formula-like values so spreadsheets don't execute them.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(report) {
  const rows = [
    ["Section", "Name", "Value 1", "Value 2"],
    ["Range", `${report.range.from} to ${report.range.to}`, "", ""],
    ...Object.entries(report.summary).map(([k, v]) => ["Summary", k, v, ""]),
    ...report.sales_by_day.map((r) => ["Sales by day", r.date, r.orders, r.revenue]),
    ...report.orders_by_status.map((r) => ["Orders by status", r.status, r.count, ""]),
    ...report.top_products.map((r) => ["Top products", r.name, r.units, r.revenue]),
    ...report.top_shops.map((r) => ["Top shops", r.shop_name, r.orders, r.revenue]),
    ...report.low_stock.map((r) => ["Low stock", r.name, r.stock, ""]),
    ...report.payment_methods.map((r) => ["Payment methods", r.method, r.count, r.amount]),
  ];
  const blob = new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `report-${report.range.from}-to-${report.range.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function SalesChart({ data }) {
  const width = 720;
  const height = 220;
  const pad = { top: 12, right: 12, bottom: 28, left: 56 };
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barW = innerW / data.length;
  const ticks = [0, 0.5, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Revenue per day">
      {ticks.map((t) => {
        const y = pad.top + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e5e7eb" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
              {formatCurrency(max * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.revenue / max) * innerH;
        return (
          <rect
            key={d.date}
            x={pad.left + i * barW + barW * 0.15}
            y={pad.top + innerH - h}
            width={Math.max(barW * 0.7, 1)}
            height={h}
            fill="#EE4D2D"
            rx="1"
          >
            <title>{`${d.date}: ${formatCurrency(d.revenue)} (${d.orders} orders)`}</title>
          </rect>
        );
      })}
      <text x={pad.left} y={height - 8} fontSize="10" fill="#6b7280">{data[0]?.date}</text>
      <text x={width - pad.right} y={height - 8} fontSize="10" fill="#6b7280" textAnchor="end">
        {data[data.length - 1]?.date}
      </text>
    </svg>
  );
}

function Table({ title, headers, rows, empty = "No data for this period." }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-800">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500">
              {headers.map((h, i) => (
                <th key={h} className={`pb-2 ${i > 0 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t border-gray-100">
                {row.map((cell, i) => (
                  <td key={i} className={`py-2 ${i > 0 ? "text-right" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminReports() {
  const [range, setRange] = useState({ from: daysAgo(29), to: daysAgo(0) });
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r) => {
    setLoading(true);
    setError("");
    try {
      const result = await api(`/api/admin/reports?from=${r.from}&to=${r.to}`);
      setReport(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function preset(days) {
    const next = { from: daysAgo(days - 1), to: daysAgo(0) };
    setRange(next);
    load(next);
  }

  return (
    <section>
      <AdminPageHeader title="Reports" description="Sales and marketplace activity for a date range." />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(range);
        }}
        className="mb-5 flex flex-wrap items-end gap-3"
      >
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">From</span>
          <input type="date" required className={input} value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">To</span>
          <input type="date" required className={input} value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </label>
        <button type="submit" className="rounded-lg bg-[#EE4D2D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d73211]">
          Apply
        </button>
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => preset(d)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            Last {d} days
          </button>
        ))}
        <button
          type="button"
          disabled={!report}
          onClick={() => downloadCsv(report)}
          className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          Export CSV
        </button>
      </form>

      <ErrorNote message={error} onRetry={() => load(range)} />
      {loading && !report ? (
        <Spinner label="Building report..." />
      ) : (
        report && (
          <div className={`space-y-5 ${loading ? "opacity-60" : ""}`}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              <Card label="Revenue" value={formatCurrency(report.summary.revenue)} />
              <Card label="Orders" value={report.summary.orders} />
              <Card label="Avg. order" value={formatCurrency(report.summary.average_order_value)} />
              <Card label="Refunds" value={formatCurrency(report.summary.refunds_total)} />
              <Card label="New users" value={report.summary.new_users} />
              <Card label="New shops" value={report.summary.new_shops} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-800">Revenue per day</h3>
              <SalesChart data={report.sales_by_day} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Table
                title="Top products"
                headers={["Product", "Units", "Revenue"]}
                rows={report.top_products.map((r) => [r.name, r.units, formatCurrency(r.revenue)])}
              />
              <Table
                title="Top shops"
                headers={["Shop", "Orders", "Revenue"]}
                rows={report.top_shops.map((r) => [r.shop_name, r.orders, formatCurrency(r.revenue)])}
              />
              <Table
                title="Orders by status"
                headers={["Status", "Orders"]}
                rows={report.orders_by_status.map((r) => [r.status.replace(/_/g, " "), r.count])}
              />
              <Table
                title="Payment methods"
                headers={["Method", "Payments", "Amount"]}
                rows={report.payment_methods.map((r) => [r.method.replace(/_/g, " "), r.count, formatCurrency(r.amount)])}
              />
              <Table
                title="Low stock (5 or fewer)"
                headers={["Product", "In stock"]}
                rows={report.low_stock.map((r) => [r.name, r.stock])}
                empty="Nothing is running low."
              />
            </div>
          </div>
        )
      )}
    </section>
  );
}
