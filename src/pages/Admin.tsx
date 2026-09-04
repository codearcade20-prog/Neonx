import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LogIn, LogOut, Loader2, Users, Eye, Gamepad2, 
  DoorOpen, Smartphone, Monitor, Globe, RefreshCw, 
  MessageSquare, Sparkles, Clock, AlertCircle
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// Types
interface Enquiry {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  message: string;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  visitor_id: string;
  session_id: string;
  event_type: string;
  device_type: string;
  referrer: string;
  screen_width: number;
  screen_height: number;
  created_at: string;
  meta: any;
}

export const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-purple w-12 h-12" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-neon-purple shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-3xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white drop-shadow-glow mb-2">CodeArcade Admin</h2>
          <p className="text-gray-400">Restricted Access</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin Email"
            required
            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-neon-purple text-white rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Login <LogIn size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'enquiries'>('analytics');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    
    // Fetch enquiries
    const { data: enqData } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (enqData) setEnquiries(enqData);

    // Fetch analytics events
    const { data: evtData, error: evtError } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (evtError && evtError.code === '42P01') {
      // Table does not exist yet
      setTableMissing(true);
    } else if (evtData) {
      setEvents(evtData);
      setTableMissing(false);
    }

    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Compute Analytics Metrics
  const totalPageViews = events.filter(e => e.event_type === 'page_view').length;
  const uniqueVisitors = new Set(events.map(e => e.visitor_id)).size;
  const totalGamesStarted = events.filter(e => e.event_type === 'game_start').length;
  const totalDoorsOpened = events.filter(e => e.event_type === 'door_select').length;
  
  // Device Breakdown
  const mobileCount = events.filter(e => e.device_type === 'mobile').length;
  const desktopCount = events.filter(e => e.device_type === 'desktop').length;
  const tabletCount = events.filter(e => e.device_type === 'tablet').length;
  const totalDevices = events.length || 1;
  const mobilePct = Math.round((mobileCount / totalDevices) * 100);
  const desktopPct = Math.round((desktopCount / totalDevices) * 100);

  // Top Referrers
  const referrerCounts: Record<string, number> = {};
  events.forEach(e => {
    const ref = e.referrer || 'Direct / App';
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const sortedReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-game-bg p-4 sm:p-8 text-white">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-black/40 p-4 sm:p-6 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-glow flex items-center gap-2">
            <Sparkles className="text-neon-purple" /> CodeArcade Hub
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Live Audience & Outreach Tracking</p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin text-neon-blue' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/40 transition-colors text-sm font-medium cursor-pointer"
          >
            Logout <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-black/30 p-1.5 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Eye size={18} /> Analytics & Reach
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer relative ${
            activeTab === 'enquiries'
              ? 'bg-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={18} /> Inquiries
          {enquiries.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-neon-pink text-white rounded-full font-black">
              {enquiries.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-neon-purple w-12 h-12" />
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="space-y-8">
          {tableMissing && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-4">
              <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-bold text-amber-200">Database Setup Required</h4>
                <p className="text-sm text-gray-300 mt-1">
                  Please run the provided SQL script in your Supabase SQL Editor to create the <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300">analytics_events</code> table. Once created, live visitor tracking will appear here automatically!
                </p>
              </div>
            </div>
          )}

          {/* Primary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-black/40 border border-neon-blue/30 p-5 rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.15)] relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Unique Visitors</span>
                <Users className="text-neon-blue" size={20} />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">{uniqueVisitors}</div>
              <p className="text-[11px] text-gray-400 mt-2">Individual users reached</p>
            </div>

            <div className="bg-black/40 border border-neon-purple/30 p-5 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Visits</span>
                <Eye className="text-neon-purple" size={20} />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">{totalPageViews}</div>
              <p className="text-[11px] text-gray-400 mt-2">Total page views</p>
            </div>

            <div className="bg-black/40 border border-neon-gold/30 p-5 rounded-2xl shadow-[0_0_25px_rgba(234,179,8,0.15)] relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Games Played</span>
                <Gamepad2 className="text-neon-gold" size={20} />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">{totalGamesStarted}</div>
              <p className="text-[11px] text-gray-400 mt-2">"Enter the Arena" clicks</p>
            </div>

            <div className="bg-black/40 border border-neon-green/30 p-5 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.15)] relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Doors Opened</span>
                <DoorOpen className="text-neon-green" size={20} />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">{totalDoorsOpened}</div>
              <p className="text-[11px] text-gray-400 mt-2">Card reveals triggered</p>
            </div>
          </div>

          {/* Secondary Details: Devices, Referrers, and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device & Platform Breakdown */}
            <div className="bg-black/40 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Smartphone size={18} className="text-neon-pink" /> Device Breakdown
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="flex items-center gap-2"><Smartphone size={16} className="text-gray-400" /> Mobile</span>
                    <span>{mobileCount} ({mobilePct}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-neon-pink h-full rounded-full transition-all" style={{ width: `${mobilePct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="flex items-center gap-2"><Monitor size={16} className="text-gray-400" /> Desktop</span>
                    <span>{desktopCount} ({desktopPct}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-neon-blue h-full rounded-full transition-all" style={{ width: `${desktopPct}%` }} />
                  </div>
                </div>

                {tabletCount > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="flex items-center gap-2">Tablet</span>
                      <span>{tabletCount}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-neon-purple h-full rounded-full transition-all" style={{ width: `${Math.round((tabletCount / totalDevices) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Traffic Sources / Referrers */}
            <div className="bg-black/40 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe size={18} className="text-neon-blue" /> Traffic Sources
              </h3>

              {sortedReferrers.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No traffic sources recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedReferrers.map(([ref, count]) => (
                    <div key={ref} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm font-medium text-gray-200">{ref}</span>
                      <span className="text-xs font-bold px-2.5 py-1 bg-neon-purple/20 text-neon-purple rounded-full border border-neon-purple/30">
                        {count} hits
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Live Events Stream */}
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-neon-gold" /> Recent Live Activity
            </h3>

            {events.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">No activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {events.slice(0, 10).map((evt) => (
                  <div key={evt.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        evt.event_type === 'game_start' 
                          ? 'bg-neon-gold/20 text-neon-gold border border-neon-gold/40'
                          : evt.event_type === 'door_select'
                          ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                          : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40'
                      }`}>
                        {evt.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-gray-300">
                        {evt.device_type} • {evt.referrer}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Inquiries Tab */
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {enquiries.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-12 text-lg">No enquiries yet.</p>
          ) : (
            enquiries.map((enq) => (
              <div key={enq.id} className="bg-black/60 border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-neon-purple/50 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple to-neon-pink" />
                <h3 className="text-xl font-bold text-white mb-1">{enq.name}</h3>
                <a href={`mailto:${enq.email}`} className="text-neon-blue text-sm mb-1 block hover:underline">{enq.email}</a>
                {enq.mobile && <p className="text-gray-400 text-sm mb-4">📱 {enq.mobile}</p>}
                
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">{enq.message}</p>
                </div>
                
                <div className="mt-4 text-[10px] text-gray-500 uppercase tracking-wider">
                  {new Date(enq.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
