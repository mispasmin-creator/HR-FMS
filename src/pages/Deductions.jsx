import React, { useState, useEffect } from 'react';

const DeductionsReport = () => {
  const [advanceData, setAdvanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // Default search by name
  const [selectedMonth, setSelectedMonth] = useState(''); // For month-wise filtering

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters whenever data or search criteria change
    applyFilters();
  }, [advanceData, searchTerm, searchType, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data from API...');
      const response = await fetch('https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=Deductions&action=fetch');
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      if (data.success) {
        console.log('Data fetched successfully, processing...');
        const processedData = processSheetData(data.data);
        console.log('Processed Data:', processedData);
        setAdvanceData(processedData);
      } else {
        throw new Error(data.error || 'Failed to fetch data from sheet');
      }
    } catch (err) {
      console.error('Error fetching Deduction data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processSheetData = (sheetData) => {
    if (!sheetData || sheetData.length === 0) {
      console.log('No sheet data available');
      return [];
    }
    
    console.log('Raw Sheet Data:', sheetData);
    console.log('Number of rows:', sheetData.length);
    
    // पहली row headers है
    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    
    console.log('Headers:', headers);
    console.log('Number of data rows:', rows.length);
    
    // Column mapping - आपके actual columns के according
    const columnMap = {};
    headers.forEach((header, index) => {
      if (header) {
        const cleanHeader = header.toString().trim();
        columnMap[cleanHeader] = index;
        
        // Case insensitive matching के लिए
        columnMap[cleanHeader.toLowerCase()] = index;
        columnMap[cleanHeader.toUpperCase()] = index;
      }
    });
    
    console.log('Final Column Map:', columnMap);
    
    // सभी available columns log करें
    console.log('Available columns:', Object.keys(columnMap));
    
    const processedRows = rows.map((row, index) => {
      // Debug: current row log करें
      console.log(`Processing row ${index}:`, row);
      
      // आपके actual columns के according mapping
      const employeeId = 
        row[columnMap['Employee Code']] || 
        row[columnMap['Employee Code']] || 
        row[columnMap['EMPLOYEE CODE']] || 
        row[columnMap['employee code']] || 
        '';
      
      const name = 
        row[columnMap['Employee Name']] || 
        row[columnMap['Employee Name']] || 
        row[columnMap['EMPLOYEE NAME']] || 
        row[columnMap['employee name']] || 
        '';
      
      // Advance Deduction Amount को हम New Advance के रूप में use करेंगे
      const advanceDeduction = parseFloat(
        row[columnMap['Advance Deduction Amount']] || 
        row[columnMap['Advance Deduction Amount']] || 
        row[columnMap['ADVANCE DEDUCTION AMOUNT']] || 
        row[columnMap['advance deduction amount']] || 
        0
      ) || 0;

      // Attendance data
      const attendance = parseFloat(
        row[columnMap['Attendance']] || 
        row[columnMap['ATTENDANCE']] || 
        row[columnMap['attendance']] || 
        0
      ) || 0;

      // Date
      const date = 
        row[columnMap['Date']] || 
        row[columnMap['DATE']] || 
        row[columnMap['date']] || 
        '';

      // Month Name
      const month = 
        row[columnMap['Month Name']] || 
        row[columnMap['MONTH NAME']] || 
        row[columnMap['month name']] || 
        '';

      // Year Name
      const year = 
        row[columnMap['Year Name']] || 
        row[columnMap['YEAR NAME']] || 
        row[columnMap['year name']] || 
        '';

      // Avatar generate करें
      const avatar = name && name.trim() !== '' ? 
        (name.split(' ').length > 1 ? 
          `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`.toUpperCase() : 
          name[0].toUpperCase()) : 
        '👤';

      const processedRow = {
        id: index + 1,
        employeeId,
        name,
        date,
        month,
        year,
        attendance,
        advanceDeduction, // ये New Advance की तरह use होगा
        // अन्य fields जो आपके sheet में नहीं हैं, उन्हें zero set करें
        oldLoan: 0,
        totalDeducted: 0,
        directAdvanceReceived: 0,
        closing: 0,
        monthlyDeductionApproved: advanceDeduction // Advance Deduction को monthly deduction मानें
      };
      
      console.log(`Processed row ${index}:`, processedRow);
      return processedRow;
    }).filter(row => row.name && row.name.trim() !== ''); // Empty rows filter out करें

    console.log('Final processed data:', processedRows);
    return processedRows;
  };

  const applyFilters = () => {
    let filtered = [...advanceData];

    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(employee => {
        const term = searchTerm.toLowerCase().trim();
        
        switch (searchType) {
          case 'employeeId':
            return employee.employeeId?.toLowerCase().includes(term);
          case 'name':
            return employee.name?.toLowerCase().includes(term);
          case 'month':
            return employee.month?.toLowerCase().includes(term);
          default:
            return true;
        }
      });
    }

    // Apply month-wise filter
    if (selectedMonth) {
      filtered = filtered.filter(employee => 
        employee.month?.toLowerCase() === selectedMonth.toLowerCase()
      );
    }

    setFilteredData(filtered);
  };

  // Get unique months for dropdown
  const getUniqueMonths = () => {
    const months = advanceData
      .map(employee => employee.month)
      .filter(month => month && month.trim() !== '');
    
    return [...new Set(months)].sort();
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

    const getAmountColor = (amount) => {
      if (amount === 0) return 'text-gray-600';
      if (amount > 0) return 'text-red-600';
      return 'text-green-600';
    };

    return (
      <span className={`text-sm font-medium ${getAmountColor(value)}`}>
        {formatCurrency(value)}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Deductions data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error Loading Deductions Report</div>
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

  // Main render
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
          <h1 className="text-2xl font-bold text-gray-900">Deductions Report</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing: {filteredData.length} of {advanceData.length} Records
            </span>
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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="flex rounded-md shadow-sm">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="employeeId">Employee ID</option>
                  <option value="month">Month</option>
                </select>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search by ${searchType}...`}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Months</option>
                {getUniqueMonths().map((month, index) => (
                  <option key={index} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedMonth('');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">EMPLOYEE ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">NAME</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">MONTH</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">ATTENDANCE</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">ADVANCE DEDUCTION</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((employee, index) => (
                    <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {employee.employeeId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                              {employee.avatar}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {employee.date} • {employee.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.attendance} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.advanceDeduction} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">No matching records found</p>
                        <p className="text-gray-600 mb-4">
                          {searchTerm || selectedMonth 
                            ? 'Try adjusting your search criteria or clear filters.' 
                            : 'No deduction records found in the sheet.'}
                        </p>
                        {(searchTerm || selectedMonth) && (
                          <button 
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedMonth('');
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeductionsReport;