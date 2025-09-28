import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Supplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isPayBillOpen, setIsPayBillOpen] = useState(false);
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: "", address: "", mobile: "" });

  const [billItems, setBillItems] = useState([]);
  const [itemForm, setItemForm] = useState({ itemName: "", itemColor: "", itemType: "Curtain", cost: "", sellPrice: "", quantity: "" });
  const [paymentDate, setPaymentDate] = useState("");

  const [supplierBills, setSupplierBills] = useState([]);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [stockItems, setStockItems] = useState([]); // ✅ state for real-time stock

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/suppliers`);
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStock = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/stock`);
      setStockItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setSupplierForm({ ...supplierForm, [name]: value });
  };

  const toggleExpand = (billId) => {
    setExpandedBillId(expandedBillId === billId ? null : billId);
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/suppliers`, supplierForm);
      setSupplierForm({ name: "", address: "", mobile: "" });
      setIsAddSupplierOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm({ ...itemForm, [name]: value });
  };

  const handleAddItem = () => {
    if (!itemForm.itemName || !itemForm.quantity || !itemForm.cost || !itemForm.sellPrice) return;
    setBillItems([...billItems, { ...itemForm }]);
    setItemForm({ itemName: "", itemColor: "", itemType: "Curtain", cost: "", sellPrice: "", quantity: "" });
  };

  const totalBill = billItems.reduce((acc, item) => acc + item.cost * Number(item.quantity), 0);

  const handleSubmitBill = async () => {
    if (!selectedSupplier || billItems.length === 0) return;

    try {
      await axios.post(`${API_BASE_URL}/supplier-bills`, {
        supplierId: selectedSupplier._id,
        items: billItems.map(item => ({
          itemName: item.itemName,
          itemColor: item.itemColor,
          itemType: item.itemType,
          cost: Number(item.cost),
          sellPrice: Number(item.sellPrice),
          quantity: Number(item.quantity)
        })),
        totalBill,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null
      });

      setBillItems([]);
      setItemForm({ itemName: "", itemColor: "", itemType: "Curtain", cost: "", sellPrice: "", quantity: "" });
      setPaymentDate("");
      setIsAddBillOpen(false);

      fetchSupplierBills(selectedSupplier._id);
      fetchSuppliers();
      fetchStock(); // ✅ refresh stock after saving bill

      alert("Bill saved and stock updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save bill. Please try again.");
    }
  };

  const fetchSupplierBills = async (supplierId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/supplier-bills?supplierId=${supplierId}`);
      setSupplierBills(res.data);
      setPaymentAmounts({});
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPayBill = (supplier) => {
    setSelectedSupplier(supplier);
    setIsPayBillOpen(true);
    fetchSupplierBills(supplier._id);
  };

  const handlePaymentChange = (billId, value) => {
    setPaymentAmounts({ ...paymentAmounts, [billId]: value });
  };

  const handleSubmitPayment = async (billId) => {
    const amount = Number(paymentAmounts[billId]);
    if (!amount || amount <= 0) return;
    try {
      await axios.post(`${API_BASE_URL}/payments`, {
        supplierBillId: billId,
        paidAmount: amount,
      });
      fetchSupplierBills(selectedSupplier._id);
      setPaymentAmounts({ ...paymentAmounts, [billId]: "" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add Supplier */}
      <button
        onClick={() => setIsAddSupplierOpen(true)}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
      >
        Add Supplier
      </button>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier._id} className="border rounded-lg shadow p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg">{supplier.name}</h3>
              <p className="text-gray-600">{supplier.address}</p>
              <p className="text-gray-600">{supplier.mobile}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setIsAddBillOpen(true);
                  fetchSupplierBills(supplier._id);
                  fetchStock(); // ✅ fetch stock when opening Add Bill
                }}
                className="flex-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Add Bill
              </button>
              <button
                onClick={() => handleOpenPayBill(supplier)}
                className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Pay Bill
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Add Supplier</h3>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <input type="text" name="name" value={supplierForm.name} onChange={handleSupplierChange} placeholder="Supplier Name" className="w-full border p-2 rounded" required />
              <input type="text" name="address" value={supplierForm.address} onChange={handleSupplierChange} placeholder="Supplier Address" className="w-full border p-2 rounded" required />
              <input type="text" name="mobile" value={supplierForm.mobile} onChange={handleSupplierChange} placeholder="Mobile Number" className="w-full border p-2 rounded" required />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddSupplierOpen(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddBillOpen && selectedSupplier && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 overflow-auto py-6 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-4">Add Bill for {selectedSupplier.name}</h3>

            {/* Add Item Form */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Add Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="text" name="itemName" value={itemForm.itemName} onChange={handleItemChange} placeholder="Item Name" className="border p-2 rounded" />
                <input type="text" name="itemColor" value={itemForm.itemColor} onChange={handleItemChange} placeholder="Item Color" className="border p-2 rounded" />
                <div className="flex space-x-2 items-center">
                  {"Curtain" && ["Curtain", "Poles", "Other Accessories"].map(type => (
                    <label key={type}>
                      <input type="radio" name="itemType" value={type} checked={itemForm.itemType === type} onChange={handleItemChange} /> {type}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="number" name="cost" value={itemForm.cost} onChange={handleItemChange} placeholder="Cost" className="border p-2 rounded" />
                <input type="number" name="sellPrice" value={itemForm.sellPrice} onChange={handleItemChange} placeholder="Sell Price" className="border p-2 rounded" />
                <input type="number" name="quantity" value={itemForm.quantity} onChange={handleItemChange} placeholder="Quantity" className="border p-2 rounded" />
              </div>
              <button type="button" onClick={handleAddItem} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Add Item</button>
            </div>

            {/* Items Table */}
            {billItems.length > 0 && (
              <div className="overflow-x-auto border rounded p-2">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 text-center">
                    <tr>
                      <th className="border p-2">Name</th>
                      <th className="border p-2">Color</th>
                      <th className="border p-2">Type</th>
                      <th className="border p-2">Cost</th>
                      <th className="border p-2">Sell Price</th>
                      <th className="border p-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, index) => (
                      <tr key={index} className="text-center">
                        <td className="border p-2">{item.itemName}</td>
                        <td className="border p-2">{item.itemColor}</td>
                        <td className="border p-2">{item.itemType}</td>
                        <td className="border p-2">{item.cost}</td>
                        <td className="border p-2">{item.sellPrice}</td>
                        <td className="border p-2">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 font-semibold text-right">Total: Rs. {totalBill}</p>
              </div>
            )}

            {/* Current Stock Table */}
            {stockItems.length > 0 && (
              <div className="mt-4 border rounded p-4">
                <h4 className="font-semibold mb-2">Current Stock</h4>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full border-collapse text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Item Name</th>
                        <th className="border p-2">Color</th>
                        <th className="border p-2">Type</th>
                        <th className="border p-2">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => setItemForm({
                            itemName: item.itemName,
                            itemColor: item.itemColor,
                            itemType: item.itemType,
                            cost: item.cost,
                            sellPrice: item.sellPrice,
                            quantity: 1
                          })}
                        >
                          <td className="border p-2">{item.itemName}</td>
                          <td className="border p-2">{item.itemColor}</td>
                          <td className="border p-2">{item.itemType}</td>
                          <td className="border p-2">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Date */}
            <div>
              <label className="block mb-1">Payment Date (optional)</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="border p-2 rounded" />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setIsAddBillOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button type="button" onClick={handleSubmitBill} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Bill Modal (unchanged) */}
      {isPayBillOpen && selectedSupplier && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 overflow-auto py-6 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl p-6 space-y-4">
            <h3 className="text-2xl font-semibold">Bills for {selectedSupplier.name}</h3>

            <div className="space-y-3">
              {supplierBills.map(bill => {
                const balance = bill.totalBill - bill.paidAmount;
                const isExpanded = expandedBillId === bill._id;
                return (
                  <div key={bill._id} className="border rounded shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleExpand(bill._id)}>
                      <div className="flex flex-col md:flex-row md:space-x-6">
                        <span><strong>ID:</strong> {bill._id.slice(-6)}</span>
                        <span><strong>Total:</strong> Rs. {bill.totalBill}</span>
                        <span><strong>Paid:</strong> Rs. {bill.paidAmount}</span>
                        <span><strong>Balance:</strong> <span className={balance === 0 ? "text-green-600" : "text-red-600 font-semibold"}>Rs. {balance}</span></span>
                        <span><strong>Payment Date:</strong> {bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString() : "-"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {balance > 0 ? (
                          <>
                            <input type="number" value={paymentAmounts[bill._id] || ""} onChange={(e) => handlePaymentChange(bill._id, e.target.value)} placeholder="Amount" className="border p-1 w-28 rounded" onClick={e => e.stopPropagation()} />
                            <button onClick={e => { e.stopPropagation(); handleSubmitPayment(bill._id) }} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Pay</button>
                          </>
                        ) : <span className="text-green-600 font-medium">Fully Paid ✅</span>}
                        <span className="ml-3 text-gray-500">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white border-t">
                        <div className="overflow-x-auto max-h-64 border rounded">
                          <h4 className="font-semibold mb-2">Items</h4>
                          <table className="w-full border-collapse text-center">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Color</th>
                                <th className="border p-2">Type</th>
                                <th className="border p-2">Cost</th>
                                <th className="border p-2">Sell</th>
                                <th className="border p-2">Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bill.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="border p-2">{item.itemName}</td>
                                  <td className="border p-2">{item.itemColor}</td>
                                  <td className="border p-2">{item.itemType}</td>
                                  <td className="border p-2">{item.cost}</td>
                                  <td className="border p-2">{item.sellPrice}</td>
                                  <td className="border p-2">{item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="overflow-x-auto max-h-64 border rounded">
                          <h4 className="font-semibold mb-2">Payments</h4>
                          {bill.payments && bill.payments.length > 0 ? (
                            <table className="w-full border-collapse text-center">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border p-2">Date</th>
                                  <th className="border p-2">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.payments.map((pay, idx) => (
                                  <tr key={idx}>
                                    <td className="border p-2">{new Date(pay.paidDate).toLocaleDateString()}</td>
                                    <td className="border p-2">Rs. {pay.paidAmount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : <p className="p-2 text-gray-500">No payments yet.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setIsPayBillOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
