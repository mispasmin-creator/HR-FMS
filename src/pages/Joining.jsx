import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  Clock,
  CheckCircle,
  Eye,
  X,
  Download,
  Upload,
  Share,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchJoiningHistory,
  createJoiningRecord,
  fetchPendingJoiningCandidates,
  uploadJoiningFile,
  generateNextJoiningSerial,
  confirmJoining,
} from "../services/joiningService";
import { fetchAllEnquiries } from "../services/enquiryService";
import { fetchDesignations } from "../services/afterJoiningService";
const Joining = () => {
  const [designationOptions, setDesignationOptions] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [joiningData, setJoiningData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFormData, setShareFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    subject: "Candidate Joining Details",
    message: "Please find the candidate joining details attached below.",
  });
  const [formData, setFormData] = useState({
    candidateSays: "",
    status: "",
    nextDate: "",
  });
  const [joiningFormData, setJoiningFormData] = useState({
    joiningId: "",
    nameAsPerAadhar: "",
    fatherName: "",
    dateOfJoining: "",
    joiningPlace: "",
    designation: "",
    salary: "",
    aadharFrontPhoto: null,
    aadharBackPhoto: null,
    panCard: null,
    candidatePhoto: null,
    currentAddress: "",
    addressAsPerAadhar: "",
    dobAsPerAadhar: "",
    gender: "",
    mobileNo: "",
    familyMobileNo: "",
    relationshipWithFamily: "",
    pastPfId: "",
    currentBankAc: "",
    ifscCode: "",
    branchName: "",
    bloodGroup: "",
    identificationMarks: "",
    bankPassbookPhoto: null,
    personalEmail: "",
    esicNo: "",
    highestQualification: "",
    pfEligible: "",
    esicEligible: "",
    joiningCompanyName: "",
    emailToBeIssue: "",
    issueMobile: "",
    issueLaptop: "",
    aadharCardNo: "",
    modeOfAttendance: "",
    qualificationPhoto: null,
    paymentMode: "",
    salarySlip: null,
    resumeCopy: null,
    department: "",
    equipment: "",
    previousCompanyName: "",
    previousCompanyAddress: "",
    offerLetter: null,
    incrementLetter: null,
    paySlip: null,
    resignationLetter: null,
    enquiryNo: "",
  });

  const handleShareClick = (item) => {
    setSelectedItem(item);
    const shareLink = `https://hr-fms-passary-joining-form.vercel.app/?enquiry=${item.candidateEnquiryNo || ""}`;

    setShareFormData({
      recipientName: item.candidateName || "",
      recipientEmail: item.candidateEmail || "",
      subject: "Candidate Joining Details - " + item.candidateName,
      message: `Dear Recipient,\n\nPlease find the joining details for candidate ${item.candidateName} who is applying for the position of ${item.applyingForPost}.\n\nCandidate Details:\n- Name: ${item.candidateName}\n- Position: ${item.applyingForPost}\n- Department: ${item.department}\n- Phone: ${item.candidatePhone}\n- Email: ${item.candidateEmail}\n- Candidate Enquiry Number: ${item.candidateEnquiryNo}\n\nJoining Form Link: ${shareLink}\n\nBest regards,\nHR Team`,
    });

    console.log("Share Link:", shareLink);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const documents = [
        {
          name: selectedItem.candidateName,
          serialNo: selectedItem.candidateEnquiryNo,
          documentType: selectedItem.applyingForPost,
          category: selectedItem.department,
          imageUrl: selectedItem.candidatePhoto || "",
        },
      ];

      const URL =
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec";

      const params = new URLSearchParams();
      params.append("action", "shareViaEmail");
      params.append("recipientEmail", shareFormData.recipientEmail);
      params.append("subject", shareFormData.subject);
      params.append("message", shareFormData.message);
      params.append("documents", JSON.stringify(documents));

      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success("Details shared successfully!");
      setShowShareModal(false);
    } catch (error) {
      console.error("Error sharing details:", error);
      toast.error(`Failed to share details: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInputChange = (e) => {
    const { name, value } = e.target;
    setShareFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const [pendingResult, historyResult] = await Promise.all([
        fetchPendingJoiningCandidates(),
        fetchJoiningHistory(),
      ]);

      if (!pendingResult.success) throw new Error(pendingResult.error);
      if (!historyResult.success) throw new Error(historyResult.error);

      // Process pending data to match component expects
      const processedPendingData = pendingResult.data.map((item) => ({
        id: item.id,
        indentNo: item.indent_number || "",
        candidateEnquiryNo: item.candidate_enquiry_number,
        applyingForPost: item.applying_for_post || "",
        department: item.department || "",
        candidateName: item.candidate_name || "",
        candidatePhone: item.candidate_phone || "",
        candidateEmail: item.candidate_email || "",
        aadharNo: item.aadhar_no || "",
        presentAddress: item.present_address || "",
        candidatePhoto: item.candidate_photo || "",
        candidateResume: item.candidate_resume || "",
        plannedDate: item.planned || "",
        actualJoiningDate: item.actual || "",
        designation: item.applying_for_post || "",
      }));

      // Process history data to match component expects
      const processedHistoryData = historyResult.data.map((item) => ({
        id: item.id,
        indentNo: item.enquiries?.indent_number || "",
        candidateEnquiryNo: item.enquiry_no || "",
        applyingForPost: item.enquiries?.applying_for_post || "",
        department: item.department || item.enquiries?.department || "",
        candidateName:
          item.name_as_per_aadhar || item.enquiries?.candidate_name || "",
        candidatePhone: item.mobile_no || item.enquiries?.candidate_phone || "",
        candidateEmail:
          item.personal_email || item.enquiries?.candidate_email || "",
        aadharNo: item.aadhar_card_no || item.enquiries?.aadhar_no || "",
        presentAddress:
          item.current_address || item.enquiries?.present_address || "",
        candidatePhoto:
          item.candidate_photo || item.enquiries?.candidate_photo || "",
        candidateResume: item.enquiries?.candidate_resume || "",
        dateOfJoining: item.date_of_joining,
        designation: item.designation,
        serialNo: item.serial_no,
        previousCompanyName: item.previous_company_name,
        previousCompanyAddress: item.previous_company_address,
        offerLetter: item.offer_letter,
        incrementLetter: item.increment_letter,
        paySlip: item.pay_slip,
        resignationLetter: item.resignation_letter,
      }));

      setJoiningData(processedPendingData);
      setHistoryData(processedHistoryData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Failed to fetch data from Supabase");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchJoiningData();
  }, []);
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const result = await fetchDesignations();
        if (result.success && result.data) {
          setDesignationOptions(result.data);
        }
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    loadDesignations();
  }, []);

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleJoiningClick = (item) => {
    setSelectedItem(item);
    setJoiningFormData({
      joiningId: "",
      nameAsPerAadhar: item.candidateName || "",
      fatherName: "",
      dateOfJoining: "",
      joiningPlace: "",
      designation: item.designation || "",
      salary: "",
      bloodGroup: "",
      identificationMarks: "",
      aadharFrontPhoto: null,
      aadharBackPhoto: null,
      panCard: null,
      candidatePhoto: null,
      currentAddress: item.presentAddress || "",
      addressAsPerAadhar: "",
      dobAsPerAadhar: formatDOB(item.candidateDOB) || "",
      gender: "",
      mobileNo: item.candidatePhone || "",
      familyMobileNo: "",
      relationshipWithFamily: "",
      pastPfId: "",
      currentBankAc: "",
      ifscCode: "",
      branchName: "",
      bankPassbookPhoto: null,
      personalEmail: item.candidateEmail || "",
      esicNo: "",
      highestQualification: "",
      pfEligible: "",
      esicEligible: "",
      joiningCompanyName: "",
      emailToBeIssue: "",
      issueMobile: "",
      issueLaptop: "",
      aadharCardNo: item.aadharNo || "",
      modeOfAttendance: "",
      qualificationPhoto: null,
      paymentMode: "",
      salarySlip: null,
      resumeCopy: null,
      department: item.department || "",
      equipment: "",
      previousCompanyName: item.previousCompany || "",
      previousCompanyAddress: "",
      offerLetter: null,
      incrementLetter: null,
      paySlip: null,
      resignationLetter: null,
      enquiryNo: item.candidateEnquiryNo?.trim() ? item.candidateEnquiryNo : "",
    });
    setShowJoiningModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    let date;

    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === "string") {
      if (dateString.includes("/")) {
        const parts = dateString.split("/");
        if (parts.length === 3) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        date = new Date(dateString);
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateString || "";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (day > 0 && day <= 31 && month > 0 && month <= 12) {
          if (day > 12) {
            return dateString;
          } else if (month > 12) {
            return `${parts[1]}/${parts[0]}/${parts[2]}`;
          }
        }
      }
    }

    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDateForStorage = (dateString) => {
    if (!dateString) return "";

    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (day > 0 && day <= 31 && month > 0 && month <= 12 && day > 12) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }
    }

    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleJoiningInputChange = (e) => {
    const { name, value } = e.target;
    setJoiningFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setJoiningFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateForm = () => {
    if (joiningFormData.mobileNo && !validateMobile(joiningFormData.mobileNo)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    if (
      joiningFormData.familyMobileNo &&
      !validateMobile(joiningFormData.familyMobileNo)
    ) {
      toast.error("Please enter a valid 10-digit family mobile number");
      return false;
    }

    if (
      joiningFormData.personalEmail &&
      !validateEmail(joiningFormData.personalEmail)
    ) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!joiningFormData.aadharFrontPhoto) {
      toast.error("Aadhar Card front photo is required");
      return false;
    }

    if (!joiningFormData.bankPassbookPhoto) {
      toast.error("Bank Passbook photo is required");
      return false;
    }

    if (!joiningFormData.bloodGroup) {
      toast.error("Blood Group is required");
      return false;
    }

    return true;
  };

  const handleJoiningSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSubmitting(true);

    try {
      const serialNumber = await generateNextJoiningSerial();

      const fileFields = [
        "aadharFrontPhoto",
        "aadharBackPhoto",
        "panCard",
        "candidatePhoto",
        "bankPassbookPhoto",
        "qualificationPhoto",
        "salarySlip",
        "resumeCopy",
        "offerLetter",
        "incrementLetter",
        "paySlip",
        "resignationLetter",
      ];

      const fileUrls = {};
      for (const field of fileFields) {
        if (joiningFormData[field] instanceof File) {
          const fileName = `${selectedItem.candidateEnquiryNo}_${field}_${joiningFormData[field].name}`;
          const uploadResult = await uploadJoiningFile(
            joiningFormData[field],
            fileName,
          );
          if (uploadResult.success) {
            fileUrls[field] = uploadResult.url;
          } else {
            console.error(`Failed to upload ${field}:`, uploadResult.error);
            fileUrls[field] = "";
          }
        } else {
          fileUrls[field] = joiningFormData[field] || "";
        }
      }

      const joiningRecord = {
        serial_no: serialNumber,
        enquiry_no: selectedItem.candidateEnquiryNo,
        name_as_per_aadhar:
          joiningFormData.nameAsPerAadhar || selectedItem.candidateName,
        father_name: joiningFormData.fatherName,
        date_of_joining: joiningFormData.dateOfJoining,
        joining_place: joiningFormData.joiningPlace,
        designation: joiningFormData.designation || selectedItem.designation,
        salary: joiningFormData.salary,
        aadhar_front_photo:
          fileUrls.aadharFrontPhoto || selectedItem.candidatePhoto,
        aadhar_back_photo: fileUrls.aadharBackPhoto,
        pan_card: fileUrls.panCard,
        candidate_photo: fileUrls.candidatePhoto || selectedItem.candidatePhoto,
        current_address:
          joiningFormData.currentAddress || selectedItem.presentAddress,
        address_as_per_aadhar: joiningFormData.addressAsPerAadhar,
        dob_as_per_aadhar: joiningFormData.dobAsPerAadhar,
        gender: joiningFormData.gender,
        mobile_no: joiningFormData.mobileNo || selectedItem.candidatePhone,
        family_mobile_no: joiningFormData.familyMobileNo,
        relationship_with_family: joiningFormData.relationshipWithFamily,
        past_pf_id: joiningFormData.pastPfId,
        current_bank_account_no: joiningFormData.currentBankAccountNo,
        current_bank_ifsc: joiningFormData.currentBankIfsc,
        branch_name: joiningFormData.branchName,
        blood_group: joiningFormData.bloodGroup,
        identification_marks: joiningFormData.identificationMarks,
        bank_passbook_photo: fileUrls.bankPassbookPhoto,
        personal_email:
          joiningFormData.personalEmail || selectedItem.candidateEmail,
        esic_no: joiningFormData.esicNo,
        highest_qualification: joiningFormData.highestQualification,
        pf_eligible: joiningFormData.pfEligible,
        esic_eligible: joiningFormData.esicEligible,
        joining_company_name: joiningFormData.joiningCompanyName,
        email_to_be_issue: joiningFormData.emailToBeIssue,
        issue_mobile: joiningFormData.issueMobile,
        issue_laptop: joiningFormData.issueLaptop,
        aadhar_card_no: joiningFormData.aadharCardNo || selectedItem.aadharNo,
        mode_of_attendance: joiningFormData.modeOfAttendance,
        qualification_photo: fileUrls.qualificationPhoto,
        payment_mode: joiningFormData.paymentMode,
        salary_slip: fileUrls.salarySlip,
        resume_copy: fileUrls.resumeCopy || selectedItem.candidateResume,
        department: joiningFormData.department || selectedItem.department,
        equipment: joiningFormData.equipment,
        previous_company_name:
          joiningFormData.previousCompanyName || selectedItem.previousCompany,
        previous_company_address: joiningFormData.previousCompanyAddress,
        offer_letter: fileUrls.offerLetter,
        increment_letter: fileUrls.incrementLetter,
        pay_slip: fileUrls.paySlip,
        resignation_letter: fileUrls.resignationLetter,
      };

      const result = await createJoiningRecord(joiningRecord);

      if (!result.success) {
        // Check if it's a joining limit error
        if (result.errorType === "JOINING_LIMIT_REACHED") {
          toast.error(result.error);
        } else if (result.errorType === "INVALID_ENQUIRY") {
          toast.error(result.error);
        } else {
          toast.error(result.error || "Failed to create joining record");
        }
        return;
      }

      // Update enquiry status to Joined
      await confirmJoining(selectedItem.candidateEnquiryNo);

      toast.success(
        "Employee added successfully! Joining ID: " + result.data.serial_no,
      );
      setShowJoiningModal(false);
      setSelectedItem(null);
      fetchJoiningData();
    } catch (error) {
      console.error("Error submitting joining form:", error);
      toast.error(error.message || "Failed to submit joining form");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJoiningData = joiningData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Joining Management{" "}
        </h1>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, post or phone number..."
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
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending Joinings ({filteredJoiningData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "history"
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
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 mb-2 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">
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
                          className="px-4 py-2 mt-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                              className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-opacity-90"
                            >
                              Joining
                            </button>
                            {/* <button
                              onClick={() => handleShareClick(item)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-opacity-90"
                            >
                              <Share size={14} className="mr-1" />
                              Share
                            </button> */}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indentNo || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateEnquiryNo || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.applyingForPost || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.department || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidatePhone || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateEmail || "-"}
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
                          <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Previous Company Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Address
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Offer Letter
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Increment Letter
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Pay Slip
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Resignation Letter
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 mb-2 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">
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
                          className="px-4 py-2 mt-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateEnquiryNo || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.department || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.applyingForPost || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidatePhone || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidateEmail || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.previousCompanyName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.previousCompanyAddress || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
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

      {/* Joining Modal - EXACT same as your original code */}
      {showJoiningModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Enquiry No.
                  </label>
                  <input
                    type="text"
                    name="enquiryNo"
                    value={joiningFormData.enquiryNo}
                    disabled
                    className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name As Per Aadhar
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.candidateName}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Father Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={joiningFormData.fatherName}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Date Of Birth As per Aadhar *
                  </label>
                  <input
                    type="date"
                    name="dobAsPerAadhar"
                    value={joiningFormData.dobAsPerAadhar}
                    onChange={handleJoiningInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={joiningFormData.gender}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Gender </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female </option>
                    <option value="Other">Other </option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.department || ""}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Mobile No. *
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={joiningFormData.mobileNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        handleJoiningInputChange({
                          target: { name: "mobileNo", value },
                        });
                      }
                    }}
                    maxLength="10"
                    required
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {joiningFormData.mobileNo &&
                    !validateMobile(joiningFormData.mobileNo) && (
                      <p className="mt-1 text-xs text-red-500">
                        Please enter a valid 10-digit mobile number
                      </p>
                    )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Family Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="familyMobileNo"
                    value={joiningFormData.familyMobileNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        handleJoiningInputChange({
                          target: { name: "familyMobileNo", value },
                        });
                      }
                    }}
                    maxLength="10"
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {joiningFormData.familyMobileNo &&
                    !validateMobile(joiningFormData.familyMobileNo) && (
                      <p className="mt-1 text-xs text-red-500">
                        Please enter a valid 10-digit mobile number
                      </p>
                    )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Personal Email *
                  </label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={joiningFormData.personalEmail}
                    onChange={handleJoiningInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {joiningFormData.personalEmail &&
                    !validateEmail(joiningFormData.personalEmail) && (
                      <p className="mt-1 text-xs text-red-500">
                        Please enter a valid email address
                      </p>
                    )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Relationship With Family
                  </label>
                  <input
                    name="relationshipWithFamily"
                    value={joiningFormData.relationshipWithFamily}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Blood Group Field */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Blood Group *
                  </label>
                  <select
                    name="bloodGroup"
                    value={joiningFormData.bloodGroup}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Identification Marks
                  </label>
                  <textarea
                    name="identificationMarks"
                    value={joiningFormData.identificationMarks}
                    onChange={handleJoiningInputChange}
                    rows={2}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter any visible identification marks..."
                  />
                </div>
              </div>

              {/* Section 3: Address Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Current Address
                  </label>
                  <textarea
                    name="currentAddress"
                    value={joiningFormData.currentAddress}
                    onChange={handleJoiningInputChange}
                    rows={3}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter current address..."
                  />
                </div>
              </div>

              {/* Section 4: Employment Details */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Date Of Joining
                  </label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={joiningFormData.dateOfJoining}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <select
                    name="designation"
                    value={
                      joiningFormData.designation ||
                      selectedItem.designation ||
                      ""
                    }
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Designation</option>
                    {designationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Highest Qualification
                  </label>
                  <input
                    name="highestQualification"
                    value={joiningFormData.highestQualification}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Section 5: Bank & Financial Details */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Aadhar Card Number
                  </label>
                  <input
                    type="text"
                    name="aadharCardNo"
                    value={joiningFormData.aadharCardNo}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter Aadhar number"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Current Bank Account No
                  </label>
                  <input
                    name="currentBankAc"
                    value={joiningFormData.currentBankAc}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    IFSC Code
                  </label>
                  <input
                    name="ifscCode"
                    value={joiningFormData.ifscCode}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Branch Name
                  </label>
                  <input
                    name="branchName"
                    value={joiningFormData.branchName}
                    onChange={handleJoiningInputChange}
                    className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Section 6: Document Uploads */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Aadhar Card (Front) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "aadharFrontPhoto")}
                      className="hidden"
                      id="aadhar-front-upload"
                      required
                    />
                    <label
                      htmlFor="aadhar-front-upload"
                      className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo *
                    </label>
                    {joiningFormData.aadharFrontPhoto ? (
                      <span className="text-sm text-green-600">
                        {joiningFormData.aadharFrontPhoto.name}
                      </span>
                    ) : (
                      <span className="text-sm text-red-500">Required</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Photo Of Front Bank Passbook *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "bankPassbookPhoto")}
                      className="hidden"
                      id="bank-passbook-upload"
                      required
                    />
                    <label
                      htmlFor="bank-passbook-upload"
                      className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo *
                    </label>
                    {joiningFormData.bankPassbookPhoto ? (
                      <span className="text-sm text-green-600">
                        {joiningFormData.bankPassbookPhoto.name}
                      </span>
                    ) : (
                      <span className="text-sm text-red-500">Required</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 6: Previous Company Details */}
              <div className="mb-6">
                <h4 className="pb-2 mb-4 text-lg font-medium text-gray-900 border-b border-gray-200">
                  Previous Company Details
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Previous Company Name
                    </label>
                    <input
                      type="text"
                      name="previousCompanyName"
                      value={joiningFormData.previousCompanyName}
                      onChange={handleJoiningInputChange}
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Previous Company Address
                    </label>
                    <textarea
                      name="previousCompanyAddress"
                      value={joiningFormData.previousCompanyAddress}
                      onChange={handleJoiningInputChange}
                      rows={3}
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Previous Company Document Uploads */}
              <div className="mb-6">
                <h4 className="pb-2 mb-4 text-lg font-medium text-gray-900 border-b border-gray-200">
                  Previous Company Documents
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
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
                        className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
                    <label className="block mb-1 text-sm font-medium text-gray-700">
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
                        className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
                    <label className="block mb-1 text-sm font-medium text-gray-700">
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
                        className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Resignation Letter
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFileChange(e, "resignationLetter")
                        }
                        className="hidden"
                        id="resignation-letter-upload"
                      />
                      <label
                        htmlFor="resignation-letter-upload"
                        className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${
                    submitting ? "opacity-90 cursor-not-allowed" : ""
                  }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
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

      {/* Share Modal - EXACT same as your original code */}
      {showShareModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Share Details
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="p-6 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Recipient Name
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={shareFormData.recipientName}
                  onChange={handleShareInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={shareFormData.recipientEmail}
                  onChange={handleShareInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={shareFormData.subject}
                  onChange={handleShareInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  name="message"
                  value={shareFormData.message}
                  onChange={handleShareInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 ${
                    submitting ? "opacity-90 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? "Sending..." : "Send"}
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
