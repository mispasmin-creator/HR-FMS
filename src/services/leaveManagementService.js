import { supabase } from "../config/supabase";

/**
 * Fetch all leave requests (Pending, Approved, Rejected)
 */
export const fetchLeaveManagementData = async () => {
  try {
    const { data, error } = await supabase
      .from("leave_management")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const processedData = data.map((item) => ({
      timestamp: item.created_at,
      serialNo: item.serial_no,
      employeeCode: item.employee_code,
      employeeName: item.employee_name,
      startDate: item.start_date,
      endDate: item.end_date,
      remark: item.reason,
      status: item.status,
      leaveType: item.leave_type,
      hodName: item.hod_name,
      designation: item.designation,
      approvedBy: item.approved_by,
    }));

    return {
      success: true,
      pending: processedData.filter((l) => l.status?.toLowerCase() === "pending"),
      approved: processedData.filter((l) => l.status?.toLowerCase() === "approved"),
      rejected: processedData.filter((l) => l.status?.toLowerCase() === "rejected"),
      all: processedData
    };
  } catch (error) {
    console.error("Error fetching leave management data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit a new leave request
 */
export const submitLeaveRequest = async (leaveData) => {
  try {
    const { data, error } = await supabase
      .from("leave_management")
      .insert([
        {
          employee_code: leaveData.employeeCode,
          employee_name: leaveData.employeeName,
          start_date: leaveData.fromDate,
          end_date: leaveData.toDate,
          reason: leaveData.reason,
          status: "Pending",
          leave_type: leaveData.leaveType,
          hod_name: leaveData.hodName,
          designation: leaveData.designation,
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error submitting leave request:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update leave request status (Approve/Reject)
 */
export const updateLeaveStatus = async (serialNo, status, updateData = {}) => {
  try {
    const { data, error } = await supabase
      .from("leave_management")
      .update({
        status: status,
        ...updateData
      })
      .eq("serial_no", serialNo)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating leave status:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch HOD names from Master table
 */
export const fetchHodNames = async () => {
  try {
    const { data, error } = await supabase
      .from("master")
      .select("hod_name")
      .not("hod_name", "is", null);

    if (error) throw error;

    const names = [...new Set(data.map((item) => item.hod_name))].sort();
    return { success: true, data: names };
  } catch (error) {
    console.error("Error fetching HOD names:", error);
    return { success: false, error: error.message };
  }
};
