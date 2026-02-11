import { supabase } from "../config/supabase";

/**
 * Fetch leaving data (pending and history)
 */

export const fetchEmployeeForLeaving = async (employeeCode) => {
  try {
    const { data: joiningData, error } = await supabase
      .from("joining")
      .select("*")
      .eq("employee_code", employeeCode)
      .single();

    if (error || !joiningData) {
      return { success: false, error: "Employee not found or invalid code." };
    }

    const { data: leavingRecord } = await supabase
      .from("leaving")
      .select("id")
      .eq("employee_no", joiningData.serial_no)
      .maybeSingle();

    if (leavingRecord) {
      return {
        success: true,
        status: "ALREADY_LISTED",
        data: joiningData,
        error: "This employee is already listed in Leaving records.",
      };
    }

    if (joiningData.actual_leaving_date) {
      return { success: true, status: "LEFT", data: joiningData };
    }

    return { success: true, status: "ACTIVE", data: joiningData };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const fetchLeavingData = async () => {
  try {
    const { data: joiningData, error } = await supabase
      .from("joining")
      .select("*")
      .not("actual_after_joining_date", "is", null)
      .is("actual_leaving_date", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: historyData, error: historyError } = await supabase
      .from("leaving")
      .select("*")
      .order("created_at", { ascending: false });

    if (historyError) throw historyError;

    const pending = joiningData.map((item) => ({
      rowIndex: item.id,
      employeeCode: item.employee_code,
      employeeNo: item.serial_no,
      candidateName: item.name_as_per_aadhar || "",
      fatherName: item.father_name || "",
      dateOfJoining: item.date_of_joining,
      designation: item.designation || "",
      department: item.department || "",
      mobileNo: item.mobile_no || "",
      firmName: item.after_joining_company_name || "",
      workingPlace: item.after_joining_joining_place || "",
      plannedDate: item.planned_after_joining_date,
      actual: item.actual_after_joining_date,
      planned_leaving_date: item.planned_leaving_date,
      actual_leaving_date: item.actual_leaving_date,
    }));

    const history = historyData.map((item) => ({
      timestamp: item.created_at,
      employeeId: item.employee_no,
      name: item.candidate_name,
      dateOfLeaving: item.leaving_date,
      mobileNo: item.mobile_no,
      reasonOfLeaving: item.reason_of_leaving,
      firmName: item.firm_name,
      fatherName: item.father_name,
      dateOfJoining: item.date_of_joining,
      workingLocation: item.working_location,
      designation: item.designation,
      department: item.department,
    }));

    return { success: true, pending, history };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
export const searchEmployeeForLeaving = async (employeeCode) => {
  try {
    if (!employeeCode) {
      return { success: true, data: null };
    }

    const { data, error } = await supabase
      .from("joining")
      .select(
        `
        id,
        serial_no,
        employee_code,
        name_as_per_aadhar,
        father_name,
        date_of_joining,
        designation,
        department,
        mobile_no,
        after_joining_company_name,
        after_joining_joining_place
      `,
      )
      .eq("employee_code", employeeCode)
      .not("actual_after_joining_date", "is", null) // must be joined
      .is("actual_leaving_date", null) // must NOT be left
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!data) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        employeeNo: data.serial_no,
        employeeCode: data.employee_code,
        candidateName: data.name_as_per_aadhar || "",
        fatherName: data.father_name || "",
        dateOfJoining: data.date_of_joining,
        designation: data.designation || "",
        department: data.department || "",
        mobileNo: data.mobile_no || "",
        firmName: data.after_joining_company_name || "",
        workingPlace: data.after_joining_joining_place || "",
      },
    };
  } catch (error) {
    console.error("Search employee error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit leaving request
 * 1. Update joining table with leaving details
 * 2. Insert record into leaving table
 */
export const submitLeavingRequest = async (selectedItem, formData) => {
  try {
    const now = new Date().toISOString();

    // Format dates for DB if needed, but Supabase handles ISO strings better
    const formattedLeavingDate = formData.dateOfLeaving;
    const formattedLastWorkingDate = formData.lastWorkingDate;

    // 1️⃣ Mark employee as left in joining table and initialize clearance workflow
    const { error: updateError } = await supabase
      .from("joining")
      .update({
        actual_leaving_date: formData.dateOfLeaving,
        // planned_after_leaving_approval_date: now, // Initialize the clearance process
      })
      .eq("serial_no", selectedItem.employeeNo);

    if (updateError) throw updateError;

    // 2. Insert into leaving table
    const { error: insertError } = await supabase.from("leaving").insert([
      {
        employee_no: selectedItem.employeeNo,
        candidate_name: selectedItem.candidateName,
        leaving_date: formattedLeavingDate,
        mobile_no: formData.mobileNumber,
        reason_of_leaving: formData.reasonOfLeaving,
        firm_name: selectedItem.firmName,
        father_name: selectedItem.fatherName,
        date_of_joining: selectedItem.dateOfJoining,
        working_location: selectedItem.workingPlace,
        designation: selectedItem.designation,
        department: selectedItem.department,
        type_of_leave: formData.typeOfLeave,
        last_working_date: formattedLastWorkingDate,
        working_days: formData.workingDays,
        amount: formData.amount,
        created_at: now,
      },
    ]);

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error("Error submitting leaving request:", error);
    return { success: false, error: error.message };
  }
};

export const fetchLeavingHistory = async () => {
  try {
    const { data, error } = await supabase
      .from("leaving")
      .select("*")
      .order("employee_no", { ascending: false });

    if (error) throw error;

    const history = data.map((item) => ({
      employeeId: item.employee_no,
      name: item.candidate_name,
      dateOfJoining: item.date_of_joining,
      dateOfLeaving: item.leaving_date,
      designation: item.designation,
      department: item.department,
      amount: item.amount,
      workingDays: item.working_days,
      reasonOfLeaving: item.reason_of_leaving,
      paymentLink: item.payment_link,
    }));

    return { success: true, history };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
