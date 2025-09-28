import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

const DailyReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openBills, setOpenBills] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  const fetchDailyReport = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/report/daily`);
      setReport(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch daily report");
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/report/save`, report);
      await fetchDailyReport();
      alert("Daily report saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save daily report");
    }
    setSaving(false);
  };

  const toggleBill = (billId) => {
    setOpenBills((prev) =>
      prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]
    );
  };

  const toggleOrder = (orderId) => {
    setOpenOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleCancelBill = async (billId) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        await axios.delete(`${API_BASE_URL}/bills/cancel/${billId}`);
        alert("Bill deleted successfully!");
        fetchDailyReport();
      } catch (err) {
        console.error(err);
        alert("Failed to delete bill");
      }
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, []);

  if (loading) return <p className="text-gray-600 text-center">Loading report...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!report) return <p className="text-gray-600 text-center">No data available.</p>;

  const normalBills = report.bills.filter((bill) => !bill.order);
  const orderBills = report.bills.filter((bill) => bill.order);

  const renderBillItems = (billId) => {
    const items = report.orderItems.filter((item) => item.billId?._id === billId);
    if (items.length === 0) return <p className="text-gray-500">No items found.</p>;
    return (
      <Table
        headers={["Item Name", "Quantity", "Rate", "Cost Price", "Total", "Created At"]}
        rows={items.map((item) => [
          item.itemName,
          item.itemQuantity,
          item.itemRate,
          item.costPrice,
          item.total,
          new Date(item.createdAt).toLocaleString(),
        ])}
      />
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          📊 Daily Report - <span className="text-indigo-600">{report.date}</span>
        </h1>
        <button
          onClick={handleSaveReport}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save / Update Report"}
        </button>
      </div>

      {/* Attendance */}
      <Card title="Attendance">
        {report.attendance.length === 0 ? (
          <p className="text-gray-500">No attendance recorded.</p>
        ) : (
          <Table
            headers={["Employee", "In Time", "Out Time", "OT Hours", "Daily Salary"]}
            rows={report.attendance.map((att) => [
              att.employeeId?.name,
              att.inTime,
              att.outTime,
              att.otHours,
              att.dailySalary,
            ])}
          />
        )}
      </Card>

      {/* Advances */}
      <Card title="Advances">
        {report.advances.length === 0 ? (
          <p className="text-gray-500">No advances recorded.</p>
        ) : (
          <Table
            headers={["Employee", "Amount"]}
            rows={report.advances.map((adv) => [
              adv.employeeId?.name,
              adv.amount,
            ])}
          />
        )}
      </Card>

      {/* Bills */}
      <Card title="Bills">
        {normalBills.length === 0 ? (
          <p className="text-gray-500">No bills recorded.</p>
        ) : (
          normalBills.map((bill) => (
            <div
              key={bill._id}
              className="group border rounded-xl bg-white shadow-sm p-4 mb-3 relative cursor-pointer"
              onClick={() => toggleBill(bill._id)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">
                  Bill No: <span className="text-indigo-600">{bill.billNo}</span>
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Total: {bill.billTotal} | Paid: {bill.paidAmount}
                  </span>
                  <FaTrash
                    className="text-red-500 hover:text-red-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelBill(bill._id);
                    }}
                  />
                </div>
              </div>
              {openBills.includes(bill._id) && <div className="mt-3">{renderBillItems(bill._id)}</div>}
            </div>
          ))
        )}
      </Card>

      {/* Orders */}
      <Card title="Orders">
        {report.orders.length === 0 ? (
          <p className="text-gray-500">No orders recorded.</p>
        ) : (
          report.orders.map((order) => {
            const billsForThisOrder = orderBills.filter(
              (bill) => bill.order?._id === order._id
            );
            return (
              <div key={order._id} className="border rounded-xl bg-white shadow-sm p-4 mb-4">
                <div className="cursor-pointer" onClick={() => toggleOrder(order._id)}>
                  <h3 className="font-semibold text-gray-700 mb-1">
                    Customer: <span className="text-indigo-600">{order.customerId?.name}</span> | Amount: {order.orderAmount} | Balance: {order.balance}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Status: {order.orderStatus} | Payment: {order.paymentStatus} | Fixing:{" "}
                    {new Date(order.fixingDate).toLocaleDateString()}
                  </p>
                </div>

                {openOrders.includes(order._id) &&
                  (billsForThisOrder.length > 0 ? (
                    <div className="mt-3">
                      <h4 className="font-semibold text-gray-700 mb-2">Bills</h4>
                      {billsForThisOrder.map((bill) => (
                        <div
                          key={bill._id}
                          className="border rounded p-3 mb-2 cursor-pointer"
                          onClick={() => toggleBill(bill._id)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                              Bill No: <span className="text-indigo-600">{bill.billNo}</span>
                            </span>
                            <span className="text-sm text-gray-500">
                              Total: {bill.billTotal} | Paid: {bill.paidAmount}
                            </span>
                          </div>
                          {openBills.includes(bill._id) && <div className="mt-2">{renderBillItems(bill._id)}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-gray-500">No bills found for this order.</p>
                  ))}
              </div>
            );
          })
        )}
      </Card>

      {/* Supplier Bills */}
      <Card title="Supplier Bills">
        {report.supplierBills.length === 0 ? (
          <p className="text-gray-500">No supplier bills recorded.</p>
        ) : (
          report.supplierBills.map((bill) => (
            <div key={bill._id} className="border rounded-xl bg-white shadow-sm p-4 mb-3">
              <h3 className="font-semibold text-gray-700">
                Supplier: <span className="text-indigo-600">{bill.supplier?.name}</span> - Total Bill: {bill.totalBill} - Paid: {bill.paidAmount}
              </h3>
              <Table
                headers={["Item Name", "Type", "Color", "Quantity", "Cost", "Sell Price"]}
                rows={bill.items.map((item) => [
                  item.itemName,
                  item.itemType,
                  item.itemColor,
                  item.quantity,
                  item.cost,
                  item.sellPrice,
                ])}
              />
            </div>
          ))
        )}
      </Card>

      {/* Paid Bills */}
      <Card title="Paid Bills">
        {report.paidBills.length === 0 ? (
          <p className="text-gray-500">No paid bills recorded.</p>
        ) : (
          report.paidBills.map((paid) => (
            <div key={paid._id} className="border rounded-xl bg-white shadow-sm p-4 mb-3">
              <h3 className="font-semibold text-gray-700">
                Supplier:{" "}
                <span className="text-indigo-600">{paid.supplierBill?.supplier?.name}</span> - Paid Amount:{" "}
                {paid.paidAmount} - Paid Date: {new Date(paid.paidDate).toLocaleDateString()}
              </h3>
            </div>
          ))
        )}
      </Card>

      {/* Expenses */}
      <Card title="Expenses">
        {report.expenses.length === 0 ? (
          <p className="text-gray-500">No expenses recorded.</p>
        ) : (
          <Table
            headers={["Name", "Amount", "Date"]}
            rows={report.expenses.map((exp) => [
              exp.name,
              exp.amount,
              new Date(exp.date).toLocaleString(),
            ])}
          />
        )}
      </Card>
    </div>
  );
};

const Card = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
    <div className="bg-white rounded-xl shadow-md p-4">{children}</div>
  </section>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          {headers.map((header, idx) => (
            <th key={idx} className="border px-3 py-2 text-left text-sm font-semibold text-gray-700">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {rows.map((row, idx) => (
          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            {row.map((cell, i) => (
              <td key={i} className="border px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DailyReport;
