import React, { useState, useEffect } from "react";
import axios from "axios";

const ExpenseTracker = () => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    description: "",
  });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  // Fetch today's expenses from backend
  useEffect(() => {
    fetchTodayExpenses();
  }, []);

  const fetchTodayExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/expenses/today`);
      setExpenses(res.data.data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this expense?")) return;

  try {
    await axios.delete(`${API_BASE_URL}/expenses/${id}`);
    fetchTodayExpenses(); // Refresh list
  } catch (err) {
    console.error("Error deleting expense:", err);
    alert("Failed to delete expense");
  }
};

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add expense (send to backend)
  const handleAddExpense = async () => {
    if (!form.category || !form.amount) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/expenses`, {
        name: form.category,
        amount: parseFloat(form.amount),
      });

      // Refresh list
      fetchTodayExpenses();

      // Reset form
      setForm({ category: "", amount: "", description: "" });
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to save expense");
    }
  };

  // Calculate today's total
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Daily Expense Tracker</h1>

      {/* Add Form */}
      <div className="bg-gray-100 p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Expense (Today: {today})</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={handleAddExpense}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Add Expense
        </button>
      </div>

      {/* Today's Expense List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Today's Expenses ({today})</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500">No expenses added today.</p>
        ) : (
<table className="w-full border">
  <thead>
    <tr className="bg-gray-200">
      <th className="p-2 border">Category</th>
      <th className="p-2 border">Amount</th>
      <th className="p-2 border">Action</th> {/* ✅ New column */}
    </tr>
  </thead>
  <tbody>
    {expenses.map((exp) => (
      <tr key={exp._id}>
        <td className="p-2 border">{exp.name}</td>
        <td className="p-2 border">Rs. {exp.amount}</td>
        <td className="p-2 border text-center">
          <button
            onClick={() => handleDelete(exp._id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

        )}

        <h3 className="text-right mt-6 text-xl font-bold text-blue-700">
          Total Today: Rs. {total}
        </h3>
      </div>
    </div>
  );
};

export default ExpenseTracker;
