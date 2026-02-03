import { supabase } from "../config/supabase";

/**
 * Fetch pending leaving approvals
 * (planned_leaving_date exists but actual_leaving_date is NULL)
 */
export const fetchPendingLeaving = async () => {
  try {
    const { data, error } = await supabase
      .from("leaving")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    console.log("Fetched leaving data:", data);
    // Attach bank account from `joining` table when available
    const rows = data || [];

    // collect candidate serials / employee numbers to lookup in joining
    const serials = [
      ...new Set(
        rows
          .map((r) => r.employee_no || r.employee_code || r.serial_no)
          .filter(Boolean)
          .map(String),
      ),
    ];

    let joiningMap = {};
    if (serials.length > 0) {
      // Only request the column that actually exists: current_bank_account_no
      const { data: joiningData, error: joinErr } = await supabase
        .from("joining")
        .select("serial_no, current_bank_account_no")
        .in("serial_no", serials);

      if (joinErr) {
        console.warn("Failed to fetch joining bank details:", joinErr);
      } else {
        (joiningData || []).forEach((j) => {
          joiningMap[j.serial_no] = j.current_bank_account_no || "";
        });
      }
    }

    const pending = rows
      .map((item) => ({
        id: item.id,
        employeeNo: item.employee_no,
        employeeCode: item.employee_code,
        name: item.candidate_name,
        designation: item.designation,
        department: item.department,
        workingLocation: item.working_location,
        amount: item.amount,
        joiningDate: item.date_of_joining,
        leavingDate: item.leaving_date,
        lastWorkingDate: item.last_working_date,

        // New: payment-specific planned/actual columns
        plannedPaymentDate: item.planned_payment_date,
        actualPaymentDate: item.actual_payment_date,

        // Preserve old leaving date fields for compatibility
        plannedLeavingDate: item.planned_leaving_date,
        actualLeavingDate: item.actual_leaving_date,

        resignationReceived: item.resignation_letter_received,
        assetsHandedOver: item.asset_handover_status,
        accessRevoked: item.email_biometric_access_revoked,
        benefitRemoved: item.benefit_enrollment_removed,

        finalReleaseDate: item.final_release_date,

        // Prefer joining bank account when available
        bank_account:
          joiningMap[item.employee_no] ||
          joiningMap[item.employee_code] ||
          item.current_bank_account_no ||
          item.bank_account ||
          "",
      }))
      // Show rows where planned_payment_date exists and actual_payment_date is empty
      .filter(
        (r) => r.plannedPaymentDate && !r.actualPaymentDate && r.employeeNo,
      );

    console.log("Pending leaving approvals (with bank details):", pending);
    return pending;
  } catch (error) {
    console.error("fetchPendingLeaving error:", error);
    throw error;
  }
};

/**
 * Try to set actual/payment date for the given id.
 * Attempts several common column names for compatibility.
 */
export const markPaymentById = async (id, formattedDate, remarks = "") => {
  try {
    // Mark payment on the `leaving` table by setting actual_payment_date
    const { data, error } = await supabase
      .from("leaving")
      .update({
        actual_payment_date: formattedDate,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("markPaymentById error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
