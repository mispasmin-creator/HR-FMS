import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, Upload, PauseCircle, RefreshCw, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const CallTracker = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    candidateSays: '',
    status: '',
    nextDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [enquiryData, setEnquiryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);

  const fetchEnquiryData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const [enquiryResponse, followUpResponse, indentResponse] = await Promise.all([
        fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=ENQUIRY&action=fetch"
        ),
        fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Follow - Up&action=fetch"
        ),
        fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=INDENT&action=fetch"
        ),
      ]);

      if (!enquiryResponse.ok || !followUpResponse.ok || !indentResponse.ok) {
        throw new Error(`HTTP error!`);
      }

      const [enquiryResult, followUpResult, indentResult] = await Promise.all([
        enquiryResponse.json(),
        followUpResponse.json(),
        indentResponse.json(),
      ]);

      if (
        !enquiryResult.success ||
        !enquiryResult.data ||
        enquiryResult.data.length < 7
      ) {
        throw new Error(
          enquiryResult.error || "Not enough rows in enquiry sheet data"
        );
      }

      // Process INDENT data to create a lookup map
      let indentDepartmentMap = {};
      if (indentResult.success && indentResult.data && indentResult.data.length >= 7) {
        const indentHeaders = indentResult.data[5].map(h => h.trim());
        const indentDataRows = indentResult.data.slice(6);

        const getIndentIndex = (headerName) => indentHeaders.findIndex(h => h === headerName);

        indentDataRows.forEach(row => {
          const indentNo = row[getIndentIndex('Indent Number')];
          const department = row[8]; // Column I (index 8)
          if (indentNo) {
            indentDepartmentMap[indentNo] = department || '';
          }
        });
      }

      // Process enquiry data
      const enquiryHeaders = enquiryResult.data[5].map((h) => h.trim());
      const enquiryDataFromRow7 = enquiryResult.data.slice(6);

      const getIndex = (headerName) =>
        enquiryHeaders.findIndex((h) => h === headerName);

      const processedEnquiryData = enquiryDataFromRow7
        .filter((row) => {
          const plannedIndex = getIndex("Planned");
          const actualIndex = getIndex("Actual");
          const planned = row[plannedIndex];
          const actual = row[actualIndex];
          return planned && (!actual || actual === "");
        })
        .map((row) => {
          const indentNo = row[getIndex("Indent Number")];
          const departmentFromIndent = indentDepartmentMap[indentNo] || '';

          return {
            id: row[getIndex("Timestamp")],
            indentNo: indentNo,
            candidateEnquiryNo: row[getIndex("Candidate Enquiry Number")],
            applyingForPost: row[getIndex("Applying For the Post")],
            department: departmentFromIndent,
            plannedDate: row[getIndex("Planned")] || '', // Column V - Planned date
            candidateName: row[getIndex("Candidate Name")],
            candidateDOB: row[getIndex("DOB")],
            candidatePhone: row[getIndex("Candidate Phone Number")],
            candidateEmail: row[getIndex("Candidate Email")],
            previousCompany: row[getIndex("Previous Company Name")],
            jobExperience: row[getIndex("Job Experience")] || "",
            lastSalary: row[getIndex("Last Salary Drawn")] || "",
            previousPosition: row[getIndex("Previous Position")] || "",
            reasonForLeaving:
              row[getIndex("Reason Of Leaving Previous Company")] || "",
            maritalStatus: row[getIndex("Marital Status")] || "",
            lastEmployerMobile: row[getIndex("Last Employer Mobile Number")] || "",
            candidatePhoto: row[getIndex("Candidate Photo")] || "",
            candidateResume: row[19] || "",
            referenceBy: row[getIndex("Reference By")] || "",
            presentAddress: row[getIndex("Present Address")] || "",
            aadharNo: row[getIndex("Aadhar Number")] || "",
            designation: row[getIndex("Applying For the Post")] || "",
          };
        });

      setEnquiryData(processedEnquiryData);

      // Process follow-up data
      if (followUpResult.success && followUpResult.data) {
        const rawFollowUpData = followUpResult.data || followUpResult;
        const followUpRows = Array.isArray(rawFollowUpData[0])
          ? rawFollowUpData.slice(1)
          : rawFollowUpData;

        const processedFollowUpData = followUpRows.map((row) => ({
          enquiryNo: row[1] || "",
          status: row[2] || "",
        }));

        setFollowUpData(processedFollowUpData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchFollowUpData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Follow - Up&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Raw API response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Google Script returned an error');
      }

      // Handle both array formats (direct data or result.data)
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      // Process data - skip header row if present
      const dataRows = rawData.length > 0 && Array.isArray(rawData[0]) ? rawData.slice(1) : rawData;

      const processedData = dataRows.map(row => ({
        timestamp: row[0] || '',       // Column A - Timestamp
        indentNo: row[1] || '',        // Column B - Indent No (NEW)
        enquiryNo: row[2] || '',       // Column C - Enquiry No
        status: row[3] || '',          // Column D - Status
        candidateSays: row[4] || '',   // Column E - Candidates Says
        nextDate: row[5] || ''         // Column F - Next Date
      }));

      console.log('Processed follow-up data:', processedData);
      setHistoryData(processedData);

    } catch (error) {
      console.error('Error in fetchFollowUpData:', error);
      setError(error.message);
      toast.error(`Failed to load follow-ups: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiryData();
    fetchFollowUpData();
  }, []);

  const pendingData = enquiryData.filter(item => {
    const hasFinalStatus = followUpData.some(followUp =>
      followUp.enquiryNo === item.candidateEnquiryNo &&
      (followUp.status === 'Joining' || followUp.status === 'Reject')
    );
    return !hasFinalStatus;
  });


  // Helper function to format DD/MM/YYYY dates
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
    
    return dateString; // Return original if can't parse
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString || '-';
  }
};


 const handleCallClick = (item) => {
  setSelectedItem(item);
  setFormData({
    candidateSays: '',
    status: '',
    nextDate: ''
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


  const postToSheet = async (rowData) => {
    const URL = 'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec';

    try {
      console.log('Attempting to post:', {
        sheetName: 'Follow - Up',
        rowData: rowData
      });

      const params = new URLSearchParams();
      params.append('sheetName', 'Follow - Up');
      params.append('action', 'insert');
      params.append('rowData', JSON.stringify(rowData));

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Server response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Server returned unsuccessful response');
      }

      return data;
    } catch (error) {
      console.error('Full error details:', {
        error: error.message,
        stack: error.stack,
        rowData: rowData,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to update sheet: ${error.message}`);
    }
  };

  const updateEnquirySheet = async (enquiryNo) => {
    const URL = 'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec';

    try {
      console.log('Attempting to update ENQUIRY sheet for:', enquiryNo);

      // First, fetch the ENQUIRY sheet data to find the correct row
      const fetchResponse = await fetch(
        `${URL}?sheet=ENQUIRY&action=fetch`
      );

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const fetchResult = await fetchResponse.json();

      if (!fetchResult.success || !fetchResult.data) {
        throw new Error('Failed to fetch ENQUIRY sheet data');
      }

      // Find the row with matching enquiry number (Column C is index 2)
      let targetRowIndex = -1;
      const sheetData = fetchResult.data;

      for (let i = 0; i < sheetData.length; i++) {
        if (sheetData[i][2] === enquiryNo) { // Column C (index 2)
          targetRowIndex = i + 1; // Convert to 1-based index for Google Sheets
          break;
        }
      }

      if (targetRowIndex === -1) {
        throw new Error(`Enquiry number ${enquiryNo} not found in ENQUIRY sheet`);
      }

      console.log(`Found enquiry ${enquiryNo} at row ${targetRowIndex}`);

      // Format current date and time as 9/21/2020 14:21:19
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // const formattedDateTime = `${month}/${day}/${year} ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Now update the specific cell using updateCell action
      const params = new URLSearchParams();
      params.append('sheetName', 'ENQUIRY');
      params.append('action', 'updateCell');
      params.append('rowIndex', targetRowIndex.toString());
      params.append('columnIndex', '27'); // Column AA is index 27 (1-based)
      // params.append('value', formattedDateTime);

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('ENQUIRY sheet update response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to update ENQUIRY sheet');
      }

      return data;
    } catch (error) {
      console.error('Error updating ENQUIRY sheet:', {
        error: error.message,
        stack: error.stack,
        enquiryNo: enquiryNo,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to update ENQUIRY sheet: ${error.message}`);
    }
  };

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    // Handle different date formats that might come from the input
    let date;

    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString;
    }
    // If it's in the format "1/11/2021" (mm/dd/yyyy or dd/mm/yyyy)
    else if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        if (parseInt(parts[0]) > 12) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
    }
    else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.candidateSays || !formData.status) {
      toast.error('Please fill all required fields');
      setSubmitting(false);
      return;
    }

    try {
      // For ALL statuses including Joining, submit to Follow-Up sheet first
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      const rowData = [
        formattedTimestamp,
        selectedItem.indentNo || '',
        selectedItem.candidateEnquiryNo || '',
        formData.status,
        formData.candidateSays,
        formatDOB(formData.nextDate) || '',
      ];

      await postToSheet(rowData);

      // If status is "Joining", also update the ENQUIRY sheet
      if (formData.status === 'Joining') {
        await updateEnquirySheet(selectedItem.candidateEnquiryNo);
      }

      toast.success('Update successful!');
      setShowModal(false);
      fetchEnquiryData();
      fetchFollowUpData();

    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(`Failed to update: ${error.message}`);
      if (error.message.includes('appendRow')) {
        toast('Please verify the "Follow-Up" sheet exists', {
          icon: 'ℹ️',
          duration: 8000
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Helper functions for tabs
  const getFollowUpData = () => {
    return historyData.filter(item => 
      item.status === "Follow-up"
    ).filter(item => {
      const matchesSearch = item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getInterviewData = () => {
    return historyData.filter(item => item.status === "Interview").filter(item => {
      const matchesSearch = item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getOnHoldData = () => {
    return historyData.filter(item => item.status === "On Hold").filter(item => {
      const matchesSearch = item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getHistoryData = () => {
    return historyData.filter(item => 
      item.status === "Joining" || 
      item.status === "Reject" ||
      item.status === "Negotiation"
    ).filter(item => {
      const matchesSearch = item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  // Count functions for tabs
  const getFollowUpCount = () => {
    return historyData.filter(item => item.status === "Follow-up").length;
  };

  const getInterviewCount = () => {
    return historyData.filter(item => item.status === "Interview").length;
  };

  const getOnHoldCount = () => {
    return historyData.filter(item => item.status === "On Hold").length;
  };

  const getHistoryCount = () => {
    return historyData.filter(item => 
      item.status === "Joining" || 
      item.status === "Reject" ||
      item.status === "Negotiation"
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Call Tracker</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by candidate name or enquiry number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-600"
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
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "followup"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("followup")}
            >
              <RefreshCw size={16} className="inline mr-2" />
              Follow-up ({getFollowUpCount()})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "interview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("interview")}
            >
              <Calendar size={16} className="inline mr-2" />
              Interview ({getInterviewCount()})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "onhold"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("onhold")}
            >
              <PauseCircle size={16} className="inline mr-2" />
              On Hold ({getOnHoldCount()})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "history"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("history")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History ({getHistoryCount()})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
                    </th>
                    {/* In Pending tab table headers, add this th after Department */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending calls...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchEnquiryData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No pending calls found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCallClick(item)}
                            className="px-3 py-1 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 text-sm"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEnquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.applyingForPost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhoto ? (
                            <a
                              href={item.candidatePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateResume ? (
                            <a
                              href={item.candidateResume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateForDisplay(item.plannedDate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "followup" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Says
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-green-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading follow-up calls...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : getFollowUpData().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No follow-up calls found.</p>
                      </td>
                    </tr>
                  ) : (
                    getFollowUpData().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              // Find the corresponding enquiry item from enquiryData
                              const enquiryItem = enquiryData.find(e => 
                                e.candidateEnquiryNo === item.enquiryNo
                              );
                              
                              if (enquiryItem) {
                                handleCallClick(enquiryItem);
                              } else {
                                const pendingItem = pendingData.find(p => 
                                  p.candidateEnquiryNo === item.enquiryNo
                                );
                                
                                if (pendingItem) {
                                  handleCallClick(pendingItem);
                                } else {
                                  const basicItem = {
                                    candidateEnquiryNo: item.enquiryNo,
                                    indentNo: item.indentNo,
                                    candidateName: 'Candidate',
                                    applyingForPost: '',
                                    department: '',
                                    candidatePhone: '',
                                    candidateEmail: '',
                                    previousCompany: '',
                                    jobExperience: '',
                                    lastSalary: '',
                                    previousPosition: '',
                                    reasonForLeaving: '',
                                    maritalStatus: '',
                                    lastEmployerMobile: '',
                                    candidatePhoto: '',
                                    candidateResume: '',
                                    referenceBy: '',
                                    presentAddress: '',
                                    aadharNo: '',
                                    designation: '',
                                    id: item.timestamp || Date.now().toString()
                                  };
                                  handleCallClick(basicItem);
                                }
                              }
                            }}
                            className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700 text-sm"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.timestamp || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "interview" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interview Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading interview calls...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : getInterviewData().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No interview calls found.</p>
                      </td>
                    </tr>
                  ) : (
                    getInterviewData().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const enquiryItem = enquiryData.find(e => 
                                e.candidateEnquiryNo === item.enquiryNo
                              );
                              
                              if (enquiryItem) {
                                handleCallClick(enquiryItem);
                              } else {
                                const pendingItem = pendingData.find(p => 
                                  p.candidateEnquiryNo === item.enquiryNo
                                );
                                
                                if (pendingItem) {
                                  handleCallClick(pendingItem);
                                } else {
                                  const basicItem = {
                                    candidateEnquiryNo: item.enquiryNo,
                                    indentNo: item.indentNo,
                                    candidateName: 'Candidate',
                                    applyingForPost: '',
                                    department: '',
                                    candidatePhone: '',
                                    candidateEmail: '',
                                    previousCompany: '',
                                    jobExperience: '',
                                    lastSalary: '',
                                    previousPosition: '',
                                    reasonForLeaving: '',
                                    maritalStatus: '',
                                    lastEmployerMobile: '',
                                    candidatePhoto: '',
                                    candidateResume: '',
                                    referenceBy: '',
                                    presentAddress: '',
                                    aadharNo: '',
                                    designation: '',
                                    id: item.timestamp || Date.now().toString()
                                  };
                                  handleCallClick(basicItem);
                                }
                              }
                            }}
                            className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 text-sm"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.timestamp || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "onhold" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason For Holding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ReCalling Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-yellow-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading on hold calls...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : getOnHoldData().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No on hold calls found.</p>
                      </td>
                    </tr>
                  ) : (
                    getOnHoldData().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const enquiryItem = enquiryData.find(e => 
                                e.candidateEnquiryNo === item.enquiryNo
                              );
                              
                              if (enquiryItem) {
                                handleCallClick(enquiryItem);
                              } else {
                                const pendingItem = pendingData.find(p => 
                                  p.candidateEnquiryNo === item.enquiryNo
                                );
                                
                                if (pendingItem) {
                                  handleCallClick(pendingItem);
                                } else {
                                  const basicItem = {
                                    candidateEnquiryNo: item.enquiryNo,
                                    indentNo: item.indentNo,
                                    candidateName: 'Candidate',
                                    applyingForPost: '',
                                    department: '',
                                    candidatePhone: '',
                                    candidateEmail: '',
                                    previousCompany: '',
                                    jobExperience: '',
                                    lastSalary: '',
                                    previousPosition: '',
                                    reasonForLeaving: '',
                                    maritalStatus: '',
                                    lastEmployerMobile: '',
                                    candidatePhoto: '',
                                    candidateResume: '',
                                    referenceBy: '',
                                    presentAddress: '',
                                    aadharNo: '',
                                    designation: '',
                                    id: item.timestamp || Date.now().toString()
                                  };
                                  handleCallClick(basicItem);
                                }
                              }
                            }}
                            className="px-3 py-1 text-white bg-yellow-600 rounded-md hover:bg-yellow-700 text-sm"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.timestamp || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-purple-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : getHistoryData().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No history found.</p>
                      </td>
                    </tr>
                  ) : (
                    getHistoryData().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.status === "Joining"
                                ? "bg-green-100 text-green-800"
                                : item.status === "Reject"
                                ? "bg-red-100 text-red-800"
                                : item.status === "Negotiation"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.timestamp || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Call Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Call Tracker
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Enquiry No.
                </label>
                <input
                  type="text"
                  value={selectedItem.candidateEnquiryNo}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indent No.
                </label>
                <input
                  type="text"
                  value={selectedItem.indentNo}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status*
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Interview">Interview</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Joining">Joining</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.status === "Negotiation"
                    ? "What's Customer Requirement *"
                    : formData.status === "On Hold"
                      ? "Reason For Holding the Candidate *"
                      : formData.status === "Joining"
                        ? "When the candidate will join the company *"
                        : formData.status === "Reject"
                          ? "Reason for Rejecting the Candidate *"
                          : formData.status === "Interview"
                          ? "Interview Details *"
                          : "What Did The Candidate Says *"}
                </label>
                <textarea
                  name="candidateSays"
                  value={formData.candidateSays}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              {formData.status &&
                !["Joining", "Reject"].includes(formData.status) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.status === "Interview"
                        ? "Schedule Date *"
                        : formData.status === "On Hold"
                          ? "ReCalling Date *"
                          : "Next Date *"}
                    </label>
                    <input
                      type="date"
                      name="nextDate"
                      value={formData.nextDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${submitting ? "opacity-90 cursor-not-allowed" : ""
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
                      <span>Submitting...</span>
                    </div>
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
  );
};

export default CallTracker;