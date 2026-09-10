import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiUser, FiMail, FiPhone, FiLock } from "react-icons/fi";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "farmer",
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post("http://localhost:5000/register", form);
      alert(t("registerSuccess") || "Registration successful!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-br from-gray-100 to-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-green-700">
          {t("auth.signup") || "Register"}
        </h2>

        <p className="text-gray-600 text-center mt-1">
          Create your AgriChain account
        </p>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="relative mb-3">
            <FiUser className="absolute left-3 top-3 text-gray-500" />
            <input
              name="name"
              placeholder="Name"
              onChange={handleChange}
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="relative mb-3">
            <FiMail className="absolute left-3 top-3 text-gray-500" />
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="relative mb-3">
            <FiLock className="absolute left-3 top-3 text-gray-500" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="relative mb-3">
            <FiPhone className="absolute left-3 top-3 text-gray-500" />
            <input
              name="phone"
              placeholder="Phone Number"
              onChange={handleChange}
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
          </div>

          <select
            name="role"
            onChange={handleChange}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-300"
          >
            <option value="farmer">{t("nav.farmer")}</option>
            <option value="distributor">{t("nav.distributor")}</option>
            <option value="buyer">{t("nav.buyer")}</option>
          </select>

          <button className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition">
            {t("auth.signup")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <span
            className="text-green-600 cursor-pointer font-semibold"
            onClick={() => navigate("/login")}
          >
            {t("auth.login")}
          </span>
        </p>
      </div>
    </div>
  );
}
