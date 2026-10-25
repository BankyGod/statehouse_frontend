import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import type { Character, ChatMessage, NotificationItem } from '../types/api';
import { connectSocket, disconnectSocket } from './socket';

/** Apply socket HUD patches + feed into React Query without remounting the app. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, patchCharacter } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    const s = connectSocket();
    s.auth = { token };
    if (!s.connected) s.connect();

    const onCharacter = (payload: Partial<Character>) => {
      patchCharacter(payload);
    };

    const onNotification = (note: NotificationItem) => {
      qc.setQueryData<NotificationItem[]>(['activities', 'notifications'], (prev) => {
        if (!prev) return [note];
        if (prev.some((n) => n.id === note.id)) return prev;
        return [note, ...prev];
      });
      void qc.invalidateQueries({ queryKey: ['activities'], refetchType: 'none' });
    };

    const onActivity = () => {
      void qc.invalidateQueries({ queryKey: ['activities'], refetchType: 'active' });
    };

    const onChat = (msg: ChatMessage) => {
      // ChatPage keys: ['chat', channel, stateId] — patch any matching state feeds
      qc.setQueriesData<ChatMessage[]>({ queryKey: ['chat'] }, (prev) => {
        if (!Array.isArray(prev)) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Only append if this feed already includes this state (or empty)
        if (prev.length && prev[0]?.state_id !== msg.state_id) return prev;
        return [...prev, msg];
      });
    };

    s.on('character', onCharacter);
    s.on('notification', onNotification);
    s.on('activity', onActivity);
    s.on('chat:message', onChat);

    // Soft HUD refresh after reconnect / idle
    const onConnect = () => {
      s.emit('ping_hud');
    };
    s.on('connect', onConnect);

    return () => {
      s.off('character', onCharacter);
      s.off('notification', onNotification);
      s.off('activity', onActivity);
      s.off('chat:message', onChat);
      s.off('connect', onConnect);
    };
  }, [token, patchCharacter, qc]);

  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);

  return <>{children}</>;
}
