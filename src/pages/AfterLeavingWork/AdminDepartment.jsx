import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, FileText, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDepartment = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [activeDepartment, setActiveDepartment] = useState('all'); // 'all', 'admin', 'account', 'store'
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [advanceData, setAdvanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data for all departments
  const [formData, setFormData] = useState({
    // Admin Department
    idCard: false,
    visitingCard: false,
    
    // Account Department
    financialDocuments: false,
    advance: false,
    pending: false,
    
    // Store Department
    storeAssets: false
  });
  
  const [selectedDepartment, setSelectedDepartment] = useState('admin'); // Which department form to show

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      // Fetch both JOINING and Advance data in parallel
      const [joiningResponse, advanceResponse] = await Promise.all([
        fetch(
          'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'
        ),
        fetch(
          'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Advance&action=fetch'
        )
      ]);
      
      if (!joiningResponse.ok) {
        throw new Error(`HTTP error! status: ${joiningResponse.status}`);
      }
      
      const joiningResult = await joiningResponse.json();
      const advanceResult = await advanceResponse.json();
      
      if (!joiningResult.success) {
        throw new Error(joiningResult.error || 'Failed to fetch data from JOINING sheet');
      }
      
      const rawData = joiningResult.data || joiningResult;
      
      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      // Process advance data if available
      let advanceDataMap = {};
      if (advanceResult.success && Array.isArray(advanceResult.data)) {
        const advanceRows = advanceResult.data.length > 1 ? advanceResult.data.slice(1) : [];
        advanceRows.forEach(row => {
          const employeeCode = row[0]?.toString().trim();
          if (employeeCode) {
            advanceDataMap[employeeCode] = {
              closingAmount: row[6] || '', // Column G - Closing Amount
              name: row[1] || '' // Column B - Name (for verification)
            };
          }
        });
      }

      // Process data starting from row 7 (index 6) - skip headers
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      const processedData = dataRows.map(row => ({
        employeeCode: row[26] || '', // Column AA (index 26) - Employee Code
        serialNumber: row[1] || '',   // Column B (index 1) - Serial Number
        name: row[2] || '',           // Column C (index 2) - Name
        fatherName: row[3] || '',     // Column D (index 3) - Father Name
        dateOfJoining: row[9] || '', 
        dateOfLeaving: row[4] || '',
        designation: row[5] || '', 
        department: row[20] || '', 
        LeavingDate: row[55] || '', // Column BA (index 55) - Leaving Date
        assignAssets: row[40] || '', // Column AO (index 40) - Assign Assets/Laptop Details
        
        // Admin Department columns
        adminDeptPlanned: row[70] || '', // Column BS
        adminDeptActual: row[71] || '',  // Column BT
        adminSummary: row[73] || '', // Column BV - Admin Asset Handover Summary
        
        // Account Department columns
        accountDeptPlanned: row[74] || '', // Column BW
        accountDeptActual: row[75] || '',  // Column BX
        accountSummary: row[77] || '', // Column CA - Account Financial Clearance
        
        // Store Department columns
        storeDeptPlanned: row[78] || '', // Column CA (index 78)
        storeDeptActual: row[79] || '',  // Column CB (index 79)
        storeSummary: row[81] || '', // Column CD - Store Asset Handover Summary
        
        // Get advance amount from advance sheet
        advanceAmount: advanceDataMap[row[26]?.toString().trim()]?.closingAmount || '0'
      }));

      // Process pending and history for all departments
      const allPendingTasks = [];
      const allHistoryTasks = [];

      processedData.forEach(task => {
        // Check Admin Department
        if (task.adminDeptPlanned && !task.adminDeptActual) {
          allPendingTasks.push({
            ...task,
            departmentType: 'admin',
            status: 'Admin Pending'
          });
        } else if (task.adminDeptPlanned && task.adminDeptActual) {
          allHistoryTasks.push({
            ...task,
            departmentType: 'admin',
            status: 'Admin Completed'
          });
        }

        // Check Account Department
        if (task.accountDeptPlanned && !task.accountDeptActual) {
          allPendingTasks.push({
            ...task,
            departmentType: 'account',
            status: 'Account Pending'
          });
        } else if (task.accountDeptPlanned && task.accountDeptActual) {
          allHistoryTasks.push({
            ...task,
            departmentType: 'account',
            status: 'Account Completed'
          });
        }

        // Check Store Department
        if (task.storeDeptPlanned && !task.storeDeptActual) {
          allPendingTasks.push({
            ...task,
            departmentType: 'store',
            status: 'Store Pending'
          });
        } else if (task.storeDeptPlanned && task.storeDeptActual) {
          allHistoryTasks.push({
            ...task,
            departmentType: 'store',
            status: 'Store Completed'
          });
        }
      });

      setPendingData(allPendingTasks);
      setHistoryData(allHistoryTasks);
     
    } catch (error) {
      console.error('Error fetching joining data:', error);
      setError(error.message);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleProcessClick = (item) => {
    setFormData({
      idCard: false,
      visitingCard: false,
      financialDocuments: false,
      advance: false,
      pending: false,
      storeAssets: false
    });
    
    setSelectedItem(item);
    setSelectedDepartment(item.departmentType);
    setShowModal(true);
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedItem.employeeCode || !selectedItem.name) {
      toast.error('Please fill all required fields');
      setSubmitting(false);
      return;
    }

    try {
      // Fetch current data from JOINING sheet
      const fullDataResponse = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'
      );
      
      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;

      // Find header row
      let headerRowIndex = allData.findIndex(row =>
        row.some(cell => cell?.toString().trim().toLowerCase().includes('employee code'))
      );
      if (headerRowIndex === -1) headerRowIndex = 4;

      // Find Employee Code column index
      const employeeCodeIndex = 26; // Column AA

      // Find the employee row index
      const rowIndex = allData.findIndex((row, idx) =>
        idx > headerRowIndex &&
        row[employeeCodeIndex]?.toString().trim() === selectedItem.employeeCode?.toString().trim()
      );
      
      if (rowIndex === -1) {
        throw new Error(`Employee Code ${selectedItem.employeeCode} not found in JOINING sheet`);
      }

      // Current date in dd/mm/yy format
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const currentDate = `${day}/${month}/${year}`;

      const updatePromises = [];

      if (selectedDepartment === 'admin') {
        // Validate admin form
        const hasAdminChecked = formData.idCard || formData.visitingCard;
        if (!hasAdminChecked) {
          toast.error('Please select at least one asset handover item for Admin Department');
          setSubmitting(false);
          return;
        }

        // Create admin asset handover summary
        const adminCheckedItems = [];
        if (formData.idCard) adminCheckedItems.push('ID Card');
        if (formData.visitingCard) adminCheckedItems.push('Visiting Card');

        const adminSummary = adminCheckedItems.join(', ');

        // Update Column BV (index 73) with admin asset handover details
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: "74", // Column BV (index 73 + 1)
                value: adminSummary,
              }).toString(),
            }
          )
        );

        // Update Column BT (index 71) with current date
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: "72", // Column BT (index 71 + 1)
                value: currentDate,
              }).toString(),
            }
          )
        );

      } else if (selectedDepartment === 'account') {
        // Validate account form
        const hasAccountChecked = formData.financialDocuments || formData.advance || formData.pending;
        if (!hasAccountChecked) {
          toast.error('Please select at least one financial clearance item for Account Department');
          setSubmitting(false);
          return;
        }

        // Create financial clearance summary
        const accountCheckedItems = [];
        if (formData.financialDocuments) accountCheckedItems.push('Financial Documents');
        if (formData.advance) accountCheckedItems.push('Advance');
        if (formData.pending) accountCheckedItems.push('Pending');

        const accountSummary = accountCheckedItems.join(', ');

        // Update Column BY (index 76) with financial clearance details
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: "78", // Column BY (index 76 + 1)
                value: accountSummary,
              }).toString(),
            }
          )
        );

        // Update Column BX (index 75) with current date
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: "76", // Column BX (index 75 + 1)
                value: currentDate,
              }).toString(),
            }
          )
        );

      } else if (selectedDepartment === 'store') {
        // Validate store form
        if (!formData.storeAssets) {
          toast.error('Please confirm store asset handover');
          setSubmitting(false);
          return;
        }

        // Update Column CD (index 81) with store asset handover details
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: "82", // Column CD (index 81 + 1)
                value: "Store Assets Handed Over",
              }).toString(),
            }
          )
        );

        // Update Column CB (index 79) with current date
        updatePromises.push(
          fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "JOINING",
                action: "updateCell",
                rowIndex: (rowIndex + 1).toString(),
                columnIndex: "80", // Column CB (index 79 + 1)
                value: currentDate,
              }).toString(),
            }
          )
        );
      }

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const hasError = results.some((result) => !result.success);
      if (hasError) {
        throw new Error("Update failed");
      }

      toast.success(`${selectedDepartment.charAt(0).toUpperCase() + selectedDepartment.slice(1)} Department task completed successfully!`);
      setShowModal(false);
      fetchJoiningData();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter data based on department selection
  const getFilteredData = (data) => {
    return data.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = activeDepartment === 'all' || item.departmentType === activeDepartment;
      return matchesSearch && matchesDepartment;
    });
  };

  const filteredPendingData = getFilteredData(pendingData);
  const filteredHistoryData = getFilteredData(historyData);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === '0') return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Get status badge color
  const getStatusBadgeColor = (departmentType) => {
    switch (departmentType) {
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'account': return 'bg-blue-100 text-blue-800';
      case 'store': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
const formatDateForDisplay = (dateString) => {
  if (!dateString || dateString.trim() === '') return '-';
  
  try {
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Validate it's a date
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (day > 0 && day <= 31 && month > 0 && month <= 12) {
          return dateString;
        }
      }
    }
    
    // Try to parse other date formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return dateString || '-';
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString || '-';
  }
};
  // Get department icon
  const getDepartmentIcon = (departmentType) => {
    switch (departmentType) {
      case 'admin': return <Package size={14} className="mr-1" />;
      case 'account': return <FileText size={14} className="mr-1" />;
      case 'store': return <Package size={14} className="mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">After Leaving Work - All Departments</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by name or employee code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeDepartment === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveDepartment('all')}
            >
              All Departments
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                activeDepartment === 'admin'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
              onClick={() => setActiveDepartment('admin')}
            >
              <Package size={14} className="mr-1" />
              Admin
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                activeDepartment === 'account'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              onClick={() => setActiveDepartment('account')}
            >
              <FileText size={14} className="mr-1" />
              Account
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                activeDepartment === 'store'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              onClick={() => setActiveDepartment('store')}
            >
              <Package size={14} className="mr-1" />
              Store
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'history'
                  ? 'border-orange-500 text-orange-600'
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
          {activeTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaving Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
  {tableLoading ? (
    <tr>
      {/* Update colSpan from 10 to 11 */}
      <td colSpan="11" className="px-6 py-12 text-center">
        <div className="flex justify-center flex-col items-center">
          <div className="w-6 h-6 border-4 border-orange-500 border-dashed rounded-full animate-spin mb-2"></div>
          <span className="text-gray-600 text-sm">Loading pending requests...</span>
        </div>
      </td>
    </tr>
  ) : error ? (
    <tr>
      {/* Update colSpan from 10 to 11 */}
      <td colSpan="11" className="px-6 py-12 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={fetchJoiningData}
          className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Retry
        </button>
      </td>
    </tr>
  ) : filteredPendingData.map((item, index) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => handleProcessClick(item)}
          className={`px-3 py-1 rounded-md text-sm hover:opacity-90 text-white ${
            item.departmentType === 'admin' ? 'bg-orange-600' :
            item.departmentType === 'account' ? 'bg-blue-600' :
            'bg-purple-600'
          }`}
        >
          Process
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(item.departmentType)}`}>
          {getDepartmentIcon(item.departmentType)}
          {item.departmentType.charAt(0).toUpperCase() + item.departmentType.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeCode}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serialNumber}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDateForDisplay(item.dateOfJoining)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.LeavingDate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
      {/* Add this new cell for Planned Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.departmentType === 'admin' ? (item.adminDeptPlanned || '-') :
         item.departmentType === 'account' ? (item.accountDeptPlanned || '-') :
         (item.storeDeptPlanned || '-')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.departmentType === 'account' ? (
          <span className="font-medium text-green-600">{formatCurrency(item.advanceAmount)}</span>
        ) : item.departmentType === 'store' ? (
          <span>{item.assignAssets || 'No assets'}</span>
        ) : (
          <span>Admin Assets</span>
        )}
      </td>
    </tr>
  ))}
</tbody>
              </table>
              {!tableLoading && filteredPendingData.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">No pending requests found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaving Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-orange-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">Loading history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button 
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredHistoryData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(item.departmentType)}`}>
                          {getDepartmentIcon(item.departmentType)}
                          {item.departmentType.charAt(0).toUpperCase() + item.departmentType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.dateOfJoining ? new Date(item.dateOfJoining).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.LeavingDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.departmentType === 'account' ? (
                          <span className="font-medium text-green-600">{formatCurrency(item.advanceAmount)}</span>
                        ) : item.departmentType === 'store' ? (
                          <span>{item.assignAssets || 'No assets'}</span>
                        ) : (
                          <span>Admin Assets</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.departmentType === 'admin' ? (item.adminSummary || '-') :
                         item.departmentType === 'account' ? (item.accountSummary || '-') :
                         (item.storeSummary || '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!tableLoading && filteredHistoryData.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">No history found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-700">
                {selectedDepartment === 'admin' && 'Admin Department - Asset Handover'}
                {selectedDepartment === 'account' && 'Account Department - Financial Clearance'}
                {selectedDepartment === 'store' && 'Store Department - Asset Handover'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={selectedItem.employeeCode}
                    disabled
                    className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={selectedItem.serialNumber}
                    disabled
                    className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    disabled
                    className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>
              </div>

              {/* Department-specific content */}
              {selectedDepartment === 'admin' && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Hand Over of Assign Assets</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'idCard', label: 'ID Card' },
                      { key: 'visitingCard', label: 'Visiting Card' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={formData[item.key]}
                          onChange={() => handleCheckboxChange(item.key)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={item.key} className="ml-2 text-sm text-gray-700">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDepartment === 'account' && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-yellow-800">Pending Advance Amount:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedItem.advanceAmount)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Clear of Financial Documents</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: 'financialDocuments', label: 'Financial Documents' },
                        { key: 'advance', label: 'Advance' },
                        { key: 'pending', label: 'Pending' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={item.key}
                            checked={formData[item.key]}
                            onChange={() => handleCheckboxChange(item.key)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={item.key} className="ml-2 text-sm text-gray-700">
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedDepartment === 'store' && (
                <>
                  {selectedItem.assignAssets && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-blue-800 mr-2">Assigned Assets:</span>
                        <span className="text-sm text-blue-700">{selectedItem.assignAssets}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Hand over of Assign Assets Store</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="storeAssets"
                          checked={formData.storeAssets}
                          onChange={() => handleCheckboxChange('storeAssets')}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="storeAssets" className="ml-2 text-sm text-gray-700">
                          Store Assets
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

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
                  className={`px-4 py-2 text-white rounded-md hover:opacity-90 min-h-[42px] flex items-center justify-center ${
                    submitting ? 'opacity-90 cursor-not-allowed' : ''
                  } ${
                    selectedDepartment === 'admin' ? 'bg-orange-600 hover:bg-orange-700' :
                    selectedDepartment === 'account' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-purple-600 hover:bg-purple-700'
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

export default AdminDepartment;