import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MonthlyAttendance() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState([]);
  const [dates, setDates] = useState([]);

  const generateDates = (y, m) => {
    const numDays = new Date(y, m, 0).getDate();
    const arr = [];
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(dateStr).getDay();
      arr.push({ dateStr, dayOfWeek });
    }
    return arr;
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/month/${year}/${month}`);
      const data = await res.json();
      setAttendanceData(data);
      setDates(generateDates(year, month));
    } catch (err) {
      console.error("Error fetching monthly attendance:", err);
    }
  };

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [year, month]);

  const isWeekend = (dayOfWeek) => dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        📅 Monthly Attendance - {year}-{String(month).padStart(2, "0")}
      </h1>

      {/* Month & Year Selection */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="p-2 border rounded-lg w-28 shadow-sm"
          placeholder="Year"
        />
        <input
          type="number"
          value={month}
          min="1"
          max="12"
          onChange={(e) => setMonth(Number(e.target.value))}
          className="p-2 border rounded-lg w-20 shadow-sm"
          placeholder="Month"
        />
        <button
          onClick={fetchMonthlyAttendance}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto border rounded-xl shadow-md bg-white">
        <table className="table-auto border-collapse w-max min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 sticky top-0 z-10 text-gray-700 text-xs">
              <th className="border px-4 py-2 sticky left-0 bg-gray-100 text-left">Employee</th>
              {dates.map(({ dateStr }) => (
                <th key={dateStr} className="border px-2 py-2 text-center">
                  {new Date(dateStr).toLocaleString("en-US", { weekday: "short" })}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-200 sticky top-8 z-10 text-xs">
              <th className="border px-4 py-2 sticky left-0 bg-gray-200 text-left">Date</th>
              {dates.map(({ dateStr, dayOfWeek }) => (
                <th
                  key={dateStr + "day"}
                  className={`border px-2 py-1 text-center ${
                    isWeekend(dayOfWeek) ? "bg-red-100 font-medium" : ""
                  }`}
                  title={dateStr}
                >
                  {dateStr.split("-")[2]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {attendanceData.map((emp, idx) => {
              let runningBalance = 0;

              return (
                <tr
                  key={emp.employeeId}
                  className={`transition-colors ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
                >
                  <td className="border px-3 py-2 sticky left-0 bg-inherit font-semibold">
                    {emp.name}
                  </td>

                  {dates.map(({ dateStr, dayOfWeek }) => {
                    const dailyRecords = emp.dailyRecords.filter((r) => r.date === dateStr);
                    const dailySalary = dailyRecords
                      .filter((r) => r.type === "attendance")
                      .reduce((sum, r) => sum + r.amount, 0);
                    const dailyAdvance = dailyRecords
                      .filter((r) => r.type === "advance")
                      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

                    const pendingBalance = runningBalance + dailySalary;
                    const balance = pendingBalance - dailyAdvance;
                    runningBalance = balance;

                    return (
                      <td
                        key={dateStr + emp.employeeId}
                        className={`border px-2 py-1 text-center align-top ${
                          isWeekend(dayOfWeek) ? "bg-red-50" : ""
                        }`}
                      >
                        {dailyRecords.length > 0 ? (
                          <div className="flex flex-col text-xs gap-0.5">
                            <span className="text-gray-600 font-semibold">
                              Salary: {pendingBalance}
                            </span>
                            <span className="text-red-600 font-semibold">
                              Adv: {dailyAdvance}
                            </span>
                            <span
                              className={`font-semibold ${
                                balance >= 0 ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              Bal: {balance}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
