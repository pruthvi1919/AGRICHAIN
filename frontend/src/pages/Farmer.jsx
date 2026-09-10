// src/pages/Farmer.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

/* ---------- CONSTANTS ---------- */
const COMMODITIES = [
  "Rice", "Wheat", "Maize", "Potato", "Onion", 
  "Tomato", "Sugarcane", "Cotton", "Pulses"
];

const STATES = [
  "Karnataka", "Maharashtra", "Kerala", "Tamil Nadu", 
  "Andhra Pradesh", "Punjab", "Uttar Pradesh", "Delhi"
];

const DISTRICTS_BY_STATE = {
  Karnataka: ["Bangalore", "Ramanagara", "Mandya", "Mysore"],
  Maharashtra: ["Pune", "Nashik", "Nagpur"],
  Kerala: ["Ernakulam", "Palakkad", "Thrissur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Andhra Pradesh": ["Guntur", "Vijayawada", "Visakhapatnam"],
  Punjab: ["Ludhiana", "Amritsar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra"],
  Delhi: ["New Delhi"]
};

/* ---------- COMPONENT ---------- */
export default function Farmer() {
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user"));
  const farmerId = user?.id;

  /* ---------- STATES ---------- */
  const [commodity, setCommodity] = useState("");
  const [unit, setUnit] = useState(""); // quintal | kg
  const [quantityValue, setQuantityValue] = useState("");
  const [price, setPrice] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [wallet, setWallet] = useState("");
  const [myCrops, setMyCrops] = useState([]);
  const [bcCrop, setBcCrop] = useState({ id: "", name: "", quantity: "", price: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    if (user?.role !== "farmer") {
      alert("Unauthorized — Farmer access only");
      window.location.href = "/";
    }
  }, []);

  /* ---------- LOAD MY CROPS ---------- */
  const loadMyCrops = async () => {
    const res = await axios.get("http://localhost:5000/search-crops", {
      params: { crop_name: "" }
    });
    setMyCrops(res.data.filter(c => Number(c.farmer_id) === Number(farmerId)));
  };

  useEffect(() => {
    loadMyCrops();
  }, []);

  /* ---------- IMAGE ---------- */
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (!f) return setPreview(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  /* ---------- ADD CROP ---------- */
  const addCrop = async (e) => {
    e.preventDefault();
    if (!commodity || !unit || !quantityValue || !price || !state || !district) {
      return alert("Please fill all fields");
    }

    const quantity = `${quantityValue} ${unit}`;
    const location = `${district}, ${state}`;

    try {
      const formData = new FormData();
      formData.append("farmer_id", farmerId);
      formData.append("crop_name", commodity);
      formData.append("quantity", quantity);
      formData.append("price", price);
      formData.append("location", location);
      if (file) formData.append("crop_image", file);

      await axios.post("http://localhost:5000/add-crop", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Crop added successfully!");
      // Reset
      setCommodity("");
      setUnit("");
      setQuantityValue("");
      setPrice("");
      setState("");
      setDistrict("");
      setFile(null);
      setPreview(null);
      loadMyCrops();
    } catch (err) {
      console.error(err);
      alert("Failed to add crop");
    }
  };

  /* ---------- BLOCKCHAIN ---------- */
  const listOnBlockchain = async (e) => {
    e.preventDefault();
    if (!bcCrop.id || !wallet) return alert("Select crop & wallet");

    const res = await axios.post("http://localhost:5000/bc-list-crop", {
      id: bcCrop.id,
      from: wallet,
      name: bcCrop.name,
      quantity: bcCrop.quantity,
      price: Number(bcCrop.price),
      farmerId
    });
    alert("Listed on Blockchain!\nBC ID: " + res.data.bcId);
    loadMyCrops();
  };

  /* ---------- UI ---------- */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🚜 Farmer</h1>

      {/* Wallet */}
      <div className="bg-white p-6 shadow rounded mb-6">
        <h2 className="font-semibold mb-2">Your Ganache Wallet</h2>
        <input
          className="border p-2 w-full"
          placeholder="0x1234..."
          onChange={e => setWallet(e.target.value)}
        />
      </div>

      {/* Add Crop */}
      <div className="bg-white p-6 shadow rounded mb-6">
        <h2 className="font-semibold mb-4">Add New Crop (MySQL)</h2>
        <form onSubmit={addCrop} className="grid grid-cols-2 gap-3">
          {/* Commodity */}
          <select
            className="border p-2"
            value={commodity}
            onChange={e => setCommodity(e.target.value)}
          >
            <option value="">Select Commodity</option>
            {COMMODITIES.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Price */}
          <input
            className="border p-2"
            placeholder="Price (₹)"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />

          {/* Unit */}
          <select
            className="border p-2"
            value={unit}
            onChange={e => {
              setUnit(e.target.value);
              setQuantityValue("");
            }}
          >
            <option value="">Select Unit</option>
            <option value="Quintal">Quintal</option>
            <option value="Kg">Kg</option>
          </select>

          {/* Quantity */}
          <select
            className="border p-2"
            value={quantityValue}
            disabled={!unit}
            onChange={e => setQuantityValue(e.target.value)}
          >
            <option value="">Select Quantity</option>
            {unit === "Quintal" &&
              Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <option key={n}>{n}</option>
              ))}
            {unit === "Kg" &&
              Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <option key={n}>{n}</option>
              ))}
          </select>

          {/* State */}
          <select
            className="border p-2"
            value={state}
            onChange={e => {
              setState(e.target.value);
              setDistrict("");
            }}
          >
            <option value="">Select State</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* District */}
          <select
            className="border p-2"
            value={district}
            disabled={!state}
            onChange={e => setDistrict(e.target.value)}
          >
            <option value="">Select District</option>
            {state &&
              DISTRICTS_BY_STATE[state]?.map(d => (
                <option key={d}>{d}</option>
              ))}
          </select>

          {/* Image */}
          <div className="col-span-2">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && <img src={preview} className="mt-3 w-40 rounded" alt="Preview" />}
          </div>

          <button className="col-span-2 bg-green-700 text-white p-2 rounded hover:bg-green-800 transition-colors">
            Add Crop
          </button>
        </form>
      </div>

      {/* Blockchain */}
      <div className="bg-white p-6 shadow rounded">
        <h2 className="font-semibold mb-3">List Crop on Blockchain</h2>
        <select
          className="border p-2 w-full mb-3"
          onChange={e => {
            const c = myCrops.find(x => x.id == e.target.value);
            if (c) setBcCrop({ id: c.id, name: c.crop_name, quantity: c.quantity, price: c.price });
          }}
        >
          <option value="">Select Crop</option>
          {myCrops.map(c => (
            <option key={c.id} value={c.id}>
              {c.crop_name} (Qty: {c.quantity})
            </option>
          ))}
        </select>
        <form onSubmit={listOnBlockchain} className="space-y-2">
          <input className="border p-2 w-full bg-gray-100" value={bcCrop.name} placeholder="Crop Name" readOnly />
          <input className="border p-2 w-full bg-gray-100" value={bcCrop.quantity} placeholder="Quantity" readOnly />
          <input className="border p-2 w-full bg-gray-100" value={bcCrop.price} placeholder="Price" readOnly />
          <button className="bg-blue-700 text-white w-full p-2 rounded hover:bg-blue-800 transition-colors">
            List on Blockchain
          </button>
        </form>
      </div>

      {/* My Crops */}
      <div className="bg-white p-6 shadow rounded mt-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">📦 My Crops</h2>
        {myCrops.length === 0 ? (
          <p className="text-gray-500">No crops added yet.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Commodity</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">BC ID</th>
                <th className="p-2 border">Image</th>
              </tr>
            </thead>
            <tbody>
              {myCrops.map(crop => (
                <tr key={crop.id} className="text-center">
                  <td className="border p-2">{crop.id}</td>
                  <td className="border p-2">{crop.crop_name}</td>
                  <td className="border p-2">{crop.quantity}</td>
                  <td className="border p-2">₹{crop.price}</td>
                  <td className="border p-2 font-semibold">{crop.status}</td>
                  <td className="border p-2">{crop.blockchain_crop_id ?? "-"}</td>
                  <td className="border p-2">
                    {crop.crop_image ? (
                      <img
                        src={`http://localhost:5000/uploads/${crop.crop_image}`}
                        alt="crop"
                        className="w-24 h-16 object-cover mx-auto rounded"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}