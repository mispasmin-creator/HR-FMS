import { supabase } from "../config/supabase";

/**
 * Fetch all entries from the joining table
 */
export const fetchJoiningHistory = async () => {
  const { data, error } = await supabase
    .from("joining")
    .select(
      `
      *,
      enquiries!joining_candidate_enquiry_fkey (
        candidate_enquiry_number,
        candidate_name,
        candidate_email,
        candidate_phone,
        applying_for_post,
        department,
        candidate_photo,
        candidate_resume,
        indent_number
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { success: true, data };
};

/**
 * Create a new joining record
 */
/**
 * Create a new joining record
 * Handles trigger-based validation errors from prevent_over_joining trigger
 */
export const createJoiningRecord = async (joiningData) => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .insert([joiningData])
      .select();

    if (error) {
      // Handle trigger error: "Joining limit reached for indent..."
      if (error.message && error.message.includes("Joining limit reached")) {
        // Extract the details from error message
        // Error format: "Joining limit reached for indent %, allowed: %, joined: %"
        const match = error.message.match(
          /Joining limit reached for indent (\S+), allowed: (\d+), joined: (\d+)/,
        );
        if (match) {
          const [, indentNo, allowed, joined] = match;
          const userMessage = `Cannot add joining. The required number of candidates (${allowed}) have already joined for indent ${indentNo}. Current joined count: ${joined}`;
          return {
            success: false,
            error: userMessage,
            errorType: "JOINING_LIMIT_REACHED",
            details: { indentNo, allowed, joined },
          };
        } else {
          // Fallback if message format is different
          return {
            success: false,
            error:
              "Joining limit reached for this indent. No more candidates can join this position.",
            errorType: "JOINING_LIMIT_REACHED",
          };
        }
      }

      // Handle other trigger errors
      if (error.message && error.message.includes("Invalid enquiry")) {
        return {
          success: false,
          error:
            "Invalid enquiry information. Please check the candidate details.",
          errorType: "INVALID_ENQUIRY",
        };
      }

      throw error;
    }

    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creating joining record:", error);
    return {
      success: false,
      error: error.message || "Failed to create joining record",
      errorType: "UNKNOWN_ERROR",
    };
  }
};

/**
 * Fetch candidates with "Joining" status but no joining record yet
 */
export const fetchPendingJoiningCandidates = async () => {
  try {
    // First, get all enquiries with "Joining" status and their indent details
    const { data: enquiries, error: enquiryError } = await supabase
      .from("enquiries")
      .select(`
        *,
        indents:indent_number (
          company
        )
      `)
      .eq("track_status", "Joining")
      .order("created_at", { ascending: false });

    if (enquiryError) throw enquiryError;

    // Get all enquiry numbers that already have a joining record
    const { data: joiningRecords, error: joiningError } = await supabase
      .from("joining")
      .select("enquiry_no");

    if (joiningError) throw joiningError;

    const joinedEnquiryNumbers = new Set(
      joiningRecords.map((r) => r.enquiry_no),
    );

    // Filter out enquiries that already have joining records
    const pendingCandidates = enquiries.filter(
      (e) => !joinedEnquiryNumbers.has(e.candidate_enquiry_number),
    ).map(e => ({
      ...e,
      firm_name: e.indents?.company || ""
    }));

    return { success: true, data: pendingCandidates };
  } catch (error) {
    console.error("Error fetching pending joining candidates:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload file to Supabase storage for joining documents
 */
export const uploadJoiningFile = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from("joining-files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
    console.log("data", data);
    console.log("path", path);

    if (error) throw error;

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("joining-files")
      .getPublicUrl(path);

    return { success: true, url: publicData.publicUrl };
  } catch (error) {
    console.error("Error uploading joining file:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate next joining serial number
 */
export const generateNextJoiningSerial = async () => {
  try {
    const { data, error } = await supabase.from("joining").select("serial_no");

    if (error) throw error;

    let maxNumber = 0;

    // Loop through ALL records and find the highest number
    if (data && data.length > 0) {
      data.forEach((record) => {
        const match = record.serial_no.toString().match(/SN-(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }

    console.log("Max joining serial number found:", maxNumber);
    return `SN-${String(maxNumber + 1).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating joining serial:", error);
    return "SN-001";
  }
};

/**
 * Update enquiry status to 'Joined' after joining record is created.
 */
export const confirmJoining = async (enquiryNo) => {
  try {
    const { error } = await supabase
      .from("enquiries")
      .update({ track_status: "Joined" })
      .eq("candidate_enquiry_number", enquiryNo);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error confirming joining:", error);
    return { success: false, error: error.message };
  }
};
