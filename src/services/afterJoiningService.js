import { supabase } from "../config/supabase";

/**
 * Fetch after joining data (pending and history)
 */
export const fetchAfterJoiningData = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get enquiry data separately to avoid relationship conflicts
    const enquiryNumbers = [
      ...new Set(data.map((item) => item.enquiry_no).filter(Boolean)),
    ];

    let enquiryDataMap = {};
    if (enquiryNumbers.length > 0) {
      const { data: enquiries, error: enquiryError } = await supabase
        .from("enquiries")
        .select("*")
        .in("candidate_enquiry_number", enquiryNumbers);

      if (!enquiryError && enquiries) {
        enquiries.forEach((e) => {
          enquiryDataMap[e.candidate_enquiry_number] = e;
        });
      }
    }

    const processedData = data.map((item) => {
      const enquiry = enquiryDataMap[item.enquiry_no];

      return {
        // identifiers
        joiningNo: item.serial_no,
        enquiryNo: item.enquiry_no,

        // basic details
        candidateName: item.name_as_per_aadhar || enquiry?.candidate_name || "",
        fatherName: item.father_name || "",
        dateOfJoining: item.date_of_joining,
        designation: item.designation || enquiry?.applying_for_post || "",
        department: item.department || enquiry?.department || "",

        // address & contact
        currentAddress: item.current_address || enquiry?.present_address || "",
        mobileNo: item.mobile_no || enquiry?.candidate_phone || "",
        personalEmail: item.personal_email || enquiry?.candidate_email || "",

        // after joining tracking
        plannedDate: item.planned_after_joining_date,
        actual: item.actual_after_joining_date,

        // after joining form fields
        employeeCode: item.employee_code || "",
        salaryConfirmation: item.salary_confirmation || "",
        reportingOfficer: item.reporting_officer || "",
        baseAddress: item.base_address || "",
        punchCode: item.punch_code || "",
        emailId: item.email_id || "",
        emailPassword: item.official_email_password || "",

        // bank / PF
        currentBankAccountNo: item.current_bank_account_no || "",
        currentBankIfsc: item.current_bank_ifsc || "",
        pf: item.pf || "",
        pfEligible: item.eligible_for_pf || "",
        esicEligible: item.eligible_for_esic || "",

        // documents
        idProofCopy: item.id_proof_copy || "",
        joiningLetter: item.joining_letter || "",
        interviewAssessmentSheet: item.interview_assessment_sheet || "",
        manualImage: item.manual_image || "",

        // assets
        laptop: item.laptop || "",
        laptopImage: item.laptop_image || "",
        mobile: item.mobile || "",
        mobileImage: item.mobile_image || "",
        asset1Name: item.asset1_name || "",
        asset1Image: item.asset1_image || "",
        asset2Name: item.asset2_name || "",
        asset2Image: item.asset2_image || "",
        asset3Name: item.asset3_name || "",
        asset3Image: item.asset3_image || "",

        // misc
        incentiveCategory: item.incentive_category || "",
        attendanceMode: item.after_joining_attendance_mode || "",
        afterJoiningDepartment: item.after_joining_department || "",
        remarks: item.remarks || "",
        joiningPlace: item.after_joining_joining_place || "",
        nextSalaryIncrementDate: item.next_salary_increment_date || "",
        companyName: item.after_joining_company_name || "",

        // personal
        bloodGroup: item.blood_group || "",
        identificationMarks: item.identification_marks || "",
        salaryAmount: item.salary || "",

        // leaving status
        leavingDate: item.actual_leaving_date || null,
      };
    });

    const pending = processedData.filter((r) => !r.actual);
    const history = processedData.filter((r) => r.actual && !r.leavingDate);

    return { success: true, pending, history };
  } catch (error) {
    console.error("Error fetching after joining data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing joining record
 */
export const updateAfterJoiningRecord = async (serialNo, updateData) => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .update(updateData)
      .eq("serial_no", serialNo)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating joining record:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload files to Supabase storage
 */
export const uploadAfterJoiningFile = async (file, path) => {
  try {
    const { error } = await supabase.storage
      .from("after-joining-files")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from("after-joining-files")
      .getPublicUrl(path);

    return { success: true, url: data.publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate next employee code (PMMPL-XXX)
 */
export const generateNextEmployeeCode = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select("employee_code")
      .not("employee_code", "is", null)
      .neq("employee_code", "");

    if (error) throw error;

    let maxNumber = 0;

    data.forEach((row) => {
      const match = row.employee_code?.match(/PMMPL-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    return `PMMPL-${String(maxNumber + 1).padStart(3, "0")}`;
  } catch (error) {
    console.error("Employee code error:", error);
    return "PMMPL-001";
  }
};

/**
 * Fetch reporting officers
 */
export const fetchReportingOfficers = async () => {
  try {
    const { data, error } = await supabase
      .from("master")
      .select("reporting_officer");

    if (error) throw error;

    const officers = [
      ...new Set(data.map((row) => row.reporting_officer).filter(Boolean)),
    ];

    return { success: true, data: officers };
  } catch (error) {
    console.error("Error fetching reporting officers:", error);
    return { success: false, data: [] };
  }
};

/**
 * Fetch departments
 */
export const fetchDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select("department")
      .not("department", "is", null)
      .neq("department", "");

    if (error) throw error;

    return {
      success: true,
      data: [...new Set(data.map((r) => r.department))],
    };
  } catch {
    return { success: true, data: [] };
  }
};

/**
 * Fetch designations
 */
export const fetchDesignations = async () => {
  try {
    const { data, error } = await supabase
      .from("master_2")
      .select("designation")
      .not("designation", "is", null)
      .neq("designation", "");

    if (error) throw error;

    return {
      success: true,
      data: [...new Set(data.map((r) => r.designation))].sort(),
    };
  } catch (error) {
    console.error("Error fetching designations from master_2:", error);
    return { success: false, error: error.message };
  }
};
