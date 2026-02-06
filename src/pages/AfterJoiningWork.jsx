import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Filter, Search, Clock, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAfterJoiningData,
  updateAfterJoiningRecord,
  uploadAfterJoiningFile,
  generateNextEmployeeCode,
  fetchReportingOfficers,
  fetchDepartments,
  fetchDesignations,
} from "../services/afterJoiningService";

const AfterJoiningWork = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportingOfficers, setReportingOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const companyOptions = ["PMMPL", "PURAB", "REFRATECH", "REFRASYNTH", "RKL"];
  const [loading, setLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  // Add this after your searchTerm state
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const joiningPlaceOptions = [
    "Application",
    "Factory",
    "Factory Madhya",
    "Factory Purab",
    "Factory Refrasynth",
    "Factory Rkl",
    "Iron Tailor Office",
    "Mdo Office",
    "Rkl Office",
    "Sales",
  ];

  const [formData, setFormData] = useState({
    employeeCode: "",
    salaryConfirmation: "",
    salaryAmount: "",
    reportingOfficer: "",
    pf: "",
    baseAddress: "",
    idProofCopy: null,
    joiningLetter: null,
    interviewAssessmentSheet: null,
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
    attendanceMode: "",
    department: "",
    eligibleForPF: "",
    eligibleForESIC: "",
    remarks: "",
    nextSalaryIncrementDate: "",
    designation: "",
    bloodGroup: "",
    identificationMarks: "",
    companyName: "",
    joiningPlace: "",
  });

  const fetchInitialData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      setError(null);

      const [dataResult, officersResult, deptsResult, desigsResult] =
        await Promise.all([
          fetchAfterJoiningData(),
          fetchReportingOfficers(),
          fetchDepartments(),
          fetchDesignations(),
        ]);

      if (dataResult.success) {
        setPendingData(dataResult.pending);
        setHistoryData(dataResult.history);
      } else {
        throw new Error(dataResult.error);
      }

      if (officersResult.success) setReportingOfficers(officersResult.data);
      if (deptsResult.success) setDepartments(deptsResult.data);
      if (desigsResult.success) setDesignations(desigsResult.data);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
      toast.error("Failed to load data from Supabase");
    } finally {
      if (!forceRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(
      () => {
        fetchInitialData(true);
      },
      5 * 60 * 1000,
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchInitialData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchInitialData]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
    } catch (e) {
      return dateString;
    }
  };

  // Fetch assets data from Supabase (consolidated into joining table)
  const fetchAssetsData = useCallback(
    async (joiningNo) => {
      try {
        // In Supabase migration, we assume assets info is in the joining table
        // Since we already fetched the full joining record in fetchInitialData,
        // we can just find it in our state.
        const item = [...pendingData, ...historyData].find(
          (i) => i.joiningNo === joiningNo,
        );
        return item || null;
      } catch (error) {
        console.error("Error fetching assets data:", error);
        return null;
      }
    },
    [pendingData, historyData],
  );

  const handleAfterJoiningClick = async (item) => {
    if (!item || !item.joiningNo) {
      toast.error("Invalid item data. Please refresh and try again.");
      return;
    }

    setSelectedItem(item);
    setShowModal(true);

    try {
      const newEmployeeCode = await generateNextEmployeeCode();

      // All data is already in 'item' thanks to fetchAfterJoiningData
      setFormData({
        employeeCode: item.employeeCode || newEmployeeCode,
        salaryConfirmation: item.salaryConfirmation || "",
        salaryAmount: item.salaryAmount || "",
        reportingOfficer: item.reportingOfficer || "",
        pf: item.pfEsic || "",
        baseAddress: item.baseAddress || item.currentAddress || "",
        idProofCopy: null,
        joiningLetter: null,
        interviewAssessmentSheet: null,
        biometricAccess: item.punchCode ? true : false,
        punchCode: item.punchCode || "",
        officialEmailId: item.officialEmail ? true : false,
        emailId: item.officialEmail || "",
        emailPassword: item.emailPassword || "",
        laptop: item.laptopDetails || "",
        laptopImageUrl: item.laptopImage || "",
        laptopImage: null,
        mobile: item.mobileName || "",
        mobileImageUrl: item.mobileImage || "",
        mobileImage: null,
        manualImageUrl: item.manualImageUrl || "",
        manualImage: null,
        assignAssets: item.item1 || item.item2 || item.item3 ? true : false,
        assets: [
          item.item1
            ? { name: item.item1, image: null, imageUrl: item.item1Image || "" }
            : null,
          item.item2
            ? { name: item.item2, image: null, imageUrl: item.item2Image || "" }
            : null,
          item.item3
            ? { name: item.item3, image: null, imageUrl: item.item3Image || "" }
            : null,
        ].filter(Boolean),
        incentiveCategory: item.incentiveCategory || "",
        attendanceMode: item.attendanceMode || "",
        department: item.department || "",
        eligibleForPF: item.eligibleForPF || "",
        eligibleForESIC: item.eligibleForESIC || "",
        remarks: item.remarks || "",
        nextSalaryIncrementDate: item.nextSalaryIncrementDate || "",
        designation: item.designation || "",
        bloodGroup: item.bloodGroup || "",
        identificationMarks: item.identificationMarks || "",
        companyName: item.companyName || "",
        joiningPlace: item.joiningPlace || "",
      });
    } catch (error) {
      console.error("Error preparing form data:", error);
      toast.error("Failed to prepare form data");
    }
  };

  const handleCheckboxChange = (name) => {
    setFormData((prev) => {
      const newValue = !prev[name];

      if (name === "assignAssets" && newValue && prev.assets.length === 0) {
        return {
          ...prev,
          [name]: newValue,
          assets: [],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedItem || !selectedItem.joiningNo) {
      toast.error("No item selected or joining number missing.");
      setSubmitting(false);
      return;
    }

    try {
      // Upload images to Supabase storage
      const uploadPromises = [];
      const fieldsToUpload = [
        { key: "idProofCopy", path: "id_proofs" },
        { key: "joiningLetter", path: "joining_letters" },
        { key: "interviewAssessmentSheet", path: "interviews" },
        { key: "laptopImage", path: "assets" },
        { key: "mobileImage", path: "assets" },
        { key: "manualImage", path: "manuals" },
      ];

      fieldsToUpload.forEach(({ key, path }) => {
        if (formData[key] instanceof File) {
          const fileName = `${selectedItem.joiningNo}_${key}_${Date.now()}.${formData[key].name.split(".").pop()}`;
          uploadPromises.push(
            uploadAfterJoiningFile(formData[key], `${path}/${fileName}`).then(
              (res) => ({ key, url: res.url }),
            ),
          );
        }
      });

      // Handle dynamic assets
      const assetUrls = [...formData.assets.map((a) => a.imageUrl || "")];
      formData.assets.forEach((asset, idx) => {
        if (asset.image instanceof File) {
          const fileName = `${selectedItem.joiningNo}_asset${idx}_${Date.now()}.${asset.image.name.split(".").pop()}`;
          uploadPromises.push(
            uploadAfterJoiningFile(asset.image, `assets/${fileName}`).then(
              (res) => ({ key: `asset${idx}`, url: res.url, index: idx }),
            ),
          );
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const urls = {};
      uploadResults.forEach((res) => {
        if (res.index !== undefined) {
          assetUrls[res.index] = res.url;
        } else {
          urls[res.key] = res.url;
        }
      });

      const now = new Date();
      const actualJoinedDate = now.toISOString();

      const updateData = {
        actual_after_joining_date: actualJoinedDate, // ✅ FIXED

        employee_code: formData.employeeCode,
        salary_confirmation:
          formData.salaryConfirmation === "Yes"
            ? formData.salaryAmount
            : formData.salaryConfirmation,

        reporting_officer: formData.reportingOfficer,
        base_address: formData.baseAddress,

        punch_code: formData.biometricAccess ? formData.punchCode : "",

        email_id: formData.officialEmailId ? formData.emailId : "",
        official_email_password: formData.officialEmailId
          ? formData.emailPassword
          : "",

        pf: formData.pf || "",

        id_proof_copy: urls.idProofCopy || selectedItem.idProofCopy,
        joining_letter: urls.joiningLetter || selectedItem.joiningLetter,
        interview_assessment_sheet:
          urls.interviewAssessmentSheet ||
          selectedItem.interviewAssessmentSheet,

        manual_image: urls.manualImage || selectedItem.manualImageUrl,

        laptop: formData.laptop,
        laptop_image: urls.laptopImage || formData.laptopImageUrl,

        mobile: formData.mobile,
        mobile_image: urls.mobileImage || formData.mobileImageUrl,

        asset1_name: formData.assets[0]?.name || "",
        asset1_image: assetUrls[0] || "",

        asset2_name: formData.assets[1]?.name || "",
        asset2_image: assetUrls[1] || "",

        asset3_name: formData.assets[2]?.name || "",
        asset3_image: assetUrls[2] || "",

        incentive_category: formData.incentiveCategory,

        after_joining_attendance_mode: formData.attendanceMode,
        after_joining_department: formData.department,

        eligible_for_pf: formData.eligibleForPF,
        eligible_for_esic: formData.eligibleForESIC,

        remarks: formData.remarks,
        next_salary_increment_date: formData.nextSalaryIncrementDate,

        after_joining_company_name: formData.companyName,
        after_joining_joining_place: formData.joiningPlace,
      };

      const result = await updateAfterJoiningRecord(
        selectedItem.joiningNo,
        updateData,
      );

      if (!result.success) throw new Error(result.error);

      toast.success("Data saved successfully to Supabase!");
      setShowModal(false);
      fetchInitialData(true);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    if (dateString.includes("-")) {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        const day = parts[2];
        const month = parts[1];
        const year = parts[0].slice(-2);
        return `${day}/${month}/${year}`;
      }
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  const filteredPendingData = useMemo(() => {
    if (!searchTerm) return pendingData;

    const searchLower = searchTerm.toLowerCase();
    return pendingData.filter((item) => {
      const matchesSearch =
        item.candidateName?.toLowerCase().includes(searchLower) ||
        item.joiningNo?.toLowerCase().includes(searchLower);
      return matchesSearch;
    });
  }, [pendingData, searchTerm]);

  const filteredHistoryData = useMemo(() => {
    if (!searchTerm) return historyData;

    const searchLower = searchTerm.toLowerCase();
    return historyData.filter((item) => {
      const matchesSearch =
        item.candidateName?.toLowerCase().includes(searchLower) ||
        item.joiningNo?.toLowerCase().includes(searchLower);
      return matchesSearch;
    });
  }, [historyData, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold ">After Joining Work </h1>
      </div>

      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search Something..."
              className="w-full py-2 pl-10 pr-4 text-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2 "
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="border-b border-gray-300 ">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
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
                      Designation
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {error ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={() => fetchInitialData()}
                          className="px-4 py-2 mt-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((item, index) => (
                      <tr key={index} className="hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleAfterJoiningClick(item)}
                            className="px-3 py-1 text-sm text-white bg-indigo-700 rounded-md"
                          >
                            Process
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {item.joiningNo || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {item.candidateName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {item.fatherName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDOB(item.dateOfJoining)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {item.designation || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {item.department || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {item.companyName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDateForDisplay(item.plannedDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending after joining work found.
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Serial Number
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Employee Code
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Salary Confirmation
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Reporting Officer
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Base Address
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Punch Code
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Official Email
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Email Password
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Bank A/C No.
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      IFSC Code
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                      Company
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      PF / ESIC
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      ID Proof Copy
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Joining Letter
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Interview Assessment
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Attendance Mode
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Eligible PF
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Eligible ESIC
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Remarks
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Joining Place
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Next Increment
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Blood Group
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      ID Marks
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Manual / Document
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Laptop Details
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Laptop Image
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Mobile Name
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Mobile Image
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Item 1
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Item 1 Image
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Item 2
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Item 2 Image
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Item 3
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Item 3 Image
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Incentive Category
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredHistoryData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="38"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No history found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.joiningNo}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.employeeCode}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.candidateName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.salaryConfirmation}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.reportingOfficer}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.baseAddress}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.punchCode}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.officialEmail}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.emailPassword}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.currentBankAccountNo}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.currentBankIfsc}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.designation}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.companyName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.pfEsic || "-"}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.idProofCopy ? (
                            <a
                              href={item.idProofCopy}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.joiningLetter ? (
                            <a
                              href={item.joiningLetter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.interviewAssessmentSheet ? (
                            <a
                              href={item.interviewAssessmentSheet}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.attendanceMode}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.department2}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.eligibleForPF}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.eligibleForESIC}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.remarks}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.joiningPlace}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {formatDateForDisplay(item.nextSalaryIncrementDate)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.bloodGroup}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.identificationMarks}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.manualImageUrl ? (
                            <a
                              href={item.manualImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.laptopDetails}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.laptopImage ? (
                            <a
                              href={item.laptopImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.mobileName}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.mobileImage ? (
                            <a
                              href={item.mobileImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.item1}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.item1Image ? (
                            <a
                              href={item.item1Image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.item2}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.item2Image ? (
                            <a
                              href={item.item2Image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.item3}
                        </td>

                        <td className="px-4 py-2 text-sm">
                          {item.item3Image ? (
                            <a
                              href={item.item3Image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">
                          {item.incentiveCategory}
                        </td>

                        <td className="px-4 py-2">
                          <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
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

      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto modal-backdrop">
          <div className="w-full max-w-4xl my-8 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b">
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
              {/* Modal content remains exactly the same */}
              {/* All form sections, inputs, and fields are preserved */}
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={selectedItem.joiningNo}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 font-semibold text-gray-700 bg-white border border-gray-300 rounded-md"
                    placeholder="Auto-generated"
                    required
                    readOnly
                  />
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Auto-generated from last employee code
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={selectedItem.candidateName}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                {/* Designation - Editable dropdown */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Designation *
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((designation, index) => (
                      <option key={index} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md"
                    placeholder="Or type custom designation"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Reporting Officer *
                  </label>
                  <select
                    name="reportingOfficer"
                    value={formData.reportingOfficer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
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
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Salary Confirmation *
                  </label>
                  <select
                    name="salaryConfirmation"
                    value={formData.salaryConfirmation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {formData.salaryConfirmation === "Yes" && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-500">
                      Salary Amount *
                    </label>
                    <input
                      type="text"
                      name="salaryAmount"
                      value={formData.salaryAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                      placeholder="Enter salary amount"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Incentive Category *
                  </label>
                  <select
                    name="incentiveCategory"
                    value={formData.incentiveCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Incentive Category</option>
                    <option value="MIS Basis">MIS Basis</option>
                    <option value="Non Mis">Non Mis</option>
                    <option value="OT Basis">OT Basis</option>
                    <option value="Per MT">Per MT</option>
                    <option value="Non-Incentive">Non-Incentive</option>
                  </select>
                </div>
              </div>

              {/* Bank Details (Pre-filled) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Bank Account No.
                  </label>
                  <input
                    type="text"
                    value={selectedItem.currentBankAccountNo}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={selectedItem.currentBankIfsc}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              {/* PF */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    PF Number
                  </label>
                  <input
                    type="text"
                    name="pf"
                    value={formData.pf}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    placeholder="Enter PF number"
                  />
                </div>
              </div>

              {/* Base Address */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Base Address
                  </label>
                  <textarea
                    name="baseAddress"
                    value={formData.baseAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    placeholder="Enter base address"
                  />
                </div>
              </div>

              {/* NEW FIELDS SECTION */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Attendance Mode *
                  </label>
                  <select
                    name="attendanceMode"
                    value={formData.attendanceMode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Mode</option>
                    <option value="outsider">Outsider</option>
                    <option value="machine">Machine</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
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

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Eligible for PF *
                  </label>
                  <select
                    name="eligibleForPF"
                    value={formData.eligibleForPF}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Eligible for ESIC *
                  </label>
                  <select
                    name="eligibleForESIC"
                    value={formData.eligibleForESIC}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Next Salary Increment Date *
                  </label>
                  <input
                    type="date"
                    name="nextSalaryIncrementDate"
                    value={formData.nextSalaryIncrementDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="Auto-filled from database"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Identification Marks
                  </label>
                  <textarea
                    name="identificationMarks"
                    value={formData.identificationMarks}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="Auto-filled from database"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Company Name *
                  </label>
                  <select
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
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
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    placeholder="Enter any remarks"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Joining Place *
                  </label>
                  <select
                    name="joiningPlace"
                    value={formData.joiningPlace}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Joining Place</option>
                    {joiningPlaceOptions.map((place, index) => (
                      <option key={index} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    ID Proof Copy (Column AL)
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
                    className="flex items-center justify-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
                    {formData.idProofCopy
                      ? formData.idProofCopy.name
                      : "Upload ID Proof"}
                  </label>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Joining Letter (Column AM)
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
                    className="flex items-center justify-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
                    {formData.joiningLetter
                      ? formData.joiningLetter.name
                      : "Upload Joining Letter"}
                  </label>
                </div>
              </div>

              {/* Interview Assessment Sheet Upload */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Interview Assessment Sheet (Column DC)
                  </label>
                  <input
                    type="file"
                    id="interviewAssessmentSheet"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      handleImageUpload(e, "interviewAssessmentSheet")
                    }
                    className="hidden"
                  />
                  <label
                    htmlFor="interviewAssessmentSheet"
                    className="flex items-center justify-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
                    {formData.interviewAssessmentSheet
                      ? formData.interviewAssessmentSheet.name
                      : "Upload Interview Assessment Sheet"}
                  </label>
                </div>
              </div>

              {/* Checklist Items - All checklist functionality preserved */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-500 text-md">
                  Checklist Items
                </h4>

                {/* Biometric Access */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="biometricAccess"
                    checked={formData.biometricAccess}
                    onChange={() => handleCheckboxChange("biometricAccess")}
                    className="w-4 h-4 text-gray-500 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="biometricAccess"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Biometric Access
                  </label>
                </div>
                {formData.biometricAccess && (
                  <div className="p-3 mt-2 ml-6 rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
                          Punch Code
                        </label>
                        <input
                          type="text"
                          name="punchCode"
                          value={formData.punchCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
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
                      className="w-4 h-4 text-gray-500 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="officialEmailId"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Official Email ID
                    </label>
                  </div>
                  {formData.officialEmailId && (
                    <div className="grid grid-cols-1 gap-3 p-3 mt-2 ml-6 rounded-md md:grid-cols-2 bg-gray-50">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
                          Email ID
                        </label>
                        <input
                          type="text"
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          placeholder="Enter email ID"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
                          Password
                        </label>
                        <input
                          type="password"
                          name="emailPassword"
                          value={formData.emailPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
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
                    className="w-4 h-4 text-gray-500 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="assignAssets"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Assign Assets
                  </label>
                </div>
                {formData.assignAssets && (
                  <div className="p-3 mt-2 ml-6 space-y-4 rounded-md bg-gray-50">
                    {/* Laptop - Always visible */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
                          Laptop Name
                        </label>
                        <input
                          type="text"
                          name="laptop"
                          value={formData.laptop}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          placeholder="Enter laptop name"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
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
                          className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                        >
                          {formData.laptopImage
                            ? "Change Image"
                            : formData.laptopImageUrl
                              ? "Replace Image"
                              : "Upload Image"}
                        </label>
                        {(formData.laptopImageUrl || formData.laptopImage) && (
                          <img
                            src={
                              formData.laptopImage
                                ? URL.createObjectURL(formData.laptopImage)
                                : formData.laptopImageUrl
                            }
                            alt="Laptop"
                            className="object-contain w-full h-20 mt-2 border rounded"
                          />
                        )}
                      </div>
                    </div>

                    {/* Mobile - Always visible */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
                          Mobile Name
                        </label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          placeholder="Enter mobile name"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-500">
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
                          className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                        >
                          {formData.mobileImage
                            ? "Change Image"
                            : formData.mobileImageUrl
                              ? "Replace Image"
                              : "Upload Image"}
                        </label>
                        {(formData.mobileImageUrl || formData.mobileImage) && (
                          <img
                            src={
                              formData.mobileImage
                                ? URL.createObjectURL(formData.mobileImage)
                                : formData.mobileImageUrl
                            }
                            alt="Mobile"
                            className="object-contain w-full h-20 mt-2 border rounded"
                          />
                        )}
                      </div>
                    </div>

                    {/* Dynamic Items */}
                    {formData.assets.map((asset, index) => (
                      <div
                        key={index}
                        className="relative grid grid-cols-1 gap-3 p-3 border border-gray-300 rounded-md md:grid-cols-2"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newAssets = formData.assets.filter(
                              (_, i) => i !== index,
                            );
                            setFormData((prev) => ({
                              ...prev,
                              assets: newAssets,
                            }));
                          }}
                          className="absolute flex items-center justify-center w-6 h-6 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-500">
                            Item {index + 3} Name
                          </label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => {
                              const newAssets = [...formData.assets];
                              newAssets[index].name = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                assets: newAssets,
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-500">
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
                                setFormData((prev) => ({
                                  ...prev,
                                  assets: newAssets,
                                }));
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`assetImage${index}`}
                            className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                          >
                            {asset.image
                              ? "Change Image"
                              : asset.imageUrl
                                ? "Replace Image"
                                : "Upload Image"}
                          </label>
                          {(asset.imageUrl || asset.image) && (
                            <img
                              src={
                                asset.image
                                  ? URL.createObjectURL(asset.image)
                                  : asset.imageUrl
                              }
                              alt={`Item ${index + 3}`}
                              className="object-contain w-full h-20 mt-2 border rounded"
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
                            setFormData((prev) => ({
                              ...prev,
                              assets: [
                                ...prev.assets,
                                { name: "", image: null, imageUrl: "" },
                              ],
                            }));
                          }
                        }}
                        className="flex items-center justify-center w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                    <div className="pt-4 space-y-2 border-t">
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
                        className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        {formData.manualImage
                          ? "Change Manual"
                          : formData.manualImageUrl
                            ? "Replace Manual"
                            : "Upload Manual"}
                      </label>
                      {(formData.manualImageUrl || formData.manualImage) && (
                        <img
                          src={
                            formData.manualImage
                              ? URL.createObjectURL(formData.manualImage)
                              : formData.manualImageUrl
                          }
                          alt="Manual"
                          className="object-contain w-full h-32 mt-2 border rounded"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
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

export default AfterJoiningWork;
