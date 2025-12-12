
import React, { useState, useMemo } from 'react';
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

  // --- FILTER OUT ADMINS ---
  // Analytics should strictly reflect Customers and Providers
  const analyticsUsers = useMemo(() => users.filter(u => u.role !== UserRole.ADMIN), [users]);

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
          <span className={`font-bold mr-1 ${trend > 0 ? 'text-green-600' : (trend < 0 ? 'text-red-500' : 'text-gray-500')}`}>
            {trend > 0 ? '▲' : (trend < 0 ? '▼' : '')} {Math.abs(trend)}%
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

  // --- REAL-TIME DATA CALCULATIONS ---

  // 1. User Growth Data (Last 7 Days) - Using filtered analyticsUsers
  const userGrowthData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        display: d.toLocaleDateString('en-US', { weekday: 'short' })
      };
    });

    return days.map(day => {
      const count = analyticsUsers.filter(u => {
        if (!u.joinDate) return false;
        // Assuming joinDate is ISO string
        return u.joinDate.startsWith(day.dateStr);
      }).length;
      return {
        name: day.display,
        count
      };
    });
  }, [analyticsUsers]);

  // 2. User KPIs - Using filtered analyticsUsers
  const userStats = useMemo(() => {
    const totalUsers = analyticsUsers.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const newUsersToday = analyticsUsers.filter(u => u.joinDate && u.joinDate.startsWith(todayStr)).length;
    
    // Active Users: Users with requests in last 30 days OR Providers with quotes in last 30 days.
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const activeRequestUsers = new Set(
        requests.filter(r => new Date(r.createdAt).getTime() > thirtyDaysAgo).map(r => r.userId)
    );
    
    const activeProviderUsers = new Set();
    requests.forEach(r => {
        r.quotes.forEach(q => {
            if (providers.some(p => p.id === q.providerId)) {
                 activeProviderUsers.add(q.providerId);
            }
        })
    });

    // Ensure we don't count admins if they accidentally made requests
    let activeCount = 0;
    analyticsUsers.forEach(u => {
        if (activeRequestUsers.has(u.id) || activeProviderUsers.has(u.id)) {
            activeCount++;
        }
    });
    
    // Retention approximation: Users with > 1 request
    const userRequestCounts = requests.reduce((acc, r) => {
        // Only count if user is in our analytics list (not admin)
        if (analyticsUsers.some(u => u.id === r.userId)) {
            acc[r.userId] = (acc[r.userId] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    const returningUsers = Object.values(userRequestCounts).filter(c => c > 1).length;
    const retentionRate = totalUsers > 0 ? Math.round((returningUsers / totalUsers) * 100) : 0;

    return { totalUsers, newUsersToday, activeCount, retentionRate };
  }, [analyticsUsers, requests, providers]);

  // 3. User Segmentation - Using filtered analyticsUsers (Admins will be 0)
  const roleData = useMemo(() => [
    { name: 'Customers', value: analyticsUsers.filter(u => u.role === UserRole.USER).length },
    { name: 'Providers', value: analyticsUsers.filter(u => u.role === UserRole.PROVIDER).length },
  ].filter(d => d.value > 0), [analyticsUsers]);

  // 4. Top Actions Data (This Week) - Filter out actions by Admins
  const topActionsData = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Filter requests made by analyticsUsers
    const newRequests = requests.filter(r => 
        new Date(r.createdAt).getTime() > oneWeekAgo && 
        analyticsUsers.some(u => u.id === r.userId)
    ).length;
    
    let quotesCount = 0;
    requests.forEach(r => {
        if (new Date(r.createdAt).getTime() > oneWeekAgo) {
            // Count quotes only from valid providers (in analyticsUsers)
            const validQuotes = r.quotes.filter(q => analyticsUsers.some(u => u.id === q.providerId));
            quotesCount += validQuotes.length; 
        }
    });

    // Count Reviews
    let reviewsCount = 0;
    providers.forEach(p => {
        p.reviews.forEach(r => {
            if (new Date(r.date).getTime() > oneWeekAgo) reviewsCount++;
        });
    });

    return [
        { action: 'Created Request', count: newRequests, trend: 0 },
        { action: 'Submitted Quote', count: quotesCount, trend: 0 },
        { action: 'Posted Review', count: reviewsCount, trend: 0 },
    ];
  }, [requests, providers, analyticsUsers]);


  // --- 1. USER ANALYTICS RENDER ---
  const renderUserAnalytics = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="User Analytics" desc="Real-time growth, segmentation, and engagement metrics (excluding Admins)." />
        
        {/* User KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Users" value={userStats.totalUsers} subtext="Total registered" trend={0} icon="3" color="bg-blue-500" />
          <KpiCard title="New Users" value={userStats.newUsersToday} subtext="Today" trend={0} icon="🆕" color="bg-green-500" />
          <KpiCard title="Active Users (30d)" value={userStats.activeCount} subtext="Recent Activity" trend={0} icon="⚡" color="bg-purple-500" />
          <KpiCard title="Retention" value={`${userStats.retentionRate}%`} subtext=">1 Request" trend={0} icon="🔄" color="bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">User Growth (Last 7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
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
           <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-gray-900">Top Actions (This Week)</h3></div>
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="px-6 py-3">Action Name</th>
                 <th className="px-6 py-3">Count</th>
                 <th className="px-6 py-3">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {topActionsData.map((row, i) => (
                    <tr key={i}>
                        <td className="px-6 py-3">{row.action}</td>
                        <td className="px-6 py-3 font-bold">{row.count}</td>
                        <td className="px-6 py-3 text-green-600">Active</td>
                    </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>
    );
  };

  // --- 2. LEADS ANALYTICS RENDER ---
  const renderLeadsAnalytics = () => {
    // Leads are inherently user/provider interactions, so usually okay, 
    // but ensures requests are from valid analyticsUsers.
    const validRequests = requests.filter(r => analyticsUsers.some(u => u.id === r.userId));

    const totalLeads = validRequests.length;
    const quoted = validRequests.filter(r => r.status === 'quoted').length;
    const accepted = validRequests.filter(r => r.status === 'accepted' || r.status === 'closed').length;
    const completed = validRequests.filter(r => r.status === 'closed').length;
    
    const funnelData = [
      { name: 'Total Leads', value: totalLeads },
      { name: 'Quoted', value: quoted },
      { name: 'Accepted', value: accepted },
      { name: 'Completed', value: completed },
    ];

    const categoryData = Object.entries(validRequests.reduce((acc: any, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const staleLeads = validRequests.filter(r => r.status === 'open' && (Date.now() - new Date(r.createdAt).getTime() > 86400000));

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="Leads & Funnel" desc="Pipeline health, conversion rates, and demand analysis." />

        {/* Lead KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Volume" value={totalLeads} subtext="Lifetime" trend={0} icon="📥" color="bg-gray-800" />
          <KpiCard title="Lead → Quote" value={`${totalLeads ? Math.round((quoted/totalLeads)*100) : 0}%`} subtext="Response Rate" trend={0} icon="💬" color="bg-blue-600" />
          <KpiCard title="Conversion" value={`${quoted ? Math.round((accepted/quoted)*100) : 0}%`} subtext="Quote → Accept" trend={0} icon="✅" color="bg-green-600" />
          <KpiCard title="Closed Deals" value={completed} subtext="Success" trend={0} icon="🏁" color="bg-yellow-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Funnel Chart */}
           <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Lead Conversion Funnel</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={100} />
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
    // Ensure we only look at non-admin providers (though ideally providers are never admins)
    const validProviders = providers.filter(p => analyticsUsers.some(u => u.id === p.id));

    // Derived stats
    const providerStats = validProviders.map(p => {
        const quotesSent = requests.reduce((acc, r) => acc + (r.quotes.some(q => q.providerId === p.id) ? 1 : 0), 0);
        const wins = requests.reduce((acc, r) => acc + (r.quotes.some(q => q.providerId === p.id && q.status === 'accepted') ? 1 : 0), 0);
        return { ...p, quotesSent, wins, winRate: quotesSent > 0 ? Math.round((wins / quotesSent) * 100) : 0 };
    }).sort((a, b) => b.quotesSent - a.quotesSent);

    const activeProviders = providerStats.filter(p => p.quotesSent > 0).length;
    const avgWinRate = providerStats.length > 0 ? Math.round(providerStats.reduce((acc, p) => acc + p.winRate, 0) / providerStats.length) : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SectionHeader title="Provider Performance" desc="Supply side health, responsiveness, and quality." />

        {/* Provider KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Providers" value={validProviders.length} subtext="Onboarded" trend={0} icon="🏢" color="bg-indigo-600" />
          <KpiCard title="Active (30d)" value={activeProviders} subtext={`${validProviders.length > 0 ? Math.round((activeProviders/validProviders.length)*100) : 0}% Utilization`} trend={0} icon="⚡" color="bg-green-600" />
          <KpiCard title="Avg Win Rate" value={`${avgWinRate}%`} subtext="Marketplace Avg" trend={0} icon="🏆" color="bg-yellow-500" />
          <KpiCard title="Verified" value={validProviders.filter(p => p.isVerified).length} subtext="Trusted" trend={0} icon="🛡️" color="bg-blue-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
           {/* Top Providers Table */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-900">Top Performers</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr><th className="px-4 py-2">Provider</th><th className="px-4 py-2">Quotes</th><th className="px-4 py-2">Wins</th><th className="px-4 py-2">Win %</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {providerStats.length > 0 ? providerStats.slice(0, 5).map(p => (
                        <tr key={p.id}>
                            <td className="px-4 py-3 font-medium">{p.name}</td>
                            <td className="px-4 py-3">{p.quotesSent}</td>
                            <td className="px-4 py-3">{p.wins}</td>
                            <td className="px-4 py-3 text-green-600 font-bold">{p.winRate}%</td>
                        </tr>
                        )) : <tr><td colSpan={4} className="p-4 text-center text-gray-400">No provider activity yet.</td></tr>}
                    </tbody>
                </table>
              </div>
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
        {(['users', 'leads', 'providers'] as AnalyticsTab[]).map((tab) => (
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
      </div>
    </div>
  );
};

export default AdminAnalytics;
