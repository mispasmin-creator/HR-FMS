import { supabase } from "../config/supabase";

// Fetch all indents with pending social site status
export const fetchPendingIndentsForSocialSite = async () => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("*")
      .eq("status", "pending")
      .or('social_site_post.is.null, social_site_post.eq.""')
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching pending indents:", error);
    return { success: false, error: error.message };
  }
};

// Fetch all indents with social site history (completed)
export const fetchSocialSiteHistory = async () => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("*")
      .not("social_site_post", "is", null)
      .neq("social_site_post", "")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching social site history:", error);
    return { success: false, error: error.message };
  }
};

// Update social site information for an indent
export const updateSocialSiteInfo = async (indentId, socialSiteData) => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .update({
        social_site_post: socialSiteData.socialSite,
        which:
          socialSiteData.socialSiteTypes.length > 0
            ? socialSiteData.socialSiteTypes.join(", ")
            : "No",
        job_description: socialSiteData.jobDescription,
        social_site_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", indentId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error updating social site info:", error);
    return { success: false, error: error.message };
  }
};

// Get indent by ID
export const getIndentById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("indents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching indent:", error);
    return { success: false, error: error.message };
  }
};
