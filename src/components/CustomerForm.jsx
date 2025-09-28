import React from "react";

export default function CustomerForm({ customerData, setCustomerData }) {
    // Helper to update any field
    const handleChange = (field, value) => {
        setCustomerData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="mb-10 border-t pt-4">
            <h2 className="text-2xl font-semibold mb-4">Customer Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                    <label className="block font-semibold mb-1">Name <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={customerData.name || ""}
                        onChange={e => handleChange("name", e.target.value)}
                        className="p-2 border rounded w-full"
                        required
                    />
                </div>

                {/* Mobile 1 */}
                <div>
                    <label className="block font-semibold mb-1">Mobile 1 <span className="text-red-600">*</span></label>
                    <input
                        type="text"
                        value={customerData.mobile1 || ""}
                        onChange={e => handleChange("mobile1", e.target.value)}
                        className="p-2 border rounded w-full"
                        required
                    />
                </div>

                {/* Mobile 2 */}
                <div>
                    <label className="block font-semibold mb-1">Mobile 2</label>
                    <input
                        type="text"
                        value={customerData.mobile2 || ""}
                        onChange={e => handleChange("mobile2", e.target.value)}
                        className="p-2 border rounded w-full"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block font-semibold mb-1">Address</label>
                    <input
                        type="text"
                        value={customerData.address || ""}
                        onChange={e => handleChange("address", e.target.value)}
                        className="p-2 border rounded w-full"
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block font-semibold mb-1">Description / Notes</label>
                    <textarea
                        value={customerData.description || ""}
                        onChange={e => handleChange("description", e.target.value)}
                        className="p-2 border rounded w-full"
                        rows={3}
                    />
                </div>

                {/* Fixing Date */}
                <div>
                    <label className="block font-semibold mb-1">Fixing Date</label>
                    <input
                        type="date"
                        value={customerData.fixingDate || ""}
                        onChange={e => handleChange("fixingDate", e.target.value)}
                        className="p-2 border rounded w-full"
                    />
                </div>
            </div>
        </div>
    );
}
