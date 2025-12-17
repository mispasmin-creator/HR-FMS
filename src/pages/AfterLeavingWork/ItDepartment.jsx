import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ITDepartment = () => {
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
    laptop: false,
    mobile: false,
    idCard: false,
    accessCard: false,
    emailAccess: false,
    systemAccess: false
  });

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=JOINING&action=fetch'
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
        dateOfJoining: row[9] || '', 
        dateOfLeaving: row[4] || '',
        designation: row[5] || '', 
        department: row[20] || '', 
        // Column BO (index 66) and BP (index 67) for IT Department logic
        itDeptPlanned: row[66] || '', // Column BO
        itDeptActual: row[67] || ''  , // Column BP
        status: row[65] || '' ,// Column BN - Status
        assetSummary: row[69] || '', // Column BR - Asset Handover Summary
        LeavingDate: row[55] || '', // Column BA (index 55) - Leaving Date
      }));

      // Pending: Column BO not null and Column BP null
      const pendingTasks = processedData.filter(
        task => task.itDeptPlanned && !task.itDeptActual
      );
      setPendingData(pendingTasks);

      // History: Column BO not null and Column BP not null (both have values)
      const historyTasks = processedData.filter(
        task => task.itDeptPlanned && task.itDeptActual
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
  }, []);

  const handleITClick = async (item) => {
    setFormData({
      laptop: false,
      mobile: false,
      idCard: false,
      accessCard: false,
      emailAccess: false,
      systemAccess: false
    });
    
    setSelectedItem(item);
    setShowModal(true);
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

  // REMOVED THE CHECKBOX VALIDATION - User can submit without selecting any checkbox

  try {
    // JOINING sheet से current data fetch करें
    const fullDataResponse = await fetch(
      'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=JOINING&action=fetch'
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

    // Create asset handover summary - check which items are selected
    const checkedItems = [];
    if (formData.laptop) checkedItems.push('Laptop');
    if (formData.mobile) checkedItems.push('Mobile');
    if (formData.idCard) checkedItems.push('ID Card');
    if (formData.accessCard) checkedItems.push('Access Card');
    if (formData.emailAccess) checkedItems.push('Email Access');
    if (formData.systemAccess) checkedItems.push('System Access');

    // Asset summary will be empty if no checkboxes are selected
    const assetSummary = checkedItems.length > 0 ? checkedItems.join(', ') : '';

    // Update Column BR (index 69) with asset handover details (can be empty)
    updatePromises.push(
      fetch(
        "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "JOINING",
            action: "updateCell",
            rowIndex: (rowIndex + 1).toString(),
            columnIndex: "70", // Column BR (index 69 + 1)
            value: assetSummary,
          }).toString(),
        }
      )
    );

    // Update Column BP (index 67) with current date (actual completion)
    updatePromises.push(
      fetch(
        "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "JOINING",
            action: "updateCell",
            rowIndex: (rowIndex + 1).toString(),
            columnIndex: "68", // Column BP (index 67 + 1)
            value: currentDate,
          }).toString(),
        }
      )
    );

    const responses = await Promise.all(updatePromises);
    const results = await Promise.all(responses.map((r) => r.json()));

    const hasError = results.some((result) => !result.success);
    if (hasError) {
      throw new Error("Update failed");
    }

    toast.success("IT Department asset handover completed successfully!");
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
                         item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">After Leaving Work - IT Department </h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or employee code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-500"
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
                  ? 'border-green-500 text-green-600'
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
                  ? 'border-green-500 text-green-600'
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaving Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
  {tableLoading ? (
    <tr>
      {/* Update colSpan from 8 to 10 */}
      <td colSpan="10" className="px-6 py-12 text-center">
        <div className="flex justify-center flex-col items-center">
          <div className="w-6 h-6 border-4 border-green-500 border-dashed rounded-full animate-spin mb-2"></div>
          <span className="text-gray-600 text-sm">Loading pending requests...</span>
        </div>
      </td>
    </tr>
  ) : error ? (
    <tr>
      {/* Update colSpan from 8 to 10 */}
      <td colSpan="10" className="px-6 py-12 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={fetchJoiningData}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Retry
        </button>
      </td>
    </tr>
  ) : filteredPendingData.map((item, index) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => handleITClick(item)}
          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
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
      {/* Add this new cell for Planned Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.itDeptPlanned || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status || '-'}</td>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hand over of Assign Assets </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-green-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">Loading history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button 
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.assetSummary || '-'}</td>
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

      {/* Modal - Same as before */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-700">IT Department - Hand Over of Assets</h3>
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

              <div className="pt-4">
                <h4 className="text-md font-medium text-gray-700 mb-3">Hand Over of Assign Assets</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'laptop', label: 'Laptop' },
                    { key: 'mobile', label: 'Mobile Phone' },
                    { key: 'idCard', label: 'ID Card' },
                    { key: 'accessCard', label: 'Access Card' },
                    { key: 'emailAccess', label: 'Email Access' },
                    { key: 'systemAccess', label: 'System Access' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={item.key}
                        checked={formData[item.key]}
                        onChange={() => handleCheckboxChange(item.key)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={item.key} className="ml-2 text-sm text-gray-700">
                        {item.label}
                      </label>
                    </div>
                  ))}
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
                  className={`px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 min-h-[42px] flex items-center justify-center ${
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

export default ITDepartment;
