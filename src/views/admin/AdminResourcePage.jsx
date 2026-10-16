
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService.js";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import AdminDataTable from "../../components/admin/AdminDataTable.jsx";

export default function AdminResourcePage({ config }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminService.getResource(config.resource);
      const records = Array.isArray(result)
        ? result
        : result.data ?? result.records ?? [];

      if (!Array.isArray(records)) {
        throw new Error("The server returned an invalid data format.");
      }

      setRows(records);
    } catch (err) {
      setError(err.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }, [config.resource]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        config.columns.some((column) =>
          String(row[column.key] ?? "").toLowerCase().includes(term)
        );

      const status = String(row.status ?? "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter, config.columns]);

  async function handleEdit(row) {
    if (!config.editableFields?.length) {
      setNotice("Editing has not been configured for this page yet.");
      return;
    }

    const changes = {};

    for (const field of config.editableFields) {
      const currentValue = row[field.key] ?? "";
      const answer = window.prompt(
        `Enter ${field.label}:`,
        String(currentValue)
      );

      if (answer === null) return;
      changes[field.key] = answer;
    }

    try {
      await adminService.updateResource(
        config.resource,
        row[config.idKey],
        changes
      );

      setNotice("Record updated successfully.");
      await loadRecords();
    } catch (err) {
      setNotice(err.message || "Unable to update record.");
    }
  }

  async function handleCreate() {
    if (!config.createFields?.length) {
      setNotice("Creating records has not been configured for this page yet.");
      return;
    }

    const payload = {};

    for (const field of config.createFields) {
      const answer = window.prompt(`${field.label}:`);

      if (answer === null) return;

      if (field.required && !answer.trim()) {
        setNotice(`${field.label} is required.`);
        return;
      }

      payload[field.key] = answer.trim();
    }

    try {
      await adminService.createResource(config.resource, payload);
      setNotice("Record created successfully.");
      await loadRecords();
    } catch (err) {
      setNotice(err.message || "Unable to create record.");
    }
  }

  async function handleDelete(row) {
    if (!config.allowDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${config.singularLabel.toLowerCase()}?`
    );

    if (!confirmed) return;

    try {
      await adminService.deleteResource(
        config.resource,
        row[config.idKey]
      );

      setNotice("Record deleted successfully.");
      await loadRecords();
    } catch (err) {
      setNotice(err.message || "Unable to delete record.");
    }
  }

  return (
    <section>
      <AdminPageHeader
        title={config.title}
        description={config.description}
        actionLabel={config.createFields ? `Add ${config.singularLabel}` : undefined}
        onAction={config.createFields ? handleCreate : undefined}
      />

      {notice && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <p>{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${config.title.toLowerCase()}...`}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:max-w-md"
          aria-label={`Search ${config.title}`}
        />

        {config.showStatusFilter && (
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        <button
          type="button"
          onClick={loadRecords}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        Showing {filteredRows.length} of {rows.length} records
      </p>

      <AdminDataTable
        columns={config.columns}
        rows={filteredRows}
        loading={loading}
        error={error}
        onRetry={loadRecords}
        onEdit={config.editableFields ? handleEdit : undefined}
        onDelete={config.allowDelete ? handleDelete : undefined}
        getRowId={(row) => row[config.idKey]}
      />
    </section>
  );
}
