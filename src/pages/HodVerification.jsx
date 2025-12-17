import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, X } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const Leaving = () => {
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
    status: '',
    remarks: ''
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

      const headers = rawData[5];
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      const getIndex = (headerName) => {
        const index = headers.findIndex(h => 
          h && h.toString().trim().toLowerCase() === headerName.toLowerCase()
        );
        return index;
      };

      const processedData = dataRows.map((row, index) => ({
        rowIndex: index + 7,
        employeeCode: row[getIndex('Employee Code')] || row[0] || '',
        employeeNo: row[getIndex('SKA-Joining ID')] || row[1] || '',
        candidateName: row[getIndex('Name As Per Aadhar')] || row[2] || '',
        fatherName: row[getIndex('Father Name')] || row[3] || '',
        dateOfJoining: row[getIndex('Date Of Joining')] || row[4] || '',
        designation: row[getIndex('Designation')] || row[5] || '',
        department: row[getIndex('Department')] || row[20] || '',
        mobileNo: row[getIndex('Mobile No.')] || '',
        firmName: row[getIndex('Joining Company Name')] || '',
        workingPlace: row[getIndex('Joining Place')] || '',
        // New columns for BG, BH, BJ, BK
        columnBG: row[58] || '', // Column BG (index 58)
        columnBH: row[59] || '', // Column BH (index 59)
        columnBJ: row[61] || '', // Column BJ (index 61)
        columnBK: row[62] || '', // Column BK (index 62)
        LeavingDate: row[55] || '',
      }));

      // Filter for pending: BG not null and BH null
      const pendingTasks = processedData.filter(
        (task) => task.columnBG && task.columnBG !== '' && (!task.columnBH || task.columnBH === '')
      );
      
      // Filter for history: Both BG and BH not null
      const historyTasks = processedData.filter(
        (task) => task.columnBG && task.columnBG !== '' && task.columnBH && task.columnBH !== ''
      );
      
      setPendingData(pendingTasks);
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

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employeeNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employeeNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleApprovalClick = (item) => {
    setSelectedItem(item);
    setFormData({
      status: '',
      remarks: ''
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

  const formatDateTime = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.status) {
    toast.error('Please select Approved or Rejected');
    return;
  }

  try {
    setSubmitting(true);
    const now = new Date();
    const formattedTimestamp = formatDateTime(now);
    
    const updatePromises = [];

    // 1. Update Column BH with timestamp (Column BH = index 59, so columnIndex = 60)
    updatePromises.push(
      fetch(
        "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '60', // Column BH (index 59 + 1)
            value: formattedTimestamp,
          }).toString(),
        }
      )
    );

    // 2. Update Column BJ with status (Column BJ = index 61, so columnIndex = 62)
    updatePromises.push(
      fetch(
        "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '62', // Column BJ (index 61 + 1)
            value: formData.status,
          }).toString(),
        }
      )
    );

    // 3. Update Remarks in Column CN (index 90, so columnIndex = 91)
    if (formData.remarks && formData.remarks.trim() !== '') {
      updatePromises.push(
        fetch(
          "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              sheetName: 'JOINING',
              action: 'updateCell',
              rowIndex: selectedItem.rowIndex.toString(),
              columnIndex: '92', // Column CN (index 90 + 1)
              value: formData.remarks,
            }).toString(),
          }
        )
      );
    }

    // Execute all updates
    const responses = await Promise.all(updatePromises);
    const results = await Promise.all(responses.map(async (r) => {
      const text = await r.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', text);
        return { success: false, error: 'Invalid response' };
      }
    }));

    // Log results for debugging
    console.log('Update results:', results);

    const hasError = results.some((result) => !result.success);
    if (hasError) {
      console.error('Update errors:', results.filter(r => !r.success));
      throw new Error("Some updates failed");
    }

    setFormData({
      status: '',
      remarks: ''
    });
    setShowModal(false);
    toast.success(`Request ${formData.status.toLowerCase()} successfully!`);
    setSelectedItem(null);
    
    // Refresh data
    await fetchJoiningData();
  } catch (error) {
    console.error('Submit error:', error);
    toast.error(`Update failed: ${error.message}`);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Approval System </h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">Loading pending requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
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
                          onClick={() => handleApprovalClick(item)}
                          className="px-3 py-1 bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-800"
                        >
                          Review
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.candidateName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fatherName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.dateOfJoining ? formatDate(item.dateOfJoining) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
               {item.columnBG || '-'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaving Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                   
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">Loading history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.candidateName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.dateOfJoining ? formatDate(item.dateOfJoining) : '-'}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.LeavingDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.columnBJ === 'Approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.columnBJ || '-'}
                        </span>
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-700">Approval Form</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={selectedItem.employeeNo}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

               <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            placeholder="Enter any remarks..."
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
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${
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

export default Leaving;
