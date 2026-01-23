import React, { useEffect, useState } from 'react';
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  fetchSiesEmployees as fetchSiesEmployeesSupabase, 
  addSiesEmployee, 
  updateSiesEmployeeStatus 
} from '../services/siesEmployeeService';

const SiesEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    designation: '',
    salary: '',
    aadhaarCardNo: '',
    panCardNo: '',
    address: '',
    joinDate: '',
    mobileNo: ''
  });

  // Fetch SIES Employees data
  const fetchSiesEmployees = async () => {
    try {
      setLoading(true);
      const result = await fetchSiesEmployeesSupabase();

      if (result.success) {
        setEmployees(result.data);
      } else {
        console.error("Error fetching SIES employees:", result.error);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error in fetchSiesEmployees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search term and status
  useEffect(() => {
    let filtered = employees;

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(emp => 
        emp.status.toString().toLowerCase() !== 'inactive' &&
        emp.status.toString().toLowerCase() !== 'relieved'
      );
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(emp => 
        emp.status.toString().toLowerCase() === 'inactive' ||
        emp.status.toString().toLowerCase() === 'relieved'
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.employeeId.toLowerCase().includes(term) ||
        emp.designation.toLowerCase().includes(term) ||
        emp.mobileNo.toLowerCase().includes(term)
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchSiesEmployees();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new employee
  const handleAddEmployee = async () => {
    try {
      // Validate required fields
      if (!newEmployee.name.trim() || !newEmployee.designation.trim()) {
        alert('Please fill in required fields (Name and Designation)');
        return;
      }

      setLoading(true);

      const result = await addSiesEmployee(newEmployee);

      if (result.success) {
        alert('Employee added successfully! Employee ID: ' + result.employeeId);
        
        // Reset form and close modal
        setNewEmployee({
          name: '',
          designation: '',
          salary: '',
          aadhaarCardNo: '',
          panCardNo: '',
          address: '',
          joinDate: '',
          mobileNo: ''
        });
        
        setShowAddModal(false);
        
        // Refresh the employee list
        fetchSiesEmployees();
      } else {
        alert('Error adding employee: ' + result.error);
      }

    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark employee as inactive
  const handleMarkInactive = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);

      const result = await updateSiesEmployeeStatus(selectedEmployee.employeeId, 'Inactive');

      if (result.success) {
        alert('Employee marked as inactive successfully!');
        setShowInactiveConfirm(false);
        setSelectedEmployee(null);
        fetchSiesEmployees();
      } else {
        alert('Error marking employee as inactive: ' + result.error);
      }

    } catch (error) {
      console.error('Error marking employee as inactive:', error);
      alert('Error marking employee as inactive. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format salary with commas
  const formatSalary = (salary) => {
    if (!salary) return '0';
    const num = parseFloat(salary);
    if (isNaN(num)) return salary;
    return num.toLocaleString('en-IN');
  };

  // Download employee data as CSV
  const downloadCSV = () => {
    const headers = ['S.No.', 'Employee Id', 'Name', 'Designation', 'Salary', 'Aadhaar Card No.', 'PAN Card No.', 'Address', 'Join Date', 'Mobile No.', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...filteredEmployees.map(emp => [
        emp.serialNo,
        `"${emp.employeeId}"`,
        `"${emp.name}"`,
        `"${emp.designation}"`,
        emp.salary,
        `"${emp.aadhaarCardNo}"`,
        `"${emp.panCardNo}"`,
        `"${emp.address}"`,
        `"${emp.joinDate}"`,
        `"${emp.mobileNo}"`,
        `"${emp.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIES_Employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 page-content p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SIES Employees Management</h1>
          <p className="text-gray-600">
            Total Employees: {employees.length} | 
            Active: {employees.filter(e => e.status.toLowerCase() !== 'inactive' && e.status.toLowerCase() !== 'relieved').length} | 
            Inactive: {employees.filter(e => e.status.toLowerCase() === 'inactive' || e.status.toLowerCase() === 'relieved').length}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
          
          <button
            onClick={fetchSiesEmployees}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, designation or mobile..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-gray-500" />
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">Active Employees</option>
              <option value="inactive">Inactive Employees</option>
              <option value="all">All Employees</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-gray-600">
              Showing {filteredEmployees.length} of {employees.length} employees
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Employee Table */
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aadhaar No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PAN No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                      No employees found. {searchTerm ? 'Try a different search.' : 'Click "Add Employee" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.serialNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {employee.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{employee.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{formatSalary(employee.salary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {employee.aadhaarCardNo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {employee.panCardNo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.mobileNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(employee.joinDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.status.toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-800'
                            : employee.status.toLowerCase() === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {employee.status.toLowerCase() === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowInactiveConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              title="Mark as Inactive"
                            >
                              <EyeOff size={16} />
                              <span className="hidden sm:inline">Inactive</span>
                            </button>
                          )}
                          {employee.status.toLowerCase() === 'inactive' && (
                            <span className="text-gray-400 cursor-not-allowed flex items-center gap-1">
                              <Eye size={16} />
                              <span className="hidden sm:inline">Inactive</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Employee</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name Of The Employee *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newEmployee.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation *
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={newEmployee.designation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter designation"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={newEmployee.salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter salary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhaar Card No.
                    </label>
                    <input
                      type="text"
                      name="aadhaarCardNo"
                      value={newEmployee.aadhaarCardNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="12-digit Aadhaar number"
                      maxLength="12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Card No.
                    </label>
                    <input
                      type="text"
                      name="panCardNo"
                      value={newEmployee.panCardNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10-character PAN"
                      maxLength="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile No.
                    </label>
                    <input
                      type="tel"
                      name="mobileNo"
                      value={newEmployee.mobileNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10-digit mobile number"
                      maxLength="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Join Date
                    </label>
                    <input
                      type="date"
                      name="joinDate"
                      value={newEmployee.joinDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={newEmployee.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Employee ID will be generated automatically. 
                    Status will be set to "Active" by default. 
                    Required fields are marked with *.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEmployee}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Add Employee
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Confirmation Modal */}
      {showInactiveConfirm && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <EyeOff className="text-red-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Mark as Inactive</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to mark <strong>{selectedEmployee.name}</strong> ({selectedEmployee.employeeId}) as inactive?
                This employee will be hidden from the active employees list.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowInactiveConfirm(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkInactive}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <EyeOff size={18} />
                      Mark as Inactive
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiesEmployees;