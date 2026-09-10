import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";

export default function MarketPrices() {
  const { t } = useTranslation();

  // Filter States
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [markets, setMarkets] = useState([]);

  // Selection States
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");

  // Data States
  const [priceData, setPriceData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/prices/commodities")
      .then((res) => setCommodities(res.data.data));
    axios
      .get("http://localhost:5000/api/prices/states")
      .then((res) => setStates(res.data.data));
  }, []);

  const loadDistricts = (state) =>
    axios
      .get("http://localhost:5000/api/prices/districts", { params: { state } })
      .then((res) => setDistricts(res.data.data));

  const loadMarkets = (state, district) => {
    if (!state || !district) {
      setMarkets([]);
      return;
    }
    axios
      .get("http://localhost:5000/api/prices/markets", {
        params: { state, district },
      })
      .then((res) => setMarkets(res.data.data))
      .catch(() => setMarkets([]));
  };

  const fetchPrices = async (newPage = 1) => {
    const res = await axios.get("http://localhost:5000/api/prices", {
      params: {
        commodity: selectedCommodity,
        state: selectedState,
        district: selectedDistrict,
        market: selectedMarket,
        page: newPage,
        limit: 50,
      },
    });
    setPriceData(res.data.data);
    setTotalPages(res.data.totalPages);
    setPage(newPage);
  };

  const fetchTrend = async () => {
    if (!selectedCommodity) {
      setTrendData([]);
      return;
    }
    const res = await axios.get("http://localhost:5000/api/prices/trend", {
      params: {
        commodity: selectedCommodity,
        state: selectedState,
        district: selectedDistrict,
        market: selectedMarket,
      },
    });
    setTrendData(res.data.data.slice(-300));
  };

  const clearFilters = () => {
    setSelectedCommodity("");
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedMarket("");
    setDistricts([]);
    setMarkets([]);
    setPriceData([]);
    setTrendData([]);
    setPage(1);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-3xl">trending_up</span>
        <h1 className="text-2xl font-bold">{t("marketPrices.title")}</h1>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <select
          className="border p-2 rounded"
          value={selectedCommodity}
          onChange={(e) => setSelectedCommodity(e.target.value)}
        >
          <option value="">{t("common.commodity")}</option>
          {commodities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={selectedState}
          onChange={(e) => {
            const state = e.target.value;
            setSelectedState(state);
            setSelectedDistrict("");
            setSelectedMarket("");
            setMarkets([]);
            loadDistricts(state);
          }}
        >
          <option value="">{t("common.state")}</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={selectedDistrict}
          onChange={(e) => {
            const district = e.target.value;
            setSelectedDistrict(district);
            loadMarkets(selectedState, district);
          }}
        >
          <option value="">{t("common.district")}</option>
          {districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={selectedMarket}
          onChange={(e) => setSelectedMarket(e.target.value)}
        >
          <option value="">{t("common.market")}</option>
          {markets.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            fetchPrices(1);
            fetchTrend();
          }}
          className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700"
        >
          {t("common.search")}
        </button>
        <button
          onClick={clearFilters}
          className="bg-gray-500 text-white px-6 py-2 rounded font-medium hover:bg-gray-600"
        >
          {t("common.clearFilters")}
        </button>
        <span className="text-gray-600">
          {priceData.length} {t("common.rows")}
        </span>
      </div>

      {/* TREND CHART */}
      {trendData.length > 0 && (
        <div className="mb-10 bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="text-2xl mb-5 font-semibold">
            {t("marketPrices.trendTitle")}
          </h2>
          <div className="w-full overflow-x-auto">
            <LineChart width={1000} height={400} data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  });
                }}
                interval={Math.ceil(trendData.length / 8)}
                label={{
                  value: t("common.date"),
                  position: "insideBottom",
                  dy: 10,
                }}
              />
              <YAxis
                label={{
                  value: t("marketPrices.priceYAxis"),
                  angle: -90,
                  position: "insideLeft",
                  dx: -10,
                }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `₹${value}`,
                  {
                    max_price: "Max",
                    min_price: "Min",
                    modal_price: "Modal",
                  }[name] || name,
                ]}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                }
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="max_price"
                stroke="#dc2626"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="min_price"
                stroke="#1d4ed8"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="modal_price"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">{t("common.date")}</th>
              <th className="p-2 border">{t("common.state")}</th>
              <th className="p-2 border">{t("common.district")}</th>
              <th className="p-2 border">{t("common.market")}</th>
              <th className="p-2 border">{t("common.variety")}</th>
              <th className="p-2 border">{t("common.grade")}</th>
              <th className="p-2 border">{t("common.min")}</th>
              <th className="p-2 border">{t("common.modal")}</th>
              <th className="p-2 border">{t("common.max")}</th>
            </tr>
          </thead>
          <tbody>
            {priceData.map((p) => (
              <tr key={p.id} className="text-center hover:bg-gray-50">
                <td className="p-2 border">{p.date}</td>
                <td className="p-2 border">{p.state}</td>
                <td className="p-2 border">{p.district}</td>
                <td className="p-2 border">{p.market}</td>
                <td className="p-2 border">{p.variety}</td>
                <td className="p-2 border">{p.grade}</td>
                <td className="p-2 border">{p.min_price}</td>
                <td className="p-2 border font-bold text-green-700">
                  {p.modal_price}
                </td>
                <td className="p-2 border">{p.max_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          disabled={page === 1}
          onClick={() => fetchPrices(page - 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          {t("common.prev")}
        </button>
        <div className="px-4 py-2 font-medium">
          Page {page} / {totalPages}
        </div>
        <button
          disabled={page === totalPages}
          onClick={() => fetchPrices(page + 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}