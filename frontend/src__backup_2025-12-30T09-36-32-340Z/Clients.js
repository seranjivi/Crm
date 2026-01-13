import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import ClientForm from '../components/ClientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
 
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const fileInputRef = useRef(null);
 
  useEffect(() => {
    fetchClients();
  }, []);
 
  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };
 
  const handleDelete = async (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.client_name}?`)) {
      try {
        await api.delete(`/clients/${client.id}`);
        toast.success('Client deleted successfully');
        fetchClients();
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };
 
  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };
 
  const handleFormClose = () => {
    setShowForm(false);
    setEditingClient(null);
    fetchClients();
  };
 
  const handleImport = () => {
    fileInputRef.current?.click();
  };
 
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
 
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please upload a valid CSV or XLSX file');
      return;
    }
 
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        const rows = text.split('\n').filter(row => row.trim());
       
        if (rows.length < 2) {
          toast.error('File must contain at least a header row and one data row');
          return;
        }
 
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);
 
        let successCount = 0;
        let errorCount = 0;
 
        for (const row of dataRows) {
          const values = row.split(',').map(v => v.trim());
          const clientData = {
            name: values[headers.indexOf('name')] || '',
            industry: values[headers.indexOf('industry')] || '',
            region: values[headers.indexOf('region')] || '',
            country: values[headers.indexOf('country')] || '',
            website: values[headers.indexOf('website')] || '',
            address: values[headers.indexOf('address')] || '',
            status: values[headers.indexOf('status')] || 'Active',
            account_manager: values[headers.indexOf('account_manager')] || '',
            notes: values[headers.indexOf('notes')] || '',
            contacts: [],
          };
 
          if (!clientData.name) {
            errorCount++;
            continue;
          }
 
          try {
            await api.post('/clients', clientData);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }
 
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} client(s)`);
          fetchClients();
        }
        if (errorCount > 0) {
          toast.warning(`${errorCount} row(s) failed to import`);
        }
      } catch (error) {
        toast.error('Failed to process file. Please check the format.');
      }
    };
 
    reader.readAsText(file);
    event.target.value = '';
  };
 
  const columns = [
    { key: 'client_name', header: 'Client Name' },
    {
      key: 'created_at',
      header: 'Date',
      render: (value) => <span className="text-xs text-slate-700">{formatDate(value)}</span>
    },
    { key: 'contact_email', header: 'Email' },
    { key: 'region', header: 'Region' },
    { key: 'country', header: 'Country' },
    {
      key: 'service_type',
      header: 'Service Type',
      render: (value) => (
        <span className="text-xs text-slate-700">{value || 'Not specified'}</span>
      )
    },
    {
      key: 'client_tier',
      header: 'Client Tier',
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'Key Client' ? 'bg-blue-100 text-blue-700' :
            value === 'Strategic' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-700'
          }`}
        >
          {value || 'Normal'}
        </span>
      ),
    },
    {
      key: 'client_status',
      header: 'Status',
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'Active' ? 'bg-emerald-100 text-emerald-700' :
            value === 'Prospect' ? 'bg-yellow-100 text-yellow-700' :
            'bg-slate-100 text-slate-700'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6AA6]"></div>
      </div>
    );
  }
 
  return (
    <div className="space-y-4" data-testid="clients-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Clients</h1>
        <p className="text-sm text-slate-600 mt-0.5">Manage your client accounts</p>
      </div>
 
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
 
      <DataTable
        data={clients}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={handleImport}
        filterOptions={{}}
        testId="clients-table"
        renderToolbarActions={renderToolbarActions}
      />
 
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <ClientForm client={editingClient} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
 
export default Clients;
 