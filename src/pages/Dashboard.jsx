import { fetchDashboardData } from "../services/dashboardService";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  UserMinus,
  Building,
  Shield,
  DollarSign,
  Briefcase,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const Dashboard = () => {
  const [totalEmployee, setTotalEmployee] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(0);
  const [leftEmployee, setLeftEmployee] = useState(0);
  const [leaveThisMonth, setLeaveThisMonth] = useState(0);
  const [monthlyHiringData, setMonthlyHiringData] = useState([]);
  const [designationData, setDesignationData] = useState([]);
  const [leaveStatusData, setLeaveStatusData] = useState([]);
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  // Add this near other state variables at the top
  const [siesEmployeeCount, setSiesEmployeeCount] = useState(0);
  const [femaleRatio, setFemaleRatio] = useState(0);
  const [regularEmployeeCount, setRegularEmployeeCount] = useState(0);

  // New states for pending counts
  const [pendingJoiningCount, setPendingJoiningCount] = useState(0);
  const [pendingAfterJoiningCount, setPendingAfterJoiningCount] = useState(0);
  const [pendingLeavingCount, setPendingLeavingCount] = useState(0);
  const [pendingHRApprovalCount, setPendingHRApprovalCount] = useState(0);
  const [pendingAccountCount, setPendingAccountCount] = useState(0);
  const [pendingITCount, setPendingITCount] = useState(0);
  const [pendingReportingManagerCount, setPendingReportingManagerCount] =
    useState(0);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingPayrollCount, setPendingPayrollCount] = useState(0);

  // New states for charts
  const [attendanceTrendData, setAttendanceTrendData] = useState([]);
  const [genderDistributionData, setGenderDistributionData] = useState([]);

  // Stats
  const [averageTenure, setAverageTenure] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [turnoverRate, setTurnoverRate] = useState(0);

  // Helper functions for date parsing and data fetching from Google Sheets were removed
  // as logic has been moved to ../services/dashboardService.js using Supabase.

  const parseSheetDate = (dateStr) => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Stagnant Google Sheets fetch functions were removed.

  // Calculate stats
  const calculateStats = () => {
    // Calculate turnover rate based on employees who left vs total regular employees
    const calculatedTurnoverRate =
      regularEmployeeCount > 0
        ? ((leftEmployee / regularEmployeeCount) * 100).toFixed(1)
        : 0;

    // Default values
    setTurnoverRate(calculatedTurnoverRate);
    setAttendanceRate(95.5);
    setAverageTenure(2.3);

    console.log("Stats calculated - Turnover:", calculatedTurnoverRate, "%");
  };

  // Main fetch data function
  const fetchData = async () => {
    try {
      console.log("Dashboard fetchData started - using Supabase");

      const result = await fetchDashboardData();

      if (!result.success) {
        console.error("Failed to fetch dashboard data:", result.error);
        return;
      }

      const data = result.data;

      // Set all employee counts
      setTotalEmployee(data.totalEmployees);
      setActiveEmployee(data.activeEmployees);
      setLeftEmployee(data.leftEmployees);
      setLeaveThisMonth(data.leaveThisMonth);
      setSiesEmployeeCount(data.siesEmployees);
      setRegularEmployeeCount(data.regularEmployees);

      // Set data arrays
      setMonthlyHiringData(data.monthlyHiringData);
      setDesignationData(data.designationData);
      setDepartmentData(data.departmentData);
      setGenderDistributionData(data.genderDistributionData);

      // Set statistics
      setFemaleRatio(data.femaleRatio);
      setTurnoverRate(data.turnoverRate);
      setAttendanceRate(data.attendanceRate);
      setAverageTenure(data.averageTenure);

      // Set pending counts
      setPendingJoiningCount(data.pendingJoiningCount);
      setPendingAfterJoiningCount(data.pendingAfterJoiningCount);
      setPendingLeavingCount(data.pendingLeavingCount);

      // Set default values for other pending counts (fetch from other services if needed)
      setPendingHRApprovalCount(0);
      setPendingAccountCount(0);
      setPendingITCount(0);
      setPendingReportingManagerCount(0);
      setPendingAdminCount(0);
      setPendingLeaveCount(0);
      setPendingPayrollCount(0);

      // Generate attendance and leave management data
      setAttendanceTrendData([
        { month: "Jan", present: 85, absent: 8, late: 7 },
        { month: "Feb", present: 88, absent: 6, late: 6 },
        { month: "Mar", present: 82, absent: 10, late: 8 },
        { month: "Apr", present: 90, absent: 5, late: 5 },
        { month: "May", present: 87, absent: 7, late: 6 },
        { month: "Jun", present: 84, absent: 9, late: 7 },
      ]);

      setLeaveStatusData([
        { status: "Approved", count: 45 },
        { status: "Pending", count: 12 },
        { status: "Rejected", count: 3 },
      ]);

      setLeaveTypeData([
        { type: "Sick Leave", count: 25 },
        { type: "Casual Leave", count: 18 },
        { type: "Earned Leave", count: 12 },
        { type: "Maternity Leave", count: 5 },
      ]);

      console.log("Dashboard fetchData completed successfully");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Color palette
  const getStatusColor = (status) => {
    const colors = {
      approved: "#10B981",
      pending: "#F59E0B",
      rejected: "#EF4444",
      cancelled: "#6B7280",
    };
    return colors[status.toLowerCase()] || "#3B82F6";
  };

  // Pending cards configuration
  const pendingCards = [
    {
      title: "Joining Pending",
      count: pendingJoiningCount,
      icon: UserPlus,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      path: "/joining",
    },
    {
      title: "After Joining Pending",
      count: pendingAfterJoiningCount,
      icon: UserCheck,
      color: "bg-green-500",
      textColor: "text-green-500",
      path: "/after-joining-work",
    },
    {
      title: "Leaving Pending",
      count: pendingLeavingCount,
      icon: UserX,
      color: "bg-red-500",
      textColor: "text-red-500",
      path: "/leaving",
    },
    {
      title: "HR Approvals Pending",
      count: pendingHRApprovalCount,
      icon: Shield,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      path: "/hod-verification",
    },
    {
      title: "Accounts Pending",
      count: pendingAccountCount,
      icon: DollarSign,
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
      path: "/admin-department",
    },
    {
      title: "IT Department Pending",
      count: pendingITCount,
      icon: Building,
      color: "bg-indigo-500",
      textColor: "text-indigo-500",
      path: "/it-department",
    },
    {
      title: "Reporting Manager Pending",
      count: pendingReportingManagerCount,
      icon: UserMinus,
      color: "bg-pink-500",
      textColor: "text-pink-500",
      path: "/reporting-manager",
    },
    {
      title: "Admin Pending",
      count: pendingAdminCount,
      icon: Briefcase,
      color: "bg-orange-500",
      textColor: "text-orange-500",
      path: "/admin-department",
    },
    {
      title: "Leave Requests Pending",
      count: pendingLeaveCount,
      icon: Calendar,
      color: "bg-teal-500",
      textColor: "text-teal-500",
      path: "/leave-management",
    },
    {
      title: "Payroll Pending",
      count: pendingPayrollCount,
      icon: FileText,
      color: "bg-cyan-500",
      textColor: "text-cyan-500",
      path: "/payroll",
    },
  ];

  return (
    <div className="p-6 space-y-6 page-content">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          HR Dashboard Overview
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity size={16} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border border-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-white rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Employees
              </p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {totalEmployee}
              </h3>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-2 h-2 mr-1 bg-blue-500 rounded-full"></div>
                    <span>Regular:</span>
                  </span>
                  <span className="font-medium">
                    {regularEmployeeCount || 281}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-2 h-2 mr-1 bg-purple-500 rounded-full"></div>
                    <span>SIES:</span>
                  </span>
                  <span className="font-medium text-purple-600">
                    {siesEmployeeCount}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="flex items-center"></span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-6 border border-green-100 shadow-lg bg-gradient-to-br from-green-50 to-white rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Employees
              </p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {activeEmployee}
              </h3>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUp size={14} />
                <span className="ml-1">8% growth</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="p-6 border shadow-lg bg-gradient-to-br from-amber-50 to-white rounded-xl border-amber-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Resigned</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {leftEmployee}
              </h3>
              <div className="flex items-center mt-2 text-sm text-red-600">
                <ArrowDown size={14} />
                <span className="ml-1">{turnoverRate}% turnover rate</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-amber-100">
              <Clock size={24} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="p-6 border border-red-100 shadow-lg bg-gradient-to-br from-red-50 to-white rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Left This Month
              </p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {leaveThisMonth}
              </h3>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <TrendingUp size={14} />
                <span className="ml-1">Compared to last month</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <UserX size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks Section */}
      <div className="p-6 bg-white border shadow-lg rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center text-lg font-bold text-gray-800">
            <AlertCircle size={20} className="mr-2 text-amber-500" />
            Pending Tasks Overview
          </h2>
          <div className="text-sm text-gray-500">
            Total Pending:{" "}
            {pendingCards.reduce((sum, card) => sum + card.count, 0)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {pendingCards.map((card, index) => (
            <div
              key={index}
              className="p-4 transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:shadow-md"
              onClick={() => (window.location.href = card.path)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                  <card.icon size={18} className={card.textColor} />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${card.color} bg-opacity-20 ${card.textColor}`}
                >
                  {card.count}
                </span>
              </div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hiring vs Leaving Trend */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="flex items-center mb-6 text-lg font-bold text-gray-800">
            <TrendingUp size={20} className="mr-2" />
            Hiring vs Leaving Trend (Last 6 Months)
          </h2>
          <div className="h-80">
            {monthlyHiringData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyHiringData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis dataKey="month" stroke="#374151" />
                  <YAxis stroke="#374151" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="hired"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Hired"
                  />
                  <Area
                    type="monotone"
                    dataKey="left"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Left"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading hiring data...
              </div>
            )}
          </div>
        </div>

        {/* Department-wise Employee Count */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="flex items-center mb-6 text-lg font-bold text-gray-800">
            <Building size={20} className="mr-2" />
            Department-wise Employee Count
          </h2>
          <div className="h-80">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData.slice(0, 8)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis
                    dataKey="department"
                    stroke="#374151"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#374151" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Bar dataKey="employees" name="Employees">
                    {departmentData.slice(0, 8).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index % 3 === 0
                            ? "#EF4444"
                            : index % 3 === 1
                              ? "#10B981"
                              : "#3B82F6"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading department data...
              </div>
            )}
          </div>
        </div>

        {/* Leave Status Distribution */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="flex items-center mb-6 text-lg font-bold text-gray-800">
            <FileText size={20} className="mr-2" />
            Leave Status Distribution
          </h2>
          <div className="h-80">
            {leaveStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {leaveStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getStatusColor(entry.status)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading leave data...
              </div>
            )}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="flex items-center mb-6 text-lg font-bold text-gray-800">
            <Users size={20} className="mr-2" />
            Gender Distribution
          </h2>
          <div className="h-80">
            {genderDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} employees`, "Count"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading gender data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Attendance Trend */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="flex items-center mb-6 text-lg font-bold text-gray-800">
            <Activity size={20} className="mr-2" />
            Attendance Trend
          </h2>
          <div className="h-60">
            {attendanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis dataKey="month" stroke="#374151" />
                  <YAxis stroke="#374151" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#374151",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading attendance data...
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="mb-6 text-lg font-bold text-gray-800">
            Key HR Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {attendanceRate}%
                </h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
              <div>
                <p className="text-sm text-gray-600">Avg Employee Tenure</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {averageTenure} years
                </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Clock size={20} className="text-green-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
              <div>
                <p className="text-sm text-gray-600">Turnover Rate</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {turnoverRate}%
                </h3>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingUp size={20} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Designation-wise Employee Count */}
        <div className="p-6 bg-white border shadow-lg rounded-xl">
          <h2 className="mb-6 text-lg font-bold text-gray-800">
            Top Designations
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-60">
            {designationData.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${index % 3 === 0 ? "bg-blue-500" : index % 3 === 1 ? "bg-green-500" : "bg-purple-500"}`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {item.designation}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-800">
                  {item.employees}
                </span>
              </div>
            ))}
          </div>
          {designationData.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {designationData.length} designations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Designation-wise Employee Count Full Chart */}
      <div className="p-6 bg-white border shadow-lg rounded-xl">
        <h2 className="flex items-center mb-6 text-lg font-bold text-gray-800">
          <UserPlus size={20} className="mr-2" />
          Designation-wise Employee Count
        </h2>
        <div className="h-80">
          {designationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={designationData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="designation"
                  stroke="#374151"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#374151" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    color: "#374151",
                  }}
                />
                <Bar dataKey="employees" name="Employees">
                  {designationData.slice(0, 10).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index % 3 === 0
                          ? "#EF4444"
                          : index % 3 === 1
                            ? "#10B981"
                            : "#3B82F6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading designation data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
