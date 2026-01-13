import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Target, DollarSign, FolderOpen, Filter, Calendar, ChevronDown } from 'lucide-react';

const Dashboard = () => {
  // State for filters
  const [filters, setFilters] = useState({
    timeRange: 'all',
    region: 'all',
    user: 'all'
  });

  // KPI data
  const [kpiData, setKpiData] = useState({
    leads: { count: 0, change: 0 },
    opportunities: { value: 0, count: 0, change: 0 },
    sales: { count: 0, change: 0 },
    projects: { count: 0, change: 0 }
  });

  const [funnelData, setFunnelData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - replace with actual API calls
        setKpiData({
          leads: { count: 1250, change: 12.5 },
          opportunities: { value: 1250000, count: 42, change: 8.2 },
          sales: { count: 89, change: 5.7 },
          projects: { count: 36, change: 2.3 }
        });

        setFunnelData([
          { name: 'Leads', value: 1250, color: '#1d4ed8' },
          { name: 'Qualified', value: 780, color: '#3b82f6' },
          { name: 'Opportunities', value: 420, color: '#60a5fa' },
          { name: 'Won', value: 89, color: '#93c5fd' }
        ]);

        setSourceData([
          { name: 'Advertisement', value: 120, color: '#3b82f6' },
          { name: 'Cold Call', value: 80, color: '#10b981' },
          { name: 'Employee Referral', value: 150, color: '#f59e0b' },
          { name: 'External Referral', value: 90, color: '#8b5cf6' },
          { name: 'Online Store', value: 200, color: '#ec4899' },
          { name: 'Partner', value: 75, color: '#06b6d4' },
          { name: 'Public Relations', value: 60, color: '#f97316' },
          { name: 'Sales Email', value: 180, color: '#6366f1' },
          { name: 'Seminar / Trade Show', value: 95, color: '#14b8a6' },
          { name: 'Web Download', value: 110, color: '#f43f5e' },
          { name: 'Web Research', value: 70, color: '#a855f7' },
          { name: 'Chat / Portal / Others', value: 50, color: '#84cc16' }
        ].sort((a, b) => b.value - a.value));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(value);
  };

  const KpiCard = ({ title, value, change, icon: Icon, isCurrency = false }) => (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold mb-1">
              {isCurrency ? formatCurrency(value) : value.toLocaleString()}
            </h3>
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {change >= 0 ? (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H9v1h2a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H5a1 1 0 110-2h2V8H5a1 1 0 010-2h4a1 1 0 011 1v1h1a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {Math.abs(change)}% {change >= 0 ? 'increase' : 'decrease'} from last period
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your sales and projects</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Last 30 days
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 block mb-1">Time Range</label>
              <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange('timeRange', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-500 block mb-1">Region</label>
              <Select value={filters.region} onValueChange={(value) => handleFilterChange('region', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="na">North America</SelectItem>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="apac">APAC</SelectItem>
                  <SelectItem value="latam">LATAM</SelectItem>
                  <SelectItem value="mea">Middle East & Africa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-500 block mb-1">Users</label>
              <Select value={filters.user} onValueChange={(value) => handleFilterChange('user', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Jane Smith</SelectItem>
                  <SelectItem value="user3">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Leads" 
          value={kpiData.leads.count} 
          change={kpiData.leads.change} 
          icon={Users} 
        />
        <KpiCard 
          title="Opportunities" 
          value={kpiData.opportunities.value} 
          change={kpiData.opportunities.change} 
          icon={Target}
          isCurrency 
        />
        <KpiCard 
          title="Sales" 
          value={kpiData.sales.count} 
          change={kpiData.sales.change} 
          icon={DollarSign} 
        />
        <KpiCard 
          title="Projects" 
          value={kpiData.projects.count} 
          change={kpiData.projects.change} 
          icon={FolderOpen} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 p-4">
              {funnelData.map((stage, index) => {
                const widthPercentage = (stage.value / funnelData[0].value) * 100;
                const conversionRate = index > 0 
                  ? Math.round((stage.value / funnelData[index - 1].value) * 100)
                  : 100;
                
                return (
                  <div key={stage.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">{stage.value}</span>
                        {index > 0 && (
                          <span className="text-xs text-gray-500">
                            ({conversionRate}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div 
                      className="h-8 rounded-md transition-all duration-500 ease-in-out"
                      style={{ 
                        width: `${widthPercentage}%`,
                        backgroundColor: stage.color,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="h-full flex items-center justify-end pr-2">
                        {index > 0 && (
                          <span className="text-xs font-medium text-white">
                            {conversionRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourceData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 40,
                  }}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickLine={false}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Count']}
                    labelFormatter={(label) => `Source: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                  />
                  {sourceData.map((entry, index) => (
                    <Bar 
                      key={`bar-${index}`}
                      dataKey="value"
                      name={entry.name}
                      data={[entry]}
                      fill={entry.color}
                      radius={[0, 4, 4, 0]}
                      animationBegin={index * 100}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
