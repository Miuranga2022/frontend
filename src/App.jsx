import { Route, Routes } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from '@clerk/clerk-react';

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import QuickSell from "./pages/QuickSell"
import Order from "./pages/Order"
import OrderDetails from "./pages/OrderDetails"
import Supplier from "./pages/Supplier"
import Inventory from "./pages/Inventory"
import EmployeeManagement from "./pages/EmployeeManagement"
import MonthlyAttendance from "./pages/MonthlyAttendance"
import ExpenseTracker from "./pages/ExpenseTracker"
import Report from "./pages/Report"
import DailyReportByDate from "./pages/DailyReportByDate"

// List of allowed employees
const ALLOWED_EMPLOYEES = [
  "rockmiuranga@gmail.com",
  "employee2@example.com",
  "employee3@example.com"
];

function ProtectedApp() {
  const { user } = useUser();

  // Check if user email is in the allowed list
  const hasAccess = ALLOWED_EMPLOYEES.includes(user.primaryEmailAddress.emailAddress);

  if (!hasAccess) return <p className="text-center mt-10 text-red-600 font-bold">Access Denied</p>;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-white p-4 relative">
        <div className="absolute top-4 right-4">
          <UserButton />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quicksell" element={<QuickSell />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order-details" element={<OrderDetails />} />
          <Route path="/suppliers" element={<Supplier />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/emp-managment" element={<EmployeeManagement />} />
          <Route path="/monthly-attendance" element={<MonthlyAttendance year={year} month={month} />} />
          <Route path="/expense-tracker" element={<ExpenseTracker />} />
          <Route path="/report" element={<Report />} />
          <Route path="/dailybydate" element={<DailyReportByDate />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SignedIn>
        <ProtectedApp />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
