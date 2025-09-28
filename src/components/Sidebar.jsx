import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaShoppingCart, FaCashRegister, FaUsers, FaBars } from "react-icons/fa";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/" },
    { name: "Quick Sale", icon: <FaCashRegister />, path: "/quicksell" },
    { name: "Orders", icon: <FaShoppingCart />, path: "/order" },
    { name: "Orders - Details", icon: <FaShoppingCart />, path: "/order-details" },
    { name: "Suppliers", icon: <FaUsers />, path: "/suppliers" },
    { name: "Inventory", icon: <FaUsers />, path: "/inventory" },
    { name: "Employee Managment", icon: <FaUsers />, path: "/emp-managment" },
    { name: "Monthly Attendance", icon: <FaUsers />, path: "/monthly-attendance" },
    { name: "Expense Tracker", icon: <FaUsers />, path: "/expense-tracker" },
    { name: "Report", icon: <FaUsers />, path: "/report" },
    { name: "Reprot By Date", icon: <FaUsers />, path: "/dailybydate" },
  ];

  return (
    <div className={`bg-gray-900 text-white ${collapsed ? "w-20" : "w-64"} flex flex-col transition-all duration-300 h-screen`}>
      {/* Logo + Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <span className="text-xl font-bold">New Kumara Curtain</span>}
        <button onClick={() => setCollapsed(!collapsed)}>
          <FaBars size={20} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center w-full p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
                isActive ? "bg-gray-700" : ""
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span className="ml-3">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && <div className="p-4 border-t border-gray-700 text-sm">v1.0.0</div>}
    </div>
  );
}
