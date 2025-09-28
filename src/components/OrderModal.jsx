// OrderModal.jsx
import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

// Badge colors based on status
const statusColors = {
  "pending": "bg-yellow-200 text-yellow-800",
  "in-progress": "bg-blue-200 text-blue-800",
  "completed": "bg-green-200 text-green-800"
};

const paymentColors = {
  "pending": "bg-red-200 text-red-800",
  "partial": "bg-yellow-200 text-yellow-800",
  "paid": "bg-green-200 text-green-800"
};

export default function OrderModal({ orderId, isOpen, onClose }) {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/details/${orderId}`);
        const data = await res.json();
        setOrder(data);
        setStatus(data.orderStatus);
      } catch (err) {
        console.error("Failed to fetch order:", err);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

    try {
      const res = await fetch(`${API_BASE_URL}/orders/update-status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      setOrder((prev) => ({ ...prev, orderStatus: newStatus }));
    } catch (err) {
      console.error(err);
      alert(err.message);
      setStatus(order?.orderStatus || "pending");
    }
  };

  const handleGenerateBill = async () => {
    if (!paymentAmount || paymentAmount <= 0) return alert("Enter a valid amount");

    setLoading(true);
    try {
      const billTotal = order.balance;
      const res = await fetch(`${API_BASE_URL}/bills/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paidAmount: Number(paymentAmount),
          billTotal,
          discount: 0,
          paymentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add payment");

      setOrder((prev) => ({
        ...prev,
        balance: data.order.balance,
        paymentStatus: data.order.paymentStatus,
        bills: [...prev.bills, data.bill],
      }));
      setPaymentAmount("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel order");

      alert("Order cancelled successfully!");
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 font-bold text-2xl"
          >
            &times;
          </button>
        </div>

        {!order ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Customer & Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info */}
              <section className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">Customer Info</h3>
                <p><span className="font-semibold">Name:</span> {order.customer?.name}</p>
                <p><span className="font-semibold">Address:</span> {order.customer?.address}</p>
                <p><span className="font-semibold">Mobile 1:</span> {order.customer?.mobile1}</p>
                <p><span className="font-semibold">Mobile 2:</span> {order.customer?.mobile2 || "-"}</p>
              </section>

              {/* Order Info */}
              <section className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">Order Info</h3>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className={`border rounded px-2 py-1 ${statusColors[status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </p>
                <p>
                  <span className="font-semibold">Payment Status:</span>{" "}
                  <span className={`px-2 py-1 rounded ${paymentColors[order.paymentStatus] || "bg-gray-200 text-gray-800"}`}>
                    {order.paymentStatus}
                  </span>
                </p>
                <p><span className="font-semibold">Fixing Date:</span> {order.fixingDate ? new Date(order.fixingDate).toLocaleDateString() : "-"}</p>
                <p><span className="font-semibold">Order Amount:</span> {order.orderAmount}</p>
                <p><span className="font-semibold">Balance:</span> {order.balance}</p>
              </section>
            </div>

            {/* Items */}
            <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Items</h3>
              {order.items.length === 0 ? (
                <p className="text-gray-500">No items</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-left">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 border">Item</th>
                        <th className="p-2 border">Quantity</th>
                        <th className="p-2 border">Rate</th>
                        <th className="p-2 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-100">
                          <td className="p-2 border">{item.itemName}</td>
                          <td className="p-2 border">{item.itemQuantity}</td>
                          <td className="p-2 border">{item.itemRate}</td>
                          <td className="p-2 border">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Bills */}
            <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Bills</h3>
              {order.bills.length === 0 ? (
                <p className="text-gray-500">No bills</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.bills.map((bill) => (
                    <div key={bill._id} className="p-3 border rounded-lg bg-white shadow-sm space-y-1 hover:shadow-md transition">
                      <p><span className="font-semibold">Bill Total:</span> {bill.billTotal}</p>
                      <p><span className="font-semibold">Paid Amount:</span> {bill.paidAmount}</p>
                      <p><span className="font-semibold">Discount:</span> {bill.discount}</p>
                      <p><span className="font-semibold">Payment Type:</span> {bill.paymentType}</p>
                      <p><span className="font-semibold">Date:</span> {new Date(bill.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment Section */}
            {order.balance > 0 && (
              <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Add Payment</h3>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="border rounded px-2 py-1 w-full sm:w-40"
                    max={order.balance}
                  />
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="border rounded px-2 py-1 w-full sm:w-40"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank-transfer">Bank Transfer</option>
                  </select>
                  <button
                    onClick={handleGenerateBill}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    {loading ? "Processing..." : "Generate Bill"}
                  </button>
                </div>
              </section>
            )}

            {/* Cancel Order Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
