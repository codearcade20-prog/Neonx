import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// Define the Enquiry type
interface Enquiry {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  message: string;
  created_at: string;
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

  return <AdminDashboard session={session} />;
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

const AdminDashboard = ({}: { session: Session }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    const { data } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setEnquiries(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-game-bg p-4 sm:p-8">
      <header className="flex justify-between items-center mb-10 bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-white drop-shadow-glow">CodeArcade Admin Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors"
        >
          Logout <LogOut size={16} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-neon-purple w-12 h-12" />
        </div>
      ) : (
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
