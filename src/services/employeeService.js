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
          present_address,
          indents:indent_number (
            company
          )
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
      aadharPhoto: item.aadhar_front_photo || "",
      candidatePhoto: item.candidate_photo || item.enquiries?.candidate_photo || "",
      address: item.current_address || item.enquiries?.present_address || "",
      dateOfBirth: item.dob_as_per_aadhar || "",
      gender: item.gender || "",
      mobileNo: item.mobile_no || item.enquiries?.candidate_phone || "",
      familyNo: item.family_mobile_no || "",
      relationshipWithFamily: item.relationship_with_family || "",
      accountNo: item.current_bank_account_no || "",
      ifsc: item.current_bank_ifsc || "",
      branch: item.branch_name || "",
      passbook: item.bank_passbook_photo || "",
      emailId: item.personal_email || "",
      department: item.department || item.enquiries?.department || "",
      aadharNo: item.aadhar_card_no || item.enquiries?.aadhar_no || "",
      companyName: item.after_joining_company_name || item.joining_company_name || item.enquiries?.indents?.company || "",
      status: "Active",
    }));

    return { success: true, data: processedData };
  } catch (error) {
    console.error("Error fetching joining employees:", error);
    return { success: false, error: error.message };
  }
};

export const fetchLeavingEmployees = async () => {
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
          indents:indent_number (
            company
          )
        )
      `)
      .not("actual_leaving_date", "is", null)
      .order("actual_leaving_date", { ascending: false });

    if (error) throw error;

    // Fetch reason_of_leaving from the separate leaving table
    const { data: leavingDocs, error: leavingError } = await supabase
      .from("leaving")
      .select("employee_no, reason_of_leaving");

    const reasonMap = {};
    if (!leavingError && leavingDocs) {
      leavingDocs.forEach(doc => {
        reasonMap[doc.employee_no] = doc.reason_of_leaving;
      });
    }

    const processedData = data.map((item) => ({
      timestamp: item.created_at || "",
      serialNumber: item.serial_no || "",
      employeeCode: item.employee_code || "",
      name: item.name_as_per_aadhar || item.enquiries?.candidate_name || "",
      dateOfLeaving: item.actual_leaving_date || "",
      mobileNo: item.mobile_no || item.enquiries?.candidate_phone || "",
      reasonOfLeaving: reasonMap[item.serial_no] || "",
      companyName: item.after_joining_company_name || item.joining_company_name || item.enquiries?.indents?.company || "",
      fatherName: item.father_name || "",
      dateOfJoining: item.date_of_joining || "",
      designation: item.designation || item.enquiries?.applying_for_post || "",
      status: "Leaved",
      department: item.department || item.enquiries?.department || "",
    }));

    return { success: true, data: processedData };
  } catch (error) {
    console.error("Error fetching leaving employees:", error);
    return { success: false, error: error.message };
  }
};
