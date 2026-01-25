import { supabase } from "../config/supabase";

// Fetch enquiries for pending calls (where planned date exists but actual is null)
export const fetchPendingEnquiries = async () => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select(
        `
        *,
        indents!inner(
          indent_number,
          department
        )
      `,
      )
      .not("planned", "is", null)
      .is("actual", null) // ✅ correct column
      .order("created_at", { ascending: false });

    if (error) throw error;
    console.log("Fetched Pending Enquiries:", data);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching pending enquiries:", error);
    return { success: false, error: error.message };
  }
};

// Fetch all call tracker entries (follow-up history)
export const fetchCallTrackerHistory = async () => {
  try {
    const { data, error } = await supabase
      .from("call_tracker")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching call tracker history:", error);
    return { success: false, error: error.message };
  }
};

// Create a new call tracker entry
export const createCallTrackerEntry = async (entryData) => {
  try {
    const { data, error } = await supabase
      .from("call_tracker")
      .insert([entryData])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creating call tracker entry:", error);
    return { success: false, error: error.message };
  }
};

// Update enquiry when status is "Joining"
export const updateEnquiryOnJoining = async (enquiryNumber) => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .update({
        actual: new Date().toISOString(),
        track_status: "Joining",
      })
      .eq("candidate_enquiry_number", enquiryNumber)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error updating enquiry on joining:", error);
    return { success: false, error: error.message };
  }
};

// Get enquiry details by enquiry number
export const getEnquiryByNumber = async (enquiryNumber) => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select(
        `
        *,
        indents!inner (
          indent_number,
          department
        )
      `,
      )
      .eq("candidate_enquiry_number", enquiryNumber)
      .single();

    if (error) throw error;
    return { success: true, data: data };
  } catch (error) {
    console.error("Error fetching enquiry:", error);
    return { success: false, error: error.message };
  }
};
