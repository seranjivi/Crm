import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import DateField from './DateField';
import RegionDropdown from './RegionDropdown';
import CountryDropdown from './CountryDropdown';
import { Plus, Trash2, Building2, X } from 'lucide-react';
 
const ClientForm = ({ client, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    contact_email: '',
    website: '',
    industry: '',
    customer_type: 'Direct Customer',
    gst_tax_id: '',
    addresses: [{ address: '', country: '', region: '' }],
    account_owner: '',
    client_status: 'Active',
    notes: '',
    contact_persons: [{ name: '', email: '', phone: '', designation: '', is_primary: false }]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
 
  useEffect(() => {
    if (client) {
      setFormData({
        client_name: client.client_name || '',
        contact_email: client.contact_email || '',
        website: client.website || '',
        industry: client.industry || '',
        customer_type: client.customer_type || 'Direct Customer',
        gst_tax_id: client.gst_tax_id || '',
        addresses: client.addresses && client.addresses.length > 0
          ? client.addresses
          : [{ address: '', country: '', region: '' }],
        account_owner: client.account_owner || '',
        client_status: client.client_status || 'Active',
        notes: client.notes || '',
        contact_persons: client.contact_persons && client.contact_persons.length > 0
          ? client.contact_persons
          : [{ name: '', email: '', phone: '', designation: '', is_primary: false }]
      });
    }
  }, [client]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
 
  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.contact_persons];
   
    if (field === 'is_primary') {
      // If setting as primary, uncheck all others
      if (value) {
        updatedContacts.forEach((contact, i) => {
          contact.is_primary = i === index;
        });
      } else {
        updatedContacts[index].is_primary = false;
      }
    } else if (field === 'phone') {
      // Only allow digits and +, max 10 digits after country code
      const cleaned = value.replace(/[^\d+]/g, '');
      const digitsOnly = cleaned.replace(/^\+/, '');
      if (digitsOnly.length <= 10) {
        updatedContacts[index][field] = value;
      }
    } else {
      updatedContacts[index][field] = value;
    }
   
    setFormData(prev => ({ ...prev, contact_persons: updatedContacts }));
  };
 
  const handleAddressChange = (index, field, value) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses[index][field] = value;
    setFormData(prev => ({ ...prev, addresses: updatedAddresses }));
  };
 
  const setPrimaryAddress = (index) => {
    const updatedAddresses = formData.addresses.map((addr, i) => ({
      ...addr,
      is_primary: i === index
    }));
    setFormData(prev => ({ ...prev, addresses: updatedAddresses }));
  };
 
  const addAddress = () => {
    setFormData(prev => {
      const newAddress = {
        address: '',
        country: '',
        region: '',
        is_primary: prev.addresses.length === 0 // First address is primary by default
      };
      return {
        ...prev,
        addresses: [...prev.addresses, newAddress]
      };
    });
  };
 
  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      const updatedAddresses = formData.addresses.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, addresses: updatedAddresses }));
    }
  };
 
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contact_persons: [...prev.contact_persons, { name: '', email: '', phone: '', designation: '', is_primary: false }]
    }));
  };
 
  const removeContact = (index) => {
    if (formData.contact_persons.length > 1) {
      const updatedContacts = formData.contact_persons.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, contact_persons: updatedContacts }));
    }
  };
 
  const validateForm = () => {
    const newErrors = {};
   
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }
   
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Primary email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email';
    }
   
    if (!formData.customer_type) {
      newErrors.customer_type = 'Customer type is required';
    }
   
    // Validate addresses
    let hasAtLeastOneAddress = false;
    formData.addresses.forEach((address, index) => {
      if (address.country) {
        hasAtLeastOneAddress = true;
      }
     
      if (!address.address) {
        newErrors[`address_${index}`] = 'Address is required';
      }
      if (!address.region) {
        newErrors[`region_${index}`] = 'Region is required';
      }
      if (!address.country) {
        newErrors[`country_${index}`] = 'Country is required';
      }
    });
   
    if (!hasAtLeastOneAddress) {
      newErrors.addresses = 'At least one address with country is required';
    }
   
    if (!formData.account_owner) {
      newErrors.account_owner = 'Account owner is required';
    }
   
    if (!formData.client_status) {
      newErrors.client_status = 'Status is required';
    }
   
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
   
    setLoading(true);
 
    try {
      const submitData = {
        ...formData,
        // For backward compatibility, use first address as primary
        address: formData.addresses[0]?.address || '',
        country: formData.addresses[0]?.country || '',
        region: formData.addresses[0]?.region || '',
        // Keep primary email as contact_email for backward compatibility
        contact_persons: formData.contact_persons.filter(contact =>
          contact.name || contact.email || contact.phone
        ),
        // Include all addresses
        addresses: formData.addresses.filter(addr =>
          addr.address || addr.country || addr.region
        )
      };
 
      if (client) {
        await api.put(`/clients/${client.id}`, submitData);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', submitData);
        toast.success('Client created successfully');
      }
     
      // Call onSuccess if provided, otherwise just close the form
      if (onSuccess) {
        onSuccess();
      } else {
        onClose(true);
      }
    } catch (error) {
      console.error('Client form error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#0A2A43]" />
            <h2 className="text-2xl font-semibold text-[#0A2A43]">
              {client ? 'EDIT CLIENT' : 'NEW CLIENT'}
            </h2>
          </div>
          {/* <Button
            type="submit"
            disabled={loading}
            className="bg-[#0A2A43] hover:bg-[#0A2A43]/90 text-white"
          >
            {loading ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
          </Button> */}
        </div>
        {/* Section 1 - Basic Client Details */}
        <div>
          <h3 className="text-lg font-medium text-[#0A2A43] mb-4">Basic Client Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name <span className="text-red-500">*</span></Label>
              <Input
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                className={errors.client_name ? 'border-red-500' : ''}
                data-testid="client-name-input"
              />
              {errors.client_name && (
                <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                className={errors.contact_email ? 'border-red-500' : ''}
                data-testid="client-email-input"
              />
              {errors.contact_email && (
                <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                data-testid="client-website-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                data-testid="client-industry-select"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Hospitality">Hospitality</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_type">Customer Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_type: value }))}
                data-testid="client-customer-type-select"
              >
                <SelectTrigger className={errors.customer_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select customer type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct Customer">Direct Customer</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Reseller">Reseller</SelectItem>
                </SelectContent>
              </Select>
              {errors.customer_type && (
                <p className="text-red-500 text-sm mt-1">{errors.customer_type}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_tax_id">GST / Tax ID</Label>
              <Input
                id="gst_tax_id"
                name="gst_tax_id"
                value={formData.gst_tax_id}
                onChange={handleChange}
                placeholder="e.g. 27AAAPL1234C1ZV"
                data-testid="client-gst-input"
              />
            </div>
          </div>
        </div>
 
        {/* Section 2 - Contact Persons */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-[#0A2A43]">Contact Persons</h3>
            <Button
              type="button"
              onClick={addContact}
              className="flex items-center gap-2 h-10 bg-[#0A2A43] hover:bg-[#0A2A43]/90 text-white"
              data-testid="add-contact-button"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </div>
          <div className="space-y-4">
            {formData.contact_persons.map((contact, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor={`contact_name_${index}`}>Name</Label>
                  <Input
                    id={`contact_name_${index}`}
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                    placeholder="Contact name"
                    data-testid={`contact-name-${index}`}
                    className="w-full h-10"
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor={`contact_email_${index}`}>Email</Label>
                  <Input
                    id={`contact_email_${index}`}
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                    placeholder="contact@example.com"
                    data-testid={`contact-email-${index}`}
                    className="w-full h-10"
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor={`contact_phone_${index}`}>Phone</Label>
                  <Input
                    id={`contact_phone_${index}`}
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    data-testid={`contact-phone-${index}`}
                    className="w-full h-10"
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor={`contact_designation_${index}`}>Designation</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id={`contact_designation_${index}`}
                        value={contact.designation}
                        onChange={(e) => handleContactChange(index, 'designation', e.target.value)}
                        placeholder="e.g. Manager, Director"
                        data-testid={`contact-designation-${index}`}
                        className="w-full h-10"
                      />
                    </div>
                    {formData.contact_persons.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeContact(index)}
                        className="text-red-500 hover:text-red-700 h-10 w-10 flex-shrink-0"
                        data-testid={`remove-contact-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Removed the standalone Add Contact button as it's now inline */}
          </div>
        </div>
 
        {/* Section 3 - Address Details */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-[#0A2A43]">Address Details</h3>
            <Button
              type="button"
              onClick={addAddress}
              className="flex items-center gap-2 bg-[#0A2A43] hover:bg-[#0A2A43]/90 text-white"
              data-testid="add-address-button"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>
          <div className="space-y-4">
            {formData.addresses.map((address, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg ${address.is_primary ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <div className="md:col-span-2">
                  <Label htmlFor={`address_${index}`}>
                    Address {address.is_primary && <span className="text-blue-600 ml-2">(Primary)</span>}
                  </Label>
                  <Textarea
                    id={`address_${index}`}
                    value={address.address}
                    onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                    rows={3}
                    placeholder="123 Main St, Suite 100, City, State 12345"
                    data-testid={`address-${index}`}
                    className={errors[`address_${index}`] ? 'border-red-500' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`region_${index}`}>Region / State</Label>
                  <Select
                    value={address.region}
                    onValueChange={(value) => handleAddressChange(index, 'region', value)}
                    data-testid={`region-${index}`}
                  >
                    <SelectTrigger className={errors[`region_${index}`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select region..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="South America">South America</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Asia">Asia</SelectItem>
                      <SelectItem value="Africa">Africa</SelectItem>
                      <SelectItem value="Oceania">Oceania</SelectItem>
                      <SelectItem value="Middle East">Middle East</SelectItem>
                      <SelectItem value="Central America">Central America</SelectItem>
                      <SelectItem value="Caribbean">Caribbean</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors[`region_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`region_${index}`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`country_${index}`}>Country <span className="text-red-500">*</span></Label>
                  <CountryDropdown
                    value={address.country}
                    onChange={(value) => handleAddressChange(index, 'country', value)}
                    region={address.region}
                    placeholder="Select country..."
                    required={true}
                    showRequiredIndicator={true}
                    className={errors[`country_${index}`] ? 'border-red-500' : ''}
                    data-testid={`country-${index}`}
                  />
                  {errors[`country_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`country_${index}`]}</p>
                  )}
                </div>
                <div className="flex items-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrimaryAddress(index)}
                    disabled={address.is_primary}
                    className={`${address.is_primary ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50'}`}
                    data-testid={`set-primary-${index}`}
                  >
                    {address.is_primary ? 'Primary' : 'Set as Primary'}
                  </Button>
                  {formData.addresses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAddress(index)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`remove-address-${index}`}
                      disabled={address.is_primary}
                      title={address.is_primary ? 'Cannot remove primary address' : 'Remove address'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* Section 4 - Account & Status */}
        <div>
          <h3 className="text-lg font-medium text-[#0A2A43] mb-4">Account & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_owner">Account Owner <span className="text-red-500">*</span></Label>
              <Select
                value={formData.account_owner}
                onValueChange={(value) => setFormData(prev => ({ ...prev, account_owner: value }))}
                data-testid="client-account-owner-select"
              >
                <SelectTrigger className={errors.account_owner ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select account owner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thilakraj">Thilakraj</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              {errors.account_owner && (
                <p className="text-red-500 text-sm mt-1">{errors.account_owner}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_status">Status <span className="text-red-500">*</span></Label>
              <Select
                value={formData.client_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_status: value }))}
                data-testid="client-status-select"
              >
                <SelectTrigger className={errors.client_status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.client_status && (
                <p className="text-red-500 text-sm mt-1">{errors.client_status}</p>
              )}
            </div>
          </div>
        </div>
 
        {/* Section 5 - Notes / Description */}
        <div>
          <h3 className="text-lg font-medium text-[#0A2A43] mb-4">Notes / Description</h3>
          <div>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Additional notes about this client..."
              data-testid="client-notes-input"
            />
          </div>
        </div>
 
        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            data-testid="client-form-submit"
            className="px-6 bg-[#0A2A43] hover:bg-[#0A2A43]/90 text-white"
          >
            {loading ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
          </Button>
        </div>
      </form>
    </div>
  );
};
 
export default ClientForm;
 
 