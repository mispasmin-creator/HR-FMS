import { supabase } from "../config/supabase";

/**
 * Fetch all SIES employees
 */
export const fetchSiesEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from("sies_employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { 
      success: true, 
      data: data.map(item => ({
        id: item.id,
        serialNo: item.serial_no || "",
        employeeId: item.employee_id || "",
        name: item.name || "",
        designation: item.designation || "",
        salary: item.salary || "0",
        aadhaarCardNo: item.aadhaar_card_no || "",
        panCardNo: item.pan_card_no || "",
        address: item.address || "",
        joinDate: item.join_date || "",
        mobileNo: item.mobile_no || "",
        status: item.status || "Active"
      }))
    };
  } catch (error) {
    console.error("Error fetching SIES employees:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a new SIES employee
 */
export const addSiesEmployee = async (employeeData) => {
  try {
    // Generate next employee ID if not provided
    if (!employeeData.employee_id) {
      employeeData.employee_id = await generateNextSiesEmployeeId();
    }

    // Get current max serial no
    const { data: maxSerialData, error: maxSerialError } = await supabase
      .from("sies_employees")
      .select("serial_no")
      .order("serial_no", { ascending: false })
      .limit(1);

    if (maxSerialError) throw maxSerialError;
    
    const nextSerialNo = (maxSerialData && maxSerialData.length > 0) 
      ? (parseInt(maxSerialData[0].serial_no) || 0) + 1 
      : 1;

    const recordToInsert = {
      serial_no: nextSerialNo,
      employee_id: employeeData.employee_id,
      name: employeeData.name,
      designation: employeeData.designation,
      salary: employeeData.salary,
      aadhaar_card_no: employeeData.aadhaarCardNo,
      pan_card_no: employeeData.panCardNo,
      address: employeeData.address,
      join_date: employeeData.joinDate,
      mobile_no: employeeData.mobileNo,
      status: "Active"
    };

    const { data, error } = await supabase
      .from("sies_employees")
      .insert([recordToInsert])
      .select();

    if (error) throw error;
    return { success: true, data: data[0], employeeId: recordToInsert.employee_id };
  } catch (error) {
    console.error("Error adding SIES employee:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate next SIES employee ID (SIES-001)
 */
export const generateNextSiesEmployeeId = async () => {
  try {
    const { data, error } = await supabase
      .from("sies_employees")
      .select("employee_id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastId = data[0].employee_id;
      const match = lastId.match(/SIES-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }

    return `SIES-${String(nextNum).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating SIES ID:", error);
    return "SIES-001";
  }
};

/**
 * Mark SIES employee as inactive (relieve)
 */
export const updateSiesEmployeeStatus = async (employeeId, status) => {
  try {
    const { data, error } = await supabase
      .from("sies_employees")
      .update({ status: status })
      .eq("employee_id", employeeId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error updating SIES employee status:", error);
    return { success: false, error: error.message };
  }
};
