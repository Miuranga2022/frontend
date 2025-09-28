import React, { useState, useEffect } from "react";
import CustomerForm from "../components/CustomerForm";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Order() {
    const [curtains, setCurtains] = useState([{ curtain: "", rate: 0, quantity: 1, lineTotal: 0 }]);
    const [poles, setPoles] = useState([{ pole: "", rate: 0, quantity: 1, lineTotal: 0 }]);
    const [accessories, setAccessories] = useState([{ accessory: "", rate: 0, quantity: 1, lineTotal: 0 }]);
    const [stock, setStock] = useState({ curtains: [], poles: [], accessories: [] });

    const [customerData, setCustomerData] = useState({
        name: "",
        mobile1: "",
        mobile2: "",
        address: "",
        description: "",
        fixingDate: ""
    });

    const [discount, setDiscount] = useState(0);
    const [payment, setPayment] = useState(0);

    // Fetch stock from backend
    useEffect(() => {
        const fetchStock = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/stock`);
                const data = await res.json();
                setStock({
                    curtains: data.filter(i => i.itemType === "Curtain"),
                    poles: data.filter(i => i.itemType === "Poles"),
                    accessories: data.filter(i => i.itemType === "Other Accessories")
                });
            } catch (error) {
                console.error("Error fetching stock:", error);
            }
        };
        fetchStock();
    }, []);

    // Generic row update function
    const updateRow = (rows, setRows, index, newData) => {
        setRows(prev => {
            const newRows = [...prev];
            newRows[index] = {
                ...newRows[index],
                ...newData,
                lineTotal: (newData.rate ?? newRows[index].rate) * (newData.quantity ?? newRows[index].quantity)
            };
            return newRows;
        });
    };

    // Curtain handlers
    const handleCurtainChange = (idx, name) => {
        const item = stock.curtains.find(c => c.itemName === name);
        updateRow(curtains, setCurtains, idx, {
            curtain: name,
            rate: item ? item.sellPrice : 0,
            availableQty: item ? item.quantity : 0,
            costPrice: item ? item.cost : 0
        });
    };
    const handleCurtainQtyChange = (idx, qty) => {
        const quantity = parseInt(qty);
        if (!isNaN(quantity) && quantity > 0) updateRow(curtains, setCurtains, idx, { quantity });
    };
    const addCurtainRow = () => setCurtains(prev => [...prev, { curtain: "", rate: 0, quantity: 1, lineTotal: 0 }]);
    const removeCurtainRow = idx => setCurtains(prev => prev.filter((_, i) => i !== idx));

    // Pole handlers
    const handlePoleChange = (idx, name) => {
        const item = stock.poles.find(p => p.itemName === name);
        updateRow(poles, setPoles, idx, {
            pole: name,
            rate: item ? item.sellPrice : 0,
            availableQty: item ? item.quantity : 0,
            costPrice: item ? item.cost : 0
        });
    };
    const handlePoleQtyChange = (idx, qty) => {
        const quantity = parseInt(qty);
        if (!isNaN(quantity) && quantity > 0) updateRow(poles, setPoles, idx, { quantity });
    };
    const addPoleRow = () => setPoles(prev => [...prev, { pole: "", rate: 0, quantity: 1, lineTotal: 0 }]);
    const removePoleRow = idx => setPoles(prev => prev.filter((_, i) => i !== idx));

    // Accessory handlers
    const handleAccessoryChange = (idx, name) => {
        const item = stock.accessories.find(a => a.itemName === name);
        updateRow(accessories, setAccessories, idx, {
            accessory: name,
            rate: item ? item.sellPrice : 0,
            availableQty: item ? item.quantity : 0,
            costPrice: item ? item.cost : 0
        });
    };
    const handleAccessoryQtyChange = (idx, qty) => {
        const quantity = parseInt(qty);
        if (!isNaN(quantity) && quantity > 0) updateRow(accessories, setAccessories, idx, { quantity });
    };
    const addAccessoryRow = () => setAccessories(prev => [...prev, { accessory: "", rate: 0, quantity: 1, lineTotal: 0 }]);
    const removeAccessoryRow = idx => setAccessories(prev => prev.filter((_, i) => i !== idx));

    // Totals
    const curtainsTotal = curtains.reduce((sum, row) => sum + row.lineTotal, 0);
    const polesTotal = poles.reduce((sum, row) => sum + row.lineTotal, 0);
    const accessoriesTotal = accessories.reduce((sum, row) => sum + row.lineTotal, 0);
    const subTotal = curtainsTotal + polesTotal + accessoriesTotal;

    // Discount logic
    const validDiscount = Math.min(Math.max(discount, 0), 100);
    const discountAmount = (subTotal * validDiscount) / 100;
    const grandTotal = subTotal - discountAmount;
    const balance = grandTotal - payment;

    const handleSaveAndPrint = async () => {
        if (!customerData.name || !customerData.mobile1) {
            return alert("Please enter customer name and mobile number!");
        }

        try {
            const allItems = [
                ...curtains.filter(c => c.curtain).map(c => ({
                    itemName: c.curtain,
                    itemQuantity: c.quantity,
                    itemRate: c.rate,
                    costPrice: stock.curtains.find(i => i.itemName === c.curtain)?.cost || 0,
                    total: c.lineTotal
                })),
                ...poles.filter(p => p.pole).map(p => ({
                    itemName: p.pole,
                    itemQuantity: p.quantity,
                    itemRate: p.rate,
                    costPrice: stock.poles.find(i => i.itemName === p.pole)?.cost || 0,
                    total: p.lineTotal
                })),
                ...accessories.filter(a => a.accessory).map(a => ({
                    itemName: a.accessory,
                    itemQuantity: a.quantity,
                    itemRate: a.rate,
                    costPrice: stock.accessories.find(i => i.itemName === a.accessory)?.cost || 0,
                    total: a.lineTotal
                }))
            ];

            if (allItems.length === 0) {
                alert("Cannot save bill: No items selected!");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/orders/full`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: customerData,
                    orderDetails: { fixingDate: customerData.fixingDate || new Date(), orderStatus: "pending" },
                    items: allItems,
                    billDetails: {
                        billTotal: grandTotal,
                        discount: validDiscount,
                        paidAmount: payment || grandTotal,
                        paymentType: "cash"
                    }
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create order");

            alert("Order created successfully!");
            console.log("Created order:", data);

            // Reset
            setCurtains([{ curtain: "", rate: 0, quantity: 1, lineTotal: 0 }]);
            setPoles([{ pole: "", rate: 0, quantity: 1, lineTotal: 0 }]);
            setAccessories([{ accessory: "", rate: 0, quantity: 1, lineTotal: 0 }]);
            setDiscount(0);
            setPayment(0);
            setCustomerData({ name: "", mobile1: "", mobile2: "", address: "", description: "", fixingDate: "" });
        } catch (err) {
            console.error(err);
            alert("Error creating order. Check console.");
        }
    };

    return (
        <div className="w-full p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
                {/* Left Column: Order Sections + Customer Form */}
                <div>
                    <Section title="Curtains" rows={curtains} onChange={handleCurtainChange} onQtyChange={handleCurtainQtyChange} onAdd={addCurtainRow} onRemove={removeCurtainRow} options={stock.curtains} field="curtain" />
                    <Section title="Poles" rows={poles} onChange={handlePoleChange} onQtyChange={handlePoleQtyChange} onAdd={addPoleRow} onRemove={removePoleRow} options={stock.poles} field="pole" />
                    <Section title="Accessories" rows={accessories} onChange={handleAccessoryChange} onQtyChange={handleAccessoryQtyChange} onAdd={addAccessoryRow} onRemove={removeAccessoryRow} options={stock.accessories} field="accessory" />
                    <CustomerForm customerData={customerData} setCustomerData={setCustomerData} />
                </div>

                {/* Right Column: Bill Info */}
                <div className="bg-white p-6 rounded-xl shadow space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Bill Summary</h2>

                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>LKR {subTotal.toFixed(2)}</span>
                    </div>

                    {/* Discount Input */}
                    <div>
                        <label className="block mb-1 font-semibold">Discount (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={discount}
                            onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                            className="p-2 border rounded w-full"
                        />
                    </div>

                    <div className="flex justify-between">
                        <span>Discount Amount:</span>
                        <span>- LKR {discountAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                        <span>Grand Total:</span>
                        <span>LKR {grandTotal.toFixed(2)}</span>
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold">Payment (LKR)</label>
                        <input type="number" min="0" max={grandTotal} value={payment} onChange={e => setPayment(parseFloat(e.target.value) || 0)} className="p-2 border rounded w-full" />
                    </div>

                    <div className="flex justify-between font-semibold">
                        <span>Balance:</span>
                        <span>LKR {balance.toFixed(2)}</span>
                    </div>

                    <button onClick={handleSaveAndPrint} className="mt-4 w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition">
                        Save & Print
                    </button>
                </div>
            </div>
        </div>
    );
}

// Section Component
function Section({ title, rows, onChange, onQtyChange, onAdd, onRemove, options, field }) {
    return (
        <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">{title}</h2>
            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_40px] gap-2 font-bold border-b-2 border-gray-700 pb-2 mb-3">
                <div>Item</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Rate (LKR)</div>
                <div className="text-right">Line Total (LKR)</div>
                <div></div>
            </div>
            {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[3fr_1fr_1fr_1fr_40px] items-center gap-2 border-b border-gray-300 py-2">
                    <select
                        value={row[field]}
                        onChange={(e) => onChange(idx, e.target.value)}
                        className="p-1 border rounded"
                    >
                        <option value="">Select {title.slice(0, -1)}</option>
                        {options.map(o => (
                            <option key={o._id} value={o.itemName}>
                                {o.itemName} (*{o.quantity}*)
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={e => onQtyChange(idx, e.target.value)}
                        className="text-right p-1 border rounded"
                    />
                    <div className="text-right">{row.rate.toFixed(2)}</div>
                    <div className="text-right font-semibold">{row.lineTotal.toFixed(2)}</div>
                    <button onClick={() => onRemove(idx)} className="text-red-600 hover:text-red-800">&times;</button>
                </div>
            ))}
            <button onClick={onAdd} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                + Add {title.slice(0, -1)}
            </button>
        </div>
    );
}
