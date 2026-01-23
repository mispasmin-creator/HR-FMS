import { supabase } from "../config/supabase";

// Fetch all indents with pending status
export const fetchPendingIndents = async () => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching pending indents:", error);
    return { success: false, error: error.message };
  }
};

// Fetch all enquiries
export const fetchAllEnquiries = async () => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return { success: false, error: error.message };
  }
};

// Create new enquiry
export const createEnquiry = async (enquiryData) => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .insert([enquiryData])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creating enquiry:", error);
    return { success: false, error: error.message };
  }
};

// Count enquiries for an indent
export const countEnquiriesForIndent = async (indentNumber) => {
  try {
    const { count, error } = await supabase
      .from("enquiries")
      .select("*", { count: "exact", head: true })
      .eq("indent_number", indentNumber);

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error("Error counting enquiries:", error);
    return { success: false, error: error.message };
  }
};

// Get enquiries for a specific indent
export const getEnquiriesForIndent = async (indentNumber) => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .eq("indent_number", indentNumber);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching enquiries for indent:", error);
    return { success: false, error: error.message };
  }
};

// Generate next candidate enquiry number
export const generateNextCandidateNumber = async () => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select("candidate_enquiry_number")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    let maxNumber = 0;
    if (data && data.length > 0) {
      const lastNumber = data[0].candidate_enquiry_number;
      const match = lastNumber.toString().match(/ENQ-(\d+)/i);
      if (match && match[1]) {
        maxNumber = parseInt(match[1], 10);
      }
    }

    return `ENQ-${String(maxNumber + 1).padStart(2, "0")}`;
  } catch (error) {
    console.error("Error generating candidate number:", error);
    return "ENQ-01";
  }
};

// Generate next AAP indent number
export const generateNextAAPNumber = async () => {
  try {
    const { data: indentData, error: indentError } = await supabase
      .from("indents")
      .select("indent_number");

    const { data: enquiryData, error: enquiryError } = await supabase
      .from("enquiries")
      .select("indent_number");

    if (indentError || enquiryError) throw indentError || enquiryError;

    const allIndentNumbers = [
      ...(indentData || []).map((item) => item.indent_number),
      ...(enquiryData || []).map((item) => item.indent_number),
    ].filter(Boolean);

    let maxAAPNumber = 0;
    allIndentNumbers.forEach((indentNo) => {
      const match = indentNo.match(/^AAP-(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxAAPNumber) {
          maxAAPNumber = num;
        }
      }
    });

    const nextNumber = maxAAPNumber + 1;
    return `AAP-${String(nextNumber).padStart(2, "0")}`;
  } catch (error) {
    console.error("Error generating AAP number:", error);
    return "AAP-01";
  }
};

// Update indent status
export const updateIndentStatus = async (indentNumber, status) => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .update({ status })
      .eq("indent_number", indentNumber)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error updating indent status:", error);
    return { success: false, error: error.message };
  }
};

// Upload file to Supabase storage
export const uploadFileToStorage = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from("enquiry-files")
      .upload(path, file);

    if (error) throw error;

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("enquiry-files")
      .getPublicUrl(path);

    return { success: true, url: publicData.publicUrl };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }
};

// ... existing code ...

// Fetch enquiries where indent has actual_2 and planned_2 not null
export const fetchEnquiriesWithCompletedIndents = async () => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select(
        `
        *,
        indents!inner (
          indent_number,
          actual_2,
          planned_2
        )
      `
      )
      .not("indents.actual_2", "is", null)
      .not("indents.planned_2", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching history enquiries:", error);
    return { success: false, error: error.message };
  }
};
