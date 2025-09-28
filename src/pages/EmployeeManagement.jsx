import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EmployeeDaily() {
  const today = new Date().toISOString().slice(0, 10);

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, emp: null }); // ✅ edit modal
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    address: "",
    mobile: "",
    dailyRate: "",
    otRate: "",
  });

  const [advanceModal, setAdvanceModal] = useState({ open: false, emp: null });
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [date, setDate] = useState(today);

  // Fetch employees
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/employees`)
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  // --- Attendance local storage logic ---
  useEffect(() => {
    const savedDate = localStorage.getItem("attendanceDate");
    const savedAttendance = localStorage.getItem("attendance");

    if (savedDate === today && savedAttendance) {
      setAttendance(JSON.parse(savedAttendance));
    } else {
      localStorage.removeItem("attendance");
      localStorage.setItem("attendanceDate", today);
      setAttendance({});
    }
  }, [today]);

  useEffect(() => {
    localStorage.setItem("attendance", JSON.stringify(attendance));
    localStorage.setItem("attendanceDate", today);
  }, [attendance, today]);

  const handleChange = (id, field, value) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const calculateSalary = (empId) => {
    const emp = employees.find((e) => e._id === empId);
    if (!emp) return 0;
    const att = attendance[empId];
    if (!att || !att.inTime || !att.outTime) return 0;

    const [inH, inM] = att.inTime.split(":").map(Number);
    const [outH, outM] = att.outTime.split(":").map(Number);
    let hoursWorked = outH + outM / 60 - (inH + inM / 60);
    if (hoursWorked < 0) hoursWorked = 0;

    let baseSalary = 0;
    if (hoursWorked > 7) baseSalary = emp.dailyRate;
    else if (hoursWorked >= 4) baseSalary = emp.dailyRate / 2;

    const otSalary = (att.otHours || 0) * (emp.otRate || emp.dailyRate / 8);
    return (baseSalary + otSalary).toFixed(2);
  };

  // Save daily attendance
  const handleSaveAttendance = async () => {
    try {
      const records = Object.entries(attendance).map(([empId, att]) => ({
        employeeId: empId,
        inTime: att.inTime,
        outTime: att.outTime,
        otHours: att.otHours || 0,
      }));

      await axios.post(`${API_BASE_URL}/attendance/bulk`, { date, records });
      alert("Attendance saved successfully ✅");

      localStorage.removeItem("attendance");
      setAttendance({});
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance ❌");
    }
  };

  // Add employee
  const handleNewEmployeeChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/employees`, newEmployee);
      setEmployees([...employees, res.data]);
      setShowModal(false);
      setNewEmployee({ name: "", address: "", mobile: "", dailyRate: "", otRate: "" });
    } catch (err) {
      console.error("Error adding employee:", err);
      alert("Failed to add employee ❌");
    }
  };

  // Save advance
  const handleSaveAdvance = async () => {
    if (!advanceAmount || !advanceModal.emp) return;
    try {
      await axios.post(`${API_BASE_URL}/advances`, {
        employeeId: advanceModal.emp._id,
        amount: advanceAmount,
        date,
      });
      alert(`Advance of LKR ${advanceAmount} saved for ${advanceModal.emp.name}`);
      setAdvanceModal({ open: false, emp: null });
      setAdvanceAmount("");
    } catch (err) {
      console.error("Error saving advance:", err);
      alert("Failed to save advance ❌");
    }
  };

  // ✅ Update employee
  const handleUpdateEmployee = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/employees/${editModal.emp._id}`, editModal.emp);
      setEmployees((prev) =>
        prev.map((emp) => (emp._id === res.data._id ? res.data : emp))
      );
      setEditModal({ open: false, emp: null });
      alert("Employee updated successfully ✅");
    } catch (err) {
      console.error("Error updating employee:", err);
      alert("Failed to update employee ❌");
    }
  };
  // ✅ Delete employee
  const handleDeleteEmployee = async (empId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/employees/${empId}`);
      setEmployees((prev) => prev.filter((emp) => emp._id !== empId));
      alert("Employee deleted successfully ✅");
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Failed to delete employee ❌");
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Employee Daily Attendance</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Employee
        </button>
      </div>

      {/* Date Selector */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Select Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto shadow-md rounded-lg border">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3 text-left border-b">Name</th>
              <th className="p-3 text-right border-b">Rate/Day</th>
              <th className="p-3 text-center border-b">In Time</th>
              <th className="p-3 text-center border-b">Out Time</th>
              <th className="p-3 text-center border-b">OT Hours</th>
              <th className="p-3 text-right border-b">Salary (LKR)</th>
              <th className="p-3 text-center border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="p-3 border-b">{emp.name}</td>
                <td className="p-3 border-b text-right">{emp.dailyRate}</td>
                <td className="p-3 border-b">
                  <input
                    type="time"
                    value={attendance[emp._id]?.inTime || ""}
                    onChange={(e) => handleChange(emp._id, "inTime", e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="p-3 border-b">
                  <input
                    type="time"
                    value={attendance[emp._id]?.outTime || ""}
                    onChange={(e) => handleChange(emp._id, "outTime", e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="p-3 border-b">
                  <input
                    type="number"
                    min="0"
                    value={attendance[emp._id]?.otHours || 0}
                    onChange={(e) =>
                      handleChange(emp._id, "otHours", parseFloat(e.target.value))
                    }
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="p-3 border-b text-right font-semibold">
                  {calculateSalary(emp._id)}
                </td>
                <td className="p-3 border-b text-center space-x-2">
                  <button
                    onClick={() => setAdvanceModal({ open: true, emp })}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  >
                    + Advance
                  </button>
                  <button
                    onClick={() => setEditModal({ open: true, emp: { ...emp } })}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Attendance */}
      <button
        onClick={handleSaveAttendance}
        className="mt-6 w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
      >
        Save Daily Attendance
      </button>

      {/* --- Add Employee Modal --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <input type="text" name="name" placeholder="Name" value={newEmployee.name} onChange={handleNewEmployeeChange} className="w-full p-2 border rounded" required />
              <input type="text" name="address" placeholder="Address" value={newEmployee.address} onChange={handleNewEmployeeChange} className="w-full p-2 border rounded" />
              <input type="text" name="mobile" placeholder="Mobile" value={newEmployee.mobile} onChange={handleNewEmployeeChange} className="w-full p-2 border rounded" />
              <input type="number" name="dailyRate" placeholder="Daily Rate" value={newEmployee.dailyRate} onChange={handleNewEmployeeChange} className="w-full p-2 border rounded" required />
              <input type="number" name="otRate" placeholder="OT Rate (per hour)" value={newEmployee.otRate} onChange={handleNewEmployeeChange} className="w-full p-2 border rounded" />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Advance Modal --- */}
      {advanceModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold mb-4">Add Advance - {advanceModal.emp.name}</h2>
            <input type="number" placeholder="Advance Amount" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="w-full border p-2 rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdvanceModal({ open: false, emp: null })} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
              <button onClick={handleSaveAdvance} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Employee Modal --- */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
            <form className="space-y-3">
              <input type="text" name="name" value={editModal.emp.name} onChange={(e) => setEditModal({ ...editModal, emp: { ...editModal.emp, name: e.target.value } })} className="w-full p-2 border rounded" required />
              <input type="text" name="address" value={editModal.emp.address} onChange={(e) => setEditModal({ ...editModal, emp: { ...editModal.emp, address: e.target.value } })} className="w-full p-2 border rounded" />
              <input type="text" name="mobile" value={editModal.emp.mobile} onChange={(e) => setEditModal({ ...editModal, emp: { ...editModal.emp, mobile: e.target.value } })} className="w-full p-2 border rounded" />
              <input type="number" name="dailyRate" value={editModal.emp.dailyRate} onChange={(e) => setEditModal({ ...editModal, emp: { ...editModal.emp, dailyRate: e.target.value } })} className="w-full p-2 border rounded" required />
              <input type="number" name="otRate" value={editModal.emp.otRate} onChange={(e) => setEditModal({ ...editModal, emp: { ...editModal.emp, otRate: e.target.value } })} className="w-full p-2 border rounded" />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, emp: null })} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
                <button type="button" onClick={handleUpdateEmployee} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
