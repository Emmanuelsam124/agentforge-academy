import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Which rooms the current user can see — the RPC is the one source of
// truth (RLS-backed via has_community_membership), not a client-side
// re-derivation of "who owns what" that could drift from it.
export function useCommunityChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;
    supabase.rpc('my_community_channels').then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) setChannels(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { channels, loading };
}

const PAGE_SIZE = 50;

// Messages for one room, kept live via Realtime — postgres_changes only
// broadcasts rows the subscriber's own SELECT policy would return, so this
// naturally can't leak a room's messages to someone who isn't a member.
// Callers should mount this (via the component using it) keyed on
// channelId, so switching rooms is a clean remount rather than this hook
// juggling resets for a changing argument.
export function useCommunityMessages(channelId) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(isSupabaseConfigured && channelId));
  const [error, setError] = useState('');

  useEffect(() => {
    // channelId is constant for the life of this hook instance — the
    // caller mounts one ChannelRoom per channel keyed on its id, so a
    // channel switch is a remount, not a re-run of this effect. That's
    // also why the initial `loading` state above (not a setState call
    // here) is enough to cover "starting a fetch".
    if (!isSupabaseConfigured || !channelId) return undefined;
    let cancelled = false;

    // Fire-and-forget: opening a room counts as having seen everything in
    // it up to now. Failure here just means the unread badge stays lit a
    // little longer, not a broken read — not worth surfacing to the user.
    supabase.rpc('community_mark_channel_read', { p_channel_id: channelId });

    Promise.all([
      supabase
        .from('community_messages')
        .select('id, channel_id, user_id, body, reply_to_id, created_at')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
      supabase.rpc('community_channel_members', { p_channel_id: channelId }),
    ]).then(([{ data: msgData, error: msgErr }, { data: memberData, error: memberErr }]) => {
      if (cancelled) return;
      if (msgErr) {
        setError('Could not load messages — try refreshing.');
      } else {
        setMessages((msgData || []).slice().reverse());
      }
      if (!memberErr) setMembers(memberData || []);
      setLoading(false);
    });

    const realtimeChannel = supabase
      .channel(`community-messages-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `channel_id=eq.${channelId}` },
        ({ new: row }) => {
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          // The room is open on screen right now, so a message landing in
          // it counts as seen too — keeps the nav badge from lighting up
          // for a room the user is actively looking at.
          supabase.rpc('community_mark_channel_read', { p_channel_id: channelId });
        },
      )
      // No channel_id filter here: Supabase can't filter DELETE events, and with
      // RLS on the old row carries only its id, so a filtered DELETE subscription
      // never fires at all. Ids from other rooms just don't match anything.
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_messages' },
        ({ old: row }) => {
          setMessages((prev) => prev.filter((m) => m.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(realtimeChannel);
    };
  }, [channelId]);

  const memberByUserId = useCallback(
    (userId) => members.find((m) => m.user_id === userId),
    [members],
  );

  const sendMessage = useCallback(
    async ({ userId, body, replyToId, mentionedUserIds }) => supabase.from('community_messages').insert({
      channel_id: channelId,
      user_id: userId,
      body,
      reply_to_id: replyToId ?? null,
      mentioned_user_ids: mentionedUserIds ?? [],
    }),
    [channelId],
  );

  // Removes the message locally once the server confirms, rather than waiting
  // for the Realtime echo. `.select()` matters: a delete that RLS refuses still
  // answers 204 with no error, so "a row came back" is the only real success.
  const deleteMessage = useCallback(async (id) => {
    const { data, error: deleteErr } = await supabase
      .from('community_messages')
      .delete()
      .eq('id', id)
      .select('id');
    if (deleteErr || !data?.length) return { error: deleteErr ?? new Error('Message was not deleted') };
    setMessages((prev) => prev.filter((m) => m.id !== id));
    return { error: null };
  }, []);

  return { messages, members, memberByUserId, loading, error, sendMessage, deleteMessage };
}

// A real "you have new messages" signal for the nav — not a decorative
// badge (see DashboardTopBar.jsx's own note on why this dashboard doesn't
// ship fake notification UI). Recomputes on any new message anywhere (RLS
// still limits what postgres_changes actually delivers to this client) and
// on any change to this user's own read-state, so marking a room read from
// the Community page clears this badge immediately without needing a
// shared React context between it and the sidebar/mobile nav.
export function useCommunityUnread() {
  const [hasUnread, setHasUnread] = useState(false);

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured) return;
    supabase.rpc('community_has_unread').then(({ data, error }) => {
      if (!error) setHasUnread(Boolean(data));
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    refresh();

    const realtimeChannel = supabase
      .channel(`community-unread-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_reads' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [refresh]);

  return hasUnread;
}
