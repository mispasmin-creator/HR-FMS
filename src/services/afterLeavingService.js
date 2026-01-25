import { supabase } from "../config/supabase";

/**
 * Fetch all data for the after-leaving process tracker
 */
export const fetchAfterLeavingProcessData = async () => {
  console.log("Fetching after leaving process data...");
  try {
    const { data, error } = await supabase
      .from("joining")
      .select(
        `
    *,
    enquiries (
      candidate_name,
      applying_for_post,
      department
    )
  `,
      )
      .not("actual_after_joining_date", "is", null)
      .order("created_at", { ascending: false });

    console.log("Data fetched successfully");
    console.log(data);
    if (error) throw error;

    const processedData = data.map((item) => ({
      // Basic Info
      id: item.id,
      serialNumber: item.serial_no,
      employeeCode: item.employee_code || "",
      name: item.name_as_per_aadhar || item.enquiries?.candidate_name || "",
      fatherName: item.father_name || item.enquiries?.father_name || "",
      dateOfJoining: item.date_of_joining,
      LeavingDate: item.actual_leaving_date || "",
      designation: item.designation || item.enquiries?.applying_for_post || "",
      department: item.department || item.enquiries?.department || "",
      reportingOfficer: item.reporting_officer || "",
      assignAssets: item.laptop || item.mobile || item.asset1_name || "", // Simplified legacy field

      // Approval System
      approvalPlanned:
        item.planned_after_leaving_approval_date ||
        item.actual_leaving_date ||
        "",
      approvalActual: item.actual_after_leaving_approval_date || "",
      approvalStatus: item.after_leaving_approval_status || "",
      approvalRemarks: item.after_leaving_approval_remarks || "",

      // Reporting Manager
      reportingManagerPlanned:
        item.planned_reporting_manager_approval_date || "",
      reportingManagerActual: item.actual_reporting_manager_approval_date || "",
      reportingManagerStatus: item.reporting_manager_approval_status || "",
      reportingManagerRemarks: item.reporting_manager_remarks || "",
      reportingManagerProcessType: item.reporting_manager_process_type || "",
      reportingManagerTempBackup: item.reporting_manager_temp_backup_name || "",

      // IT Department
      itDeptPlanned: item.planned_it_clearance_date || "",
      itDeptActual: item.actual_it_clearance_date || "",
      itDeptSummary: item.it_clearance_summary || "",

      // Admin Department
      adminDeptPlanned: item.planned_admin_clearance_date || "",
      adminDeptActual: item.actual_admin_clearance_date || "",
      adminDeptSummary: item.admin_clearance_summary || "",

      // Account Department
      accountDeptPlanned: item.planned_account_clearance_date || "",
      accountDeptActual: item.actual_account_clearance_date || "",
      accountDeptSummary: item.account_clearance_summary || "",

      // Store Department
      storeDeptPlanned: item.planned_store_clearance_date || "",
      storeDeptActual: item.actual_store_clearance_date || "",
      storeDeptSummary: item.store_clearance_summary || "",
    }));

    return { success: true, data: processedData };
  } catch (error) {
    console.error("Error fetching after leaving process data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a specific stage in the after-leaving process
 */
export const updateAfterLeavingStage = async (
  employeeId,
  stage,
  updateData,
) => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .update(updateData)
      .eq("id", employeeId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error(`Error updating ${stage} stage:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Create an indent record (specifically for Reporting Manager stage)
 */
export const createIndentRecord = async (indentData) => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .insert([indentData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating indent record:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch master data (departments, social sites)
 */
export const fetchAfterLeavingMasterData = async () => {
  try {
    const { data, error } = await supabase.from("master").select("*");
    if (error) throw error;

    // Extract unique departments
    const departments = [
      ...new Set(data.map((item) => item.department).filter(Boolean)),
    ];

    // Extract social sites (based on common keywords)
    const socialSites = [
      ...new Set(
        data
          .map((item) => {
            // This is a bit heuristic, but matches the Google Sheets logic
            const val = item.social_site || item.source;
            return val;
          })
          .filter(Boolean),
      ),
    ];

    return { success: true, departments, socialSites };
  } catch (error) {
    console.error("Error fetching master data:", error);
    return { success: false, error: error.message };
  }
};
