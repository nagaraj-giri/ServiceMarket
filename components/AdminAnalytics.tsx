
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { ServiceRequest, ProviderProfile, User, AnalyticsTab, UserRole } from '../types';

interface AdminAnalyticsProps {
  requests: ServiceRequest[];
  providers: ProviderProfile[];
  users: User[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ requests, providers, users }) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('users');

  // --- HELPER COMPONENTS ---
  const KpiCard = ({ title, value, subtext, trend, icon, color = 'bg-dubai-gold' }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg text-white ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        {trend !== undefined && (
          <span className={`font-bold mr-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        <span className="text-gray-400">{subtext}</span>
      </div>
    </div>
  );

  const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );

  // --- MOCK DATA GENERATORS (Since we have limited real data history) ---
  const generateTimeData = (days = 7, metric = 'value') => {
    return Array.from({ length: days }).map((_, i) => ({
      name: new Date(Date.now() - (days - 1 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      [metric]: Math.floor(Math.random() * 20) + 5,
      secondary: Math.floor(Math.random() * 10) + 2
    }));
  };

  const timeData = generateTimeData(7, 'count');

  // --- 1. USER ANALYTICS RENDER ---
  const renderUserAnalytics = () => {
    const totalUsers = users.length;
    const newUsersToday = users.filter(u => new Date(u.joinDate || '').toDateString() === new Date().toDateString()).length;
    const activeUsers = Math.floor(totalUsers * 0.8); // Mock active
    
    const roleData = [
      { name: 'Customers', value: users.filter(u => u.role === UserRole.USER).length },
      { name: 'Providers', value: users.filter(u => u.role === UserRole.PROVIDER).length },
      { name: 'Admins', value: users.filter(u => u.role === UserRole.ADMIN).length },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="User Analytics" desc="Growth, segmentation, and engagement metrics." />
        
        {/* User KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Users" value={totalUsers} subtext="Total registered" trend={12} icon="👥" color="bg-blue-500" />
          <KpiCard title="New Users" value={newUsersToday + 2} subtext="Today" trend={5} icon="🆕" color="bg-green-500" />
          <KpiCard title="Active Users" value={activeUsers} subtext="Last 30 days" trend={2} icon="⚡" color="bg-purple-500" />
          <KpiCard title="Retention" value="85%" subtext="Returning > 7 days" trend={-1} icon="🔄" color="bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">User Growth (Last 7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Segmentation */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">User Segmentation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Activity Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-100"><h3 className="font-bold">Top Actions Performed</h3></div>
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="px-6 py-3">Action Name</th>
                 <th className="px-6 py-3">Count (This Week)</th>
                 <th className="px-6 py-3">Trend</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                <tr><td className="px-6 py-3">Viewed Provider Profile</td><td className="px-6 py-3 font-bold">1,240</td><td className="px-6 py-3 text-green-600">▲ 12%</td></tr>
                <tr><td className="px-6 py-3">Created Request</td><td className="px-6 py-3 font-bold">85</td><td className="px-6 py-3 text-green-600">▲ 5%</td></tr>
                <tr><td className="px-6 py-3">Sent Message</td><td className="px-6 py-3 font-bold">432</td><td className="px-6 py-3 text-red-500">▼ 2%</td></tr>
             </tbody>
           </table>
        </div>
      </div>
    );
  };

  // --- 2. LEADS ANALYTICS RENDER ---
  const renderLeadsAnalytics = () => {
    const totalLeads = requests.length;
    const openLeads = requests.filter(r => r.status === 'open').length;
    const quoted = requests.filter(r => r.status === 'quoted').length;
    const accepted = requests.filter(r => r.status === 'accepted' || r.status === 'closed').length;
    
    const funnelData = [
      { name: 'Total Leads', value: totalLeads },
      { name: 'Quoted', value: quoted },
      { name: 'Accepted', value: accepted },
      { name: 'Completed', value: requests.filter(r => r.status === 'closed').length },
    ];

    const categoryData = Object.entries(requests.reduce((acc: any, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const staleLeads = requests.filter(r => r.status === 'open' && (Date.now() - new Date(r.createdAt).getTime() > 86400000));

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="Leads & Funnel" desc="Pipeline health, conversion rates, and demand analysis." />

        {/* Lead KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Volume" value={totalLeads} subtext="Lifetime" trend={8} icon="📥" color="bg-gray-800" />
          <KpiCard title="Lead → Quote" value={`${totalLeads ? Math.round((quoted/totalLeads)*100) : 0}%`} subtext="Response Rate" trend={2} icon="💬" color="bg-blue-600" />
          <KpiCard title="Conversion" value={`${quoted ? Math.round((accepted/quoted)*100) : 0}%`} subtext="Quote → Accept" trend={-5} icon="✅" color="bg-green-600" />
          <KpiCard title="Avg Time to Quote" value="3.5h" subtext="Speed" trend={10} icon="⏱️" color="bg-yellow-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Funnel Chart */}
           <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Lead Conversion Funnel</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" fill="#C5A059" radius={[0, 4, 4, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Category Pie */}
           <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Leads by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize:'12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Stale Leads Risk */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
              <h3 className="font-bold text-red-800">⚠️ Stale Leads Risk (No quote {'>'} 24h)</h3>
              <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-bold">{staleLeads.length} Leads</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500">
                    <tr>
                       <th className="px-6 py-3">Title</th>
                       <th className="px-6 py-3">Category</th>
                       <th className="px-6 py-3">Age</th>
                       <th className="px-6 py-3">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {staleLeads.length > 0 ? staleLeads.map(r => (
                       <tr key={r.id}>
                          <td className="px-6 py-3 font-medium">{r.title}</td>
                          <td className="px-6 py-3">{r.category}</td>
                          <td className="px-6 py-3 text-red-600 font-bold">{Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (3600000))}h</td>
                          <td className="px-6 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">Stuck</span></td>
                       </tr>
                    )) : (
                       <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No stale leads found. Good job!</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  // --- 3. PROVIDER ANALYTICS RENDER ---
  const renderProviderAnalytics = () => {
    // Derived stats
    const providerStats = providers.map(p => {
        const quotesSent = requests.reduce((acc, r) => acc + (r.quotes.some(q => q.providerId === p.id) ? 1 : 0), 0);
        const wins = requests.reduce((acc, r) => acc + (r.quotes.some(q => q.providerId === p.id && q.status === 'accepted') ? 1 : 0), 0);
        return { ...p, quotesSent, wins, winRate: quotesSent > 0 ? Math.round((wins / quotesSent) * 100) : 0 };
    }).sort((a, b) => b.quotesSent - a.quotesSent);

    const activeProviders = providerStats.filter(p => p.quotesSent > 0).length;

    // Mock Response Time Dist
    const responseTimeData = [
       { range: '< 1 hr', count: 12 },
       { range: '1-4 hrs', count: 25 },
       { range: '4-12 hrs', count: 18 },
       { range: '12-24 hrs', count: 8 },
       { range: '> 24 hrs', count: 4 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="Provider Performance" desc="Supply side health, responsiveness, and quality." />

        {/* Provider KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Providers" value={providers.length} subtext="Onboarded" trend={2} icon="🏢" color="bg-indigo-600" />
          <KpiCard title="Active (30d)" value={activeProviders} subtext={`${Math.round((activeProviders/providers.length)*100)}% Utilization`} trend={0} icon="⚡" color="bg-green-600" />
          <KpiCard title="Avg Win Rate" value="18%" subtext="Marketplace Avg" trend={1} icon="🏆" color="bg-yellow-500" />
          <KpiCard title="Disputes" value="2" subtext="Open Cases" trend={-1} icon="⚖️" color="bg-red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Top Providers Table */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-900">Top Performers</h3></div>
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500">
                    <tr><th className="px-4 py-2">Provider</th><th className="px-4 py-2">Quotes</th><th className="px-4 py-2">Win %</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {providerStats.slice(0, 5).map(p => (
                       <tr key={p.id}>
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">{p.quotesSent}</td>
                          <td className="px-4 py-3 text-green-600 font-bold">{p.winRate}%</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Response Time Chart */}
           <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Response Time Distribution</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="range" tick={{fontSize: 10}} />
                       <YAxis />
                       <Tooltip cursor={{fill: 'transparent'}} />
                       <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    );
  };

  // --- 4. SITE ANALYTICS RENDER ---
  const renderSiteAnalytics = () => {
    // Mock Data
    const trafficData = [
       { name: 'Organic Search', value: 4500 },
       { name: 'Direct', value: 2100 },
       { name: 'Social', value: 1200 },
       { name: 'Referral', value: 800 },
    ];

    const topPages = [
       { page: '/home', visits: 12500, bounce: '45%' },
       { page: '/services/golden-visa', visits: 4200, bounce: '32%' },
       { page: '/dashboard', visits: 3800, bounce: '12%' },
       { page: '/request/create', visits: 2100, bounce: '55%' },
    ];

    const searchTerms = [
       { term: "freelance visa price", count: 420 },
       { term: "business setup dubai south", count: 310 },
       { term: "family sponsorship salary", count: 180 },
       { term: "golden visa requirements", count: 150 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="Site Analytics" desc="Traffic sources, content performance, and system health." />

        {/* Site KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Sessions" value="24.5K" subtext="This Month" trend={15} icon="🌐" color="bg-blue-600" />
          <KpiCard title="Avg Duration" value="4m 12s" subtext="Engagement" trend={3} icon="⏱️" color="bg-indigo-500" />
          <KpiCard title="Bounce Rate" value="42%" subtext="Lower is better" trend={-2} icon="📉" color="bg-orange-500" />
          <KpiCard title="API Uptime" value="99.9%" subtext="System Health" icon="🖥️" color="bg-green-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Traffic Sources */}
           <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Traffic Sources</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={trafficData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                          {trafficData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                       </Pie>
                       <Tooltip />
                       <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Top Search Terms */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-900">Top Internal Searches</h3></div>
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500">
                    <tr><th className="px-4 py-2">Search Term</th><th className="px-4 py-2">Count</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {searchTerms.map((t, i) => (
                       <tr key={i}>
                          <td className="px-4 py-3 text-gray-700">"{t.term}"</td>
                          <td className="px-4 py-3 font-medium">{t.count}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Top Pages Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-gray-900">Most Visited Pages</h3></div>
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500">
                    <tr>
                       <th className="px-6 py-3">Page URL</th>
                       <th className="px-6 py-3">Visits</th>
                       <th className="px-6 py-3">Bounce Rate</th>
                       <th className="px-6 py-3">Performance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {topPages.map((p, i) => (
                       <tr key={i}>
                          <td className="px-6 py-4 font-mono text-xs text-blue-600">{p.page}</td>
                          <td className="px-6 py-4 font-bold">{p.visits.toLocaleString()}</td>
                          <td className="px-6 py-4 text-gray-500">{p.bounce}</td>
                          <td className="px-6 py-4">
                             <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div>
      {/* Analytics Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 inline-flex">
        {(['users', 'leads', 'providers', 'site'] as AnalyticsTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white text-dubai-gold shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Render Active Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'users' && renderUserAnalytics()}
        {activeTab === 'leads' && renderLeadsAnalytics()}
        {activeTab === 'providers' && renderProviderAnalytics()}
        {activeTab === 'site' && renderSiteAnalytics()}
      </div>
    </div>
  );
};

export default AdminAnalytics;