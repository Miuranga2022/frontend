import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react"; // ✅ nice trash icon

const StockList = () => {
  const [stock, setStock] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchStock();
  }, [filter]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  const fetchStock = async () => {
    try {
      let url = `${API_BASE_URL}/stock`;
      if (filter !== "All") {
        url += `?itemType=${filter}`;
      }
      const res = await axios.get(url);
      setStock(res.data);
    } catch (err) {
      console.error("Error fetching stock:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/stock/${id}`);
      setStock(stock.filter((item) => item._id !== id)); // ✅ update UI
    } catch (err) {
      console.error("Error deleting stock:", err);
      alert("Failed to delete item");
    }
  };

  const getQuantityColor = (qty) => {
    if (qty > 50) return "bg-green-100 text-green-800";
    if (qty >= 20 && qty <= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Stock Items
      </h1>

      {/* Filter Dropdown */}
      <div className="mb-6 flex justify-end">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All</option>
          <option value="Curtain">Curtain</option>
          <option value="Poles">Poles</option>
          <option value="Other Accessories">Other Accessories</option>
        </select>
      </div>

      {stock.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-lg border">
          <table className="w-full min-w-max border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left border-b">Item Name</th>
                <th className="p-3 text-left border-b">Type</th>
                <th className="p-3 text-left border-b">Color</th>
                <th className="p-3 text-center border-b">Quantity</th>
                <th className="p-3 text-right border-b">Cost</th>
                <th className="p-3 text-right border-b">Sell Price</th>
                <th className="p-3 text-center border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="p-3 border-b">{item.itemName}</td>
                  <td className="p-3 border-b">{item.itemType}</td>
                  <td className="p-3 border-b">{item.itemColor || "-"}</td>
                  <td
                    className={`p-3 border-b font-semibold text-center rounded ${getQuantityColor(
                      item.quantity
                    )}`}
                  >
                    {item.quantity}
                  </td>
                  <td className="p-3 border-b text-right">Rs. {item.cost}</td>
                  <td className="p-3 border-b text-right">Rs. {item.sellPrice}</td>
                  <td className="p-3 border-b text-center">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-6 text-lg">
          No stock available for{" "}
          <span className="font-semibold">{filter}</span>.
        </p>
      )}
    </div>
  );
};

export default StockList;
