import { supabase } from "../config/supabase";

/**
 * Fetch joining statistics and data
 */
export const fetchJoiningStats = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const totalJoining = data.length;
    const activeEmployees = data.filter(
      (item) => !item.actual_leaving_date,
    ).length;

    // Monthly hiring data
    const monthlyHiring = {};
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      const monthYear = `${months[monthIndex]} ${currentDate.getFullYear()}`;
      monthlyHiring[monthYear] = { hired: 0 };
    }

    data.forEach((item) => {
      if (item.date_of_joining) {
        const date = new Date(item.date_of_joining);
        const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyHiring[monthYear]) {
          monthlyHiring[monthYear].hired += 1;
        }
      }
    });

    // Designation counts
    const designationCounts = {};
    data.forEach((item) => {
      if (item.designation) {
        designationCounts[item.designation] =
          (designationCounts[item.designation] || 0) + 1;
      }
    });

    const designationData = Object.entries(designationCounts).map(
      ([key, value]) => ({
        designation: key,
        employees: value,
      }),
    );

    // Department counts
    const departmentCounts = {};
    data.forEach((item) => {
      if (item.department) {
        departmentCounts[item.department] =
          (departmentCounts[item.department] || 0) + 1;
      }
    });

    const departmentData = Object.entries(departmentCounts)
      .map(([key, value]) => ({
        department: key,
        employees: value,
      }))
      .sort((a, b) => b.employees - a.employees);

    // Gender distribution
    const genderCounts = { male: 0, female: 0, other: 0 };
    data.forEach((item) => {
      if (item.gender) {
        const gender = item.gender.toLowerCase();
        if (gender.includes("male")) genderCounts.male++;
        else if (gender.includes("female")) genderCounts.female++;
        else genderCounts.other++;
      }
    });

    const total = genderCounts.male + genderCounts.female + genderCounts.other;
    const femaleRatio =
      total > 0 ? ((genderCounts.female / total) * 100).toFixed(1) : 0;

    const genderDistributionData = [
      { name: "Male", value: genderCounts.male, color: "#3B82F6" },
      { name: "Female", value: genderCounts.female, color: "#EC4899" },
    ];

    if (genderCounts.other > 0) {
      genderDistributionData.push({
        name: "Other",
        value: genderCounts.other,
        color: "#10B981",
      });
    }

    return {
      success: true,
      data: {
        totalJoining,
        activeEmployees,
        monthlyHiring,
        designationData,
        departmentData,
        genderDistributionData,
        femaleRatio,
        rawData: data,
      },
    };
  } catch (error) {
    console.error("Error fetching joining stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch leaving statistics and data
 */
export const fetchLeavingStats = async () => {
  try {
    const { data, error } = await supabase
      .from("leaving")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const totalLeft = data.length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Count this month's leaving
    const thisMonthCount = data.filter((item) => {
      if (!item.date_of_leaving) return false;
      const date = new Date(item.date_of_leaving);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    }).length;

    // Monthly leaving data
    const monthlyLeaving = {};
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (now.getMonth() - i + 12) % 12;
      const monthYear = `${months[monthIndex]} ${now.getFullYear()}`;
      monthlyLeaving[monthYear] = { left: 0 };
    }

    data.forEach((item) => {
      if (item.date_of_leaving) {
        const date = new Date(item.date_of_leaving);
        const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyLeaving[monthYear]) {
          monthlyLeaving[monthYear].left += 1;
        }
      }
    });

    return {
      success: true,
      data: {
        totalLeft,
        thisMonthCount,
        monthlyLeaving,
        rawData: data,
      },
    };
  } catch (error) {
    console.error("Error fetching leaving stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch SIES employees count and stats
 */
export const fetchSiesStats = async () => {
  try {
    const { data, error } = await supabase
      .from("sies_employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const totalSies = data.length;
    const activeSies = data.filter(
      (item) => item.status === "Active" || !item.status,
    ).length;

    return {
      success: true,
      data: {
        totalSies,
        activeSies,
        rawData: data,
      },
    };
  } catch (error) {
    console.error("Error fetching SIES stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch enquiry/candidate stats
 */
export const fetchEnquiryStats = async () => {
  try {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Count by status/track_status
    const statusCounts = {};
    data.forEach((item) => {
      const status = item.track_status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Count by department
    const departmentCounts = {};
    data.forEach((item) => {
      if (item.department) {
        departmentCounts[item.department] =
          (departmentCounts[item.department] || 0) + 1;
      }
    });

    // Count by position/applying_for_post
    const positionCounts = {};
    data.forEach((item) => {
      if (item.applying_for_post) {
        positionCounts[item.applying_for_post] =
          (positionCounts[item.applying_for_post] || 0) + 1;
      }
    });

    return {
      success: true,
      data: {
        totalEnquiries: data.length,
        statusCounts,
        departmentCounts,
        positionCounts,
        rawData: data,
      },
    };
  } catch (error) {
    console.error("Error fetching enquiry stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch pending counts for various workflows
 */
export const fetchPendingCounts = async () => {
  try {
    // Pending joining - candidates with Joining status but no joining record
    const { data: enquiries } = await supabase
      .from("enquiries")
      .select("candidate_enquiry_number, track_status")
      .eq("track_status", "Joining");

    const { data: joiningRecords } = await supabase
      .from("joining")
      .select("enquiry_no");

    const joinedNumbers = new Set(
      joiningRecords?.map((r) => r.enquiry_no) || [],
    );
    const pendingJoiningCount = (enquiries || []).filter(
      (e) => !joinedNumbers.has(e.candidate_enquiry_number),
    ).length;

    // Pending after joining - joining records with planned date but no actual date
    const { data: joiningData } = await supabase
      .from("joining")
      .select("planned_after_joining_date, actual_after_joining_date");

    const pendingAfterJoiningCount = (joiningData || []).filter(
      (item) =>
        item.planned_after_joining_date && !item.actual_after_joining_date,
    ).length;

    // Pending leaving - joining records with after joining completed but no leaving initiated
    const { data: leavingData } = await supabase.from("leaving").select("*");

    const pendingLeavingCount = (joiningData || []).filter(
      (item) =>
        item.actual_after_joining_date &&
        !leavingData?.some((l) => l.employee_no === item.serial_no),
    ).length;

    return {
      success: true,
      data: {
        pendingJoiningCount,
        pendingAfterJoiningCount,
        pendingLeavingCount,
      },
    };
  } catch (error) {
    console.error("Error fetching pending counts:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch comprehensive dashboard data
 */
export const fetchDashboardData = async () => {
  try {
    const [
      joiningResult,
      leavingResult,
      siesResult,
      enquiryResult,
      pendingResult,
    ] = await Promise.all([
      fetchJoiningStats(),
      fetchLeavingStats(),
      fetchSiesStats(),
      fetchEnquiryStats(),
      fetchPendingCounts(),
    ]);

    if (!joiningResult.success) throw new Error("Failed to fetch joining data");
    if (!leavingResult.success) throw new Error("Failed to fetch leaving data");
    if (!siesResult.success) throw new Error("Failed to fetch SIES data");

    const joiningStats = joiningResult.data;
    const leavingStats = leavingResult.data;
    const siesStats = siesResult.data;
    const enquiryStats = enquiryResult.data || {};
    const pendingStats = pendingResult.data || {};

    // Calculate combined stats
    const totalEmployees = joiningStats.activeEmployees + siesStats.totalSies;
    const turnoverRate =
      joiningStats.totalJoining > 0
        ? ((leavingStats.totalLeft / joiningStats.totalJoining) * 100).toFixed(
            1,
          )
        : 0;

    // Prepare monthly hiring data (combine hiring and leaving)
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      const monthYear = `${months[monthIndex]} ${currentDate.getFullYear()}`;
      const monthName = months[monthIndex];

      monthlyData.push({
        month: monthName,
        hired: joiningStats.monthlyHiring[monthYear]?.hired || 0,
        left: leavingStats.monthlyLeaving[monthYear]?.left || 0,
      });
    }

    return {
      success: true,
      data: {
        // Employee counts
        totalEmployees,
        activeEmployees: joiningStats.activeEmployees,
        regularEmployees: joiningStats.totalJoining,
        siesEmployees: siesStats.totalSies,
        leftEmployees: leavingStats.totalLeft,
        leaveThisMonth: leavingStats.thisMonthCount,

        // Statistics
        femaleRatio: joiningStats.femaleRatio,
        turnoverRate,
        attendanceRate: 95.5,
        averageTenure: 2.3,

        // Data arrays
        monthlyHiringData: monthlyData,
        designationData: joiningStats.designationData,
        departmentData: joiningStats.departmentData,
        genderDistributionData: joiningStats.genderDistributionData,

        // Enquiry stats
        enquiryStats,

        // Pending counts
        pendingJoiningCount: pendingStats.pendingJoiningCount || 0,
        pendingAfterJoiningCount: pendingStats.pendingAfterJoiningCount || 0,
        pendingLeavingCount: pendingStats.pendingLeavingCount || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching comprehensive dashboard data:", error);
    return { success: false, error: error.message };
  }
};
