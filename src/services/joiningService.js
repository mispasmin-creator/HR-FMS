import { supabase } from "../config/supabase";

/**
 * Fetch all entries from the joining table
 */
export const fetchJoiningHistory = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select(`
        *,
        enquiries!inner (
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
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching joining history:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new joining record
 */
export const createJoiningRecord = async (joiningData) => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .insert([joiningData])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creating joining record:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch candidates with "Joining" status but no joining record yet
 */
export const fetchPendingJoiningCandidates = async () => {
  try {
    // First, get all enquiries with "Joining" status
    const { data: enquiries, error: enquiryError } = await supabase
      .from("enquiries")
      .select("*")
      .eq("track_status", "Joining");

    if (enquiryError) throw enquiryError;

    // Get all enquiry numbers that already have a joining record
    const { data: joiningRecords, error: joiningError } = await supabase
      .from("joining")
      .select("enquiry_no");

    if (joiningError) throw joiningError;

    const joinedEnquiryNumbers = new Set(joiningRecords.map(r => r.enquiry_no));

    // Filter out enquiries that already have joining records
    const pendingCandidates = enquiries.filter(e => !joinedEnquiryNumbers.has(e.candidate_enquiry_number));

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
        cacheControl: '3600',
        upsert: true
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
    const { data, error } = await supabase
      .from("joining")
      .select("serial_no")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    let maxNumber = 0;
    if (data && data.length > 0) {
      const lastSerial = data[0].serial_no;
      const match = lastSerial.toString().match(/SN-(\d+)/i);
      if (match && match[1]) {
        maxNumber = parseInt(match[1], 10);
      }
    }

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
            .from('enquiries')
            .update({ track_status: 'Joined' })
            .eq('candidate_enquiry_number', enquiryNo);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error confirming joining:', error);
        return { success: false, error: error.message };
    }
};
