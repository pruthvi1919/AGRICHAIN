import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user"));

  const links = [
    { path: "/", label: t("nav.home") },
    { path: "/farmer", label: t("nav.farmer") },
    { path: "/distributor", label: t("nav.distributor") },
    { path: "/buyer", label: t("nav.buyer") },
    { path: "/market", label: t("nav.marketPrices") },
    { path: "/trace", label: t("nav.traceability") },
    { path: "/predict", label: "Price Prediction" },
  ];

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="flex justify-between items-center px-6 py-3 bg-white shadow-md">
      {/* LOGO */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-green-700">
          agriculture
        </span>
        <h1 className="text-xl font-bold text-green-700">
          {t("common.title")}
        </h1>
      </div>

      {/* Links */}
      <div className="flex gap-6 items-center">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-lg font-medium ${
              pathname === link.path
                ? "text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* AUTH OPTIONS */}
        {!user ? (
          <>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-1 bg-blue-600 text-white rounded"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-1 bg-green-600 text-white rounded"
            >
              Register
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">
              Hi, {user.name}
            </span>
            <button
              onClick={logout}
              className="px-4 py-1 bg-red-600 text-white rounded"
            >
              Logout
            </button>
          </div>
        )}
        
        <LanguageSwitcher />
      </div>
    </nav>
  );
}