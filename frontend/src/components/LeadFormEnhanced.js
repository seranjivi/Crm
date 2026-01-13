import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import MultiFileUpload from './attachments/MultiFileUpload';
import DateField from './DateField';
import RegionDropdown from './RegionDropdown';
import CountryDropdown from './CountryDropdown';
import LeadStatusBadge from './LeadStatusBadge';
import { Plus, Search, User, Upload, MessageSquareText, CheckCircle2 } from 'lucide-react';
 
const LeadFormEnhanced = ({ lead, onClose }) => {
  const [formData, setFormData] = useState({
    lead_name: '',
    client_name: '',
    description: '', // DESCRIPTION
    primary_contact: '', // PRIMARY CONTACT
    contact_phone: '', // CONTACT PHONE NUMBER
    contact_email: '', // CONTACT EMAIL ADDRESS
    region: 'North America', // Default to North America
    country: 'United States', // Default to United States
    deal_type: 'RFP', // Default to RFP
    priority: 'Medium', // Default to Medium
    lead_status: 'New Lead', // Default to New Lead
    industry: '',
    contact_person: '',
    contact_details: '',
    solution: '',
    estimated_value: 0,
    currency: 'USD',
    comments: '',
    status: 'New',
  });
 
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({
    client_name: '',
    region: '',
    country: '',
    industry: '',
    contact_email: '',
    contact_phone: '',
    service_type: [],
    client_tier: 'Standard',
    client_status: 'Active',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
 
  // Deal types for dropdown - must match backend expectations
  const dealTypes = [
    { value: 'New Business', label: 'New Business' },
    { value: 'Existing Business', label: 'Existing Business' },
    { value: 'Renewal', label: 'Renewal' },
    { value: 'Upsell', label: 'Upsell' },
    { value: 'Cross-sell', label: 'Cross-sell' }
  ];
 
  // Priority levels for dropdown
  const priorityLevels = ['Low', 'Medium', 'High', 'Critical'];
 
  // Lead statuses for dropdown - must match backend expectations
  const leadStatuses = [
    { value: 'New', label: 'New' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Proposal Sent', label: 'Proposal Sent' },
    { value: 'Negotiation', label: 'Negotiation' },
    { value: 'Won', label: 'Won' },
    { value: 'Lost', label: 'Lost' }
  ];
 
  useEffect(() => {
    fetchInitialData();
  }, []);
 
  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        expected_closure_date: lead.expected_closure_date?.split('T')[0] || '',
        next_followup: lead.next_followup?.split('T')[0] || '',
        created_at: lead.created_at?.split('T')[0] || '',
      });
      if (lead.attachments) {
        // Ensure attachments have the correct format
        const formattedAttachments = lead.attachments.map(attachment => {
          if (typeof attachment === 'string') {
            // If it's just a string, create a file-like object
            return {
              name: attachment.split('/').pop() || 'file',
              type: 'application/octet-stream', // Default type
              size: 0 // Unknown size
            };
          }
          return attachment; // Already in correct format
        });
        setAttachments(formattedAttachments);
      }
    } else {
      // Set today's date and current user for new leads
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        created_at: `${year}-${month}-${day}`
      }));
    }
  }, [lead, currentUser]);
 
  const fetchInitialData = async () => {
    try {
      // Sample users data
      const sampleUsers = [
        { id: 1, full_name: 'John Doe', email: 'john.doe@example.com' },
        { id: 2, full_name: 'Jane Smith', email: 'jane.smith@example.com' },
        { id: 3, full_name: 'Robert Johnson', email: 'robert.j@example.com' },
        { id: 4, full_name: 'Emily Davis', email: 'emily.d@example.com' },
        { id: 5, full_name: 'Michael Wilson', email: 'michael.w@example.com' }
      ];
 
      // Fetch current user
      const userResponse = await api.get('/auth/me').catch(err => {
        console.warn('Could not fetch current user, using default values', err);
        return { data: { full_name: 'Current User' } };
      });
      setCurrentUser(userResponse.data);
     
      // Fetch clients
      const clientsResponse = await api.get('/clients').catch(err => {
        console.warn('Could not fetch clients, using empty list', err);
        return { data: [] };
      });
      setClients(clientsResponse.data);
     
      // Fetch users for Assigned To (POC) dropdown
      const usersResponse = await api.get('/users').catch(err => {
        console.warn('Could not fetch users, using sample data', err);
        return { data: sampleUsers }; // Return sample data if API call fails
      });
     
      // Use sample data if the response is empty
      setUsers(usersResponse.data.length > 0 ? usersResponse.data : sampleUsers);
     
      // Set lead owner for new leads
      // No need to set lead_owner anymore
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      // Don't show error toast to user, just log to console
    }
  };
 
  const handleClientSelection = async (clientId) => {
    if (clientId === 'new') {
      setShowNewClientDialog(true);
      setShowClientDropdown(false);
      return;
    }
 
    try {
      const clientResponse = await api.get(`/clients/${clientId}`);
      const client = clientResponse.data;
     
      // Auto-populate form with client data
      setFormData(prev => ({
        ...prev,
        client_name: client.client_name,
        region: client.region || '',
        country: client.country || '',
        industry: client.industry || '',
        contact_person: client.contact_person || '',
        contact_details: client.contact_email || client.contact_phone || '',
        opportunity_name: ''
      }));
      setShowClientDropdown(false);
      setSearchTerm(client.client_name);
    } catch (error) {
      toast.error('Failed to load client details');
    }
  };
 
  const handleCreateNewClient = async () => {
    try {
      const response = await api.post('/clients', newClientData);
      const newClient = response.data;
     
      // Add to clients list
      setClients(prev => [...prev, newClient]);
     
      // Auto-populate form with new client data
      setFormData(prev => ({
        ...prev,
        client_name: newClient.client_name,
        region: newClient.region || '',
        country: newClient.country || '',
        industry: newClient.industry || '',
        contact_person: newClient.contact_person || '',
        contact_details: newClient.contact_email || newClient.contact_phone || '',
        opportunity_name: ''
      }));
     
      // Close dialog and reset form
      setShowNewClientDialog(false);
      setShowClientDropdown(false);
      setNewClientData({
        client_name: '',
        region: '',
        country: '',
        industry: '',
        contact_email: '',
        contact_phone: '',
        service_type: [],
        client_tier: 'Standard',
        client_status: 'Active',
        notes: ''
      });
     
      toast.success('Client created successfully');
    } catch (error) {
      toast.error('Failed to create client');
    }
  };
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
 
    try {
      // Map form values to backend expected values
      const getDealTypeValue = (dealType) => {
        // Map from form values to backend values if needed
        const dealTypeMap = {
          'RFP': 'New Business',
          'RFI': 'New Business',
          'Direct': 'New Business',
          'Partnership': 'New Business',
          'Other': 'New Business'
        };
        return dealTypeMap[dealType] || dealType || 'New Business';
      };
 
      // Map status values to backend expected values
      const getStatusValue = (status) => {
        const statusMap = {
          'New Lead': 'New',
          'Contacted': 'Qualified',
          'Qualified': 'Qualified',
          'Proposal Sent': 'Proposal Sent',
          'Negotiation': 'Negotiation',
          'Closed Won': 'Won',
          'Closed Lost': 'Lost',
          'On Hold': 'New'
        };
        return statusMap[status] || status || 'New';
      };
 
      // Prepare the submission data according to the API requirements
      const submissionData = {
        // Required fields
        lead_name: formData.lead_name || 'New Opportunity',
        client_name: formData.client_name || 'Unknown Client',
        assigned_to: formData.assigned_to || null,
        description: formData.description || '',
       
        // Contact Information
        primary_contact: formData.primary_contact || '',
        contact_phone: formData.contact_phone || '',
        contact_email: formData.contact_email || '',
       
        // Location Information
        region: formData.region || '',
        country: formData.country || '',
       
        // Deal Information - using mapped values
        deal_type: getDealTypeValue(formData.deal_type),
        priority: formData.priority || 'Medium',
        status: getStatusValue(formData.lead_status),
        estimated_deal_value: formData.estimated_value ? parseFloat(formData.estimated_value) : 0,
        currency: formData.currency || 'USD',
       
        // Additional fields
        industry: formData.industry || '',
        comments: formData.comments || '',
       
        // Handle attachments - don't include id for new leads
        attachments: attachments.map(file => {
          const attachmentData = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          };
          // Only include id if it's an existing file (not a new upload)
          if (file.id && !file.id.startsWith('temp_')) {
            attachmentData.id = file.id;
          }
          return attachmentData;
        }),
       
        // Initialize empty activity history
        activity_history: []
      };
 
      // Send the request
      let response;
      if (lead) {
        // Update existing lead
        response = await api.put(`/leads/${lead.id}`, submissionData);
        // Check for different response formats
        if ((response.data && response.data.success) || response.data.id) {
          toast.success('Lead updated successfully');
          onClose(true);
        } else {
          throw new Error(response.data?.message || 'Failed to update lead: Invalid response format');
        }
      } else {
        // Create new lead
        response = await api.post('/leads', submissionData);
        console.log('Create lead response:', response.data); // Debug log
        
        // Handle different response formats
        if ((response.data && response.data.success) || response.data.id) {
          toast.success('Lead created successfully');
          onClose(true);
        } else if (response.data && response.data.data) {
          // Handle case where response is { data: { ...lead }, success: true }
          toast.success('Lead created successfully');
          onClose(true);
        } else {
          console.error('Unexpected response format:', response.data);
          throw new Error(response.data?.message || 'Failed to create lead: Invalid response format');
        }
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      let errorMessage = 'Failed to save lead. Please check the form and try again.';
     
      try {
        // Log full error response for debugging
        console.error('Error response:', error.response);
        
        // Handle different error response formats
        const errorData = error.response?.data || {};
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.data?.detail) {
          // Handle our custom error format
          errorMessage = errorData.data.detail;
        } else if (errorData.msg) {
          // Handle single error object with msg field
          errorMessage = typeof errorData.msg === 'string' ? errorData.msg : JSON.stringify(errorData.msg);
        } else if (errorData.errors) {
            // Handle validation errors
            const errorMessages = Object.entries(errorData.errors).map(([field, errors]) => {
              // Handle array of error objects
              if (Array.isArray(errors) && errors[0]?.msg) {
                return `${field}: ${errors.map(e => typeof e.msg === 'string' ? e.msg : JSON.stringify(e.msg)).join(', ')}`;
              }
              // Handle array of strings or objects
              if (Array.isArray(errors)) {
                return `${field}: ${errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ')}`;
              }
              // Handle single error object
              if (typeof errors === 'object' && errors.msg !== undefined) {
                return `${field}: ${typeof errors.msg === 'string' ? errors.msg : JSON.stringify(errors.msg)}`;
              }
              // Handle other cases
              return `${field}: ${typeof errors === 'string' ? errors : JSON.stringify(errors)}`;
            });
            errorMessage = errorMessages.join('\n');
          } else {
            // Fallback: stringify the entire error data if we can't extract a message
            errorMessage = JSON.stringify(errorData, null, 2);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = 'An unexpected error occurred. Please check the console for details.';
        }
     
      // Ensure errorMessage is always a string before showing toast
      if (errorMessage) {
        toast.error(String(errorMessage));
      } else {
        toast.error('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
 
  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  return (
    <div className="w-full max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* LEAD NAME */}
          <div>
            <Label htmlFor="lead_name">Lead name <span className="text-red-500">*</span></Label>
            <Input
              id="lead_name"
              name="lead_name"
              value={formData.lead_name}
              onChange={handleChange}
              placeholder="Enter lead name"
              required
            />
          </div>
 
          {/* CLIENT NAME */}
          <div>
            <Label htmlFor="client_selection">Client name <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="client_selection"
                placeholder="Lookup Client..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="pl-10"
              />
            </div>
           
            {/* Client Selection Dropdown */}
            {showClientDropdown && (
              <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg z-10 absolute w-full">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelection(client.id)}
                    className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <span>{client.client_name}</span>
                    <span className="text-xs text-slate-500">{client.region}</span>
                  </div>
                ))}
                <div
                  onClick={() => handleClientSelection('new')}
                  className="p-2 hover:bg-blue-50 cursor-pointer flex items-center text-blue-600 border-t"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Client
                </div>
              </div>
            )}
          </div>
 
          {/* ASSIGNED TO (POC) */}
          <div>
            <Label htmlFor="assigned_to">Assigned to (POC) <span className="text-red-500">*</span></Label>
            <Select
              name="assigned_to"
              value={formData.assigned_to}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select POC" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.full_name}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          {/* DESCRIPTION */}
          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="High-level intent or discovery points..."
              rows={3}
            />
          </div>
 
          {/* PRIMARY CONTACT */}
          <div>
            <Label htmlFor="primary_contact">Primary contact</Label>
            <Select
              name="primary_contact"
              value={formData.primary_contact}
              onValueChange={(value) => setFormData(prev => ({ ...prev, primary_contact: value }))}
              disabled={!formData.client_name}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.client_name ? "Select contact" : "Select client first"} />
              </SelectTrigger>
              <SelectContent>
                {/* This would be populated based on the selected client's contacts */}
                {formData.client_name ? (
                  <SelectItem value="no_contact">No contacts available</SelectItem>
                ) : (
                  <SelectItem value="select_client" disabled>Please select a client first</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
 
          {/* CONTACT PHONE NUMBER */}
          <div>
            <Label htmlFor="contact_phone">Contact phone number</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+1 (___) ___-____"
            />
          </div>
 
          {/* CONTACT EMAIL ADDRESS */}
          <div>
            <Label htmlFor="contact_email">Contact email address</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>
 
          {/* REGION */}
          <div>
            <Label htmlFor="region">Region</Label>
            <RegionDropdown
              value={formData.region}
              onChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
            />
          </div>
 
          {/* COUNTRY */}
          <div>
            <Label htmlFor="country">Country</Label>
            <CountryDropdown
              value={formData.country}
              onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              region={formData.region}
            />
          </div>
 
          {/* DEAL TYPE */}
          <div>
            <Label htmlFor="deal_type">Deal type</Label>
            <Select
              name="deal_type"
              value={formData.deal_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, deal_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deal type" />
              </SelectTrigger>
              <SelectContent>
                {dealTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          {/* PRIORITY */}
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              name="priority"
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
 
          {/* LEAD STATUS */}
          <div>
            <Label htmlFor="lead_status">Lead status</Label>
            <Select
              name="lead_status"
              value={formData.lead_status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, lead_status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lead status" />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          {/* LEAD CREATED ON */}
          <div>
            <Label htmlFor="lead_created_on">Lead created on</Label>
            <Input
              id="lead_created_on"
              name="lead_created_on"
              type="date"
              value={formData.lead_created_on}
              onChange={handleChange}
            />
          </div>
 
          {/* ESTIMATED DEAL VALUE */}
          <div>
            <Label htmlFor="estimated_deal_value">Estimated deal value</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <Input
                id="estimated_deal_value"
                name="estimated_deal_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_deal_value}
                onChange={handleChange}
                className="pl-8"
              />
            </div>
          </div>
        </div>
 
       
 
        {/* Supporting Documents */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Supporting Documents</h3>
          </div>
          <MultiFileUpload
            files={attachments}
            onChange={setAttachments}
            maxSizePerFile={5}
          />
          {attachments.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              <p>No documents uploaded yet</p>
              <p className="text-xs mt-1">Max file size: 5MB</p>
            </div>
          )}
        </div>
 
        {/* Activity History */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Activity History</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <MessageSquareText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">New Note</span>
                  <span className="text-xs text-gray-500">Today, 10:30 AM</span>
                </div>
                <p className="text-sm text-gray-600">Initial discussion with client about requirements</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status Updated</span>
                  <span className="text-xs text-gray-500">Yesterday, 3:45 PM</span>
                </div>
                <p className="text-sm text-gray-600">Status changed from New to In Progress</p>
              </div>
            </div>
          </div>
        </div>
 
        <div className="flex justify-end space-x-4 pt-6">
          <Button type="button" variant="outline" onClick={onClose} className="w-24">
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-40 bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {lead ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
 
      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[90vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_client_name">Client Name *</Label>
              <Input
                id="new_client_name"
                value={newClientData.client_name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="Enter client name"
                required
              />
            </div>
           
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_region">Region *</Label>
                <RegionDropdown
                  value={newClientData.region}
                  onChange={(value) => setNewClientData(prev => ({ ...prev, region: value }))}
                  placeholder="Select region"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new_country">Country *</Label>
                <CountryDropdown
                  value={newClientData.country}
                  onChange={(value) => setNewClientData(prev => ({ ...prev, country: value }))}
                  placeholder="Select country"
                  required
                />
              </div>
            </div>
 
            <div>
              <Label htmlFor="new_industry">Industry</Label>
              <Input
                id="new_industry"
                value={newClientData.industry}
                onChange={(e) => setNewClientData(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Industry"
              />
            </div>
 
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_contact_email">Contact Email</Label>
                <Input
                  id="new_contact_email"
                  type="email"
                  value={newClientData.contact_email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label htmlFor="new_contact_phone">Contact Phone</Label>
                <Input
                  id="new_contact_phone"
                  value={newClientData.contact_phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>
 
            <div>
              <Label htmlFor="new_notes">Notes</Label>
              <Textarea
                id="new_notes"
                value={newClientData.notes}
                onChange={(e) => setNewClientData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Client notes"
                rows={3}
              />
            </div>
 
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewClientDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateNewClient}
                disabled={!newClientData.client_name || !newClientData.region || !newClientData.country}
              >
                Create Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadFormEnhanced;