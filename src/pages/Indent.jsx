import React, { useEffect, useState, useCallback, useRef } from "react";
import { HistoryIcon, Plus, X, Download } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  fetchAllIndents,
  createIndent,
  generateNextIndentNumber,
} from "../services/indentService";

const Indent = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    post: "",
    gender: "",
    company: "",
    department: "",
    prefer: "",
    numberOfPost: "",
    completionDate: "",
    indentNumber: "",
    timestamp: "",
    experience: "",
    enquiry: "",
  });

  const [indentData, setIndentData] = useState([]);
  const [filteredIndentData, setFilteredIndentData] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const dataFetchedRef = useRef(false);

  // Fetch indents from Supabase
  const loadIndentsFromSupabase = useCallback(async () => {
    try {
      const result = await fetchAllIndents();
      if (result.success) {
        setIndentData(result.data);
        // Initial filter - hide completed entries
        const filtered = result.data.filter(
          (item) =>
            ![
              "Complete",
              "complete",
              "Completed",
              "completed",
              "COMPLETE",
            ].includes(item.status)
        );
        setFilteredIndentData(filtered);
      } else {
        console.error("Error loading data:", result.error);
        toast.error("Failed to load indent data");
      }
    } catch (error) {
      console.error("Error in loadIndentsFromSupabase:", error);
      toast.error("Error loading indent data");
    } finally {
      setIsInitialLoad(false);
      dataFetchedRef.current = true;
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    if (dataFetchedRef.current) return;
    loadIndentsFromSupabase();
  }, [loadIndentsFromSupabase]);

  // Update filtered data when showCompleted changes
  useEffect(() => {
    if (showCompleted) {
      setFilteredIndentData(indentData);
    } else {
      const filtered = indentData.filter(
        (item) =>
          ![
            "Complete",
            "complete",
            "Completed",
            "completed",
            "COMPLETE",
          ].includes(item.status)
      );
      setFilteredIndentData(filtered);
    }
  }, [showCompleted, indentData]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    try {
      const dataToExport =
        filteredIndentData.length > 0 ? filteredIndentData : indentData;

      if (dataToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      const excelData = dataToExport.map((item, index) => ({
        "S.No": index + 1,
        "Indent Number": item.indent_number || "",
        Company: item.company || "",
        Post: item.post || "",
        Gender: item.gender || "",
        Department: item.department || "",
        Prefer: item.prefer || "",
        Experience: item.experience || "",
        "No. of Post": item.no_of_post || "",
        "No. of Enquiry": item.enquiry || "",
        "Pending Post": item.pending_post || "",
        "Total Joined": item.total_joined || "",
        "Completion Date": item.completion_date || "",
        "Planned Date": item.planned_1 || "",
        Status: item.status || "Not Set",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Indent Data");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:]/g, "-");
      const filename = `Indent_Data_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${dataToExport.length} records to Excel`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  }, [filteredIndentData, indentData]);

  // Get current timestamp
  const getCurrentTimestamp = useCallback(() => {
    return new Date().toISOString();
  }, []);

  // Format date for database
  const formatDateForDatabase = useCallback((dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Better validation - trim and check for actual values
      const hasPost = formData.post && formData.post.trim() !== "";
      const hasGender = formData.gender && formData.gender.trim() !== "";
      const hasCompany = formData.company && formData.company.trim() !== "";
      const hasNumberOfPost =
        formData.numberOfPost !== "" &&
        formData.numberOfPost !== null &&
        formData.numberOfPost !== undefined &&
        parseInt(formData.numberOfPost) > 0;
      const hascompletionDate =
        formData.completionDate && formData.completionDate.trim() !== "";

      if (
        !hasPost ||
        !hasGender ||
        !hasCompany ||
        !hasNumberOfPost ||
        !hascompletionDate
      ) {
        toast.error("Please fill all required fields");
        console.log("Validation failed:", {
          post: formData.post,
          gender: formData.gender,
          company: formData.company,
          numberOfPost: formData.numberOfPost,
          completionDate: formData.completionDate,
        });
        return;
      }

      if (formData.prefer === "Experience" && !formData.experience) {
        toast.error("Please enter experience details");
        return;
      }

      try {
        setSubmitting(true);
        const indentNumber = await generateNextIndentNumber();
        const timestamp = getCurrentTimestamp();
        const formattedDate = formatDateForDatabase(formData.completionDate);

        // Prepare data matching original column structure
        const newIndent = {
          timestamp,
          indent_number: indentNumber,
          company: formData.company,
          post: formData.post,
          gender: formData.gender,
          prefer: formData.prefer || "Any",
          no_of_post: parseInt(formData.numberOfPost) || 0,
          enquiry_needed: parseInt(formData.enquiry) || 0, // Add this line
          completion_date: formattedDate,
          department: formData.department || null,
          experience:
            formData.prefer === "Experience" ? formData.experience : null,

          // planned_date: null,
          // actual_1: null,
          // tl: null,
          // column_o: null,
          // column_p: null,
          // column_q: null,
          // column_r: null,
          // column_s: null,
          // enquiry: parseInt(formData.enquiry) || 0,
          // column_u: null,
          // pending_post: null,
          // total_joined: null,
        };

        const result = await createIndent(newIndent);

        if (result.success) {
          toast.success("Indent created successfully!");
          setFormData({
            post: "",
            company: "",
            gender: "",
            department: "",
            prefer: "",
            numberOfPost: "",
            completionDate: "",
            status: "",
            indentNumber: "",
            timestamp: "",
            experience: "",
            enquiry: "",
          });
          setShowModal(false);

          // Refresh data
          await loadIndentsFromSupabase();
        } else {
          toast.error(
            "Failed to create indent: " + (result.error || "Unknown error")
          );
        }
      } catch (error) {
        console.error("Submit error:", error);
        toast.error("Something went wrong!");
      } finally {
        setSubmitting(false);
      }
    },
    [
      formData,
      getCurrentTimestamp,
      formatDateForDatabase,
      loadIndentsFromSupabase,
    ]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setFormData({
      post: "",
      gender: "",
      department: "",
      prefer: "",
      numberOfPost: "",
      completionDate: "",
      status: "",
      indentNumber: "",
      timestamp: "",
      experience: "",
      enquiry: "",
    });
    setShowModal(false);
  }, []);

  // Format date for display
  const formatDisplayDate = useCallback((dateValue) => {
    if (!dateValue) return "—";

    try {
      if (typeof dateValue === "string" && dateValue.includes("/")) {
        const parts = dateValue.split(" ");
        const datePart = parts[0];
        const [day, month, year] = datePart.split("/");
        if (day && month && year) return `${day}/${month}/${year}`;
      }

      const date = new Date(dateValue);
      if (!date || isNaN(date.getTime())) return dateValue;

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateValue;
    }
  }, []);

  return (
    <div className="p-6 space-y-6 page-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Indent</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 transition-all duration-200 border border-green-600 rounded-md hover:bg-green-50"
            title="Export to Excel"
          >
            <Download size={16} className="mr-2" />
            Export Excel
          </button>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${
              showCompleted
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <HistoryIcon size={16} className="mr-2" />
            {showCompleted
              ? `Showing All (${indentData.length})`
              : `Showing Active (${filteredIndentData.length}/${indentData.length})`}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
          >
            <Plus size={16} className="mr-2" />
            Create Indent
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Create New Indent
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Post*
                </label>
                <input
                  type="text"
                  name="post"
                  value={formData.post}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Company<span className="text-red-500">*</span>
                </label>
                <select
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="" disabled>
                    Select a company
                  </option>
                  <option value="Pmmpl">Pmmpl</option>
                  <option value="Purab">Purab</option>
                  <option value="Rkl">Rkl</option>
                  <option value="Refratech">Refratech</option>
                  <option value="Refrasynth">Refrasynth</option>
                  <option value="Pasmin Llp">Pasmin Llp</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Gender*
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  name="prefer"
                  value={formData.prefer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any</option>
                  <option value="Experience">Experience</option>
                  <option value="Fresher">Fresher</option>
                </select>
              </div>

              {formData.prefer === "Experience" && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Experience*
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter experience details"
                    required={formData.prefer === "Experience"}
                  />
                </div>
              )}

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Number Of Enquiry*
                </label>
                <input
                  type="number"
                  name="enquiry"
                  value={formData.enquiry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of enquiries"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  No. of Post
                </label>
                <input
                  type="number"
                  name="numberOfPost"
                  value={formData.numberOfPost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of posts"
                  min="0"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Completion Date*
                </label>
                <input
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 transition-all duration-200 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center px-4 py-2 text-white transition-all duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700"
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
                      Processing...
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

      {/* Info Card */}
      <div className="p-6 bg-white border shadow-lg rounded-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Indent Management
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-green-500 rounded-full"></div>
            <span>Active Indents: {filteredIndentData.length}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-purple-500 rounded-full"></div>
            <span>
              Completed: {indentData.length - filteredIndentData.length}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-blue-500 rounded-full"></div>
            <span>Total: {indentData.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 shadow">
              <thead className="sticky top-0 z-10 bg-gray-50">
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
                    Department
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Prefer
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    No. of Enquiry
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    No. of Post
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Pending Post
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Total Joined
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Completion Date
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isInitialLoad ? (
                  <tr>
                    <td
                      colSpan="14"
                      className="px-6 py-8 text-sm text-center text-gray-500"
                    >
                      Loading indent data...
                    </td>
                  </tr>
                ) : filteredIndentData.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="px-6 py-12 text-center">
                      <p className="text-gray-500">
                        {showCompleted
                          ? "No indent data found."
                          : "No active indent data found."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredIndentData.map((item, index) => (
                    <tr
                      key={`${item.id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {item.indent_number || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.company || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.post || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.gender || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.department || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.prefer || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.experience || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.enquiry_needed || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.no_of_post || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.pending_post || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {item.total_joined || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDisplayDate(item.completion_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            !item.status || item.status === ""
                              ? "bg-gray-100 text-gray-800"
                              : item.status === "NeedMore"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "Fulfilled"
                              ? "bg-green-100 text-green-800"
                              : item.status === "InProgress"
                              ? "bg-blue-100 text-blue-800"
                              : [
                                  "Complete",
                                  "complete",
                                  "Completed",
                                  "completed",
                                  "COMPLETE",
                                ].includes(item.status)
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.status || "Not Set"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Indent;
