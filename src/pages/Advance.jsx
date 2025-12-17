import React, { useState, useEffect } from 'react';

const AdvanceReport = () => {
  const [advanceData, setAdvanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data when search term or original data changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(advanceData);
    } else {
      const filtered = advanceData.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, advanceData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://script.google.com/macros/s/AKfycbxcsma34SkJ-jomOEkvewF21WutZrMnNjtXl7o7urJRAksOuqg_gSTNszfuK--PLORa1w/exec?sheet=Advance&action=fetch');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      if (data.success) {
        const processedData = processSheetData(data.data);
        setAdvanceData(processedData);
        setFilteredData(processedData);
      } else {
        throw new Error(data.error || 'Failed to fetch data from sheet');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching advance data:', err);
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
      const employeeId = row[columnMap['Employee ID']] || '';
      const name = row[columnMap['Name']] || '';
      const oldLoan = parseFloat(row[columnMap['Old Loan']]) || 0;
      const newAdvance = parseFloat(row[columnMap['New Advance']]) || 0;
      const totalDeducted = parseFloat(row[columnMap['Total Deducted']]) || 0;
      const directAdvanceReceived = parseFloat(row[columnMap['Direct Advance Received']]) || 0;
      const closing = parseFloat(row[columnMap['Closing']]) || 0;
      const monthlyDeductedApproved = parseFloat(row[columnMap['Monthly Deduction Approved']]) || 0;
      
      // Generate avatar based on name
      const avatar = name && name.trim() !== '' ? 
        (name.split(' ').length > 1 ? 
          `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`.toUpperCase() : 
          name[0].toUpperCase()) : 
        '👤';

      return {
        id: index + 1,
        employeeId,
        name,
        oldLoan,
        newAdvance,
        totalDeducted,
        directAdvanceReceived,
        closing,
        monthlyDeductedApproved,
        avatar
      };
    });
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
          <p className="mt-4 text-gray-600">Loading advance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error Loading Advance Report</div>
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
          <h1 className="text-2xl font-bold text-gray-900">Advance Report</h1>
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
                placeholder="Search by name..."
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">EMPLOYEE ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">NAME</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">OLD LOAN</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">NEW ADVANCE</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">TOTAL DEDUCTED</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">DIRECT ADVANCE RECEIVED</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">CLOSING</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">MONTHLY DEDUCTION APPROVED</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((employee, index) => (
                    <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {employee.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                              {employee.avatar}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.oldLoan} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.newAdvance} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.totalDeducted} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.directAdvanceReceived} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.closing} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CurrencyDisplay value={employee.monthlyDeductedApproved} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'No employees found matching your search' : 'No advance data available'}
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

export default AdvanceReport;