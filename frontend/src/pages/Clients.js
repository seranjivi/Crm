import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus } from 'lucide-react';
import StandardDataTable from '../components/StandardDataTable';
import ClientForm from '../components/ClientForm';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

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
    { 
      key: 'client_id', 
      header: 'Client ID',
    },
    { 
      key: 'client_name', 
      header: 'Client Name',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    { 
      key: 'contact_email', 
      header: 'Email',
      render: (value) => value && (
        <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
          {value}
        </a>
      ),
    },
    { 
      key: 'region', 
      header: 'Region' 
    },
    { 
      key: 'client_status', 
      header: 'Status',
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'Active' ? 'bg-green-100 text-green-700' :
            value === 'Inactive' ? 'bg-red-100 text-red-700' :
            value === 'Prospect' ? 'bg-yellow-100 text-yellow-700' : 
            'bg-slate-100 text-slate-700'
          }`}
        >
          {value}
        </span>
      ),
    },
    { 
      key: 'client_tier', 
      header: 'Tier',
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          {value || 'N/A'}
        </span>
      ),
    },
    { 
      key: 'created_at', 
      header: 'Created',
      render: (value) => <span className="text-sm text-slate-700">{formatDate(value)}</span>
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <StandardDataTable
        title="Clients"
        data={clients}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        testId="clients-table"
        onAddNew={() => {
          setEditingClient(null);
          setShowForm(true);
        }}
        loading={loading}
        addButtonText="Add Client"
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <ClientForm 
            client={editingClient} 
            onSuccess={() => {
              fetchClients();
              setShowForm(false);
            }} 
            onClose={() => setShowForm(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;