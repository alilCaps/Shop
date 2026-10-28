
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService.js";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import AdminDataTable from "../../components/admin/AdminDataTable.jsx";
import AdminFormModal from "../../components/admin/AdminFormModal.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";

export default function AdminResourcePage({ config }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [lookups, setLookups] = useState({});

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

  // Dropdowns that list other records (e.g. parent category).
  useEffect(() => {
    const fields = [...(config.createFields || []), ...(config.editableFields || [])];
    const sources = fields.filter((field) => field.optionsFrom);

    sources.forEach(async (field) => {
      try {
        const result = await adminService.getResource(field.optionsFrom.resource);
        const list = Array.isArray(result) ? result : result.data ?? [];

        setLookups((current) => ({
          ...current,
          [field.key]: list.map((item) => ({
            value: String(item[field.optionsFrom.valueKey]),
            label: item[field.optionsFrom.labelKey],
            id: item[field.optionsFrom.valueKey],
          })),
        }));
      } catch {
        /* the dropdown just stays empty */
      }
    });
  }, [config]);

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

  function handleEdit(row) {
    if (!config.editableFields?.length) {
      setNotice("Editing has not been configured for this page yet.");
      return;
    }

    setModal({ mode: "edit", row });
  }

  function handleCreate() {
    setModal({ mode: "create" });
  }

  function handleDelete(row) {
    if (config.allowDelete) setModal({ mode: "delete", row });
  }

  async function saveModal(payload) {
    if (modal.mode === "create") {
      await adminService.createResource(config.resource, payload);
      setNotice("Record created successfully.");
    } else {
      await adminService.updateResource(
        config.resource,
        modal.row[config.idKey],
        payload
      );
      setNotice("Record updated successfully.");
    }

    setModal(null);
    await loadRecords();
  }

  async function confirmDelete() {
    try {
      await adminService.deleteResource(config.resource, modal.row[config.idKey]);
      setNotice("Record deleted successfully.");
    } catch (err) {
      setNotice(err.message || "Unable to delete record.");
    }

    setModal(null);
    await loadRecords();
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

      {modal && modal.mode !== "delete" && (
        <AdminFormModal
          key={`${modal.mode}-${modal.row?.[config.idKey] ?? "new"}`}
          title={
            modal.mode === "create"
              ? `Add ${config.singularLabel}`
              : `Edit ${config.singularLabel}`
          }
          fields={modal.mode === "create" ? config.createFields : config.editableFields}
          record={modal.mode === "edit" ? modal.row : null}
          optionsByField={Object.fromEntries(
            Object.entries(lookups).map(([key, list]) => [
              key,
              modal.row
                ? list.filter((o) => o.id !== modal.row[config.idKey])
                : list,
            ])
          )}
          submitLabel={modal.mode === "create" ? `Add ${config.singularLabel}` : "Save changes"}
          onClose={() => setModal(null)}
          onSubmit={saveModal}
        />
      )}

      {modal?.mode === "delete" && (
        <ConfirmDialog
          title={`Delete ${config.singularLabel}`}
          message={`Are you sure you want to delete this ${config.singularLabel.toLowerCase()}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onClose={() => setModal(null)}
        />
      )}

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
