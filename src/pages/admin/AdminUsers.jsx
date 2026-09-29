import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Users, Shield, Zap, GraduationCap, Search, RefreshCw, Download,
  CheckCircle2, XCircle, Crown, AlertCircle, Loader2, Mail, ChevronDown, Sparkles,
  Filter, ArrowUpDown, Hammer, Rocket, Code2, Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import { getAgentById } from '../../data/agents';
import { getDifficulty } from '../../data/departments';

function StatCard({ icon: Icon, label, value, color, tint }) {
  const { theme } = useTheme();
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: theme === 'dark' ? '#181818' : tint }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#0A090F]">
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="font-display text-2xl font-extrabold text-ink">{value}</p>
        <p className="text-xs text-body">{label}</p>
      </div>
    </div>
  );
}

function isActive(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt) > new Date();
}

// "Pro" in this admin view means access to either Builder track — distinct
// from Admin, which means account-management privileges. A user can be
// both, or neither (yet to purchase anything). Checks both the legacy
// 6-month entitlement (grandfathered pre-2026-09-22 subscribers) and a
// permanent guide_purchases bundle (every purchase since) — either one
// counts as "has" a tier, same rule usePro.js applies for the site itself.
function hasBuilder1(u) {
  return isActive(u.builder1_expires_at) || Boolean(u.has_builder1_guides);
}
function hasBuilder2(u) {
  return isActive(u.builder2_expires_at) || Boolean(u.has_builder2_guides);
}
function planLabel(u) {
  const b1 = hasBuilder1(u);
  const b2 = hasBuilder2(u);
  if (b1 && b2) return 'Pro (Builder 1 + 2)';
  if (b1) return 'Builder 1';
  if (b2) return 'Builder 2';
  return 'None';
}

// Same priority order as PlanBadge (admin badge wins even if the person
// also holds an active plan) so the filter dropdown matches what's shown.
function planCategory(u) {
  if (u.is_admin) return 'admin';
  const b1 = hasBuilder1(u);
  const b2 = hasBuilder2(u);
  if (b1 && b2) return 'pro';
  if (b1) return 'builder1';
  if (b2) return 'builder2';
  return 'none';
}

const PLAN_FILTERS = [
  { value: 'all', label: 'All plans' },
  { value: 'pro', label: 'Pro (Builder 1 + 2)' },
  { value: 'builder1', label: 'Builder 1' },
  { value: 'builder2', label: 'Builder 2' },
  { value: 'admin', label: 'Admin' },
  { value: 'none', label: 'None' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'xp', label: 'Most XP' },
];

function toCsvValue(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadUsersCsv(rows) {
  const headers = [
    'Name', 'Email', 'Admin', 'Plan', 'BYU Student', 'XP',
    'Completed Sessions', 'Builder 1 Expires', 'Builder 2 Expires', 'Joined',
  ];
  const lines = [headers.join(',')];
  for (const u of rows) {
    lines.push([
      toCsvValue(u.display_name || ''),
      toCsvValue(u.email || ''),
      toCsvValue(u.is_admin ? 'Yes' : 'No'),
      toCsvValue(u.is_admin ? '—' : planLabel(u)),
      toCsvValue(u.is_byu_student ? 'Yes' : 'No'),
      toCsvValue(u.xp ?? 0),
      toCsvValue((u.completed || []).length),
      toCsvValue(u.builder1_expires_at ? new Date(u.builder1_expires_at).toISOString() : ''),
      toCsvValue(u.builder2_expires_at ? new Date(u.builder2_expires_at).toISOString() : ''),
      toCsvValue(new Date(u.created_at).toISOString()),
    ].join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `social-dev-technologies-students-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function PlanBadge({ user }) {
  if (user.is_admin) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#FEF9E7] dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber/30 px-2 py-0.5 rounded-full">
      <Crown className="w-3 h-3" /> Admin
    </span>
  );
  const b1 = hasBuilder1(user);
  const b2 = hasBuilder2(user);
  if (b1 && b2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EBFF] dark:bg-brand/15 text-brand border border-brand/30 px-2 py-0.5 rounded-full">
      <Zap className="w-3 h-3" /> Pro
    </span>
  );
  if (b1) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/20 px-2 py-0.5 rounded-full">
      Builder 1
    </span>
  );
  if (b2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EBFF] dark:bg-brand/15 text-brand border border-brand/20 px-2 py-0.5 rounded-full">
      Builder 2
    </span>
  );
  return (
    <span className="text-xs font-medium text-gray-400 border border-border-soft px-2 py-0.5 rounded-full">None</span>
  );
}

function UserRow({
  u, index, expanded, onToggleExpand, actionLoading,
  onToggleBuilder1, onToggleBuilder2, onTogglePro, onToggleAdmin, onToggleVibeCoding, onToggleAiMastery, currentUserId,
}) {
  const hasB1 = isActive(u.builder1_expires_at);
  const hasB2 = isActive(u.builder2_expires_at);
  const hasVibeCoding = isActive(u.vibecoding_expires_at);
  const hasAiMastery = isActive(u.aimastery_expires_at);
  const userIsPro = hasB1 && hasB2;
  return (
    <>
      <m.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.02 }}
        className="hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors"
      >
        {/* User */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: `hsl(${(u.email?.charCodeAt(0) || 0) * 37 % 360}, 55%, 50%)` }}
            >
              {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink truncate max-w-[160px]">
                {u.display_name || '—'}
              </p>
              <p className="text-xs text-body flex items-center gap-1 truncate max-w-[160px]">
                <Mail className="w-3 h-3 flex-shrink-0" />
                {u.email}
              </p>
            </div>
          </div>
        </td>

        {/* Plan — Vibe Coding and AI Agent Mastery are separate products,
            shown alongside rather than folded into PlanBadge's
            builder1/builder2/pro chain, since a user can hold any
            combination of an automation plan, Vibe Coding, and Mastery at
            once. */}
        <td className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <PlanBadge user={u} />
            {hasVibeCoding && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/20 px-2 py-0.5 rounded-full">
                Vibe Coding
              </span>
            )}
            {hasAiMastery && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/20 px-2 py-0.5 rounded-full">
                AI Agent Mastery
              </span>
            )}
          </div>
        </td>

        {/* Progress */}
        <td className="px-5 py-4">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-xs font-semibold text-body-strong hover:text-brand transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {(u.xp ?? 0).toLocaleString()} XP · {(u.completed || []).length} done
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </td>

        {/* BYU */}
        <td className="px-5 py-4 hidden sm:table-cell">
          {u.is_byu_student ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/20 px-2 py-0.5 rounded-full">
              <GraduationCap className="w-3 h-3" /> BYU
            </span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>

        {/* Joined */}
        <td className="px-5 py-4 hidden md:table-cell text-body text-xs">
          {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>

        {/* Actions */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Builder 1 */}
            <button
              onClick={() => onToggleBuilder1(u.id, hasB1)}
              disabled={!!actionLoading || u.is_admin}
              title={hasB1 ? 'Revoke Builder 1' : 'Grant Builder 1'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                hasB1
                  ? 'bg-[#EAFAF1] dark:bg-green/10 text-green hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#EAFAF1] dark:hover:bg-green/10 hover:text-green'
              }`}
            >
              {actionLoading === u.id + '_b1' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Hammer className="w-3 h-3" />
              )}
              B1
            </button>

            {/* Toggle Builder 2 */}
            <button
              onClick={() => onToggleBuilder2(u.id, hasB2)}
              disabled={!!actionLoading || u.is_admin}
              title={hasB2 ? 'Revoke Builder 2' : 'Grant Builder 2'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                hasB2
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand'
              }`}
            >
              {actionLoading === u.id + '_b2' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Rocket className="w-3 h-3" />
              )}
              B2
            </button>

            {/* Toggle Pro (grants/revokes both Builder 1 + 2) */}
            <button
              onClick={() => onTogglePro(u.id, userIsPro)}
              disabled={!!actionLoading || u.is_admin}
              title={userIsPro ? 'Revoke Pro' : 'Grant Pro'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                userIsPro
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand'
              }`}
            >
              {actionLoading === u.id + '_pro' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : userIsPro ? (
                <>
                  <XCircle className="w-3 h-3" /> Pro
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Pro
                </>
              )}
            </button>

            {/* Toggle Vibe Coding — separate product from builder1/builder2/Pro */}
            <button
              onClick={() => onToggleVibeCoding(u.id, hasVibeCoding)}
              disabled={!!actionLoading || u.is_admin}
              title={hasVibeCoding ? 'Revoke Vibe Coding' : 'Grant Vibe Coding'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                hasVibeCoding
                  ? 'bg-[#EAFAF1] dark:bg-green/10 text-green hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#EAFAF1] dark:hover:bg-green/10 hover:text-green'
              }`}
            >
              {actionLoading === u.id + '_vibecoding' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Code2 className="w-3 h-3" />
              )}
              Vibe Coding
            </button>

            {/* Toggle AI Agent Mastery — separate product, same pattern as Vibe Coding */}
            <button
              onClick={() => onToggleAiMastery(u.id, hasAiMastery)}
              disabled={!!actionLoading || u.is_admin}
              title={hasAiMastery ? 'Revoke AI Agent Mastery' : 'Grant AI Agent Mastery'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                hasAiMastery
                  ? 'bg-[#EAFAF1] dark:bg-green/10 text-green hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#EAFAF1] dark:hover:bg-green/10 hover:text-green'
              }`}
            >
              {actionLoading === u.id + '_aimastery' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Bot className="w-3 h-3" />
              )}
              AI Agent Mastery
            </button>

            {/* Toggle Admin */}
            <button
              onClick={() => onToggleAdmin(u.id, u.is_admin)}
              disabled={!!actionLoading || u.id === currentUserId}
              title={u.is_admin ? 'Revoke Admin' : 'Make Admin'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                u.is_admin
                  ? 'bg-[#FEF9E7] dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#FEF9E7] dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400'
              }`}
            >
              {actionLoading === u.id + '_admin' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : u.is_admin ? (
                <>
                  <Crown className="w-3 h-3" /> Admin
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3" /> Admin
                </>
              )}
            </button>
          </div>
        </td>
      </m.tr>
      {expanded && (
        <tr className="bg-[#FAF8FF] dark:bg-white/5">
          <td colSpan={6} className="px-5 py-4">
            {(u.completed || []).length === 0 ? (
              <p className="text-xs text-gray-400">No completed sessions yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(u.completed || []).map((agentId) => {
                  const completedAgent = getAgentById(agentId);
                  if (!completedAgent) return null;
                  const diff = getDifficulty(completedAgent.difficulty);
                  return (
                    <span
                      key={agentId}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-[#181818] border border-border-soft rounded-full px-3 py-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: diff.color }}
                      />
                      {completedAgent.emoji} {completedAgent.title}
                    </span>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { showToast } = useOutletContext();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('admin_get_all_profiles');
      if (err) throw err;
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const togglePro = async (targetId, currentPro) => {
    setActionLoading(targetId + '_pro');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_pro', {
        target_user_id: targetId,
        set_pro: !currentPro,
      });
      if (err) throw err;
      const expiry = !currentPro ? new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, builder1_expires_at: expiry, builder2_expires_at: expiry } : u
      ));
      showToast(!currentPro ? 'Pro access granted (Builder 1 + 2, 6 months).' : 'Pro access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBuilder1 = async (targetId, currentActive) => {
    setActionLoading(targetId + '_b1');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_builder1', {
        target_user_id: targetId,
        set_active: !currentActive,
      });
      if (err) throw err;
      const expiry = !currentActive ? new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, builder1_expires_at: expiry } : u
      ));
      showToast(!currentActive ? 'Builder 1 access granted (6 months).' : 'Builder 1 access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBuilder2 = async (targetId, currentActive) => {
    setActionLoading(targetId + '_b2');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_builder2', {
        target_user_id: targetId,
        set_active: !currentActive,
      });
      if (err) throw err;
      const expiry = !currentActive ? new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, builder2_expires_at: expiry } : u
      ));
      showToast(!currentActive ? 'Builder 2 access granted (6 months).' : 'Builder 2 access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVibeCoding = async (targetId, currentActive) => {
    setActionLoading(targetId + '_vibecoding');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_vibecoding', {
        target_user_id: targetId,
        set_active: !currentActive,
      });
      if (err) throw err;
      const expiry = !currentActive ? new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, vibecoding_expires_at: expiry } : u
      ));
      showToast(!currentActive ? 'Vibe Coding access granted (6 months).' : 'Vibe Coding access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAiMastery = async (targetId, currentActive) => {
    setActionLoading(targetId + '_aimastery');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_aimastery', {
        target_user_id: targetId,
        set_active: !currentActive,
      });
      if (err) throw err;
      const expiry = !currentActive ? new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, aimastery_expires_at: expiry } : u
      ));
      showToast(!currentActive ? 'AI Agent Mastery access granted (6 months).' : 'AI Agent Mastery access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdmin = async (targetId, currentAdmin) => {
    setActionLoading(targetId + '_admin');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_admin', {
        target_user_id: targetId,
        set_admin: !currentAdmin,
      });
      if (err) throw err;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, is_admin: !currentAdmin } : u
      ));
      showToast(!currentAdmin ? 'Admin access granted.' : 'Admin access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        (u.email || '').toLowerCase().includes(q) ||
        (u.display_name || '').toLowerCase().includes(q)
      );
    })
    .filter((u) => planFilter === 'all' || planCategory(u) === planFilter)
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name') return (a.display_name || a.email || '').localeCompare(b.display_name || b.email || '');
      if (sortBy === 'xp') return (b.xp ?? 0) - (a.xp ?? 0);
      return new Date(b.created_at) - new Date(a.created_at); // newest
    });

  const [now] = useState(() => Date.now());
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.is_admin).length,
    pro: users.filter((u) => !u.is_admin && (isActive(u.builder1_expires_at) || isActive(u.builder2_expires_at))).length,
    thisWeek: users.filter((u) => {
      const d = new Date(u.created_at);
      return now - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
            <Shield className="w-7 h-7 text-brand" />
            Users
          </h1>
          <p className="text-body mt-1">Manage all users, plans, and access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadUsersCsv(filtered)}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#181818] border border-border-soft text-body-strong hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#181818] border border-border-soft text-body-strong hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.total} color="#7C3AED" tint="#F3EBFF" />
        <StatCard icon={Crown} label="Admins" value={stats.admins} color="#D9A406" tint="#FEF9E7" />
        <StatCard icon={Zap} label="Pro (Builder 1 or 2)" value={stats.pro} color="#16A34A" tint="#EAFAF1" />
        <StatCard icon={Users} label="Joined This Week" value={stats.thisWeek} color="#E11D48" tint="#FDEEF4" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search + filter + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#181818] border border-border text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none pl-10 pr-8 py-3 rounded-xl bg-white dark:bg-[#181818] border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            {PLAN_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-10 pr-8 py-3 rounded-xl bg-white dark:bg-[#181818] border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAF8FF] dark:bg-white/5 border-b border-border-soft">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Plan</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Progress</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden sm:table-cell">BYU</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    index={i}
                    expanded={expandedId === u.id}
                    onToggleExpand={() => setExpandedId((id) => (id === u.id ? null : u.id))}
                    actionLoading={actionLoading}
                    onToggleBuilder1={toggleBuilder1}
                    onToggleBuilder2={toggleBuilder2}
                    onTogglePro={togglePro}
                    onToggleVibeCoding={toggleVibeCoding}
                    onToggleAiMastery={toggleAiMastery}
                    onToggleAdmin={toggleAdmin}
                    currentUserId={user?.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        {filtered.length} of {users.length} users shown
      </p>
    </div>
  );
}
