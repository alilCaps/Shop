
function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function StatusBadge({ value }) {
  const status = String(value ?? "Unknown");
  const normalized = status.toLowerCase();

  let styles = "bg-gray-100 text-gray-700";

  if (["active", "completed", "approved", "delivered"].includes(normalized)) {
    styles = "bg-green-100 text-green-700";
  } else if (
    ["pending", "processing", "on the way", "under review"].includes(normalized)
  ) {
    styles = "bg-yellow-100 text-yellow-800";
  } else if (
    ["inactive", "cancelled", "rejected", "suspended", "failed"].includes(
      normalized
    )
  ) {
    styles = "bg-red-100 text-red-700";
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {status}
    </span>
  );
}

export default function AdminDataTable({
  columns,
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  getRowId,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
        Loading records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <p className="font-semibold text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 font-semibold">
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowId(row) ?? index}
                  className="transition hover:bg-orange-50/40"
                >
                  {columns.map((column) => {
                    const value = row[column.key];

                    return (
                      <td key={column.key} className="px-5 py-4 text-gray-700">
                        {column.type === "status" ? (
                          <StatusBadge value={value} />
                        ) : (
                          formatValue(value)
                        )}
                      </td>
                    );
                  })}

                  {(onEdit || onDelete) && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-3">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="font-medium text-orange-600 hover:text-orange-800"
                          >
                            Edit
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
