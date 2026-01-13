import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, Building2, Target, TrendingUp, FileText, Activity, 
  DollarSign, TrendingDown, Calendar, Briefcase, CheckCircle, 
  Clock, XCircle, Globe, User, Filter, FileSearch, Users as TeamIcon,
  FileCheck, FileSignature, MapPin, UserCheck, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [regions, setRegions] = useState([]);
  const [owners, setOwners] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchRegions();
    fetchOwners();
  }, [dateRange, selectedRegion, selectedOwner]);

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await api.get('/users/sales-owners');
      setOwners(response.data);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        region: selectedRegion !== 'all' ? selectedRegion : undefined,
        owner: selectedOwner !== 'all' ? selectedOwner : undefined
      };
      const response = await api.get('/dashboard/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Select date range';
    if (!dateRange?.to) return format(dateRange.from, 'MMM d, yyyy');
    return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  };

  const renderConversionFunnel = () => {
    const funnelData = [
      { name: 'Leads', value: analytics?.funnel?.leads || 0, fill: '#2C6AA6' },
      { name: 'Qualified', value: analytics?.funnel?.qualified || 0, fill: '#3B82F6' },
      { name: 'Opportunity', value: analytics?.funnel?.opportunities || 0, fill: '#8B5CF6' },
      { name: 'Won', value: analytics?.funnel?.won || 0, fill: '#10B981' },
    ];

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold font-['Manrope']">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-col items-center space-y-2">
            {funnelData.map((stage, index) => (
              <div key={stage.name} className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">{stage.name}</span>
                  <span className="text-sm font-bold text-slate-900">{stage.value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full transition-all duration-500 ease-in-out"
                    style={{
                      width: `${(stage.value / (funnelData[0]?.value || 1)) * 100}%`,
                      backgroundColor: stage.fill,
                    }}
                  />
                </div>
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center -mt-1">
                    <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRegionalDistribution = () => {
    const regionData = analytics?.regional_distribution || [];
    
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold font-['Manrope']">Regional Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={regionData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6AA6] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Clients',
      value: analytics?.overview?.total_clients || 0,
      icon: Building2,
      color: 'bg-[#2C6AA6]',
      testId: 'total-clients-stat'
    },
    {
      title: 'Active Leads',
      value: analytics?.leads?.active_leads || 0,
      icon: Target,
      color: 'bg-[#9B6CC9]',
      testId: 'active-leads-stat'
    },
    {
      title: 'Active Opportunities',
      value: analytics?.pipeline?.active_opportunities || 0,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      testId: 'active-opportunities-stat'
    },
    {
      title: 'Pending Tasks',
      value: analytics?.action_items?.pending || 0,
      icon: Activity,
      color: 'bg-amber-500',
      testId: 'pending-tasks-stat'
    },
    {
      title: 'Overdue Tasks',
      value: analytics?.action_items?.overdue || 0,
      icon: TrendingDown,
      color: 'bg-red-500',
      testId: 'overdue-tasks-stat'
    },
    {
      title: 'Sales Activities',
      value: analytics?.sales_activities?.total || 0,
      icon: Activity,
      color: 'bg-blue-500',
      testId: 'sales-activities-stat'
    },
    {
      title: 'Total Partners',
      value: analytics?.partners?.total_partners || 0,
      icon: Users,
      color: 'bg-purple-500',
      testId: 'partners-stat'
    },
    {
      title: 'Active SOWs',
      value: analytics?.sow_tracking?.active_sows || 0,
      icon: FileText,
      color: 'bg-cyan-500',
      testId: 'active-sows-stat'
    },
  ];

  const pipelineData = analytics?.pipeline?.opportunities_by_stage
    ? Object.entries(analytics.pipeline.opportunities_by_stage).map(([name, value]) => ({ name, value }))
    : [];

  const leadsSourceData = analytics?.leads?.leads_by_source
    ? Object.entries(analytics.leads.leads_by_source).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ['#2C6AA6', '#9B6CC9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-5" data-testid="dashboard-page">
      {/* Header with Global Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Dashboard</h1>
            <p className="text-sm text-slate-600 mt-0.5">Sales performance overview</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar className="h-3.5 w-3.5 mr-2" />
              {formatDateRange()}
            </Button>
          </div>
        </div>

        {/* Global Filters */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 transition-all duration-200 ${showDatePicker ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Date Range</label>
            <div className="flex border rounded-md p-2 text-sm items-center">
              <Calendar className="h-4 w-4 mr-2 text-slate-500" />
              <span>{formatDateRange()}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto h-6 text-xs"
                onClick={() => {}}
              >
                Change
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Region</label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-8 text-xs">
                <Globe className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region.id} value={region.id} className="text-xs">
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Account Owner</label>
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger className="h-8 text-xs">
                <User className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {owners.map(owner => (
                  <SelectItem key={owner.id} value={owner.id} className="text-xs">
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Leads KPI Card */}
        <Card className="border-slate-200" data-testid="leads-kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-['Manrope'] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#2C6AA6]" />
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-lg font-bold text-slate-900 font-['JetBrains_Mono']">
                {(analytics?.leads?.total_leads || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                In Progress
              </span>
              <span className="text-lg font-bold text-amber-600 font-['JetBrains_Mono']">
                {(analytics?.leads?.in_progress || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Completed
              </span>
              <span className="text-lg font-bold text-emerald-600 font-['JetBrains_Mono']">
                {(analytics?.leads?.completed || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Lost
              </span>
              <span className="text-lg font-bold text-red-600 font-['JetBrains_Mono']">
                {(analytics?.leads?.lost || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities KPI Card */}
        <Card className="border-slate-200" data-testid="opportunities-kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-['Manrope'] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-lg font-bold text-slate-900 font-['JetBrains_Mono']">
                {(analytics?.pipeline?.total_opportunities || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                In Progress
              </span>
              <span className="text-lg font-bold text-amber-600 font-['JetBrains_Mono']">
                {(analytics?.pipeline?.in_progress || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Completed (Won)
              </span>
              <span className="text-lg font-bold text-emerald-600 font-['JetBrains_Mono']">
                {(analytics?.pipeline?.won || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Lost
              </span>
              <span className="text-lg font-bold text-red-600 font-['JetBrains_Mono']">
                {(analytics?.pipeline?.lost || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Projects KPI Card */}
        <Card className="border-slate-200" data-testid="projects-kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-['Manrope'] flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-lg font-bold text-slate-900 font-['JetBrains_Mono']">
                {(analytics?.projects?.total_projects || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                In Progress
              </span>
              <span className="text-lg font-bold text-amber-600 font-['JetBrains_Mono']">
                {(analytics?.projects?.in_progress || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Completed
              </span>
              <span className="text-lg font-bold text-emerald-600 font-['JetBrains_Mono']">
                {(analytics?.projects?.completed || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Lost / Cancelled
              </span>
              <span className="text-lg font-bold text-red-600 font-['JetBrains_Mono']">
                {(analytics?.projects?.cancelled || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-slate-200" data-testid={stat.testId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1 font-['Manrope']">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Forecast Stats - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-['Manrope']">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline space-x-1.5">
              <DollarSign className="h-4 w-4 text-[#2C6AA6]" />
              <span className="text-2xl font-bold text-slate-900 font-['JetBrains_Mono']">
                {(analytics?.pipeline?.total_pipeline_value || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Total estimated pipeline value</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-['Manrope']">Forecast Amount</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline space-x-1.5">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-bold text-slate-900 font-['JetBrains_Mono']">
                {(analytics?.forecasts?.total_forecast_amount || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Total forecasted revenue</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-['Manrope']">SOW Value</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline space-x-1.5">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold text-slate-900 font-['JetBrains_Mono']">
                {(analytics?.sow_tracking?.total_sow_value || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Total SOW value in execution</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-['Manrope']">Win Probability</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline space-x-1.5">
              <TrendingUp className="h-4 w-4 text-[#9B6CC9]" />
              <span className="text-2xl font-bold text-slate-900 font-['JetBrains_Mono']">
                {analytics?.forecasts?.avg_win_probability || 0}%
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Average forecast probability</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Conversion Funnel */}
        {renderConversionFunnel()}
        
        {/* Regional Distribution */}
        {renderRegionalDistribution()}
        
        {/* Source Distribution */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-['Manrope']">Source Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {leadsSourceData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leadsSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {leadsSourceData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-sm mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate">{entry.name}</span>
                      <span className="ml-auto font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-slate-500">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RFP & SOW Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* RFP Tracking */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-['Manrope'] flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-blue-500" />
                RFP Tracking
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-4">
              {analytics?.rfp_tracking?.map((rfp, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rfp.title}</p>
                      <p className="text-xs text-slate-500 mt-1">Due: {new Date(rfp.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rfp.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                        rfp.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {rfp.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!analytics?.rfp_tracking || analytics.rfp_tracking.length === 0) && (
                <div className="text-center py-6 text-sm text-slate-500">
                  No active RFPs
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SOW Tracking */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-['Manrope'] flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-purple-500" />
                SOW Tracking
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-4">
              {analytics?.sow_tracking?.active_sows_list?.map((sow, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sow.project_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {sow.client_name} • ${sow.value?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sow.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                        sow.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        sow.status === 'signed' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {sow.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!analytics?.sow_tracking?.active_sows_list || analytics.sow_tracking.active_sows_list.length === 0) && (
                <div className="text-center py-6 text-sm text-slate-500">
                  No active SOWs
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staffing Requests */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold font-['Manrope'] flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-cyan-500" />
              Staffing Requests
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Timeline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {analytics?.staffing_requests?.map((request, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {request.role}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500">
                      {request.project_name}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {request.skills?.slice(0, 3).map((skill, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                        {request.skills?.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            +{request.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'open' ? 'bg-green-100 text-green-800' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!analytics?.staffing_requests || analytics.staffing_requests.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">
                      No active staffing requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;