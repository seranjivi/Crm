import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import DataTable from '../components/DataTable';
import LeadForm from '../components/LeadFormEnhanced';
import LeadDetail from '../components/LeadDetail';
import AttachmentCell from '../components/attachments/AttachmentCell';
import AttachmentPreviewModal from '../components/attachments/AttachmentPreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
import ColumnFilter from '../components/ColumnFilter';
import LeadStatusBadge from '../components/LeadStatusBadge';
import LeadStatusKPI from '../components/LeadStatusKPI';
 
const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
 
  useEffect(() => {
    fetchLeads();
  }, []);
 
  useEffect(() => {
    // Apply filters whenever leads data or filters change
    applyFilters();
  }, [leads, activeFilters]);
 
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leads');
     
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        // If the response is directly an array of leads
        setLeads(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // If the response is { success, data, total }
        setLeads(response.data.data);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // If the response is { success: true, data: [...], total: X }
        setLeads(response.data.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setLeads([]);
        throw new Error('Unexpected response format from server');
      }
     
      // Apply any active filters to the new data
      applyFilters();
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };
 
  const applyFilters = () => {
    if (activeFilters.length === 0) {
      setFilteredLeads(leads);
      return;
    }
 
    const filtered = leads.filter(lead => {
      return activeFilters.every(filter => {
        if (filter.values.length === 0) return true;
       
        let fieldValue = lead[filter.column];
       
        // Handle special cases for date filtering
        if (filter.column === 'created_at') {
          const filterValue = filter.values[0];
          if (!filterValue) return true;
         
          const leadDate = new Date(lead[filter.column]);
          if (isNaN(leadDate.getTime())) return true;
         
          // Handle single date filter
          if (!filterValue.includes(' to ')) {
            const filterDate = new Date(filterValue);
            if (isNaN(filterDate.getTime())) return true;
           
            // Filter for leads created on this specific date
            return leadDate.toDateString() === filterDate.toDateString();
          }
         
          // Handle date range filter
          const [fromStr, toStr] = filterValue.split(' to ');
          const fromDate = new Date(fromStr);
          const toDate = new Date(toStr);
         
          if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return true;
         
          // Include the entire end date
          toDate.setHours(23, 59, 59, 999);
         
          return leadDate >= fromDate && leadDate <= toDate;
        }
       
        // Handle special cases for combined columns
        if (filter.column === 'contact_details') {
          fieldValue = `${lead.contact_email || ''} ${lead.contact_phone || ''}`.trim();
        }
       
        // Apply OR logic for multiple selected values
        return filter.values.some(selectedValue => {
          if (fieldValue === null || fieldValue === undefined) return false;
          return fieldValue.toString().toLowerCase().includes(selectedValue.toString().toLowerCase());
        });
      });
    });
 
    setFilteredLeads(filtered);
  };
 
  const handleFilterChange = (column, values) => {
    setActiveFilters(prev => {
      const existingFilterIndex = prev.findIndex(f => f.column === column);
     
      if (values.length === 0) {
        // Remove filter if no values selected
        return prev.filter(f => f.column !== column);
      }
     
      if (existingFilterIndex >= 0) {
        // Update existing filter
        const newFilters = [...prev];
        newFilters[existingFilterIndex] = { column, values };
        return newFilters;
      } else {
        // Add new filter
        return [...prev, { column, values }];
      }
    });
  };
 
  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };
 
  const handleDelete = async (lead) => {
    if (window.confirm(`Are you sure you want to delete this lead?`)) {
      try {
        await api.delete(`/leads/${lead.id}`);
        toast.success('Lead deleted successfully');
        fetchLeads();
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };
 
  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setShowDetail(true);
  };
 
  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowForm(true);
    setShowDetail(false);
  };
 
  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedLead(null);
  };
 
  const handleDeleteLead = (lead) => {
    if (window.confirm(`Are you sure you want to delete this lead?`)) {
      try {
        api.delete(`/leads/${lead.id}`);
        toast.success('Lead deleted successfully');
        fetchLeads();
        setShowDetail(false);
        setSelectedLead(null);
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };
 
  const handleFormClose = () => {
    setShowForm(false);
    setEditingLead(null);
    fetchLeads();
  };
 
  const handleImport = () => {
    toast.info('Import functionality coming soon! You can upload CSV files to bulk import leads.');
  };
 
  const handleViewAttachments = (lead) => {
    setSelectedLead(lead);
    setShowAttachments(true);
  };
 
  const columns = [
    {
      key: 'task_id',
      header: 'Lead ID',
      render: (value, row) => (
        <span
          className="font-['JetBrains_Mono'] text-xs font-semibold text-[#2C6AA6] cursor-pointer hover:underline"
          onClick={() => handleEdit(row)}
        >
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'client_name',
      header: 'Client / Account Name',
      filterable: true
    },
    {
      key: 'opportunity_name',
      header: 'Opportunity Name',
      filterable: true
    },
    {
      key: 'lead_score',
      header: 'Lead Score',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 70 ? 'bg-green-100 text-green-700' :
          value >= 40 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {value || 0}
        </span>
      )
    },
    {
      key: 'lead_owner',
      header: 'Lead Owner',
      filterable: true
    },
    {
      key: 'sales_poc',
      header: 'Lead Assignee',
      filterable: true
    },
    {
      key: 'lead_status',
      header: 'Lead Status',
      render: (value, row) => <LeadStatusBadge status={value} leadId={row.id} />
    },
    {
      key: 'region',
      header: 'Region',
      filterable: true
    },
    {
      key: 'country',
      header: 'Country',
      filterable: true
    },
    {
      key: 'industry',
      header: 'Industry',
      filterable: true
    },
    {
      key: 'probability',
      header: 'Probability (%)',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{width: `${value || 0}%`}}
            ></div>
          </div>
          <span className="text-xs">{value || 0}%</span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (value) => <span className="text-xs text-slate-700">{formatDate(value)}</span>
    },
  ];
 
  const filterOptions = {
    lead_stage: ['New', 'In Progress', 'Qualified', 'Unqualified'],
    lead_status: ['Active', 'Delayed', 'Completed', 'Rejected'],
    region: [...new Set(leads.map(l => l.region).filter(Boolean))],
  };
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6AA6]"></div>
      </div>
    );
  }
 
  return (
    <div className="space-y-4" data-testid="leads-page">
      {showDetail && selectedLead ? (
        <LeadDetail
          lead={selectedLead}
          onBack={handleBackToList}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Leads</h1>
            </div>
            <div className="flex gap-2">
              {activeFilters.length > 0 && (
                <Button
                  onClick={handleClearAllFilters}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Clear All Filters
                </Button>
              )}
              <Button
                onClick={() => setShowForm(true)}
                data-testid="add-lead-btn"
                className="bg-[#0A2A43] hover:bg-[#0A2A43]/90 h-9 text-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Lead
              </Button>
            </div>
          </div>
 
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Active filters:</span>
              {activeFilters.map(filter => (
                <span key={filter.column} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {columns.find(c => c.key === filter.column)?.header}: {filter.values.length} selected
                </span>
              ))}
            </div>
          )}
 
          <LeadStatusKPI
            leads={filteredLeads}
            onStatusFilter={handleFilterChange}
            activeFilters={activeFilters}
          />
 
          <DataTable
            data={filteredLeads}
            columns={columns}
            onDelete={handleDelete}
            onImport={handleImport}
            filterOptions={filterOptions}
            testId="leads-table"
            ColumnFilterComponent={ColumnFilter}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        </>
      )}
 
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[90vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <LeadForm lead={editingLead} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>
 
      <AttachmentPreviewModal
        isOpen={showAttachments}
        onClose={() => setShowAttachments(false)}
        attachments={selectedLead?.attachments || []}
        entityName={selectedLead?.opportunity_name || 'Lead'}
      />
    </div>
  );
};
 
export default Leads;
 