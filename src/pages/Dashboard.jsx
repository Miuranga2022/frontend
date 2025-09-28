// Dashboard.jsx (updated profit calculation)
import React, { useEffect, useState } from "react";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaBox,
  FaClock,
  FaCoins,
  FaBalanceScale,
  FaWallet,
  FaDollarSign,
} from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [payments, setPayments] = useState([]); // bills/payments
  const [orderItems, setOrderItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, inventoryRes, paymentsRes, orderItemsRes, expensesRes] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/orders/details`),
            axios.get(`${API_BASE_URL}/stock`),
            axios.get(`${API_BASE_URL}/bills`),
            axios.get(`${API_BASE_URL}/order-items`),
            axios.get(`${API_BASE_URL}/expenses/today`),
          ]);

        setOrders(ordersRes.data);
        setInventory(inventoryRes.data);
        setPayments(paymentsRes.data);
        setOrderItems(orderItemsRes.data);

        if (expensesRes.data.success) {
          setExpenses(expensesRes.data.data);
          setTotalExpenses(expensesRes.data.total);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Helper to safely extract billId from an orderItem (supports object or string)
  const getBillIdFromItem = (item) => {
    if (!item) return null;
    if (typeof item.billId === "string") return item.billId;
    if (item.billId && typeof item.billId === "object") return item.billId._id || null;
    return null;
  };

  // Daily calculations
  const dailyBills = payments.filter((p) => {
    const date = new Date(p.createdAt);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  });

  // Daily sell (sum of paidAmount for today's bills) — unchanged
  const dailySell = dailyBills.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0);

  // ----- NEW: Correct dailyProfit calculation that accounts for bill-level discounts -----
  // For each bill today: find its items, compute subtotal, compute discount amount,
  // allocate discount proportionally to items, then sum (revenueAfterDiscount - cost).
  const dailyProfit = dailyBills.reduce((profitAcc, bill) => {
    // find items that belong to this bill
    const billItems = orderItems.filter((it) => {
      const bId = getBillIdFromItem(it);
      // some orderItems may embed billId as object or string; compare with bill._id
      return bId && String(bId) === String(bill._id);
    });

    if (billItems.length === 0) return profitAcc; // nothing to compute

    // subtotal (use item.total when available, otherwise itemRate * qty)
    const subTotal = billItems.reduce((s, it) => {
      const itemTotal = Number(it.total ?? (it.itemRate * (it.itemQuantity ?? 0))) || 0;
      return s + itemTotal;
    }, 0);

    // treat bill.discount as percentage (as in your quickSell) — if it's absolute amount change logic
    const discountPercent = Number(bill.discount) || 0;
    const discountAmount = (subTotal * discountPercent) / 100;

    // allocate discount proportionally and compute profit per item
    let billProfit = 0;
    for (const it of billItems) {
      const itemQty = Number(it.itemQuantity) || 0;
      const itemRate = Number(it.itemRate) || 0;
      const itemTotal = Number(it.total ?? (itemRate * itemQty)) || 0;
      const itemShare = subTotal > 0 ? itemTotal / subTotal : 0;
      const itemDiscount = discountAmount * itemShare; // portion of the bill discount for this item
      const revenueAfterDiscount = itemTotal - itemDiscount;
      const costPerUnit = Number(it.costPrice ?? it.cost ?? 0) || 0;
      const totalCost = costPerUnit * itemQty;
      billProfit += revenueAfterDiscount - totalCost;
    }

    return profitAcc + billProfit;
  }, 0);

  // Net daily profit after today's expenses
  const netDailyProfit = dailyProfit - totalExpenses;

  // --- Overall stats (unchanged) ---
  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
  const totalSales = orders.reduce((sum, o) => sum + (Number(o.orderAmount) || 0), 0);
  const pendingBalance = orders.reduce((sum, o) => sum + (Number(o.balance) || 0), 0);

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Daily Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Daily Sell" value={dailySell} icon={<FaMoneyBillWave />} color="green" />
        <Card title="Daily Profit" value={dailyProfit} icon={<FaChartLine />} color="blue" />
        <Card title="Daily Expenses" value={totalExpenses} icon={<FaWallet />} color="red" />
        <Card title="Net Daily Profit" value={netDailyProfit} icon={<FaDollarSign />} color="purple" />
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Today Orders" value={todayOrders.length} icon={<FaBox />} color="orange" />
        <Card title="Pending Orders" value={pendingOrders} icon={<FaClock />} color="red" />
        <Card title="Total Sales" value={totalSales} icon={<FaCoins />} color="blue" />
        <Card title="Pending Balance" value={pendingBalance} icon={<FaBalanceScale />} color="gray" />
      </div>

      {/* Low Stock Items */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Low Stock Items</h2>
        <ul className="space-y-2">
          {inventory.filter((i) => i.quantity < 20).map((i) => (
            <li key={i._id} className="flex justify-between items-center">
              <span>{i.itemName}</span>
              <span
                className={`px-2 py-1 rounded-full text-white text-xs ${
                  i.quantity <= 5 ? "bg-red-500" : "bg-yellow-400"
                }`}
              >
                {i.quantity}
              </span>
            </li>
          ))}
          {inventory.filter((i) => i.quantity < 20).length === 0 && (
            <li className="text-gray-500">No low stock items</li>
          )}
        </ul>
      </div>

      {/* Today's Expenses */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Today's Expenses</h2>
        {expenses.length > 0 ? (
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-right">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-gray-50">
                  <td className="p-2 border">{exp.name}</td>
                  <td className="p-2 border text-right">{exp.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td className="p-2 border">Total</td>
                <td className="p-2 border text-right">{totalExpenses.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-gray-500">No expenses recorded today.</p>
        )}
      </div>

      {/* Upcoming / Fixing Orders */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Fixing Orders (Upcoming)</h2>
        {orders.filter(o => o.orderStatus !== "completed").length > 0 ? (
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Customer Name</th>
                <th className="p-2 border text-left">Fixing Date</th>
                <th className="p-2 border text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => o.orderStatus !== "completed")
                .sort((a, b) => new Date(a.fixingDate) - new Date(b.fixingDate))
                .map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="p-2 border">{o.customer?.name || "Unknown"}</td>
                    <td className="p-2 border">{new Date(o.fixingDate).toLocaleDateString()}</td>
                    <td className="p-2 border capitalize">{o.orderStatus}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No upcoming fixing orders.</p>
        )}
      </div>
    </div>
  );
}

// Card Component (small safety: convert value to number before toLocaleString)
function Card({ title, value, icon, color }) {
  const colors = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-700",
  };

  const numericValue = Number(value) || 0;

  return (
    <div className={`p-4 rounded-xl shadow flex items-center gap-4 ${colors[color]}`}>
      <div className="text-3xl">{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm">{title}</span>
        <span className="text-2xl font-bold">{numericValue.toLocaleString()}</span>
      </div>
    </div>
  );
}
