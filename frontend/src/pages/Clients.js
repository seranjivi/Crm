import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Plus, Download } from 'lucide-react';
import StandardDataTable from '../components/StandardDataTable';
import ClientForm from '../components/ClientForm';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
import { Button } from '../components/ui/button';
import { X } from 'lucide-react';
 
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    client_status: '',
    client_tier: '',
    date_range: 'all'
  });
  const fileInputRef = useRef(null);

  // Get unique values for filters
  const filterOptions = {
    region: [...new Set(clients.map(client => client.region).filter(Boolean))],
    client_status: ['Active', 'Inactive', 'Prospect'],
    client_tier: ['A', 'B', 'C', 'D']
  };

  // Filter clients based on all active filters
  const filteredClients = clients.filter(client => {
    const now = new Date();
    const clientDate = new Date(client.created_at);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastDayOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    let dateInRange = true;
    switch (filters.date_range) {
      case 'this_month':
        dateInRange = clientDate >= firstDayOfMonth;
        break;
      case 'this_year':
        dateInRange = clientDate >= firstDayOfYear;
        break;
      case 'last_month':
        dateInRange = clientDate >= firstDayOfLastMonth && clientDate <= lastDayOfLastMonth;
        break;
      case 'last_year':
        dateInRange = clientDate >= firstDayOfLastYear && clientDate <= lastDayOfLastYear;
        break;
      case 'all':
      default:
        dateInRange = true;
    }

    return (
      (filters.region === '' || client.region === filters.region) &&
      (filters.client_status === '' || client.client_status === filters.client_status) &&
      (filters.client_tier === '' || client.client_tier === filters.client_tier) &&
      dateInRange
    );
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      region: '',
      client_status: '',
      client_tier: '',
      date_range: 'all'
    });
  };
 
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
 
  const handleView = async (client) => {
    setViewingClient(client);
    setLoadingDetails(true);
    try {
      const response = await api.get(`/clients/${client.id}`);
      setClientDetails(response.data);
    } catch (error) {
      toast.error('Failed to fetch client details');
    } finally {
      setLoadingDetails(false);
    }
  };
 
  const handleCloseView = () => {
    setViewingClient(null);
    setClientDetails(null);
  };
 
  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };
 
  const handleFormClose = (shouldRefresh = false) => {
    setShowForm(false);
    setEditingClient(null);
    if (shouldRefresh) {
      fetchClients();
    }
  };
 
  const handleDownloadTemplate = () => {
    const headers = [
      'name',
      'industry',
      'region',
      'country',
      'website',
      'address',
      'status',
      'account_manager',
      'notes'
    ];
   
    const csvContent = [
      headers.join(','),
      headers.map(() => '').join(',')
    ].join('\n');
   
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
 
  const handleImport = () => {
    fileInputRef.current?.click();
  };
 
  const handleExport = () => {
    if (clients.length === 0) {
      toast.warning('No clients to export');
      return;
    }
   
    // Get all unique keys from all clients
    const allKeys = new Set();
    clients.forEach(client => {
      Object.keys(client).forEach(key => allKeys.add(key));
    });
   
    const headers = Array.from(allKeys);
    const csvContent = [
      headers.join(','),
      ...clients.map(client =>
        headers.map(header => {
          const value = client[header];
          if (value === null || value === undefined) return '';
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');
   
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      render: (value, row) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleView(row);
          }}
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      ),
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="pt-1">
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Clients</h1>
            <p className="text-sm text-slate-600 mt-0.5">Manage your client accounts</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="h-9 text-xs sm:text-sm whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Sample Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="h-9 text-xs sm:text-sm whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 rotate-180" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={clients.length === 0}
              className="h-9 text-xs sm:text-sm whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Button
              onClick={() => {
                setEditingClient(null);
                setShowForm(true);
              }}
              className="h-9 text-xs sm:text-sm whitespace-nowrap bg-[#0A2A43] hover:bg-[#0A2A43]/90"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Column Filters */}
        <div className="bg-white p-4 rounded-lg border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full h-9 px-2 text-sm border rounded-md bg-white"
              >
                <option value="">All Regions</option>
                {filterOptions.region.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.client_status}
                onChange={(e) => handleFilterChange('client_status', e.target.value)}
                className="w-full h-9 px-2 text-sm border rounded-md bg-white"
              >
                <option value="">All Statuses</option>
                {filterOptions.client_status.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={filters.client_tier}
                onChange={(e) => handleFilterChange('client_tier', e.target.value)}
                className="w-full h-9 px-2 text-sm border rounded-md bg-white"
              >
                <option value="">All Tiers</option>
                {filterOptions.client_tier.map(tier => (
                  <option key={tier} value={tier}>Tier {tier}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                value={filters.date_range}
                onChange={(e) => handleFilterChange('date_range', e.target.value)}
                className="w-full h-9 px-2 text-sm border rounded-md bg-white"
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="last_month">Last Month</option>
                <option value="last_year">Last Year</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-9 w-full text-xs sm:text-sm whitespace-nowrap"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
        <StandardDataTable
          data={filteredClients}
          columns={columns}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          testId="clients-table"
          loading={loading}
          hideAddButton={true}
        />
      </div>
 
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
 
      {viewingClient && (
        <Dialog open={!!viewingClient} onOpenChange={(open) => !open && handleCloseView()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Client Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseView}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
             
              {loadingDetails ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : clientDetails ? (
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Client ID</label>
                          <div className="mt-1 text-sm">{clientDetails.client_id || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Client Name</label>
                          <div className="mt-1 text-sm font-medium">{clientDetails.client_name || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <div className="mt-1 text-sm">
                            {clientDetails.contact_email ? (
                              <a
                                href={`mailto:${clientDetails.contact_email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {clientDetails.contact_email}
                              </a>
                            ) : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <div className="mt-1 text-sm">
                            {clientDetails.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              clientDetails.client_status === 'Active' ? 'bg-green-100 text-green-800' :
                              clientDetails.client_status === 'Inactive' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {clientDetails.client_status || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tier</label>
                          <div className="mt-1 text-sm">{clientDetails.client_tier || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Industry</label>
                          <div className="mt-1 text-sm">{clientDetails.industry || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Created</label>
                          <div className="mt-1 text-sm">{formatDate(clientDetails.created_at) || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
 
                  {/* Contact Information Section */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      {clientDetails.contact_persons?.length > 0 ? (
                        clientDetails.contact_persons.map((contact, index) => (
                          <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{contact.name || 'Unnamed Contact'}</div>
                                <div className="text-sm text-gray-500">{contact.designation || 'No designation'}</div>
                              </div>
                              {contact.is_primary && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="mt-2 text-sm space-y-1">
                              {contact.email && (
                                <div className="flex items-center">
                                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                    {contact.email}
                                  </a>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center">
                                  <a href={`tel:${contact.phone}`} className="text-gray-600">
                                    {contact.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No contact information available</div>
                      )}
                    </div>
                  </div>
 
                  {/* Address Section */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clientDetails.addresses?.length > 0 ? (
                        clientDetails.addresses.map((address, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {address.is_primary ? 'Primary Address' : 'Additional Address'}
                                </div>
                                <div className="text-sm text-gray-900 mt-1">
                                  {address.address}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {[address.city, address.region, address.country, address.postal_code]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No address information available</div>
                      )}
                    </div>
                  </div>
 
                  {/* Notes Section */}
                  {clientDetails.notes && (
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium mb-4">Notes</h3>
                      <div className="whitespace-pre-line text-sm text-gray-700">
                        {clientDetails.notes}
                      </div>
                    </div>
                  )}
 
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCloseView}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        handleEdit(clientDetails);
                        handleCloseView();
                      }}
                    >
                      Edit Client
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load client details. Please try again.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
 
export default Clients;