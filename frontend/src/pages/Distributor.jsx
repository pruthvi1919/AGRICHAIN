import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function Distributor() {
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user"));

  // ROLE PROTECTION & STATE
  const [wallet, setWallet] = useState(user?.ganache_wallet || "");
  const [available, setAvailable] = useState([]);
  const [resold, setResold] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [resellModal, setResellModal] = useState(null);

  // ----------------------------
  // SAVE WALLET
  // ----------------------------
  const saveWallet = async (val) => {
    setWallet(val);
    if (val.trim()) {
      await axios.post("http://localhost:5000/save-wallet", {
        user_id: user.id,
        wallet: val.trim(),
      });
      const updatedUser = { ...user, ganache_wallet: val.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // ----------------------------
  // LOAD CROPS
  // ----------------------------
  const loadAll = async () => {
    if (!wallet) return;
    const res = await axios.get("http://localhost:5000/search-crops", {
      params: { crop_name: "" },
    });
    const data = res.data || [];

    // 1. Available crops (not owned by me)
    setAvailable(
      data.filter(
        (c) =>
          c.status === "LISTED" &&
          c.current_owner?.toLowerCase() !== wallet.toLowerCase()
      )
    );

    // 2. Purchased (owned by distributor)
    setPurchased(
      data.filter(
        (c) =>
          c.status === "PURCHASED" &&
          c.current_owner?.toLowerCase() === wallet.toLowerCase()
      )
    );

    // 3. Resold (completed resale)
    setResold(
      data.filter(
        (c) =>
          c.status === "RESOLD" &&
          c.prev_owner?.toLowerCase() === wallet.toLowerCase()
      )
    );
  };

  useEffect(() => {
    loadAll();
  }, [wallet]);

  // ----------------------------
  // BUY CROP
  // ----------------------------
  const buyCrop = async (crop) => {
    if (!wallet) return alert("Enter wallet first!");
    await axios.post("http://localhost:5000/bc-buy-crop", {
      id: crop.blockchain_crop_id,
      from: wallet,
      price: crop.price,
    });
    alert("Purchase successful!");
    loadAll();
  };

  // ----------------------------
  // OPEN RESELL MODAL
  // ----------------------------
  const openResell = (crop) => {
    const cloned = JSON.parse(JSON.stringify(crop));
    setResellModal({
      id: cloned.blockchain_crop_id,
      name: String(cloned.crop_name),
      qty: String(cloned.quantity),
      price: String(cloned.price),
    });
  };

  // ----------------------------
  // HANDLE RESELL
  // ----------------------------
  const submitResell = async () => {
    if (!resellModal) return;
    if (!wallet) return alert("Enter your wallet first!");

    const payload = {
      originalId: resellModal.id,
      from: wallet,
      newPrice: resellModal.price,
      newQuantity: resellModal.qty,
    };

    try {
      const resp = await axios.post("http://localhost:5000/bc-resell-crop", payload);
      if (resp.data?.success) {
        alert("Resell Successful! BC ID: " + (resp.data.newBcId || ""));
        await loadAll();
        setResellModal(null);
      } else {
        alert("Resell failed: " + (resp.data?.message || "Unknown"));
      }
    } catch (err) {
      console.error("resell error:", err);
      alert("Resell error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6">
      {/* Wallet Box */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Your Wallet</h2>
        <input
          value={wallet}
          onChange={(e) => saveWallet(e.target.value)}
          onBlur={(e) => saveWallet(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="0x123..."
        />
      </div>

      {/* ---------------- AVAILABLE CROPS ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow mb-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">Available Crops</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {available.map((c) => (
              <tr key={c.id} className="text-center">
                <td className="border p-2">{c.blockchain_crop_id}</td>
                <td className="border p-2">
                  {c.crop_image ? (
                    <img
                      src={`http://localhost:5000/uploads/${c.crop_image}`}
                      className="w-20 h-14 object-cover mx-auto"
                      alt={c.crop_name}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border p-2">{c.crop_name}</td>
                <td className="border p-2">{c.quantity}</td>
                <td className="border p-2">{c.price}</td>
                <td className="border p-2">
                  <button
                    onClick={() => buyCrop(c)}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  >
                    BUY
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- PURCHASED CROPS ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow mb-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">Purchased Crops</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {purchased.map((c) => (
              <tr key={c.id} className="text-center">
                <td className="border p-2">{c.blockchain_crop_id}</td>
                <td className="border p-2">
                  {c.crop_image ? (
                    <img
                      src={`http://localhost:5000/uploads/${c.crop_image}`}
                      className="w-20 h-14 object-cover mx-auto"
                      alt={c.crop_name}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border p-2">{c.crop_name}</td>
                <td className="border p-2">{c.quantity}</td>
                <td className="border p-2">{c.price}</td>
                <td className="border p-2">
                  <button
                    onClick={() => openResell(c)}
                    className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700"
                  >
                    RESELL
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- RESOLD CROPS ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow mb-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">Resold Crops</h2>
        {resold.length === 0 ? (
          <p className="text-gray-500">No crops resold yet.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="p-2 border">BC ID</th>
                <th className="p-2 border">Image</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {resold.map((c) => (
                <tr key={c.id} className="text-center">
                  <td className="border p-2">{c.blockchain_crop_id}</td>
                  <td className="border p-2">
                    {c.crop_image ? (
                      <img
                        src={`http://localhost:5000/uploads/${c.crop_image}`}
                        className="w-20 h-14 object-cover mx-auto"
                        alt={c.crop_name}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="border p-2">{c.crop_name}</td>
                  <td className="border p-2">{c.quantity}</td>
                  <td className="border p-2">{c.price}</td>
                  <td className="border p-2 text-green-600 font-semibold">
                    Resold
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---------------- RESELL MODAL ---------------- */}
      {resellModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-xl w-96">
            <h2 className="text-lg font-semibold mb-3">Resell Crop</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">New Price</label>
                <input
                  className="p-2 w-full border rounded"
                  value={resellModal.price}
                  onChange={(e) =>
                    setResellModal({ ...resellModal, price: e.target.value })
                  }
                  placeholder="New Price"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">New Quantity</label>
                <input
                  className="p-2 w-full border rounded"
                  value={resellModal.qty}
                  onChange={(e) =>
                    setResellModal({ ...resellModal, qty: e.target.value })
                  }
                  placeholder="New Quantity"
                />
              </div>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded w-full mt-4 hover:bg-green-700"
                onClick={submitResell}
              >
                Confirm Resell
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded w-full hover:bg-gray-400"
                onClick={() => setResellModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}