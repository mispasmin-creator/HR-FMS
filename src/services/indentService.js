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
    const { data, error } = await supabase
      .from("indents")
      .insert([indentData])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creating indent:", error);
    return { success: false, error: error.message };
  }
};

// Generate next indent number
export const generateNextIndentNumber = async () => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("indent_number")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    let maxNumber = 0;
    if (data && data.length > 0) {
      const lastIndentNumber = data[0].indent_number;
      const match = lastIndentNumber.toString().match(/\d+/);
      if (match) {
        maxNumber = parseInt(match[0]);
      }
    }

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
