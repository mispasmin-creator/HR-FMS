import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const SocialSite = () => {
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

  // API Base URL - centralized
  const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec';

  const [formData, setFormData] = useState({
    socialSite: '',
    socialSiteTypes: []
  });

  // Social Site Types options
  const socialSiteOptions = [
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

  // Centralized API fetch function
  const fetchIndentData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}?sheet=INDENT&action=fetch`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data || result.data.length < 7) {
        throw new Error(result.error || 'Not enough rows in INDENT sheet data');
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching INDENT data:', error);
      throw error;
    }
  };

  // Fetch INDENT data for Social Site pending and history items
  const fetchAllData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);
    
    try {
      const indentResult = await fetchIndentData();
      
      const headers = indentResult.data[5].map(h => h.trim());
      const dataFromRow7 = indentResult.data.slice(6);
      
      const getIndex = (headerName) => headers.findIndex(h => h === headerName);
      
      // Process all data first with corrected column mappings
      const allProcessedData = dataFromRow7
        .filter(row => {
          // Column L (index 11) should not be null/empty
          const columnL = row[11]; // Column L (0-indexed)
          return columnL && columnL !== '';
        })
        .map(row => ({
          id: row[getIndex('Timestamp')] || row[0],
          indentNo: row[getIndex('Indent Number')],
          company: row[getIndex('Company')] || '',
          post: row[getIndex('Post')],
          gender: row[getIndex('Gender')] || '', // Gender column
          prefer: row[getIndex('Prefer')] || '', // Prefer column
          numberOfEnquiry: row[6] || '', // Column G - Number Of Enquiry Need
          positionFulfillDate: row[7] || '', // Column H - Position Full-Fill Date
          status: row[10] || '', // Column K - Status
          socialSitePost: row[14] || '', // Column O - Social Site Post
          which: row[15] || '', // Column P - Which
          columnL: row[11] || '', // Column L
          columnM: row[12] || '' ,// Column M
          planned: row[11] || '' // Column L - Planned 1

        }));
      
      // NEW LOGIC: Separate pending and history data based on Status column
      const pendingItems = allProcessedData.filter(item => {
        // Pending: status is NOT "Complete"
        return !item.status || item.status.toLowerCase() !== 'complete';
      });
      
      const historyItems = allProcessedData.filter(item => {
        // History: status IS "Complete"
        return item.status && item.status.toLowerCase() === 'complete';
      });
      
      setPendingData(pendingItems);
      setHistoryData(historyItems);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleActionClick = (item) => {
    setSelectedItem(item);
    // Pre-fill the form if Social Site already posted
    setFormData({
      socialSite: item.socialSitePost || '',
      socialSiteTypes: item.which ? item.which.split(',').map(s => s.trim()).filter(s => s) : []
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

  const handleSocialSiteTypeChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      socialSiteTypes: checked 
        ? [...prev.socialSiteTypes, value]
        : prev.socialSiteTypes.filter(type => type !== value)
    }));
  };

  // Centralized update cell function
  const updateCell = async (rowIndex, columnIndex, value) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          sheetName: 'INDENT',
          action: 'updateCell',
          rowIndex: rowIndex.toString(),
          columnIndex: columnIndex.toString(),
          value: value
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || `Failed to update column ${columnIndex}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error updating column ${columnIndex}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Find the row in INDENT sheet
      const indentResult = await fetchIndentData();

      // Find the row index
      let rowIndex = -1;
      for (let i = 1; i < indentResult.data.length; i++) {
        if (indentResult.data[i][1] === selectedItem.indentNo) { // Assuming column B contains Indent Number
          rowIndex = i + 1; // Spreadsheet rows start at 1
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Could not find indentNo: ${selectedItem.indentNo} in INDENT sheet`);
      }

      // Get current date in Indian format (DD/MM/YYYY)
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

      // Prepare data for column updates
      const socialSiteTypesString = formData.socialSiteTypes.join(', ');
      const columnMValue = formattedDate; // Actual date in Column M
      const columnOValue = formData.socialSite; // Social Site Post (Yes/No) in Column O  
      const columnPValue = formData.socialSite === 'Yes' ? socialSiteTypesString : 'No'; // Which field in Column P

      // Update columns using centralized function
      await updateCell(rowIndex, 13, columnMValue); // Column M - date
      await updateCell(rowIndex, 15, columnOValue); // Column O - Social Site Post
      await updateCell(rowIndex, 16, columnPValue); // Column P - Which

      toast.success(`Social Site information updated successfully with date: ${formattedDate}`);
      setShowModal(false);
      fetchAllData();

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.company?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.company?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Social Site </h1>
      </div>

      {/* Fter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by Indent No, Company or Post..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 border-opacity-30 rounded-lg focus:outline-none focus:ring-2 bg-white bg-opacity-10 focus:ring-indigo-500 text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 border-opacity-20">
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
          {activeTab === 'pending' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    {/* New Columns Added */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. of Enquiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position Full-Fill Date
                    </th>
                    {/* End New Columns */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Social Site Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    {/* In Pending tab table header, add this th */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Planned
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="12" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending social site data...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending social site data found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleActionClick(item)}
                            className={`px-3 py-1 text-white rounded-md hover:bg-opacity-90 text-sm ${
                              item.socialSitePost === 'Yes' 
                                ? 'bg-green-600' 
                                : item.socialSitePost === 'No'
                                ? 'bg-red-600'
                                : 'bg-indigo-700'
                            }`}
                          >
                            {item.socialSitePost ? 'Edit' : 'Update'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.post}
                        </td>
                        {/* New Columns Data */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.gender || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.prefer || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.numberOfEnquiry || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.positionFulfillDate || '-'}
                        </td>
                        {/* End New Columns Data */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.socialSitePost ? (
                            <div className="flex items-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.socialSitePost === 'Yes' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.socialSitePost}
                              </span>
                              {item.which && item.which !== 'No' && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({item.which})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Not Updated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.columnM ? (
                            <span className="text-blue-600">{item.columnM}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {item.planned || '-'}
                      </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status.toLowerCase() === 'complete'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    {/* New Columns Added for History Tab */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. of Enquiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position Full-Fill Date
                    </th>
                    {/* End New Columns */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Social Site Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Which
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading social site history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No social site history found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.post}
                        </td>
                        {/* New Columns Data for History Tab */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.gender || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.prefer || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.numberOfEnquiry || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.positionFulfillDate || '-'}
                        </td>
                        {/* End New Columns Data */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.socialSitePost === 'Yes' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.socialSitePost}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.which}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-blue-600">{item.columnM}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedItem.socialSitePost 
                      ? 'Edit Social Site Information' 
                      : 'Update Social Site Information'
                    }
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Current Status Info */}
                {selectedItem.socialSitePost && (
                  <div className="bg-blue-50 p-3 rounded-md mb-4">
                    <div className="flex items-center">
                      <AlertCircle size={16} className="text-blue-500 mr-2" />
                      <span className="text-sm text-blue-700">
                        Currently: <strong>{selectedItem.socialSitePost}</strong>
                        {selectedItem.which && selectedItem.which !== 'No' && (
                          <span> ({selectedItem.which})</span>
                        )}
                        {selectedItem.columnM && (
                          <span> on {selectedItem.columnM}</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indent Number
                    </label>
                    <input
                      type="text"
                      value={selectedItem.indentNo}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Site*
                    </label>
                    <select
                      name="socialSite"
                      value={formData.socialSite}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* Social Site Types checklist - only show when socialSite is Yes */}
                  {formData.socialSite === "Yes" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Social Site Types*
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {socialSiteOptions.map((option) => (
                          <div key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              id={option}
                              value={option}
                              checked={formData.socialSiteTypes.includes(option)}
                              onChange={handleSocialSiteTypeChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={option}
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

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 flex items-center justify-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialSite;