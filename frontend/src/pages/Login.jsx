import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiMail, FiLock } from "react-icons/fi";

export default function Login() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert(t("loginSuccess") || "Login successful");

      if (res.data.user.role === "farmer") navigate("/farmer");
      else if (res.data.user.role === "buyer") navigate("/buyer");
      else if (res.data.user.role === "distributor") navigate("/distributor");
      else navigate("/");

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-br from-green-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-green-700">
          {t("auth.login")}
        </h2>

        <p className="text-gray-600 text-center mt-1">
          Welcome back! Please login to continue.
        </p>

        {error && <p className="text-red-500 mt-3">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative mb-4">
            <FiMail className="absolute left-3 top-3 text-gray-500" />
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="relative mb-6">
            <FiLock className="absolute left-3 top-3 text-gray-500" />
            <input
              type="password"
              name="password"
              placeholder={t("login.password") || "Password"}
              onChange={handleChange}
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
          </div>

          <button className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition">
            {t("auth.login")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don’t have an account?{" "}
          <span
            className="text-green-600 cursor-pointer font-semibold"
            onClick={() => navigate("/register")}
          >
            {t("auth.signup")}
          </span>
        </p>
      </div>
    </div>
  );
}
