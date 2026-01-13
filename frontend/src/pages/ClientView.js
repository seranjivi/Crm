import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
 
const ClientView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/clients/${id}`);
        setClient(response.data);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };
 
    if (id) {
      fetchClient();
    }
  }, [id]);
 
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
 
  if (!client) {
    return <div className="p-4">Client not found</div>;
  }
 
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </div>
     
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Client Details</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/clients/edit/${client.id}`)}
            >
              Edit Client
            </Button>
          </div>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Basic Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Client ID:</span> {client.client_id}</p>
                <p><span className="font-medium">Client Name:</span> {client.client_name}</p>
                <p><span className="font-medium">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.client_status === 'Active' ? 'bg-green-100 text-green-800' :
                    client.client_status === 'Inactive' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {client.client_status}
                  </span>
                </p>
                <p><span className="font-medium">Tier:</span> {client.client_tier || 'N/A'}</p>
              </div>
            </div>
 
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Contact Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {client.contact_email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {client.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
 
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Location</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Region:</span> {client.region || 'N/A'}</p>
                <p><span className="font-medium">Country:</span> {client.country || 'N/A'}</p>
                <p><span className="font-medium">Address:</span> {client.address || 'N/A'}</p>
              </div>
            </div>
 
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Additional Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Created At:</span> {new Date(client.created_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Updated At:</span> {new Date(client.updated_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Notes:</span> {client.notes || 'No notes available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default ClientView;
 
 

 