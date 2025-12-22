import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, X } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const AfterJoiningWork = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reportingOfficers, setReportingOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const companyOptions = ["PMMPL", "PURAB", "REFRATECH", "REFRASYNTH"];


  const [formData, setFormData] = useState({
  employeeCode: "",
  salaryConfirmation: "", 
  salaryAmount: "", 
  reportingOfficer: "",
  pf: "",
  baseAddress: "",
  idProofCopy: null,
  joiningLetter: null,
  biometricAccess: false,
  punchCode: "",
  officialEmailId: false,
  emailId: "",
  emailPassword: "",
  laptop: "",
  mobile: "",
  assignAssets: false,
  manualImage: null,
  manualImageUrl: "",
  assets: [],
  incentiveCategory: "",
  // NEW FIELDS ADDED
  attendanceMode: "", // "outsider", "machine"
  department: "", // dropdown from column U
  eligibleForPF: "", // "Yes", "No"
  eligibleForESIC: "", // "Yes", "No"
  remarks: "", // text input
  nextSalaryIncrementDate: "", // date picker
  designation: "",
  bloodGroup: "", // Column CO (prefilled)
  identificationMarks: "", // Column CP (prefilled)
  companyName: "", // Column CW - dropdown with PMMPL, PURAB, REFRATECH, REFRASYNTH // dropdown with editable values (prefilled from item.designation)
});


  // Function to fetch last employee code from JOINING sheet - FIXED VERSION
  const fetchLastEmployeeCode = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData) || rawData.length < 7) {
        console.log("No data found or insufficient rows");
        return null;
      }

      console.log("Raw data for employee code search:", rawData);

      // Column AA is index 26 (not 27) - Excel columns start from 0
      const employeeCodeColumnIndex = 26; // Column AA (0-based index)
      let highestNumber = 0;

      // Start from row 7 (index 6) since 0-5 are headers
      for (let i = 6; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > employeeCodeColumnIndex) {
          const code = row[employeeCodeColumnIndex];
          console.log(`Row ${i}, Code found:`, code);
          
          if (code && typeof code === 'string' && code.trim() !== "") {
            const trimmedCode = code.trim();
            // Match PMMPL- followed by numbers
            const match = trimmedCode.match(/PMMPL-(\d+)/i);
            if (match) {
              const number = parseInt(match[1]);
              console.log(`Extracted number: ${number} from ${trimmedCode}`);
              if (!isNaN(number) && number > highestNumber) {
                highestNumber = number;
                console.log(`New highest number: ${highestNumber}`);
              }
            }
          }
        }
      }

      console.log("Final highest number found:", highestNumber);

      if (highestNumber > 0) {
        const lastCode = `PMMPL-${highestNumber}`;
        console.log("Returning last code:", lastCode);
        return lastCode;
      }

      console.log("No valid employee codes found");
      return null;
    } catch (error) {
      console.error("Error fetching last employee code:", error);
      return null;
    }
  };
const fetchDepartments = async () => {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
    );
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    const rawData = result.data || result;
    
    if (!Array.isArray(rawData)) return;
    
    // Column U is index 20 (0-based)
    const departmentsSet = new Set();
    
    // Start from row 7 (index 6)
    for (let i = 6; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row.length > 20 && row[20]) {
        const dept = row[20].toString().trim();
        if (dept) departmentsSet.add(dept);
      }
    }
    
    setDepartments(Array.from(departmentsSet));
  } catch (error) {
    console.error("Error fetching departments:", error);
  }
};

// Fetch unique designations
const fetchUniqueDesignations = async () => {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
    );
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    const rawData = result.data || result;
    
    if (!Array.isArray(rawData)) return;
    
    // Column F is index 5 (0-based) - Designation
    const designationsSet = new Set();
    
    // Start from row 7 (index 6)
    for (let i = 6; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row.length > 5 && row[5]) {
        const designation = row[5].toString().trim();
        if (designation) designationsSet.add(designation);
      }
    }
    
    setDesignations(Array.from(designationsSet));
  } catch (error) {
    console.error("Error fetching designations:", error);
  }
};
  // Function to generate next employee code - FIXED VERSION
  const generateNextEmployeeCode = async () => {
    try {
      console.log("Generating next employee code...");
      const lastEmployeeCode = await fetchLastEmployeeCode();
      console.log("Last employee code found:", lastEmployeeCode);

      if (!lastEmployeeCode) {
        console.log("No last code found, starting from PMMPL-001");
        return "PMMPL-001";
      }

      // Extract the numeric part and increment
      const match = lastEmployeeCode.match(/PMMPL-(\d+)/i);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        const nextCode = `PMMPL-${nextNumber.toString().padStart(3, '0')}`;
        console.log(`Incremented code: ${lastEmployeeCode} -> ${nextCode}`);
        return nextCode;
      }

      console.log("Pattern didn't match, starting from PMMPL-001");
      return "PMMPL-001";
    } catch (error) {
      console.error("Error generating next employee code:", error);
      return "PMMPL-001"; // Fallback
    }
  };


  // Add this helper function near your other helpers
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
  const fetchReportingOfficers = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Master&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Column B se data lena hai (index 1)
        const officers = result.data
          .slice(1) // Skip header row
          .map(row => row[1]) // Column B (index 1)
          .filter(officer => officer && officer.trim() !== "");

        setReportingOfficers(officers);
      }
    } catch (error) {
      console.error("Error fetching reporting officers:", error);
      toast.error("Failed to load reporting officers");
    }
  };

  // Call this in useEffect
  useEffect(() => {
  fetchJoiningData();
  fetchReportingOfficers();
  fetchDepartments(); // Add this
  fetchUniqueDesignations(); // Add this
}, []);

  // Google Drive folder ID for storing images
  const DRIVE_FOLDER_ID = "1Rb4DIzbZWSVyL5s_z4d0ntk0iM-JZWBq";

  const fetchJoiningData = async () => {
  setLoading(true);
  setTableLoading(true);
  setError(null);

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Raw JOINING API response:", result);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch data from JOINING sheet");
    }

    const rawData = result.data || result;

    if (!Array.isArray(rawData)) {
      throw new Error("Expected array data not received");
    }

    // Adjust header row index if needed
    let headerRowIndex = 5;
    const headers = rawData[headerRowIndex];
    
    const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
  
    const processedData = dataRows.map((row, idx) => {
      const item = {
        timestamp: row[0] || "",
        joiningNo: row[1] || "",
        candidateName: row[2] || "",
        fatherName: row[3] || "",
        dateOfJoining: row[4] || "",
        designation: row[5] || "",
        aadharPhoto: row[6] || "",
        candidatePhoto: row[7] || "",
        currentAddress: row[8] || "",
        bodAsPerAadhar: row[9] || "",
        gender: row[10] || "",
        mobileNo: row[11] || "",
        familyMobileNo: row[12] || "",
        relationWithFamily: row[13] || "",
        accountNo: row[14] || "",
        ifscCode: row[15] || "",
        branchName: row[16] || "",
        passbookPhoto: row[17] || "",
        email: row[18] || "",
        qualification: row[19] || "",
        department: row[20] || "",  // ← FIXED: Column U is department, not salary
        salary: row[21] || "",      // ← This should be salary (moved one column right)
        aadharNo: row[22] || "",
        resumeCopy: row[23] || "",
        plannedDate: row[23] || "",
        actual: row[24] || "",
        employeeCode: row[26] || "",        // AA
        salaryConfirmation: row[27] || "",  // AB
        reportingOfficer: row[28] || "",    // AC
        baseAddress: row[29] || "",         // AD
        punchCode: row[30] || "",           // AE
        officialEmail: row[31] || "",       // AF
        emailPassword: row[32] || "",       // AG
        laptopDetails: row[40] || "",       // AI
        mobileName: row[42] || "",          // AJ
        pfEsic: row[36] || "",              // AL
        manualImageUrl: row[39] || "",      // AM
        idProofCopy: row[37] || "",         // AN
        joiningLetter: row[41] || "",       // AO
        mobileImage: row[43] || "",         // AR
        laptopImage: row[41] || "",         // AS
        item1: row[46] || "",               // AT
        item1Image: row[47] || "",          // AU
        item2: row[48] || "",               // AV
        item2Image: row[49] || "",          // AW
        item3: row[50] || "",               // AX
        item3Image: row[51] || "",          // AY
        incentiveCategory: row[91] || "",
        bloodGroup: row[92] || "",          // Column CO (index 91)
        identificationMarks: row[93] || "", // Column CP (index 92)
      };
      
      return item;
    });

    // Rest of the function remains the same...

      // UPDATED LOGIC: Show in pending only if plannedDate exists BUT actual is empty
      const pendingTasks = processedData.filter(
        (task) => task.plannedDate && task.plannedDate.trim() !== "" && (!task.actual || task.actual.trim() === "")
      );

      console.log("Pending tasks found:", pendingTasks.length);
      console.log("First pending task:", pendingTasks[0]);

      setPendingData(pendingTasks);

      // UPDATED LOGIC: Show in history only if BOTH plannedDate AND actual are filled
      const historyTasks = processedData.filter(
        (task) => task.plannedDate && task.plannedDate.trim() !== "" && task.actual && task.actual.trim() !== ""
      );

      setHistoryData(historyTasks);

    } catch (error) {
      console.error("Error fetching joining data:", error);
      setError(error.message);
      toast.error(`Failed to load joining data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchAssetsData = async (employeeId) => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Assets&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        return null;
      }

      const data = result.data || result;
      if (!Array.isArray(data) || data.length < 2) {
        return null;
      }

      const matchingRow = data.find((row, index) => {
        if (index === 0) return false;
        return row[1]?.toString().trim() === employeeId?.toString().trim();
      });

      if (matchingRow) {
        return {
          punchCode: matchingRow[10] || "",
          emailId: matchingRow[3] || "",
          emailPassword: matchingRow[4] || "",
          laptop: matchingRow[5] || "",
          mobile: matchingRow[6] || "",
          manualImageUrl: matchingRow[39] || "",
          salaryConfirmation: matchingRow[11] || "", // Column L
          reportingOfficer: matchingRow[12] || "", // Column M
          pf: matchingRow[13] || "", // Column N
          baseAddress: matchingRow[14] || "", // Column O
          idProofCopyUrl: matchingRow[37] || "", // Column P
          joiningLetterUrl: matchingRow[16] || "", // Column Q
          incentiveCategory: matchingRow[17] || "", // Column R - New field
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching assets data:", error);
      return null;
    }
  };

  // Upload image to Google Drive
  const uploadImageToDrive = async (file, fileName) => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            const response = await fetch(
              "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  action: "uploadFile",
                  base64Data: base64Data,
                  fileName: fileName,
                  mimeType: file.type,
                  folderId: DRIVE_FOLDER_ID,
                }).toString(),
              }
            );

            const result = await response.json();
            if (result.success) {
              resolve(result.fileUrl);
            } else {
              reject(new Error(result.error || "Upload failed"));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleAfterJoiningClick = async (item) => {
    // Debug logs
    console.log("handleAfterJoiningClick called with item:", item);
    console.log("item.joiningNo:", item.joiningNo);

    if (!item || !item.joiningNo) {
      toast.error("Invalid item data. Please refresh and try again.");
      return;
    }

    // IMPORTANT: Set selectedItem FIRST before opening modal
    setSelectedItem(item);
    setShowModal(true);
    setLoading(true);

    try {
      // Auto-generate employee code FIRST
      console.log("Starting employee code generation...");
      const newEmployeeCode = await generateNextEmployeeCode();
      console.log("Auto-generated employee code:", newEmployeeCode);

      const assetsData = await fetchAssetsData(item.joiningNo);

      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;

      let headerRowIndex = 5;
      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());

      const serialNumberIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "serialnumber"
      );

      if (serialNumberIndex === -1) {
        throw new Error("Could not find 'serialNumber' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[serialNumberIndex]?.toString().trim() ===
          item.joiningNo?.toString().trim()
      );

      // Set form data with AUTO-GENERATED employee code
      // Set form data with AUTO-GENERATED employee code
setFormData({
  employeeCode: newEmployeeCode,
  salaryConfirmation: "",
  salaryAmount: "",
  reportingOfficer: "",
  pf: "",
  baseAddress: item.currentAddress || "",
  idProofCopy: null,
  joiningLetter: null,
  biometricAccess: false,
  punchCode: "",
  officialEmailId: false,
  emailId: "",
  emailPassword: "",
  laptop: "",
  mobile: "",
  manualImage: null,
  manualImageUrl: "",
  assignAssets: false,
  assets: [],
  incentiveCategory: "",
  // NEW FIELDS INITIALIZATION
  attendanceMode: "", // Default empty
  department: item.department || "", // ← FIXED: Use item.department instead of item.salary
  eligibleForPF: "", // Default empty
  eligibleForESIC: "", // Default empty
  remarks: "", // Default empty
  nextSalaryIncrementDate: "", // Default empty
  designation: item.designation || "", // Prefill with current designation
  bloodGroup: item.bloodGroup || "",
  identificationMarks: item.identificationMarks || "",
  companyName: "",
});

      if (rowIndex === -1) {
        console.warn(`Employee ${item.joiningNo} not found in sheet`);
      } else {
        // Column indices for reading existing data
        const biometricColumnIndex = 31; // Column AF
        const officialEmailColumnIndex = 32; // Column AG
        const assignAssetsColumnIndex = 33; // Column AH

        const currentValues = {
          biometricAccess:
            allData[rowIndex][biometricColumnIndex]
              ?.toString()
              .trim()
              .toLowerCase() === "yes",
          officialEmailId:
            allData[rowIndex][officialEmailColumnIndex]
              ?.toString()
              .trim()
              .toLowerCase() === "yes",
          assignAssets:
            allData[rowIndex][assignAssetsColumnIndex]
              ?.toString()
              .trim()
              .toLowerCase() === "yes",
        };

        const finalFormData = {
          ...currentValues,
          employeeCode: newEmployeeCode, // Keep the auto-generated code
          salaryConfirmation: assetsData?.salaryConfirmation || "",
          salaryAmount: assetsData?.salaryAmount || "",
          reportingOfficer: assetsData?.reportingOfficer || "",
          pf: assetsData?.pf || "",
          baseAddress: item.currentAddress || assetsData?.baseAddress || "",
          punchCode: assetsData?.punchCode || "",
          emailId: assetsData?.emailId || "",
          emailPassword: assetsData?.emailPassword || "",
          laptop: assetsData?.laptop || "",
          laptopImageUrl: assetsData?.laptopImageUrl || "",
          laptopImage: null,
          mobile: assetsData?.mobile || "",
          mobileImageUrl: assetsData?.mobileImageUrl || "",
          mobileImage: null,
          manualImageUrl: assetsData?.manualImageUrl || "",
          idProofCopy: null,
          joiningLetter: null,
          manualImage: null,
          incentiveCategory: assetsData?.incentiveCategory || "", 
          bloodGroup: item.bloodGroup || "",
          identificationMarks: item.identificationMarks || "",
          companyName: "", // Start with empty, user will select
          department: item.department || "", // ← ADD THIS: Prefill with department from item

          
          // Load incentive category
          // Convert existing item3, item4, item5 to assets array
          assets: [
            assetsData?.item3 ? { name: assetsData.item3, image: null, imageUrl: assetsData.item3ImageUrl || "" } : null,
            assetsData?.item4 ? { name: assetsData.item4, image: null, imageUrl: assetsData.item4ImageUrl || "" } : null,
            assetsData?.item5 ? { name: assetsData.item5, image: null, imageUrl: assetsData.item5ImageUrl || "" } : null,
          ].filter(Boolean), // Remove null entries
        };

        setFormData(prev => ({
          ...prev,
          ...finalFormData
        }));
      }

    } catch (error) {
      console.error("Error fetching current values:", error);
      toast.error("Failed to load current values");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the functions remain the same (handleCheckboxChange, handleInputChange, etc.)

  const handleCheckboxChange = (name) => {
    setFormData((prev) => {
      const newValue = !prev[name];
      
      // Agar Assign Assets checkbox check ho raha hai aur assets array empty hai
      if (name === "assignAssets" && newValue && prev.assets.length === 0) {
        return {
          ...prev,
          [name]: newValue,
          assets: [] // Empty array initialize karo
        };
      }
      
      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  // ... (saveAssetsData, handleSubmit, and other functions remain exactly the same)

  const saveAssetsData = async (employeeId, employeeName, assetsData) => {
    try {
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const rowData = [
        timestamp, // Column A
        employeeId, // Column B
        employeeName, // Column C
        assetsData.emailId || "", // Column D
        assetsData.emailPassword || "", // Column E
        assetsData.laptop || "", // Column F
        assetsData.mobile || "", // Column G
        "", // Column H - removed vehicle
        "", // Column I - removed other/SIM
        assetsData.manualImageUrl || "", // Column J
        assetsData.punchCode || "", // Column K
        assetsData.salaryConfirmation || "", // Column L - New
        assetsData.reportingOfficer || "", // Column M - New
        assetsData.pf || "", // Column N - New
        assetsData.baseAddress || "", // Column O - New
        assetsData.idProofCopyUrl || "", // Column P - New
        assetsData.joiningLetterUrl || "", // Column Q - New
        assetsData.incentiveCategory || "", // Column R - New: Incentive Category
      ];

      // Existing update/insert logic remains same...
      const existingData = await fetchAssetsData(employeeId);

      if (existingData) {
        const fetchResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Assets&action=fetch"
        );
        const result = await fetchResponse.json();
        const data = result.data || result;

        const rowIndex = data.findIndex((row, index) => {
          if (index === 0) return false;
          return row[1]?.toString().trim() === employeeId?.toString().trim();
        });

        if (rowIndex !== -1) {
          const response = await fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "Assets",
                action: "update",
                rowIndex: (rowIndex + 1).toString(),
                rowData: JSON.stringify(rowData),
              }).toString(),
            }
          );
          return await response.json();
        }
      }

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "Assets",
            action: "insert",
            rowData: JSON.stringify(rowData),
          }).toString(),
        }
      );

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to save assets data: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitting(true);

    // Validation
    console.log("handleSubmit called");
    console.log("selectedItem:", selectedItem);
    console.log("selectedItem.joiningNo:", selectedItem?.joiningNo);
    console.log("selectedItem.candidateName:", selectedItem?.candidateName);

    if (!selectedItem) {
      toast.error("No item selected. Please try again.");
      setSubmitting(false);
      setLoading(false);
      return;
    }

    if (!selectedItem.joiningNo) {
      toast.error("Joining number is missing. Please try again.");
      setSubmitting(false);
      setLoading(false);
      return;
    }

    if (!selectedItem.candidateName) {
      toast.error("Candidate name is missing. Please try again.");
      setSubmitting(false);
      setLoading(false);
      return;
    }

    try {
      // Upload images if present
      let idProofCopyUrl = "";
      let joiningLetterUrl = "";
      let manualImageUrl = formData.manualImageUrl;
      let laptopImageUrl = formData.laptopImageUrl;
      let mobileImageUrl = formData.mobileImageUrl;

      // Upload ID Proof
      if (formData.idProofCopy) {
        try {
          idProofCopyUrl = await uploadImageToDrive(
            formData.idProofCopy,
            `${selectedItem.joiningNo}_idproof_${Date.now()}.${formData.idProofCopy.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload ID proof: ${error.message}`);
        }
      }

      // Upload Joining Letter
      if (formData.joiningLetter) {
        try {
          joiningLetterUrl = await uploadImageToDrive(
            formData.joiningLetter,
            `${selectedItem.joiningNo}_joining_${Date.now()}.${formData.joiningLetter.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload joining letter: ${error.message}`);
        }
      }

      // Upload Laptop Image
      if (formData.laptopImage) {
        try {
          laptopImageUrl = await uploadImageToDrive(
            formData.laptopImage,
            `${selectedItem.joiningNo}_laptop_${Date.now()}.${formData.laptopImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload laptop image: ${error.message}`);
        }
      }

      // Upload Mobile Image
      if (formData.mobileImage) {
        try {
          mobileImageUrl = await uploadImageToDrive(
            formData.mobileImage,
            `${selectedItem.joiningNo}_mobile_${Date.now()}.${formData.mobileImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload mobile image: ${error.message}`);
        }
      }

      // Upload Manual Image
      if (formData.manualImage) {
        try {
          manualImageUrl = await uploadImageToDrive(
            formData.manualImage,
            `${selectedItem.joiningNo}_manual_${Date.now()}.${formData.manualImage.name.split('.').pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload manual image: ${error.message}`);
        }
      }

      // ===== UPLOAD DYNAMIC ASSET IMAGES =====
      const assetImageUrls = [];
      for (let i = 0; i < formData.assets.length; i++) {
        const asset = formData.assets[i];
        let imageUrl = asset.imageUrl || "";
        
        if (asset.image) {
          try {
            imageUrl = await uploadImageToDrive(
              asset.image,
              `${selectedItem.joiningNo}_item${i + 3}_${Date.now()}.${asset.image.name.split('.').pop()}`
            );
          } catch (error) {
            toast.error(`Failed to upload item ${i + 3} image: ${error.message}`);
          }
        }
        
        assetImageUrls.push(imageUrl);
      }

      // ===== SAVE TO ASSETS SHEET WITH DYNAMIC ITEMS =====
      await saveAssetsData(selectedItem.joiningNo, selectedItem.candidateName, {
        salaryConfirmation: formData.salaryConfirmation,
        salaryAmount: formData.salaryAmount,
        reportingOfficer: formData.reportingOfficer,
        pf: formData.pf,
        baseAddress: formData.baseAddress,
        idProofCopyUrl: idProofCopyUrl,
        joiningLetterUrl: joiningLetterUrl,
        emailId: formData.emailId,
        emailPassword: formData.emailPassword,
        laptop: formData.laptop,
        laptopImageUrl: laptopImageUrl,
        mobile: formData.mobile,
        mobileImageUrl: mobileImageUrl,
        item3: formData.assets[0]?.name || "",
        item3ImageUrl: assetImageUrls[0] || "",
        item4: formData.assets[1]?.name || "",
        item4ImageUrl: assetImageUrls[1] || "",
        item5: formData.assets[2]?.name || "",
        item5ImageUrl: assetImageUrls[2] || "",
        manualImageUrl: manualImageUrl,
        punchCode: formData.punchCode,
        incentiveCategory: formData.incentiveCategory, // Save incentive category
      });

      // Update JOINING sheet - Get row index
      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;
      let headerRowIndex = 5;

      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());
      const serialNumberIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "serialnumber"
      );

      if (serialNumberIndex === -1) {
        throw new Error("Could not find 'serialNumber' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[serialNumberIndex]?.toString().trim() ===
          selectedItem.joiningNo?.toString().trim()
      );

      if (rowIndex === -1) {
        throw new Error(`Employee ${selectedItem.joiningNo} not found`);
      }

      // Helper function to update a single cell
      const updateCell = (columnIndex, value) => {
        return fetch(
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
              columnIndex: columnIndex.toString(),
              value: value,
            }).toString(),
          }
        );
      };

      // Calculate salary value
      const salaryValue = formData.salaryConfirmation === "Yes"
        ? formData.salaryAmount
        : formData.salaryConfirmation;

      // Current date/time for Actual column (Column Y will be filled - यह actual column है)
      const now = new Date();
      const actualDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Prepare all updates - Complete column update AA to AZ
      const updatePromises = [];

      // All updates from Column AA (27) to AZ (52) - Complete row update
      const updates = [
        { col: 25, val: actualDate },                                 // Y (Column 26) - Actual Date (यहाँ actual fill हो रहा है)
        { col: 27, val: formData.employeeCode },                      // AA (Column 27) - Employee Code
        { col: 28, val: salaryValue },                                // AB (Column 28) - Salary Confirmation
        { col: 29, val: formData.reportingOfficer },                  // AC (Column 29) - Reporting Officer
        { col: 30, val: formData.baseAddress },                       // AD (Column 30) - Base Address
        { col: 31, val: formData.biometricAccess ? formData.punchCode : "" }, // AE (Column 31) - Biometric Access/Punch Code
        { col: 32, val: formData.officialEmailId ? formData.emailId : "" },   // AF (Column 32) - Official Email ID
        { col: 33, val: formData.officialEmailId ? formData.emailPassword : "" }, // AG (Column 33) - Password
        { col: 34, val: selectedItem.accountNo || "" },               // AH (Column 34) - Current Bank A.C No.
        { col: 35, val: selectedItem.ifscCode || "" },                // AI (Column 35) - IFSC Code
        { col: 36, val: selectedItem.designation || "" },             // AJ (Column 36) - Designation
        { col: 37, val: formData.pf },                                // AK (Column 37) - PF / ESIC
        { col: 38, val: formData.idProofCopy },                       // AL (Column 38) - ID Proof Copy
        { col: 39, val: joiningLetterUrl },                           // AM (Column 39) - Joining Letter Upload
        { col: 40, val: formData.manualImage },                       // AN (Column 40) - Manual/Document
        { col: 41, val: formData.laptop },                            // AO (Column 41) - Assign Assets/Laptop Details
        { col: 42, val: laptopImageUrl },                             // AP (Column 42) - Laptop Image
        { col: 43, val: formData.mobile },                            // AQ (Column 43) - Mobile Name
        { col: 44, val: mobileImageUrl },                             // AR (Column 44) - Mobile Image
        { col: 45, val: formData.assets[0]?.name || "" },             // AS (Column 45) - Item1
        { col: 46, val: assetImageUrls[0] || "" },                    // AT (Column 46) - Item1 Image
        { col: 47, val: formData.assets[1]?.name || "" },             // AU (Column 47) - Item2
        { col: 48, val: assetImageUrls[1] || "" },                    // AV (Column 48) - Item2 Image
        { col: 49, val: formData.assets[2]?.name || "" },             // AW (Column 49) - Item3
        { col: 50, val: assetImageUrls[2] || "" },                    // AX (Column 50) - Item3 Image
        { col: 91, val: formData.incentiveCategory || "" }, 

         { col: 95, val: formData.attendanceMode },              // Column CQ (92) - Attendance Mode
          { col: 96, val: formData.department },                  // Column CR (93) - Department
          { col: 97, val: formData.eligibleForPF },               // Column CS (94) - Eligible for PF
          { col: 98, val: formData.eligibleForESIC },             // Column CT (95) - Eligible for ESIC
          { col: 99, val: formData.remarks },                     // Column CU (96) - Remarks
          { col: 100, val: formData.nextSalaryIncrementDate },     // Column CV (97) - Next Salary Increment Date
          { col: 101, val: formData.companyName },      
      ];

      // Execute all updates from Y to AY
      updates.forEach(update => {
        updatePromises.push(updateCell(update.col, update.val));
      });

      // Execute all updates
      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const hasError = results.some((result) => !result.success);
      if (hasError) {
        console.error("Some cell updates failed:", results);
        throw new Error("Some cell updates failed");
      }

      toast.success("Data saved successfully! Item moved to history.");
      setShowModal(false);
      fetchJoiningData(); // Refresh data - अब यह history में दिखेगा क्योंकि actual भी fill हो गया

    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    // Handle the format "2021-11-01"
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const month = parts[1];
        const year = parts[0].slice(-2); // Get last 2 digits of year
        return `${day}/${month}/${year}`;
      }
    }

    // Fallback for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed, so add 1
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  const filteredPendingData = pendingData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold  ">After Joining Work </h1>
      </div>

      <div className="bg-white  p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search Something..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300   rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white   text-gray-500    "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2  text-gray-500  "
            />
          </div>
        </div>
      </div>

      <div className="bg-white  rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300  ">
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

        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Father Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Of Joining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    {/* In Pending tab table headers, add this th after Designation */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
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
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.length > 0 ? (
                      filteredPendingData.map((item, index) => {
                        // Debug log to see what's in item
                        console.log(`Row ${index} item:`, item);

                        return (
                          <tr key={index} className="hover:bg-white">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  console.log("Process button clicked for:", item);
                                  handleAfterJoiningClick(item);
                                }}
                                className="px-3 py-1 bg-indigo-700 text-white rounded-md text-sm"
                              >
                                Process
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.joiningNo || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.candidateName || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.fatherName || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDOB(item.dateOfJoining)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.designation || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.department || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateForDisplay(item.plannedDate)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <p className="text-gray-500">
                            No pending after joining work found.
                          </p>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Serial Number</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Employee Code</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Salary Confirmation</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Reporting Officer</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Base Address</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Punch Code</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Official Email</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Email Password</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Bank A/C No.</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">IFSC Code</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Designation</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">PF / ESIC</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">ID Proof Copy</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Joining Letter</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Attendance Mode</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Department</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Eligible PF</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Eligible ESIC</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Next Increment</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Company Name</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Blood Group</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">ID Marks</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Manual / Document</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Laptop Details</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Laptop Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Mobile Name</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Mobile Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Item 1</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Item 1 Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Item 2</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Item 2 Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Item 3</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Item 3 Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Incentive Category</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="27" className="px-6 py-12 text-center text-gray-500">
                        Loading history...
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="27" className="px-6 py-12 text-center text-gray-500">
                        No history found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{item.joiningNo}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.employeeCode}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.salaryConfirmation}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.reportingOfficer}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.baseAddress}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.punchCode}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.officialEmail}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.emailPassword}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.accountNo}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.ifscCode}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.designation}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.pfEsic}</td>
                        <td className="px-4 py-2 text-sm text-blue-600 underline">
                          {item.idProofCopy && <a href={item.idProofCopy} target="_blank" rel="noopener noreferrer">View</a>}
                        </td>
                        <td className="px-4 py-2 text-sm text-blue-600 underline">
                          {item.joiningLetter && <a href={item.joiningLetter} target="_blank" rel="noopener noreferrer">View</a>}
                        </td>
                        <td className="px-4 py-2 text-sm text-blue-600 underline">
                          {item.manualImageUrl && <a href={item.manualImageUrl} target="_blank" rel="noopener noreferrer">View</a>}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.laptopDetails}</td>
                        
                        {/* LAPTOP IMAGE - Updated to show as clickable link */}
                        <td className="px-4 py-2">
                          {item.laptopImage ? (
                            <a href={item.laptopImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                              View 
                            </a>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.mobileName}</td>
                        
                        {/* MOBILE IMAGE - Updated to show as clickable link */}
                        <td className="px-4 py-2">
                          {item.mobileImage ? (
                            <a href={item.mobileImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                              View 
                            </a>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.item1}</td>
                        
                        {/* ITEM 1 IMAGE - Updated to show as clickable link */}
                        <td className="px-4 py-2">
                          {item.item1Image ? (
                            <a href={item.item1Image} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                              View 
                            </a>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.item2}</td>
                        
                        {/* ITEM 2 IMAGE - Updated to show as clickable link */}
                        <td className="px-4 py-2">
                          {item.item2Image ? (
                            <a href={item.item2Image} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                              View 
                            </a>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.item3}</td>
                        
                        {/* ITEM 3 IMAGE - Updated to show as clickable link */}
                        <td className="px-4 py-2">
                          {item.item3Image ? (
                            <a href={item.item3Image} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                              View 
                            </a>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>

                        {/* NEW: Incentive Category */}
                        <td className="px-4 py-2 text-sm text-gray-700">{item.incentiveCategory}</td>
                        
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">Completed</span>
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
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-500">
                After Joining Work - {selectedItem.candidateName}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={selectedItem.joiningNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 font-semibold"
                    placeholder="Auto-generated"
                    required
                    readOnly
                  />
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Auto-generated from last employee code
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={selectedItem.candidateName}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                 {/* Designation - Editable dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Designation *
            </label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
              required
            >
              <option value="">Select Designation</option>
              {designations.map((designation, index) => (
                <option key={index} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
            {/* Allow manual input as well */}
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm"
              placeholder="Or type custom designation"
            />
          </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Reporting Officer *
                  </label>
                  <select
                    name="reportingOfficer"
                    value={formData.reportingOfficer}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Reporting Officer</option>
                    {reportingOfficers.map((officer, index) => (
                      <option key={index} value={officer}>
                        {officer}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Salary Confirmation *
                  </label>
                  <select
                    name="salaryConfirmation"
                    value={formData.salaryConfirmation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Show Salary Input only when Yes is selected */}
                {formData.salaryConfirmation === "Yes" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Salary Amount *
                    </label>
                    <input
                      type="text"
                      name="salaryAmount"
                      value={formData.salaryAmount}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                      placeholder="Enter salary amount"
                      required
                    />
                  </div>
                )}

                {/* NEW: Incentive Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Incentive Category *
                  </label>
                  <select
                    name="incentiveCategory"
                    value={formData.incentiveCategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Incentive Category</option>
                    <option value="MIS Basis">MIS Basis</option>
                    <option value="Non Mis">Non Mis</option>
                    <option value="OT Basis">OT Basis</option>
                    <option value="Per MT">Per MT</option>
                  </select>
                </div>
              </div>

              {/* Bank Details (Pre-filled) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Bank Account No.
                  </label>
                  <input
                    type="text"
                    value={selectedItem.accountNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={selectedItem.ifscCode}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* PF */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    PF Number
                  </label>
                  <input
                    type="text"
                    name="pf"
                    value={formData.pf}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    placeholder="Enter PF number"
                  />
                </div>
              </div>

              {/* Base Address */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Base Address
                  </label>
                  <textarea
                    name="baseAddress"
                    value={formData.baseAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    placeholder="Enter base address"
                  />
                </div>
              </div>
              {/* NEW FIELDS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Attendance Mode *
            </label>
            <select
              name="attendanceMode"
              value={formData.attendanceMode}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
              required
            >
              <option value="">Select Mode</option>
              <option value="outsider">Outsider</option>
              <option value="machine">Machine</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Eligible for PF */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Eligible for PF *
            </label>
            <select
              name="eligibleForPF"
              value={formData.eligibleForPF}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
              required
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Eligible for ESIC */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Eligible for ESIC *
            </label>
            <select
              name="eligibleForESIC"
              value={formData.eligibleForESIC}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
              required
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

         

  {/* Next Salary Increment Date */}
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      Next Salary Increment Date *
    </label>
    <input
      type="date"
      name="nextSalaryIncrementDate"
      value={formData.nextSalaryIncrementDate}
      onChange={handleInputChange}
      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
      required
    />
  </div>
  {/* Add these new fields in the modal form, after the existing fields section */}

{/* Blood Group (Prefilled) */}
<div>
  <label className="block text-sm font-medium text-gray-500 mb-1">
    Blood Group
  </label>
  <input
    type="text"
    name="bloodGroup"
    value={formData.bloodGroup}
    onChange={handleInputChange}
    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
    placeholder="Auto-filled from database"
    readOnly
  />
</div>

{/* Identification Marks (Prefilled) */}
<div>
  <label className="block text-sm font-medium text-gray-500 mb-1">
    Identification Marks
  </label>
  <textarea
    name="identificationMarks"
    value={formData.identificationMarks}
    onChange={handleInputChange}
    rows={2}
    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
    placeholder="Auto-filled from database"
    readOnly
  />
</div>

{/* Company Name Dropdown */}
<div>
  <label className="block text-sm font-medium text-gray-500 mb-1">
    Company Name *
  </label>
  <select
    name="companyName"
    value={formData.companyName}
    onChange={handleInputChange}
    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
    required
  >
    <option value="">Select Company</option>
    {companyOptions.map((company, index) => (
      <option key={index} value={company}>
        {company}
      </option>
    ))}
  </select>
</div>
</div>

{/* Remarks - Full width */}
<div className="grid grid-cols-1 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      Remarks
    </label>
    <textarea
      name="remarks"
      value={formData.remarks}
      onChange={handleInputChange}
      rows={2}
      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
      placeholder="Enter any remarks"
    />
  </div>
</div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    ID Proof Copy
                  </label>
                  <input
                    type="file"
                    id="idProofCopy"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleImageUpload(e, "idProofCopy")}
                    className="hidden"
                  />
                  <label
                    htmlFor="idProofCopy"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    {formData.idProofCopy ? formData.idProofCopy.name : "Upload ID Proof"}
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Upload Interview Assessment Sheet
                  </label>
                  <input
                    type="file"
                    id="joiningLetter"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleImageUpload(e, "joiningLetter")}
                    className="hidden"
                  />
                  <label
                    htmlFor="joiningLetter"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    {formData.joiningLetter ? formData.joiningLetter.name : "Upload Interview Assessment"}
                  </label>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-500">
                  Checklist Items
                </h4>

                {/* Biometric Access */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="biometricAccess"
                    checked={formData.biometricAccess}
                    onChange={() => handleCheckboxChange("biometricAccess")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="biometricAccess"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Biometric Access
                  </label>
                </div>
                {formData.biometricAccess && (
                  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Punch Code
                        </label>
                        <input
                          type="text"
                          name="punchCode"
                          value={formData.punchCode}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter punch code"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Official Email ID */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="officialEmailId"
                      checked={formData.officialEmailId}
                      onChange={() => handleCheckboxChange("officialEmailId")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="officialEmailId"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Official Email ID
                    </label>
                  </div>
                  {formData.officialEmailId && (
                    <div className="mt-2 ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Email ID
                        </label>
                        <input
                          type="text"
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter email ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          name="emailPassword"
                          value={formData.emailPassword}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter password"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Assign Assets - UPDATED SECTION WITH ADD BUTTON */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="assignAssets"
                    checked={formData.assignAssets}
                    onChange={() => handleCheckboxChange("assignAssets")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="assignAssets"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Assign Assets
                  </label>
                </div>
                {formData.assignAssets && (
                  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md space-y-4">
                    {/* Laptop - Always visible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Laptop Name
                        </label>
                        <input
                          type="text"
                          name="laptop"
                          value={formData.laptop}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter laptop name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Laptop Image
                        </label>
                        <input
                          type="file"
                          id="laptopImage"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "laptopImage")}
                          className="hidden"
                        />
                        <label
                          htmlFor="laptopImage"
                          className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                        >
                          {formData.laptopImage ? "Change Image" : formData.laptopImageUrl ? "Replace Image" : "Upload Image"}
                        </label>
                        {(formData.laptopImageUrl || formData.laptopImage) && (
                          <img
                            src={formData.laptopImage ? URL.createObjectURL(formData.laptopImage) : formData.laptopImageUrl}
                            alt="Laptop"
                            className="mt-2 h-20 w-full object-contain rounded border"
                          />
                        )}
                      </div>
                    </div>

                    {/* Mobile - Always visible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Mobile Name
                        </label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter mobile name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Mobile Image
                        </label>
                        <input
                          type="file"
                          id="mobileImage"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "mobileImage")}
                          className="hidden"
                        />
                        <label
                          htmlFor="mobileImage"
                          className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                        >
                          {formData.mobileImage ? "Change Image" : formData.mobileImageUrl ? "Replace Image" : "Upload Image"}
                        </label>
                        {(formData.mobileImageUrl || formData.mobileImage) && (
                          <img
                            src={formData.mobileImage ? URL.createObjectURL(formData.mobileImage) : formData.mobileImageUrl}
                            alt="Mobile"
                            className="mt-2 h-20 w-full object-contain rounded border"
                          />
                        )}
                      </div>
                    </div>

                    {/* Dynamic Items */}
                    {formData.assets.map((asset, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md relative">
                        <button
                          type="button"
                          onClick={() => {
                            const newAssets = formData.assets.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, assets: newAssets }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Item {index + 3} Name
                          </label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => {
                              const newAssets = [...formData.assets];
                              newAssets[index].name = e.target.value;
                              setFormData(prev => ({ ...prev, assets: newAssets }));
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Item {index + 3} Image
                          </label>
                          <input
                            type="file"
                            id={`assetImage${index}`}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const newAssets = [...formData.assets];
                                newAssets[index].image = file;
                                setFormData(prev => ({ ...prev, assets: newAssets }));
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`assetImage${index}`}
                            className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                          >
                            {asset.image ? "Change Image" : asset.imageUrl ? "Replace Image" : "Upload Image"}
                          </label>
                          {(asset.imageUrl || asset.image) && (
                            <img
                              src={asset.image ? URL.createObjectURL(asset.image) : asset.imageUrl}
                              alt={`Item ${index + 3}`}
                              className="mt-2 h-20 w-full object-contain rounded border"
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Item Button */}
                    {formData.assets.length < 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.assets.length < 3) {
                            setFormData(prev => ({
                              ...prev,
                              assets: [...prev.assets, { name: '', image: null, imageUrl: '' }]
                            }));
                          }
                        }}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Item (Max 3)
                      </button>
                    )}

                    {/* Manual Image Upload */}
                    <div className="space-y-2 border-t pt-4">
                      <label className="block text-sm font-medium text-gray-500">
                        Upload Manual/Document
                      </label>
                      <input
                        type="file"
                        id="manualImage"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleImageUpload(e, "manualImage")}
                        className="hidden"
                      />
                      <label
                        htmlFor="manualImage"
                        className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                      >
                        {formData.manualImage ? "Change Manual" : formData.manualImageUrl ? "Replace Manual" : "Upload Manual"}
                      </label>
                      {(formData.manualImageUrl || formData.manualImage) && (
                        <img
                          src={formData.manualImage ? URL.createObjectURL(formData.manualImage) : formData.manualImageUrl}
                          alt="Manual"
                          className="mt-2 h-32 w-full object-contain rounded border"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50"
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

export default AfterJoiningWork;