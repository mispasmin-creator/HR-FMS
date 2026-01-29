import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  X,
  Filter,
  FileText,
  Package,
  Laptop,
  User,
  FileCheck,
  Building,
  Store,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAfterLeavingProcessData,
  updateAfterLeavingStage,
  fetchAfterLeavingMasterData,
  fetchIndentMasterData,
} from "../../services/afterLeavingService";
import {
  generateNextIndentNumber,
  createIndent,
} from "../../services/indentService";
const LeavingProcessTracker = () => {
  const [indentMasterData, setIndentMasterData] = useState({
    posts: [],
    companies: [],
    departments: [],
  });
  const [activeTab, setActiveTab] = useState("pending");
  const [activeStageTab, setActiveStageTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // State for all stage data
  const [approvalData, setApprovalData] = useState({
    pending: [],
    history: [],
  });
  const [reportingData, setReportingData] = useState({
    pending: [],
    history: [],
  });
  const [itData, setItData] = useState({ pending: [], history: [] });
  const [adminData, setAdminData] = useState({ pending: [], history: [] });
  const [accountData, setAccountData] = useState({ pending: [], history: [] });
  const [storeData, setStoreData] = useState({ pending: [], history: [] });

  // Form data states for each stage
  const [approvalForm, setApprovalForm] = useState({ status: "", remarks: "" });
  const [reportingForm, setReportingForm] = useState({
    reportingManagerCheck: false,
    remarks: "",
    processType: "",
    temporaryBackupName: "",
    indentPost: "",
    indentCompany: "",
    indentGender: "",
    indentDepartment: "",
    indentPrefer: "",
    indentExperience: "",
    indentNumberOfPost: "",
    indentCompetitionDate: "",
    indentSocialSite: "",
    indentSocialSiteTypes: [],
  });
  const [itForm, setItForm] = useState({
    laptop: false,
    mobile: false,
    idCard: false,
    accessCard: false,
    emailAccess: false,
    systemAccess: false,
  });
  const [adminForm, setAdminForm] = useState({
    idCard: false,
    visitingCard: false,
  });
  const [accountForm, setAccountForm] = useState({
    financialDocuments: false,
    advance: false,
    pending: false,
  });
  const [storeForm, setStoreForm] = useState({
    storeAssets: false,
  });

  const [departments, setDepartments] = useState([]);
  const [socialSiteOptions, setSocialSiteOptions] = useState([]);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
    fetchDepartments();
    fetchSocialSiteOptions();
    fetchIndentMasterData2();
  }, []);

  const fetchIndentMasterData2 = async () => {
    try {
      const result = await fetchIndentMasterData();
      if (result.success) {
        setIndentMasterData({
          posts: result.designations,
          companies: result.companies,
          departments: result.designations,
        });
      }
    } catch (error) {
      console.error("Error fetching indent master data:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const result = await fetchAfterLeavingProcessData();

      if (!result.success) {
        throw new Error(result.error);
      }

      const processedData = result.data;

      // Filter data for each stage
      // 1. Approval System
      const approvalPending = processedData.filter(
        (task) => task.approvalPlanned && !task.approvalActual,
      );
      const approvalHistory = processedData.filter(
        (task) => task.approvalPlanned && task.approvalActual,
      );
      setApprovalData({ pending: approvalPending, history: approvalHistory });

      // 2. Reporting Manager
      const reportingPending = processedData.filter(
        (task) => task.reportingManagerPlanned && !task.reportingManagerActual,
      );
      const reportingHistory = processedData.filter(
        (task) => task.reportingManagerPlanned && task.reportingManagerActual,
      );
      setReportingData({
        pending: reportingPending,
        history: reportingHistory,
      });

      // 3. IT Department
      const itPending = processedData.filter(
        (task) => task.itDeptPlanned && !task.itDeptActual,
      );
      const itHistory = processedData.filter(
        (task) => task.itDeptPlanned && task.itDeptActual,
      );
      setItData({ pending: itPending, history: itHistory });

      // 4. Admin Department
      const adminPending = processedData.filter(
        (task) => task.adminDeptPlanned && !task.adminDeptActual,
      );
      const adminHistory = processedData.filter(
        (task) => task.adminDeptPlanned && task.adminDeptActual,
      );
      setAdminData({ pending: adminPending, history: adminHistory });

      // 5. Account Department
      const accountPending = processedData.filter(
        (task) => task.accountDeptPlanned && !task.accountDeptActual,
      );
      const accountHistory = processedData.filter(
        (task) => task.accountDeptPlanned && task.accountDeptActual,
      );
      setAccountData({ pending: accountPending, history: accountHistory });

      // 6. Store Department
      const storePending = processedData.filter(
        (task) => task.storeDeptPlanned && !task.storeDeptActual,
      );
      const storeHistory = processedData.filter(
        (task) => task.storeDeptPlanned && task.storeDeptActual,
      );
      setStoreData({ pending: storePending, history: storeHistory });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const result = await fetchAfterLeavingMasterData();
      if (result.success) {
        setDepartments(result.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchSocialSiteOptions = async () => {
    try {
      const result = await fetchAfterLeavingMasterData();
      if (result.success && result.socialSites.length > 0) {
        setSocialSiteOptions(result.socialSites);
      } else {
        setSocialSiteOptions([
          "Indeed.com",
          "Naukri.com",
          "LinkedIn",
          "Referral",
          "Job Consultancy",
          "TimesJobs",
          "Internshala",
          "Apna",
          "WorkIndia",
          "Other",
        ]);
      }
    } catch (error) {
      console.error("Error fetching social site options:", error);
      setSocialSiteOptions([
        "Indeed.com",
        "Naukri.com",
        "LinkedIn",
        "Referral",
        "Job Consultancy",
        "TimesJobs",
        "Internshala",
        "Apna",
        "WorkIndia",
        "Other",
      ]);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (
      !dateString ||
      (typeof dateString === "string" && dateString.trim() === "")
    ) {
      return "-";
    }

    try {
      // Check if already in dd/mm/yyyy format
      if (typeof dateString === "string" && dateString.includes("/")) {
        const parts = dateString.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12) {
            return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
          }
        }
      }

      // Try parsing as ISO date (YYYY-MM-DD or ISO 8601)
      let date;
      if (typeof dateString === "string") {
        // Handle YYYY-MM-DD format
        if (dateString.includes("-") && !dateString.includes("T")) {
          const [year, month, day] = dateString.split("-");
          date = new Date(year, parseInt(month) - 1, day);
        } else {
          // Handle ISO 8601 format with T
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return "-";
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "-";
    }
  };

  // Get data based on active stage tab
  const getCurrentData = () => {
    switch (activeStageTab) {
      case "approval":
        return activeTab === "pending"
          ? approvalData.pending.map((item) => ({ ...item, stage: "approval" }))
          : approvalData.history.map((item) => ({
              ...item,
              stage: "approval",
            }));
      case "reporting":
        return activeTab === "pending"
          ? reportingData.pending.map((item) => ({
              ...item,
              stage: "reporting",
            }))
          : reportingData.history.map((item) => ({
              ...item,
              stage: "reporting",
            }));
      case "it":
        return activeTab === "pending"
          ? itData.pending.map((item) => ({ ...item, stage: "it" }))
          : itData.history.map((item) => ({ ...item, stage: "it" }));
      case "admin":
        return activeTab === "pending"
          ? adminData.pending.map((item) => ({ ...item, stage: "admin" }))
          : adminData.history.map((item) => ({ ...item, stage: "admin" }));
      case "account":
        return activeTab === "pending"
          ? accountData.pending.map((item) => ({ ...item, stage: "account" }))
          : accountData.history.map((item) => ({ ...item, stage: "account" }));
      case "store":
        return activeTab === "pending"
          ? storeData.pending.map((item) => ({ ...item, stage: "store" }))
          : storeData.history.map((item) => ({ ...item, stage: "store" }));
      case "all":
        // Combine all pending or history data WITH stage information
        if (activeTab === "pending") {
          return [
            ...approvalData.pending.map((item) => ({
              ...item,
              stage: "approval",
            })),
            ...reportingData.pending.map((item) => ({
              ...item,
              stage: "reporting",
            })),
            ...itData.pending.map((item) => ({ ...item, stage: "it" })),
            ...adminData.pending.map((item) => ({ ...item, stage: "admin" })),
            ...accountData.pending.map((item) => ({
              ...item,
              stage: "account",
            })),
            ...storeData.pending.map((item) => ({ ...item, stage: "store" })),
          ];
        } else {
          return [
            ...approvalData.history.map((item) => ({
              ...item,
              stage: "approval",
            })),
            ...reportingData.history.map((item) => ({
              ...item,
              stage: "reporting",
            })),
            ...itData.history.map((item) => ({ ...item, stage: "it" })),
            ...adminData.history.map((item) => ({ ...item, stage: "admin" })),
            ...accountData.history.map((item) => ({
              ...item,
              stage: "account",
            })),
            ...storeData.history.map((item) => ({ ...item, stage: "store" })),
          ];
        }
      default:
        return [];
    }
  };

  // Filter data by search term
  const getFilteredData = () => {
    const currentData = getCurrentData();
    return currentData.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reportingOfficer?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getStageBadgeColor = (stage) => {
    switch (stage) {
      case "approval":
        return "bg-blue-100 text-blue-800";
      case "reporting":
        return "bg-indigo-100 text-indigo-800";
      case "it":
        return "bg-green-100 text-green-800";
      case "admin":
        return "bg-orange-100 text-orange-800";
      case "account":
        return "bg-blue-100 text-blue-800";
      case "store":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case "approval":
        return <FileCheck size={14} className="mr-1" />;
      case "reporting":
        return <User size={14} className="mr-1" />;
      case "it":
        return <Laptop size={14} className="mr-1" />;
      case "admin":
        return <Building size={14} className="mr-1" />;
      case "account":
        return <Briefcase size={14} className="mr-1" />;
      case "store":
        return <Store size={14} className="mr-1" />;
      default:
        return <Filter size={14} className="mr-1" />;
    }
  };

  const getStageTitle = (stage) => {
    switch (stage) {
      case "approval":
        return "Approval System";
      case "reporting":
        return "Reporting Manager";
      case "it":
        return "IT Department";
      case "admin":
        return "Admin Department";
      case "account":
        return "Account Department";
      case "store":
        return "Store Department";
      default:
        return "All Stages";
    }
  };

  // Handle process click for any stage
  const handleProcessClick = (item, stage) => {
    // Reset all forms
    const itemStage = item.stage || stage;

    setApprovalForm({ status: "", remarks: "" });
    setReportingForm({
      reportingManagerCheck: false,
      remarks: "",
      processType: "",
      temporaryBackupName: "",
      indentPost: "",
      indentCompany: "",
      indentGender: "",
      indentDepartment: "",
      indentPrefer: "",
      indentExperience: "",
      indentNumberOfPost: "",
      indentCompetitionDate: "",
      indentSocialSite: "",
      indentSocialSiteTypes: [],
    });
    setItForm({
      laptop: false,
      mobile: false,
      idCard: false,
      accessCard: false,
      emailAccess: false,
      systemAccess: false,
    });
    setAdminForm({
      idCard: false,
      visitingCard: false,
    });
    setAccountForm({
      financialDocuments: false,
      advance: false,
      pending: false,
    });
    setStoreForm({
      storeAssets: false,
    });

    setSelectedItem({ ...item, stage: itemStage });
    setShowModal(true);
  };

  // Form handlers for each stage
  const handleApprovalInputChange = (e) => {
    const { name, value } = e.target;
    setApprovalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportingInputChange = (e) => {
    const { name, value } = e.target;
    setReportingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportingCheckboxChange = (name) => {
    setReportingForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleReportingSocialSiteChange = (e) => {
    const { value, checked } = e.target;
    setReportingForm((prev) => {
      if (checked) {
        return {
          ...prev,
          indentSocialSiteTypes: [...prev.indentSocialSiteTypes, value],
        };
      } else {
        return {
          ...prev,
          indentSocialSiteTypes: prev.indentSocialSiteTypes.filter(
            (type) => type !== value,
          ),
        };
      }
    });
  };

  const handleITCheckboxChange = (name) => {
    setItForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAdminCheckboxChange = (name) => {
    setAdminForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAccountCheckboxChange = (name) => {
    setAccountForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleStoreCheckboxChange = (name) => {
    setStoreForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Submit handler for all stages
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedItem || !selectedItem.employeeCode) {
      toast.error("No employee selected");
      setSubmitting(false);
      return;
    }

    try {
      const updateData = {};
      const now = new Date().toISOString();

      // Handle each stage differently
      switch (selectedItem.stage) {
        case "approval":
          if (!approvalForm.status) {
            toast.error("Please select Approved or Rejected");
            setSubmitting(false);
            return;
          }
          updateData.actual_after_leaving_approval_date = now;
          updateData.after_leaving_approval_status = approvalForm.status;
          updateData.after_leaving_approval_remarks = approvalForm.remarks;
          break;

        case "reporting":
          if (!reportingForm.processType) {
            toast.error("Please select Process Type");
            setSubmitting(false);
            return;
          }

          if (reportingForm.processType === "indent") {
            if (
              !reportingForm.indentPost ||
              !reportingForm.indentCompany ||
              !reportingForm.indentGender ||
              !reportingForm.indentNumberOfPost ||
              !reportingForm.indentCompetitionDate
            ) {
              toast.error("Please fill all required indent fields");
              setSubmitting(false);
              return;
            }
          } else if (reportingForm.processType === "temporary-backup") {
            if (!reportingForm.temporaryBackupName) {
              toast.error("Please enter temporary backup name");
              setSubmitting(false);
              return;
            }
          }

          updateData.reporting_manager_approval_status =
            reportingForm.reportingManagerCheck ? "Yes" : "No";
          updateData.actual_reporting_manager_approval_date = now;
          updateData.reporting_manager_remarks = reportingForm.remarks || "";
          updateData.reporting_manager_process_type = reportingForm.processType;

          if (reportingForm.processType === "indent") {
            const indentNumber = await generateNextIndentNumber();

            const indentData = {
              enquiry_needed: 1,
              indent_number: indentNumber,
              company: reportingForm.indentCompany,
              post: reportingForm.indentPost,
              gender: reportingForm.indentGender,
              prefer: reportingForm.indentPrefer,
              no_of_post: reportingForm.indentNumberOfPost,
              completion_date: reportingForm.indentCompetitionDate,
              department: reportingForm.indentDepartment,
              experience:
                reportingForm.indentPrefer === "Experience"
                  ? reportingForm.indentExperience
                  : "",
              status: "Draft",
              social_site_post: reportingForm.indentSocialSite,
              which:
                reportingForm.indentSocialSiteTypes.length > 0
                  ? reportingForm.indentSocialSiteTypes.join(", ")
                  : "",
            };
            // Use createIndent from indentService so indents are created consistently
            console.log("Creating indent with data:", indentData);
            const indentResult = await createIndent(indentData);
            if (!indentResult.success) {
              throw new Error("Failed to create indent: " + indentResult.error);
            }

            const createdIndent = indentResult.data || {};
          } else if (reportingForm.processType === "temporary-backup") {
            updateData.reporting_manager_temp_backup_name =
              reportingForm.temporaryBackupName || "";
          }
          break;

        case "it":
          const checkedItems = [];
          if (itForm.laptop) checkedItems.push("Laptop");
          if (itForm.mobile) checkedItems.push("Mobile");
          if (itForm.idCard) checkedItems.push("ID Card");
          if (itForm.accessCard) checkedItems.push("Access Card");
          if (itForm.emailAccess) checkedItems.push("Email Access");
          if (itForm.systemAccess) checkedItems.push("System Access");

          updateData.it_clearance_summary =
            checkedItems.length > 0 ? checkedItems.join(", ") : "";
          updateData.actual_it_clearance_date = now;
          break;

        case "admin":
          const adminCheckedItems = [];
          if (adminForm.idCard) adminCheckedItems.push("ID Card");
          if (adminForm.visitingCard) adminCheckedItems.push("Visiting Card");

          updateData.admin_clearance_summary = adminCheckedItems.join(", ");
          updateData.actual_admin_clearance_date = now;
          break;

        case "account":
          const accountCheckedItems = [];
          if (accountForm.financialDocuments)
            accountCheckedItems.push("Financial Documents");
          if (accountForm.advance) accountCheckedItems.push("Advance");
          if (accountForm.pending) accountCheckedItems.push("Pending");

          updateData.account_clearance_summary = accountCheckedItems.join(", ");
          updateData.actual_account_clearance_date = now;
          break;

        case "store":
          updateData.store_clearance_summary = storeForm.storeAssets 
            ? "Store Assets Handed Over" 
            : "No Assets Handed Over";
          updateData.actual_store_clearance_date = now;
          break;
      }

      const result = await updateAfterLeavingStage(
        selectedItem.id,
        selectedItem.stage,
        updateData,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // If a stage is completed, we might want to plan the next stage
      // Sequential flow: Approval -> Reporting -> IT -> Admin -> Account -> Store
      let nextStageData = {};
      const nextPlannedDate = new Date().toISOString();

      switch (selectedItem.stage) {
        case "approval":
          if (approvalForm.status === "Approved") {
            nextStageData.planned_reporting_manager_approval_date =
              nextPlannedDate;
          }
          break;
        case "reporting":
          nextStageData.planned_it_clearance_date = nextPlannedDate;
          break;
        case "it":
          nextStageData.planned_admin_clearance_date = nextPlannedDate;
          break;
        case "admin":
          nextStageData.planned_account_clearance_date = nextPlannedDate;
          break;
        case "account":
          nextStageData.planned_store_clearance_date = nextPlannedDate;
          break;
      }

      if (Object.keys(nextStageData).length > 0) {
        await updateAfterLeavingStage(
          selectedItem.id,
          "next_stage_planning",
          nextStageData,
        );
      }

      toast.success(
        `${getStageTitle(selectedItem.stage)} process completed successfully!`,
      );
      setShowModal(false);
      fetchAllData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employee Leaving Process Tracker</h1>
        <button
          onClick={fetchAllData}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stage Tabs */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "all"
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveStageTab("all")}
          >
            <Filter size={14} className="mr-2" />
            All Stages (
            {activeTab === "pending"
              ? approvalData.pending.length +
                reportingData.pending.length +
                itData.pending.length +
                adminData.pending.length +
                accountData.pending.length +
                storeData.pending.length
              : approvalData.history.length +
                reportingData.history.length +
                itData.history.length +
                adminData.history.length +
                accountData.history.length +
                storeData.history.length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "approval"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
            onClick={() => setActiveStageTab("approval")}
          >
            <FileCheck size={14} className="mr-2" />
            Approval (
            {activeTab === "pending"
              ? approvalData.pending.length
              : approvalData.history.length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "reporting"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            }`}
            onClick={() => setActiveStageTab("reporting")}
          >
            <User size={14} className="mr-2" />
            Reporting (
            {activeTab === "pending"
              ? reportingData.pending.length
              : reportingData.history.length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "it"
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            onClick={() => setActiveStageTab("it")}
          >
            <Laptop size={14} className="mr-2" />
            IT (
            {activeTab === "pending"
              ? itData.pending.length
              : itData.history.length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "admin"
                ? "bg-orange-600 text-white"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
            onClick={() => setActiveStageTab("admin")}
          >
            <Building size={14} className="mr-2" />
            Admin (
            {activeTab === "pending"
              ? adminData.pending.length
              : adminData.history.length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "account"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
            onClick={() => setActiveStageTab("account")}
          >
            <Briefcase size={14} className="mr-2" />
            Account (
            {activeTab === "pending"
              ? accountData.pending.length
              : accountData.history.length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              activeStageTab === "store"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
            onClick={() => setActiveStageTab("store")}
          >
            <Store size={14} className="mr-2" />
            Store (
            {activeTab === "pending"
              ? storeData.pending.length
              : storeData.history.length}
            )
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, employee code, or reporting officer..."
              className="w-full py-2 pl-10 pr-4 text-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2"
            />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="border-b border-gray-300">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending (
              {activeStageTab === "all"
                ? approvalData.pending.length +
                  reportingData.pending.length +
                  itData.pending.length +
                  adminData.pending.length +
                  accountData.pending.length +
                  storeData.pending.length
                : filteredData.length}
              )
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("history")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History (
              {activeStageTab === "all"
                ? approvalData.history.length +
                  reportingData.history.length +
                  itData.history.length +
                  adminData.history.length +
                  accountData.history.length +
                  storeData.history.length
                : filteredData.length}
              )
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    {activeStageTab === "all" && (
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Stage
                      </th>
                    )}
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Employee Code
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Father Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Date Of Joining
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Leaving Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Department
                    </th>
                    {activeStageTab === "reporting" && (
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Reporting Officer
                      </th>
                    )}
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td
                        colSpan={activeStageTab === "all" ? 11 : 10}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 mb-2 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">
                            Loading pending requests...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={activeStageTab === "all" ? 11 : 10}
                        className="px-6 py-12 text-center"
                      >
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchAllData}
                          className="px-4 py-2 mt-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item, index) => {
                      // Determine stage for each item when showing all
                      const stage = item.stage || activeStageTab;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleProcessClick(item, stage)}
                              className={`px-3 py-1 text-white rounded-md text-sm hover:opacity-90 ${
                                stage === "approval"
                                  ? "bg-blue-600"
                                  : stage === "reporting"
                                    ? "bg-indigo-600"
                                    : stage === "it"
                                      ? "bg-green-600"
                                      : stage === "admin"
                                        ? "bg-orange-600"
                                        : stage === "account"
                                          ? "bg-blue-600"
                                          : "bg-purple-600"
                              }`}
                            >
                              Process
                            </button>
                          </td>
                          {activeStageTab === "all" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(stage)}`}
                              >
                                {getStageIcon(stage)}
                                {getStageTitle(stage)}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.employeeCode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.serialNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.fatherName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateForDisplay(item.dateOfJoining)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateForDisplay(item.LeavingDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.designation}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.department}
                          </td>
                          {activeStageTab === "reporting" && (
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {item.reportingOfficer}
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {stage === "approval"
                              ? formatDateForDisplay(item.approvalPlanned)
                              : stage === "reporting"
                                ? formatDateForDisplay(
                                    item.reportingManagerPlanned,
                                  )
                                : stage === "it"
                                  ? formatDateForDisplay(item.itDeptPlanned)
                                  : stage === "admin"
                                    ? formatDateForDisplay(
                                        item.adminDeptPlanned,
                                      )
                                    : stage === "account"
                                      ? formatDateForDisplay(
                                          item.accountDeptPlanned,
                                        )
                                      : stage === "store"
                                        ? formatDateForDisplay(
                                            item.storeDeptPlanned,
                                          )
                                        : "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={activeStageTab === "all" ? 11 : 10}
                        className="px-6 py-12 text-center"
                      >
                        <p className="text-gray-500">
                          No pending requests found.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    {activeStageTab === "all" && (
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Stage
                      </th>
                    )}
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Employee Code
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Date Of Joining
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Leaving Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status/Summary
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td
                        colSpan={activeStageTab === "all" ? 9 : 8}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 mb-2 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">
                            Loading history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={activeStageTab === "all" ? 9 : 8}
                        className="px-6 py-12 text-center"
                      >
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchAllData}
                          className="px-4 py-2 mt-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item, index) => {
                      // Determine stage for each item when showing all
                      const stage = item.stage || activeStageTab;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          {activeStageTab === "all" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(stage)}`}
                              >
                                {getStageIcon(stage)}
                                {getStageTitle(stage)}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.employeeCode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.serialNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateForDisplay(item.dateOfJoining)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateForDisplay(item.LeavingDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.designation}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {item.department}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {stage === "approval" ? (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.approvalStatus === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.approvalStatus || "-"}
                              </span>
                            ) : stage === "reporting" ? (
                              item.reportingManagerStatus || "-"
                            ) : stage === "it" ? (
                              item.itDeptSummary || "-"
                            ) : stage === "admin" ? (
                              item.adminDeptSummary || "-"
                            ) : stage === "account" ? (
                              item.accountDeptSummary || "-"
                            ) : stage === "store" ? (
                              item.storeDeptSummary || "-"
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={activeStageTab === "all" ? 9 : 8}
                        className="px-6 py-12 text-center"
                      >
                        <p className="text-gray-500">No history found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Dynamic based on selected stage */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-700">
                {getStageTitle(selectedItem.stage)} Process
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={selectedItem.employeeCode}
                    disabled
                    className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-500 rounded-md"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={selectedItem.serialNumber}
                    disabled
                    className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-500 rounded-md"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    disabled
                    className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-500 rounded-md"
                  />
                </div>

                {selectedItem.stage === "reporting" && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Reporting Officer
                    </label>
                    <input
                      type="text"
                      value={selectedItem.reportingOfficer}
                      disabled
                      className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-500 rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Form based on selected stage */}
              {selectedItem.stage === "approval" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={approvalForm.status}
                      onChange={handleApprovalInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={approvalForm.remarks}
                      onChange={handleApprovalInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any remarks..."
                    />
                  </div>
                </>
              )}

              {selectedItem.stage === "reporting" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={reportingForm.remarks}
                      onChange={handleReportingInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter remarks..."
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Process Type *
                    </label>
                    <select
                      name="processType"
                      value={reportingForm.processType}
                      onChange={handleReportingInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Process Type</option>
                      <option value="indent">Indent</option>
                      <option value="temporary-backup">Temporary Backup</option>
                    </select>
                  </div>

                  {reportingForm.processType === "temporary-backup" && (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                      <h4 className="mb-3 font-medium text-gray-700 text-md">
                        Temporary Backup Details
                      </h4>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Backup Name *
                        </label>
                        <input
                          type="text"
                          name="temporaryBackupName"
                          value={reportingForm.temporaryBackupName}
                          onChange={handleReportingInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter backup person name"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {reportingForm.processType === "indent" && (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                      <h4 className="mb-3 font-medium text-gray-700 text-md">
                        Create New Indent
                      </h4>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Post *
                          </label>
                          <select
                            name="indentPost"
                            value={reportingForm.indentPost}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a post</option>
                            {indentMasterData.posts.map((post) => (
                              <option key={post} value={post}>
                                {post}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {reportingForm.indentPost === "Other" && (
                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                              Custom Post *
                            </label>
                            <input
                              type="text"
                              name="indentCustomPost"
                              value={reportingForm.indentCustomPost || ""}
                              onChange={handleReportingInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter custom post title"
                              required={reportingForm.indentPost === "Other"}
                            />
                          </div>
                        )}

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Company *
                          </label>
                          <select
                            name="indentCompany"
                            value={reportingForm.indentCompany}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a company</option>
                            {indentMasterData.companies.map((company) => (
                              <option key={company} value={company}>
                                {company}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Gender *
                          </label>
                          <select
                            name="indentGender"
                            value={reportingForm.indentGender}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Any">Any</option>
                          </select>
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Department
                          </label>
                          <select
                            name="indentDepartment"
                            value={reportingForm.indentDepartment}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Department</option>
                            <option value="Production">Production</option>
                            <option value="Management">Management</option>
                            <option value="Sales">Sales</option>
                            <option value="HR">HR</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Purchase">Purchase</option>
                            <option value="Store">Store</option>
                            <option value="Housekeeping">Housekeeping</option>
                            <option value="Technical">Technical</option>
                            <option value="Finance">Finance</option>
                          </select>
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Prefer
                          </label>
                          <select
                            name="indentPrefer"
                            value={reportingForm.indentPrefer}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Any</option>
                            <option value="Experience">Experience</option>
                            <option value="Fresher">Fresher</option>
                          </select>
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Number Of Post *
                          </label>
                          <input
                            type="number"
                            name="indentNumberOfPost"
                            value={reportingForm.indentNumberOfPost}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter number of posts"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      {reportingForm.indentPrefer === "Experience" && (
                        <div className="mt-3">
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Experience *
                          </label>
                          <input
                            type="text"
                            name="indentExperience"
                            value={reportingForm.indentExperience}
                            onChange={handleReportingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter experience details"
                            required
                          />
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Competition Date *
                        </label>
                        <input
                          type="date"
                          name="indentCompetitionDate"
                          value={reportingForm.indentCompetitionDate}
                          onChange={handleReportingInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Social Site
                        </label>
                        <select
                          name="indentSocialSite"
                          value={reportingForm.indentSocialSite}
                          onChange={handleReportingInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {reportingForm.indentSocialSite === "Yes" &&
                        socialSiteOptions.length > 0 && (
                          <div className="mt-3">
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                              Social Site Types
                            </label>
                            <div className="p-3 space-y-2 overflow-y-auto border border-gray-300 rounded-md max-h-40">
                              {socialSiteOptions.map((option, index) => (
                                <div key={index} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`socialSite-${index}`}
                                    value={option}
                                    checked={reportingForm.indentSocialSiteTypes.includes(
                                      option,
                                    )}
                                    onChange={handleReportingSocialSiteChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`socialSite-${index}`}
                                    className="block ml-2 text-sm text-gray-700"
                                  >
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <div className="pt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reportingManagerCheck"
                        checked={reportingForm.reportingManagerCheck}
                        onChange={() =>
                          handleReportingCheckboxChange("reportingManagerCheck")
                        }
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label
                        htmlFor="reportingManagerCheck"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Reporting Manager Process Complete
                      </label>
                    </div>
                  </div>
                </>
              )}

              {selectedItem.stage === "it" && (
                <div className="pt-4">
                  <h4 className="mb-3 font-medium text-gray-700 text-md">
                    Hand Over of Assign Assets
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "laptop", label: "Laptop" },
                      { key: "mobile", label: "Mobile Phone" },
                      { key: "idCard", label: "ID Card" },
                      { key: "accessCard", label: "Access Card" },
                      { key: "emailAccess", label: "Email Access" },
                      { key: "systemAccess", label: "System Access" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={itForm[item.key]}
                          onChange={() => handleITCheckboxChange(item.key)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label
                          htmlFor={item.key}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.stage === "admin" && (
                <div>
                  <h4 className="mb-3 font-medium text-gray-700 text-md">
                    Hand Over of Assign Assets
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: "idCard", label: "ID Card" },
                      { key: "visitingCard", label: "Visiting Card" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={adminForm[item.key]}
                          onChange={() => handleAdminCheckboxChange(item.key)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label
                          htmlFor={item.key}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.stage === "account" && (
                <>
                  <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-800">
                        Pending Advance Amount:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₹0 {/* You can fetch actual advance amount here */}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium text-gray-700 text-md">
                      Clear of Financial Documents
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          key: "financialDocuments",
                          label: "Financial Documents",
                        },
                        { key: "advance", label: "Advance" },
                        { key: "pending", label: "Pending" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={item.key}
                            checked={accountForm[item.key]}
                            onChange={() =>
                              handleAccountCheckboxChange(item.key)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={item.key}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedItem.stage === "store" && (
                <>
                  {selectedItem.assignAssets && (
                    <div className="p-4 border border-blue-200 rounded-md bg-blue-50">
                      <div className="flex items-center">
                        <span className="mr-2 text-sm font-medium text-blue-800">
                          Assigned Assets:
                        </span>
                        <span className="text-sm text-blue-700">
                          {selectedItem.assignAssets}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-3 font-medium text-gray-700 text-md">
                      Hand over of Assign Assets Store
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="storeAssets"
                          checked={storeForm.storeAssets}
                          onChange={() =>
                            handleStoreCheckboxChange("storeAssets")
                          }
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label
                          htmlFor="storeAssets"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Store Assets
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="sticky bottom-0 flex justify-end px-6 py-4 pt-4 mt-6 -mx-6 space-x-2 bg-white border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-md hover:opacity-90 min-h-[42px] flex items-center justify-center ${
                    submitting ? "opacity-90 cursor-not-allowed" : ""
                  } ${
                    selectedItem.stage === "approval"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : selectedItem.stage === "reporting"
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : selectedItem.stage === "it"
                          ? "bg-green-600 hover:bg-green-700"
                          : selectedItem.stage === "admin"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : selectedItem.stage === "account"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-white animate-spin"
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

export default LeavingProcessTracker;
