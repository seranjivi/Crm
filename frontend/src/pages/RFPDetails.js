import React, { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Filter, Upload, Download, Search, Bell, Plus } from 'lucide-react';
import { Input } from '../components/ui/input';
import { saveAs } from 'file-saver';

const RFPDetails = () => {
  // State for filters
  const [filters, setFilters] = useState({
    opportunityName: 'All Opportunities',
    rfpStatus: 'All Status',
    rfpManager: 'All Managers',
    submissionDeadline: 'All Deadlines'
  });

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      opportunityName: 'All Opportunities',
      rfpStatus: 'All Status',
      rfpManager: 'All Managers',
      submissionDeadline: 'All Deadlines'
    });
  };

  // Create a ref for the file input
  const fileInputRef = useRef(null);

  // Handle download sample template
  const handleDownloadTemplate = () => {
    // Create a sample template (you can customize this as needed)
    const template = [
      ['Opportunity Name', 'RFP Title', 'Status', 'Manager', 'Deadline', 'Created On'],
      // Add more sample data if needed
    ];
    
    // Convert to CSV
    const csvContent = template.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'rfp_template.csv');
  };

  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Process the file content here
        console.log('File content:', content);
        // You can add your import logic here
        alert(`File "${file.name}" imported successfully!`);
      };
      reader.readAsText(file);
    }
    // Reset the file input
    event.target.value = '';
  };

  // Handle export data
  const handleExportData = () => {
    // Get the data you want to export (this is just a sample)
    const data = [
      // Add your data here
    ];
    
    if (data.length === 0) {
      alert('No data to export!');
      return;
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => 
          JSON.stringify(row[fieldName], (key, value) => 
            value === null ? '' : value
          )
        ).join(',')
      )
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `rfp_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">RFP DETAILS PORTFOLIO</h1>
          <p className="text-sm text-gray-500">Procurement and Submission Tracking</p>
        </div>
       <div className="flex items-center space-x-4">
  <div className="relative flex items-center space-x-2">
   <div className="relative w-[200px]">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />

  <Input
    type="search"
    placeholder="Search"
    className="pl-9 text-sm"
  />
</div>
    <Button 
      variant="outline" 
      className="h-9 text-gray-700 border-gray-300 whitespace-nowrap"
      onClick={handleDownloadTemplate}
    >
      <Download className="mr-2 h-4 w-4" />
      Sample Template
    </Button>
    <div className="relative">
      <Button 
        variant="outline" 
        className="h-9 text-gray-700 border-gray-300"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />
    </div>
    <Button 
      variant="outline" 
      className="h-9 text-gray-700 border-gray-300"
      onClick={handleExportData}
    >
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  </div>
</div>
      </div>

      <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-end space-x-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Opportunity Name</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-48 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.opportunityName}
              onChange={(e) => handleFilterChange('opportunityName', e.target.value)}
            >
              <option>All Opportunities</option>
              <option>Enterprise Cloud Migration</option>
              <option>Digital Transformation Initiative</option>
              <option>CRM Implementation</option>
              <option>Cybersecurity Upgrade</option>
              <option>Data Analytics Platform</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">RFP Status</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-40 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.rfpStatus}
              onChange={(e) => handleFilterChange('rfpStatus', e.target.value)}
            >
              <option>All Status</option>
              <option>Draft</option>
              <option>In Progress</option>
              <option>Submitted</option>
              <option>Won</option>
              <option>Lost</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">RFP Manager</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-40 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.rfpManager}
              onChange={(e) => handleFilterChange('rfpManager', e.target.value)}
            >
              <option>All Managers</option>
              <option>John Doe</option>
              <option>Jane Smith</option>
              <option>Alex Johnson</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Submission Deadline</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-44 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.submissionDeadline}
              onChange={(e) => handleFilterChange('submissionDeadline', e.target.value)}
            >
              <option>All Deadlines</option>
              <option>Today</option>
              <option>This Week</option>
              <option>Next Week</option>
              <option>This Month</option>
            </select>
          </div>
          <Button 
            variant="outline" 
            className="text-gray-700 border-gray-300 hover:bg-gray-50 h-9"
            onClick={clearFilters}
            >
            Clear Filters
            </Button>
        </div>
        
        
      </div>

      <div className="rounded-md border">
        <div className="w-full">
          <div className="bg-[#f8fafc] grid grid-cols-6 border-b border-gray-200">
            <div className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Opportunity Name
            </div>
            <div className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              RFP Title
            </div>
            <div className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              RFP Status
            </div>
            <div className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              RFP Manager
            </div>
            <div className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Submission Deadline
            </div>
            <div className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Created On
            </div>
          </div>
          <div className="bg-white">
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No data found
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPDetails;
