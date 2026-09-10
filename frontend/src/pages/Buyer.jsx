import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function Buyer() {
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user"));

  // ---------------------------
  // STATE
  // ---------------------------
  const [wallet, setWallet] = useState(user?.ganache_wallet || "");
  const [available, setAvailable] = useState([]);
  const [purchased, setPurchased] = useState([]);

  // ---------------------------
  // FETCH CROPS
  // ---------------------------
  const loadCrops = async () => {
    try {
      const res = await axios.get("http://localhost:5000/search-crops", {
        params: { crop_name: "" },
      });
      const all = res.data;

      // Load ALL unsold crops
      setAvailable(
        all.filter(
          (c) => c.status === "LISTED" || c.status === "RESELL_LISTED"
        )
      );

      // Load purchased only when wallet exists
      if (wallet) {
        setPurchased(
          all.filter(
            (c) =>
              c.current_owner &&
              c.current_owner.toLowerCase() === wallet.toLowerCase()
          )
        );
      }
    } catch (err) {
      console.error("Error loading crops:", err);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [wallet]);

  // ---------------------------
  // SAVE WALLET
  // ---------------------------
  const saveWallet = async (value) => {
    setWallet(value);
    if (value.trim()) {
      await axios.post("http://localhost:5000/save-wallet", {
        user_id: user.id,
        wallet: value.trim(),
      });
      const updatedUser = { ...user, ganache_wallet: value.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // ---------------------------
  // BUY CROP
  // ---------------------------
  const buyCrop = async (id, price) => {
    if (!wallet) return alert(t("buyer.enterWallet"));
    try {
      await axios.post("http://localhost:5000/bc-buy-crop", {
        id,
        from: wallet,
        price,
      });
      alert(t("buyer.purchaseSuccess") || "Purchase Successful!");
      loadCrops(); // Reload both sections
    } catch (err) {
      console.error(err);
      alert(t("buyer.purchaseFailed") || "Purchase failed!");
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-3xl">shopping_cart</span>
        <h1 className="text-2xl font-bold">{t("nav.buyer")}</h1>
      </div>

      <p className="text-gray-600 mb-6">
        {t("buyer.welcome", { name: user.name })}
      </p>

      {/* WALLET INPUT */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("buyer.walletLabel") || "Blockchain Wallet Address"}
        </label>
        <input
          value={wallet}
          onChange={(e) => saveWallet(e.target.value)}
          className="w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder={t("buyer.walletPlaceholder") || "Enter your Ganache wallet (0x...)"}
        />
      </div>

      {/* AVAILABLE CROPS */}
      <div className="bg-white p-6 rounded-xl shadow mb-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">
          {t("buyer.available") || "Available Crops"}
        </h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price (ETH)</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {available.map((c) => (
              <tr key={c.id} className="text-center hover:bg-gray-50">
                <td className="border p-2 font-mono text-sm">
                  {c.blockchain_crop_id || "-"}
                </td>
                <td className="border p-2">
                  {c.crop_image ? (
                    <img
                      src={`http://localhost:5000/uploads/${c.crop_image}`}
                      className="w-20 h-14 object-cover mx-auto rounded"
                      alt="crop"
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="border p-2">{c.crop_name}</td>
                <td className="border p-2">{c.quantity}</td>
                <td className="border p-2 font-semibold text-blue-700">
                  {c.price}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => buyCrop(c.blockchain_crop_id, c.price)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded transition-colors"
                  >
                    {t("buyer.buyBtn") || "BUY"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PURCHASED CROPS */}
      <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">
          {t("buyer.purchased") || "Purchased Crops"}
        </h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="p-2 border">BC ID</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price</th>
            </tr>
          </thead>
          <tbody>
            {purchased.map((c) => (
              <tr key={c.id} className="text-center">
                <td className="border p-2 font-mono text-sm">
                  {c.blockchain_crop_id}
                </td>
                <td className="border p-2">
                  {c.crop_image ? (
                    <img
                      src={`http://localhost:5000/uploads/${c.crop_image}`}
                      className="w-20 h-14 object-cover mx-auto rounded"
                      alt="crop"
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="border p-2">{c.crop_name}</td>
                <td className="border p-2">{c.quantity}</td>
                <td className="border p-2">{c.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}