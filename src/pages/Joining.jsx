
import React, { useState, useEffect } from 'react';
import { Search, Users, Clock, CheckCircle, Eye, X, Download, Upload, Share } from 'lucide-react';
import toast from 'react-hot-toast';

const Joining = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [joiningData, setJoiningData] = useState([]);
  const [historyData, setHistoryData] = useState([]);  // History data state
  const [error, setError] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFormData, setShareFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    subject: 'Candidate Joining Details',
    message: 'Please find the candidate joining details attached below.',
  });
  const [formData, setFormData] = useState({
    candidateSays: '',
    status: '',
    nextDate: ''
  });
  const [joiningFormData, setJoiningFormData] = useState({
  joiningId: '',
  nameAsPerAadhar: '',
  fatherName: '',
  dateOfJoining: '',
  joiningPlace: '',
  designation: '',
  salary: '',
  aadharFrontPhoto: null,
  aadharBackPhoto: null,
  panCard: null,
  candidatePhoto: null,
  currentAddress: '',
  addressAsPerAadhar: '',
  dobAsPerAadhar: '',
  gender: '',
  mobileNo: '',
  familyMobileNo: '',
  relationshipWithFamily: '',
  pastPfId: '',
  currentBankAc: '',
  ifscCode: '',
  branchName: '',
  bloodGroup: '',
  identificationMarks: '',
  bankPassbookPhoto: null,
  personalEmail: '',
  esicNo: '',
  highestQualification: '',
  pfEligible: '',
  esicEligible: '',
  joiningCompanyName: '',
  emailToBeIssue: '',
  issueMobile: '',
  issueLaptop: '',
  aadharCardNo: '',
  modeOfAttendance: '',
  qualificationPhoto: null,
  paymentMode: '',
  salarySlip: null,
  resumeCopy: null,
  department: '',
  equipment: '',
  // Previous Company Details (NEW FIELDS)
  previousCompanyName: '',
  previousCompanyAddress: '',
  offerLetter: null,
  incrementLetter: null,
  paySlip: null,
  resignationLetter: null,
  enquiryNo: '',
});

  const handleShareClick = (item) => {
    setSelectedItem(item);
    // Create the share link with enquiry number
    const shareLink = `https://hr-fms-passary-joining-form.vercel.app/?enquiry=${item.candidateEnquiryNo || ''}`;

    setShareFormData({
      recipientName: item.candidateName || '', // Auto-fill from Column E
      recipientEmail: item.candidateEmail || '', // Auto-fill from Column H
      subject: 'Candidate Joining Details - ' + item.candidateName,
      message: `Dear Recipient,\n\nPlease find the joining details for candidate ${item.candidateName} who is applying for the position of ${item.applyingForPost}.\n\nCandidate Details:\n- Name: ${item.candidateName}\n- Position: ${item.applyingForPost}\n- Department: ${item.department}\n- Phone: ${item.candidatePhone}\n- Email: ${item.candidateEmail}\n- Candidate Enquiry Number: ${item.candidateEnquiryNo}\n\nJoining Form Link: ${shareLink}\n\nBest regards,\nHR Team`,
    });

    // Log the share link to console
    console.log("Share Link:", shareLink);

    setShowShareModal(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const documents = [{
        name: selectedItem.candidateName,
        serialNo: selectedItem.candidateEnquiryNo,
        documentType: selectedItem.applyingForPost,
        category: selectedItem.department,
        imageUrl: selectedItem.candidatePhoto || ''
      }];

      const URL = 'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec';

      const params = new URLSearchParams();
      params.append('action', 'shareViaEmail');
      params.append('recipientEmail', shareFormData.recipientEmail);
      params.append('subject', shareFormData.subject);
      params.append('message', shareFormData.message);
      params.append('documents', JSON.stringify(documents));

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('Details shared successfully!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing details:', error);
      toast.error(`Failed to share details: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInputChange = (e) => {
    const { name, value } = e.target;
    setShareFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const [enquiryResponse, followUpResponse, joiningResponse] = await Promise.all([
        fetch(
          "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=ENQUIRY&action=fetch"
        ),
        fetch(
          "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=Follow - Up&action=fetch"
        ),
        fetch(
          "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=JOINING&action=fetch"
        )
      ]);

      if (!enquiryResponse.ok || !followUpResponse.ok || !joiningResponse.ok) {
        throw new Error(
          `HTTP error! status: ${enquiryResponse.status} or ${followUpResponse.status} or ${joiningResponse.status}`
        );
      }

      const [enquiryResult, followUpResult, joiningResult] = await Promise.all([
        enquiryResponse.json(),
        followUpResponse.json(),
        joiningResponse.json()
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

      // Process enquiry data
      const enquiryHeaders = enquiryResult.data[5].map((h) => h.trim());
      const enquiryDataFromRow7 = enquiryResult.data.slice(6);

      const getIndex = (headerName) =>
        enquiryHeaders.findIndex((h) => h === headerName);

      const departmentIndex = getIndex("Department");

      const processedEnquiryData = enquiryDataFromRow7
        .map((row) => ({
          id: row[getIndex("Timestamp")],
          indentNo: row[getIndex("Indent Number")],
          candidateEnquiryNo: row[getIndex("Candidate Enquiry Number")],
          applyingForPost: row[getIndex("Applying For the Post")],
          department: row[departmentIndex] || "",
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
          actualDate: row[26] || "",
          plannedDate: row[27] || "",
          actualJoiningDate: row[28] || ""
        }));

      // Process follow-up data for filtering
      if (followUpResult.success && followUpResult.data) {
        const rawFollowUpData = followUpResult.data || followUpResult;
        const followUpRows = Array.isArray(rawFollowUpData[0])
          ? rawFollowUpData.slice(1)
          : rawFollowUpData;

        const processedFollowUpData = followUpRows.map((row) => ({
          enquiryNo: row[2] || "", // Column B (index 1) - Enquiry No
          status: row[3] || "", // Column C (index 2) - Status
        }));

        setFollowUpData(processedFollowUpData);

        // Filter data to show only items with "Joining" status in follow-up sheet
        const joiningItems = processedEnquiryData.filter(item => {
          const hasJoiningStatus = processedFollowUpData.some(followUp =>
            followUp.enquiryNo === item.candidateEnquiryNo &&
            followUp.status === 'Joining'
          );
          return hasJoiningStatus;
        });

        // Separate pending and history data based on AB and AC columns
        const pendingData = joiningItems.filter(item =>
          item.plannedDate && item.plannedDate.trim() !== "" && 
          (!item.actualJoiningDate || item.actualJoiningDate.trim() === "")
        );

        const historyItems = joiningItems.filter(item =>
          item.plannedDate && item.plannedDate.trim() !== "" &&
          item.actualJoiningDate && item.actualJoiningDate.trim() !== ""
        );

        setJoiningData(pendingData);
        
        // Process JOINING sheet data for history tab with additional columns
        if (joiningResult.success && joiningResult.data) {
          const joiningHeaders = joiningResult.data[0] || [];
          const joiningDataRows = joiningResult.data.slice(1);
          
          const processedHistoryData = historyItems.map(item => {
            // Find matching record in JOINING sheet by enquiry number
            const joiningRecord = joiningDataRows.find(row => 
              row[89] === item.candidateEnquiryNo // Column CL (index 89)
            );
            
            return {
              ...item,
              // Add columns from JOINING sheet CF to CK (indices 83-88)
              previousCompanyName: joiningRecord ? joiningRecord[83] : "",
              previousCompanyAddress: joiningRecord ? joiningRecord[84] : "",
              offerLetter: joiningRecord ? joiningRecord[85] : "",
              incrementLetter: joiningRecord ? joiningRecord[86] : "",
              paySlip: joiningRecord ? joiningRecord[87] : "",
              resignationLetter: joiningRecord ? joiningRecord[88] : ""
            };
          });
          
          setHistoryData(processedHistoryData);
        }
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

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleJoiningClick = (item) => {
  setSelectedItem(item);
  setJoiningFormData({
    joiningId: '', // Initialize with empty value
    nameAsPerAadhar: item.candidateName || '',
    fatherName: '',
    dateOfJoining: '',
    joiningPlace: '',
    designation: item.designation || '',
    salary: '',
    bloodGroup: '',
    identificationMarks: '',
    aadharFrontPhoto: null,
    aadharBackPhoto: null,
    panCard: null,
    candidatePhoto: null,
    currentAddress: item.presentAddress || '',
    addressAsPerAadhar: '',
    dobAsPerAadhar: formatDOB(item.candidateDOB) || '',
    gender: '',
    mobileNo: item.candidatePhone || '',
    familyMobileNo: '',
    relationshipWithFamily: '',
    pastPfId: '',
    currentBankAc: '',
    ifscCode: '',
    branchName: '',
    bankPassbookPhoto: null,
    personalEmail: item.candidateEmail || '',
    esicNo: '',
    highestQualification: '',
    pfEligible: '',
    esicEligible: '',
    joiningCompanyName: '',
    emailToBeIssue: '',
    issueMobile: '',
    issueLaptop: '',
    aadharCardNo: item.aadharNo || '',
    modeOfAttendance: '',
    qualificationPhoto: null,
    paymentMode: '',
    salarySlip: null,
    resumeCopy: null,
    department: item.department || '',
    equipment: '',
    // Previous Company Details (NEW FIELDS)
    previousCompanyName: item.previousCompany || '',
    previousCompanyAddress: '',
    offerLetter: null,
    incrementLetter: null,
    paySlip: null,
    resignationLetter: null,
    enquiryNo: item.candidateEnquiryNo || '',
  });
  setShowJoiningModal(true);
};

  const formatDate = (dateString) => {
    if (!dateString) return '';

    let date;

    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string') {
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        date = new Date(dateString);
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateString || '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    // If it's already in dd/mm/yyyy format, return as is
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Check if it's already in dd/mm/yyyy format
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (day > 0 && day <= 31 && month > 0 && month <= 12) {
          // If day is greater than 12, it's likely dd/mm/yyyy format
          if (day > 12) {
            return dateString; // Return as is (dd/mm/yyyy)
          }
          // If month is greater than 12, it's likely mm/dd/yyyy format
          else if (month > 12) {
            return `${parts[1]}/${parts[0]}/${parts[2]}`; // Swap day and month
          }
        }
      }
    }

    // For other cases, try to parse as Date object
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Add a function to format date for storage (mm/dd/yyyy)
  const formatDateForStorage = (dateString) => {
    if (!dateString) return '';

    // If it's in dd/mm/yyyy format, convert to mm/dd/yyyy
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        // If it's already in dd/mm/yyyy format, swap day and month
        if (day > 0 && day <= 31 && month > 0 && month <= 12 && day > 12) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }
    }

    // For other cases, try to parse as Date object
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleJoiningInputChange = (e) => {
    const { name, value } = e.target;
    setJoiningFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setJoiningFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const postToJoiningSheet = async (rowData) => {
    const URL = 'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec';

    try {
      console.log('Attempting to post:', {
        sheetName: 'JOINING',
        rowData: rowData
      });

      const params = new URLSearchParams();
      params.append('sheetName', 'JOINING');
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

  const uploadFileToDrive = async (file, folderId = '1Rb4DIzbZWSVyL5s_z4d0ntk0iM-JZWBq') => {
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const params = new URLSearchParams();
      params.append('action', 'uploadFile');
      params.append('base64Data', base64Data);
      params.append('fileName', file.name);
      params.append('mimeType', file.type);
      params.append('folderId', folderId);

      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'File upload failed');
      }

      return data.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  };

  // इस फंक्शन को हटा दें
const updateEnquirySheet = async (enquiryNo, timestamp) => {
  const URL = 'https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec';

  try {
    const params = new URLSearchParams();
    params.append('sheetName', 'ENQUIRY');
    params.append('action', 'updateEnquiryColumn');
    params.append('enquiryNo', enquiryNo);
    params.append('timestamp', timestamp);

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating enquiry sheet:', error);
    throw new Error(`Failed to update enquiry sheet: ${error.message}`);
  }
};

const handleJoiningSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    // Fetch current JOINING sheet data to get last serial number
    const joiningSheetResponse = await fetch(
      "https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=JOINING&action=fetch"
    );
    
    let serialNumber = 'SN-001'; // Default first ID
    
    if (joiningSheetResponse.ok) {
      const joiningResult = await joiningSheetResponse.json();
      if (joiningResult.success && joiningResult.data && joiningResult.data.length > 1) {
        // Get the last row's joining ID (Column B, index 1)
        const lastRow = joiningResult.data[joiningResult.data.length - 1];
        const lastId = lastRow[1]; // Column B
        
        if (lastId && lastId.startsWith('SN-')) {
          // Extract number and increment
          const lastNumber = parseInt(lastId.split('-')[1]);
          const newNumber = lastNumber + 1;
          serialNumber = 'SN-' + String(newNumber).padStart(3, '0');
        }
      }
    }

    // Upload all required files including new ones
    const uploadPromises = {};
    const fileFields = [
      'aadharFrontPhoto',
      'bankPassbookPhoto',
      'offerLetter',
      'incrementLetter',
      'paySlip',
      'resignationLetter'
    ];

    for (const field of fileFields) {
      if (joiningFormData[field]) {
        uploadPromises[field] = uploadFileToDrive(joiningFormData[field]);
      } else {
        uploadPromises[field] = Promise.resolve('');
      }
    }

    // Wait for all uploads to complete
    const uploadedUrls = await Promise.all(
      Object.values(uploadPromises).map(promise =>
        promise.catch(error => {
          console.error('Upload failed:', error);
          return ''; // Return empty string if upload fails
        })
      )
    );

    // Map uploaded URLs to their respective fields
    const fileUrls = {};
    Object.keys(uploadPromises).forEach((field, index) => {
      fileUrls[field] = uploadedUrls[index];
    });

    const formatDateForStorage = (dateString) => {
      if (!dateString) return '';

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    };

    // Format DOB for storage (mm/dd/yyyy)
    const formatDOBForStorage = (dateString) => {
      if (!dateString) return '';

      // If it's in dd/mm/yyyy format, convert to mm/dd/yyyy
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }

      // For other cases, try to parse as Date object
      let date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    };

    // Create an array with all column values in order
    const rowData = [];

    // Existing columns A to AA (columns 0 to 26)
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    
    rowData[0] = `${month}/${day}/${year} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`; // Column A: Timestamp
    rowData[1] = serialNumber;                    // Column B: Joining ID
    rowData[2] = selectedItem.candidateName;   // Column C: Name As Per Aadhar
    rowData[3] = joiningFormData.fatherName;   // Column D: Father Name
    rowData[4] = formatDateForStorage(joiningFormData.dateOfJoining); // Column E: Date Of Joining
    rowData[5] = selectedItem.designation || selectedItem.applyingForPost; // Column F: Designation
    rowData[6] = fileUrls.aadharFrontPhoto || '';    // Column G: Aadhar card
    rowData[7] = selectedItem.candidatePhoto;  // Column H: Candidate Photo
    rowData[8] = selectedItem.presentAddress;  // Column I: Current Address
    rowData[9] = formatDOBForStorage(selectedItem.candidateDOB); // Column J: Date Of Birth
    rowData[10] = joiningFormData.gender;      // Column K: Gender
    rowData[11] = selectedItem.candidatePhone; // Column L: Mobile No.
    rowData[12] = joiningFormData.familyMobileNo; // Column M: Family Mobile Number
    rowData[13] = joiningFormData.relationshipWithFamily; // Column N: Relationship With Family
    rowData[14] = joiningFormData.currentBankAc; // Column O: Current Account No
    rowData[15] = joiningFormData.ifscCode;    // Column P: IFSC Code
    rowData[16] = joiningFormData.branchName;  // Column Q: Branch Name
    rowData[17] = fileUrls.bankPassbookPhoto || '';  // Column R: Photo Of Front Bank Passbook
    rowData[18] = selectedItem.candidateEmail; // Column S: Candidate Email
    rowData[19] = joiningFormData.highestQualification; // Column T: Highest Qualification
    rowData[20] = selectedItem.department || '';  // Column U: Department
    rowData[21] = selectedItem.aadharNo;       // Column V: Aadhar Number
    rowData[22] = selectedItem.candidateResume; // Column W: Candidate Resume
    rowData[23] = ''; // Column X: Date
    
    // NEW COLUMNS CF to CK (columns 83 to 88 in 0-based indexing)
    rowData[83] = joiningFormData.previousCompanyName; // Column CF - Previous Company Name
    rowData[84] = joiningFormData.previousCompanyAddress; // Column CG - Previous Company Address  
    rowData[85] = fileUrls.offerLetter || ""; // Column CH - Offer Letter
    rowData[86] = fileUrls.incrementLetter || ""; // Column CI - Increment Letter
    rowData[87] = fileUrls.paySlip || ""; // Column CJ - Pay Slip
    rowData[88] = fileUrls.resignationLetter || ""; // Column CK - Resignation Letter
    rowData[89] = joiningFormData.enquiryNo; // Column CL - Enquiry Number
    rowData[92] = joiningFormData.bloodGroup; // Column CO (index 92)
    rowData[93] = joiningFormData.identificationMarks; // Column CP (index 93)

    await postToJoiningSheet(rowData);

    // COMMENTED OUT: This line was updating ENQUIRY sheet
    // await updateEnquirySheet(selectedItem.candidateEnquiryNo, formattedTimestamp);

    console.log("Joining Form Data submitted:", rowData);

    toast.success('Employee added successfully!');
    setShowJoiningModal(false);
    setSelectedItem(null);
    fetchJoiningData();
  } catch (error) {
    console.error('Error submitting joining form:', error);
    toast.error(`Failed to submit joining form: ${error.message}`);
  } finally {
    setSubmitting(false);
  }
};

  const filteredJoiningData = joiningData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Joining Management </h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, post or phone number..."
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
              Pending Joinings ({filteredJoiningData.length})
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
                            Loading pending joinings...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredJoiningData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending joinings found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredJoiningData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleJoiningClick(item)}
                              className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-opacity-90 text-sm"
                            >
                              Joining
                            </button>
                            {/* <button
                              onClick={() => handleShareClick(item)}
                              className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-opacity-90 text-sm flex items-center"
                            >
                              <Share size={14} className="mr-1" />
                              Share
                            </button> */}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEnquiryNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.applyingForPost || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEmail || "-"}
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
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Joining Pending
                          </span>
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
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Increment Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Slip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resignation Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No history records found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEnquiryNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.applyingForPost || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEmail || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.previousCompanyName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.previousCompanyAddress || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.offerLetter ? (
                            <a
                              href={item.offerLetter}
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
                          {item.incrementLetter ? (
                            <a
                              href={item.incrementLetter}
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
                          {item.paySlip ? (
                            <a
                              href={item.paySlip}
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
                          {item.resignationLetter ? (
                            <a
                              href={item.resignationLetter}
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
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Completed
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
      </div>

      {/* Joining Modal - Same as before with proper form sections */}
      {showJoiningModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Joining Form
              </h3>
              <button
                onClick={() => setShowJoiningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoiningSubmit} className="p-6 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Enquiry No.
    </label>
    <input
      type="text"
      name="enquiryNo"
      value={joiningFormData.enquiryNo}
      disabled
      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
    />
  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name As Per Aadhar
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.candidateName}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={joiningFormData.fatherName}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Of Birth As per Aadhar
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formatDOB(selectedItem.candidateDOB)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={joiningFormData.gender}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select Gender </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female  </option>
                    <option value="Other">Other </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.department || ""} // Use selectedItem.department instead of joiningFormData.department
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  />
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile No.
                  </label>
                  <input
                    type="tel"
                    disabled
                    value={selectedItem.candidatePhone}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={selectedItem.candidateEmail}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Mobile Number
                  </label>
                  <input
                    name="familyMobileNo"
                    value={joiningFormData.familyMobileNo}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship With Family
                  </label>
                  <input
                    name="relationshipWithFamily"
                    value={joiningFormData.relationshipWithFamily}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                {/* Blood Group Field */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Blood Group *
  </label>
  <select
    name="bloodGroup"
    value={joiningFormData.bloodGroup}
    onChange={handleJoiningInputChange}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
    required
  >
    <option value="">Select Blood Group</option>
    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
    <option value="Unknown">Unknown</option>
  </select>
</div>

{/* Identification Marks Field */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Identification Marks
  </label>
  <textarea
    name="identificationMarks"
    value={joiningFormData.identificationMarks}
    onChange={handleJoiningInputChange}
    rows={2}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
    placeholder="Enter any visible identification marks..."
  />
</div>
              </div>

              {/* Section 3: Address Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Address
                  </label>
                  <textarea
                    disabled
                    value={selectedItem.presentAddress}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>

              {/* Section 4: Employment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Of Joining
                  </label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={joiningFormData.dateOfJoining}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.designation}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highest Qualification
                  </label>
                  <input
                    name="highestQualification"
                    value={joiningFormData.highestQualification}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>

              {/* Section 5: Bank & Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Card Number
                  </label>
                  <input
                  name="aadharNo"
                  value={joiningFormData.aadharNo || ""}
                  onChange={handleJoiningInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                />

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Bank Account No
                  </label>
                  <input
                    name="currentBankAc"
                    value={joiningFormData.currentBankAc}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    name="ifscCode"
                    value={joiningFormData.ifscCode}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    name="branchName"
                    value={joiningFormData.branchName}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>

              {/* Section 6: Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Card
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "aadharFrontPhoto")}
                      className="hidden"
                      id="aadhar-front-upload"
                    />
                    <label
                      htmlFor="aadhar-front-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo
                    </label>
                    {joiningFormData.aadharFrontPhoto && (
                      <span className="text-sm text-gray-700">
                        {joiningFormData.aadharFrontPhoto.name}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Of Front Bank Passbook
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "bankPassbookPhoto")}
                      className="hidden"
                      id="bank-passbook-upload"
                    />
                    <label
                      htmlFor="bank-passbook-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo
                    </label>
                    {joiningFormData.bankPassbookPhoto && (
                      <span className="text-sm text-gray-700">
                        {joiningFormData.bankPassbookPhoto.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 6: Previous Company Details */}
<div className="mb-6">
  <h4 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
    Previous Company Details
  </h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Previous Company Name
      </label>
      <input
        type="text"
        name="previousCompanyName"
        value={joiningFormData.previousCompanyName}
        onChange={handleJoiningInputChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Previous Company Address
      </label>
      <textarea
        name="previousCompanyAddress"
        value={joiningFormData.previousCompanyAddress}
        onChange={handleJoiningInputChange}
        rows={3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
      />
    </div>
  </div>
</div>

              {/* Section 7: Previous Company Document Uploads */}
<div className="mb-6">
  <h4 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
    Previous Company Documents
  </h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Offer Letter
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, "offerLetter")}
          className="hidden"
          id="offer-letter-upload"
        />
        <label
          htmlFor="offer-letter-upload"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
        >
          <Upload size={16} className="mr-2" />
          Upload File
        </label>
        {joiningFormData.offerLetter && (
          <span className="text-sm text-gray-700">
            {joiningFormData.offerLetter.name}
          </span>
        )}
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Increment Letter
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, "incrementLetter")}
          className="hidden"
          id="increment-letter-upload"
        />
        <label
          htmlFor="increment-letter-upload"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
        >
          <Upload size={16} className="mr-2" />
          Upload File
        </label>
        {joiningFormData.incrementLetter && (
          <span className="text-sm text-gray-700">
            {joiningFormData.incrementLetter.name}
          </span>
        )}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pay Slip
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, "paySlip")}
          className="hidden"
          id="pay-slip-upload"
        />
        <label
          htmlFor="pay-slip-upload"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
        >
          <Upload size={16} className="mr-2" />
          Upload File
        </label>
        {joiningFormData.paySlip && (
          <span className="text-sm text-gray-700">
            {joiningFormData.paySlip.name}
          </span>
        )}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Resignation Letter
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, "resignationLetter")}
          className="hidden"
          id="resignation-letter-upload"
        />
        <label
          htmlFor="resignation-letter-upload"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
        >
          <Upload size={16} className="mr-2" />
          Upload File
        </label>
        {joiningFormData.resignationLetter && (
          <span className="text-sm text-gray-700">
            {joiningFormData.resignationLetter.name}
          </span>
        )}
      </div>
    </div>
  </div>
</div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
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

export default Joining;
