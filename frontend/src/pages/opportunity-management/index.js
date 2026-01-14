import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area } from 'recharts';
import { Skeleton } from '../../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { BarChart as Chart, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LabelList } from 'recharts';

// Sample data - replace with actual API call
const sampleData = [
  { id: 1, opportunityName: 'Project Alpha', clientName: 'Acme Corp', amount: 50000, primaryStatus: 'Pending L1', subStatus: 'SOW Pending', createdDate: '2024-01-01', closeDate: '2024-03-01' },
  { id: 2, opportunityName: 'Website Redesign', clientName: 'Beta Inc', amount: 35000, primaryStatus: 'Pending L2', subStatus: 'Opportunity Approval Pending', createdDate: '2024-01-10', closeDate: '2024-02-28' },
  { id: 3, opportunityName: 'Cloud Migration', clientName: 'Gamma LLC', amount: 120000, primaryStatus: 'Closed / Won', subStatus: null, createdDate: '2023-12-15', closeDate: '2024-01-30' },
  { id: 4, opportunityName: 'Mobile App', clientName: 'Delta Co', amount: 75000, primaryStatus: 'Lost', subStatus: null, createdDate: '2023-12-20', closeDate: '2024-01-15' },
  { id: 5, opportunityName: 'Data Analytics', clientName: 'Epsilon Ltd', amount: 60000, primaryStatus: 'Pending L1', subStatus: 'SOW Pending', createdDate: '2024-01-05', closeDate: '2024-03-15' },
];

// Color scheme matching project theme
const COLORS = {
  'Pending L1': '#2C6AA6',  // Dark blue
  'Pending L2': '#3B82F6',  // Blue
  'Closed / Won': '#10B981', // Green
  'Lost': '#EF4444',        // Red
  'In Progress': '#F59E0B',  // Amber
  'On Hold': '#6B7280'      // Gray
};

// Animation variants for framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

// Custom bar component with animation
const AnimatedBar = (props) => {
  const { x, y, width, height, fill, value } = props;
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={isAnimated ? width : 0}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
        style={{
          transition: 'width 1s ease-in-out',
          transformOrigin: 'left center'
        }}
      />
      {width > 40 && (
        <text
          x={x + (width / 2)}
          y={y + (height / 2)}
          dy=".35em"
          fill="#fff"
          textAnchor="middle"
          fontSize={12}
          fontWeight={500}
        >
          {value}
        </text>
      )}
    </g>
  );
};

// Custom pie segment with animation
const AnimatedPie = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
  const [animateTo, setAnimateTo] = useState(0);

  useEffect(() => {
    setAnimateTo(1);
  }, []);

  return (
    <path
      d={`
        M ${cx} ${cy}
        L ${cx} ${cy - outerRadius}
        A ${outerRadius} ${outerRadius} 0 
        ${endAngle - startAngle > Math.PI ? 1 : 0} 1 
        ${cx + outerRadius * Math.cos(startAngle + (endAngle - startAngle) * animateTo)} 
        ${cy + outerRadius * Math.sin(startAngle + (endAngle - startAngle) * animateTo)}
        Z
      `}
      fill={fill}
      style={{
        transition: 'all 1s ease-out',
        transformOrigin: `${cx}px ${cy}px`
      }}
    />
  );
};

const OpportunityManagement = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(sampleData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Process data for charts with enhanced data processing
  const processChartData = () => {
    // Status count and amount for bar chart with additional statuses
    const statusData = data.reduce((acc, curr) => {
      const status = curr.primaryStatus || 'In Progress';
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count += 1;
      acc[status].amount += curr.amount || 0;
      return acc;
    }, {});

    // Format for bar chart with consistent ordering
    const statusOrder = ['Pending L1', 'Pending L2', 'In Progress', 'On Hold', 'Closed / Won', 'Lost'];
    const barChartData = statusOrder
      .filter(status => status in statusData)
      .map(status => ({
        name: status,
        count: statusData[status].count,
        amount: statusData[status].amount,
        color: COLORS[status] || '#8884d8'
      }));

    // Format for donut chart with percentage and amount calculation
    const totalCount = Object.values(statusData).reduce((sum, { count }) => sum + count, 0);
    const totalAmount = Object.values(statusData).reduce((sum, { amount }) => sum + amount, 0);
    
    const donutChartData = Object.entries(statusData)
      .map(([name, { count, amount }]) => ({
        name,
        value: count,
        amount,
        percent: count / totalCount,
        amountPercent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: COLORS[name] || '#8884d8'
      }))
      .sort((a, b) => b.value - a.value);

    // Enhanced pending breakdown with more categories
    const pendingData = data.filter(d => d.primaryStatus && d.primaryStatus.startsWith('Pending'));
    const pendingBreakdown = pendingData.reduce((acc, curr) => {
      const status = curr.subStatus || 'Review Needed';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const pendingChartData = Object.entries(pendingBreakdown)
      .map(([status, count]) => ({
        name: status.length > 15 ? `${status.substring(0, 15)}...` : status,
        count,
        fullName: status,
        color: status.includes('SOW') ? COLORS['Pending L1'] : COLORS['Pending L2']
      }))
      .sort((a, b) => b.count - a.count);

    // Enhanced trend data with 3 months of data
    const months = [];
    const currentDate = new Date();
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      months.push({
        name: date.toLocaleString('default', { month: 'short' }),
        count: 0
      });
    }

    const trendData = data.reduce((acc, curr) => {
      const createdDate = new Date(curr.createdDate);
      const monthIndex = currentDate.getMonth() - createdDate.getMonth();
      if (monthIndex >= 0 && monthIndex <= 2) {
        acc[2 - monthIndex].count++;
      }
      return acc;
    }, [...months]);

    return { barChartData, donutChartData, pendingChartData, trendData };
  };

  const { barChartData, donutChartData, pendingChartData, trendData } = processChartData();

  // Enhanced tooltip with better formatting and amount display
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm">
          <p className="font-semibold text-gray-900 mb-2">{data.fullName || label}</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Count:</span>
              <span className="font-medium">{data.value || data.count}</span>
            </div>
            {data.percent !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Percentage:</span>
                <span className="font-medium">{(data.percent * 100).toFixed(1)}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">
                ${(data.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            {data.amountPercent !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount %:</span>
                <span className="font-medium">{data.amountPercent.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced donut chart label with better positioning and amount info
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
    value,
    payload
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = 25 + innerRadius + (outerRadius - innerRadius);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if segment is large enough
    if (percent < 0.1) return null;

    return (
      <g>
        <text
          x={x}
          y={y - 8}
          fill="#4B5563"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-xs font-medium"
        >
          {`${name}: ${value}`}
        </text>
        <text
          x={x}
          y={y + 8}
          fill="#6B7280"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-2xs"
        >
          {`₹${payload.amount.toLocaleString('en-IN')}`}
        </text>
      </g>
    );
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API refresh
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Opportunity Management</h1>
            <p className="text-sm text-gray-500">Loading data...</p>
          </div>
          <div className="w-48">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white rounded-lg shadow">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Opportunity Management</h1>
            <button
              onClick={handleRefresh}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Count Bar Chart */}
        <Card className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Opportunity Status</CardTitle>
            <p className="text-xs text-gray-500">Distribution of opportunities by status</p>
          </CardHeader>
          <CardContent className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 15 }}
                barCategoryGap={12}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2C6AA6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2C6AA6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar 
                  dataKey="count" 
                  name="Opportunities"
                  animationBegin={200}
                  animationDuration={1200}
                  radius={[4, 4, 0, 0]}
                  shape={<AnimatedBar />}
                >
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{
                        filter: 'drop-shadow(0 4px 8px rgba(44, 106, 166, 0.2))',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        fill="#374151"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      />
                    </Cell>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Opportunity Distribution Donut Chart */}
        <Card className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Opportunity Distribution</CardTitle>
            <p className="text-xs text-gray-500">Percentage breakdown by status</p>
          </CardHeader>
          <CardContent className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {donutChartData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={entry.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={entry.color} stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  animationBegin={200}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {donutChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{
                    paddingLeft: '20px',
                    fontSize: '12px',
                  }}
                  formatter={(value, entry, index) => (
                    <span className="text-gray-700 text-sm">
                      {`${value}: ${donutChartData[index]?.value} (${(donutChartData[index]?.percent * 100).toFixed(1)}%)`}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pending Breakdown Bar Chart */}
        <Card className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Pending Opportunities</CardTitle>
            <p className="text-xs text-gray-500">Breakdown of pending items requiring attention</p>
          </CardHeader>
          <CardContent className="h-80 p-4">
            {pendingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pendingChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 15 }}
                  barCategoryGap={8}
                >
                  <defs>
                    <linearGradient id="pendingBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#2C6AA6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <XAxis 
                    type="number" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Pending Items"
                    animationBegin={200}
                    animationDuration={1200}
                    radius={[0, 4, 4, 0]}
                    shape={<AnimatedBar />}
                  >
                    {pendingChartData.map((entry, index) => (
                      <Cell 
                        key={`pending-cell-${index}`} 
                        fill={entry.color}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <LabelList 
                          dataKey="count" 
                          position="right" 
                          fill="#374151"
                          style={{ fontSize: 12, fontWeight: 500 }}
                        />
                      </Cell>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                </div>
                <h4 className="text-gray-700 font-medium">No pending opportunities</h4>
                <p className="text-sm text-gray-500 mt-1">All caught up! No items require attention.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opportunity Trend Line Chart */}
        <Card className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Opportunity Trend</CardTitle>
            <p className="text-xs text-gray-500">Monthly opportunity creation trend</p>
          </CardHeader>
          <CardContent className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 0, bottom: 15 }}
              >
                <defs>
                  <linearGradient id="trendLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#f0f0f0" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  fill="url(#trendLineGradient)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Opportunities"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: '#3B82F6',
                    stroke: '#fff',
                    strokeWidth: 2,
                    className: 'transition-all duration-300 hover:r-6'
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#2563EB',
                    stroke: '#fff',
                    strokeWidth: 2,
                    className: 'shadow-lg'
                  }}
                  animationBegin={200}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-600 text-sm font-medium">{value}</span>
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpportunityManagement;
