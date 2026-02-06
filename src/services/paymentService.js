import { supabase } from "../config/supabase";

/**
 * Fetch pending leaving approvals
 * (planned_leaving_date exists but actual_leaving_date is NULL)
 */
export const fetchPendingLeaving = async () => {
  try {
    // ✅ Fetch from VIEW instead of leaving table
    const { data, error } = await supabase
      .from("leaving_with_company")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = data || [];

    // ---- Bank account fallback from joining table ----
    const serials = [
      ...new Set(
        rows
          .map((r) => r.employee_no)
          .filter(Boolean)
          .map(String),
      ),
    ];

    let joiningMap = {};

    if (serials.length > 0) {
      const { data: joiningData } = await supabase
        .from("joining")
        .select("serial_no, current_bank_account_no")
        .in("serial_no", serials);

      (joiningData || []).forEach((j) => {
        joiningMap[j.serial_no] = j.current_bank_account_no || "";
      });
    }

    // ---- Map Final Data ----
    const pending = rows
      .map((item) => ({
        id: item.id,
        employeeNo: item.employee_no,
        employeeCode: item.employee_code,
        name: item.candidate_name,
        designation: item.designation,
        department: item.department,
        workingLocation: item.working_location,

        // ✅ Company from VIEW
        companyName: item.company || "",

        amount: item.amount,
        joiningDate: item.date_of_joining,
        leavingDate: item.leaving_date,
        lastWorkingDate: item.last_working_date,

        plannedPaymentDate: item.planned_payment_date,
        actualPaymentDate: item.actual_payment_date,

        plannedLeavingDate: item.planned_leaving_date,
        actualLeavingDate: item.actual_leaving_date,

        resignationReceived: item.resignation_letter_received,
        assetsHandedOver: item.asset_handover_status,
        accessRevoked: item.email_biometric_access_revoked,
        benefitRemoved: item.benefit_enrollment_removed,

        finalReleaseDate: item.final_release_date,
        payment_link: item.payment_link,

        bank_account:
          joiningMap[item.employee_no] ||
          item.current_bank_account_no ||
          item.bank_account ||
          "",
      }))
      .filter(
        (r) =>
          r.plannedPaymentDate &&
          !r.actualPaymentDate &&
          r.employeeNo,
      );

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
