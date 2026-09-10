import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ------------------ HELPERS ------------------ */
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");
const short = (v, l = 10) => (v ? v.slice(0, 6) + "…" + v.slice(-4) : "—");

/* ------------------ COMPONENT ------------------ */
export default function Traceability() {
  const [bcId, setBcId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trace, setTrace] = useState(null);
  const navigate = useNavigate();

  /* ------------------ FETCH TRACE ------------------ */
  const fetchTrace = async (e) => {
    e.preventDefault();
    setError("");
    setTrace(null);

    if (!bcId) return setError("Enter Blockchain Crop ID");

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/trace/${bcId}`);
      if (!res.data?.success) {
        setError(res.data?.message || "Trace failed");
      } else {
        setTrace(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  /* ------------------ DERIVE FLOW ------------------ */
  const deriveActors = (timeline = []) => {
    const farmer = timeline.find((t) => t.role === "Farmer");
    const distributor = timeline.find((t) => t.role === "Distributor");
    const buyer = timeline.find((t) => t.role === "Buyer");
    return { farmer, distributor, buyer };
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">🔗 Traceability</h1>
        <button
          onClick={() => navigate("/")}
          className="ml-auto border px-3 py-1 rounded hover:bg-gray-50 transition-colors"
        >
          Home
        </button>
      </div>

      {/* SEARCH */}
      <form onSubmit={fetchTrace} className="flex gap-3 mb-6">
        <input
          className="border p-2 rounded w-60 focus:ring-2 focus:ring-green-500 outline-none"
          placeholder="Enter Blockchain Crop ID"
          value={bcId}
          onChange={(e) => setBcId(e.target.value)}
        />
        <button className="bg-green-600 text-white px-4 rounded hover:bg-green-700 transition-colors">
          {loading ? "Tracing..." : "Trace"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4 font-medium">{error}</p>}

      {/* ------------------ TRACE RESULT ------------------ */}
      {trace && (
        <>
          {/* CROP OVERVIEW */}
          <div className="bg-white shadow rounded p-6 mb-6 flex gap-6">
            <img
              src={
                trace.crop?.crop_image
                  ? `http://localhost:5000/uploads/${trace.crop.crop_image}`
                  : ""
              }
              alt={trace.crop.crop_name}
              className="w-28 h-20 object-cover rounded bg-gray-100"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{trace.crop.crop_name}</h2>
              <div className="text-sm text-gray-600 mt-2 grid grid-cols-2 gap-y-1">
                <div>Quantity: <b>{trace.crop.quantity}</b></div>
                <div>Latest Price: <b>{trace.crop.price} ETH</b></div>
                <div>Status: <b>{trace.crop.status}</b></div>
                <div>Current Owner: <b>{short(trace.crop.current_owner)}</b></div>
              </div>
            </div>
          </div>

          {/* SUPPLY CHAIN FLOW */}
          {(() => {
            const { farmer, distributor, buyer } = deriveActors(trace.supplyChainFlow);
            return (
              <div className="bg-white shadow rounded p-6 mb-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800">
                  Supply Chain Flow
                </h3>
                <div className="flex justify-between items-center max-w-2xl mx-auto">
                  {/* FARMER */}
                  <ActorCard actor={farmer} label="Farmer" />
                  <Arrow />
                  {/* DISTRIBUTOR */}
                  <ActorCard actor={distributor} label="Distributor" />
                  <Arrow />
                  {/* BUYER */}
                  <ActorCard actor={buyer} label="Buyer" />
                </div>
              </div>
            );
          })()}

          {/* TIMELINE */}
          <div className="bg-white shadow rounded p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Complete Timeline
            </h3>
            <div className="space-y-6">
              {trace.timeline.map((t, i) => (
                <div key={i} className="border-l-4 pl-4 border-green-500 relative">
                  <div className="absolute -left-2 top-0 w-3 h-3 bg-green-500 rounded-full" />
                  <div className="font-bold text-gray-800">{t.stage}</div>
                  <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                    <span className="font-medium">Role:</span> {t.role} <br />
                    <span className="font-medium">Wallet:</span> <span className="font-mono">{short(t.wallet)}</span> <br />
                    <span className="font-medium">Price:</span> {t.price ?? "—"} ETH <br />
                    <span className="font-medium">BC ID:</span> {t.blockchain_crop_id ?? "—"} <br />
                    <span className="font-medium">Time:</span> {fmtDate(t.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------ SUB COMPONENTS ------------------ */
function ActorCard({ actor, label }) {
  if (!actor) {
    return (
      <div className="text-center w-32">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 border-2 border-dashed border-gray-300" />
        <div className="font-semibold text-gray-400">{label}</div>
        <div className="text-xs text-gray-400">Waiting...</div>
      </div>
    );
  }

  return (
    <div className="text-center w-32">
      <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xl text-green-700 border-2 border-green-200">
        {actor.name?.[0] || "👤"}
      </div>
      <div className="font-semibold text-gray-800 truncate">{actor.name}</div>
      <div className="text-xs text-gray-500 font-mono">{short(actor.wallet)}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl text-green-500">→</div>
    </div>
  );
}