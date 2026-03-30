// ============================================
// CalApp01 — useSocket Hook
// ============================================
// AGENT_INSTRUCTION:
// Hook для подключения к Socket.IO комнате календаря.
// При mount: joinCalendar, подписка на events.
// При unmount: leaveCalendar, отписка.
// Автоматическое переподключение при смене calendarId.

import { useEffect, useRef } from 'react';
import { joinCalendar, leaveCalendar, getCurrentSocket } from '../api/socket';
import { useCalendarStore } from '../store/calendarStore';

export function useSocket(calendarId: number | null) {
  const prevId = useRef<number | null>(null);
  const { subscribeSocket, unsubscribeSocket } = useCalendarStore();

  useEffect(() => {
    if (prevId.current !== null && prevId.current !== calendarId) {
      unsubscribeSocket(prevId.current);
    }

    if (calendarId !== null) {
      subscribeSocket(calendarId);
      prevId.current = calendarId;
    }

    return () => {
      if (calendarId !== null) {
        unsubscribeSocket(calendarId);
      }
    };
  }, [calendarId]);
}
