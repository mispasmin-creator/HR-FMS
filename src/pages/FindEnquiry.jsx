import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const FindEnquiry = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [indentData, setIndentData] = useState([]);
  const [enquiryData, setEnquiryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCandidateNo, setGeneratedCandidateNo] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [formData, setFormData] = useState({
    candidateName: '',
    candidateDOB: '',
    candidatePhone: '',
    candidateEmail: '',
    previousCompany: '',
    jobExperience: '',
    department: '',
    previousPosition: '',
    maritalStatus: '',
    interviewDate: '',
    candidatePhoto: null,
    candidateResume: null,
    presentAddress: '',
    aadharNo: '',
    // status: 'NeedMore'
  });
// Helper function to parse DD/MM/YYYY format
const parseDDMMYYYY = (dateString) => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      // Return a formatted string instead of Date object
      return dateString; // Return the original string
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  return null;
};

// Format date for display
const formatDateForDisplay = (dateString) => {
  const parsed = parseDDMMYYYY(dateString);
  return parsed || "-";
};
  // Google Drive folder ID for file uploads
  const GOOGLE_DRIVE_FOLDER_ID = '1Rb4DIzbZWSVyL5s_z4d0ntk0iM-JZWBq';

  // Function to count enquiries for each indent
  const countEnquiriesForIndent = (indentNo) => {
    if (!indentNo || enquiryData.length === 0) return { filled: 0, remaining: 0 };
    
    const count = enquiryData.filter(enquiry => 
      enquiry.indentNo === indentNo
    ).length;
    
    return count;
  };

  // Fetch all necessary data
  const fetchAllData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      // Fetch INDENT data
      const indentResponse = await fetch(
        'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=INDENT&action=fetch'
      );

      if (!indentResponse.ok) {
        throw new Error(`HTTP error! status: ${indentResponse.status}`);
      }

      const indentResult = await indentResponse.json();

      if (indentResult.success && indentResult.data && indentResult.data.length >= 7) {
        const headers = indentResult.data[5].map(h => h.trim());
        const dataFromRow7 = indentResult.data.slice(6);

        const getIndex = (headerName) => headers.findIndex(h => h === headerName);

        // Get column indices
        const statusIndex = getIndex('Status');
        const planned2Index = getIndex('Planned 2');
        const actual2Index = getIndex('Actual 2');

        const processedData = dataFromRow7
          .filter(row => {
            const status = row[statusIndex];
            const planned2 = row[planned2Index];
            const actual2 = row[actual2Index];

            const isValidStatus = status === 'Pending';
            const hasPlanned2 = planned2 && String(planned2).trim() !== '';
            const noActual2 = !actual2 || String(actual2).trim() === '';

            return isValidStatus && hasPlanned2 && noActual2;
          })
          .map(row => ({
            id: row[getIndex('Timestamp')],
            indentNo: row[getIndex('Indent Number')],
            post: row[getIndex('Post')],
            department: row[getIndex('Department')],
            plannedDate: row[planned2Index] || '', // Add Planned 2 data
            gender: row[getIndex('Gender')],
            prefer: row[getIndex('Prefer')],
            numberOfPost: parseInt(row[6]) || 0,     // Column G
            competitionDate: row[7],                 // Column H
            socialSite: row[getIndex('Social Site')],
            status: row[statusIndex],
            plannedDate: parseDDMMYYYY(row[planned2Index]), // Use existing function
            actual: row[actual2Index],
            experience: row[getIndex('Experience')],
          }));

        // Fetch ENQUIRY data
        const enquiryResponse = await fetch(
          'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=ENQUIRY&action=fetch'
        );

        if (!enquiryResponse.ok) {
          throw new Error(`HTTP error! status: ${enquiryResponse.status}`);
        }

        const enquiryResult = await enquiryResponse.json();

        setIndentData(processedData);

        if (enquiryResult.success && enquiryResult.data && enquiryResult.data.length > 0) {
          const headers = enquiryResult.data[5].map(h => h ? h.trim() : '');
          const enquiryRows = enquiryResult.data.slice(6);

          const getEnquiryIndex = (headerName) => headers.findIndex(h => h === headerName);

          // Process ENQUIRY data for history tab
          // Process ENQUIRY data for history tab
const processedEnquiryData = enquiryRows
  .filter(row => row[getEnquiryIndex('Timestamp')])
  .map(row => ({
    id: row[getEnquiryIndex('Timestamp')],
    indentNo: row[getEnquiryIndex('Indent Number')],
    candidateEnquiryNo: row[getEnquiryIndex('Candidate Enquiry Number')],
    applyingForPost: row[getEnquiryIndex('Applying For the Post')],
    // FIX: Changed from getIndex to getEnquiryIndex
    department: row[getEnquiryIndex('Department')],  // CHANGED THIS LINE
    candidateName: row[getEnquiryIndex('Candidate Name')],
    candidateDOB: row[getEnquiryIndex('DCB')],
    candidatePhone: row[getEnquiryIndex('Candidate Phone Number')],
    candidateEmail: row[getEnquiryIndex('Candidate Email')],
    previousCompany: row[getEnquiryIndex('Previous Company Name')],
    jobExperience: row[getEnquiryIndex('Job Experience')] || '',
    lastSalary: row[getEnquiryIndex('Last Salary')] || '',
    previousPosition: row[getEnquiryIndex('Previous Position')] || '',
    reasonForLeaving: row[getEnquiryIndex('Reason For Leaving')] || '',
    maritalStatus: row[getEnquiryIndex('Marital Status')] || '',
    lastEmployerMobile: row[getEnquiryIndex('Last Employer Mobile')] || '',
    candidatePhoto: row[getEnquiryIndex('Candidate Photo')] || '',
    candidateResume: row[19] || '',
    referenceBy: row[getEnquiryIndex('Reference By')] || '',
    presentAddress: row[getEnquiryIndex('Present Address')] || '',
    aadharNo: row[getEnquiryIndex('Aadhar No')] || '',
    interviewDate: row[20] || ''
  }));

setEnquiryData(processedEnquiryData);

        } else {
          setIndentData(processedData);
        }

      } else {
        throw new Error(indentResult.error || 'Not enough rows in INDENT sheet data');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const generateNextAAPIndentNumber = () => {
    const allIndentNumbers = [
      ...indentData.map(item => item.indentNo),
      ...enquiryData.map(item => item.indentNo)
    ].filter(Boolean);

    let maxAAPNumber = 0;

    allIndentNumbers.forEach(indentNo => {
      const match = indentNo.match(/^AAP-(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxAAPNumber) {
          maxAAPNumber = num;
        }
      }
    });

    const nextNumber = maxAAPNumber + 1;
    return `AAP-${String(nextNumber).padStart(2, '0')}`;
  };

  // Generate candidate number based on existing enquiries
  const generateCandidateNumber = () => {
    if (enquiryData.length === 0) {
      return 'ENQ-01';
    }

    const lastNumber = enquiryData.reduce((max, enquiry) => {
      if (!enquiry.candidateEnquiryNo) return max;

      const match = enquiry.candidateEnquiryNo.match(/ENQ-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextNumber = lastNumber + 1;
    return `ENQ-${String(nextNumber).padStart(2, '0')}`;
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Upload file to Google Drive
  const uploadFileToGoogleDrive = async (file, type) => {
    try {
      const base64Data = await fileToBase64(file);
      const base64String = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

      const uploadParams = {
        action: 'uploadFile',
        base64Data: base64String,
        fileName: `${generatedCandidateNo}_${type}_${file.name}`,
        mimeType: file.type,
        folderId: GOOGLE_DRIVE_FOLDER_ID
      };

      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(uploadParams),
        }
      );

      const result = await response.json();

      if (result.success) {
        return result.fileUrl;
      } else {
        throw new Error(result.error || 'File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const historyData = enquiryData;

  const handleEnquiryClick = (item = null) => {
  let indentNo = '';
  let isNewAAP = false;

  if (item) {
    // Check if maximum enquiries have been reached
    const enquiryCount = countEnquiriesForIndent(item.indentNo);
    if (enquiryCount >= item.numberOfPost) {
      toast.error(`Maximum enquiries (${item.numberOfPost}) already filled for this indent.`);
      return;
    }
    
    setSelectedItem(item);
    indentNo = item.indentNo;
  } else {
    indentNo = generateNextAAPIndentNumber();
    isNewAAP = true;

    setSelectedItem({
      indentNo: indentNo,
      post: '',
      gender: '',
      prefer: '',
      numberOfPost: '',
      competitionDate: '',
      socialSite: '',
      // REMOVE status field
      plannedDate: '',
      actual: '',
      experience: ''
    });
  }

  const candidateNo = generateCandidateNumber();
  setGeneratedCandidateNo(candidateNo);
  setFormData({
    candidateName: '',
    candidateDOB: '',
    candidatePhone: '',
    candidateEmail: '',
    previousCompany: '',
    jobExperience: '',
    department: item ? item.department : '',
    lastSalary: '',
    previousPosition: '',
    reasonForLeaving: '',
    maritalStatus: '',
    lastEmployerMobile: '',
    interviewDate: '',
    candidatePhoto: null,
    candidateResume: null,
    referenceBy: '',
    presentAddress: '',
    aadharNo: '',
    // REMOVE status field
  });
  setShowModal(true);
};

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear().toString().slice(-2);

    return `${day}-${month}-${year}`;
  };

  const formatInterviewDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Check if maximum enquiries reached
  if (selectedItem) {
    const enquiryCount = countEnquiriesForIndent(selectedItem.indentNo);
    if (enquiryCount >= selectedItem.numberOfPost) {
      toast.error(`Cannot submit: Maximum enquiries (${selectedItem.numberOfPost}) already filled.`);
      return;
    }
  }
  
  setSubmitting(true);

  try {
    let photoUrl = '';
    let resumeUrl = '';

    // Upload photo if exists
    if (formData.candidatePhoto) {
      setUploadingPhoto(true);
      photoUrl = await uploadFileToGoogleDrive(formData.candidatePhoto, 'photo');
      setUploadingPhoto(false);
      toast.success('Photo uploaded successfully!');
    }

    // Upload resume if exists
    if (formData.candidateResume) {
      setUploadingResume(true);
      resumeUrl = await uploadFileToGoogleDrive(formData.candidateResume, 'resume');
      setUploadingResume(false);
      toast.success('Resume uploaded successfully!');
    }

    // Create timestamp
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
      selectedItem.indentNo,
      generatedCandidateNo,
      selectedItem.post,
      formData.candidateName,
      formatDOB(formData.candidateDOB),
      formData.candidatePhone,
      formData.candidateEmail,
      formData.previousCompany || '',
      formData.jobExperience || '',
      formData.department || '',
      formData.previousPosition || '',
      '',
      formData.maritalStatus || '',
      '',
      photoUrl,
      '',
      formData.presentAddress || '',
      formData.aadharNo || '',
      resumeUrl,
      formData.interviewDate || '',
    ];

    // Submit to ENQUIRY sheet
    const enquiryResponse = await fetch(
      'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          sheetName: 'ENQUIRY',
          action: 'insert',
          rowData: JSON.stringify(rowData)
        }),
      }
    );

    const enquiryResult = await enquiryResponse.json();

    if (!enquiryResult.success) {
      throw new Error(enquiryResult.error || 'ENQUIRY submission failed');
    }

    // DON'T update INDENT sheet at all - removed all INDENT update logic
    
    toast.success('Enquiry submitted successfully!');
    setShowModal(false);
    fetchAllData();

  } catch (error) {
    console.error('Submission error:', error);
    toast.error(`Error: ${error.message}`);
  } finally {
    setSubmitting(false);
    setUploadingPhoto(false);
    setUploadingResume(false);
  }
};



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const filteredPendingData = indentData.filter(item => {
    const matchesSearch = item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Function to get enquiry count for each indent
  const getEnquiryCountForIndent = (indentNo) => {
    return countEnquiriesForIndent(indentNo);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Find Enquiry</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
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
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "history"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("history")}
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
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number Of Post (Filled/Total)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Competition Date
                    </th>
                    {/* In Pending tab table headers, add this th after Competition Date */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Planned
                </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending enquiries...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending enquiries found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => {
                      const enquiryCount = getEnquiryCountForIndent(item.indentNo);
                      const isMaxReached = enquiryCount >= item.numberOfPost;
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleEnquiryClick(item)}
                              disabled={isMaxReached}
                              className={`px-3 py-1 text-white rounded-md text-sm ${isMaxReached 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-700 hover:bg-opacity-90'}`}
                              title={isMaxReached ? `Maximum (${item.numberOfPost}) enquiries already filled` : ''}
                            >
                              {isMaxReached ? 'Max Reached' : 'Enquiry'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.indentNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.post}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.gender}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.prefer || "-"} {item.experience}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                enquiryCount >= item.numberOfPost 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {enquiryCount}/{item.numberOfPost}
                              </span>
                              {enquiryCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({Math.round((enquiryCount / item.numberOfPost) * 100)}%)
                                </span>
                              )}
                            </div>
                            {enquiryCount > 0 && (
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    enquiryCount >= item.numberOfPost 
                                      ? 'bg-green-500' 
                                      : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (enquiryCount / item.numberOfPost) * 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.competitionDate
                              ? new Date(item.competitionDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.plannedDate ? formatDateForDisplay(item.plannedDate) : "-"}
                        </td>
                        </tr>
                      );
                    })
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
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
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
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interview Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
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
                            Loading enquiry history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No enquiry history found.
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
                          {item.jobExperience}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatInterviewDate(item.interviewDate)}
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Submit Enquiry
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Enquiry Counter Display */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">
                    Enquiries for {selectedItem.indentNo}:
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-blue-700">
                        {getEnquiryCountForIndent(selectedItem.indentNo)}
                      </span> / {selectedItem.numberOfPost} filled
                    </span>
                    {selectedItem.numberOfPost > 0 && (
                      <span className="text-xs text-gray-500">
                        ({Math.round((getEnquiryCountForIndent(selectedItem.indentNo) / selectedItem.numberOfPost) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
                {selectedItem.numberOfPost > 0 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, (getEnquiryCountForIndent(selectedItem.indentNo) / selectedItem.numberOfPost) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Indent No.
                  </label>
                  <input
                    type="text"
                    value={selectedItem.indentNo}
                    disabled
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Enquiry No.
                  </label>
                  <input
                    type="text"
                    value={generatedCandidateNo}
                    disabled
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Applying For Post
                  </label>
                  <input
                    type="text"
                    value={selectedItem.post}
                    onChange={(e) => {
                      setSelectedItem((prev) => ({
                        ...prev,
                        post: e.target.value,
                      }));
                    }}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Name*
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate DOB
                  </label>
                  <input
                    type="date"
                    name="candidateDOB"
                    value={formData.candidateDOB}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Phone*
                  </label>
                  <input
                    type="tel"
                    name="candidatePhone"
                    value={formData.candidatePhone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    name="candidateEmail"
                    value={formData.candidateEmail}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Previous Company
                  </label>
                  <input
                    type="text"
                    name="previousCompany"
                    value={formData.previousCompany}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Job Experience
                  </label>
                  <input
                    type="text"
                    name="jobExperience"
                    value={formData.jobExperience}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Previous Position
                  </label>
                  <input
                    type="text"
                    name="previousPosition"
                    value={formData.previousPosition}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Marital Status
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Aadhar No.
                  </label>
                  <input
                    type="text"
                    name="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                    placeholder="Optional - Enter Aadhar number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Current Address
                </label>
                <textarea
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Photo
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, "candidatePhoto")}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 border-opacity-30 rounded-md cursor-pointer hover:bg-gray-50 text-gray-500"
                    >
                      <Upload size={16} className="mr-2" />
                      {uploadingPhoto ? "Uploading..." : "Upload File"}
                    </label>
                    {formData.candidatePhoto && !uploadingPhoto && (
                      <span className="text-sm text-gray-500 opacity-80">
                        {formData.candidatePhoto.name}
                      </span>
                    )}
                    {uploadingPhoto && (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-dashed rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-gray-500">
                          Uploading photo...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 10MB. Supports: JPG, JPEG, PNG, PDF, DOC, DOCX
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Resume
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, "candidateResume")}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 border-opacity-30 rounded-md cursor-pointer hover:bg-gray-50 text-gray-500"
                    >
                      <Upload size={16} className="mr-2" />
                      {uploadingResume ? "Uploading..." : "Upload File"}
                    </label>
                    {formData.candidateResume && !uploadingResume && (
                      <span className="text-sm text-gray-500 opacity-80">
                        {formData.candidateResume.name}
                      </span>
                    )}
                    {uploadingResume && (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-dashed rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-gray-500">
                          Uploading resume...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 10MB. Supports: PDF, DOC, DOCX, JPG, JPEG, PNG
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-500"
                  />
                </div>
               
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 border-opacity-30 rounded-md text-gray-500 hover:bg-gray-50"
                  disabled={submitting || uploadingPhoto || uploadingResume}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 flex items-center justify-center"
                  disabled={submitting || uploadingPhoto || uploadingResume}
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
  );
};

export default FindEnquiry;