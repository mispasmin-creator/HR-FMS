import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  UserMinus,
  Building,
  Shield,
  DollarSign,
  Briefcase,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const Dashboard = () => {
  const [totalEmployee, setTotalEmployee] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(0);
  const [leftEmployee, setLeftEmployee] = useState(0);
  const [leaveThisMonth, setLeaveThisMonth] = useState(0);
  const [monthlyHiringData, setMonthlyHiringData] = useState([]);
  const [designationData, setDesignationData] = useState([]);
  const [leaveStatusData, setLeaveStatusData] = useState([]);
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  // Add this near other state variables at the top
  const [siesEmployeeCount, setSiesEmployeeCount] = useState(0);
  const [femaleRatio, setFemaleRatio] = useState(0);
  
  // New states for pending counts
  const [pendingJoiningCount, setPendingJoiningCount] = useState(0);
  const [pendingAfterJoiningCount, setPendingAfterJoiningCount] = useState(0);
  const [pendingLeavingCount, setPendingLeavingCount] = useState(0);
  const [pendingHRApprovalCount, setPendingHRApprovalCount] = useState(0);
  const [pendingAccountCount, setPendingAccountCount] = useState(0);
  const [pendingITCount, setPendingITCount] = useState(0);
  const [pendingReportingManagerCount, setPendingReportingManagerCount] = useState(0);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingPayrollCount, setPendingPayrollCount] = useState(0);
  
  // New states for charts
  const [attendanceTrendData, setAttendanceTrendData] = useState([]);
  const [genderDistributionData, setGenderDistributionData] = useState([]);
  const [monthlyTurnoverData, setMonthlyTurnoverData] = useState([]);
  const [employeeGrowthData, setEmployeeGrowthData] = useState([]);
  
  // Stats
  const [averageTenure, setAverageTenure] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [turnoverRate, setTurnoverRate] = useState(0);

  // Parse DD/MM/YYYY format date
  const parseSheetDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, day);
  };

  // Fetch pending counts
  const fetchPendingCounts = async () => {
    try {
      // Fetch all pending counts in parallel
      const [
        joiningRes, afterJoiningRes, leavingRes, 
        hrApprovalRes, accountRes, itRes, 
        reportingRes, adminRes, leaveRes, payrollRes
      ] = await Promise.all([
        fetchPendingJoiningCount(),
        fetchPendingAfterJoiningCount(),
        fetchPendingLeavingCount(),
        fetchPendingHRApprovalCount(),
        fetchPendingAccountCount(),
        fetchPendingITCount(),
        fetchPendingReportingManagerCount(),
        fetchPendingAdminCount(),
        fetchPendingLeaveCount(),
        fetchPendingPayrollCount()
      ]);

      setPendingJoiningCount(joiningRes);
      setPendingAfterJoiningCount(afterJoiningRes);
      setPendingLeavingCount(leavingRes);
      setPendingHRApprovalCount(hrApprovalRes);
      setPendingAccountCount(accountRes);
      setPendingITCount(itRes);
      setPendingReportingManagerCount(reportingRes);
      setPendingAdminCount(adminRes);
      setPendingLeaveCount(leaveRes);
      setPendingPayrollCount(payrollRes);
    } catch (error) {
      console.error("Error fetching pending counts:", error);
    }
  };

  // Individual pending count fetch functions - MATCHING SIDEBAR LOGIC

  // Fetch SIES employees count - MATCHING SIDEBAR LOGIC
  const fetchSiesEmployeesCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=SIES EMPLOYEES&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        console.log("No data found in SIES EMPLOYEES sheet");
        return 0;
      }

      console.log("Raw SIES employees data:", rawData.length, "rows total");

      let activeCount = 0;
      
      if (rawData.length > 1) {
        // Start from row 2 (index 1) to skip header
        const dataRows = rawData.slice(1);
        const headers = rawData[0] || [];
        
        // Find column indices
        const nameIndex = headers.findIndex(header => 
          header?.toString().trim().toLowerCase().includes('name') ||
          header?.toString().trim().toLowerCase().includes('employee')
        );
        
        const statusIndex = headers.findIndex(header => 
          header?.toString().trim().toLowerCase().includes('status')
        );
        
        console.log("Name column index:", nameIndex);
        console.log("Status column index:", statusIndex);
        
        // Count rows that have employee name AND status is Active (not Inactive/Deleted)
        dataRows.forEach((row, idx) => {
          // Get employee name
          const employeeName = nameIndex >= 0 ? row[nameIndex] : row[1] || '';
          const hasName = employeeName.toString().trim() !== '';
          
          // Get status
          const status = statusIndex >= 0 ? row[statusIndex] : '';
          const statusStr = status.toString().trim().toLowerCase();
          
          // Count as active if has name AND status is not "inactive" or "deleted"
          const isActive = hasName && 
                         statusStr !== 'inactive' && 
                         statusStr !== 'deleted' &&
                         statusStr !== 'relieved';
          
          if (isActive) {
            activeCount++;
          }
        });
      }

      console.log("Total active SIES employees:", activeCount);
      return activeCount;

    } catch (error) {
      console.error('Error fetching SIES employees count:', error);
      return 0;
    }
  };

  // Fetch Active Employees from JOINING sheet - MATCHING SIDEBAR LOGIC
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
        return 0;
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
        }
      });

      console.log("Total active employee count:", activeEmployeeCount);
      return activeEmployeeCount;

    } catch (error) {
      console.error('Error fetching employee count:', error);
      return 0;
    }
  };

  // Fetch pending joining count - MATCHING SIDEBAR LOGIC
  const fetchPendingJoiningCount = async () => {
    try {
      // Fetch data from both ENQUIRY and Follow-Up sheets
      const [enquiryResponse, followUpResponse] = await Promise.all([
        fetch("https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=ENQUIRY&action=fetch"),
        fetch("https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Follow - Up&action=fetch")
      ]);

      const [enquiryResult, followUpResult] = await Promise.all([
        enquiryResponse.json(),
        followUpResponse.json()
      ]);

      if (enquiryResult.success && enquiryResult.data && enquiryResult.data.length >= 7) {
        // Process enquiry data headers
        const enquiryHeaders = enquiryResult.data[5].map((h) => h.trim());
        const enquiryDataFromRow7 = enquiryResult.data.slice(6);
        
        const getIndex = (headerName) =>
          enquiryHeaders.findIndex((h) => h === headerName);
        
        // Get indices for required columns
        const plannedDateIndex = 27; // Column AB (0-indexed)
        const actualJoiningDateIndex = 28; // Column AC (0-indexed)
        const candidateEnquiryNoIndex = getIndex("Candidate Enquiry Number");
        
        if (candidateEnquiryNoIndex === -1) {
          console.error("Candidate Enquiry Number column not found");
          return 0;
        }
        
        // Process follow-up data to get items with "Joining" status
        let joiningEnquiryNumbers = [];
        
        if (followUpResult.success && followUpResult.data) {
          const rawFollowUpData = followUpResult.data || followUpResult;
          const followUpRows = Array.isArray(rawFollowUpData[0])
            ? rawFollowUpData.slice(1)
            : rawFollowUpData;
          
          // Get enquiry numbers with "Joining" status
          followUpRows.forEach((row) => {
            const enquiryNo = row[2] || ""; // Column C (index 2) - Enquiry No
            const status = row[3] || "";    // Column D (index 3) - Status
            if (enquiryNo && status === 'Joining') {
              joiningEnquiryNumbers.push(enquiryNo);
            }
          });
        }
        
        // Count pending items
        let pendingCount = 0;
        
        enquiryDataFromRow7.forEach((row) => {
          const enquiryNo = row[candidateEnquiryNoIndex];
          const plannedDate = row[plannedDateIndex];
          const actualJoiningDate = row[actualJoiningDateIndex];
          
          // Check conditions:
          // 1. Has "Joining" status in follow-up
          // 2. Has planned date
          // 3. Does NOT have actual joining date
          if (joiningEnquiryNumbers.includes(enquiryNo) &&
              plannedDate && plannedDate.toString().trim() !== "" &&
              (!actualJoiningDate || actualJoiningDate.toString().trim() === "")) {
            pendingCount++;
          }
        });
        
        return pendingCount;
      }
    } catch (error) {
      console.error('Error fetching pending joining count:', error);
    }
    return 0;
  };

  // Fetch pending after joining count - MATCHING SIDEBAR LOGIC
  const fetchPendingAfterJoiningCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const rawData = result.data || result;
        const processedData = rawData.slice(6).map((row) => ({
          plannedDate: row[23] || "",
          actual: row[24] || ""
        }));

        const pendingTasks = processedData.filter(
          (task) => task.plannedDate && 
          task.plannedDate.trim() !== "" && 
          (!task.actual || task.actual.trim() === "")
        );

        return pendingTasks.length;
      }
    } catch (error) {
      console.error("Error fetching pending after joining count:", error);
    }
    return 0;
  };

  // Fetch pending leaving count - MATCHING SIDEBAR LOGIC
  const fetchPendingLeavingCount = async () => {
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
        return 0;
      }

      console.log("Raw data for pending leaving count:", rawData.length, "rows");

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      let pendingCount = 0;
      
      dataRows.forEach((row, idx) => {
        // Column indices (0-based):
        // Column AZ = index 51
        // Column BA = index 52
        const columnAZ = row[51]; // Column AZ
        const columnBA = row[52]; // Column BA
        
        // Condition: Column AZ has value AND Column BA is empty
        if (columnAZ && columnAZ.toString().trim() !== "" && 
            (!columnBA || columnBA.toString().trim() === "")) {
          pendingCount++;
        }
      });

      console.log("Total pending leaving count:", pendingCount);
      return pendingCount;

    } catch (error) {
      console.error('Error fetching pending leaving count:', error);
      return 0;
    }
  };

  // Fetch pending HR approval count - MATCHING SIDEBAR LOGIC
  const fetchPendingHRApprovalCount = async () => {
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
        return 0;
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
        
        // Condition: Column BG has value AND Column BH is empty
        if (columnBG && columnBG.toString().trim() !== "" && 
            (!columnBH || columnBH.toString().trim() === "")) {
          pendingCount++;
        }
      });

      console.log("Total pending approval count:", pendingCount);
      return pendingCount;

    } catch (error) {
      console.error('Error fetching pending approval count:', error);
      return 0;
    }
  };

  // Fetch pending Account count - MATCHING SIDEBAR LOGIC
  const fetchPendingAccountCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );
      const result = await response.json();
      const rawData = result.data || result;

      if (Array.isArray(rawData) && rawData.length >= 7) {
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        let pendingCount = 0;
        
        dataRows.forEach((row) => {
          const columnBW = row[74];
          const columnBX = row[75];
          
          if (columnBW && columnBW.toString().trim() !== "" && 
              (!columnBX || columnBX.toString().trim() === "")) {
            pendingCount++;
          }
        });

        return pendingCount;
      }
    } catch (error) {
      console.error('Error fetching pending account count:', error);
    }
    return 0;
  };

  // Fetch pending IT count - MATCHING SIDEBAR LOGIC
  const fetchPendingITCount = async () => {
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
        return 0;
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
        
        // Condition: Column BO has value AND Column BP is empty
        if (columnBO && columnBO.toString().trim() !== "" && 
            (!columnBP || columnBP.toString().trim() === "")) {
          pendingCount++;
        }
      });

      console.log("Total pending IT department count:", pendingCount);
      return pendingCount;

    } catch (error) {
      console.error('Error fetching pending IT department count:', error);
      return 0;
    }
  };

  // Fetch pending Reporting Manager count - MATCHING SIDEBAR LOGIC
  const fetchPendingReportingManagerCount = async () => {
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
        return 0;
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
        
        // Condition: Column BK has value AND Column BL is empty
        if (columnBK && columnBK.toString().trim() !== "" && 
            (!columnBL || columnBL.toString().trim() === "")) {
          pendingCount++;
        }
      });

      console.log("Total pending reporting manager count:", pendingCount);
      return pendingCount;

    } catch (error) {
      console.error('Error fetching pending reporting manager count:', error);
      return 0;
    }
  };

  // Fetch pending Admin count - MATCHING SIDEBAR LOGIC
  const fetchPendingAdminCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );
      const result = await response.json();
      const rawData = result.data || result;

      if (Array.isArray(rawData) && rawData.length >= 7) {
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        let pendingCount = 0;
        
        dataRows.forEach((row) => {
          const columnBS = row[70];
          const columnBT = row[71];
          const columnCA = row[78];
          const columnCB = row[79];
          
          const hasAdminPending = columnBS && columnBS.toString().trim() !== "" && 
                                (!columnBT || columnBT.toString().trim() === "");
          const hasStorePending = columnCA && columnCA.toString().trim() !== "" && 
                                (!columnCB || columnCB.toString().trim() === "");
          
          if (hasAdminPending || hasStorePending) {
            pendingCount++;
          }
        });

        return pendingCount;
      }
    } catch (error) {
      console.error('Error fetching pending admin count:', error);
    }
    return 0;
  };

  // Fetch pending Leave count - MATCHING SIDEBAR LOGIC
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
        return 0;
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
        
        // Condition: Status is "Pending" (case-insensitive) AND employee name is not empty
        if (status.toString().toLowerCase() === 'pending' && 
            employeeName && employeeName.toString().trim() !== '') {
          pendingCount++;
        }
      });

      console.log("Total pending leave count:", pendingCount);
      return pendingCount;

    } catch (error) {
      console.error('Error fetching pending leave count:', error);
      return 0;
    }
  };

  // Fetch pending Payroll count - MATCHING SIDEBAR LOGIC
  const fetchPendingPayrollCount = async () => {
    try {
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
      return pendingCount;

    } catch (error) {
      console.error('Error fetching unprocessed payroll count:', error);
      return 0;
    }
  };

  // Fetch attendance trend data
  const fetchAttendanceTrendData = async () => {
    // Simulated data - replace with actual API call
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map(month => ({
      month,
      present: Math.floor(Math.random() * 80) + 20,
      absent: Math.floor(Math.random() * 20) + 5,
      late: Math.floor(Math.random() * 15) + 3
    }));
    setAttendanceTrendData(data);
  };

  // Fetch gender distribution from JOINING sheet Gender column (K) - MATCHING SIDEBAR LOGIC
  const fetchGenderDistribution = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );
      const result = await response.json();
      const rawData = result.data || result;

      if (Array.isArray(rawData) && rawData.length > 6) {
        const dataRows = rawData.slice(6);
        let maleCount = 0;
        let femaleCount = 0;
        let totalCount = 0;
        
        dataRows.forEach(row => {
          const gender = row[10] || ''; // Column K (0-based index: 10 = K)
          const genderStr = gender.toString().toLowerCase().trim();
          
          if (genderStr) {
            totalCount++;
            if (genderStr.includes('male') && !genderStr.includes('female')) {
              maleCount++;
            } else if (genderStr.includes('female')) {
              femaleCount++;
            }
            // If gender is "transgender", "other", or not specified, it's not counted in male/female
          }
        });

        // Calculate female ratio (percentage of total)
        const calculatedFemaleRatio = totalCount > 0 ? 
          ((femaleCount / totalCount) * 100).toFixed(1) : 0;
        
        setFemaleRatio(parseFloat(calculatedFemaleRatio));

        // Update the gender distribution chart data
        setGenderDistributionData([
          { name: 'Male', value: maleCount, color: '#3B82F6' },
          { name: 'Female', value: femaleCount, color: '#EC4899' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching gender distribution:', error);
      setFemaleRatio(0);
    }
  };

  // Fetch Leave Management Data
  const fetchLeaveManagementAnalytics = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Leave%20Management&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data from Leave Management sheet');
      }

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      const headers = rawData[0];
      const dataRows = rawData.slice(1);

      const statusIndex = headers.findIndex(h => h && h.toString().trim().toLowerCase().includes("status"));
      const leaveTypeIndex = headers.findIndex(h => h && h.toString().trim().toLowerCase().includes("leave type"));
      
      const statusCounts = {};
      const typeCounts = {};

      dataRows.forEach(row => {
        const status = row[statusIndex]?.toString().trim() || 'Unknown';
        if (statusCounts[status]) {
          statusCounts[status] += 1;
        } else {
          statusCounts[status] = 1;
        }

        const leaveType = row[leaveTypeIndex]?.toString().trim() || 'Unknown';
        if (typeCounts[leaveType]) {
          typeCounts[leaveType] += 1;
        } else {
          typeCounts[leaveType] = 1;
        }
      });

      const statusArray = Object.keys(statusCounts).map(key => ({
        status: key,
        count: statusCounts[key]
      }));

      const typeArray = Object.keys(typeCounts).map(key => ({
        type: key,
        count: typeCounts[key]
      }));

      setLeaveStatusData(statusArray);
      setLeaveTypeData(typeArray);

    } catch (error) {
      console.error("Error fetching leave management analytics:", error);
      setLeaveStatusData([]);
      setLeaveTypeData([]);
    }
  };

  // Fetch total employees from LEAVING sheet - MATCHING YOUR REQUIREMENT
  const fetchTotalEmployeesFromLeaving = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=LEAVING&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data from LEAVING sheet');
      }

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      const headers = rawData[5];
      const dataRows = rawData.slice(6);

      // Count all rows in LEAVING sheet (from row 7 onwards)
      return dataRows.length;

    } catch (error) {
      console.error("Error fetching total from leaving count:", error);
      return 0;
    }
  };

  const fetchDepartmentData = async () => {
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

      const headers = rawData[5];
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

      const departmentIndex = 20;
      const departmentCounts = {};

      dataRows.forEach(row => {
        let department = row[departmentIndex]?.toString().trim();
        
        if (department) {
          if (department.toLowerCase().includes('maintenace')) {
            department = 'Maintenance';
          } else if (department.toLowerCase().includes('prosuction')) {
            department = 'Production';
          } else if (department.toLowerCase().includes('transport account')) {
            department = 'Transport Accounts';
          }
          
          if (departmentCounts[department]) {
            departmentCounts[department] += 1;
          } else {
            departmentCounts[department] = 1;
          }
        }
      });

      const departmentArray = Object.keys(departmentCounts).map(key => ({
        department: key,
        employees: departmentCounts[key]
      }));

      return departmentArray;

    } catch (error) {
      console.error("Error fetching department data:", error);
      return [];
    }
  };

  // Fetch employees who left this month from LEAVING sheet
  const fetchEmployeesLeftThisMonth = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=LEAVING&action=fetch'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data from LEAVING sheet');
      }

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error('Expected array data not received');
      }

      const dataRows = rawData.slice(6);

      let thisMonthCount = 0;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (dataRows.length > 0) {
        thisMonthCount = dataRows.filter(row => {
          const dateStr = row[3];
          if (dateStr) {
            const parsedDate = parseSheetDate(dateStr);
            return (
              parsedDate &&
              parsedDate.getMonth() === currentMonth &&
              parsedDate.getFullYear() === currentYear
            );
          }
          return false;
        }).length;
      }

      return thisMonthCount;

    } catch (error) {
      console.error("Error fetching employees left this month:", error);
      return 0;
    }
  };

  const prepareMonthlyHiringData = (hiringData, leavingData) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const result = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      const monthYear = `${months[monthIndex]} ${currentDate.getFullYear()}`;
      
      result.push({
        month: months[monthIndex],
        hired: hiringData[monthYear]?.hired || 0,
        left: leavingData[monthYear]?.left || 0
      });
    }
    
    return result;
  };

  // Calculate additional stats
  const calculateStats = () => {
    // Total employees includes LEAVING + SIES
    const totalEmployees = totalEmployee;
    
    // Calculate turnover rate based on employees who left vs total
    const calculatedTurnoverRate = totalEmployees > 0 ? 
      ((leftEmployee / totalEmployees) * 100).toFixed(1) : 0;
      
    const calculatedAttendanceRate = 95.5; // Simulated - replace with actual calculation
    const calculatedAverageTenure = 2.3; // Simulated - replace with actual calculation
    
    setTurnoverRate(calculatedTurnoverRate);
    setAttendanceRate(calculatedAttendanceRate);
    setAverageTenure(calculatedAverageTenure);
  };

  // MAIN DATA FETCHING - MATCHING YOUR REQUIREMENTS
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [
          leavingTotal, 
          siesCount, 
          activeCount, 
          leftThisMonth,
          departmentResult,
          genderResult
        ] = await Promise.all([
          fetchTotalEmployeesFromLeaving(), // Total from LEAVING sheet
          fetchSiesEmployeesCount(), // Active SIES count
          fetchEmployeeCount(), // Active employees from JOINING sheet
          fetchEmployeesLeftThisMonth(), // Employees left this month from LEAVING
          fetchDepartmentData(),
          // fetchLeaveManagementAnalytics() - removed as not needed in parallel
        ]);

        // Set the counts as per your requirements:
        // 1. Total Employees = LEAVING sheet total + SIES employees count
        setTotalEmployee(leavingTotal + siesCount);
        
        // 2. Active Employees = from JOINING sheet (matching sidebar logic)
        setActiveEmployee(activeCount);
        
        // 3. SIES Employees count
        setSiesEmployeeCount(siesCount);
        
        // 4. Left Employee (on resigned) = Total from LEAVING sheet
        setLeftEmployee(leavingTotal);
        
        // 5. Left This Month = from LEAVING sheet
        setLeaveThisMonth(leftThisMonth);
        
        // 6. Department data
        setDepartmentData(departmentResult);

        // Fetch other data
        await Promise.all([
          fetchPendingCounts(),
          fetchAttendanceTrendData(),
          fetchGenderDistribution(), // This will set femaleRatio
          fetchLeaveManagementAnalytics()
        ]);
        
        calculateStats();
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Color palette
  const getStatusColor = (status) => {
    const colors = {
      'approved': '#10B981',
      'pending': '#F59E0B',
      'rejected': '#EF4444',
      'cancelled': '#6B7280'
    };
    return colors[status.toLowerCase()] || '#3B82F6';
  };

  const getTypeColor = (index) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return colors[index % colors.length];
  };

  // Pending cards configuration
  const pendingCards = [
    {
      title: 'Joining Pending',
      count: pendingJoiningCount,
      icon: UserPlus,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      path: '/joining'
    },
    {
      title: 'After Joining Pending',
      count: pendingAfterJoiningCount,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      path: '/after-joining-work'
    },
    {
      title: 'Leaving Pending',
      count: pendingLeavingCount,
      icon: UserX,
      color: 'bg-red-500',
      textColor: 'text-red-500',
      path: '/leaving'
    },
    {
      title: 'HR Approvals Pending',
      count: pendingHRApprovalCount,
      icon: Shield,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      path: '/hod-verification'
    },
    {
      title: 'Accounts Pending',
      count: pendingAccountCount,
      icon: DollarSign,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      path: '/admin-department'
    },
    {
      title: 'IT Department Pending',
      count: pendingITCount,
      icon: Building,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500',
      path: '/it-department'
    },
    {
      title: 'Reporting Manager Pending',
      count: pendingReportingManagerCount,
      icon: UserMinus,
      color: 'bg-pink-500',
      textColor: 'text-pink-500',
      path: '/reporting-manager'
    },
    {
      title: 'Admin Pending',
      count: pendingAdminCount,
      icon: Briefcase,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      path: '/admin-department'
    },
    {
      title: 'Leave Requests Pending',
      count: pendingLeaveCount,
      icon: Calendar,
      color: 'bg-teal-500',
      textColor: 'text-teal-500',
      path: '/leave-management'
    },
    {
      title: 'Payroll Pending',
      count: pendingPayrollCount,
      icon: FileText,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-500',
      path: '/payroll'
    }
  ];

  return (
    <div className="space-y-6 page-content p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">HR Dashboard Overview</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity size={16} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Employees</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalEmployee}</h3>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                    <span>LEAVING Sheet:</span>
                  </span>
                  <span className="font-medium">{totalEmployee - siesEmployeeCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                    <span>SIES Active:</span>
                  </span>
                  <span className="font-medium text-purple-600">{siesEmployeeCount}</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Employees</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{activeEmployee}</h3>
              <p className="text-xs text-gray-500 mt-1">
                From JOINING sheet (Status ≠ "Leaved")
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <UserCheck size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-lg border border-amber-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">On Resigned</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{leftEmployee}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Total from LEAVING sheet
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-100">
              <Clock size={24} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white rounded-xl shadow-lg border border-red-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Left This Month</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{leaveThisMonth}</h3>
              <p className="text-xs text-gray-500 mt-1">
                From LEAVING sheet current month
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <UserX size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks Section */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <AlertCircle size={20} className="mr-2 text-amber-500" />
            Pending Tasks Overview
          </h2>
          <div className="text-sm text-gray-500">
            Total Pending: {pendingCards.reduce((sum, card) => sum + card.count, 0)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {pendingCards.map((card, index) => (
            <div 
              key={index}
              className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all duration-200 border border-gray-200 cursor-pointer hover:shadow-md"
              onClick={() => window.location.href = card.path}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                  <card.icon size={18} className={card.textColor} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.color} bg-opacity-20 ${card.textColor}`}>
                  {card.count}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Users size={20} className="mr-2" />
            Gender Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} employees`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Female Ratio: <span className="font-bold text-pink-600">{femaleRatio}%</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              From JOINING sheet Gender column (K)
            </p>
          </div>
        </div>

        {/* Department-wise Employee Count */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Building size={20} className="mr-2" />
            Department-wise Employee Count
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="department" stroke="#374151" angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#374151" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                />
                <Bar dataKey="employees" name="Employees">
                  {departmentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 3 === 0 ? '#EF4444' : index % 3 === 1 ? '#10B981' : '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <FileText size={20} className="mr-2" />
            Leave Status Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIES vs Regular Employees */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Shield size={20} className="mr-2" />
            SIES vs Regular Employees
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: 'Regular Employees', 
                      value: totalEmployee - siesEmployeeCount, 
                      color: '#3B82F6' 
                    },
                    { 
                      name: 'SIES Employees', 
                      value: siesEmployeeCount, 
                      color: '#8B5CF6' 
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Regular Employees', value: totalEmployee - siesEmployeeCount, color: '#3B82F6' },
                    { name: 'SIES Employees', value: siesEmployeeCount, color: '#8B5CF6' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} employees`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              SIES Employees: <span className="font-bold text-purple-600">{siesEmployeeCount}</span> 
              {' '}({totalEmployee > 0 ? ((siesEmployeeCount / totalEmployee) * 100).toFixed(1) : 0}% of total)
            </p>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Activity size={20} className="mr-2" />
            Attendance Trend
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" stroke="#374151" />
                <YAxis stroke="#374151" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Key HR Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <h3 className="text-2xl font-bold text-gray-800">{attendanceRate}%</h3>
              </div>
              <div className="p-2 rounded-full bg-blue-100">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Avg Employee Tenure</p>
                <h3 className="text-2xl font-bold text-gray-800">{averageTenure} years</h3>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <Clock size={20} className="text-green-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Turnover Rate</p>
                <h3 className="text-2xl font-bold text-gray-800">{turnoverRate}%</h3>
              </div>
              <div className="p-2 rounded-full bg-red-100">
                <TrendingUp size={20} className="text-red-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">SIES Employees</p>
                <h3 className="text-2xl font-bold text-gray-800">{siesEmployeeCount}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {totalEmployee > 0 ? 
                    `${((siesEmployeeCount / totalEmployee) * 100).toFixed(1)}% of total` 
                    : '0% of total'
                  }
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-100">
                <Shield size={20} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Designation-wise Employee Count */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Top Designations</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {designationData.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-green-500' : 'bg-purple-500'}`} />
                  <span className="text-sm font-medium text-gray-700">{item.designation}</span>
                </div>
                <span className="text-lg font-bold text-gray-800">{item.employees}</span>
              </div>
            ))}
          </div>
          {designationData.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {designationData.length} designations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Designation-wise Employee Count Full Chart */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <UserPlus size={20} className="mr-2" />
          Designation-wise Employee Count
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={designationData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="designation" stroke="#374151" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#374151" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Bar dataKey="employees" name="Employees">
                {designationData.slice(0, 10).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 3 === 0 ? '#EF4444' : index % 3 === 1 ? '#10B981' : '#3B82F6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;