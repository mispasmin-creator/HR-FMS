import { supabase } from "../config/supabase";

/**
 * Fetch all active employees (those who haven't left)
 */
export const fetchJoiningEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select(`
        *,
        enquiries (
          candidate_name,
          candidate_phone,
          applying_for_post,
          department,
          candidate_photo,
          aadhar_no,
          present_address
        )
      `)
      .is("actual_leaving_date", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

  const processedData = data.map((item) => ({
  serialNumber: item.serial_no || "",
  employeeCode: item.employee_code || "",
  candidateName: item.name_as_per_aadhar || item.enquiries?.candidate_name || "",
  fatherName: item.father_name || "",
  dateOfJoining: item.date_of_joining || "",
  designation: item.designation || item.enquiries?.applying_for_post || "",

  mobileNo: item.mobile_no || item.enquiries?.candidate_phone || "",
  familyNo: item.family_mobile_no || "", // ✅ correct

  accountNo: item.current_bank_account_no || "", // ✅ FIXED
  ifsc: item.current_bank_ifsc || "",             // ✅ FIXED
  branch: item.branch_name || "",

  passbook: item.bank_passbook_photo || "",
  emailId: item.personal_email || "",
  department: item.department || item.enquiries?.department || "",
  aadharNo: item.aadhar_card_no || item.enquiries?.aadhar_no || "",
  status: "Active",
}));

    return { success: true, data: processedData };
  } catch (error) {
    console.error("Error fetching joining employees:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch all employees who have left
 */
export const fetchLeavingEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from("leaving")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const processedData = data.map((item) => ({
      timestamp: item.created_at || "",
      serialNumber: item.employee_no || "",
      employeeCode: item.employee_code || "", // Note: might need to check if 'leaving' table has employee_code
      name: item.candidate_name || "",
      dateOfLeaving: item.leaving_date || "",
      mobileNo: item.mobile_no || "",
      reasonOfLeaving: item.reason_of_leaving || "",
      firmName: item.firm_name || "",
      fatherName: item.father_name || "",
      dateOfJoining: item.date_of_joining || "",
      workingLocation: item.working_location || "",
      designation: item.designation || "",
      salary: item.salary || "",
      plannedDate: item.planned_date || "",
      actual: item.actual || "",
      status: "Leaved",
      department: item.department || "",
    }));

    return { success: true, data: processedData };
  } catch (error) {
    console.error("Error fetching leaving employees:", error);
    return { success: false, error: error.message };
  }
};
