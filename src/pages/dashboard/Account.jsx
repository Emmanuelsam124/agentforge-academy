import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle2, Mail, Save, Loader2, CheckCircle2, KeyRound, Smartphone, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { industries } from '../../data/industries';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export default function Account() {
  const { user } = useAuth();
  const { installed, canPrompt, isIOS, promptInstall } = useInstallPrompt();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase.from('profiles').select('display_name, industry').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (cancelled) return;
      setName(data?.display_name || user.user_metadata?.display_name || '');
      const savedIndustry = data?.industry || '';
      setIndustry(industries.includes(savedIndustry) || !savedIndustry ? savedIndustry : 'Other');
      setCustomIndustry(industries.includes(savedIndustry) ? '' : savedIndustry);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const finalIndustry = industry === 'Other' ? customIndustry.trim() : industry;
      const { error: err } = await supabase
        .from('profiles')
        .update({ display_name: name.trim(), industry: finalIndustry || null })
        .eq('id', user.id);
      if (err) throw err;
      // Keeps Navbar/sidebar's displayed name in sync immediately, same
      // reasoning as ProfileInfoContext's save path.
      await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <UserCircle2 className="w-7 h-7 text-link" /> Account
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-link" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-w-lg">
          <form onSubmit={handleSave} className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-body-strong mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-body-strong mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="">Select an industry</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                <option value="Other">Other</option>
              </select>
              {industry === 'Other' && (
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Your industry"
                  className="w-full mt-2 px-3.5 py-2.5 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              )}
            </div>

            {error && <p className="text-sm text-rose">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save changes'}
            </button>
          </form>

          <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-semibold text-ink">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Password</p>
                <Link to="/welcome" className="text-sm font-semibold text-link hover:underline">
                  Change your password
                </Link>
              </div>
            </div>
          </div>

          {!installed && (
            <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-ink">Install this dashboard as an app</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isIOS
                      ? 'In Safari, tap the Share icon, then "Add to Home Screen".'
                      : canPrompt
                        ? 'One tap from your home screen or desktop — no browser tabs, no address bar.'
                        : 'Look for an install icon in your browser\'s address bar, or check its menu for "Install app".'}
                  </p>
                </div>
              </div>
              {canPrompt && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" /> Install app
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
