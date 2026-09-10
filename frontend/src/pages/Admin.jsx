// src/pages/Admin.jsx
import { useTranslation } from "react-i18next";

export default function Admin() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-3">Admin Dashboard</h2>
        <p className="text-gray-600">Management tools will go here (user management, system logs, DB ops).</p>
      </div>
    </div>
  );
}
