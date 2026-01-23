import React, { useState, useEffect } from "react";
import { Search, Clock, CheckCircle, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchPendingIndentsForSocialSite,
  fetchSocialSiteHistory,
  updateSocialSiteInfo,
} from "../services/socialSiteService";

// Format date helper
const formatDateToDDMMYY = (dateString) => {
  if (!dateString || dateString.trim() === "") return "";

  try {
    let date = new Date(dateString);

    if (isNaN(date.getTime())) {
      const parts = dateString.split(/[/-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const fullYear = year < 100 ? 2000 + year : year;
        date = new Date(fullYear, month, day);
      }
    }

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatTableDate = (dateString) => {
  if (!dateString || dateString.trim() === "") return "-";
  return dateString;
};

const SocialSite = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [formData, setFormData] = useState({
    socialSite: "",
    socialSiteTypes: [],
    jobDescription: "",
  });

  // Social Site Types options
  const socialSiteOptions = [
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
  ];

  // Fetch all data from Supabase
  const fetchAllData = async () => {
    try {
      // Fetch pending indents
      const pendingResult = await fetchPendingIndentsForSocialSite();
      if (pendingResult.success) {
        setPendingData(pendingResult.data);
      } else {
        throw new Error(
          pendingResult.error || "Failed to fetch pending indents"
        );
      }

      // Fetch social site history
      const historyResult = await fetchSocialSiteHistory();
      if (historyResult.success) {
        setHistoryData(historyResult.data);
      } else {
        throw new Error(historyResult.error || "Failed to fetch history");
      }

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleActionClick = (item) => {
    setSelectedItem(item);
    setFormData({
      socialSite: item.social_site_post || "",
      socialSiteTypes:
        item.which && item.which !== "No"
          ? item.which
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [],
      jobDescription: item.job_description || "",
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

  const handleSocialSiteTypeChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialSiteTypes: checked
        ? [...prev.socialSiteTypes, value]
        : prev.socialSiteTypes.filter((type) => type !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!selectedItem || !selectedItem.id) {
        throw new Error("Invalid indent selected");
      }

      const result = await updateSocialSiteInfo(selectedItem.id, formData);

      if (!result.success) {
        throw new Error(
          result.error || "Failed to update social site information"
        );
      }

      toast.success("Social Site information updated successfully");
      setShowModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPendingData = pendingData.filter((item) => {
    const matchesSearch =
      item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indent_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indent_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Social Site</h1>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by Indent No, Company or Post..."
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
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
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
          {activeTab === "pending" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent Number
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Post
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      No. of Enquiry
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Completion Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Social Site Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && pendingData.length === 0 ? (
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
                          No pending social site data found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleActionClick(item)}
                            className={`px-3 py-1 text-white rounded-md hover:bg-opacity-90 text-sm ${
                              item.social_site_post === "Yes"
                                ? "bg-green-600"
                                : item.social_site_post === "No"
                                ? "bg-red-600"
                                : "bg-indigo-700"
                            }`}
                          >
                            {item.social_site_post ? "Edit" : "Update"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.indent_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.company}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.post}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.gender || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.prefer || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.enquiry_needed || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.completion_date
                            ? formatDateToDDMMYY(item.completion_date)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.social_site_post ? (
                            <div className="flex items-center">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.social_site_post === "Yes"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.social_site_post}
                              </span>
                              {item.which && item.which !== "No" && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({item.which})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                              Not Updated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Indent Number
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Post
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      No. of Enquiry
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Social Site Post
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Which
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Job Description
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded && historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No social site history found.
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
                          {item.company}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.post}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.gender || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.prefer || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.enquiry_needed || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.social_site_post === "Yes"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.social_site_post}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.which || "-"}
                        </td>
                        <td className="max-w-xs px-6 py-4 text-sm text-gray-900 whitespace-normal">
                          {item.job_description ? (
                            <div className="overflow-y-auto max-h-20">
                              {item.job_description}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {item.social_site_updated_at
                            ? formatDateToDDMMYY(item.social_site_updated_at)
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedItem.social_site_post
                      ? "Edit Social Site Information"
                      : "Update Social Site Information"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Current Status Info */}
                {selectedItem.social_site_post && (
                  <div className="p-3 mb-4 rounded-md bg-blue-50">
                    <div className="flex items-center">
                      <AlertCircle size={16} className="mr-2 text-blue-500" />
                      <span className="text-sm text-blue-700">
                        Currently:{" "}
                        <strong>{selectedItem.social_site_post}</strong>
                        {selectedItem.which && selectedItem.which !== "No" && (
                          <span> ({selectedItem.which})</span>
                        )}
                        {selectedItem.social_site_updated_at && (
                          <span>
                            {" "}
                            on{" "}
                            {formatDateToDDMMYY(
                              selectedItem.social_site_updated_at
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Indent Number
                    </label>
                    <input
                      type="text"
                      value={selectedItem.indent_number}
                      disabled
                      className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Social Site*
                    </label>
                    <select
                      name="socialSite"
                      value={formData.socialSite}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* Social Site Types checklist - only show when socialSite is Yes */}
                  {formData.socialSite === "Yes" && (
                    <>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Social Site Types*
                        </label>
                        <div className="p-2 space-y-2 overflow-y-auto border border-gray-300 rounded-md max-h-40">
                          {socialSiteOptions.map((option) => (
                            <div key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                id={option}
                                value={option}
                                checked={formData.socialSiteTypes.includes(
                                  option
                                )}
                                onChange={handleSocialSiteTypeChange}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <label
                                htmlFor={option}
                                className="block ml-2 text-sm text-gray-700"
                              >
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Job Description Textarea */}
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Job Description
                        </label>
                        <textarea
                          name="jobDescription"
                          value={formData.jobDescription}
                          onChange={handleInputChange}
                          placeholder="Enter job description details..."
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
                          rows={4}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter the job description details that were posted on
                          social sites.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center justify-center px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90"
                    disabled={submitting}
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
    </div>
  );
};

export default SocialSite;
