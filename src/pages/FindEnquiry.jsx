import React, { useState, useEffect } from "react";
import { Search, Clock, CheckCircle, X, Upload } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchPendingIndents,
  fetchAllEnquiries,
  createEnquiry,
  countEnquiriesForIndent,
  generateNextCandidateNumber,
  generateNextAAPNumber,
  uploadFileToStorage,
  getEnquiriesForIndent,
  markEnquiryAsDone 
} from "../services/enquiryService";

const FindEnquiry = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [indentData, setIndentData] = useState([]);
  const [enquiryData, setEnquiryData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCandidateNo, setGeneratedCandidateNo] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [enquiryCounts, setEnquiryCounts] = useState({});
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateDOB: "",
    candidatePhone: "",
    candidateEmail: "",
    previousCompany: "",
    jobExperience: "",
    department: "",
    previousPosition: "",
    maritalStatus: "",
    interviewDate: "",
    candidatePhoto: null,
    candidateResume: null,
    presentAddress: "",
    aadharNo: "",
  });

  // Parse DD/MM/YYYY format
  const parseDDMMYYYY = (dateString) => {
    if (!dateString || dateString.trim() === "") return null;

    try {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        return dateString;
      }
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
    }
    return null;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Fetch all data from Supabase
  const fetchAllData = async () => {
    try {
      // Fetch pending indents
      const indentResult = await fetchPendingIndents();
      if (indentResult.success) {
        setIndentData(indentResult.data);
      } else {
        throw new Error(indentResult.error || "Failed to fetch indents");
      }

      // Fetch all enquiries
      const enquiryResult = await fetchAllEnquiries();
      if (enquiryResult.success) {
        setEnquiryData(enquiryResult.data);

        // Build enquiry counts map
        const counts = {};
        enquiryResult.data.forEach((enquiry) => {
          const indentNo = enquiry.indent_number;
          counts[indentNo] = (counts[indentNo] || 0) + 1;
        });
        setEnquiryCounts(counts);
      } else {
        throw new Error(enquiryResult.error || "Failed to fetch enquiries");
      }

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  };

  // Count enquiries for each indent
  const countEnquiriesForIndent = (indentNo) => {
    return enquiryCounts[indentNo] || 0;
  };

  // Load data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const historyData = enquiryData;

  // Format DOB
  const formatDOB = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear().toString().slice(-2);

    return `${day}-${month}-${year}`;
  };

  // Format interview date
  const formatInterviewDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  // Handle enquiry click
  const handleEnquiryClick = async (item = null) => {
    let indentNo = "";
    let isNewAAP = false;

    if (item) {
      // Check if maximum enquiries have been reached
      const enquiryCount = countEnquiriesForIndent(item.indent_number);
      if (enquiryCount >= item.enquiry_needed) {
        toast.error(
          `Maximum enquiries (${item.enquiry_needed}) already filled for this indent.`,
        );
        return;
      }

      setSelectedItem(item);
      indentNo = item.indent_number;
    } else {
      indentNo = await generateNextAAPNumber();
      isNewAAP = true;

      setSelectedItem({
        indent_number: indentNo,
        post: "",
        gender: "",
        prefer: "",
        no_of_post: "",
        completion_date: "",
        planned_date: "",
        experience: "",
        department: "",
      });
    }

    const candidateNo = await generateNextCandidateNumber();
    setGeneratedCandidateNo(candidateNo);
    setFormData({
      candidateName: "",
      candidateDOB: "",
      candidatePhone: "",
      candidateEmail: "",
      previousCompany: "",
      jobExperience: "",
      department: item ? item.department : "",
      previousPosition: "",
      maritalStatus: "",
      interviewDate: "",
      candidatePhoto: null,
      candidateResume: null,
      presentAddress: "",
      aadharNo: "",
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItem) {
      const enquiryCount = countEnquiriesForIndent(selectedItem.indent_number);
      if (enquiryCount >= selectedItem.enquiry_needed) {
        toast.error(
          `Cannot submit: Maximum enquiries (${selectedItem.enquiry_needed}) already filled.`,
        );
        return;
      }
    }

    if (!formData.candidateName || !formData.candidatePhone || !formData.interviewDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = "";
      let resumeUrl = "";

      // Upload photo if exists
      if (formData.candidatePhoto) {
        setUploadingPhoto(true);
        const photoPath = `${generatedCandidateNo}/photo_${Date.now()}_${formData.candidatePhoto.name
          }`;
        const photoResult = await uploadFileToStorage(
          formData.candidatePhoto,
          photoPath,
        );
        if (photoResult.success) {
          photoUrl = photoResult.url;
          toast.success("Photo uploaded successfully!");
        } else {
          throw new Error("Photo upload failed: " + photoResult.error);
        }
        setUploadingPhoto(false);
      }

      // Upload resume if exists
      if (formData.candidateResume) {
        setUploadingResume(true);
        const resumePath = `${generatedCandidateNo}/resume_${Date.now()}_${formData.candidateResume.name
          }`;
        const resumeResult = await uploadFileToStorage(
          formData.candidateResume,
          resumePath,
        );
        if (resumeResult.success) {
          resumeUrl = resumeResult.url;
          toast.success("Resume uploaded successfully!");
        } else {
          throw new Error("Resume upload failed: " + resumeResult.error);
        }
        setUploadingResume(false);
      }

      // Create timestamp
      const now = new Date();
      const timestamp = now.toISOString();

      // Prepare enquiry data
      const enquiryDataToSubmit = {
        timestamp,
        indent_number: selectedItem.indent_number,
        candidate_enquiry_number: generatedCandidateNo,
        applying_for_post: selectedItem.post,
        department: formData.department || selectedItem.department || "",
        candidate_name: formData.candidateName,
        candidate_dob: formData.candidateDOB || null,
        candidate_phone: formData.candidatePhone,
        candidate_email: formData.candidateEmail || "",
        previous_company: formData.previousCompany || "",
        job_experience: formData.jobExperience || "",
        previous_position: formData.previousPosition || "",
        marital_status: formData.maritalStatus || "",
        candidate_photo: photoUrl,
        candidate_resume: resumeUrl,
        present_address: formData.presentAddress || "",
        aadhar_no: formData.aadharNo || "",
        interview_date: formData.interviewDate || null,
      };

      const result = await createEnquiry(enquiryDataToSubmit);

      if (!result.success) {
        throw new Error(result.error || "Enquiry submission failed");
      }

      toast.success("Enquiry submitted successfully!");
      setShowModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
      setUploadingResume(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file change
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  // Filter data
  const filteredPendingData = indentData.filter((item) => {
    const matchesSearch =
      item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indent_number?.toLowerCase().includes(searchTerm.toLowerCase());
    // Only show indents where social_site_post has been set (not null, empty, or "No")
    const hasSocialSitePost =
      item.social_site_post &&
      item.social_site_post.trim() !== "" &&
      item.social_site_post.toLowerCase() !== "no";
    // Check if enquiries are not yet maxed out
    const enquiryCount = countEnquiriesForIndent(item.indent_number);
    const isNotMaxed = enquiryCount < item.enquiry_needed;
    const isCompleted = item.is_completed === true;

    return matchesSearch && hasSocialSitePost && isNotMaxed && !isCompleted;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidate_enquiry_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.indent_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (item.is_completed === true || item.is_completed === null);
  });

  const handleMarkDone = async (item) => {
    try {
      const result = await markEnquiryAsDone(item);

      if (!result.success) throw new Error(result.error);

      toast.success("Enquiry marked Done & Indent Completed");
      fetchAllData();

    } catch (err) {
      toast.error("Failed to update enquiry");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Find Enquiry</h1>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-4 text-gray-600 bg-white border border-gray-400 rounded-lg border-opacity-30 focus:outline-none focus:ring-2 bg-opacity-10 focus:ring-indigo-500"
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Post
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Number Of Enquiry
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Completion Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Planned
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && filteredPendingData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending enquiries found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => {
                      const enquiryCount = countEnquiriesForIndent(
                        item.indent_number,
                      );
                      const isMaxReached = enquiryCount >= item.enquiry_needed;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">

                              {/* Enquiry Button */}
                              <button
                                onClick={() => handleEnquiryClick(item)}
                                disabled={isMaxReached}
                                className={`px-3 py-1 text-white rounded-md text-sm ${isMaxReached
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-indigo-700 hover:bg-opacity-90"
                                  }`}
                              >
                                {isMaxReached ? "Max Reached" : "Enquiry"}
                              </button>

                              {/* ✅ Mark Done Button */}
                              <button
                                onClick={() => handleMarkDone(item)}
                                className="px-3 py-1 text-white bg-red-500 rounded-md text-sm hover:bg-red-600"
                              >
                                Done
                              </button>

                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.indent_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.post}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.department}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.gender}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.prefer || "-"} {item.experience}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${enquiryCount >= item.enquiry_needed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                                  }`}
                              >
                                {enquiryCount}/{item.enquiry_needed}
                              </span>
                              {enquiryCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  (
                                  {Math.round(
                                    (enquiryCount / item.enquiry_needed) * 100,
                                  )}
                                  %)
                                </span>
                              )}
                            </div>
                            {enquiryCount > 0 && (
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${enquiryCount >= item.enquiry_needed
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                    }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (enquiryCount / item.enquiry_needed) *
                                      100,
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.completion_date
                              ? 
                                formatDateForDisplay(item.completion_date)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {item.planned_2
                              ? formatDateForDisplay(item.planned_2)
                              : "-"}
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
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Post
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
                      Experience
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Interview Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Resume
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && filteredHistoryData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="11"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
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
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indent_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidate_enquiry_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.applying_for_post}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidate_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidate_phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidate_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.job_experience}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {formatInterviewDate(item.interview_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.candidate_photo ? (
                            <a
                              href={item.candidate_photo}
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
                          {item.candidate_resume ? (
                            <a
                              href={item.candidate_resume}
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

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
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
              <div className="p-3 mb-4 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Enquiries for {selectedItem.indent_number}:
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-blue-700">
                        {countEnquiriesForIndent(selectedItem.indent_number)}
                      </span>{" "}
                      / {selectedItem.no_of_post} filled
                    </span>
                    {selectedItem.no_of_post > 0 && (
                      <span className="text-xs text-gray-500">
                        (
                        {Math.round(
                          (countEnquiriesForIndent(selectedItem.indent_number) /
                            selectedItem.no_of_post) *
                          100,
                        )}
                        %)
                      </span>
                    )}
                  </div>
                </div>
                {selectedItem.no_of_post > 0 && (
                  <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (countEnquiriesForIndent(selectedItem.indent_number) /
                            selectedItem.no_of_post) *
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Indent No.
                  </label>
                  <input
                    type="text"
                    value={selectedItem.indent_number}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md border-opacity-30 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Candidate Enquiry No.
                  </label>
                  <input
                    type="text"
                    value={generatedCandidateNo}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md border-opacity-30 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Applying For Post
                  </label>
                  <input
                    type="text"
                    value={selectedItem.post}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    disabled
                    className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Candidate Name*
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Candidate DOB
                  </label>
                  <input
                    type="date"
                    name="candidateDOB"
                    value={formData.candidateDOB}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Candidate Phone*
                  </label>
                  <input
                    type="tel"
                    name="candidatePhone"
                    value={formData.candidatePhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    name="candidateEmail"
                    value={formData.candidateEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Previous Company
                  </label>
                  <input
                    type="text"
                    name="previousCompany"
                    value={formData.previousCompany}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Job Experience
                  </label>
                  <input
                    type="text"
                    name="jobExperience"
                    value={formData.jobExperience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Previous Position
                  </label>
                  <input
                    type="text"
                    name="previousPosition"
                    value={formData.previousPosition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Marital Status
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Aadhar No.
                  </label>
                  <input
                    type="text"
                    name="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional - Enter Aadhar number"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-500">
                  Current Address
                </label>
                <textarea
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
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
                      className="flex items-center px-4 py-2 text-gray-500 border border-gray-300 rounded-md cursor-pointer border-opacity-30 hover:bg-gray-50"
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
                        <div className="w-4 h-4 mr-2 border-2 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-500">
                          Uploading photo...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Max 10MB. Supports: JPG, JPEG, PNG, PDF, DOC, DOCX
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
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
                      className="flex items-center px-4 py-2 text-gray-500 border border-gray-300 rounded-md cursor-pointer border-opacity-30 hover:bg-gray-50"
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
                        <div className="w-4 h-4 mr-2 border-2 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-500">
                          Uploading resume...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Max 10MB. Supports: PDF, DOC, DOCX, JPG, JPEG, PNG
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md border-opacity-30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md border-opacity-30 hover:bg-gray-50"
                  disabled={submitting || uploadingPhoto || uploadingResume}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90"
                  disabled={submitting || uploadingPhoto || uploadingResume}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
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
