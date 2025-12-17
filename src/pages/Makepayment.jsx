import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, CreditCard, ExternalLink, Eye, Download } from 'lucide-react';

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
    employmentType: "",
    location: "",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch data from Google Sheets - updated to include payment link column
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=Payroll&action=fetch"
        );
        const data = await response.json();

        if (data && data.success && data.data) {
          const headers = data.data[0];
          const rows = data.data.slice(1);

          // Transform data - assuming payment link is in column R (index 17)
          const transformedData = rows.map((row) => ({
            serialNo: row[0] || "",
            employeeCode: row[1] || "",
            employeeName: row[2] || "",
            designation: row[3] || "",
            daysPresent: row[4] || 0,
            totalActual: parseFloat(row[5]) || 0,
            basic: parseFloat(row[6]) || 0,
            conveyance: parseFloat(row[7]) || 0,
            hra: parseFloat(row[8]) || 0,
            medicalAllowance: parseFloat(row[9]) || 0,
            specialAllowance: parseFloat(row[10]) || 0,
            otherAllowances: parseFloat(row[11]) || 0,
            loan: parseFloat(row[12]) || 0,
            additionalSalary: parseFloat(row[13]) || 0,
            toBePaidAfterPF: parseFloat(row[14]) || 0,
            year: row[15] || "",
            month: row[16] || "",
            paymentLink: row[17] || "", // Payment link from column R
            paymentStatus: row[18] || "Pending", // Assuming column S for status
            transactionId: row[19] || "", // Assuming column T for transaction ID
          }));

          // Initialize selected payments based on payment status
          const initialSelections = {};
          transformedData.forEach(item => {
            initialSelections[item.employeeCode] = item.paymentStatus === "Completed";
          });
          setSelectedPayments(initialSelections);
          
          setPaymentData(transformedData);
        } else {
          throw new Error(data.error || "Failed to fetch data");
        }
      } catch (error) {
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

  const handlePaymentToggle = (employeeCode) => {
    setSelectedPayments(prev => ({
      ...prev,
      [employeeCode]: !prev[employeeCode]
    }));
  };

  const handleBulkPayment = () => {
    const selectedEmployees = paymentData.filter(
      item => selectedPayments[item.employeeCode]
    );
    
    if (selectedEmployees.length === 0) {
      showNotification("Please select at least one employee for payment", "error");
      return;
    }

    showNotification(`Processing payments for ${selectedEmployees.length} employees`, "info");
    
    // In a real application, you would integrate with payment gateway here
    // For now, we'll simulate payment processing
    setTimeout(() => {
      showNotification("Payments processed successfully!", "success");
      
      // Update payment status locally
      const updatedData = paymentData.map(item => {
        if (selectedPayments[item.employeeCode]) {
          return {
            ...item,
            paymentStatus: "Completed",
            transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
          };
        }
        return item;
      });
      
      setPaymentData(updatedData);
      
      // Clear selections
      const clearedSelections = {};
      paymentData.forEach(item => {
        clearedSelections[item.employeeCode] = false;
      });
      setSelectedPayments(clearedSelections);
    }, 2000);
  };

  const handleIndividualPayment = (employeeCode, paymentLink) => {
    if (!paymentLink) {
      showNotification("No payment link available for this employee", "error");
      return;
    }

    // Open payment link in new tab
    window.open(paymentLink, '_blank');
    
    // Update payment status for this employee
    const updatedData = paymentData.map(item => {
      if (item.employeeCode === employeeCode) {
        return {
          ...item,
          paymentStatus: "In Progress"
        };
      }
      return item;
    });
    
    setPaymentData(updatedData);
    showNotification(`Opening payment gateway for ${employeeCode}`, "info");
  };

  const downloadPaySlip = (employeeCode) => {
    const employee = paymentData.find(item => item.employeeCode === employeeCode);
    if (employee) {
      showNotification(`Downloading pay slip for ${employee.employeeName}`, "success");
      // In a real app, this would generate/download a PDF
      // For demo, we'll create a simple text file
      const paySlipContent = `
        PAY SLIP
        Employee: ${employee.employeeName}
        Code: ${employee.employeeCode}
        Designation: ${employee.designation}
        Period: ${employee.month} ${employee.year}
        
        EARNINGS:
        Basic: ₹${employee.basic.toLocaleString()}
        HRA: ₹${employee.hra.toLocaleString()}
        Conveyance: ₹${employee.conveyance.toLocaleString()}
        Medical Allowance: ₹${employee.medicalAllowance.toLocaleString()}
        Special Allowance: ₹${employee.specialAllowance.toLocaleString()}
        Other Allowances: ₹${employee.otherAllowances.toLocaleString()}
        Additional Salary: ₹${employee.additionalSalary.toLocaleString()}
        
        DEDUCTIONS:
        Loan: ₹${employee.loan.toLocaleString()}
        
        NET PAYABLE: ₹${employee.toBePaidAfterPF.toLocaleString()}
        Status: ${employee.paymentStatus}
      `;
      
      const blob = new Blob([paySlipContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${employee.employeeCode}_${employee.month}_${employee.year}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const filteredData = paymentData.filter((item) => {
    const matchesSearch = 
      item.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.year.toString().includes(searchTerm) ||
      item.month.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesPeriod = true;
    if (selectedPeriod) {
      const [selectedYear, selectedMonthNum] = selectedPeriod.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const selectedMonthName = monthNames[parseInt(selectedMonthNum) - 1];
      matchesPeriod = item.year.toString() === selectedYear && 
                     item.month.toString() === selectedMonthName;
    }
    
    return matchesSearch && matchesPeriod;
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
              Make Payments
            </h1>
            <p className="text-gray-600 mt-1">Process salary payments for employees</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleBulkPayment}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <CreditCard size={18} />
              Process Bulk Payments
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              <Download size={18} />
              Export Report
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
                  placeholder="Search employees, status, or period..."
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
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 font-medium">
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange("department", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm"
                    >
                      <option value="">All Departments</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Total Payable</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              ₹{filteredData.reduce((sum, item) => sum + item.toBePaidAfterPF, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Pending Payments</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {filteredData.filter(item => item.paymentStatus === "Pending").length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {filteredData.filter(item => item.paymentStatus === "Completed").length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
            <div className="text-sm text-gray-500">Selected for Payment</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {Object.values(selectedPayments).filter(Boolean).length}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white bg-opacity-70 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-red-600">Error: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
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
                        Emp Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Designation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Net Payable
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Payment Status
                      </th>
                      {/* <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Transaction ID
                      </th> */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider bg-blue-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item, index) => (
                        <tr 
                          key={index} 
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedPayments[item.employeeCode] ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPayments[item.employeeCode] || false}
                              onChange={() => handlePaymentToggle(item.employeeCode)}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.employeeCode}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{item.employeeName}</div>
                            <div className="text-xs text-gray-500">{item.department || "Department"}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.designation}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ₹{item.toBePaidAfterPF.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{item.month}</div>
                            <div className="text-xs text-gray-500">{item.year}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              item.paymentStatus === "Completed" 
                                ? "bg-green-100 text-green-800"
                                : item.paymentStatus === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : item.paymentStatus === "Failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.paymentStatus}
                            </span>
                          </td>
                          {/* <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {item.transactionId || "N/A"}
                          </td> */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleIndividualPayment(item.employeeCode, item.paymentLink)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                title="Make Payment"
                              >
                                <CreditCard size={12} />
                                Pay Now
                              </button>
                              
                              <button
                                onClick={() => downloadPaySlip(item.employeeCode)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                                title="Download Pay Slip"
                              >
                                <Download size={12} />
                                Slip
                              </button>
                              
                              {item.paymentLink && (
                                <a
                                  href={item.paymentLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800"
                                  title="Open Payment Link"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-gray-400 mb-4">
                              <CreditCard size={48} />
                            </div>
                            <p className="text-gray-500 text-lg font-medium">
                              No payment records found
                            </p>
                            <p className="text-gray-400 mt-1">
                              Try adjusting your search or filters
                            </p>
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
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredData.length}</span> employees
              {selectedPeriod && ` for ${selectedPeriod}`}
            </div>
            <div className="mt-2 md:mt-0">
              <span className="text-sm text-gray-600 mr-4">
                Selected Amount: <span className="font-bold text-green-600">
                  ₹{filteredData
                    .filter(item => selectedPayments[item.employeeCode])
                    .reduce((sum, item) => sum + item.toBePaidAfterPF, 0)
                    .toLocaleString()}
                </span>
              </span>
              <button
                onClick={handleBulkPayment}
                disabled={Object.values(selectedPayments).filter(Boolean).length === 0}
                className={`px-6 py-2 rounded-lg font-medium ${
                  Object.values(selectedPayments).filter(Boolean).length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                }`}
              >
                Pay Selected ({Object.values(selectedPayments).filter(Boolean).length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakePayment;
