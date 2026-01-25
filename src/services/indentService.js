import { supabase } from "../config/supabase";

// Fetch all indent records
export const fetchAllIndents = async () => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("*")
      .order("created_at", { ascending: false }); // Use created_at instead

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching indents:", error);
    return { success: false, error: error.message };
  }
};

// Create new indent
export const createIndent = async (indentData) => {
  try {
    // Ensure status is set to pending by default
    const dataToInsert = {
      ...indentData,
      status: indentData.status || "pending",
    };

    const { data, error } = await supabase
      .from("indents")
      .insert([dataToInsert])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creating indent:", error);
    return { success: false, error: error.message };
  }
};

// Generate next indent number
// Generate next indent number
// Generate next indent number
// Generate next indent number
export const generateNextIndentNumber = async () => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("indent_number");

    if (error) throw error;

    let maxNumber = 0;

    // Loop through ALL records and find the highest number
    if (data && data.length > 0) {
      data.forEach((record) => {
        const matches = record.indent_number.toString().match(/\d+/g);
        if (matches && matches.length > 0) {
          const num = parseInt(matches[matches.length - 1]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }

    console.log("Max number found:", maxNumber);
    return `REC-${String(maxNumber + 1).padStart(2, "0")}`;
  } catch (error) {
    console.error("Error generating indent number:", error);
    return "REC-01";
  }
};

// Update indent status
export const updateIndentStatus = async (indentId, status) => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .update({ status })
      .eq("id", indentId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error updating indent:", error);
    return { success: false, error: error.message };
  }
};

// Delete indent
export const deleteIndent = async (indentId) => {
  try {
    const { error } = await supabase
      .from("indents")
      .delete()
      .eq("id", indentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting indent:", error);
    return { success: false, error: error.message };
  }
};
