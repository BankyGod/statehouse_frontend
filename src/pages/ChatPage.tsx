import { ErrorNotice } from '../components/ErrorNotice';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagesSquare, Send } from 'lucide-react';
import { chatApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Channel = 'home' | 'state';

export function ChatPage() {
  const { character } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [channel, setChannel] = useState<Channel>('home');
  const [stateId, setStateId] = useState<number | ''>(character?.current_state_id ?? '');
  const [draft, setDraft] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  useEffect(() => {
    if (stateId === '' && character?.current_state_id) {
      setStateId(character.current_state_id);
    }
  }, [character?.current_state_id, stateId]);

  const targetStateId =
    channel === 'home'
      ? (character?.home_state_id ?? null)
      : stateId === ''
        ? null
        : Number(stateId);

  const messagesQ = useQuery({
    queryKey: ['chat', channel, targetStateId],
    queryFn: () =>
      channel === 'home'
        ? chatApi.home({ limit: 80 })
        : chatApi.state(targetStateId!, { limit: 80 }),
    enabled: channel === 'home' || targetStateId != null,
    // Socket.IO pushes new messages; light poll only as backup
    refetchInterval: 45_000,
  });

  const postMut = useMutation({
    mutationFn: (body: string) => {
      if (targetStateId == null) throw new Error('Pick a state channel first.');
      return chatApi.post(targetStateId, body);
    },
    onSuccess: async () => {
      setDraft('');
      await qc.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (err) => toast.pushError(err),
  });

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messagesQ.data]);

  const messages = messagesQ.data ?? [];
  const stateName = (id: number | null | undefined) =>
    id == null
      ? '—'
      : (statesQ.data?.find((s) => s.id === id)?.name ?? `State #${id}`);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (body.length > 500) {
      toast.push('Messages are limited to 500 characters.', 'err');
      return;
    }
    postMut.mutate(body);
  }

  return (
    <div className="chat-page">
      <header className="page-header">
        <h1>
          <MessagesSquare size={26} aria-hidden /> Chat
        </h1>
        <p className="lede">
          State chat rooms. Home is your home-state channel; switch to any state to read or post.
        </p>
      </header>

      <div className="chat-toolbar inline-form">
        <div className="chat-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`btn sm ${channel === 'home' ? 'primary' : 'ghost'}`}
            aria-selected={channel === 'home'}
            onClick={() => setChannel('home')}
          >
            Home ({stateName(character?.home_state_id)})
          </button>
          <button
            type="button"
            role="tab"
            className={`btn sm ${channel === 'state' ? 'primary' : 'ghost'}`}
            aria-selected={channel === 'state'}
            onClick={() => setChannel('state')}
          >
            State room
          </button>
        </div>
        {channel === 'state' && (
          <label>
            State
            <select
              value={stateId}
              onChange={(e) => setStateId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select…</option>
              {statesQ.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <section className="tbox chat-panel">
        <div className="tbox-title">
          {channel === 'home'
            ? `Home · ${stateName(character?.home_state_id)}`
            : targetStateId != null
              ? stateName(targetStateId)
              : 'Choose a state'}
        </div>
        <div className="tbox-body pad-0">
        <div className="chat-feed" ref={feedRef}>
          {messagesQ.isLoading && <p className="muted">Loading messages…</p>}
          {messagesQ.isError && (
            <ErrorNotice error={messagesQ.error} />
          )}
          {!messagesQ.isLoading && !messages.length && (
            <p className="muted">No messages yet. Be the first to speak.</p>
          )}
          {messages.map((m) => {
            const mine = m.character_id === character?.id;
            return (
              <article key={m.id} className={`chat-bubble ${mine ? 'mine' : ''}`}>
                <header>
                  <strong>{m.display_name}</strong>
                  <time dateTime={m.posted_at}>
                    {new Date(m.posted_at).toLocaleString()}
                  </time>
                </header>
                <p>{m.body}</p>
              </article>
            );
          })}
        </div>

        <form className="chat-composer" onSubmit={onSubmit}>
          <input
            type="text"
            maxLength={500}
            placeholder={locked ? 'Actions locked' : 'Write a message…'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={locked || targetStateId == null || postMut.isPending}
          />
          <button
            type="submit"
            className="btn primary"
            disabled={locked || targetStateId == null || !draft.trim() || postMut.isPending}
          >
            <Send size={15} aria-hidden />
            {postMut.isPending ? 'Sending…' : 'Send'}
          </button>
        </form>
        </div>
      </section>
    </div>
  );
}
