import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import MultiFileUpload from './attachments/MultiFileUpload';
import DateField from './DateField';
import { Plus, Trash2, FileText, Upload, Calendar } from 'lucide-react';

const OpportunityFormTabbed = ({ opportunity, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Details Tab
    opportunity_name: '',
    client_name: '',
    lead_source: '',
    close_date: '',
    type: 'New Business',
    amount: 0,
    currency: 'USD',
    internal_recommendation: '',
    pipeline_status: 'Prospecting',
    win_probability: 10,
    next_steps: '',
    status: 'Active',
    
    // RFP Details Tab
    rfp_title: '',
    rfp_status: '',
    submission_deadline: '',
    bid_manager: '',
    submission_mode: '',
    portal_url: '',
    
    // SOW Details Tab
    sow_title: '',
    sow_status: '',
    contract_value: 0,
    target_kickoff_date: '',
    linked_proposal_reference: '',
    scope_overview: ''
  });

  const [rfpDocuments, setRfpDocuments] = useState({
    rfp_document: null,
    proposal_document: null,
    presentation_document: null,
    commercial_document: null,
    other_documents: []
  });

  const [sowDocuments, setSowDocuments] = useState([]);
  const [qaClarifications, setQaClarifications] = useState([]);

  // Pipeline status to win probability mapping
  const pipelineStatusProbabilities = {
    'Prospecting': 10,
    'Needs Analysis': 25,
    'Proposal': 50,
    'Negotiation': 75,
    'Closed': 90
  };

  // Check if RFP tab should be enabled
  const isRfpTabEnabled = () => {
    return ['Proposal', 'Negotiation', 'Closed'].includes(formData.pipeline_status);
  };

  // Check if SOW tab should be enabled
  const isSowTabEnabled = () => {
    return formData.pipeline_status === 'Closed' && formData.status === 'Active';
  };

  useEffect(() => {
    if (opportunity) {
      setFormData({
        ...formData,
        opportunity_name: opportunity.opportunity_name || '',
        client_name: opportunity.client_name || '',
        lead_source: opportunity.lead_source || '',
        close_date: opportunity.close_date || '',
        type: opportunity.type || 'New Business',
        amount: opportunity.amount || 0,
        currency: opportunity.currency || 'USD',
        internal_recommendation: opportunity.internal_recommendation || '',
        pipeline_status: opportunity.pipeline_status || 'Prospecting',
        win_probability: opportunity.win_probability || 10,
        next_steps: opportunity.next_steps || '',
        status: opportunity.status || 'Active'
      });
    }
  }, [opportunity]);

  // Update win probability when pipeline status changes
  useEffect(() => {
    if (pipelineStatusProbabilities[formData.pipeline_status]) {
      setFormData(prev => ({
        ...prev,
        win_probability: pipelineStatusProbabilities[formData.pipeline_status]
      }));
    }
  }, [formData.pipeline_status]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRfpDocumentChange = (documents) => {
    setRfpDocuments(documents);
  };

  const handleSowDocumentChange = (documents) => {
    setSowDocuments(documents);
  };

  const addQAClarification = () => {
    const newQA = {
      id: `qa_${Date.now()}`,
      question: '',
      answer: '',
      asked_by: '',
      asked_date: new Date().toISOString(),
      answered_by: '',
      answered_date: null,
      status: 'Pending'
    };
    setQaClarifications([...qaClarifications, newQA]);
  };

  const updateQAClarification = (index, field, value) => {
    const updated = [...qaClarifications];
    updated[index][field] = value;
    if (field === 'answer' && value) {
      updated[index].status = 'Answered';
      updated[index].answered_date = new Date().toISOString();
    }
    setQaClarifications(updated);
  };

  const removeQAClarification = (index) => {
    setQaClarifications(qaClarifications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create main opportunity
      const opportunityPayload = {
        opportunity_name: formData.opportunity_name,
        client_name: formData.client_name,
        lead_source: formData.lead_source,
        close_date: formData.close_date,
        type: formData.type,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        value: parseFloat(formData.amount) || 0,
        internal_recommendation: formData.internal_recommendation,
        pipeline_status: formData.pipeline_status,
        win_probability: parseInt(formData.win_probability) || 10,
        next_steps: formData.next_steps,
        status: formData.status
      };

      let savedOpportunity;
      
      if (opportunity) {
        await api.put(`/opportunity-collections/opportunities/${opportunity.id}`, opportunityPayload);
        savedOpportunity = { ...opportunity, ...opportunityPayload };
        toast.success('Opportunity updated successfully');
      } else {
        const response = await api.post('/opportunity-collections/opportunities', opportunityPayload);
        savedOpportunity = response.data;
        toast.success('Opportunity created successfully');
      }

      // Create RFP Details if tab is enabled and has data
      if (isRfpTabEnabled() && (formData.rfp_title || formData.rfp_status)) {
        const rfpPayload = {
          opportunity_id: savedOpportunity.opportunity_id,
          rfp_title: formData.rfp_title,
          rfp_status: formData.rfp_status,
          submission_deadline: formData.submission_deadline,
          bid_manager: formData.bid_manager,
          submission_mode: formData.submission_mode,
          portal_url: formData.portal_url,
          qa_logs: qaClarifications
        };

        await api.post('/opportunity-collections/rfp-details', rfpPayload);

        // Upload RFP documents
        const documentTypes = [
          { type: 'RFP', file: rfpDocuments.rfp_document },
          { type: 'Proposal', file: rfpDocuments.proposal_document },
          { type: 'Presentation', file: rfpDocuments.presentation_document },
          { type: 'Commercial', file: rfpDocuments.commercial_document }
        ];

        for (const docType of documentTypes) {
          if (docType.file) {
            const docPayload = {
              opportunity_id: savedOpportunity.opportunity_id,
              document_type: docType.type,
              file_name: docType.file.name,
              file_url: docType.file.url || '',
              uploaded_by: 'current_user'
            };
            await api.post('/opportunity-collections/rfp-documents', docPayload);
          }
        }
      }

      // Create SOW Details if tab is enabled and has data
      if (isSowTabEnabled() && (formData.sow_title || formData.sow_status)) {
        const sowPayload = {
          opportunity_id: savedOpportunity.opportunity_id,
          sow_title: formData.sow_title,
          sow_status: formData.sow_status,
          contract_value: parseFloat(formData.contract_value) || 0,
          currency: formData.currency,
          value: parseFloat(formData.contract_value) || 0,
          target_kickoff_date: formData.target_kickoff_date,
          linked_proposal_reference: formData.linked_proposal_reference,
          scope_overview: formData.scope_overview
        };

        const sowResponse = await api.post('/opportunity-collections/sow-details', sowPayload);
        const savedSow = sowResponse.data;

        // Upload SOW documents
        for (const doc of sowDocuments) {
          const docPayload = {
            sow_id: savedSow.id,
            file_name: doc.name,
            file_url: doc.url || '',
          };
          await api.post('/opportunity-collections/sow-documents', docPayload);
        }

        // Auto-create Project when SOW is signed
        if (formData.sow_status === 'Signed') {
          try {
            const projectPayload = {
              project_name: formData.sow_title,
              client_name: formData.client_name,
              opportunity_id: savedOpportunity.opportunity_id,
              contract_value: parseFloat(formData.contract_value) || 0,
              kickoff_date: formData.target_kickoff_date,
              status: 'Planning',
              created_from: 'opportunity'
            };

            await api.post('/projects', projectPayload);
            toast.success('Project created automatically from signed SOW!');
          } catch (projectError) {
            console.error('Failed to create project:', projectError);
            toast.warning('SOW created but failed to create project automatically');
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Opportunity form error:', error);
      const errorDetail = error.response?.data?.detail;
      let errorMessage = 'Failed to save opportunity';
      
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        errorMessage = errorDetail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
      } else if (errorDetail && typeof errorDetail === 'object') {
        errorMessage = JSON.stringify(errorDetail);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rfp" disabled={!isRfpTabEnabled()}>
            RFP Details
          </TabsTrigger>
          <TabsTrigger value="sow" disabled={!isSowTabEnabled()}>
            SOW Details
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opportunity_name">Opportunity Name *</Label>
                  <Input
                    id="opportunity_name"
                    name="opportunity_name"
                    value={formData.opportunity_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lead_source">Lead Source</Label>
                  <Input
                    id="lead_source"
                    name="lead_source"
                    value={formData.lead_source}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="close_date">Close Date</Label>
                  <DateField
                    id="close_date"
                    name="close_date"
                    value={formData.close_date}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    name="type" 
                    value={formData.type} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Business">New Business</SelectItem>
                      <SelectItem value="Existing Business">Existing Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="pipeline_status">Pipeline Status</Label>
                  <Select 
                    name="pipeline_status" 
                    value={formData.pipeline_status} 
                    onValueChange={(value) => handleSelectChange('pipeline_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospecting">Prospecting</SelectItem>
                      <SelectItem value="Needs Analysis">Needs Analysis</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="win_probability">Win Probability (%)</Label>
                  <Input
                    id="win_probability"
                    name="win_probability"
                    type="number"
                    value={formData.win_probability}
                    onChange={handleChange}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically set based on Pipeline Status
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    name="currency" 
                    value={formData.currency} 
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="internal_recommendation">Internal Recommendation</Label>
                  <Input
                    id="internal_recommendation"
                    name="internal_recommendation"
                    value={formData.internal_recommendation}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="next_steps">Next Steps</Label>
                <Textarea
                  id="next_steps"
                  name="next_steps"
                  value={formData.next_steps}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RFP Details Tab */}
        <TabsContent value="rfp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RFP Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfp_title">RFP Title</Label>
                  <Input
                    id="rfp_title"
                    name="rfp_title"
                    value={formData.rfp_title}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rfp_status">RFP Status</Label>
                  <Select 
                    name="rfp_status" 
                    value={formData.rfp_status} 
                    onValueChange={(value) => handleSelectChange('rfp_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Won">Won</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="submission_deadline">Submission Deadline</Label>
                  <DateField
                    id="submission_deadline"
                    name="submission_deadline"
                    value={formData.submission_deadline}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bid_manager">Bid Manager</Label>
                  <Input
                    id="bid_manager"
                    name="bid_manager"
                    value={formData.bid_manager}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="submission_mode">Submission Mode</Label>
                  <Select 
                    name="submission_mode" 
                    value={formData.submission_mode} 
                    onValueChange={(value) => handleSelectChange('submission_mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Portal">Portal</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="portal_url">Portal URL</Label>
                  <Input
                    id="portal_url"
                    name="portal_url"
                    value={formData.portal_url}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              {/* Document Uploads */}
              <div className="space-y-4">
                <h4 className="font-medium">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>RFP Document</Label>
                    <MultiFileUpload 
                      files={rfpDocuments.rfp_document ? [rfpDocuments.rfp_document] : []} 
                      onChange={(files) => handleRfpDocumentChange({...rfpDocuments, rfp_document: files[0]})}
                      maxFiles={1}
                    />
                  </div>
                  
                  <div>
                    <Label>Proposal Document</Label>
                    <MultiFileUpload 
                      files={rfpDocuments.proposal_document ? [rfpDocuments.proposal_document] : []} 
                      onChange={(files) => handleRfpDocumentChange({...rfpDocuments, proposal_document: files[0]})}
                      maxFiles={1}
                    />
                  </div>
                  
                  <div>
                    <Label>Presentation Document</Label>
                    <MultiFileUpload 
                      files={rfpDocuments.presentation_document ? [rfpDocuments.presentation_document] : []} 
                      onChange={(files) => handleRfpDocumentChange({...rfpDocuments, presentation_document: files[0]})}
                      maxFiles={1}
                    />
                  </div>
                  
                  <div>
                    <Label>Commercial Document</Label>
                    <MultiFileUpload 
                      files={rfpDocuments.commercial_document ? [rfpDocuments.commercial_document] : []} 
                      onChange={(files) => handleRfpDocumentChange({...rfpDocuments, commercial_document: files[0]})}
                      maxFiles={1}
                    />
                  </div>
                </div>
              </div>
              
              {/* Q&A Clarifications */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Q&A / Clarifications</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addQAClarification}>
                    <Plus className="h-4 w-4 mr-1" /> Add Q&A
                  </Button>
                </div>
                
                {qaClarifications.map((qa, index) => (
                  <Card key={qa.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label>Question</Label>
                            <Textarea
                              value={qa.question}
                              onChange={(e) => updateQAClarification(index, 'question', e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Answer</Label>
                            <Textarea
                              value={qa.answer}
                              onChange={(e) => updateQAClarification(index, 'answer', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeQAClarification(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOW Details Tab */}
        <TabsContent value="sow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SOW Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sow_title">SOW Title / Release Version</Label>
                  <Input
                    id="sow_title"
                    name="sow_title"
                    value={formData.sow_title}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sow_status">SOW Status</Label>
                  <Select 
                    name="sow_status" 
                    value={formData.sow_status} 
                    onValueChange={(value) => handleSelectChange('sow_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Signed">Signed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="contract_value">Contract Value</Label>
                  <Input
                    id="contract_value"
                    name="contract_value"
                    type="number"
                    value={formData.contract_value}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="target_kickoff_date">Target Kickoff Date</Label>
                  <DateField
                    id="target_kickoff_date"
                    name="target_kickoff_date"
                    value={formData.target_kickoff_date}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="linked_proposal_reference">Linked Proposal Reference</Label>
                  <Input
                    id="linked_proposal_reference"
                    name="linked_proposal_reference"
                    value={formData.linked_proposal_reference}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="scope_overview">Scope Overview</Label>
                <Textarea
                  id="scope_overview"
                  name="scope_overview"
                  value={formData.scope_overview}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              
              {/* Signed Document Assets */}
              <div className="space-y-4">
                <h4 className="font-medium">Signed Document Assets</h4>
                <MultiFileUpload 
                  files={sowDocuments} 
                  onChange={handleSowDocumentChange}
                />
              </div>
              
              {formData.sow_status === 'Signed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> When you save this form with SOW Status set to "Signed", 
                    a new Project will be automatically created in the Delivery module.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Discard
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#0A2A43] hover:bg-[#0A2A43]/90"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default OpportunityFormTabbed;
