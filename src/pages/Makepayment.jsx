import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Filter,
  CreditCard,
  ExternalLink,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import {
  fetchPendingLeaving,
  markPaymentById,
} from "../services/paymentService";

const MakePayment = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState({});
  const [filters, setFilters] = useState({
    department: "",
    status: "",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Normalize item to UI model (supports multiple possible column names)
  const normalizeRecord = (item) => {
    const planned =
      item.planned_settlement_date ||
      item.planned_payment_date ||
      item.planned_final_settlement_date ||
      item.planned_date ||
      item.planned ||
      item.plannedLeavingDate ||
      "";
    const actual =
      item.actual_settlement_date ||
      item.actual_payment_date ||
      item.actual_date ||
      item.actual_df ||
      item.actual ||
      item.actualLeavingDate ||
      "";

    // accept employee number/code variants produced by different services

    // let amountRaw =
    //   item.settlement_amount ||
    //   item.amount ||
    //   item.final_settlement_amount ||
    //   item.closing_amount ||
    //   0;
    let amountRaw =
      item.settlement_amount ||
      item.amount ||
      item.final_settlement_amount ||
      item.closing_amount ||
      0;
    if (typeof amountRaw === "string") {
      amountRaw = amountRaw.replace(/[^0-9.-]+/g, "");
    }
    const amount = parseFloat(amountRaw) || 0;

    return {
      id: item.id,
      employeeId: item.employeeCode?.toString(),
      name:
        item.name_as_per_aadhar ||
        item.enquiries?.candidate_name ||
        item.name ||
        "",
      designation: item.designation || item.enquiries?.applying_for_post || "",
      leavingDate: item.actual_leaving_date || item.leaving_date || "",
      terminationReason:
        item.termination_reason || item.terminationReason || "",
      lastWorkingDate: item.last_working_date || item.lastWorkingDate || "",
      amount,
      mobileNo: item.mobile || item.mobile_no || item.candidate_phone || "",
      bankAccount: item.bank_account || item.bankAccount || "",
      branchName: item.branch_name || item.branchName || "",
      plannedDate: planned ? planned.toString() : "",
      actualDate: actual ? actual.toString() : "",
      formLink: item.form_link || item.formLink || "",
      paymentLink: item.payment_link || "",
      paymentStatus: item.payment_status || item.paymentStatus || "Pending",
      paymentDate: item.payment_date || item.paymentDate || "",
      department: item.department || "",
      email: item.email || item.candidate_email || "",
      joiningDate: item.date_of_joining || item.joiningDate || "",
      aadharNo: item.aadhar || item.aadhar_no || item.aadharNo || "",
      companyName: item.companyName || "",
      workingDays: item.workingDays || ""
    };
  };

  // Fetch pending payments from Supabase: planned present & actual empty
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const pendingPayments = await fetchPendingLeaving();
        console.log("Fetched pending paymentsssssssss:", pendingPayments);
        // Normalize records returned by the service to the UI model (keeps compatibility)
        const normalized = pendingPayments.map((it) => normalizeRecord(it));
        console.log("Normalized payment recordsssssssss:", normalized);
        const initialSelections = {};
        normalized.forEach((item) => {
          initialSelections[item.id] = false;
        });
        setSelectedPayments(initialSelections);
        setPaymentData(normalized);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || String(err));
        showNotification(
          `Failed to load data: ${err.message || String(err)}`,
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handlePaymentToggle = (paymentId) => {
    setSelectedPayments((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  // (Updated) use central service to mark payment by id

  const handleBulkPayment = async () => {
    console;
    const selectedItems = paymentData.filter(
      (item) => selectedPayments[item.id],
    );

    if (selectedItems.length === 0) {
      showNotification(
        "Please select at least one payment to process",
        "error",
      );
      return;
    }

    showNotification(`Processing ${selectedItems.length} payments...`, "info");

    try {
      const currentDate = new Date();
      // Format date as MM/DD/YYYY HH:MM:SS to match Google Sheets format
      const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getDate().toString().padStart(2, "0")}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, "0")}:${currentDate.getMinutes().toString().padStart(2, "0")}:${currentDate.getSeconds().toString().padStart(2, "0")}`;

      console.log(`Bulk payment date: ${formattedDate}`);

      for (const item of selectedItems) {
        try {
          const result = await markPaymentById(item.id, formattedDate);
          if (!result.success) {
            console.warn(`Failed to mark ${item.id}:`, result.error);
          }
        } catch (itemError) {
          console.error(`Error processing ${item.id}:`, itemError);
        }
      }

      showNotification(
        `${selectedItems.length} payments marked as paid!`,
        "success",
      );

      // Remove processed items from the list
      const processedIds = selectedItems.map((item) => item.id);
      const remainingPayments = paymentData.filter(
        (item) => !processedIds.includes(item.id),
      );
      setPaymentData(remainingPayments);

      // Clear selections
      const clearedSelections = {};
      remainingPayments.forEach((item) => {
        clearedSelections[item.id] = false;
      });
      setSelectedPayments(clearedSelections);
    } catch (error) {
      console.error("Bulk payment error:", error);
      showNotification(`Payment processing failed: ${error.message}`, "error");
    }
  };

  const handleIndividualPayment = (item, e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!item.paymentLink) {
      showNotification("Payment link not available", "error");
      return;
    }

    window.open(item.paymentLink, "_blank", "noopener,noreferrer");
  };

  const downloadPaymentReceipt = (item) => {
    if (!item) return;

    showNotification(`Downloading receipt for ${item.name}`, "info");

    // Create receipt content
    const receiptContent = `
====================================
PAYMENT RECEIPT - FINAL SETTLEMENT
====================================

Receipt No: REC-${Date.now().toString().slice(-8)}-${item.employeeId}
Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
Time: ${new Date().toLocaleTimeString("en-IN")}

EMPLOYEE DETAILS:
-----------------
Employee ID: ${item.employeeId || "N/A"}
Name: ${item.name || "N/A"}
Company: ${item.companyName || "N/A"}
Designation: ${item.designation || "N/A"}
Department: ${item.department || "N/A"}
Aadhar No: ${item.aadharNo || "N/A"}
Mobile: ${item.mobileNo || "N/A"}
Email: ${item.email || "N/A"}

EMPLOYMENT DETAILS:
-------------------
Joining Date: ${formatDateForDisplay(item.joiningDate) || "N/A"}
Last Working Date: ${formatDateForDisplay(item.lastWorkingDate) || "N/A"}
Leaving Date: ${formatDateForDisplay(item.leavingDate) || "N/A"}
Termination Reason: ${item.terminationReason || "N/A"}

PAYMENT DETAILS:
----------------
Settlement Amount: ₹${(Number(item.amount) || 0).toLocaleString("en-IN")}
Payment Status: ${item.paymentStatus}
Planned Payment Date: ${formatDateForDisplay(item.plannedDate) || "N/A"}
Actual Payment Date: ${item.paymentDate ? formatDateForDisplay(item.paymentDate) : "Pending"}

BANK DETAILS:
-------------
Bank Account: ${item.bankAccount || "N/A"}
Branch Name: ${item.branchName || "N/A"}

====================================
AUTHORIZED SIGNATURE

This is a computer generated receipt.
Amount: ₹${(Number(item.amount) || 0).toLocaleString("en-IN")} only.
====================================
`;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Settlement_Receipt_${item.employeeId}_${item.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString || dateString.toString().trim() === "") return "N/A";

    try {
      const str = dateString.toString().trim();

      // Handle date with timestamp like "12/17/2025 11:25:20"
      if (str.includes(" ")) {
        const [datePart, timePart] = str.split(" ");
        const [month, day, year] = datePart.split("/");
        return `${day}/${month}/${year}`;
      }

      // Handle date without timestamp
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }

      // Try to parse as Date object
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      }

      return str;
    } catch (error) {
      console.error("Date formatting error:", error, "for date:", dateString);
      return dateString;
    }
  };

  const openGoogleForm = (formLink) => {
    if (!formLink) {
      showNotification("No form link available", "error");
      return;
    }

    // Open form in new tab
    window.open(formLink, "_blank", "noopener,noreferrer");
    showNotification("Opening Google Form...", "info");
  };
  console.log(
    "Rendering MakePayment with data:",
    paymentData,
    "Filters:",
    filters,
  );
  const filteredData = paymentData.filter((item) => {
    // Apply search filter
    const matchesSearch =
      searchTerm === "" ||
      (item.employeeId &&
        item.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.name &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.designation &&
        item.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.mobileNo && item.mobileNo.includes(searchTerm)) ||
      (item.department &&
        item.department.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply status filter
    const matchesStatus =
      !filters.status || item.paymentStatus === filters.status;

    // Apply department filter
    const matchesDepartment =
      !filters.department ||
      (item.department &&
        item.department
          .toLowerCase()
          .includes(filters.department.toLowerCase()));

    return matchesSearch && matchesStatus && matchesDepartment;
  });
  console.log("Filtered data:", filteredData);

  return (
    <div className="min-h-screen p-4 text-gray-900 bg-gradient-to-br from-gray-50 to-blue-50 md:p-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${notification.type === "error"
            ? "bg-red-100 text-red-800 border border-red-300"
            : notification.type === "info"
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-green-100 text-green-800 border border-green-300"
            }`}
        >
          <div className="flex items-center">
            {notification.type === "error"
              ? "⚠️"
              : notification.type === "info"
                ? "ℹ️"
                : "✅"}
            <span className="ml-2">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="mx-auto space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 md:text-3xl">
              Employee Settlement Payments
            </h1>
            <p className="mt-1 text-gray-600">
              Process final settlement payments (Planned date filled, Actual
              date empty)
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Showing: {paymentData.length} pending payments
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBulkPayment}
              disabled={
                Object.values(selectedPayments).filter(Boolean).length === 0
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md ${Object.values(selectedPayments).filter(Boolean).length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
                }`}
            >
              <CreditCard size={18} />
              Mark Selected as Paid (
              {Object.values(selectedPayments).filter(Boolean).length})
            </button>
            <button
              onClick={() => {
                // Export all pending payments
                if (paymentData.length === 0) {
                  showNotification("No data to export", "warning");
                  return;
                }

                const csvContent =
                  "data:text/csv;charset=utf-8," +
                  [
                    "Employee ID,Name,Designation,Department,Amount,Mobile No,Bank Account,Branch Name,Planned Date,Last Working Date",
                  ].join(",") +
                  "\n" +
                  paymentData
                    .map(
                      (item) =>
                        `"${item.employeeId}","${item.name}","${item.companyName}","${item.designation}","${item.department}",${item.amount},"${item.mobileNo}","${item.bankAccount}","${item.branchName}","${formatDateForDisplay(item.plannedDate)}","${formatDateForDisplay(item.lastWorkingDate)}"`,
                    )
                    .join("\n");

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute(
                  "download",
                  `Pending_Payments_${new Date().toISOString().split("T")[0]}.csv`,
                );
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showNotification("Report exported successfully!", "success");
              }}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="p-4 bg-white border border-gray-200 shadow-lg bg-opacity-80 backdrop-blur-md rounded-2xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Employee ID, Name, Designation, Mobile or Department..."
                  className="w-full py-2 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search
                  size={20}
                  className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative">
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="py-2 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar
                  size={20}
                  className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                />
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100">
                  <Filter size={18} />
                  Filter
                </button>
                <div className="absolute right-0 z-10 invisible w-64 p-4 mt-1 space-y-3 transition-all duration-200 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Payment Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50"
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      value={filters.department}
                      onChange={(e) =>
                        handleFilterChange("department", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50"
                      placeholder="Enter department"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="p-4 bg-white border border-gray-200 shadow rounded-xl">
            <div className="text-sm text-gray-500">Total Pending Amount</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              ₹
              {paymentData
                .reduce((sum, item) => sum + item.amount, 0)
                .toLocaleString("en-IN")}
            </div>
          </div>
          <div className="p-4 bg-white border border-gray-200 shadow rounded-xl">
            <div className="text-sm text-gray-500">Pending Payments</div>
            <div className="mt-1 text-2xl font-bold text-orange-600">
              {paymentData.length}
            </div>
          </div>
          <div className="p-4 bg-white border border-gray-200 shadow rounded-xl">
            <div className="text-sm text-gray-500">Selected for Payment</div>
            <div className="mt-1 text-2xl font-bold text-purple-600">
              {Object.values(selectedPayments).filter(Boolean).length}
            </div>
          </div>
          <div className="p-4 bg-white border border-gray-200 shadow rounded-xl">
            <div className="text-sm text-gray-500">Total Amount Selected</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              ₹
              {paymentData
                .filter((item) => selectedPayments[item.id])
                .reduce((sum, item) => sum + item.amount, 0)
                .toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-lg bg-opacity-70 backdrop-blur-md rounded-2xl">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <span className="ml-4 text-gray-600">
                  Loading pending payments...
                </span>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="font-medium text-red-600">Error: {error}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Please check console for details
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 mt-4 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div
                className="overflow-auto"
                style={{ maxHeight: "calc(100vh - 350px)", minHeight: "400px" }}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Select
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Employee ID
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Name
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Company
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Designation
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Department
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Working Days
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Planned Date
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Bank Details
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-blue-900 uppercase bg-blue-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50 transition-colors ${selectedPayments[item.id] ? "bg-blue-50" : ""
                            }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPayments[item.id] || false}
                              onChange={() => handlePaymentToggle(item.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {item.employeeId || "N/A"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.mobileNo || "No phone"}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {item.companyName || "N/A"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.designation}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.department || "N/A"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.workingDays || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                            ₹
                            {(Number(item.amount) || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {formatDateForDisplay(item.plannedDate)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            <div className="font-medium">
                              {item.bankAccount || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.branchName || ""}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${item.paymentStatus === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => handleIndividualPayment(item)}
                                disabled={!item.paymentLink}
                                className={`flex items-center gap-1 px-2 py-1 text-xs text-white rounded
    ${item.paymentLink
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-gray-400 cursor-not-allowed"
                                  }
  `}
                              >
                                <CreditCard size={12} />
                                Paid
                              </button>
                              <button
                                onClick={() => downloadPaymentReceipt(item)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                                title="Download Receipt"
                              >
                                <Download size={12} />
                                Receipt
                              </button>

                              {item.formLink && (
                                <button
                                  onClick={() => openGoogleForm(item.formLink)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-white transition-colors bg-purple-600 rounded hover:bg-purple-700"
                                  title="Open Google Form"
                                >
                                  <FileText size={12} />
                                  Form
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="mb-4 text-gray-400">
                              <CreditCard size={48} />
                            </div>
                            <p className="text-lg font-medium text-gray-500">
                              {paymentData.length === 0
                                ? "No pending payments found"
                                : "No payments match your search criteria"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {paymentData.length === 0
                                ? "All payments are processed or no Planned dates are set"
                                : "Try adjusting your search or filters"}
                            </p>
                            {paymentData.length === 0 && (
                              <div className="mt-4 space-x-2">
                                <button
                                  onClick={() => window.location.reload()}
                                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                  Refresh Data
                                </button>
                                <button
                                  onClick={() => {
                                    // Force fetch with debug
                                    console.log("Manual refresh triggered");
                                    window.location.reload();
                                  }}
                                  className="px-4 py-2 text-white transition-colors bg-gray-600 rounded-md hover:bg-gray-700"
                                >
                                  Debug Refresh
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        {filteredData.length > 0 && (
          <div className="p-4 bg-white border border-gray-200 shadow rounded-xl">
            <div className="flex flex-col justify-between md:flex-row md:items-center">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">{filteredData.length}</span> of{" "}
                {paymentData.length} pending payments
                {selectedPeriod && ` for ${selectedPeriod}`}
                {filters.department && ` in ${filters.department}`}
              </div>
              <div className="mt-2 md:mt-0">
                <span className="mr-4 text-sm text-gray-600">
                  Selected Amount:{" "}
                  <span className="font-bold text-green-600">
                    ₹
                    {filteredData
                      .filter((item) => selectedPayments[item.id])
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString("en-IN")}
                  </span>
                </span>
                <button
                  onClick={handleBulkPayment}
                  disabled={
                    Object.values(selectedPayments).filter(Boolean).length === 0
                  }
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${Object.values(selectedPayments).filter(Boolean).length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                    }`}
                >
                  Mark Selected as Paid (
                  {Object.values(selectedPayments).filter(Boolean).length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakePayment;
