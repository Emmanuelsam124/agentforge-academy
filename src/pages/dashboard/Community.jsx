import { useMemo, useRef, useState, useEffect } from 'react';
import { MessagesSquare, Send, Loader2, Trash2, CornerUpLeft, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useCommunityChannels, useCommunityMessages } from '../../hooks/useCommunity';

const MENTION_TOKEN = /@[a-z0-9_]+/gi;

// Splits a message body on @handle tokens for rendering — this is purely
// visual (any @word is highlighted, whether or not it resolves to a real
// member); `mentioned_user_ids` on the row is the resolved list, kept for
// future notification use.
function renderBody(body) {
  const parts = body.split(new RegExp(`(${MENTION_TOKEN.source})`, 'gi'));
  return parts.map((part, i) =>
    /^@[a-z0-9_]+$/i.test(part)
      ? <span key={i} className="font-bold text-brand">{part}</span>
      : <span key={i}>{part}</span>,
  );
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Avatar({ name }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[12px] flex-shrink-0">
      {initial}
    </div>
  );
}

// One room's message list + composer. Mounted with key={channelId} by the
// parent, so switching rooms is a clean remount — all local input state
// (draft text, reply target, mention dropdown) resets for free, no effect
// needed to sync it to the channel-switch.
function ChannelRoom({ channel, currentUserId, isAdmin }) {
  const {
    messages, members, memberByUserId, loading, error, sendMessage, deleteMessage,
  } = useCommunityMessages(channel.id);

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const listEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const handleBodyChange = (e) => {
    const value = e.target.value;
    setBody(value);
    const cursor = e.target.selectionStart;
    const uptoCursor = value.slice(0, cursor);
    const match = uptoCursor.match(/@([a-z0-9_]*)$/i);
    if (match) {
      const fragment = match[1].toLowerCase();
      setMentionSuggestions(
        members.filter((m) => m.handle.startsWith(fragment) || m.display_name.toLowerCase().startsWith(fragment)).slice(0, 6),
      );
    } else {
      setMentionSuggestions([]);
    }
  };

  const applyMention = (member) => {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const uptoCursor = body.slice(0, cursor);
    const replaced = uptoCursor.replace(/@([a-z0-9_]*)$/i, `@${member.handle} `);
    const next = replaced + body.slice(cursor);
    setBody(next);
    setMentionSuggestions([]);
    textareaRef.current?.focus();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    const tokens = (trimmed.match(MENTION_TOKEN) || []).map((t) => t.slice(1).toLowerCase());
    const mentionedUserIds = members
      .filter((m) => tokens.includes(m.handle.toLowerCase()))
      .map((m) => m.user_id);

    setSending(true);
    const { error: sendErr } = await sendMessage({
      userId: currentUserId,
      body: trimmed,
      replyToId: replyTo?.id,
      mentionedUserIds,
    });
    setSending(false);
    if (!sendErr) {
      setBody('');
      setReplyTo(null);
      setMentionSuggestions([]);
    }
  };

  return (
    <div className="bg-white dark:bg-[#181818] border border-border-soft rounded-2xl flex flex-col h-[65vh] min-h-[420px]">
      {channel.description && (
        <p className="text-[12px] text-gray-400 px-5 pt-4 pb-1 border-b border-border-soft">
          {channel.description}
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600 text-center py-6">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-body text-center py-6">
            Nobody's said anything yet — be the first.
          </p>
        ) : (
          messages.map((m) => {
            const author = memberByUserId(m.user_id);
            const parent = m.reply_to_id ? messageById.get(m.reply_to_id) : null;
            const parentAuthor = parent ? memberByUserId(parent.user_id) : null;
            const canDelete = m.user_id === currentUserId || isAdmin;
            return (
              <div key={m.id} className="flex items-start gap-2.5">
                <Avatar name={author?.display_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-ink text-[13px]">{author?.display_name || 'Former student'}</span>
                    <span className="text-[11px] text-gray-400">{timeAgo(m.created_at)}</span>
                  </div>
                  {parent && (
                    <div className="text-[12px] text-gray-400 border-l-2 border-border-soft pl-2 mt-1 mb-1 truncate">
                      Replying to <span className="font-semibold">{parentAuthor?.display_name || 'a message'}</span>: {parent.body}
                    </div>
                  )}
                  <p className="text-[13.5px] text-body-strong leading-relaxed break-words whitespace-pre-wrap">
                    {renderBody(m.body)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => { setReplyTo(m); textareaRef.current?.focus(); }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-brand"
                    >
                      <CornerUpLeft className="w-3 h-3" /> Reply
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteMessage(m.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-border-soft p-3 relative">
        {replyTo && (
          <div className="flex items-center justify-between gap-2 bg-[#FAF8FF] dark:bg-white/5 rounded-lg px-3 py-1.5 mb-2 text-[12px] text-body">
            <span className="truncate">
              Replying to <span className="font-semibold">{memberByUserId(replyTo.user_id)?.display_name || 'a message'}</span>
            </span>
            <button type="button" onClick={() => setReplyTo(null)} className="flex-shrink-0 text-gray-400 hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-3 mb-1 bg-white dark:bg-[#181818] border border-border-soft rounded-xl shadow-lg overflow-hidden w-56 z-10">
            {mentionSuggestions.map((m) => (
              <button
                key={m.user_id}
                type="button"
                onClick={() => applyMention(m)}
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#FAF8FF] dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Avatar name={m.display_name} />
                <span className="truncate">
                  <span className="font-semibold text-ink">{m.display_name}</span>
                  <span className="text-gray-400"> @{m.handle}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Message the class… use @ to mention someone"
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 px-3.5 py-2.5 text-[13.5px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand hover:bg-brand-deep disabled:opacity-40 text-white flex items-center justify-center transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Community() {
  const { user } = useAuth();
  const { isAdmin } = usePro();
  const { channels, loading: channelsLoading } = useCommunityChannels();
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const activeChannelId = selectedChannelId ?? channels[0]?.id ?? null;
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  if (channelsLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="bg-white dark:bg-[#181818] border border-border-soft rounded-2xl p-6 sm:p-8 text-center">
        <MessagesSquare className="w-8 h-8 text-brand mx-auto mb-3" />
        <h1 className="font-display text-xl font-extrabold text-ink mb-1.5">Community</h1>
        <p className="text-body max-w-sm mx-auto">
          Enroll in any class to unlock its community room, plus the general room for everyone.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink flex items-center gap-2.5">
          <MessagesSquare className="w-6 h-6 text-brand" /> Community
        </h1>
        <p className="text-body mt-1.5">Text and emoji only — say hi, ask questions, help each other out.</p>
      </div>

      {/* Channel tabs — horizontal scroll on mobile, wraps on wider screens */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedChannelId(c.id)}
            className={`flex-shrink-0 text-[13px] font-bold px-3.5 py-2 rounded-full border-[1.5px] transition-colors ${
              c.id === activeChannelId
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-[#181818] text-body-strong border-border-soft hover:border-brand'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeChannel && (
        <ChannelRoom key={activeChannel.id} channel={activeChannel} currentUserId={user.id} isAdmin={isAdmin} />
      )}
    </div>
  );
}
