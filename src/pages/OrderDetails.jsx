import React, { useEffect, useState } from "react";
import OrderModal from "../components/OrderModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function OrderDetails() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    customerName: "",
    orderStatus: "",
    paymentStatus: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/details`);
        const data = await res.json();

        // Ensure we only sort if createdAt exists
        const sortedOrders = [...data].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA; // latest first
        });

        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };
    fetchOrders();
  }, []);


  // --- Filter orders whenever filters change ---

  useEffect(() => {
    let result = [...orders];

    if (filters.customerName) {
      result = result.filter(order =>
        order.customer?.name?.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }
    if (filters.orderStatus) {
      result = result.filter(order => order.orderStatus === filters.orderStatus);
    }
    if (filters.paymentStatus) {
      result = result.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    // --- Sort filtered orders by createdAt (latest first) ---
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(result);
  }, [filters, orders]);

  const handleRowClick = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Order Details</h1>

      {/* --- Filters --- */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block mb-1 font-semibold">Customer Name</label>
          <input
            type="text"
            placeholder="Search by customer name"
            className="w-full p-2 border rounded"
            value={filters.customerName}
            onChange={e => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
          />
        </div>

        <div className="flex-1">
          <label className="block mb-1 font-semibold">Order Status</label>
          <select
            className="w-full p-2 border rounded"
            value={filters.orderStatus}
            onChange={e => setFilters(prev => ({ ...prev, orderStatus: e.target.value }))}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block mb-1 font-semibold">Payment Status</label>
          <select
            className="w-full p-2 border rounded"
            value={filters.paymentStatus}
            onChange={e => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
        </div>
      </div>

      {/* --- Orders Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 && (
          <div className="text-gray-500 col-span-full">No orders found.</div>
        )}

        {filteredOrders.map((order) => (
          <div
            key={order._id}
            onClick={() => handleRowClick(order._id)}
            className="cursor-pointer bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition"
          >
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-semibold text-gray-700">Customer:</span>{" "}
                <span className="text-gray-600">{order.customer?.name || "-"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Address:</span>{" "}
                <span className="text-gray-600">{order.customer?.address || "-"}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <div>
                  <span className="font-semibold text-gray-700">Mobile 1:</span>{" "}
                  <span className="text-gray-600">{order.customer?.mobile1 || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Mobile 2:</span>{" "}
                  <span className="text-gray-600">{order.customer?.mobile2 || "-"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2 py-1 rounded-full text-white text-sm ${order.orderStatus === "pending" ? "bg-yellow-500" : order.orderStatus === "completed" ? "bg-green-500" : "bg-red-500"}`}>
                  {order.orderStatus}
                </span>
                <span className={`px-2 py-1 rounded-full text-white text-sm ${order.paymentStatus === "unpaid" ? "bg-red-500" : "bg-green-500"}`}>
                  {order.paymentStatus}
                </span>
                <span className="px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-sm">
                  {order.fixingDate ? new Date(order.fixingDate).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <OrderModal
        orderId={selectedOrderId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderUpdated={(id, updatedOrder) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === id ? { ...o, ...updatedOrder } : o))
          );
          setFilteredOrders((prev) =>
            prev.map((o) => (o._id === id ? { ...o, ...updatedOrder } : o))
          );
        }}
      />
    </div>
  );
}
