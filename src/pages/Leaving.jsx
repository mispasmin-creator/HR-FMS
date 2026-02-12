import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  fetchEmployeeForLeaving,
  submitLeavingRequest,
  fetchLeavingHistory
} from "../services/leavingService";



const Leaving = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uiMessage, setUiMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: string }
  const [formData, setFormData] = useState({

    dateOfLeaving: '',
    mobileNumber: '',
    reasonOfLeaving: '',
    typeOfLeave: '',
    lastWorkingDate: '',
    workingDays: '',
    amount: ''
  });

  // Fetch history data on mount
  useEffect(() => {
    loadLeavingHistory();
  }, []);

  const loadLeavingHistory = async (showGlobalLoading = true) => {
    if (showGlobalLoading) setLoading(true);
    const result = await fetchLeavingHistory();
    if (result.success) {
      setHistoryData(result.history);
    } else {
      setError(result.error);
    }
    if (showGlobalLoading) setLoading(false);
  };

  // Search employee by code
  const handleSearchEmployee = async () => {
    if (!employeeCode.trim()) {
      toast.error("Please enter employee code");
      return;
    }

    setLoading(true);
    setSelectedEmployee(null);
    setUiMessage(null);

    const result = await fetchEmployeeForLeaving(employeeCode.trim());

    setLoading(false);

    if (!result.success) {
      setUiMessage({ type: 'error', text: result.error });
      return;
    }

    if (result.status === "ALREADY_LISTED") {
      setUiMessage({ type: 'info', text: result.error });
      setActiveTab("history");
      setSearchTerm(result.data.name_as_per_aadhar || result.data.serial_no || "");
      return;
    }

    if (result.status === "LEFT") {
      setUiMessage({ type: 'info', text: "Employee has already left. Showing in history." });
      setActiveTab("history");
      setSearchTerm(result.data.name_as_per_aadhar || result.data.serial_no || "");
      return;
    }

    // ACTIVE employee
    setSelectedEmployee({
      rowIndex: result.data.id,
      employeeCode: result.data.employee_code,
      employeeNo: result.data.serial_no,
      candidateName: result.data.name_as_per_aadhar,
      fatherName: result.data.father_name,
      dateOfJoining: result.data.date_of_joining,
      designation: result.data.designation,
      department: result.data.department,
      mobileNo: result.data.mobile_no,
      firmName: result.data.after_joining_company_name,
      workingPlace: result.data.after_joining_joining_place,
      timestamp: result.data.created_at
    });

    setUiMessage({ type: 'success', text: `Employee Found: ${result.data.name_as_per_aadhar}` });
    setActiveTab("pending");
  };

  const handleClearSearch = () => {
    setEmployeeCode('');
    setSelectedEmployee(null);
    setSearchTerm('');
    setUiMessage(null);
    loadLeavingHistory();
  };



  // Filter pending data

  // Filter history data
  const filteredHistoryData = historyData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(searchLower) ||
      item.employeeId?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleLeavingClick = (item) => {
    setSelectedItem(item);
    setFormData({
      dateOfLeaving: '',
      mobileNumber: item.mobileNo || '',
      reasonOfLeaving: '',
      typeOfLeave: '',
      lastWorkingDate: '',
      workingDays: '',
      amount: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate all required fields
    if (
      !formData.dateOfLeaving ||
      !formData.reasonOfLeaving ||
      !formData.typeOfLeave ||
      !formData.lastWorkingDate ||
      !formData.workingDays ||
      !formData.amount ||
      !formData.mobileNumber
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate numeric fields
    if (isNaN(formData.workingDays) || formData.workingDays <= 0) {
      toast.error("Working days must be a positive number");
      return;
    }

    if (isNaN(formData.amount) || formData.amount < 0) {
      toast.error("Amount must be a valid number");
      return;
    }


    try {
      setSubmitting(true);

      const result = await submitLeavingRequest(selectedItem, formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to submit leaving request");
      }

      // ✅ Reset form
      setFormData({
        dateOfLeaving: "",
        reasonOfLeaving: "",
        typeOfLeave: "",
        mobileNumber: "",
        lastWorkingDate: "",
        workingDays: "",
        amount: ""
      });

      // ✅ Close modal & clear selected employee
      setShowModal(false);
      setSelectedItem(null);
      setSelectedEmployee(null);
      setSearchTerm("");
      setUiMessage(null);
      setEmployeeCode("");

      // ✅ LOAD HISTORY FROM DB (without full page loading spinner)
      await loadLeavingHistory(false);

      // ✅ SWITCH TAB
      setActiveTab("history");


      toast.success("Leaving request added successfully!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Something went wrong: " + error.message);
    } finally {

      setSubmitting(false);
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leaving</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Enter employee code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
                disabled
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaving data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leaving</h1>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="text-red-500 text-xl mb-4">Error Loading Data</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadLeavingHistory}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaving</h1>
      </div>

      {/* Employee Code Search Form */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee Code</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter employee code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchEmployee()}
                />
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              <button
                onClick={handleSearchEmployee}
                className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800"
              >
                Search
              </button>
              {(employeeCode || selectedEmployee) && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Clear
                </button>
              )}

            </div>
          </div>

          {uiMessage && (
            <div className={`p-3 border rounded-lg flex items-center gap-3 ${uiMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              uiMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
              {uiMessage.type === 'error' ? <AlertCircle size={18} /> :
                uiMessage.type === 'success' ? <CheckCircle size={18} /> :
                  <AlertCircle size={18} className="text-blue-500" />}
              <p className="text-sm">
                <span className="font-medium">{uiMessage.type.charAt(0).toUpperCase() + uiMessage.type.slice(1)}:</span> {uiMessage.text}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Filter and Search for History */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search history by name or employee ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({selectedEmployee ? 1 : 0})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('history')}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History ({filteredHistoryData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto">

              {/* 🔹 Empty state (no employee searched yet) */}
              {!selectedEmployee && (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-gray-500">
                    Please enter an employee code above to view leaving details.
                  </p>
                </div>
              )}

              {/* 🔹 Employee found (single-row table) */}
              {selectedEmployee && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Serial No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Father Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Department
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleLeavingClick(selectedEmployee)}
                          className="px-3 py-1 bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-800"
                        >
                          Leaving
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDateTime(selectedEmployee.timestamp)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {selectedEmployee.employeeNo || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {selectedEmployee.candidateName || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {selectedEmployee.fatherName || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {selectedEmployee.dateOfJoining
                          ? formatDOB(selectedEmployee.dateOfJoining)
                          : "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {selectedEmployee.designation || "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {selectedEmployee.department || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}



          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Leaving</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason Of Leaving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {filteredHistoryData.length > 0 ? (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(item.timestamp)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.dateOfJoining ? formatDOB(item.dateOfJoining) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.dateOfLeaving ? formatDOB(item.dateOfLeaving) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.workingDays}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reasonOfLeaving}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No leaving history found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-700">Leaving Form</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={selectedItem.employeeNo}
                  disabled
                  className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                <input
                  type="text"
                  value={selectedItem.employeeCode || ''}
                  disabled
                  className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={selectedItem.candidateName}
                  disabled
                  className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div>
                <select
                  name="typeOfLeave"
                  value={formData.typeOfLeave}
                  onChange={handleInputChange}
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  required
                >
                  <option value="">Select Type of Leave</option>
                  <option value="Resignation">Resignation</option>
                  <option value="Termination">Termination</option>
                </select>
              </div>

              {formData.typeOfLeave === 'Resignation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date Of Leaving *</label>
                    <input
                      type="date"
                      name="dateOfLeaving"
                      value={formData.dateOfLeaving}
                      onChange={handleInputChange}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason Of Leaving *</label>
                    <textarea
                      name="reasonOfLeaving"
                      value={formData.reasonOfLeaving}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 resize-none"
                      required
                    />
                  </div>
                </>
              )}

              {formData.typeOfLeave === 'Termination' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date Of Termination *</label>
                    <input
                      type="date"
                      name="dateOfLeaving"
                      value={formData.dateOfLeaving}
                      onChange={handleInputChange}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason Of Termination *</label>
                    <textarea
                      name="reasonOfLeaving"
                      value={formData.reasonOfLeaving}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 resize-none"
                      required
                    />
                  </div>
                </>
              )}

              {formData.typeOfLeave && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Working Date *</label>
                  <input
                    type="date"
                    name="lastWorkingDate"
                    value={formData.lastWorkingDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Working Days *</label>
                <input
                  type="number"
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  placeholder="Enter number of working days"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${submitting ? 'opacity-90 cursor-not-allowed' : ''
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </div>
                  ) : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaving;