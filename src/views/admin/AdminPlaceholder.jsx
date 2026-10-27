import { SettingsIcon } from "../../components/icons.jsx";

export default function AdminPlaceholder({ title, description }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl text-[#EE4D2D]">
          <SettingsIcon width={30} height={30} />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-800">
          {title} Page
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          This section is ready for development. Its database operations and
          management features will be added here.
        </p>
      </div>
    </div>
  );
}
