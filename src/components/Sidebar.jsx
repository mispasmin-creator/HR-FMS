import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

import {
  LayoutDashboard,
  FileText,
  Globe,
  Search,
  Phone,
  UserCheck,
  UserX,
  UserMinus,
  AlarmClockCheck,
  Users,
  Calendar,
  DollarSign,
  FileText as LeaveIcon,
  User as ProfileIcon,
  Clock,
  LogOut as LogOutIcon,
  X,
  DoorOpen,
  User,
  Menu,
  ChevronDown,
  ChevronUp,
  NotebookPen,
  Book,
  BadgeDollarSign,
  BookPlus,
  UserCog, 
  TrendingUp,
  Receipt,
  CreditCard


} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { fetchAllIndents } from '../services/indentService';
import { fetchAfterJoiningData } from '../services/afterJoiningService';
import { fetchPendingIndentsForSocialSite } from '../services/socialSiteService';
import { fetchSiesEmployees } from '../services/siesEmployeeService';
import { fetchPendingJoiningCandidates } from '../services/joiningService';
import { fetchPendingEnquiries } from '../services/callTrackerService';
import { fetchLeavingData } from '../services/leavingService';


const Sidebar = ({ onClose }) => {

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [showLanguageHint, setShowLanguageHint] = useState(false);
  const [isTranslateReady, setIsTranslateReady] = useState(false);
const [afterLeavingOpen, setAfterLeavingOpen] = useState(false);
const [pendingIndentCount, setPendingIndentCount] = useState(0);
const [pendingSocialSiteCount, setPendingSocialSiteCount] = useState(0); // Add this
const [pendingFindEnquiryCount, setPendingFindEnquiryCount] = useState(0); // Add this
const [pendingCallTrackerCount, setPendingCallTrackerCount] = useState(0);
const [pendingJoiningCount, setPendingJoiningCount] = useState(0);
const [pendingAfterJoiningCount, setPendingAfterJoiningCount] = useState(0);
const [pendingLeavingCount, setPendingLeavingCount] = useState(0);
const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
const [pendingReportingManagerCount, setPendingReportingManagerCount] = useState(0);
const [pendingITDepartmentCount, setPendingITDepartmentCount] = useState(0);
const [pendingAdminDepartmentCount, setPendingAdminDepartmentCount] = useState(0);
const [pendingAccountDepartmentCount, setPendingAccountDepartmentCount] = useState(0);
const [pendingStoreDepartmentCount, setPendingStoreDepartmentCount] = useState(0);
const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
const [pendingPayrollCount, setPendingPayrollCount] = useState(0);
const [employeeCount, setEmployeeCount] = useState(0);
const [payrollCount, setPayrollCount] = useState(0);
const [advanceReportCount, setAdvanceReportCount] = useState(0);
const [deductionsCount, setDeductionsCount] = useState(0);
const [siesEmployeesCount, setSiesEmployeesCount] = useState(0);
  const sidebarRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const isNavigatingRef = useRef(false);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  // Get current language from Google Translate
  const getCurrentLanguage = () => {
    const googTransCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('googtrans='));

    if (googTransCookie) {
      const value = googTransCookie.split('=')[1];
      const langCode = value.split('/')[2];
      return langCode || 'en';
    }
    return 'en';
  };


  // Fetch pending find enquiry count
// In Sidebar component, replace the existing fetchPendingFindEnquiryCount function with this:
// REPLACE the first useEffect (around line 55-62) with this improved version

useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `
    html, body { 
      scroll-behavior: auto !important; 
    }
    button:focus, a:focus, div:focus { 
      scroll-margin: 0 !important; 
    }
    * {
      overflow-anchor: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // Override native scrollIntoView to prevent auto-scrolling
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(arg) {
    if (typeof arg === 'object') {
      return originalScrollIntoView.call(this, { 
        ...arg, 
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest'
      });
    }
    return originalScrollIntoView.call(this, false);
  };
  
  return () => {
    document.head.removeChild(style);
    Element.prototype.scrollIntoView = originalScrollIntoView;
  };
}, []);



useEffect(() => {
  const fetchPendingFindEnquiryCount = async () => {
    try {
      const result = await fetchAllIndents();
      
      if (result.success && result.data) {
        let count = 0;
        
        result.data.forEach((item) => {
          const status = (item.status || "").toString().trim();
          const planned2 = (item.planned_2 || "").toString().trim();
          const actual2 = (item.actual_2 || "").toString().trim();
          
          // Match the logic: Status='Pending', has Planned 2, no Actual 2
          const isValidStatus = status.toLowerCase() === 'pending';
          const hasPlanned2 = planned2 !== '';
          const noActual2 = actual2 === '';
          
          if (isValidStatus && hasPlanned2 && noActual2) {
            count++;
          }
        });
        
        console.log('Total pending find enquiry count (Supabase):', count);
        setPendingFindEnquiryCount(count);
      }
    } catch (error) {
      console.error('Error fetching pending find enquiry count from Supabase:', error);
      setPendingFindEnquiryCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingFindEnquiryCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingFindEnquiryCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);



// Add this useEffect after the other count fetching useEffects in Sidebar
// In Sidebar component - REPLACE the existing fetchPendingAfterJoiningCount function

// ALTERNATIVE - Direct copy of AfterJoiningWork.js logic

useEffect(() => {
  const fetchPendingAfterJoiningCount = async () => {
    try {
      const result = await fetchAfterJoiningData();
      if (result.success) {
        setPendingAfterJoiningCount(result.pending.length);
      }
    } catch (error) {
      console.error("Error fetching pending after joining count from Supabase:", error);
      setPendingAfterJoiningCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingAfterJoiningCount();
    const interval = setInterval(fetchPendingAfterJoiningCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);



useEffect(() => {
  const fetchPendingIndentCount = async () => {
    try {
      const result = await fetchAllIndents();
      
      if (result.success && result.data) {
        let pendingCount = 0;
        
        result.data.forEach((item) => {
          const statusStr = (item.status || "").toString().trim().toLowerCase();
          
          // Count as pending if status is NOT complete/fulfilled
          const isComplete = [
            'complete', 
            'completed', 
            'fulfilled'
          ].includes(statusStr);
          
          if (!isComplete) {
            pendingCount++;
          }
        });
        
        console.log('Pending indent count (Supabase):', pendingCount);
        setPendingIndentCount(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching pending indent count from Supabase:', error);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingIndentCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingIndentCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);


useEffect(() => {
  const fetchPendingSocialSiteCount = async () => {
    try {
      const result = await fetchPendingIndentsForSocialSite();
      
      if (result.success && result.data) {
        setPendingSocialSiteCount(result.data.length);
      }
    } catch (error) {
      console.error('Error fetching pending social site count from Supabase:', error);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingSocialSiteCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingSocialSiteCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);

// Add this useEffect after the other useEffect hooks

  useEffect(() => {
    const fetchPendingJoiningCount = async () => {
      try {
        if (user?.Admin === "Yes") {
          const result = await fetchPendingJoiningCandidates();
          if (result.success) {
            setPendingJoiningCount(result.data.length);
          }
        }
      } catch (error) {
        console.error("Error fetching pending joining count:", error);
        setPendingJoiningCount(0);
      }
    };

    fetchPendingJoiningCount();
    const interval = setInterval(fetchPendingJoiningCount, 30000);
    return () => clearInterval(interval);
  }, [user?.Admin]);

  useEffect(() => {
    const fetchPendingCallTrackerCount = async () => {
      try {
        if (user?.Admin === "Yes") {
          const result = await fetchPendingEnquiries();
          if (result.success) {
            setPendingCallTrackerCount(result.data.length);
          }
        }
      } catch (error) {
        console.error("Error fetching pending call tracker count:", error);
        setPendingCallTrackerCount(0);
      }
    };

    fetchPendingCallTrackerCount();
    const interval = setInterval(fetchPendingCallTrackerCount, 30000);
    return () => clearInterval(interval);
  }, [user?.Admin]);

// Add this useEffect after the other count fetching useEffects in Sidebar
useEffect(() => {
  const fetchPendingApprovalCount = async () => {
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
        setPendingApprovalCount(0);
        return;
      }

      console.log("Raw data for pending approval count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based):
        // Column BG = index 58 (approval request marker)
        // Column BH = index 59 (approval completion timestamp)
        const columnBG = row[58]; // Column BG
        const columnBH = row[59]; // Column BH
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 7}: Column BG = "${columnBG}", Column BH = "${columnBH}"`);
        }
        
        // Condition: Column BG has value AND Column BH is empty
        if (columnBG && columnBG.toString().trim() !== "" && 
            (!columnBH || columnBH.toString().trim() === "")) {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending approval: Row ${idx + 7}, BG = "${columnBG}", BH = "${columnBH}"`);
        }
      });

      console.log("Total pending approval count:", pendingCount);
      setPendingApprovalCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending approval count:', error);
      setPendingApprovalCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingApprovalCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingApprovalCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);

// 1. Fetch pending Admin Department count
useEffect(() => {
  const fetchPendingAdminDepartmentCount = async () => {
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
        setPendingAdminDepartmentCount(0);
        return;
      }

      console.log("Raw data for pending admin department count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based) in JOINING sheet:
        // Column BS = index 70 (Admin department planned date)
        // Column BT = index 71 (Admin department actual date)
        const columnBS = row[70]; // Column BS - adminDeptPlanned
        const columnBT = row[71]; // Column BT - adminDeptActual
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 7}: Column BS = "${columnBS}", Column BT = "${columnBT}"`);
        }
        
        // Condition: Column BS has value AND Column BT is empty
        if (columnBS && columnBS.toString().trim() !== "" && 
            (!columnBT || columnBT.toString().trim() === "")) {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending admin department: Row ${idx + 7}, BS = "${columnBS}", BT = "${columnBT}"`);
        }
      });

      console.log("Total pending admin department count:", pendingCount);
      setPendingAdminDepartmentCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending admin department count:', error);
      setPendingAdminDepartmentCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingAdminDepartmentCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingAdminDepartmentCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);

// 2. Fetch pending Account Department count
useEffect(() => {
  const fetchPendingAccountDepartmentCount = async () => {
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
        setPendingAccountDepartmentCount(0);
        return;
      }

      console.log("Raw data for pending account department count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based) in JOINING sheet:
        // Column BW = index 74 (Account department planned date)
        // Column BX = index 75 (Account department actual date)
        const columnBW = row[74]; // Column BW - accountDeptPlanned
        const columnBX = row[75]; // Column BX - accountDeptActual
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 7}: Column BW = "${columnBW}", Column BX = "${columnBX}"`);
        }
        
        // Condition: Column BW has value AND Column BX is empty
        if (columnBW && columnBW.toString().trim() !== "" && 
            (!columnBX || columnBX.toString().trim() === "")) {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending account department: Row ${idx + 7}, BW = "${columnBW}", BX = "${columnBX}"`);
        }
      });

      console.log("Total pending account department count:", pendingCount);
      setPendingAccountDepartmentCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending account department count:', error);
      setPendingAccountDepartmentCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingAccountDepartmentCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingAccountDepartmentCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);

// Add this useEffect for counting ALL advance records
useEffect(() => {
  const fetchAdvanceReportCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Advance&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        console.log("No data found in Advance sheet");
        setAdvanceReportCount(0);
        return;
      }

      console.log("Raw advance data:", rawData.length, "rows total");

      // Count ALL rows EXCEPT the header row (row 1)
      let totalCount = 0;
      
      if (rawData.length > 1) {
        // Start from row 2 (index 1) to skip header
        const dataRows = rawData.slice(1);
        
        // Count rows that have at least employee name (Column B/index 1)
        dataRows.forEach((row, idx) => {
          // Check if employee name exists (Column B/index 1)
          const employeeName = row[1] || '';
          const hasName = employeeName.toString().trim() !== '';
          
          if (hasName) {
            totalCount++;
            
            // Log first few rows for debugging
            if (idx < 3) {
              console.log(`Advance row ${idx + 2}:`, employeeName);
            }
          }
        });
      }

      console.log("Total advance records:", totalCount);
      setAdvanceReportCount(totalCount);

    } catch (error) {
      console.error('Error fetching advance report count:', error);
      setAdvanceReportCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchAdvanceReportCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAdvanceReportCount, 60000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);


// 3. Fetch pending Store Department count
useEffect(() => {
  const fetchPendingStoreDepartmentCount = async () => {
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
        setPendingStoreDepartmentCount(0);
        return;
      }

      console.log("Raw data for pending store department count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based) in JOINING sheet:
        // Column CA = index 78 (Store department planned date) - Note: This might be different in your sheet
        // Column CB = index 79 (Store department actual date)
        const columnCA = row[78]; // Column CA - storeDeptPlanned
        const columnCB = row[79]; // Column CB - storeDeptActual
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 7}: Column CA = "${columnCA}", Column CB = "${columnCB}"`);
        }
        
        // Condition: Column CA has value AND Column CB is empty
        if (columnCA && columnCA.toString().trim() !== "" && 
            (!columnCB || columnCB.toString().trim() === "")) {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending store department: Row ${idx + 7}, CA = "${columnCA}", CB = "${columnCB}"`);
        }
      });

      console.log("Total pending store department count:", pendingCount);
      setPendingStoreDepartmentCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending store department count:', error);
      setPendingStoreDepartmentCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingStoreDepartmentCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingStoreDepartmentCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);



// Add this useEffect for counting ALL payroll records
useEffect(() => {
  const fetchPayrollCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Payroll&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        console.log("No data found in Payroll sheet");
        setPayrollCount(0);
        return;
      }

      console.log("Raw payroll data:", rawData.length, "rows total");

      // Count ALL rows EXCEPT the header row (row 1)
      let totalCount = 0;
      
      if (rawData.length > 1) {
        // Start from row 2 (index 1) to skip header
        const dataRows = rawData.slice(1);
        
        // Count all rows that have at least one non-empty cell
        dataRows.forEach((row, idx) => {
          // Check if row has any data (not completely empty)
          const hasData = row.some(cell => 
            cell !== null && cell !== undefined && cell.toString().trim() !== ''
          );
          
          if (hasData) {
            totalCount++;
            
            // Log first few rows for debugging
            if (idx < 3) {
              console.log(`Payroll row ${idx + 2}:`, row.slice(0, 5));
            }
          }
        });
      }

      console.log("Total payroll records (excluding header):", totalCount);
      setPayrollCount(totalCount);

    } catch (error) {
      console.error('Error fetching payroll count:', error);
      setPayrollCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPayrollCount();
    // Refresh every 60 seconds (less frequent since it's just a count)
    const interval = setInterval(fetchPayrollCount, 60000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);


  useEffect(() => {
    const hasSeenLanguageHint = localStorage.getItem('hasSeenLanguageHint');
    const currentDetectedLang = getCurrentLanguage();
    setCurrentLang(currentDetectedLang);

    if (!hasSeenLanguageHint && currentDetectedLang === 'en') {
      setShowLanguageHint(true);
    } else {
      setShowLanguageHint(false);
    }

    // Ensure Google Translate cookie persistence on route change
    const ensureLanguagePersistence = () => {
      const detectedLang = getCurrentLanguage();
      if (detectedLang !== 'en' && detectedLang) {
        const cookieValue = `/en/${detectedLang}`;
        const hostname = window.location.hostname;
        const domainPart = (hostname === 'localhost' || !hostname) ? '' : `;domain=.${hostname}`;

        document.cookie = `googtrans=${cookieValue}${domainPart};path=/;max-age=31536000`;
        document.cookie = `googtrans=${cookieValue};path=/;max-age=31536000`;
      }
    };

    // Run on component mount
    ensureLanguagePersistence();

  }, []);

  // Add this useEffect after the other count fetching useEffects in Sidebar
useEffect(() => {
    const fetchPendingLeavingCount = async () => {
      try {
        if (user?.Admin === "Yes") {
          const result = await fetchLeavingData();
          if (result.success) {
            // Count where planned_leaving_date is present and actual_leaving_date is null
            // We need to check if the result.pending contains the necessary data.
            // Based on Sidebar.jsx original logic, it filtered from standard data structure.
            // fetchLeavingData from leavingService currently returns all active employees as 'pending'.
            // To be precise, we filter for those who have a planned leaving date.
            const pendingLeaving = result.pending.filter(item => 
              item.planned_leaving_date && !item.actual_leaving_date
            );
            setPendingLeavingCount(pendingLeaving.length);
          }
        }
      } catch (error) {
        console.error("Error fetching pending leaving count:", error);
        setPendingLeavingCount(0);
      }
    };

    fetchPendingLeavingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingLeavingCount, 30000);
    return () => clearInterval(interval);
  }, [user?.Admin]);


// Add this useEffect after the other count fetching useEffects in Sidebar
// Replace the fetchPendingReportingManagerCount useEffect with this:
useEffect(() => {
  const fetchPendingReportingManagerCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch" // Changed from LEAVING to JOINING
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData) || rawData.length < 7) {
        console.log("No data found or insufficient rows");
        setPendingReportingManagerCount(0);
        return;
      }

      console.log("Raw data for pending reporting manager count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based) in JOINING sheet:
        // Column BK = index 62 (reporting manager planned date)
        // Column BL = index 63 (reporting manager actual date)
        const columnBK = row[62]; // Column BK - reportingManagerPlanned
        const columnBL = row[63]; // Column BL - reportingManagerActual
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 7}: Column BK = "${columnBK}", Column BL = "${columnBL}"`);
        }
        
        // Condition: Column BK has value AND Column BL is empty
        if (columnBK && columnBK.toString().trim() !== "" && 
            (!columnBL || columnBL.toString().trim() === "")) {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending reporting manager: Row ${idx + 7}, BK = "${columnBK}", BL = "${columnBL}"`);
        }
      });

      console.log("Total pending reporting manager count:", pendingCount);
      setPendingReportingManagerCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending reporting manager count:', error);
      setPendingReportingManagerCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingReportingManagerCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingReportingManagerCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);
// Add this useEffect for counting ACTIVE SIES employees
useEffect(() => {
  const fetchSiesEmployeesCount = async () => {
    try {
      const result = await fetchSiesEmployees();
      
      if (result.success && result.data) {
        // Count only Active employees
        const activeCount = result.data.filter(emp => emp.status === 'Active').length;
        console.log("Total active SIES employees (Supabase):", activeCount);
        setSiesEmployeesCount(activeCount);
      }
    } catch (error) {
      console.error('Error fetching SIES employees count from Supabase:', error);
      setSiesEmployeesCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchSiesEmployeesCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchSiesEmployeesCount, 60000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);
// Add this useEffect after the other count fetching useEffects in Sidebar
useEffect(() => {
  const fetchPendingITDepartmentCount = async () => {
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
        setPendingITDepartmentCount(0);
        return;
      }

      console.log("Raw data for pending IT department count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based) in JOINING sheet:
        // Column BO = index 66 (IT department planned date)
        // Column BP = index 67 (IT department actual date)
        const columnBO = row[66]; // Column BO - itDeptPlanned
        const columnBP = row[67]; // Column BP - itDeptActual
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 7}: Column BO = "${columnBO}", Column BP = "${columnBP}"`);
        }
        
        // Condition: Column BO has value AND Column BP is empty
        if (columnBO && columnBO.toString().trim() !== "" && 
            (!columnBP || columnBP.toString().trim() === "")) {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending IT department: Row ${idx + 7}, BO = "${columnBO}", BP = "${columnBP}"`);
        }
      });

      console.log("Total pending IT department count:", pendingCount);
      setPendingITDepartmentCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending IT department count:', error);
      setPendingITDepartmentCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingITDepartmentCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingITDepartmentCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);
// Add this useEffect for counting pending leave requests
useEffect(() => {
  const fetchPendingLeaveCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Leave Management&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData) || rawData.length < 2) {
        console.log("No data found or insufficient rows in Leave Management sheet");
        setPendingLeaveCount(0);
        return;
      }

      console.log("Raw data for pending leave count:", rawData.length, "rows");

      // Skip header row (row 1), data starts from row 2 (index 1)
      const dataRows = rawData.length > 1 ? rawData.slice(1) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based) in Leave Management sheet:
        // Column H = index 7 (Status column)
        const status = row[7] || ''; // Column H - Status
        
        // Column C = index 2 (Employee Name) - to filter out blank rows
        const employeeName = row[3] || ''; // Column D (index 3) - Employee Name
        
        // Debug logging for first few rows
        if (idx < 5) {
          console.log(`Row ${idx + 2}: Employee: "${employeeName}", Status: "${status}"`);
        }
        
        // Condition: Status is "Pending" (case-insensitive) AND employee name is not empty
        if (status.toString().toLowerCase() === 'pending' && 
            employeeName && employeeName.toString().trim() !== '') {
          pendingCount++;
          
          // Log the matching row
          console.log(`Found pending leave: Row ${idx + 2}, Employee: "${employeeName}", Status: "${status}"`);
        }
      });

      console.log("Total pending leave count:", pendingCount);
      setPendingLeaveCount(pendingCount);

    } catch (error) {
      console.error('Error fetching pending leave count:', error);
      setPendingLeaveCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchPendingLeaveCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingLeaveCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);
// Add this useEffect for counting active employees
useEffect(() => {
  const fetchEmployeeCount = async () => {
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
        setEmployeeCount(0);
        return;
      }

      console.log("Raw data for employee count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let activeEmployeeCount = 0;
      
      dataRows.forEach((row, idx) => {
        const candidateName = row[2] || ''; // Column C (index 2) - Candidate Name
        const status = row[82] || ''; // Column CE (index 82) - Status
        
        // Count as active employee if:
        // 1. Candidate name is not empty
        // 2. Status is NOT "Leaved" (or status column is empty)
        const hasName = candidateName && candidateName.toString().trim() !== '';
        const isActive = !status || status.toString().toLowerCase() !== 'leaved';
        
        if (hasName && isActive) {
          activeEmployeeCount++;
          
          // Log first few active employees
          if (idx < 5) {
            console.log(`Active employee ${idx + 1}: ${candidateName}, Status: ${status}`);
          }
        }
      });

      console.log("Total active employee count:", activeEmployeeCount);
      setEmployeeCount(activeEmployeeCount);

    } catch (error) {
      console.error('Error fetching employee count:', error);
      setEmployeeCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchEmployeeCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchEmployeeCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);


  useEffect(() => {
    const checkLanguageChange = () => {
      const newLang = getCurrentLanguage();
      if (newLang !== currentLang) {
        setCurrentLang(newLang);
      }
    };

    // Regularly check for language changes
    const interval = setInterval(checkLanguageChange, 1000);

    // Also check when page becomes visible again
    document.addEventListener('visibilitychange', checkLanguageChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkLanguageChange);
    };
  }, [currentLang]);
  useEffect(() => {
  const fetchUnprocessedPayrollCount = async () => {
    try {
      // Fetch both Payroll and JOINING data
      const [payrollResponse, joiningResponse] = await Promise.all([
        fetch("https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Payroll&action=fetch"),
        fetch("https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch")
      ]);

      const payrollResult = await payrollResponse.json();
      const joiningResult = await joiningResponse.json();

      const payrollData = payrollResult.data || payrollResult;
      const joiningData = joiningResult.data || joiningResult;

      // Get current month/year
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear().toString();
      const currentMonth = currentDate.toLocaleString('default', { month: 'long' });

      // Get active employees from JOINING sheet (not "Leaved")
      const activeEmployees = [];
      if (Array.isArray(joiningData) && joiningData.length > 6) {
        const joiningRows = joiningData.slice(6);
        joiningRows.forEach(row => {
          const employeeCode = row[26] || ''; // Column AA
          const employeeName = row[2] || ''; // Column C
          const status = row[82] || ''; // Column CE - Status
          
          if (employeeName && employeeCode && status.toLowerCase() !== 'leaved') {
            activeEmployees.push(employeeCode);
          }
        });
      }

      // Get processed employees from Payroll for current month
      const processedEmployees = new Set();
      if (Array.isArray(payrollData) && payrollData.length > 1) {
        const payrollRows = payrollData.slice(1);
        payrollRows.forEach(row => {
          const employeeCode = row[1] || ''; // Column B
          const year = row[15] || ''; // Column P
          const month = row[16] || ''; // Column Q
          
          if (year === currentYear && month === currentMonth && employeeCode) {
            processedEmployees.add(employeeCode);
          }
        });
      }

      // Count active employees NOT in processed list
      let pendingCount = 0;
      activeEmployees.forEach(empCode => {
        if (!processedEmployees.has(empCode)) {
          pendingCount++;
        }
      });

      console.log(`Unprocessed payroll employees for ${currentMonth} ${currentYear}:`, pendingCount);
      setPendingPayrollCount(pendingCount);

    } catch (error) {
      console.error('Error fetching unprocessed payroll count:', error);
      setPendingPayrollCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchUnprocessedPayrollCount();
    const interval = setInterval(fetchUnprocessedPayrollCount, 30000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);
// Add this useEffect for counting ALL deduction records


// Add this useEffect - place it after your other useEffects
useEffect(() => {
  // Save scroll position before navigation
  scrollPositionRef.current = 0;
  isNavigatingRef.current = false;
  
  // Override the default scrollIntoView behavior
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(options) {
    // Prevent auto-scroll during navigation
    if (isNavigatingRef.current) {
      return;
    }
    // For normal cases, use with preventScroll
    if (typeof options === 'object') {
      return originalScrollIntoView.call(this, { 
        ...options, 
        behavior: 'auto',
        block: 'nearest',
        preventScroll: true 
      });
    }
    return originalScrollIntoView.call(this, false);
  };
  
  // Override focus to prevent scroll
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function(options) {
    return originalFocus.call(this, { 
      ...options, 
      preventScroll: true 
    });
  };
  
  return () => {
    // Restore original methods
    Element.prototype.scrollIntoView = originalScrollIntoView;
    HTMLElement.prototype.focus = originalFocus;
  };
}, []);
useEffect(() => {
  const fetchDeductionsCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Deductions&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        console.log("No data found in Deductions sheet");
        setDeductionsCount(0);
        return;
      }

      console.log("Raw deductions data:", rawData.length, "rows total");

      // Count ALL rows EXCEPT the header row (row 1)
      let totalCount = 0;
      
      if (rawData.length > 1) {
        // Start from row 2 (index 1) to skip header
        const dataRows = rawData.slice(1);
        
        // Find column indices from headers
        const headers = rawData[0] || [];
        
        // Find relevant column indices
        const nameIndex = headers.findIndex(header => 
          header?.toString().trim().toLowerCase().includes('name') || 
          header?.toString().trim().toLowerCase().includes('employee name')
        );
        
        const advanceDeductionIndex = headers.findIndex(header => 
          header?.toString().trim().toLowerCase().includes('advance') || 
          header?.toString().trim().toLowerCase().includes('deduction')
        );
        
        console.log("Name column index:", nameIndex);
        console.log("Advance Deduction column index:", advanceDeductionIndex);
        
        // Count rows that have at least employee name OR advance deduction amount
        dataRows.forEach((row, idx) => {
          // Check if employee name exists
          const employeeName = nameIndex >= 0 ? row[nameIndex] : row[1] || '';
          const hasName = employeeName.toString().trim() !== '';
          
          // Check if advance deduction amount exists
          const advanceAmount = advanceDeductionIndex >= 0 ? row[advanceDeductionIndex] : '';
          const hasAdvance = advanceAmount && advanceAmount.toString().trim() !== '';
          
          // Count if either name exists OR advance deduction exists
          if (hasName || hasAdvance) {
            totalCount++;
            
            // Log first few rows for debugging
            if (idx < 3 && hasName) {
              console.log(`Deduction row ${idx + 2}:`, employeeName, "Advance:", advanceAmount);
            }
          }
        });
      }

      console.log("Total deduction records:", totalCount);
      setDeductionsCount(totalCount);

    } catch (error) {
      console.error('Error fetching deductions count:', error);
      setDeductionsCount(0);
    }
  };

  if (user?.Admin === 'Yes') {
    fetchDeductionsCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchDeductionsCount, 60000);
    return () => clearInterval(interval);
  }
}, [user?.Admin]);

// Add this to your existing styles or create a new style tag
// REPLACE the scrollPreventionStyles section with this
// This goes around line 890-950 in your Sidebar.js file

const scrollPreventionStyles = document.createElement('style');
scrollPreventionStyles.innerHTML = `
  /* Prevent all auto-scroll behavior */
  html {
    scroll-behavior: auto !important;
  }
  
  body {
    scroll-behavior: auto !important;
  }
  
  * {
    scroll-behavior: auto !important;
  }
  
  /* Prevent focus from scrolling */
  div:focus, button:focus, a:focus {
    scroll-margin: 0 !important;
    scroll-behavior: auto !important;
  }
  
  /* Prevent browser scroll anchoring */
  * {
    overflow-anchor: none !important;
  }
  
  /* Sidebar specific - prevent scroll on any interaction */
  .scrollbar-hide {
    scroll-behavior: auto !important;
    overflow-anchor: none !important;
  }
  
  .scrollbar-hide * {
    scroll-behavior: auto !important;
  }
  
  /* Custom scrollbar for sidebar */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Prevent touch highlight on mobile */
  button, a, div[role="button"] {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  
  /* Badge styling improvements */
  .sidebar-badge {
    background-color: #ef4444;
    color: white;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 9999px;
    min-width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.25rem;
  }
  
  .sidebar-badge-sm {
    background-color: #ef4444;
    color: white;
    font-size: 0.6rem;
    font-weight: bold;
    border-radius: 9999px;
    width: 1.125rem;
    height: 1.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
  }
  
  .dropdown-item {
    position: relative;
    padding-right: 2.5rem !important;
  }
  
  .dropdown-badge {
    position: absolute;
    right: 1rem;
  }
  
  .collapsed-menu-item {
    position: relative;
  }
  
  /* Prevent layout shift during navigation */
  .sidebar-nav-item {
    will-change: auto;
    transform: translateZ(0);
  }
      html, body, .scrollbar-hide, .scrollbar-hide * {
    scroll-behavior: auto !important;
  }
  
  /* Prevent browser scroll anchoring */
  * {
    overflow-anchor: none !important;
  }
  
  /* Disable browser's scroll restoration */
  body {
    scroll-behavior: auto !important;
  }
  
  /* Prevent any element from being scrolled into view */
  a, button, [role="button"], [tabindex] {
    scroll-margin: 0 !important;
    scroll-padding: 0 !important;
  }
  
  /* Important: Disable React Router scroll restoration */
  [data-router] {
    scroll-behavior: auto !important;
  }
  
  /* Sidebar specific */
  .scrollbar-hide {
    overflow-anchor: none !important;
  }
`;

document.head.appendChild(scrollPreventionStyles);

// ADD THIS CODE at the TOP of Sidebar.js, right after all imports (around line 45)
// This creates a global scroll prevention system

// Global scroll position storage
const sidebarScrollStorage = {
  position: 0,
  isNavigating: false
};

if (typeof window !== 'undefined' && !document.getElementById('scroll-prevention-styles')) {
  scrollPreventionStyles.id = 'scroll-prevention-styles';
  document.head.appendChild(scrollPreventionStyles);
}
// Override scrollIntoView globally to prevent auto-scroll
if (typeof window !== 'undefined') {
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(arg) {
    // Don't scroll during navigation
    if (sidebarScrollStorage.isNavigating) {
      return;
    }
    // Otherwise allow normal behavior
    if (typeof arg === 'object') {
      return originalScrollIntoView.call(this, { 
        ...arg, 
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest'
      });
    }
    return originalScrollIntoView.call(this, false);
  };
  
  // Prevent focus from causing scroll
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function(options) {
    return originalFocus.call(this, { 
      ...options, 
      preventScroll: true 
    });
  };
}

// Add global styles
const globalScrollStyles = document.createElement('style');
globalScrollStyles.id = 'sidebar-scroll-prevention';
globalScrollStyles.innerHTML = `
  /* Disable all scroll behaviors */
  * {
    scroll-behavior: auto !important;
    overflow-anchor: none !important;
  }
  
  /* Prevent focus scroll */
  *:focus {
    scroll-margin: 0 !important;
  }
  
  /* Custom scrollbar styles */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-behavior: auto !important;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Badge styles */
  .sidebar-badge {
    background-color: #ef4444;
    color: white;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 9999px;
    min-width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.25rem;
  }
  
  .sidebar-badge-sm {
    background-color: #ef4444;
    color: white;
    font-size: 0.6rem;
    font-weight: bold;
    border-radius: 9999px;
    width: 1.125rem;
    height: 1.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
  }
  
  .dropdown-item {
    position: relative;
    padding-right: 2.5rem !important;
  }
  
  .dropdown-badge {
    position: absolute;
    right: 1rem;
  }
`;

if (!document.getElementById('sidebar-scroll-prevention')) {
  document.head.appendChild(globalScrollStyles);
}

  useEffect(() => {
    const hideStyles = document.createElement('style');
    hideStyles.innerHTML = `
      /* Hide Google Translate banner/popup completely */
      .goog-te-banner-frame.skiptranslate { 
        display: none !important; 
      }
      
      /* Hide Google Translate popup/notification */
      .goog-te-menu-frame {
        display: none !important;
      }
      
      /* Hide any Google Translate balloons/popups */
      .goog-te-balloon-frame {
        display: none !important;
      }
      
      /* Hide translate suggestion popup */
      .goog-te-ftab {
        display: none !important;
      }
      
      /* Reset body positioning when Google Translate is active */
      body { 
        top: 0 !important; 
        position: static !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      
      /* Hide the translate element */
      #google_translate_element { 
        display: none !important; 
      }
      
      /* Fix for any translate-related positioning issues */
      .skiptranslate {
        display: none !important;
      }
      
      /* Ensure no translate bar appears */
      iframe.goog-te-banner-frame {
        display: none !important;
      }
      
      /* Hide all translate iframes and popups */
      iframe[src*="translate.googleapis.com"] {
        display: none !important;
      }
      
      /* Fix body displacement on mobile */
      @media (max-width: 768px) {
        body {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
      
      /* Additional safety for translate bar and popups */
      .goog-te-banner-frame,
      .goog-te-menu-frame,
      .goog-te-balloon-frame,
      .goog-te-ftab {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
        z-index: -1 !important;
      }
      
       /* Custom scrollbar for sidebar */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Badge styling improvements */
  .sidebar-badge {
    background-color: #ef4444;
    color: white;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 9999px;
    min-width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.25rem;
  }
  
  .sidebar-badge-sm {
    background-color: #ef4444;
    color: white;
    font-size: 0.6rem;
    font-weight: bold;
    border-radius: 9999px;
    width: 1.125rem;
    height: 1.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
  }
  
  /* Ensure dropdown items have space for badges */
  .dropdown-item {
    position: relative;
    padding-right: 2.5rem !important;
  }
  
  .dropdown-badge {
    position: absolute;
    right: 1rem;
  }
  
  /* Fix for collapsed mode */
  .collapsed-menu-item {
    position: relative;
  }
      /* Ensure main content is not displaced */
      #root, .app, main, .main-content {
        position: relative !important;
        top: 0 !important;
        margin-top: 0 !important;
      }
    `;
    document.head.appendChild(hideStyles);

    // Enhanced body positioning fix
    const checkAndFixBody = () => {
      const body = document.body;
       const preventAutoScroll = () => {
    // Prevent any element from auto-scrolling into view
    HTMLElement.prototype.scrollIntoView = function() {
      // Override to do nothing
      return;
    };
    
    // Override focus method to prevent scroll
    const originalFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function(options) {
      if (options && options.preventScroll) {
        return originalFocus.call(this, { preventScroll: true });
      }
      return originalFocus.call(this);
    };
  };

  preventAutoScroll();


      // Reset any inline styles that Google Translate might add
      if (body.style.top && body.style.top !== '0px') {
        body.style.top = '0px';
      }
      if (body.style.position === 'relative' && body.style.top !== '0px') {
        body.style.position = 'static';
        body.style.top = '0px';
      }

      // Remove any margin/padding that might be added
      if (body.style.marginTop && body.style.marginTop !== '0px') {
        body.style.marginTop = '0px';
      }
    };

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );

        setIsTranslateReady(true);

        // Monitor for language changes
        const observer = new MutationObserver(() => {
          const newLang = getCurrentLanguage();
          if (newLang !== currentLang) {
            setCurrentLang(newLang);
          }
          checkAndFixBody();
        });

        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true
        });

        setTimeout(checkAndFixBody, 500);
      }
    };

    if (!document.querySelector('script[src*="translate_a/element.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onload = () => {
        setTimeout(checkAndFixBody, 1000);
      };
      document.body.appendChild(script);
    }

    // Run check immediately and set interval for periodic checks
    checkAndFixBody();
    const bodyFixInterval = setInterval(checkAndFixBody, 1000);

    return () => {
      if (bodyFixInterval) {
        clearInterval(bodyFixInterval);
      }
    };
  }, [currentLang]);

  const clearTranslateCookies = () => {
    // Clear all possible Google Translate cookies
    const cookieNames = ['googtrans', 'googtrans-cache'];
    const hostname = window.location.hostname;
    const domains = [hostname, `.${hostname}`, 'localhost', ''];

    cookieNames.forEach(cookieName => {
      domains.forEach(domain => {
        // Clear for current path
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
        // Clear for root path
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        // Clear without domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      });
    });
  };

  const toggleLanguage = () => {
    const targetLang = currentLang === 'en' ? 'hi' : 'en';

    // Hide the hint when switching to Hindi or when language is toggled
    if (showLanguageHint) {
      setShowLanguageHint(false);
      localStorage.setItem('hasSeenLanguageHint', 'true');
    }

    // Method 1: Try using Google Translate widget directly
    const tryGoogleTranslateWidget = () => {
      try {
        const selectElement = document.querySelector('#google_translate_element select');
        if (selectElement) {
          selectElement.value = targetLang;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      } catch (e) {
        console.log('Widget method failed:', e);
      }
      return false;
    };

    // Method 2: Try doGTranslate function
    const tryDoGTranslate = () => {
      try {
        if (typeof window.doGTranslate === 'function') {
          window.doGTranslate(`en|${targetLang}`);
          return true;
        }
      } catch (e) {
        console.log('doGTranslate method failed:', e);
      }
      return false;
    };

    // Method 3: Set cookie and reload
    const setCookieAndReload = () => {
      clearTranslateCookies();

      const cookieValue = targetLang === 'en' ? '' : `/en/${targetLang}`;
      const hostname = window.location.hostname;
      const domainPart = (hostname === 'localhost' || !hostname) ? '' : `;domain=.${hostname}`;

      if (targetLang !== 'en') {
        // Set multiple cookie variations to ensure persistence
        document.cookie = `googtrans=${cookieValue}${domainPart};path=/;max-age=31536000;SameSite=Lax`;
        document.cookie = `googtrans=${cookieValue};path=/;max-age=31536000;SameSite=Lax`;

        // Also set in localStorage for additional persistence
        localStorage.setItem('selectedLanguage', targetLang);
      } else {
        localStorage.removeItem('selectedLanguage');
      }

      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    // Try methods in sequence
    if (isTranslateReady) {
      if (!tryGoogleTranslateWidget()) {
        if (!tryDoGTranslate()) {
          setCookieAndReload();
        }
      }
    } else {
      setCookieAndReload();
    }

    // Update state immediately for UI feedback
    setCurrentLang(targetLang);

    // Force sidebar to re-render with new language
    setTimeout(() => {
      setCurrentLang(targetLang);
      // Force a state update to trigger re-render
      setIsOpen(prev => !prev);
      setTimeout(() => setIsOpen(prev => !prev), 100);
    }, 300);

    // Fix body positioning after translation
    setTimeout(() => {
      const body = document.body;
      if (body.style.top && body.style.top !== '0px') {
        body.style.top = '0px';
      }
      if (body.style.position === 'relative') {
        body.style.position = 'static';
      }
    }, 500);
  };

 const adminMenuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
{ 
  path: '/indent', 
  icon: FileText, 
  label: 'Indent',
  badge: pendingIndentCount > 0 ? pendingIndentCount : null
},

 { 
    path: '/social-site', 
    icon: User, 
    label: 'Social Site',
    badge: pendingSocialSiteCount > 0 ? pendingSocialSiteCount : null // Add badge here
  },
  
  
{ 
    path: '/find-enquiry', 
    icon: Search, 
    label: 'Find Enquiry',
    badge: pendingFindEnquiryCount > 0 ? pendingFindEnquiryCount : null // Add badge here
  },

 { 
    path: '/call-tracker', 
    icon: Phone, 
    label: 'Call Tracker',
    badge: pendingCallTrackerCount > 0 ? pendingCallTrackerCount : null // Add badge here
  },
  
  { 
    path: '/joining', 
    icon: NotebookPen, 
    label: 'Joining',
    badge: pendingJoiningCount > 0 ? pendingJoiningCount : null // Add this
  },
  
  { 
    path: '/after-joining-work', 
    icon: UserCheck, 
    label: 'After Joining Work',
    badge: pendingAfterJoiningCount > 0 ? pendingAfterJoiningCount : null // Add this
  },
  
 { 
    path: '/leaving', 
    icon: UserX, 
    label: 'Leaving',
    badge: pendingLeavingCount > 0 ? pendingLeavingCount : null // Add this
  },
  
  
  { 
    path: '/reporting-manager', 
    icon: UserMinus, 
    label: 'Leaving Verification',
    badge: pendingReportingManagerCount > 0 ? pendingReportingManagerCount : null
  },
  // { 
  //   path: '/it-department', 
  //   icon: UserMinus, 
  //   label: 'IT Department',
  //   badge: pendingITDepartmentCount > 0 ? pendingITDepartmentCount : null
  // },
  // { 
  //   path: '/admin-department', 
  //   icon: UserMinus, 
  //   label: 'Admin Department',
  //   badge: (() => {
  //     const totalAdminDept = 
  //       (pendingAdminDepartmentCount || 0) + 
  //       (pendingAccountDepartmentCount || 0) + 
  //       (pendingStoreDepartmentCount || 0);
  //     return totalAdminDept > 0 ? totalAdminDept : null;
  //   })()
  // },
  // { 
  //   path: '/hod-verification', 
  //   icon: UserCog, 
  //   label: 'HR Verification',
  //   badge: pendingApprovalCount > 0 ? pendingApprovalCount : null // Add this
  // },

 { 
    path: '/employee', 
    icon: Users, 
    label: 'Employee',
    badge: employeeCount > 0 ? employeeCount : null // Add employee count badge
  },
  
 { 
    path: '/leave-management', 
    icon: BookPlus, 
    label: 'Leave Management',
    badge: pendingLeaveCount > 0 ? pendingLeaveCount : null // Add this
  },
  
  { path: '/attendance',
    icon:  BookPlus,
    label: 'Attendance',
    // badge: attendanceIssuesCount > 0 ? attendanceIssuesCount : null // Add this    
  },
  { 
    path: '/payroll', 
    icon: BadgeDollarSign, 
    label: 'Payroll',
    badge: payrollCount > 0 ? payrollCount : null // Show total count as badge
  },
  {
    path: 'makepayment',
    icon: CreditCard,
    label: 'Leaving Payment',
    badge: pendingPayrollCount > 0 ? pendingPayrollCount : null // Add this
  }
,


{ path: '/misreport', icon: AlarmClockCheck, label: 'MIS Report' },
 { 
    path: '/advance', 
    icon: TrendingUp, 
    label: 'Advance Report',
    badge: advanceReportCount > 0 ? advanceReportCount : null // Add this
  },
  
  { 
    path: '/deductions', 
    icon: Receipt, 
    label: 'Deductions Report',
    badge: deductionsCount > 0 ? deductionsCount : null // Add this
  },
  
 { 
    path: '/employees', 
    icon: FileText, 
    label: 'Sies Employees Report',
    badge: siesEmployeesCount > 0 ? siesEmployeesCount : null // Add this
  },

  { path: '/hr-policy', 
    icon: FileText, 
    label: 'HR Policy' ,
  },

];


  const employeeMenuItems = [
    { path: '/my-profile', icon: ProfileIcon, label: 'My Profile' },
    { path: '/my-attendance', icon: Clock, label: 'My Attendance' },
    { path: '/leave-request', icon: LeaveIcon, label: 'Leave Request' },
    // { path: '/gate-pass-request', icon: DoorOpen, label: 'Gate Pass Request' },
    { path: '/my-salary', icon: DollarSign, label: 'My Salary' },
    { path: '/company-calendar', icon: Calendar, label: 'Company Calendar' },

  ];

  const menuItems = user?.Admin === 'Yes' ? adminMenuItems : employeeMenuItems;

  // REPLACE the entire SidebarContent component (starting around line 680) with this:

// REPLACE the entire SidebarContent component (starting around line 680) with this:

// REPLACE your existing SidebarContent component with this version
// This should go around line 680 in your Sidebar.js file

// COMPLETE REPLACEMENT for the SidebarContent component
// Copy this ENTIRE code block and replace your existing SidebarContent

const SidebarContent = ({ onClose, isCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Function to handle navigation WITHOUT auto-scroll
  const handleNavigation = useCallback((path) => {
    // Set navigating flag
    isNavigatingRef.current = true;
    
    // Navigate
    navigate(path);
    
    // Reset flag after navigation
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
    
    // Close sidebar on mobile/tablet
    if (onClose) {
      setTimeout(() => onClose(), 50);
    }
  }, [navigate, onClose]);
  
  return (
    <div className={`flex flex-col h-full ${isCollapsed ? 'w-16' : 'w-64'} bg-gray-600 text-white`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-indigo-800 flex-shrink-0">
        {!isCollapsed && (
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Users size={24} />
            <span>{currentLang === 'en' ? 'HR FMS' : 'एचआर एफएमएस'}</span>
            
            <div id="google_translate_element" style={{ display: 'none' }} />
            {user?.role === 'employee' && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                {currentLang === 'en' ? 'Employee' : 'कर्मचारी'}
              </span>
            )}
          </h1>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Menu - with scroll prevention */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ 
          scrollBehavior: 'auto',
          overflowAnchor: 'none'
        }}
      >
        <nav className="py-4 px-2 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={`${item.path}-${index}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(item.path);
                }}
                className={`flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors relative cursor-pointer w-full text-left ${
                  isActive
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <div className="flex items-center relative">
                  <item.icon className={isCollapsed ? 'mx-auto' : 'mr-3'} size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                  
                  {isCollapsed && item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                {!isCollapsed && item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white border-opacity-20 flex-shrink-0">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={20} className="text-indigo-600" />
            </div>
            <div className={`${isCollapsed ? 'hidden' : 'block'} md:block`}>
              <p className="text-sm font-medium text-white">{user?.Name || user?.Username || 'Guest'}</p>
              <p className="text-xs text-white">{user?.Admin === 'Yes' ? 'Administrator' : 'Employee'}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
            if (onClose) onClose();
            setIsOpen(false);
          }}
          className="flex items-center py-2.5 px-4 rounded-lg text-white opacity-80 hover:bg-white hover:bg-opacity-10 hover:opacity-100 cursor-pointer transition-colors w-full"
        >
          <LogOutIcon className={isCollapsed ? 'mx-auto' : 'mr-3'} size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};


  return (
    <>
      {/* Mobile menu button - visible only on mobile */}
      <button
        className={`md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-900 text-white rounded-md shadow-md transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        onClick={() => setIsOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Tablet menu button - visible on tablet (hidden on mobile and desktop) */}
      <button
        className={`hidden md:block lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-900 text-white rounded-md shadow-md transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        onClick={() => setIsOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Desktop Sidebar - full width on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-full">
        <SidebarContent />
      </div>

      {/* Tablet Sidebar - collapsible */}
      <div className={`hidden md:block lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
        <div className={`fixed left-0 top-0 h-full z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <SidebarContent onClose={() => setIsOpen(false)} />
        </div>
      </div>

      {/* Mobile Sidebar - collapsible */}
      <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
        <div className={`fixed left-0 top-0 h-full z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <SidebarContent onClose={() => setIsOpen(false)} />
        </div>
      </div>

      {/* Add padding to main content when sidebar is open on desktop */}
      <div className="pt-16 md:pt-16 lg:pt-0 lg:pl-64"></div>
    </>
  );
};

export default Sidebar;
