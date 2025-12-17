import React, { useState, useEffect } from 'react';

const EmployeesReport = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [showJoiningForm, setShowJoiningForm] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(employeeData);
    } else {
      const filtered = employeeData.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, employeeData]);

  const fetchData = async () => {
  try {
    setLoading(true);
    const response = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=SIES EMPLOYEES&action=fetch');
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    console.log('Raw API Response:', data);
    
    if (data.success) {
      const processedData = processSheetData(data.data);
      // Filter out inactive employees
      const activeEmployees = processedData.filter(emp => 
        emp.status !== 'Inactive' && emp.status !== 'Deleted'
      );
      setEmployeeData(activeEmployees);
      setFilteredData(activeEmployees);
    } else {
      throw new Error(data.error || 'Failed to fetch data from sheet');
    }
  } catch (err) {
    setError(err.message);
    console.error('Error fetching employee data:', err);
  } finally {
    setLoading(false);
  }
};

  const processSheetData = (sheetData) => {
  if (!sheetData || sheetData.length < 2) {
    console.log('No sheet data available');
    return [];
  }
  
  console.log('Sheet Data:', sheetData);
  
  const headers = sheetData[0];
  const rows = sheetData.slice(1);
  
  // Map column names to indices
  const columnMap = {};
  headers.forEach((header, index) => {
    columnMap[header.trim()] = index;
  });
  
  console.log('Column Map:', columnMap);
  
  return rows.map((row, index) => {
    // Get values from each column
    const serialNo = row[columnMap['S. No.']] || index + 1;
    const employeeId = row[columnMap['Employee Id']] || '';
    const name = row[columnMap['Name Of The Employee']] || '';
    const designation = row[columnMap['Designation']] || '';
    const salary = parseFloat(row[columnMap['Salary']]) || 0;
    const aadhaarCardNo = row[columnMap['Adhaar Card No.']] || '';
    const panCardNo = row[columnMap['Pan Card No.']] || '';
    const address = row[columnMap['Adress.']] || '';
    const joinDate = row[columnMap['Join Date.']] || '';
    const mobileNo = row[columnMap['Mobile No.']] || '';
    const status = row[columnMap['Status']] || 'Active';
    const remarks = row[columnMap['Remarks']] || '';
    
    // Generate avatar based on name
    const avatar = name && name.trim() !== '' ? 
      (name.split(' ').length > 1 ? 
        `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`.toUpperCase() : 
        name[0].toUpperCase()) : 
      '👤';

    return {
      id: index + 1,
      serialNo,
      employeeId,
      name,
      designation,
      salary,
      aadhaarCardNo,
      panCardNo,
      address,
      joinDate,
      mobileNo,
      status,
      remarks,
      avatar
    };
  });
};

  const handleActionClick = (employee) => {
    setSelectedEmployee(employee);
    setShowActionForm(true);
    setRemarks('');
  };

  const handleRelieveEmployee = async () => {
    if (!selectedEmployee || !remarks.trim()) {
      alert('Please enter remarks before relieving employee');
      return;
    }

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'relieveEmployee',
          employeeId: selectedEmployee.employeeId,
          remarks: remarks
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Employee relieved successfully');
        fetchData(); // Refresh data
        setShowActionForm(false);
        setSelectedEmployee(null);
        setRemarks('');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error relieving employee:', error);
      alert('Failed to relieve employee');
    }
  };

const handleDeleteClick = async (employee) => {
  if (!window.confirm(`Are you sure you want to Delete ${employee.name} (${employee.employeeId}) .`)) {
    return;
  }

  try {
    // First, let's get the exact row number from the sheet
    const fetchResponse = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=SIES EMPLOYEES&action=fetch');
    const fetchResult = await fetchResponse.json();
    
    if (!fetchResult.success) {
      throw new Error('Failed to fetch sheet data');
    }

    const sheetData = fetchResult.data || [];
    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    
    // Find the row index where employeeId matches
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Assuming Employee Id is column B (index 1)
      if (row[1] === employee.employeeId) {
        rowIndex = i + 2; // +2 because: +1 for header row, +1 for 1-based indexing
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('Employee not found in sheet');
    }
    
    // Find the column index for "Status" column
    let statusColumnIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].trim() === 'Status') {
        statusColumnIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (statusColumnIndex === -1) {
      // If Status column not found, try to find which column it might be
      // Usually Status is one of the last columns
      statusColumnIndex = 11; // Column K (assuming Status is column 11)
    }
    
    console.log('Updating:', {
      rowIndex,
      statusColumnIndex,
      employeeId: employee.employeeId
    });
    
    // Use updateCell action to set Status to "Inactive"
    const response = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sheetName: 'SIES EMPLOYEES',
        action: 'updateCell',
        rowIndex: rowIndex.toString(),
        columnIndex: statusColumnIndex.toString(),
        value: 'Inactive'
      })
    });

    const result = await response.json();
    console.log('Update response:', result);
    
    if (result.success) {
      alert('Employee Deleted successfully');
      fetchData(); // Refresh data
    } else {
      // Try alternative column indices
      await tryAlternativeColumns(rowIndex, employee);
    }
  } catch (error) {
    console.error('Error marking employee as inactive:', error);
    alert(`Failed to update employee: ${error.message}`);
  }
};

// Try different column indices for Status
const tryAlternativeColumns = async (rowIndex, employee) => {
  // Status column might be at different positions
  const possibleColumns = [10, 11, 12, 13]; // Try columns J, K, L, M
  
  for (const columnIndex of possibleColumns) {
    try {
      console.log(`Trying column ${columnIndex} for Status...`);
      
      const response = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          sheetName: 'SIES EMPLOYEES',
          action: 'updateCell',
          rowIndex: rowIndex.toString(),
          columnIndex: columnIndex.toString(),
          value: 'Inactive'
        })
      });

      const result = await response.json();
      console.log(`Column ${columnIndex} result:`, result);
      
      if (result.success) {
        alert('Employee marked as Inactive successfully');
        fetchData();
        return true;
      }
    } catch (error) {
      console.log(`Column ${columnIndex} failed:`, error);
    }
  }
  
  // If all column attempts fail, try using the "insert" action in a different way
  try {
    await tryUpdateViaInsert(employee);
  } catch (error) {
    console.error('All update methods failed:', error);
    alert('Could not update employee status. Please check the Google Sheet manually.');
    return false;
  }
};

// Alternative method: Update via insert action with row data
const tryUpdateViaInsert = async (employee) => {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sheetName: 'SIES EMPLOYEES',
        action: 'insert',
        updateExisting: 'true',
        employeeId: employee.employeeId,
        status: 'Inactive'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Employee status updated to Inactive');
      fetchData();
      return true;
    } else {
      throw new Error(result.error || 'Insert update failed');
    }
  } catch (error) {
    throw error;
  }
};

  const handleNewEmployeeChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

 const handleAddEmployee = async (e) => {
  e.preventDefault();
  
  // Prevent double submission
  const submitButton = e.target.querySelector('button[type="submit"]');
  if (submitButton && submitButton.disabled) return;
  if (submitButton) submitButton.disabled = true;
  
  // Validate required fields
  if (!newEmployee.name || !newEmployee.designation || !newEmployee.joinDate) {
    alert('Please fill in all required fields (Name, Designation, Join Date)');
    if (submitButton) submitButton.disabled = false;
    return;
  }

  try {
    // Get the current data
    const fetchResponse = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=SIES EMPLOYEES&action=fetch');
    const fetchResult = await fetchResponse.json();
    
    if (!fetchResult.success) {
      throw new Error('Failed to fetch employee data');
    }

    const sheetData = fetchResult.data || [];
    const rows = sheetData.slice(1); // Remove header row
    
    // ★★★ FIXED: Find the highest existing employee number ★★★
    let maxEmployeeNumber = 0;
    
    rows.forEach(row => {
      const employeeId = row[1]; // Assuming column B has Employee ID
      if (employeeId) {
        // Check if it's in SIES-XXXX format
        if (employeeId.includes('SIES-')) {
          const match = employeeId.match(/SIES-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxEmployeeNumber) {
              maxEmployeeNumber = num;
            }
          }
        }
        // Also check EMP format for consistency
        else if (employeeId.includes('EMP')) {
          const match = employeeId.match(/EMP(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxEmployeeNumber) {
              maxEmployeeNumber = num;
            }
          }
        }
      }
    });
    
    // Calculate next employee number and serial
    const nextEmployeeNumber = maxEmployeeNumber + 1;
    const nextEmployeeId = `SIES-${String(nextEmployeeNumber).padStart(4, '0')}`;
    const nextSerialNo = rows.length + 1; // S.No. is just row count
    
    console.log('Next Employee:', {
      nextEmployeeNumber,
      nextEmployeeId,
      nextSerialNo,
      maxEmployeeNumber,
      totalRows: rows.length
    });
    
    // Use the insert action
    const insertResponse = await fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sheetName: 'SIES EMPLOYEES',
        action: 'insert',
        rowData: JSON.stringify([
          nextSerialNo,
          nextEmployeeId,
          newEmployee.name,
          newEmployee.designation,
          newEmployee.salary || '',
          newEmployee.aadhaarCardNo || '',
          newEmployee.panCardNo || '',
          newEmployee.address || '',
          newEmployee.joinDate,
          newEmployee.mobileNo || '',
          'Active',
          '' // Remarks column
        ])
      })
    });
    
    const insertResult = await insertResponse.json();
    
    if (insertResult.success) {
      alert(`Employee added successfully! Employee ID: ${nextEmployeeId}`);
      setShowJoiningForm(false);
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
      fetchData(); // Refresh the list
    } else {
      alert('Error: ' + (insertResult.error || 'Failed to add employee'));
    }

  } catch (error) {
    console.error('Error adding employee:', error);
    alert(`Failed to add employee: ${error.message}`);
  } finally {
    // Re-enable the button
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
};

  const CurrencyDisplay = ({ value }) => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return (
      <span className="text-sm font-medium text-gray-900">
        {formatCurrency(value)}
      </span>
    );
  };

  const formatMobileNumber = (mobile) => {
    if (!mobile) return '-';
    const cleaned = mobile.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0,5)} ${cleaned.slice(5)}`;
    }
    return mobile;
  };

  const formatAadhaarNumber = (aadhaar) => {
    if (!aadhaar) return '-';
    const cleaned = aadhaar.toString().replace(/\D/g, '');
    if (cleaned.length === 12) {
      return `${cleaned.slice(0,4)} ${cleaned.slice(4,8)} ${cleaned.slice(8)}`;
    }
    return aadhaar;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error Loading Employee Report</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Action Form Modal */}
      

      {/* Joining Form Modal */}
      {showJoiningForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                New Employee Joining Form
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Employee ID and S.No. will be generated automatically
              </p>
            </div>
            
            <form onSubmit={handleAddEmployee}>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name Of The Employee *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newEmployee.name}
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary (INR)
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={newEmployee.salary}
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      maxLength="10"
                      style={{ textTransform: 'uppercase' }}
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
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      maxLength="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Join Date *
                    </label>
                    <input
                      type="date"
                      name="joinDate"
                      value={newEmployee.joinDate}
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={newEmployee.address}
                      onChange={handleNewEmployeeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowJoiningForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600"
                  >
                    Add Employee
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
          <h1 className="text-2xl font-bold text-gray-900">SIES Employees</h1>
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, or designation..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowJoiningForm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Joining
            </button>
            
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Showing {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} for "{searchTerm}"
              {filteredData.length === 0 && ' - No employees found'}
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">S.No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Employee ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Aadhaar Card No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">PAN Card No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Join Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Mobile No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">Delete</th>                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((employee, index) => (
                    <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                        {employee.serialNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                        {employee.employeeId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                              {employee.avatar}
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {employee.designation}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CurrencyDisplay value={employee.salary} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatAadhaarNumber(employee.aadhaarCardNo)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {employee.panCardNo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={employee.address}>
                          {employee.address}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {employee.joinDate || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatMobileNumber(employee.mobileNo)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.status === 'Relieved' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {employee.status || 'Active'}
                        </span>
                      </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm">
  <button
    onClick={() => handleDeleteClick(employee)}
    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
  >
    Delete
  </button>
</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'No employees found matching your search' : 'No employee data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Total Employees: {filteredData.length}
          {searchTerm && ` (Filtered from ${employeeData.length} total employees)`}
          {filteredData.length > 0 && (
            <>
              {' • '}
              Active: {filteredData.filter(e => e.status !== 'Relieved').length}
              {' • '}
              Relieved: {filteredData.filter(e => e.status === 'Relieved').length}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesReport;