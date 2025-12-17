import React, { useEffect, useState } from 'react';
import { HistoryIcon, Plus, X } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const Indent = () => {
  const { addIndent } = useDataStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    post: '',
    gender: '',
    company: '',
    department: '',
    prefer: '',
    numberOfPost: '',
    competitionDate: '',
    status: '',
    indentNumber: '',
    timestamp: '',
    experience: '',
  });
  const [indentData, setIndentData] = useState([]);
  const [filteredIndentData, setFilteredIndentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setTableLoading(true);
      const result = await fetchIndentDataFromRow7();
      if (result.success) {
        console.log('Data from row 7:', result.data);
        setIndentData(result.data);
        // Filter out completed entries by default
        const filtered = result.data.filter(item => 
          !['Complete', 'complete', 'Completed', 'completed', 'COMPLETE'].includes(item.status)
        );
        setFilteredIndentData(filtered);
      } else {
        console.error('Error:', result.error);
      }
      setTableLoading(false);
    };
    loadData();
  }, []);

  // Filter data when showCompleted state changes
  useEffect(() => {
    if (showCompleted) {
      setFilteredIndentData(indentData);
    } else {
      const filtered = indentData.filter(item => 
        !['Complete', 'complete', 'Completed', 'completed', 'COMPLETE'].includes(item.status)
      );
      setFilteredIndentData(filtered);
    }
  }, [showCompleted, indentData]);

  const generateIndentNumber = async () => {
    try {
      const result = await fetchLastIndentNumber();
      
      if (result.success) {
        const nextNumber = result.lastIndentNumber + 1;
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

  const fetchIndentDataFromRow7 = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=INDENT&action=fetch'
      );
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.length >= 7) {
        const dataFromRow7 = result.data.slice(6);
        const headers = result.data[5].map(h => h.trim());
        
        const timestampIndex = headers.indexOf('Timestamp');
        const indentNumberIndex = headers.indexOf('Indent Number');
        const postIndex = headers.indexOf('Post');
        const genderIndex = headers.indexOf('Gender');
        const departmentIndex = headers.indexOf('Department');
        const preferIndex = headers.indexOf('Prefer');
        const companyIndex = headers.indexOf('Company');
        
        const noOFPostIndex = 6;
        const completionDateIndex = 7;
        const experienceIndex = 9;
        const statusIndex = 10;
        const planned1Index = 11; // Planned 1 column index based on your screenshot

        const processedData = dataFromRow7.map(row => ({
          timestamp: row[timestampIndex],
          indentNumber: row[indentNumberIndex],
          post: row[postIndex],
          gender: row[genderIndex],
          department: row[departmentIndex],
          prefer: row[preferIndex],
          company: row[companyIndex],
          noOfPost: row[noOFPostIndex],
          completionDate: row[completionDateIndex],
          experience: row[experienceIndex],

          status: row[statusIndex] || '',
          planned1: row[planned1Index] || '', // Add Planned 1 data

        }));
        
        return {
          success: true,
          data: processedData,
          headers: headers
        };
      } else {
        return {
          success: false,
          error: 'Not enough rows in sheet data'
        };
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const fetchLastIndentNumber = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=INDENT&action=fetch'
      );
      
      const result = await response.json();
      console.log('Full sheet data:', result);
      
      if (result.success && result.data && result.data.length > 6) {
        const headers = result.data[5].map(h => h ? h.trim().toLowerCase() : '');
        console.log('Headers found:', headers);
        
        let indentNumberIndex = headers.indexOf('indent number');
        if (indentNumberIndex === -1) {
          indentNumberIndex = 1;
        }
        
        console.log('Indent number column index:', indentNumberIndex);
        
        let lastIndentNumber = null;
        let maxNumericValue = 0;
        
        for (let i = 6; i < result.data.length; i++) {
          const indentValue = result.data[i][indentNumberIndex];
          
          if (indentValue && indentValue.toString().trim() !== '') {
            lastIndentNumber = indentValue;
            
            const match = indentValue.toString().match(/\d+/);
            if (match) {
              const numericValue = parseInt(match[0]);
              if (numericValue > maxNumericValue) {
                maxNumericValue = numericValue;
              }
            }
          }
        }
        
        console.log('Last indent number found:', lastIndentNumber);
        console.log('Max numeric value:', maxNumericValue);
        
        return {
          success: true,
          lastIndentNumber: maxNumericValue,
          fullLastIndent: lastIndentNumber
        };
      } else {
        return {
          success: true,
          lastIndentNumber: 0,
          message: 'Sheet is empty or has insufficient data rows'
        };
      }
    } catch (error) {
      console.error('Error in fetchLastIndentNumber:', error);
      return {
        success: false,
        error: error.message,
        lastIndentNumber: 0
      };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.post ||
      !formData.gender ||
      !formData.company ||
      !formData.numberOfPost ||
      !formData.competitionDate 
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.prefer === 'Experience' && !formData.experience) {
      toast.error('Please enter experience details');
      return;
    }

    try {
      setSubmitting(true);
      const indentNumber = await generateIndentNumber();
      const timestamp = getCurrentTimestamp();
      const formattedDate = formatDateForSheet(formData.competitionDate);
      console.log(indentNumber);

      const rowData = [
  timestamp,
  indentNumber,
  formData.company,
  formData.post,
  formData.gender,
  formData.prefer,
  formData.numberOfPost,
  formattedDate,
  formData.department,
  formData.prefer === 'Experience' ? formData.experience : "",
  formData.status || "",
  "", // Planned 1 - leave empty or set default
  "", // Actual 1
  "", // TL
  "",
  "",
  "",
];

      const response = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
        method: 'POST',
        body: new URLSearchParams({
          sheetName: 'INDENT',
          action: 'insert',
          rowData: JSON.stringify(rowData),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Indent submitted successfully!');
        setFormData({
          post: '',
          company: '',
          gender: '',
          department: '',
          prefer: '',
          numberOfPost: '',
          competitionDate: '',
          status: '',
          indentNumber: '',
          timestamp: '',
          experience: '',
        });
        setShowModal(false);
        
        // Refresh the table data
        setTableLoading(true);
        const fetchResult = await fetchIndentDataFromRow7();
        if (fetchResult.success) {
          setIndentData(fetchResult.data);
          if (!showCompleted) {
            const filtered = fetchResult.data.filter(item => 
              !['Complete', 'complete', 'Completed', 'completed', 'COMPLETE'].includes(item.status)
            );
            setFilteredIndentData(filtered);
          } else {
            setFilteredIndentData(fetchResult.data);
          }
        }
        setTableLoading(false);
      } else {
        toast.error('Failed to insert: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Insert error:', error);
      toast.error('Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForSheet = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleCancel = () => {
    setFormData({
      post: '',
      gender: '',
      department: '',
      prefer: '',
      numberOfPost: '',
      competitionDate: '',
      status: '',
      indentNumber: '',
      timestamp: '',
      experience: '',
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6 page-content p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Indent</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${
              showCompleted 
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showCompleted ? (
              <>
                <HistoryIcon size={16} className="mr-2" />
                Showing All ({indentData.length})
              </>
            ) : (
              <>
                <HistoryIcon size={16} className="mr-2" />
                Showing Active ({filteredIndentData.length}/{indentData.length})
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
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
                Loading...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Create Indent
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-800">
                Create New Indent
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post*
                </label>
                <input
                  type="text"
                  name="post"
                  value={formData.post}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company<span className="text-red-500">*</span>
                </label>
                <select
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="" disabled>Select a company</option>
                  <option value="Pmmpl">Pmmpl</option>
                  <option value="Purab">Purab</option>
                  <option value="Rkl">Rkl</option>
                  <option value="Refratech">Refratech</option>
                  <option value="Refrasynth">Refrasynth</option>
                  <option value="Pasmin Llp">Pasmin Llp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender*
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Department</option>
                  <option value="Production">Production</option>
                  <option value="Management">Management</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Accounts">Accounts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prefer
                </label>
                <select
                  name="prefer"
                  value={formData.prefer}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any</option>
                  <option value="Experience">Experience</option>
                  <option value="Fresher">Fresher</option>
                </select>
              </div>

              {formData.prefer === "Experience" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience*
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter experience details"
                    required={formData.prefer === "Experience"}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number Of Post*
                </label>
                <input
                  type="number"
                  name="numberOfPost"
                  value={formData.numberOfPost}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of posts"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Date*
                </label>
                <input
                  type="date"
                  name="competitionDate"
                  value={formData.competitionDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center"
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
                      Processing...
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

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Indent Management
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Active Indents: {filteredIndentData.length}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Completed: {indentData.length - filteredIndentData.length}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Total: {indentData.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 shadow">
              <thead className="bg-gray-50 sticky top-0 z-10">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prefer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Date
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Planned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
  {tableLoading ? (
    <tr>
      <td colSpan="11" className="px-6 py-12 text-center">
        <div className="flex justify-center flex-col items-center">
          <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
          <span className="text-gray-600 text-sm">
            Loading indent data...
          </span>
        </div>
      </td>
    </tr>
  ) : filteredIndentData.length === 0 ? (
    <tr>
      <td colSpan="11" className="px-6 py-12 text-center">
        <p className="text-gray-500">
          {showCompleted ? 'No indent data found.' : 'No active indent data found.'}
        </p>
      </td>
    </tr>
  ) : (
    filteredIndentData.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          {item.indentNumber}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.company}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.post}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.gender}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.department}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.prefer}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.experience}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.noOfPost}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="text-sm text-gray-900 break-words">
            {item.completionDate
              ? (() => {
                  const date = new Date(item.completionDate);
                  if (!date || isNaN(date.getTime()))
                    return "Invalid date";
                  const day = date
                    .getDate()
                    .toString()
                    .padStart(2, "0");
                  const month = (date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                })()
              : "—"}
          </div>
        </td>
        {/* Add this cell for Planned Date */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="text-sm text-gray-900 break-words">
            {item.planned1
              ? (() => {
                  const dateStr = item.planned1;
                  // Check if it's already a formatted date string
                  if (dateStr.includes('/') && dateStr.includes(':')) {
                    // Format: "11/12/2025 16:39:28"
                    const datePart = dateStr.split(' ')[0];
                    const [day, month, year] = datePart.split('/');
                    return `${day}/${month}/${year}`;
                  }
                  // Try to parse as Date object
                  const date = new Date(dateStr);
                  if (!date || isNaN(date.getTime()))
                    return dateStr || "—";
                  const day = date
                    .getDate()
                    .toString()
                    .padStart(2, "0");
                  const month = (date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                })()
              : "—"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            !item.status || item.status === '' 
              ? 'bg-gray-100 text-gray-800' 
              : item.status === 'NeedMore' 
              ? 'bg-yellow-100 text-yellow-800'
              : item.status === 'Fulfilled'
              ? 'bg-green-100 text-green-800'
              : item.status === 'InProgress'
              ? 'bg-blue-100 text-blue-800'
              : ['Complete', 'complete', 'Completed', 'completed', 'COMPLETE'].includes(item.status)
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {item.status || 'Not Set'}
          </span>
        </td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Indent;