import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportingManager = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    reportingManagerCheck: false,
    // NEW FIELDS
    remarks: '',
    processType: '', // 'indent' or 'temporary-backup'
    // Temporary Backup Fields
    temporaryBackupName: '',
    // Indent Fields
    indentPost: '',
    indentCompany: '',
    indentGender: '',
    indentDepartment: '',
    indentPrefer: '',
    indentExperience: '',
    indentNumberOfPost: '',
    indentCompetitionDate: '',
    indentSocialSite: '',
    indentSocialSiteTypes: [],
  });

  // State for dropdown options
  const [departments, setDepartments] = useState([]);
  const [socialSiteOptions, setSocialSiteOptions] = useState([]);

  // Fetch departments from Master sheet
  const fetchDepartments = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Master&action=fetch'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Assuming departments are in Column A of Master sheet
        const deptList = result.data
          .slice(1) // Skip header row
          .map(row => row[1]) // Column A
          .filter(dept => dept && dept.trim() !== '');
        
        setDepartments(deptList);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch social site options from Master sheet
  // Replace the existing fetchSocialSiteOptions function with this:
const fetchSocialSiteOptions = async () => {
  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Master&action=fetch'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // Assuming social sites are in a specific column - let's check different columns
      // First row is headers, so start from index 1
      const rows = result.data.slice(1);
      
      // Try different columns - you might need to adjust the column index
      let socialSites = [];
      
      // Option 1: If you know the exact column index (e.g., column C = index 2)
      // socialSites = rows.map(row => row[2]).filter(site => site && site.trim() !== '');
      
      // Option 2: Search all rows for social site options
      for (let row of rows) {
        for (let cell of row) {
          if (cell && typeof cell === 'string') {
            const lowerCell = cell.toLowerCase();
            if (lowerCell.includes('indeed') || 
                lowerCell.includes('naukri') || 
                lowerCell.includes('linkedin') ||
                lowerCell.includes('referral') ||
                lowerCell.includes('job consultancy') ||
                lowerCell.includes('timesjobs') ||
                lowerCell.includes('internshala') ||
                lowerCell.includes('apna') ||
                lowerCell.includes('workindia')) {
              socialSites.push(cell.trim());
            }
          }
        }
      }
      
      // Remove duplicates
      socialSites = [...new Set(socialSites)];
      
      // If no social sites found, use default options
      if (socialSites.length === 0) {
        socialSites = [
          'Indeed.com',
          'Naukri.com',
          'LinkedIn',
          'Referral',
          'Job Consultancy',
          'TimesJobs',
          'Internshala',
          'Apna',
          'WorkIndia',
          'Other'
        ];
      }
      
      setSocialSiteOptions(socialSites);
    }
  } catch (error) {
    console.error('Error fetching social site options:', error);
    // Set default options if fetch fails
    setSocialSiteOptions([
      'Indeed.com',
      'Naukri.com',
      'LinkedIn',
      'Referral',
      'Job Consultancy',
      'TimesJobs',
      'Internshala',
      'Apna',
      'WorkIndia',
      'Other'
    ]);
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



  const fetchJoiningData = async () => {
  setLoading(true);
  setTableLoading(true);
  setError(null);

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch data from JOINING sheet');
    }
    
    const rawData = result.data || result;
    
    if (!Array.isArray(rawData)) {
      throw new Error('Expected array data not received');
    }

    // Process data starting from row 7 (index 6) - skip headers
    const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
    
    const processedData = dataRows.map(row => ({
      employeeCode: row[26] || '', // Column AA (index 26) - Employee Code
      serialNumber: row[1] || '',   // Column B (index 1) - Serial Number
      name: row[2] || '',           // Column C (index 2) - Name
      fatherName: row[3] || '',     // Column D (index 3) - Father Name
      dateOfJoining: row[4] || '', 
      dateOfLeaving: row[4] || '',
      designation: row[5] || '', 
      department: row[20] || '', 
      // Column BK (index 62) and BL (index 63) for Reporting Manager logic
      reportingManagerPlanned: row[62] || '', // Column BK - Planned Date
      reportingManagerActual: row[63] || '' ,  // Column BL - Actual Date
      status: row[65] || '', // Column BN - Status
      LeavingDate: row[55] || '',
      reportingOfficer: row[28] || '', // Column AC (index 28) - Reporting Officer
    }));

    // Pending: Column BK not null and Column BL null
    const pendingTasks = processedData.filter(
      task => task.reportingManagerPlanned && !task.reportingManagerActual
    );
    setPendingData(pendingTasks);

    // History: Column BK not null and Column BL not null (both have values)
    const historyTasks = processedData.filter(
      task => task.reportingManagerPlanned && task.reportingManagerActual
    );
    setHistoryData(historyTasks);
   
  } catch (error) {
    console.error('Error fetching joining data:', error);
    setError(error.message);
    toast.error(`Failed to load joining data: ${error.message}`);
  } finally {
    setLoading(false);
    setTableLoading(false);
  }
};



  useEffect(() => {
    fetchJoiningData();
    fetchDepartments();
    fetchSocialSiteOptions();
  }, []);

  const handleAfterLeavingClick = async (item) => {
    setFormData({
      reportingManagerCheck: false,
      remarks: '',
      processType: '',
      temporaryBackupName: '',
      indentPost: '',
      indentCompany: '',
      indentGender: '',
      indentDepartment: '',
      indentPrefer: '',
      indentExperience: '',
      indentNumberOfPost: '',
      indentCompetitionDate: '',
      indentSocialSite: '',
      indentSocialSiteTypes: [],
    });
    
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialSiteTypeChange = (e) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          indentSocialSiteTypes: [...prev.indentSocialSiteTypes, value]
        };
      } else {
        return {
          ...prev,
          indentSocialSiteTypes: prev.indentSocialSiteTypes.filter(type => type !== value)
        };
      }
    });
  };

  const generateIndentNumber = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=INDENT&action=fetch'
      );
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 6) {
        const headers = result.data[5].map(h => h ? h.trim().toLowerCase() : '');
        let indentNumberIndex = headers.indexOf('indent number');
        if (indentNumberIndex === -1) {
          indentNumberIndex = 1;
        }
        
        let maxNumericValue = 0;
        
        for (let i = 6; i < result.data.length; i++) {
          const indentValue = result.data[i][indentNumberIndex];
          
          if (indentValue && indentValue.toString().trim() !== '') {
            const match = indentValue.toString().match(/\d+/);
            if (match) {
              const numericValue = parseInt(match[0]);
              if (numericValue > maxNumericValue) {
                maxNumericValue = numericValue;
              }
            }
          }
        }
        
        const nextNumber = maxNumericValue + 1;
        return `REC-${String(nextNumber).padStart(2, '0')}`;
      }
      return 'REC-01';
    } catch (error) {
      console.error('Error generating indent number:', error);
      return 'REC-01';
    }
  };

  const getCurrentTimestamp = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatDateForSheet = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  // Basic validation
  if (!selectedItem.employeeCode || !selectedItem.name) {
    toast.error('Please fill all required fields');
    setSubmitting(false);
    return;
  }

  // Validate based on process type
  if (formData.processType === 'indent') {
    if (!formData.indentPost || !formData.indentCompany || !formData.indentGender || 
        !formData.indentNumberOfPost || !formData.indentCompetitionDate) {
      toast.error('Please fill all required indent fields');
      setSubmitting(false);
      return;
    }
    
    if (formData.indentPrefer === 'Experience' && !formData.indentExperience) {
      toast.error('Please enter experience details');
      setSubmitting(false);
      return;
    }
  } else if (formData.processType === 'temporary-backup') {
    if (!formData.temporaryBackupName) {
      toast.error('Please enter temporary backup name');
      setSubmitting(false);
      return;
    }
  }

  try {
    // JOINING sheet से current data fetch करें
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

    // Find Employee Code column index (Column AA = index 26)
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

    // Update Column BN (index 65) with checkbox status (Yes/No)
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
            columnIndex: "66", // Column BN (index 65 + 1)
            value: formData.reportingManagerCheck ? "Yes" : "No",
          }).toString(),
        }
      )
    );

    // Update Column BL (index 63) with current date (actual completion)
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
            columnIndex: "64", // Column BL (index 63 + 1)
            value: currentDate,
          }).toString(),
        }
      )
    );

    // Update Remarks column (adjust column index as needed)
    // Assuming Remarks is Column BS (index 68)
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
            columnIndex: "102", // Column BS (index 68 + 1)
            value: formData.remarks || "",
          }).toString(),
        }
      )
    );

    // Handle process type specific actions
    if (formData.processType === 'indent') {
      // Generate indent data
      const indentNumber = await generateIndentNumber();
      const timestamp = getCurrentTimestamp();
      const formattedDate = formatDateForSheet(formData.indentCompetitionDate);

      // Prepare indent row data
      const indentRowData = [
        timestamp,
        indentNumber,
        formData.indentCompany,
        formData.indentPost,
        formData.indentGender,
        formData.indentPrefer,
        formData.indentNumberOfPost,
        formattedDate,
        formData.indentDepartment,
        formData.indentPrefer === 'Experience' ? formData.indentExperience : "",
        "NeedMore",
        "", "", "", "", "", "", // Empty columns
        formData.indentSocialSiteTypes.length > 0 ? formData.indentSocialSiteTypes.join(', ') : "",
      ];

      // Insert indent data
      updatePromises.push(
        fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              sheetName: "INDENT",
              action: "insert",
              rowData: JSON.stringify(indentRowData),
            }).toString(),
          }
        )
      );
    } else if (formData.processType === 'temporary-backup') {
      // Handle temporary backup - update relevant column
      // Assuming temporary backup is Column BT (index 69)
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
              columnIndex: "103", // Column BT (index 69 + 1)
              value: formData.temporaryBackupName || "",
            }).toString(),
          }
        )
      );
    }

    // Execute all updates
    const responses = await Promise.all(updatePromises);
    const results = await Promise.all(responses.map((r) => r.json()));

    const hasError = results.some((result) => !result.success);
    if (hasError) {
      throw new Error("Update failed");
    }

    toast.success("Reporting Manager process completed successfully!");
    setShowModal(false);
    fetchJoiningData();
  } catch (error) {
    console.error('Update error:', error);
    toast.error(`Update failed: ${error.message}`);
  } finally {
    setSubmitting(false);
  }
};

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reportingOfficer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reportingOfficer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">After Leaving Work - Reporting Manager</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, employee code, or reporting officer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Tabs - Same structure as Leaving component */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
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
          {activeTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Leaving Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporting Officer</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">Loading pending requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button 
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredPendingData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleAfterLeavingClick(item)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                        >
                          Process
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fatherName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateForDisplay(item.dateOfJoining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.LeavingDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reportingOfficer}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateForDisplay(item.reportingManagerPlanned)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Leaving Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporting Officer</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temporary Backup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">Loading history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button 
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredHistoryData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.dateOfJoining ? new Date(item.dateOfJoining).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.LeavingDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reportingOfficer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.remarks || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.temporaryBackupName || '-'}</td>
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

      {/* Modal - Updated with new fields */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-700">Reporting Manager Process</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info - Read Only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Officer</label>
                  <input
                    type="text"
                    value={selectedItem.reportingOfficer}
                    disabled
                    className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter remarks..."
                />
              </div>

              {/* Process Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Process Type *</label>
                <select
                  name="processType"
                  value={formData.processType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Process Type</option>
                  <option value="indent">Indent</option>
                  <option value="temporary-backup">Temporary Backup</option>
                </select>
              </div>

              {/* Temporary Backup Form */}
              {formData.processType === 'temporary-backup' && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Temporary Backup Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Backup Name *</label>
                    <input
                      type="text"
                      name="temporaryBackupName"
                      value={formData.temporaryBackupName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter backup person name"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Indent Form */}
              {formData.processType === 'indent' && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Create New Indent</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Post *</label>
                      <input
                        type="text"
                        name="indentPost"
                        value={formData.indentPost}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter post title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                      <input
                        type="text"
                        name="indentCompany"
                        value={formData.indentCompany}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter company name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        name="indentGender"
                        value={formData.indentGender}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Any">Any</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        name="indentDepartment"
                        value={formData.indentDepartment}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prefer</label>
                      <select
                        name="indentPrefer"
                        value={formData.indentPrefer}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Any</option>
                        <option value="Experience">Experience</option>
                        <option value="Fresher">Fresher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number Of Post *</label>
                      <input
                        type="number"
                        name="indentNumberOfPost"
                        value={formData.indentNumberOfPost}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter number of posts"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {/* Experience input - only show when prefer is Experience */}
                  {formData.indentPrefer === 'Experience' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience *</label>
                      <input
                        type="text"
                        name="indentExperience"
                        value={formData.indentExperience}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter experience details"
                        required
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Competition Date *</label>
                    <input
                      type="date"
                      name="indentCompetitionDate"
                      value={formData.indentCompetitionDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Social Site Section */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Social Site</label>
                    <select
                      name="indentSocialSite"
                      value={formData.indentSocialSite}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* Social Site Types checklist - only show when socialSite is Yes */}
                  {formData.indentSocialSite === 'Yes' && socialSiteOptions.length > 0 && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Social Site Types</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {socialSiteOptions.map((option, index) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`socialSite-${index}`}
                              value={option}
                              checked={formData.indentSocialSiteTypes.includes(option)}
                              onChange={handleSocialSiteTypeChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`socialSite-${index}`}
                              className="ml-2 block text-sm text-gray-700"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reporting Manager Check */}
              <div className="pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reportingManagerCheck"
                    checked={formData.reportingManagerCheck}
                    onChange={() => handleCheckboxChange('reportingManagerCheck')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reportingManagerCheck" className="ml-2 text-sm text-gray-700">
                    Reporting Manager Process Complete
                  </label>
                </div>
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
                  className={`px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 min-h-[42px] flex items-center justify-center ${
                    submitting ? 'opacity-90 cursor-not-allowed' : ''
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

export default ReportingManager;