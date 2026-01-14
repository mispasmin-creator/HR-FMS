import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, CreditCard, ExternalLink, Eye, Download, FileText } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching data from JOINING sheet...");
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
        );
        const data = await response.json();

        if (data && data.success && data.data) {
          const headers = data.data[0] || [];
          const rows = data.data.slice(1) || [];
          
          console.log(`Total rows fetched: ${rows.length}`);
          console.log("Total columns:", headers.length);
          console.log("First few headers:", headers.slice(0, 10).map((h, i) => `${i}: "${h}"`).join(', '));
          
          // Log all headers for debugging
          console.log("ALL HEADERS:");
          headers.forEach((header, index) => {
            console.log(`${index}: ${header}`);
          });
          
         // Column mapping: A=0, B=1, C=2... Z=25, AA=26... DE=108, DF=109
          // ZERO-BASED indices for reading from array
          const columnIndices = {
            employeeId: 26,   // Column AA
            name: 2,          // Column C
            designation: 35,  // Column AJ
            leavingDate: 55,  // Column BD
            terminationReason: 56, // Column BE
            lastWorkingDate: 57,   // Column BF
            amount: 105,      // Column DA - VERIFY THIS
            mobileNo: 11,     // Column L
            bankAccount: 33,  // Column AH
            branchName: 16,   // Column Q
            plannedDate: 108, // Column DE - Planned ✓
            actualDate: 109,  // Column DF - Actual ✓
            formLink: 111,    // Column DH
            department: 20,   // Column U
            joiningDate: 4,   // Column E
            email: 18,        // Column S
            aadharNo: 21,     // Column V
            status: 110,      // Column DG
          };
          
          console.log("📍 Column Indices (0-based):", {
            plannedDate: columnIndices.plannedDate,
            actualDate: columnIndices.actualDate,
            de_column: "DE = 108",
            df_column: "DF = 109"
          });

          
          console.log("Using column indices:", columnIndices);
          
          // Transform and filter data - FIXED LOGIC
          const pendingPayments = [];
          
          rows.forEach((row, rowIndex) => {
            try {
              // Get Planned (DE) and Actual (DF) values
              const plannedValue = row[columnIndices.plannedDate];
              const actualValue = row[columnIndices.actualDate];
              const amountValue = row[columnIndices.amount];
              const employeeId = row[columnIndices.employeeId];
              
              // Debug log for first 5 rows
              if (rowIndex < 5) {
                console.log(`Row ${rowIndex + 2}:`, {
                  employeeId: employeeId,
                  name: row[columnIndices.name],
                  planned: plannedValue,
                  actual: actualValue,
                  amount: amountValue,
                  hasPlanned: !!plannedValue && plannedValue.toString().trim() !== "",
                  hasActual: !!actualValue && actualValue.toString().trim() !== ""
                });
              }
              
              // Convert to strings and check emptiness
              const plannedStr = plannedValue ? plannedValue.toString().trim() : "";
              const actualStr = actualValue ? actualValue.toString().trim() : "";
              
              // CRITICAL: Show if Planned has value AND Actual is empty
              // Check if Planned has any value (not null, not undefined, not empty string)
              const hasPlannedValue = plannedStr !== "";
              
              // Check if Actual is empty (null, undefined, or empty string)
              const isActualEmpty = actualStr === "";
              
              if (hasPlannedValue && isActualEmpty) {
                // Parse amount
                let amount = 0;
                if (amountValue) {
                  // Extract numbers from the amount string
                  const amountStr = amountValue.toString().replace(/[^0-9.-]+/g, '');
                  amount = parseFloat(amountStr) || 0;
                }
                
                // Check if employee has a valid ID
                const hasEmployeeId = employeeId && employeeId.toString().trim() !== "";
                
                if (hasEmployeeId) {
                  const paymentRecord = {
                    id: `row-${rowIndex}`,
                    rowIndex: rowIndex + 2, // +2 because header row is 1 and we want sheet row number
                    employeeId: employeeId.toString().trim(),
                    name: (row[columnIndices.name] || "").toString().trim(),
                    designation: (row[columnIndices.designation] || "").toString().trim(),
                    leavingDate: (row[columnIndices.leavingDate] || "").toString().trim(),
                    terminationReason: (row[columnIndices.terminationReason] || "").toString().trim(),
                    lastWorkingDate: (row[columnIndices.lastWorkingDate] || "").toString().trim(),
                    amount: amount,
                    mobileNo: (row[columnIndices.mobileNo] || "").toString().trim(),
                    bankAccount: (row[columnIndices.bankAccount] || "").toString().trim(),
                    branchName: (row[columnIndices.branchName] || "").toString().trim(),
                    plannedDate: plannedStr,
                    actualDate: "",
                    formLink: (row[columnIndices.formLink] || "").toString().trim(),
                    paymentStatus: "Pending",
                    paymentDate: "",
                    department: (row[columnIndices.department] || "").toString().trim(),
                    email: (row[columnIndices.email] || "").toString().trim(),
                    joiningDate: (row[columnIndices.joiningDate] || "").toString().trim(),
                    aadharNo: (row[columnIndices.aadharNo] || "").toString().trim(),
                    sheetRow: rowIndex + 2 // Actual row number in Google Sheets
                  };
                  
                  pendingPayments.push(paymentRecord);
                  
                  // Debug log for first few records
                  if (pendingPayments.length <= 3) {
                    console.log("Added pending payment:", {
                      employeeId: paymentRecord.employeeId,
                      name: paymentRecord.name,
                      plannedDate: paymentRecord.plannedDate,
                      amount: paymentRecord.amount
                    });
                  }
                }
              }
            } catch (rowError) {
              console.error(`Error processing row ${rowIndex}:`, rowError);
            }
          });
          
          console.log(`Found ${pendingPayments.length} pending payments`);
          
          if (pendingPayments.length > 0) {
            console.log("First few pending payments:");
            pendingPayments.slice(0, 5).forEach((item, idx) => {
              console.log(`${idx + 1}. ${item.employeeId} - ${item.name} - Planned: ${item.plannedDate} - Amount: ₹${item.amount}`);
            });
          } else {
            console.log("No pending payments found. Checking data conditions:");
            console.log("1. Looking for rows where Planned (DE) has value and Actual (DF) is empty");
            console.log("2. Column DE index:", columnIndices.plannedDate);
            console.log("3. Column DF index:", columnIndices.actualDate);
            
            // Sample some rows to see what's happening
            console.log("\nSample rows (first 5):");
            rows.slice(0, 5).forEach((row, idx) => {
              console.log(`Row ${idx + 2}:`, {
                employeeId: row[columnIndices.employeeId],
                name: row[columnIndices.name],
                planned: row[columnIndices.plannedDate],
                actual: row[columnIndices.actualDate],
                amount: row[columnIndices.amount]
              });
            });
          }
          
          // Initialize selected payments
          const initialSelections = {};
          pendingPayments.forEach(item => {
            initialSelections[item.id] = false;
          });
          setSelectedPayments(initialSelections);
          
          setPaymentData(pendingPayments);
        } else {
          throw new Error(data.error || "Failed to fetch data from JOINING sheet");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
        showNotification(`Failed to load data: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handlePaymentToggle = (paymentId) => {
    setSelectedPayments(prev => ({
      ...prev,
      [paymentId]: !prev[paymentId]
    }));
  };

  const handleBulkPayment = async () => {
    const selectedItems = paymentData.filter(
      item => selectedPayments[item.id]
    );
    
    if (selectedItems.length === 0) {
      showNotification("Please select at least one payment to process", "error");
      return;
    }

    showNotification(`Processing ${selectedItems.length} payments...`, "info");
    
    try {
      const currentDate = new Date();
      // Format date as MM/DD/YYYY HH:MM:SS to match Google Sheets format
      const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
      
      console.log(`Bulk payment date: ${formattedDate}`);
      
      // Process each selected payment
      for (const item of selectedItems) {
        try {
          console.log(`Processing payment for ${item.name} (Row: ${item.sheetRow})`);
          
          const updateUrl = "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec";
          
          const params = new URLSearchParams();
          params.append('sheetName', 'JOINING');
          params.append('action', 'updateCell');
          params.append('rowIndex', item.sheetRow);
          params.append('columnIndex', 110); // Column DF is index 110 (0-based)
          params.append('value', formattedDate);
          
          const response = await fetch(updateUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
          });
          
          console.log(`Response for ${item.name}:`, response);
          
        } catch (itemError) {
          console.error(`Error processing ${item.name}:`, itemError);
        }
      }
      
      showNotification(`${selectedItems.length} payments marked as paid!`, "success");
      
      // Remove processed items from the list
      const processedIds = selectedItems.map(item => item.id);
      const remainingPayments = paymentData.filter(item => !processedIds.includes(item.id));
      setPaymentData(remainingPayments);
      
      // Clear selections
      const clearedSelections = {};
      remainingPayments.forEach(item => {
        clearedSelections[item.id] = false;
      });
      setSelectedPayments(clearedSelections);
      
    } catch (error) {
      console.error("Bulk payment error:", error);
      showNotification(`Payment processing failed: ${error.message}`, "error");
    }
  };

  const handleIndividualPayment = async (item) => {
    if (!item.id) {
      showNotification("Invalid payment record", "error");
      return;
    }

    try {
      showNotification(`Processing payment for ${item.name}...`, "info");
      
      const currentDate = new Date();
      // Format date as MM/DD/YYYY HH:MM:SS
      const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
      
      console.log(`Updating row ${item.sheetRow}, column DF with date: ${formattedDate}`);
      
      const updateUrl = "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec";
      
      const params = new URLSearchParams();
      params.append('sheetName', 'JOINING');
      params.append('action', 'updateCell');
      params.append('rowIndex', item.sheetRow);
      params.append('columnIndex', 110); // Column DF is index 110 (0-based)
      params.append('value', formattedDate);
      
      const response = await fetch(updateUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      
      if (response.ok) {
        showNotification(`Payment recorded for ${item.name}`, "success");
        
        // Remove the item from the list
        const updatedData = paymentData.filter(payment => payment.id !== item.id);
        setPaymentData(updatedData);
        
        // Clear selection for this item
        setSelectedPayments(prev => ({
          ...prev,
          [item.id]: false
        }));
      } else {
        throw new Error("Failed to update payment record");
      }
      
    } catch (error) {
      console.error("Individual payment error:", error);
      showNotification(`Payment failed: ${error.message}`, "error");
    }
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
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
Time: ${new Date().toLocaleTimeString('en-IN')}

EMPLOYEE DETAILS:
-----------------
Employee ID: ${item.employeeId || "N/A"}
Name: ${item.name || "N/A"}
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
Settlement Amount: ₹${item.amount.toLocaleString('en-IN')}
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
Amount: ₹${item.amount.toLocaleString('en-IN')} only.
====================================
`;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Settlement_Receipt_${item.employeeId}_${item.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
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
      if (str.includes(' ')) {
        const [datePart, timePart] = str.split(' ');
        const [month, day, year] = datePart.split('/');
        return `${day}/${month}/${year}`;
      }
      
      // Handle date without timestamp
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }
      
      // Try to parse as Date object
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
    window.open(formLink, '_blank', 'noopener,noreferrer');
    showNotification("Opening Google Form...", "info");
  };

  const filteredData = paymentData.filter((item) => {
    // Apply search filter
    const matchesSearch = searchTerm === "" || 
      (item.employeeId && item.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.designation && item.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.mobileNo && item.mobileNo.includes(searchTerm)) ||
      (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = !filters.status || item.paymentStatus === filters.status;
    
    // Apply department filter
    const matchesDepartment = !filters.department || 
      (item.department && item.department.toLowerCase().includes(filters.department.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900 p-4 md:p-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "error"
              ? "bg-red-100 text-red-800 border border-red-300"
              : notification.type === "info"
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-green-100 text-green-800 border border-green-300"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "error" ? "⚠️" : notification.type === "info" ? "ℹ️" : "✅"}
            <span className="ml-2">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
              Employee Settlement Payments
            </h1>
            <p className="text-gray-600 mt-1">
              Process final settlement payments (Planned date filled, Actual date empty)
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Showing: {paymentData.length} pending payments
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleBulkPayment}
              disabled={Object.values(selectedPayments).filter(Boolean).length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md ${
                Object.values(selectedPayments).filter(Boolean).length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CreditCard size={18} />
              Mark Selected as Paid ({Object.values(selectedPayments).filter(Boolean).length})
            </button>
            <button 
              onClick={() => {
                // Export all pending payments
                if (paymentData.length === 0) {
                  showNotification("No data to export", "warning");
                  return;
                }
                
                const csvContent = "data:text/csv;charset=utf-8," 
                  + ["Employee ID,Name,Designation,Department,Amount,Mobile No,Bank Account,Branch Name,Planned Date,Last Working Date"].join(",") + "\n"
                  + paymentData.map(item => 
                    `"${item.employeeId}","${item.name}","${item.designation}","${item.department}",${item.amount},"${item.mobileNo}","${item.bankAccount}","${item.branchName}","${formatDateForDisplay(item.plannedDate)}","${formatDateForDisplay(item.lastWorkingDate)}"`
                  ).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Pending_Payments_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification("Report exported successfully!", "success");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-gray-200 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Employee ID, Name, Designation, Mobile or Department..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <Calendar
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700">
                  <Filter size={18} />
                  Filter
                </button>
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 p-4 space-y-3 border border-gray-200">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 font-medium">
                      Payment Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 font-medium">
                      Department
                    </label>
                    <input
                      type="text"
                      value={filters.department}
                      onChange={(e) => handleFilterChange("department", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm"
                      placeholder="Enter department"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Total Pending Amount</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              ₹{paymentData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Pending Payments</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {paymentData.length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Selected for Payment</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {Object.values(selectedPayments).filter(Boolean).length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Total Amount Selected</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              ₹{paymentData
                .filter(item => selectedPayments[item.id])
                .reduce((sum, item) => sum + item.amount, 0)
                .toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white bg-opacity-70 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Loading pending payments...</span>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-red-600 font-medium">Error: {error}</p>
                <p className="text-gray-500 text-sm mt-2">Please check console for details</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 350px)", minHeight: "400px" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Employee ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Designation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Planned Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Bank Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedPayments[item.id] ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPayments[item.id] || false}
                              onChange={() => handlePaymentToggle(item.id)}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.employeeId || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.mobileNo || "No phone"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.designation}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.department || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateForDisplay(item.plannedDate)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{item.bankAccount || "N/A"}</div>
                            <div className="text-xs text-gray-500">{item.branchName || ""}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              item.paymentStatus === "Completed" 
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => handleIndividualPayment(item)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                title="Mark as Paid"
                              >
                                <CreditCard size={12} />
                                Paid
                              </button>
                              
                              <button
                                onClick={() => downloadPaymentReceipt(item)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                title="Download Receipt"
                              >
                                <Download size={12} />
                                Receipt
                              </button>
                              
                              {item.formLink && (
                                <button
                                  onClick={() => openGoogleForm(item.formLink)}
                                  className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
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
                            <div className="text-gray-400 mb-4">
                              <CreditCard size={48} />
                            </div>
                            <p className="text-gray-500 text-lg font-medium">
                              {paymentData.length === 0 
                                ? "No pending payments found" 
                                : "No payments match your search criteria"}
                            </p>
                            <p className="text-gray-400 mt-1 text-sm">
                              {paymentData.length === 0 
                                ? "All payments are processed or no Planned dates are set" 
                                : "Try adjusting your search or filters"}
                            </p>
                            {paymentData.length === 0 && (
                              <div className="mt-4 space-x-2">
                                <button
                                  onClick={() => window.location.reload()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Refresh Data
                                </button>
                                <button
                                  onClick={() => {
                                    // Force fetch with debug
                                    console.log("Manual refresh triggered");
                                    window.location.reload();
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
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
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredData.length}</span> of {paymentData.length} pending payments
                {selectedPeriod && ` for ${selectedPeriod}`}
                {filters.department && ` in ${filters.department}`}
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-sm text-gray-600 mr-4">
                  Selected Amount: <span className="font-bold text-green-600">
                    ₹{filteredData
                      .filter(item => selectedPayments[item.id])
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString('en-IN')}
                  </span>
                </span>
                <button
                  onClick={handleBulkPayment}
                  disabled={Object.values(selectedPayments).filter(Boolean).length === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    Object.values(selectedPayments).filter(Boolean).length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                  }`}
                >
                  Mark Selected as Paid ({Object.values(selectedPayments).filter(Boolean).length})
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