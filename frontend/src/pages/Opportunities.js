import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import DataTable from '../components/DataTable';
import OpportunityFormTabbed from '../components/OpportunityFormTabbed';
import AttachmentCell from '../components/attachments/AttachmentCell';
import AttachmentPreviewModal from '../components/attachments/AttachmentPreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
 
const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
 
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
 
  const handleImport = () => {
    toast.info('Import functionality coming soon! You can upload CSV files to bulk import opportunities.');
  };
 
  const handleViewAttachments = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowAttachments(true);
  };
 
  const columns = [
    {
      key: 'opportunity_id',
      header: 'Opportunity ID',
      render: (value) => (
        <span className="font-['JetBrains_Mono'] text-xs font-semibold text-[#2C6AA6]">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (value) => <span className="text-xs text-slate-700">{formatDate(value)}</span>
    },
    { key: 'client_name', header: 'Customer / Account' },
    { key: 'opportunity_name', header: 'Opportunity Name' },
    {
      key: 'amount',
      header: 'Deal Value',
      render: (value, row) => (
        <span className="font-['JetBrains_Mono'] text-sm font-semibold text-emerald-700">
          {row.currency || 'USD'} {(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'win_probability',
      header: 'Probability',
      render: (value) => `${value || 0}%`
    },
    { key: 'lead_source', header: 'Lead Source' },
    {
      key: 'type',
      header: 'Type',
      render: (value) => {
        const colors = {
          'New Business': 'bg-blue-100 text-blue-700',
          'Existing Business': 'bg-green-100 text-green-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-slate-100 text-slate-700'}`}>
            {value || 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'pipeline_status',
      header: 'Pipeline Status',
      render: (value) => {
        const colors = {
          Prospecting: 'bg-blue-100 text-blue-700',
          'Needs Analysis': 'bg-cyan-100 text-cyan-700',
          Proposal: 'bg-purple-100 text-purple-700',
          Negotiation: 'bg-amber-100 text-amber-700',
          Closed: 'bg-emerald-100 text-emerald-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-slate-100 text-slate-700'}`}>
            {value || 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'close_date',
      header: 'Close Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { key: 'created_by', header: 'Created By' },
    { key: 'internal_recommendation', header: 'Internal Recommendation' },
    { key: 'next_steps', header: 'Next Steps' },
    {
      key: 'status',
      header: 'Status',
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
      key: 'updated_at',
      header: 'Last Updated',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
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
        <Button
          onClick={() => setShowForm(true)}
          data-testid="add-opportunity-btn"
          className="bg-[#0A2A43] hover:bg-[#0A2A43]/90 h-9 text-sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Opportunity
        </Button>
      </div>
 
      <DataTable
        data={opportunities}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={handleImport}
        filterOptions={filterOptions}
        testId="opportunities-table"
      />
 
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOpportunity ? 'Edit Opportunity' : 'Add New Opportunityy'}</DialogTitle>
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
 