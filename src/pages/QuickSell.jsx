import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function QuickSell() {
  const [curtains, setCurtains] = useState([]);
  const [poles, setPoles] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [stock, setStock] = useState({ curtains: [], poles: [], accessories: [] });
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState(0);
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stock`);
        const data = await res.json();
        setStock({
          curtains: data.filter(item => item.itemType === "Curtain"),
          poles: data.filter(item => item.itemType === "Poles"),
          accessories: data.filter(item => item.itemType === "Other Accessories")
        });
      } catch (error) {
        console.error("Error fetching stock:", error);
      }
    };
    fetchStock();
  }, []);

  const updateRow = (rows, setRows, index, newData) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], ...newData };
      newRows[index].lineTotal = newRows[index].rate * newRows[index].quantity;
      return newRows;
    });
  };

  const handleQtyChange = (index, qty, rows, setRows, stockItems, field) => {
    const quantity = parseInt(qty);
    const itemName = rows[index][field];
    const stockItem = stockItems.find(i => i.itemName === itemName);
    if (!isNaN(quantity) && quantity > 0) {
      if (stockItem && quantity > stockItem.quantity) {
        alert(`Cannot sell more than available stock (${stockItem.quantity})`);
        return;
      }
      updateRow(rows, setRows, index, { quantity });
    }
  };

  const handleItemChange = (index, name, rows, setRows, stockItems, field) => {
    const stockItem = stockItems.find(i => i.itemName === name);
    updateRow(rows, setRows, index, { [field]: name, rate: stockItem ? stockItem.sellPrice : 0, quantity: 1 });
  };

  const addRow = (setRows, field) => setRows(prev => [...prev, { [field]: "", rate: 0, quantity: 1, lineTotal: 0 }]);
  const removeRow = (setRows, index) => setRows(prev => prev.filter((_, i) => i !== index));

  const curtainsTotal = curtains.reduce((sum, row) => sum + row.lineTotal, 0);
  const polesTotal = poles.reduce((sum, row) => sum + row.lineTotal, 0);
  const accessoriesTotal = accessories.reduce((sum, row) => sum + row.lineTotal, 0);
  const subTotal = curtainsTotal + polesTotal + accessoriesTotal;
  const validDiscount = Math.min(Math.max(discount, 0), 100);
  const discountAmount = (subTotal * validDiscount) / 100;
  const grandTotal = subTotal - discountAmount;
  const balance = grandTotal - payment;

  const handleSaveAndPrint = async () => {
    if (payment < grandTotal) {
      alert(`Payment must be at least LKR ${grandTotal.toFixed(2)}`);
      return;
    }

    try {
      const allItemsData = [
        ...curtains.map(c => ({
          itemName: c.curtain,
          itemQuantity: c.quantity,
          itemRate: c.rate,
          costPrice: stock.curtains.find(i => i.itemName === c.curtain)?.cost || 0,
          total: c.lineTotal
        })),
        ...poles.map(p => ({
          itemName: p.pole,
          itemQuantity: p.quantity,
          itemRate: p.rate,
          costPrice: stock.poles.find(i => i.itemName === p.pole)?.cost || 0,
          total: p.lineTotal
        })),
        ...accessories.map(a => ({
          itemName: a.accessory,
          itemQuantity: a.quantity,
          itemRate: a.rate,
          costPrice: stock.accessories.find(i => i.itemName === a.accessory)?.cost || 0,
          total: a.lineTotal
        }))
      ];

// Save order to backend
const res = await fetch(`${API_BASE_URL}/orders/quick-sell`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    items: allItemsData,
    billTotal: grandTotal,
    discount: validDiscount,
    paidAmount: payment,
    paymentType: "cash"
  })
});

const data = await res.json();
if (!res.ok) throw new Error(data.message || "Failed to save quick sell");

// ✅ Print locally
await fetch("http://192.168.8.194:4000/print", {   // replace with PC IP
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    billNo: data.bill.billNo,
    items: allItemsData,
    grandTotal,
  }),
});


      // Update stock locally
      const updateStockQuantity = (rows, stockItems, field) => {
        rows.forEach(row => {
          const stockItem = stockItems.find(i => i.itemName === row[field]);
          if (stockItem) stockItem.quantity -= row.quantity;
        });
      };
      updateStockQuantity(curtains, stock.curtains, "curtain");
      updateStockQuantity(poles, stock.poles, "pole");
      updateStockQuantity(accessories, stock.accessories, "accessory");

      // Set items for printing
      setAllItems(allItemsData);

      // Reset form
      setCurtains([]);
      setPoles([]);
      setAccessories([]);
      setDiscount(0);
      setPayment(0);

    } catch (err) {
      console.error(err);
      alert("Error saving quick sell. Check console.");
    }
  };



  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quick Sell</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">

        {/* Left Column: Items */}
        <div className="space-y-6">
          <Section title="Curtains" rows={curtains} onChange={(i, name) => handleItemChange(i, name, curtains, setCurtains, stock.curtains, "curtain")}
            onQtyChange={(i, qty) => handleQtyChange(i, qty, curtains, setCurtains, stock.curtains, "curtain")}
            onAdd={() => addRow(setCurtains, "curtain")}
            onRemove={(i) => removeRow(setCurtains, i)}
            options={stock.curtains.filter(i => i.quantity > 0)}
            field="curtain"
          />

          <Section title="Poles" rows={poles} onChange={(i, name) => handleItemChange(i, name, poles, setPoles, stock.poles, "pole")}
            onQtyChange={(i, qty) => handleQtyChange(i, qty, poles, setPoles, stock.poles, "pole")}
            onAdd={() => addRow(setPoles, "pole")}
            onRemove={(i) => removeRow(poles, i)}
            options={stock.poles.filter(i => i.quantity > 0)}
            field="pole"
          />

          <Section title="Accessories" rows={accessories} onChange={(i, name) => handleItemChange(i, name, accessories, setAccessories, stock.accessories, "accessory")}
            onQtyChange={(i, qty) => handleQtyChange(i, qty, accessories, setAccessories, stock.accessories, "accessory")}
            onAdd={() => addRow(setAccessories, "accessory")}
            onRemove={(i) => removeRow(accessories, i)}
            options={stock.accessories.filter(i => i.quantity > 0)}
            field="accessory"
          />
        </div>

        {/* Right Column: Bill Summary */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Bill Summary</h2>

          <div className="flex flex-col gap-3">
            <label className="font-medium text-gray-600">Discount (%)</label>
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(parseInt(e.target.value) || 0)} className="p-2 border rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" />

            <label className="font-medium text-gray-600">Payment (LKR)</label>
            <input type="number" min={grandTotal} value={payment} onChange={e => setPayment(parseFloat(e.target.value) || 0)} className="p-2 border rounded focus:ring-2 focus:ring-green-400 focus:outline-none" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">Subtotal: <span>LKR {subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600">Discount: <span>-LKR {discountAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg">Grand Total: <span>LKR {grandTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-red-600">Balance: <span>LKR {balance.toFixed(2)}</span></div>
          </div>

          <button onClick={handleSaveAndPrint} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">Save & Print</button>
        </div>
      </div>
    </div>
  );
}

// Section Component (unchanged)
function Section({ title, rows, onChange, onQtyChange, onAdd, onRemove, options, field }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">{title}</h2>

      <div className="grid grid-cols-[3fr_1fr_1fr_1fr_40px] gap-3 font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-600">
        <div>Item</div>
        <div className="text-right">Quantity</div>
        <div className="text-right">Rate</div>
        <div className="text-right">Line Total</div>
        <div></div>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-[3fr_1fr_1fr_1fr_40px] items-center gap-3 border-b border-gray-200 py-2">
          <select value={row[field]} onChange={e => onChange(idx, e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-blue-400 focus:outline-none">
            <option value="">Select {title.slice(0, -1)}</option>
            {options.map(o => (
              <option key={o._id} value={o.itemName}>{o.itemName} ({o.quantity})</option>
            ))}
          </select>
          <input type="number" min="1" value={row.quantity} onChange={e => onQtyChange(idx, e.target.value)} className="text-right p-2 border rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" />
          <div className="text-right">{row.rate.toFixed(2)}</div>
          <div className="text-right font-semibold">{row.lineTotal.toFixed(2)}</div>
          <button onClick={() => onRemove(idx)} className="text-red-600 font-bold hover:text-red-800 transition">&times;</button>
        </div>
      ))}

      <button onClick={onAdd} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">+ Add {title.slice(0, -1)}</button>
    </div>
  );
}



