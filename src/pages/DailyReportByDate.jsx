import React, { useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

const DailyReportByDate = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [openBills, setOpenBills] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  // Fetch report for selected date
  const fetchReportByDate = async () => {
    if (!selectedDate) {
      setError("Please select a date first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/report/${selectedDate}`
      );
      setReport(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch report for this date");
      setReport(null);
    } finally {
      setLoading(false);
    }
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
        fetchReportByDate();
      } catch (err) {
        console.error(err);
        alert("Failed to delete bill");
      }
    }
  };

  const normalBills = report?.bills?.filter((bill) => !bill.orderId) || [];
  const orderBills = report?.bills?.filter((bill) => bill.orderId) || [];

const renderBillItems = (billId) => {
  const items = report.orderItems.filter(item => item.billId === billId);

  if (items.length === 0) return <p className="text-gray-500">No items found.</p>;

  return (
    <Table
      headers={["Item Name", "Quantity", "Rate", "Cost Price", "Total", "Created At"]}
      rows={items.map(item => [
        item.itemName,
        item.itemQuantity,
        item.itemRate,
        item.costPrice,
        item.total,
        new Date(item.createdAt).toLocaleString()
      ])}
    />
  );
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Date Picker */}
      <div className="flex gap-3 items-center mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={fetchReportByDate}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Get Report
        </button>
      </div>

      {loading && <p className="text-gray-600 text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {!loading && !error && !report && (
        <p className="text-gray-600 text-center">Select a date to view the report.</p>
      )}

      {report && (
        <>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            📊 Daily Report -{" "}
            <span className="text-indigo-600">
              {new Date(report.date).toLocaleDateString()}
            </span>
          </h1>

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
                headers={["Employee", "Amount", "Date"]}
                rows={report.advances.map((adv) => [
                  adv.employeeId?.name,
                  adv.amount,
                  new Date(adv.date).toLocaleString(),
                ])}
              />
            )}
          </Card>

          {/* Bills (Expandable) */}
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
                      Bill ID: <span className="text-indigo-600">{bill._id}</span>
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Total: {bill.billTotal} | Paid: {bill.paidAmount}
                      </span>
                      <FaTrash
                        className="text-red-500 hover:text-red-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent toggle
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

          {/* Orders (Expandable with their bills) */}
          <Card title="Orders">
            {report.orders.length === 0 ? (
              <p className="text-gray-500">No orders recorded.</p>
            ) : (
              report.orders.map((order) => {
                const orderBillsForThisOrder = orderBills.filter(
                  (bill) => bill.orderId?._id === order._id
                );
                return (
                  <div key={order._id} className="border rounded-xl bg-white shadow-sm p-4 mb-4">
                    <div className="cursor-pointer" onClick={() => toggleOrder(order._id)}>
                      <h3 className="font-semibold text-gray-700 mb-1">
                        Customer: <span className="text-indigo-600">{order.customerId?.name}</span> | Amount: {order.orderAmount} | Balance: {order.balance}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Status: {order.orderStatus} | Payment: {order.paymentStatus} | Fixing: {new Date(order.fixingDate).toLocaleDateString()}
                      </p>
                    </div>

                    {openOrders.includes(order._id) &&
                      (orderBillsForThisOrder.length > 0 ? (
                        <div className="mt-3">
                          <h4 className="font-semibold text-gray-700 mb-2">Bills</h4>
                          {orderBillsForThisOrder.map((bill) => (
                            <div
                              key={bill._id}
                              className="border rounded p-3 mb-2 cursor-pointer"
                              onClick={() => toggleBill(bill._id)}
                            >
                              <div className="flex justify-between items-center">
                                <span>Bill ID: {bill._id}</span>
                                <span>Total: {bill.billTotal} | Paid: {bill.paidAmount}</span>
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
                    Supplier: <span className="text-indigo-600">{paid.supplierBill?.supplier?.name}</span> - Paid Amount: {paid.paidAmount} - Paid Date: {new Date(paid.paidDate).toLocaleDateString()}
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
        </>
      )}
    </div>
  );
};

// Reusable Card Component
const Card = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
    <div className="bg-white rounded-xl shadow-md p-4">{children}</div>
  </section>
);

// Reusable Table Component
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

export default DailyReportByDate;
