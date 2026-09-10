import { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function PricePrediction() {
  const [state, setState] = useState("");
  const [commodity, setCommodity] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stateComparisonData, setStateComparisonData] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // ---------------------------
  // CONSTANTS
  // ---------------------------
  const STATES = [
    "Karnataka", "Maharashtra", "Kerala", "Punjab", 
    "Delhi", "Tamil Nadu", "Andhra Pradesh", "Uttar Pradesh",
  ];

  const CROPS = ["Onion", "Rice", "Wheat", "Tomato", "Potato", "Maize"];

  const MONTHS = [
    { name: "January", value: 1 }, { name: "February", value: 2 },
    { name: "March", value: 3 }, { name: "April", value: 4 },
    { name: "May", value: 5 }, { name: "June", value: 6 },
    { name: "July", value: 7 }, { name: "August", value: 8 },
    { name: "September", value: 9 }, { name: "October", value: 10 },
    { name: "November", value: 11 }, { name: "December", value: 12 },
  ];

  const selectedMonthName = MONTHS.find((m) => m.value === Number(month))?.name || "";

  // ---------------------------
  // HELPER: Monthly Trend
  // ---------------------------
  const generateMonthlyTrend = (predictedPrice, selectedMonth) => {
    return MONTHS.map((m) => {
      const variation = m.value === selectedMonth ? 1 : 1 + (Math.random() * 0.14 - 0.07); // ±7%
      return {
        month: m.name.substring(0, 3),
        price: Math.round(predictedPrice * variation),
        highlight: m.value === selectedMonth,
      };
    });
  };

  // ---------------------------
  // PREDICT PRICE
  // ---------------------------
  const predictPrice = async () => {
    if (!state || !commodity || !month || !year) {
      alert("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      setChartData([]);
      setStateComparisonData([]);
      const res = await axios.post("http://localhost:5000/predict-price", {
        state,
        commodity,
        month: Number(month),
        year: Number(year),
      });
      const predicted = res.data.predicted_price;
      setResult(predicted);
      setChartData(generateMonthlyTrend(predicted, Number(month)));
    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // STATE-WISE COMPARISON
  // ---------------------------
  const compareStates = async () => {
    if (!commodity || !month || !year) {
      alert("Please select crop, month and year");
      return;
    }
    try {
      setComparisonLoading(true);
      setStateComparisonData([]);
      const res = await axios.post("http://localhost:5000/compare-states", {
        commodity,
        month: Number(month),
        year: Number(year),
      });
      setStateComparisonData(res.data.data);
    } catch (err) {
      console.error(err);
      alert("State comparison failed");
    } finally {
      setComparisonLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-2">
        Crop Price Prediction 🌾
      </h1>
      <p className="text-gray-600 mb-6">
        Predict approximate crop prices using Machine Learning.
      </p>

      {/* FORM */}
      <div className="bg-white shadow rounded-xl p-6 space-y-4">
        <select
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">Select State</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
          value={commodity}
          onChange={(e) => setCommodity(e.target.value)}
        >
          <option value="">Select Crop</option>
          {CROPS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">Select Month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
          placeholder="Enter Year (e.g., 2025)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={predictPrice}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Predicting..." : "Predict Price"}
          </button>
          <button
            onClick={compareStates}
            disabled={comparisonLoading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {comparisonLoading ? "Comparing..." : "Compare Prices Across States"}
          </button>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="mt-6 p-4 bg-green-100 rounded text-center border border-green-200">
          <p className="text-lg text-gray-700">
            Predicted price of <b>{commodity}</b> in <b>{state}</b>
          </p>
          <p className="text-2xl font-bold text-green-800">
            ₹ {result} / Quintal
          </p>
        </div>
      )}

      {/* MONTHLY TREND */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow mt-8 border">
          <h2 className="text-xl font-semibold mb-1">
            Monthly Price Trend – {commodity}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            State: <b>{state}</b> | Year: <b>{year}</b> | Highlighted month:{" "}
            <b>{selectedMonthName}</b>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => [`₹ ${v} / Quintal`, "Price"]} />
              <Line
                dataKey="price"
                stroke="#16a34a"
                strokeWidth={3}
                dot={(p) =>
                  p.payload.highlight ? (
                    <circle key={p.key} cx={p.cx} cy={p.cy} r={6} fill="#ef4444" />
                  ) : (
                    <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill="#16a34a" />
                  )
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* STATE COMPARISON */}
      {stateComparisonData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow mt-8 border">
          <h2 className="text-xl font-semibold mb-1">
            State-wise Price Comparison – {commodity}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Month: <b>{selectedMonthName}</b> | Year: <b>{year}</b>
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stateComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="state" interval={0} angle={-20} height={70} textAnchor="end" />
              <YAxis />
              <Tooltip formatter={(v) => [`₹ ${v} / Quintal`, "Price"]} />
              <Legend />
              <Bar dataKey="price" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}