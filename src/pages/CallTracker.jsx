import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  X,
  PauseCircle,
  RefreshCw,
  Calendar,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  fetchCallTrackerHistory,
  createCallTrackerEntry,
  updateEnquiryOnJoining,
  fetchPendingEnquiries,
} from "../services/callTrackerService";

import { fetchAllIndents } from "../services/indentService";

const CallTracker = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [formData, setFormData] = useState({
    candidateSays: "",
    status: "",
    nextDate: "",
  });

  const [enquiryData, setEnquiryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  const latestStatusMap = React.useMemo(() => {
    const map = {};
    historyData.forEach((entry) => {
      const key = entry.enquiryNo;
      if (
        !map[key] ||
        new Date(entry.timestamp) > new Date(map[key].timestamp)
      ) {
        map[key] = entry;
      }
    });
    return map;
  }, [historyData]);

  const latestHistoryData = Object.values(latestStatusMap);

  // Add export functionality
  const exportToExcel = () => {
    try {
      let dataToExport = [];
      let filename = "";

      // Determine which data to export based on active tab
      switch (activeTab) {
        case "pending":
          dataToExport = pendingData.filter((item) => {
            const matchesSearch =
              item.candidateName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              item.candidateEnquiryNo
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
            return matchesSearch;
          });
          filename = "Pending_Calls_Data";
          break;
        case "followup":
          dataToExport = historyData
            .filter((item) => item.status === "Follow-up")
            .filter((item) => {
              const matchesSearch =
                item.enquiryNo
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                item.candidateSays
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase());
              return matchesSearch;
            });
          filename = "FollowUp_Calls_Data";
          break;
        case "interview":
          dataToExport = historyData
            .filter((item) => item.status === "Interview")
            .filter((item) => {
              const matchesSearch =
                item.enquiryNo
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                item.candidateSays
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase());
              return matchesSearch;
            });
          filename = "Interview_Calls_Data";
          break;
        case "onhold":
          dataToExport = historyData
            .filter((item) => item.status === "On Hold")
            .filter((item) => {
              const matchesSearch =
                item.enquiryNo
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                item.candidateSays
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase());
              return matchesSearch;
            });
          filename = "OnHold_Calls_Data";
          break;
        case "history":
          dataToExport = historyData
            .filter(
              (item) =>
                item.status === "Joining" ||
                item.status === "Reject" ||
                item.status === "Negotiation",
            )
            .filter((item) => {
              const matchesSearch =
                item.enquiryNo
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                item.candidateSays
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase());
              return matchesSearch;
            });
          filename = "History_Calls_Data";
          break;
        default:
          dataToExport = [];
          filename = "CallTracker_Data";
      }

      if (dataToExport.length === 0) {
        toast.error(`No data to export in ${activeTab} tab`);
        return;
      }

      // Prepare data for Excel based on active tab
      let excelData = [];

      if (activeTab === "pending") {
        excelData = dataToExport.map((item, index) => ({
          "S.No": index + 1,
          "Indent No.": item.indentNo || "",
          "Candidate Enquiry No.": item.candidateEnquiryNo || "",
          "Applying For Post": item.applyingForPost || "",
          Department: item.department || "",
          "Candidate Name": item.candidateName || "",
          Phone: item.candidatePhone || "",
          Email: item.candidateEmail || "",
          "Planned Date": formatDateForExport(item.plannedDate) || "",
          "Previous Company": item.previousCompany || "",
          "Job Experience": item.jobExperience || "",
          "Last Salary": item.lastSalary || "",
          "Previous Position": item.previousPosition || "",
          "Reason for Leaving": item.reasonForLeaving || "",
          "Marital Status": item.maritalStatus || "",
          "Last Employer Mobile": item.lastEmployerMobile || "",
          "Reference By": item.referenceBy || "",
          "Present Address": item.presentAddress || "",
          "Aadhar No": item.aadharNo || "",
          Photo: item.candidatePhoto || "",
          Resume: item.candidateResume || "",
        }));
      } else {
        // For other tabs (followup, interview, onhold, history)
        excelData = dataToExport.map((item, index) => ({
          "S.No": index + 1,
          "Indent No": item.indentNo || "",
          "Enquiry No": item.enquiryNo || "",
          Status: item.status || "",
          Details: item.candidateSays || "",
          "Next Date": formatDateForExport(item.nextDate) || "",
          Timestamp: item.timestamp || "",
        }));
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CallTracker Data");

      // Auto-size columns
      const maxWidth = excelData.reduce(
        (w, r) => Math.max(w, Object.keys(r).length),
        10,
      );
      worksheet["!cols"] = Array.from({ length: maxWidth }, () => ({
        width: 20,
      }));

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:]/g, "-");
      const finalFilename = `${filename}_${timestamp}.xlsx`;

      // Export to Excel
      XLSX.writeFile(workbook, finalFilename);

      toast.success(
        `Exported ${dataToExport.length} ${activeTab} records to Excel`,
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  // Helper function for date formatting in export
  const formatDateForExport = (dateString) => {
    if (!dateString || dateString.trim() === "") return "";

    try {
      if (dateString.includes("/")) {
        return dateString;
      }

      const date = new Date(dateString);
      if (date && !isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      // Fetch enquiries, call tracker history, and indents in parallel
      const [enquiryResult, historyResult, indentResult] = await Promise.all([
        fetchPendingEnquiries(),

        fetchCallTrackerHistory(),
        fetchAllIndents(),
      ]);

      // Process indents to create department lookup map
      let indentDepartmentMap = {};
      if (indentResult.success && indentResult.data) {
        indentResult.data.forEach((indent) => {
          if (indent.indent_number) {
            indentDepartmentMap[indent.indent_number] = indent.department || "";
          }
        });
      }

      // Process enquiry data for pending calls
      if (enquiryResult.success && enquiryResult.data) {
        const processedEnquiryData = enquiryResult.data
          .filter((enquiry) => {
            // Filter enquiries where planned_date exists but actual_date is null
            return enquiry.planned && enquiry.actual == null;
          })
          .map((enquiry) => {
            const indentNo = enquiry.indent_number;
            const departmentFromIndent =
              indentDepartmentMap[indentNo] || enquiry.department || "";

            return {
              id: enquiry.id || enquiry.timestamp,
              indentNo: indentNo,
              candidateEnquiryNo: enquiry.candidate_enquiry_number,
              applyingForPost: enquiry.applying_for_post || "",
              department: departmentFromIndent,
              plannedDate: enquiry.planned || "",
              candidateName: enquiry.candidate_name || "",
              candidateDOB: enquiry.candidate_dob || "",
              candidatePhone: enquiry.candidate_phone || "",
              candidateEmail: enquiry.candidate_email || "",
              previousCompany: enquiry.previous_company || "",
              jobExperience: enquiry.job_experience || "",
              lastSalary: enquiry.last_salary || "",
              previousPosition: enquiry.previous_position || "",
              reasonForLeaving: enquiry.reason_for_leaving || "",
              maritalStatus: enquiry.marital_status || "",
              lastEmployerMobile: enquiry.last_employer_mobile || "",
              candidatePhoto: enquiry.candidate_photo || "",
              candidateResume: enquiry.candidate_resume || "",
              referenceBy: enquiry.reference_by || "",
              presentAddress: enquiry.present_address || "",
              aadharNo: enquiry.aadhar_no || "",
              designation: enquiry.applying_for_post || "",
            };
          });

        setEnquiryData(processedEnquiryData);

        // Process follow-up data from call tracker history
        if (historyResult.success && historyResult.data) {
          const processedFollowUpData = historyResult.data.map((entry) => ({
            enquiryNo: entry.candidate_enquiry_number || "",
            status: entry.status || "",
          }));
          setFollowUpData(processedFollowUpData);

          // Process history data
          const processedHistoryData = historyResult.data.map((entry) => {
            // Format timestamp for display
            let formattedTimestamp = "";
            if (entry.created_at) {
              const date = new Date(entry.created_at);
              const day = String(date.getDate()).padStart(2, "0");
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              const seconds = String(date.getSeconds()).padStart(2, "0");
              formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            }

            // Format next_date for display
            let formattedNextDate = "";
            if (entry.next_date) {
              formattedNextDate = formatDateForDisplay(entry.next_date);
            }

            return {
              timestamp: formattedTimestamp || entry.timestamp || "",
              indentNo: entry.indent_number || "",
              enquiryNo: entry.candidate_enquiry_number || "",
              status: entry.status || "",
              candidateSays: entry.candidate_says || entry.details || "",
              nextDate: formattedNextDate || "",
            };
          });
          setHistoryData(processedHistoryData);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  }, []);

  useEffect(() => {
    fetchPendingEnquiries();
    fetchAllData();
  }, [fetchAllData]);

  const pendingData = enquiryData;

  // Helper function to format DD/MM/YYYY dates
  const formatDateForDisplay = (dateString) => {
    if (!dateString || dateString.trim() === "") return "-";

    try {
      if (typeof dateString === "string" && dateString.includes("/")) {
        const parts = dateString.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12) {
            return dateString;
          }
        }
      }

      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return dateString;
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString || "-";
    }
  };

  const handleCallClick = (item) => {
    setSelectedItem(item);
    setFormData({
      candidateSays: "",
      status: "",
      nextDate: "",
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    let date;

    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        if (parseInt(parts[0]) > 12) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.candidateSays || !formData.status) {
      toast.error("Please fill all required fields");
      setSubmitting(false);
      return;
    }
    if ((formData.status === "Follow-up" ||  formData.status === "Interview" || formData.status === "Negotiation" ||  formData.status === "On Hold") && !formData.nextDate) {
      toast.error("Select the Date");
      setSubmitting(false);
      return;
    }

    try {
      const now = new Date();
      const formattedTimestamp = now.toISOString();

      // Format next date if provided
      let formattedNextDate = null;
      if (formData.nextDate) {
        formattedNextDate = new Date(formData.nextDate).toISOString();
      }

      // Prepare call tracker entry data
      const callTrackerData = {
        timestamp: formattedTimestamp,
        indent_number: selectedItem.indentNo || "",
        candidate_enquiry_number: selectedItem.candidateEnquiryNo || "",
        status: formData.status,
        candidate_says: formData.candidateSays,
        next_date: formattedNextDate,
      };

      // Create call tracker entry
      const result = await createCallTrackerEntry(callTrackerData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create call tracker entry");
      }

      // If status is "Joining", update the enquiry
      if (formData.status === "Joining") {
        const updateResult = await updateEnquiryOnJoining(
          selectedItem.candidateEnquiryNo,
        );
        if (!updateResult.success) {
          console.warn(
            "Failed to update enquiry on joining:",
            updateResult.error,
          );
          // Don't throw error, just log warning as call tracker entry was created
        }
      }

      toast.success("Update successful!");
      setShowModal(false);
      fetchAllData();
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPendingData = pendingData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Helper functions for tabs
  const getFollowUpData = () => {
    return latestHistoryData.filter((item) => item.status === "Follow-up");
  };

  const getInterviewData = () => {
    return latestHistoryData.filter((item) => item.status === "Interview");
  };

  const getOnHoldData = () => {
    return latestHistoryData.filter((item) => item.status === "On Hold");
  };

  const getHistoryData = () => {
    return latestHistoryData.filter((item) =>
      ["Joining", "Reject", "Negotiation"].includes(item.status),
    );
  };

  // Count functions for tabs
  const getFollowUpCount = () => {
    return latestHistoryData.filter((item) => item.status === "Follow-up")
      .length;
  };

  const getInterviewCount = () => {
    return latestHistoryData.filter((item) => item.status === "Interview")
      .length;
  };

  const getOnHoldCount = () => {
    return latestHistoryData.filter((item) => item.status === "On Hold").length;
  };

  const getHistoryCount = () => {
    return latestHistoryData.filter((item) =>
      ["Joining", "Reject", "Negotiation"].includes(item.status),
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Call Tracker</h1>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 transition-all duration-200 border border-green-600 rounded-md hover:bg-green-50"
          title={`Export ${activeTab} data to Excel`}
        >
          <Download size={16} className="mr-2" />
          Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Excel
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by candidate name or enquiry number..."
              className="w-full py-2 pl-10 pr-4 text-gray-600 bg-white border border-gray-400 rounded-lg border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute text-gray-600 transform -translate-y-1/2 left-3 top-1/2 opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Resume
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && filteredPendingData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="11"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No pending calls found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCallClick(item)}
                            className="px-3 py-1 text-sm text-white bg-indigo-700 rounded-md hover:bg-opacity-90"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateEnquiryNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.applyingForPost}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidatePhone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateEmail}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Candidate Says
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Next Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && getFollowUpData().length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : getFollowUpData().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No follow-up calls found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    getFollowUpData().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const enquiryItem = enquiryData.find(
                                (e) => e.candidateEnquiryNo === item.enquiryNo,
                              );

                              if (enquiryItem) {
                                handleCallClick(enquiryItem);
                              } else {
                                const pendingItem = pendingData.find(
                                  (p) =>
                                    p.candidateEnquiryNo === item.enquiryNo,
                                );

                                if (pendingItem) {
                                  handleCallClick(pendingItem);
                                } else {
                                  const basicItem = {
                                    candidateEnquiryNo: item.enquiryNo,
                                    indentNo: item.indentNo,
                                    candidateName: "Candidate",
                                    applyingForPost: "",
                                    department: "",
                                    candidatePhone: "",
                                    candidateEmail: "",
                                    previousCompany: "",
                                    jobExperience: "",
                                    lastSalary: "",
                                    previousPosition: "",
                                    reasonForLeaving: "",
                                    maritalStatus: "",
                                    lastEmployerMobile: "",
                                    candidatePhoto: "",
                                    candidateResume: "",
                                    referenceBy: "",
                                    presentAddress: "",
                                    aadharNo: "",
                                    designation: "",
                                    id: item.timestamp || Date.now().toString(),
                                  };
                                  handleCallClick(basicItem);
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Interview Details
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Schedule Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && getInterviewData().length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : getInterviewData().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No interview calls found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    getInterviewData().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const enquiryItem = enquiryData.find(
                                (e) => e.candidateEnquiryNo === item.enquiryNo,
                              );

                              if (enquiryItem) {
                                handleCallClick(enquiryItem);
                              } else {
                                const pendingItem = pendingData.find(
                                  (p) =>
                                    p.candidateEnquiryNo === item.enquiryNo,
                                );

                                if (pendingItem) {
                                  handleCallClick(pendingItem);
                                } else {
                                  const basicItem = {
                                    candidateEnquiryNo: item.enquiryNo,
                                    indentNo: item.indentNo,
                                    candidateName: "Candidate",
                                    applyingForPost: "",
                                    department: "",
                                    candidatePhone: "",
                                    candidateEmail: "",
                                    previousCompany: "",
                                    jobExperience: "",
                                    lastSalary: "",
                                    previousPosition: "",
                                    reasonForLeaving: "",
                                    maritalStatus: "",
                                    lastEmployerMobile: "",
                                    candidatePhoto: "",
                                    candidateResume: "",
                                    referenceBy: "",
                                    presentAddress: "",
                                    aadharNo: "",
                                    designation: "",
                                    id: item.timestamp || Date.now().toString(),
                                  };
                                  handleCallClick(basicItem);
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Reason For Holding
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      ReCalling Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && getOnHoldData().length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
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
                              const enquiryItem = enquiryData.find(
                                (e) => e.candidateEnquiryNo === item.enquiryNo,
                              );

                              if (enquiryItem) {
                                handleCallClick(enquiryItem);
                              } else {
                                const pendingItem = pendingData.find(
                                  (p) =>
                                    p.candidateEnquiryNo === item.enquiryNo,
                                );

                                if (pendingItem) {
                                  handleCallClick(pendingItem);
                                } else {
                                  const basicItem = {
                                    candidateEnquiryNo: item.enquiryNo,
                                    indentNo: item.indentNo,
                                    candidateName: "Candidate",
                                    applyingForPost: "",
                                    department: "",
                                    candidatePhone: "",
                                    candidateEmail: "",
                                    previousCompany: "",
                                    jobExperience: "",
                                    lastSalary: "",
                                    previousPosition: "",
                                    reasonForLeaving: "",
                                    maritalStatus: "",
                                    lastEmployerMobile: "",
                                    candidatePhoto: "",
                                    candidateResume: "",
                                    referenceBy: "",
                                    presentAddress: "",
                                    aadharNo: "",
                                    designation: "",
                                    id: item.timestamp || Date.now().toString(),
                                  };
                                  handleCallClick(basicItem);
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Details
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && getHistoryData().length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${item.status === "Joining"
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
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
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Candidate Enquiry No.
                </label>
                <input
                  type="text"
                  value={selectedItem.candidateEnquiryNo}
                  disabled
                  className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Indent No.
                </label>
                <input
                  type="text"
                  value={selectedItem.indentNo}
                  disabled
                  className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Status*
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="block mb-1 text-sm font-medium text-gray-700">
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
                  className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {formData.status &&
                !["Joining", "Reject"].includes(formData.status) && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
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
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                )}

              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
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

export default CallTracker;
