import { useState } from "react";
import Modal from "../Modal.jsx";

const input =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50";

function initialValue(field, record) {
  const value = record?.[field.key];

  if (field.type === "boolean") return value ? "1" : "0";
  if (value === null || value === undefined) return field.defaultValue ?? "";

  return String(value);
}

function Field({ field, value, onChange, options }) {
  const id = `field-${field.key}`;
  const common = {
    id,
    value,
    required: field.required,
    disabled: field.disabled,
    onChange: (event) => onChange(event.target.value),
    className: input,
  };

  if (field.type === "select" || field.type === "boolean") {
    const list =
      field.type === "boolean"
        ? [
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]
        : options;

    return (
      <select {...common}>
        {!field.required && field.type === "select" && (
          <option value="">{field.emptyLabel || "None"}</option>
        )}
        {list.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return <textarea {...common} rows={4} maxLength={field.maxLength} />;
  }

  return (
    <input
      {...common}
      type={field.type === "number" ? "number" : field.type || "text"}
      min={field.min}
      step={field.step}
      maxLength={field.maxLength}
    />
  );
}

// Form modal for creating or editing a record. Only changed fields are sent
// when editing.
export default function AdminFormModal({
  title,
  fields,
  record,
  optionsByField = {},
  submitLabel = "Save changes",
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, initialValue(f, record)]))
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function optionsFor(field) {
    const raw = optionsByField[field.key] ?? field.options ?? [];
    const list = typeof raw === "function" ? raw(record) : raw;

    return list.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {};

    for (const field of fields) {
      const raw = values[field.key];

      if (record && raw === initialValue(field, record)) continue;

      if (field.required && !String(raw).trim()) {
        return setError(`${field.label} is required.`);
      }

      const key = field.apiKey || field.key;

      if (field.type === "number") {
        payload[key] = raw === "" ? null : Number(raw);
      } else if (field.type === "boolean") {
        payload[key] = raw === "1";
      } else if (field.type === "select" && field.numeric) {
        payload[key] = raw === "" ? null : Number(raw);
      } else {
        payload[key] = typeof raw === "string" ? raw.trim() : raw;
      }
    }

    if (record && Object.keys(payload).length === 0) {
      return onClose();
    }

    setBusy(true);
    setError("");

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-form"
            disabled={busy}
            className="rounded-lg bg-[#EE4D2D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d73211] disabled:opacity-60"
          >
            {busy ? "Saving..." : submitLabel}
          </button>
        </>
      }
    >
      <form id="admin-form" onSubmit={submit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`field-${field.key}`} className="mb-1 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            <Field
              field={field}
              value={values[field.key]}
              options={optionsFor(field)}
              onChange={(value) => setValues({ ...values, [field.key]: value })}
            />
            {field.hint && <p className="mt-1 text-xs text-gray-500">{field.hint}</p>}
          </div>
        ))}
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
