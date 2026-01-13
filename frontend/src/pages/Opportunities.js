import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Plus, ArrowRight, Filter, Upload, Download, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import OpportunityFormTabbed from '../components/OpportunityFormTabbed';
import AttachmentCell from '../components/attachments/AttachmentCell';
import AttachmentPreviewModal from '../components/attachments/AttachmentPreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
import { saveAs } from 'file-saver';
import { Input } from '../components/ui/input';

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const fileInputRef = useRef(null);

  // State for filters
  const [filters, setFilters] = useState({
    opportunityName: 'All Opportunities',
    status: 'All Status',
    client: 'All Clients',
    closeDate: 'All Dates'
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
      status: 'All Status',
      client: 'All Clients',
      closeDate: 'All Dates'
    });
  };

  // Handle download sample template
  const handleDownloadTemplate = () => {
    const template = [
      ['Opportunity ID', 'Opportunity Name', 'Client', 'Status', 'Amount', 'Close Date', 'Created By'],
      // Add more sample data if needed
    ];
    
    const csvContent = template.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'opportunity_template.csv');
  };

  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        console.log('File content:', content);
        // Add your import logic here
        toast.success(`File "${file.name}" imported successfully!`);
      };
      reader.readAsText(file);
    }
    // Reset the file input
    event.target.value = '';
  };

  // Handle export data
  const handleExportData = () => {
    if (opportunities.length === 0) {
      toast.warning('No data to export!');
      return;
    }
    
    const headers = Object.keys(opportunities[0]);
    const csvContent = [
      headers.join(','),
      ...opportunities.map(row => 
        headers.map(fieldName => 
          JSON.stringify(row[fieldName] || '', (key, value) => 
            value === null ? '' : value
          )
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `opportunities_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Sample data for demonstration
  const sampleData = [
    {
      id: 'opp-1001',
      opportunity_id: 'OPP-2024-001',
      created_at: new Date().toISOString(),
      client_name: 'Acme Corporation',
      opportunity_name: 'Enterprise Software License',
      amount: 75000,
      currency: 'USD',
      win_probability: 70,
      lead_source: 'Website',
      type: 'New Business',
      pipeline_status: 'Proposal',
      close_date: '2024-03-15',
      created_by: 'John Doe',
      internal_recommendation: 'High potential client',
      next_steps: 'Schedule demo',
      status: 'Active',
      updated_at: new Date().toISOString()
    },
    {
      id: 'opp-1002',
      opportunity_id: 'OPP-2024-002',
      created_at: new Date().toISOString(),
      client_name: 'Globex Inc',
      opportunity_name: 'Annual Support Contract',
      amount: 25000,
      currency: 'USD',
      win_probability: 90,
      lead_source: 'Referral',
      type: 'Existing Business',
      pipeline_status: 'Negotiation',
      close_date: '2024-02-28',
      created_by: 'Jane Smith',
      internal_recommendation: 'Upsell opportunity',
      next_steps: 'Send contract',
      status: 'Active',
      updated_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Always use sample data for demonstration
    setOpportunities(sampleData);
    setLoading(false);
  }, []);

  // Mock fetchOpportunities function that's still used by other parts of the component
  const fetchOpportunities = async () => {
    return { data: sampleData };
  };

  const handleDelete = async (opportunity) => {
    if (window.confirm(`Are you sure you want to delete this opportunity?`)) {
      try {
        await api.delete(`/opportunity-collections/opportunities/${opportunity.id}`);
        toast.success('Opportunity deleted successfully');
        fetchOpportunities();
      } catch (error) {
        toast.error('Failed to delete opportunity');
      }
    }
  };

  const handleEdit = (opportunity) => {
    setEditingOpportunity(opportunity);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOpportunity(null);
    fetchOpportunities();
  };

 

  const handleViewAttachments = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowAttachments(true);
  };

  const columns = [
    {
      key: 'opportunity_name',
      header: 'Opportunity Name',
      headerClassName: 'text-[18px] font-medium',
      render: (value) => (
        <span className="font-medium text-sm">
          {value || 'N/A'}
        </span>
      )
    },
    { 
      key: 'client_name', 
      header: 'Client',
      headerClassName: 'text-[18px] font-medium',
      render: (value) => (
        <span className="text-sm">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'text-[18px] font-medium',
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      headerClassName: 'text-[18px] font-medium',
      render: (value, row) => (
        <span className="font-medium text-sm">
          {row.currency || 'USD'} {(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'close_date',
      header: 'Close Date',
      headerClassName: 'text-[18px] font-medium',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-[18px] font-medium',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 p-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </Button>
        </div>
      )
    }
  ];

  const filterOptions = {
    pipeline_status: ['Prospecting', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed'],
    status: ['Active', 'Closed'],
    type: ['New Business', 'Existing Business'],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6AA6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="opportunities-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Opportunities</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage sales opportunities and track progress</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center space-x-2">
            <Search className="absolute left-3 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-9 w-[200px] text-sm"
            />
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
          <Button
            onClick={() => setShowForm(true)}
            data-testid="add-opportunity-btn"
            className="bg-[#0A2A43] hover:bg-[#0A2A43]/90 h-9 text-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Opportunity
          </Button>
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
              {Array.from(new Set(opportunities.map(opp => opp.opportunity_name))).map((name, index) => (
                <option key={index} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-40 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Closed</option>
              <option>Won</option>
              <option>Lost</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Client</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-40 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.client}
              onChange={(e) => handleFilterChange('client', e.target.value)}
            >
              <option>All Clients</option>
              {Array.from(new Set(opportunities.map(opp => opp.client_name))).map((client, index) => (
                <option key={index} value={client}>{client}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Close Date</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-44 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
              value={filters.closeDate}
              onChange={(e) => handleFilterChange('closeDate', e.target.value)}
            >
              <option>All Dates</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Next Month</option>
              <option>Past Due</option>
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

      <DataTable
        data={opportunities}
        columns={columns}
        // onImport={handleImport}
        filterOptions={filterOptions}
        testId="opportunities-table"
      />
 
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOpportunity ? 'Edit Opportunity' : 'Add New Opportunity'}</DialogTitle>
          </DialogHeader>
          <OpportunityFormTabbed opportunity={editingOpportunity} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>
 
      <AttachmentPreviewModal
        isOpen={showAttachments}
        onClose={() => setShowAttachments(false)}
        attachments={selectedOpportunity?.attachments || []}
        entityName={selectedOpportunity?.opportunity_name || 'Opportunity'}
      />
    </div>
  );
};
 
export default Opportunities;
 