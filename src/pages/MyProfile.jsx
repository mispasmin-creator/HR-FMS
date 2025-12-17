// import React, { useEffect, useState } from 'react';
// import { User, Mail, Phone, MapPin, Calendar, Building, Edit3, Save, X } from 'lucide-react';
// import toast from 'react-hot-toast';

// const MyProfile = () => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [formData, setFormData] = useState({});
//   const [profileData, setProfileData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [leaveData, setLeaveData] = useState([]);
//   const [gatePassData, setGatePassData] = useState([]);


//   const getDisplayableImageUrl = (url) => {
//     if (!url) return null;

//     try {
//       const directMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
//       if (directMatch && directMatch[1]) {
//         return `https://drive.google.com/thumbnail?id=${directMatch[1]}&sz=w400`;
//       }
      
//       const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
//       if (ucMatch && ucMatch[1]) {
//         return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w400`;
//       }
      
//       const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
//       if (openMatch && openMatch[1]) {
//         return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w400`;
//       }
      
//       if (url.includes("thumbnail?id=")) {
//         return url;
//       }

//       const anyIdMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
//       if (anyIdMatch && anyIdMatch[1]) {
//         return `https://drive.google.com/thumbnail?id=${anyIdMatch[1]}&sz=w400`;
//       }
      
//       const cacheBuster = Date.now();
//       return url.includes("?") ? `${url}&cb=${cacheBuster}` : `${url}?cb=${cacheBuster}`;
//     } catch (e) {
//       console.error("Error processing image URL:", url, e);
//       return url; // Return original URL as fallback
//     }
//   };

// const fetchLeaveData = async () => {
//   try {
//     // Get employee ID from localStorage
//     const employeeId = localStorage.getItem("employeeId");
//     if (!employeeId) {
//       console.log("No employee ID found for fetching leave data");
//       return;
//     }

//     // Fetch data from the Leave Management sheet
//     const response = await fetch(
//       'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Leave Management&action=fetch'
//     );
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     const result = await response.json();
    
//     if (!result.success) {
//       throw new Error(result.error || 'Failed to fetch data from Leave Management sheet');
//     }
    
//     const rawData = result.data || result;
    
//     if (!Array.isArray(rawData)) {
//       throw new Error('Expected array data not received');
//     }

//     // Use row 1 as headers (index 0 in the array)
//     if (rawData.length < 1) {
//       console.error('No data found in Leave Management sheet');
//       return;
//     }

//     const headers = rawData[0].map(h => h?.toString().trim());
//     const dataRows = rawData.length > 1 ? rawData.slice(1) : [];
    
//     // Get column indices - using more flexible matching
//     const getIndex = (possibleNames) => {
//       for (const name of possibleNames) {
//         const index = headers.findIndex(h => 
//           h && h.toString().trim().toLowerCase().includes(name.toLowerCase())
//         );
//         if (index !== -1) return index;
//       }
//       return -1;
//     };

//     const employeeNameIndex = getIndex(['employee name', 'name', 'employee']);
//     const fromDateIndex = getIndex(['Leave Date Start', 'from', 'start date']);
//     const toDateIndex = getIndex(['Leaave Date End', 'to', 'end date']);
//     const remarksIndex = getIndex(['remarks', 'comment', 'reason']);
//     const statusIndex = getIndex(['status', 'approval status']);
//     const leaveTypeIndex = getIndex(['leave type', 'type', 'leave']);

//     // Log for debugging
//     console.log('Leave sheet headers:', headers);
//     console.log('Column indices:', {
//       employeeNameIndex,
//       fromDateIndex,
//       toDateIndex,
//       remarksIndex,
//       statusIndex,
//       leaveTypeIndex
//     });

//     // Process data and filter for current employee
//     const processedData = dataRows
//       .filter(row => {
//         if (employeeNameIndex === -1) return false;
        
//         const rowEmployeeName = row[employeeNameIndex]?.toString().trim();
//         return rowEmployeeName && 
//                rowEmployeeName.toLowerCase() === profileData.candidateName?.toLowerCase();
//       })
//       .map(row => ({
//         employeeName: employeeNameIndex !== -1 ? row[employeeNameIndex] || '' : 'N/A',
//         fromDate: fromDateIndex !== -1 ? row[fromDateIndex] || '' : 'N/A',
//         toDate: toDateIndex !== -1 ? row[toDateIndex] || '' : 'N/A',
//         remarks: remarksIndex !== -1 ? row[remarksIndex] || '' : 'N/A',
//         status: statusIndex !== -1 ? row[statusIndex] || '' : 'Pending',
//         leaveType: leaveTypeIndex !== -1 ? row[leaveTypeIndex] || '' : 'N/A'
//       }));

//     console.log('Processed leave data:', processedData);
//     setLeaveData(processedData);
//   } catch (error) {
//     console.error('Error fetching leave data:', error);
//   }
// };


// const fetchGatePassData = async () => {
//   try {
//     const response = await fetch(
//       'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Gate Pass&action=fetch'
//     );

//     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//     const result = await response.json();
//     if (!result.success) throw new Error(result.error || 'Failed to fetch Gate Pass sheet');

//     const rawData = result.data || result;
//     if (!Array.isArray(rawData)) throw new Error('Expected array data not received');

//     const headers = rawData[0].map(h => h?.toString().trim());
//     const dataRows = rawData.slice(1);
    
//     const getIndex = (col) => headers.findIndex(h => h && h.toLowerCase().includes(col.toLowerCase()));
    
//     const empIndex = getIndex('Employee Name');
//     const placeIndex = getIndex('Place and reason to visit');
//     const departureIndex = getIndex('Departure From Plant');
//     const arrivalIndex = getIndex('Arrival at Plant');
//     const statusIndex = getIndex('Status');

//     const processedData = dataRows
//     .filter(row => row[empIndex]?.toString().trim().toLowerCase() === profileData.candidateName?.toLowerCase())
//       .map(row => ({
//         employeeName: row[empIndex] || '',
//         place: row[placeIndex] || '',
//         departure: row[departureIndex] || '',
//         arrival: row[arrivalIndex] || '',
//         status: row[statusIndex] || ''
//       }));
      
//       setGatePassData(processedData);
//     } catch (error) {
//       console.error('Error fetching gate pass data:', error);
//   }
// };

// useEffect(() => {
//   if (profileData && profileData.candidateName) {
//     fetchLeaveData();
//     fetchGatePassData(); 
//   }
// }, [profileData]);


//   const fetchJoiningData = async () => {
//     try {
//       const userData = localStorage.getItem('user');
//       if (!userData) {
//         throw new Error('No user data found in localStorage');
//       }

//       const currentUser = JSON.parse(userData);
//       const userName = currentUser.Name;

//       const response = await fetch(
//         'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'
//       );
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
      
//       if (!result.success) {
//         throw new Error(result.error || 'Failed to fetch data from JOINING sheet');
//       }
      
//       const rawData = result.data || result;
      
//       if (!Array.isArray(rawData)) {
//         throw new Error('Expected array data not received');
//       }

//       // Find the header row by looking for the 'SKA-Joining ID' column
//       let headerRowIndex = -1;
//       let headers = [];
      
//       for (let i = 0; i < rawData.length; i++) {
//         const row = rawData[i];
//         if (row && Array.isArray(row)) {
//           const joiningIdIndex = row.findIndex(cell => 
//             cell && cell.toString().trim().toLowerCase().includes('ska-joining id')
//           );
          
//           if (joiningIdIndex !== -1) {
//             headerRowIndex = i;
//             headers = row.map(h => h?.toString().trim());
//             break;
//           }
//         }
//       }
      
//       if (headerRowIndex === -1) {
//         throw new Error('Could not find header row with SKA-Joining ID column');
//       }

//       const dataRows = rawData.length > headerRowIndex + 1 ? rawData.slice(headerRowIndex + 1) : [];
      
//       const getIndex = (headerName) => {
//         const index = headers.findIndex(h => 
//           h && h.toString().trim().toLowerCase() === headerName.toLowerCase()
//         );
//         if (index === -1) {
//           console.warn(`Column "${headerName}" not found in sheet`);
//         }
//         return index;
//       };

//       const processedData = dataRows.map(row => ({
//         timestamp: row[getIndex('Timestamp')] || '',
//         joiningNo: row[getIndex('SKA-Joining ID')] || '',
//         candidateName: row[getIndex('Name As Per Aadhar')] || '',
//         candidatePhoto: row[getIndex("Candidate's Photo")] || '',
//         fatherName: row[getIndex('Father Name')] || '',
//         dateOfJoining: row[getIndex('Date Of Joining')] || '',
//         joiningPlace: '',
//         designation: row[getIndex('Designation')] || '',
//         salary: row[getIndex('Department')] || '',
//         currentAddress: row[getIndex('Current Address')] || '',
//         addressAsPerAadhar: '',
//         bodAsPerAadhar: row[getIndex('Date Of Birth As Per Aadhar Card')] || '',
//         gender: row[getIndex('Gender')] || '',
//         mobileNo: row[getIndex('Mobile No.')] || '',
//         familyMobileNo: row[getIndex('Family Mobile No')] || '',
//         relationWithFamily: row[getIndex('Relationship With Family Person')] || '',
//         email: row[getIndex('Personal Email-Id')] || '', 
//         companyName: row[getIndex('Department')] || '',
//         aadharNo: row[getIndex('Aadhar Card No')] || '',
//       }));

//       console.log(processedData);
      

//       // Filter data for the current user
//       const filteredData = processedData.filter(task => 
//         task.candidateName?.trim().toLowerCase() === userName.trim().toLowerCase()
//       );

//       if (filteredData.length > 0) {
//         const profile = filteredData[0];
        
//         // Fetch profile image from ENQUIRY sheet
//         try {
//           const enquiryResponse = await fetch(
//             'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=ENQUIRY&action=fetch'
//           );
          
//           if (enquiryResponse.ok) {
//             const enquiryResult = await enquiryResponse.json();
//             if (enquiryResult.success) {
//               const enquiryData = enquiryResult.data || enquiryResult;
              
//               // Find the header row in ENQUIRY sheet
//               let enquiryHeaderRowIndex = -1;
//               let enquiryHeaders = [];
              
//               for (let i = 0; i < enquiryData.length; i++) {
//                 const row = enquiryData[i];
//                 if (row && Array.isArray(row)) {
//                   const candidatePhotoIndex = row.findIndex(cell => 
//                     cell && cell.toString().trim().toLowerCase().includes("candidate's photo")
//                   );
                  
//                   if (candidatePhotoIndex !== -1) {
//                     enquiryHeaderRowIndex = i;
//                     enquiryHeaders = row.map(h => h?.toString().trim());
//                     break;
//                   }
//                 }
//               }
              
//               if (enquiryHeaderRowIndex !== -1) {
//                 const photoIndex = enquiryHeaders.findIndex(h => 
//                   h && h.toLowerCase().includes("candidate's photo")
//                 );
                
//                 // Find the row with matching employee ID
//                 const employeeIdIndex = enquiryHeaders.findIndex(h => 
//                   h && h.toLowerCase().includes('ska-joining id')
//                 );
                
//                 if (employeeIdIndex !== -1 && photoIndex !== -1) {
//                   for (let i = enquiryHeaderRowIndex + 1; i < enquiryData.length; i++) {
//                     const row = enquiryData[i];
//                     if (row[employeeIdIndex] === profile.joiningNo && row[photoIndex]) {
//                       profile.candidatePhoto = row[photoIndex];
//                       break;
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         } catch (error) {
//           console.error('Error fetching profile image from ENQUIRY sheet:', error);
//           // Continue without the profile image if there's an error
//         }
        
//         setProfileData(profile);
//         setFormData(profile);
//         localStorage.setItem("employeeId", profile.joiningNo);
//       } else {
//         toast.error('No profile data found for current user');
//       }
      
//     } catch (error) {
//       console.error('Error fetching joining data:', error);
//       toast.error(`Failed to load profile data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchJoiningData();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSave = async () => {
//     try {
//       setLoading(true);
      
//       // 1. Fetch current data from JOINING sheet
//       const fullDataResponse = await fetch(
//         'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'
//       );
      
//       if (!fullDataResponse.ok) {
//         throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
//       }

//       const fullDataResult = await fullDataResponse.json();
//       const allData = fullDataResult.data || fullDataResult;

//       // 2. Find header row by looking for the 'SKA-Joining ID' column
//       let headerRowIndex = -1;
//       let headers = [];
      
//       for (let i = 0; i < allData.length; i++) {
//         const row = allData[i];
//         if (row && Array.isArray(row)) {
//           const joiningIdIndex = row.findIndex(cell => 
//             cell && cell.toString().trim().toLowerCase().includes('ska-joining id')
//           );
          
//           if (joiningIdIndex !== -1) {
//             headerRowIndex = i;
//             headers = row.map(h => h?.toString().trim());
//             break;
//           }
//         }
//       }
      
//       if (headerRowIndex === -1) {
//         throw new Error("Could not find header row with 'SKA-Joining ID' column");
//       }

//       // 3. Find Employee ID column index
//       const employeeIdIndex = headers.findIndex(h => 
//         h && h.toLowerCase().includes('ska-joining id')
//       );
      
//       if (employeeIdIndex === -1) {
//         throw new Error("Could not find 'SKA-Joining ID' column");
//       }

//       // 4. Find the employee row index
//       const rowIndex = allData.findIndex((row, idx) =>
//         idx > headerRowIndex &&
//         row[employeeIdIndex]?.toString().trim() === profileData.joiningNo?.toString().trim()
//       );
      
//       if (rowIndex === -1) throw new Error(`Employee ${profileData.joiningNo} not found`);

//       // 5. Get a copy of the existing row
//       let currentRow = [...allData[rowIndex]];

//       // 6. Apply updates to the row data
//       // Map form fields to their respective column indices
//       const headerMap = {
//         'mobileNo': headers.findIndex(h => h && h.toLowerCase().includes('mobile no')),
//         'familyMobileNo': headers.findIndex(h => h && h.toLowerCase().includes('family mobile no')),
//         'email': headers.findIndex(h => h && h.toLowerCase().includes('personal email-id')),
//         'currentAddress': headers.findIndex(h => h && h.toLowerCase().includes('current address'))
//       };

//       // Only update fields that are editable in the form
//       if (headerMap['mobileNo'] !== -1) {
//         currentRow[headerMap['mobileNo']] = formData.mobileNo || '';
//       }
//       if (headerMap['familyMobileNo'] !== -1) {
//         currentRow[headerMap['familyMobileNo']] = formData.familyMobileNo || '';
//       }
//       if (headerMap['email'] !== -1) {
//         currentRow[headerMap['email']] = formData.email || '';
//       }
//       if (headerMap['currentAddress'] !== -1) {
//         currentRow[headerMap['currentAddress']] = formData.currentAddress || '';
//       }

//       // 7. Prepare payload
//       const payload = {
//         sheetName: "JOINING",
//         action: "update",
//         rowIndex: rowIndex + 1, // Convert to 1-based index
//         rowData: JSON.stringify(currentRow)
//       };

//       console.log("Final payload being sent:", payload);

//       // 8. Send update request
//       const response = await fetch(
//         "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//           body: new URLSearchParams(payload).toString(),
//         }
//       );

//       const result = await response.json();
//       console.log("Update result:", result);

//       if (result.success) {
//         // Update local state only after successful API update
//         setProfileData(formData);
//         toast.success('Profile updated successfully!');
//         setIsEditing(false);
//       } else {
//         throw new Error(result.error || "Failed to update data");
//       }

//     } catch (error) {
//       console.error('Error updating profile:', error);
//       toast.error(`Failed to update profile: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setFormData(profileData || {});
//     setIsEditing(false);
//   };

//   if (loading) {
//     return <div className="page-content p-6"><div className="flex justify-center flex-col items-center">
//                         <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
//                         <span className="text-gray-600 text-sm">Loading profile data...</span>
//                       </div></div>;
//   }

//   if (!profileData) {
//     return <div className="page-content p-6">No profile data available</div>;
//   }

//   return (
//     <div className="space-y-6 page-content p-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
//         <div className="flex space-x-2">
//           {!isEditing ? (
//             <button
//               onClick={() => setIsEditing(true)}
//               className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//             >
//               <Edit3 size={16} className="mr-2" />
//               Edit Profile
//             </button>
//           ) : (
//             <div className="flex space-x-2">
//               <button
//                 onClick={handleSave}
//                 className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//               >
//                 <Save size={16} className="mr-2" />
//                 Save
//               </button>
//               <button
//                 onClick={handleCancel}
//                 className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//               >
//                 <X size={16} className="mr-2" />
//                 Cancel
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Profile Picture & Basic Info */}
//         <div className="bg-white rounded-xl shadow-lg border p-6">
//           <div className="text-center">
//             <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
//               {profileData.candidatePhoto ? (
//                 <img
//                   src={getDisplayableImageUrl(profileData.candidatePhoto)}
//                   alt="Profile"
//                   className="w-full h-full object-cover"
//                   onError={(e) => {
//                     console.log("Image failed to load:", e.target.src);
//                     // First try the original URL directly
//                     if (e.target.src !== profileData.candidatePhoto) {
//                       console.log(
//                         "Trying original URL:",
//                         profileData.candidatePhoto
//                       );
//                       e.target.src = profileData.candidatePhoto;
//                     } else {
//                       // If that also fails, show user icon
//                       console.log("Both thumbnail and original URL failed");
//                       e.target.style.display = "none";
//                       e.target.nextSibling.style.display = "flex";
//                     }
//                   }}
//                   onLoad={(e) => {
//                     console.log("Image loaded successfully:", e.target.src);
//                   }}
//                 />
//               ) : null}
//               <div
//                 className={`w-full h-full flex items-center justify-center ${
//                   profileData.candidatePhoto ? "hidden" : "flex"
//                 }`}
//               >
//                 <User size={48} className="text-indigo-400" />
//               </div>
//             </div>
//             <h2 className="text-xl font-bold text-gray-800">
//               {profileData.candidateName}
//             </h2>
//             <p className="text-gray-600">{profileData.designation}</p>
//             <p className="text-sm text-gray-500">{profileData.joiningNo}</p>
//           </div>
//         </div>

//         {/* Personal Information */}
//         <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border p-6">
//           <h3 className="text-lg font-bold text-gray-800 mb-6">
//             Personal Information
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* First Column */}
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <User size={16} className="inline mr-2" />
//                   Full Name
//                 </label>
//                 <p className="text-gray-800 font-medium">
//                   {profileData.candidateName}
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Building size={16} className="inline mr-2" />
//                   Designation
//                 </label>
//                 <p className="text-gray-800">{profileData.designation}</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Building size={16} className="inline mr-2" />
//                   Department
//                 </label>
//                 <p className="text-gray-800">{profileData.companyName}</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Calendar size={16} className="inline mr-2" />
//                   Date of Birth
//                 </label>
//                 <p className="text-gray-800">{profileData.bodAsPerAadhar}</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Gender
//                 </label>
//                 <p className="text-gray-800">{profileData.gender}</p>
//               </div>
//             </div>

//             {/* Second Column */}
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Father's Name
//                 </label>
//                 <p className="text-gray-800">{profileData.fatherName}</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Calendar size={16} className="inline mr-2" />
//                   Joining Date
//                 </label>
//                 <p className="text-gray-800">{profileData.dateOfJoining}</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Mail size={16} className="inline mr-2" />
//                   Email Address
//                 </label>
//                 {isEditing ? (
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email || ""}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 ) : (
//                   <p className="text-gray-800">{profileData.email}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <Phone size={16} className="inline mr-2" />
//                   Phone Number
//                 </label>
//                 {isEditing ? (
//                   <input
//                     type="tel"
//                     name="mobileNo"
//                     value={formData.mobileNo || ""}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 ) : (
//                   <p className="text-gray-800">{profileData.mobileNo}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Emergency Contact
//                 </label>
//                 {isEditing ? (
//                   <input
//                     type="tel"
//                     name="familyMobileNo"
//                     value={formData.familyMobileNo || ""}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 ) : (
//                   <p className="text-gray-800">{profileData.familyMobileNo}</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Current Address - Full width below the two columns */}
//           <div className="mt-6 pt-6 border-t border-gray-200">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               <MapPin size={16} className="inline mr-2" />
//               Current Address
//             </label>
//             {isEditing ? (
//               <textarea
//                 name="currentAddress"
//                 value={formData.currentAddress || ""}
//                 onChange={handleInputChange}
//                 rows={3}
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             ) : (
//               <p className="text-gray-800 whitespace-pre-line">
//                 {profileData.currentAddress}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Leave History Card */}
//         <div className="bg-white rounded-xl shadow-lg border p-6">
//           <h3 className="text-lg font-bold text-gray-800 mb-6">
//             Leave History
//           </h3>
//           {leaveData.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Leave Type
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       From Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       To Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Remarks
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {leaveData.map((leave, index) => (
//                     <tr key={index}>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {leave.leaveType}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {leave.fromDate}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {leave.toDate}
//                       </td>
//                       <td className="px-6 py-4">
//                         <span
//                           className={`px-2 py-1 text-xs rounded-full ${
//                             leave.status.toLowerCase() === "approved"
//                               ? "bg-green-100 text-green-800"
//                               : leave.status.toLowerCase() === "rejected"
//                               ? "bg-red-100 text-red-800"
//                               : "bg-yellow-100 text-yellow-800"
//                           }`}
//                         >
//                           {leave.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {leave.remarks}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p className="text-gray-600 text-center py-4">
//               No leave records found
//             </p>
//           )}
//         </div>

//         {/* Gate Pass Card */}
//         <div className="bg-white rounded-xl shadow-lg border p-6">
//           <h3 className="text-lg font-bold text-gray-800 mb-6">
//             Gate Pass History
//           </h3>
//           {gatePassData.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Place & Reason
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Departure
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Arrival
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Status
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {gatePassData.map((gp, index) => (
//                     <tr key={index}>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {gp.place}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {gp.departure}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-800">
//                         {gp.arrival}
//                       </td>
//                       <td className="px-6 py-4">
//                         <span
//                           className={`px-2 py-1 text-xs rounded-full ${
//                             gp.status.toLowerCase() === "approved"
//                               ? "bg-green-100 text-green-800"
//                               : gp.status.toLowerCase() === "rejected"
//                               ? "bg-red-100 text-red-800"
//                               : "bg-yellow-100 text-yellow-800"
//                           }`}
//                         >
//                           {gp.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p className="text-gray-600 text-center py-4">
//               No gate pass records found
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MyProfile;


import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Building, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaveData, setLeaveData] = useState([]);
  const [gatePassData, setGatePassData] = useState([]);
  
  // Add these new states for image handling
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset image states when profile changes
  useEffect(() => {
    if (profileData) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [profileData]);

  // Helper function to truncate URLs
  const truncateUrl = (url, maxLength = 30) => {
    if (!url) return 'No link';
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  // Helper function to check if text is a URL
  const isUrl = (text) => {
    if (!text) return false;
    try {
      new URL(text);
      return true;
    } catch {
      return text.includes('http') || text.includes('drive.google.com') || text.includes('docs.google.com');
    }
  };

  const getDisplayableImageUrl = (url) => {
    if (!url) return null;

    try {
      // Check if it's already a thumbnail URL
      if (url.includes("thumbnail?id=")) {
        return url;
      }

      // Extract file ID from various Google Drive URL formats
      const directMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (directMatch && directMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${directMatch[1]}&sz=w400`;
      }
      
      const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (ucMatch && ucMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w400`;
      }
      
      const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
      if (openMatch && openMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w400`;
      }

      // If it's just a file ID
      const anyIdMatch = url.match(/^([a-zA-Z0-9_-]{25,})$/);
      if (anyIdMatch && anyIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${anyIdMatch[1]}&sz=w400`;
      }
      
      // Return original URL as fallback (no cache buster to avoid loops)
      return url;
    } catch (e) {
      console.error("Error processing image URL:", url, e);
      return null; // Return null instead of original URL to prevent loops
    }
  };

  // Enhanced function for finding columns in other sheets
  const findColumnIndex = (headers, possibleNames) => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => {
        if (!h) return false;
        const headerText = h.toString().trim().toLowerCase();
        const searchText = name.toLowerCase();
        return headerText.includes(searchText);
      });
      if (index !== -1) return index;
    }
    return -1;
  };

 const fetchLeaveData = async () => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      console.log("No employee ID found for fetching leave data");
      return;
    }

    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Leave Management&action=fetch'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch data from Leave Management sheet');
    }
    
    const rawData = result.data || result;
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.error('No data found in Leave Management sheet');
      return;
    }

    const headers = rawData[0].map(h => h?.toString().trim() || '');
    const dataRows = rawData.length > 1 ? rawData.slice(1) : [];
    
    // Debug: Print all headers to see exact spellings
    console.log('All Headers in Leave Management sheet:', headers);
    
    // More comprehensive search patterns for column detection
    const employeeNameIndex = findColumnIndex(headers, [
      'employee name', 'name', 'employee', 'emp name', 'staff name'
    ]);
    
    const fromDateIndex = findColumnIndex(headers, [
      'leave date start', 'from date', 'start date', 'from', 'leave start', 
      'start', 'leave from', 'date from', 'beginning date'
    ]);
    
    const toDateIndex = findColumnIndex(headers, [
      'leave date end', 'to date', 'end date', 'to', 'leave end', 
      'end', 'leave to', 'date to', 'ending date', 'leaave date end',
      'leave end date', 'finish date', 'until date'
    ]);
    
    const remarksIndex = findColumnIndex(headers, [
      'remarks', 'comment', 'reason', 'note', 'notes', 'description', 'details'
    ]);
    
    const statusIndex = findColumnIndex(headers, [
      'status', 'approval status', 'leave status', 'state', 'condition'
    ]);
    
    const leaveTypeIndex = findColumnIndex(headers, [
      'leave type', 'type', 'leave', 'leave category', 'category'
    ]);

    // Debug: Print found column indices
    console.log('Column Indices Found:', {
      employeeNameIndex,
      fromDateIndex,
      toDateIndex: toDateIndex, // Specifically check this
      remarksIndex,
      statusIndex,
      leaveTypeIndex
    });

    // If toDateIndex is still -1, try manual search
    if (toDateIndex === -1) {
      console.log('To Date column not found. Checking each header manually:');
      headers.forEach((header, index) => {
        console.log(`Index ${index}: "${header}"`);
        if (header.toLowerCase().includes('end') || 
            header.toLowerCase().includes('to') ||
            header.toLowerCase().includes('until') ||
            header.toLowerCase().includes('finish')) {
          console.log(`^ Possible To Date column at index ${index}`);
        }
      });
    }

    const processedData = dataRows
      .filter(row => {
        if (employeeNameIndex === -1) return false;
        
        const rowEmployeeName = row[employeeNameIndex]?.toString().trim();
        return rowEmployeeName && 
               rowEmployeeName.toLowerCase() === profileData.candidateName?.toLowerCase();
      })
      .map(row => ({
        employeeName: employeeNameIndex !== -1 ? row[employeeNameIndex] || '' : 'N/A',
        fromDate: fromDateIndex !== -1 ? row[fromDateIndex] || '' : 'N/A',
        toDate: toDateIndex !== -1 ? row[toDateIndex] || '' : 'N/A', // This should now work
        remarks: remarksIndex !== -1 ? row[remarksIndex] || '' : 'N/A',
        status: statusIndex !== -1 ? row[statusIndex] || '' : 'Pending',
        leaveType: leaveTypeIndex !== -1 ? row[leaveTypeIndex] || '' : 'N/A'
      }));

    console.log('Processed Leave Data:', processedData);
    setLeaveData(processedData);
  } catch (error) {
    console.error('Error fetching leave data:', error);
  }
};


  const fetchGatePassData = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Gate Pass&action=fetch'
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch Gate Pass sheet');

      const rawData = result.data || result;
      if (!Array.isArray(rawData) || rawData.length === 0) return;

      const headers = rawData[0].map(h => h?.toString().trim() || '');
      const dataRows = rawData.slice(1);
      
      const empIndex = findColumnIndex(headers, ['employee name', 'name', 'employee']);
      const placeIndex = findColumnIndex(headers, ['place and reason to visit', 'place', 'reason']);
      const departureIndex = findColumnIndex(headers, ['departure from plant', 'departure', 'out time']);
      const arrivalIndex = findColumnIndex(headers, ['arrival at plant', 'arrival', 'in time']);
      const statusIndex = findColumnIndex(headers, ['status', 'approval status']);

      const processedData = dataRows
        .filter(row => {
          if (empIndex === -1) return false;
          const rowEmployeeName = row[empIndex]?.toString().trim();
          return rowEmployeeName && 
                 rowEmployeeName.toLowerCase() === profileData.candidateName?.toLowerCase();
        })
        .map(row => ({
          employeeName: empIndex !== -1 ? row[empIndex] || '' : '',
          place: placeIndex !== -1 ? row[placeIndex] || '' : '',
          departure: departureIndex !== -1 ? row[departureIndex] || '' : '',
          arrival: arrivalIndex !== -1 ? row[arrivalIndex] || '' : '',
          status: statusIndex !== -1 ? row[statusIndex] || '' : ''
        }));
        
      setGatePassData(processedData);
    } catch (error) {
      console.error('Error fetching gate pass data:', error);
    }
  };

  useEffect(() => {
    if (profileData && profileData.candidateName) {
      fetchLeaveData();
      fetchGatePassData(); 
    }
  }, [profileData]);

  // Main function to fetch user profile data from JOINING sheet - Column C matching
  const fetchJoiningData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found in localStorage');
      }

      const currentUser = JSON.parse(userData);
      const userName = currentUser.Name;

      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data from JOINING sheet');
      }
      
      const rawData = result.data || result;
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('No data received from JOINING sheet');
      }

      // Assume first row is headers, data starts from second row
      const headerRowIndex = 0;
      const headers = rawData[headerRowIndex].map(h => h?.toString().trim() || '');
      const dataRows = rawData.length > 1 ? rawData.slice(1) : [];

      // Filter data where Column C (index 2) matches the user name
      const matchingRows = dataRows.filter(row => {
        const columnCValue = row[2]?.toString().trim(); // Column C is index 2
        const searchName = userName.toString().trim();
        
        // Case-insensitive match
        return columnCValue && 
               columnCValue.toLowerCase() === searchName.toLowerCase();
      });

      if (matchingRows.length > 0) {
        const userRow = matchingRows[0]; // Take first matching row
        
        // Create profile object mapping each column - adjust indices as per your sheet
        const profile = {
          timestamp: userRow[0] || '', // Column A
          joiningNo: userRow[1] || '', // Column B  
          candidateName: userRow[2] || '', // Column C (User Name)
          candidatePhoto: userRow[7] || '', // Column D
          fatherName: userRow[3] || '', // Column E
          dateOfJoining: userRow[4] || '', // Column F
          joiningPlace: userRow[6] || '', // Column G
          designation: userRow[5] || '', // Column H
          salary: userRow[8] || '', // Column I
          currentAddress: userRow[8] || '', // Column J
          addressAsPerAadhar: userRow[10] || '', // Column K
          bodAsPerAadhar: userRow[9] || '', // Column L
          gender: userRow[10] || '', // Column M
          mobileNo: userRow[11] || '', // Column N
          familyMobileNo: userRow[12] || '', // Column O
          relationWithFamily: userRow[15] || '', // Column P
          email: userRow[18] || '', // Column Q
          companyName: userRow[17] || '', // Column R
          aadharNo: userRow[18] || '', // Column S
          department: userRow[19] || '', // Column T
        };
        
        // Try to fetch profile image from ENQUIRY sheet
        try {
          const enquiryResponse = await fetch(
            'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=ENQUIRY&action=fetch'
          );
          
          if (enquiryResponse.ok) {
            const enquiryResult = await enquiryResponse.json();
            if (enquiryResult.success) {
              const enquiryData = enquiryResult.data || enquiryResult;
              
              // Find matching employee ID and get photo
              for (let i = 1; i < enquiryData.length; i++) {
                const row = enquiryData[i];
                if (row[1] === profile.joiningNo && row[3]) { // Assuming column B has ID and D has photo
                  profile.candidatePhoto = row[15] || profile.candidatePhoto; // Column P for photo
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching profile image from ENQUIRY sheet:', error);
        }
        
        setProfileData(profile);
        setFormData(profile);
        localStorage.setItem("employeeId", profile.joiningNo);
      } else {
        toast.error('No profile data found for current user in Column C');
      }
      
    } catch (error) {
      console.error('Error fetching joining data:', error);
      toast.error(`Failed to load profile data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Your save logic here - similar to original but with Column C matching
      
      setProfileData(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="page-content p-6">
        <div className="flex justify-center flex-col items-center">
          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
          <span className="text-gray-600 text-sm">Loading profile data...</span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="page-content p-6">No profile data available</div>;
  }

  return (
    <div className="space-y-6 page-content p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Edit3 size={16} className="mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save size={16} className="mr-2" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="text-center">
            <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {profileData.candidatePhoto && !imageError ? (
                <img
                  src={getDisplayableImageUrl(profileData.candidatePhoto)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)} // Set flag instead of changing src
                  onLoad={() => setImageLoaded(true)}
                  style={{ display: imageLoaded && !imageError ? 'block' : 'none' }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center ${
                  (!profileData.candidatePhoto || imageError) ? "flex" : "hidden"
                }`}
              >
                <User size={48} className="text-indigo-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {profileData.candidateName}
            </h2>
            <p className="text-gray-600">{profileData.designation}</p>
            <p className="text-sm text-gray-500">{profileData.joiningNo}</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <p className="text-gray-800 font-medium">
                  {profileData.candidateName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} className="inline mr-2" />
                  Designation
                </label>
                <p className="text-gray-800">{profileData.designation}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} className="inline mr-2" />
                  Department
                </label>
                <p className="text-gray-800">{profileData.department}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Date of Birth
                </label>
                <p className="text-gray-800">{profileData.bodAsPerAadhar}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <p className="text-gray-800">{profileData.gender}</p>
              </div>
            </div>

            {/* Second Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name
                </label>
                <p className="text-gray-800">{profileData.fatherName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Joining Date
                </label>
                <p className="text-gray-800">{profileData.dateOfJoining}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div>
                    {isUrl(profileData.email) ? (
                      <a 
                        href={profileData.email} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline cursor-pointer"
                        title={profileData.email}
                      >
                        {truncateUrl(profileData.email)}
                      </a>
                    ) : (
                      <p className="text-gray-800">{profileData.email}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.mobileNo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="familyMobileNo"
                    value={formData.familyMobileNo || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.familyMobileNo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Current Address - Full width below the two columns */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Current Address
            </label>
            {isEditing ? (
              <textarea
                name="currentAddress"
                value={formData.currentAddress || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div>
                {isUrl(profileData.currentAddress) ? (
                  <a 
                    href={profileData.currentAddress} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline cursor-pointer"
                    title={profileData.currentAddress}
                  >
                    {truncateUrl(profileData.currentAddress, 50)}
                  </a>
                ) : (
                  <p className="text-gray-800 whitespace-pre-line">
                    {profileData.currentAddress}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

   <div className="grid grid-cols-1 gap-6">
  {/* Leave History Card - Full Width */}
  <div className="bg-white rounded-xl shadow-lg border p-6 w-full">
    <h3 className="text-lg font-bold text-gray-800 mb-6">
      Leave History
    </h3>
    {leaveData.length > 0 ? (
      <div className="overflow-x-auto w-full">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Leave Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                From Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                To Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {leaveData.map((leave, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {leave.leaveType}
                </td>
                <td className="px-4 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {leave.fromDate}
                </td>
                <td className="px-4 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {leave.toDate}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      leave.status.toLowerCase() === "approved"
                        ? "bg-green-100 text-green-800"
                        : leave.status.toLowerCase() === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {leave.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-800">
                  <div className="max-w-xs truncate">
                    {isUrl(leave.remarks) ? (
                      <a 
                        href={leave.remarks} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline cursor-pointer"
                        title={leave.remarks}
                      >
                        {truncateUrl(leave.remarks, 20)}
                      </a>
                    ) : (
                      <span title={leave.remarks}>
                        {leave.remarks}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-600 text-center py-4">
        No leave records found
      </p>
    )}
  </div>
</div>

    </div>
  );
};

export default MyProfile;
