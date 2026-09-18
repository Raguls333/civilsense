import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const OfflineSyncContext = createContext(null);

export const OfflineSyncProvider = ({ children }) => {
  const { token } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [attendanceQueue, setAttendanceQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('civilsense_offline_attendance');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dprQueue, setDprQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('civilsense_offline_dpr');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Update localStorage when queues change
  useEffect(() => {
    localStorage.setItem('civilsense_offline_attendance', JSON.stringify(attendanceQueue));
  }, [attendanceQueue]);

  useEffect(() => {
    localStorage.setItem('civilsense_offline_dpr', JSON.stringify(dprQueue));
  }, [dprQueue]);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto flush queue when reconnected
      syncAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attendanceQueue, dprQueue, token]);

  // Queue an attendance entry locally
  const queueAttendance = (entry) => {
    const queuedItem = {
      ...entry,
      queuedId: 'q_att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      queuedAt: new Date().toISOString(),
      syncedOffline: true
    };
    setAttendanceQueue(prev => [queuedItem, ...prev]);
    return queuedItem;
  };

  // Queue a DPR locally
  const queueDPR = (entry) => {
    const queuedItem = {
      ...entry,
      queuedId: 'q_dpr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      queuedAt: new Date().toISOString(),
      syncedOffline: true
    };
    setDprQueue(prev => [queuedItem, ...prev]);
    return queuedItem;
  };

  // Synchronize all queues with server
  const syncAll = async () => {
    if (!navigator.onLine || !token || isSyncing) return;
    if (attendanceQueue.length === 0 && dprQueue.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;

    try {
      // 1. Sync attendances
      if (attendanceQueue.length > 0) {
        const res = await fetch('/api/attendance/sync-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: attendanceQueue })
        });

        if (res.ok) {
          const data = await res.json();
          successCount += data.syncedCount || attendanceQueue.length;
          setAttendanceQueue([]);
        }
      }

      // 2. Sync DPRs
      if (dprQueue.length > 0) {
        const res = await fetch('/api/dpr/sync-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: dprQueue })
        });

        if (res.ok) {
          const data = await res.json();
          successCount += data.syncedCount || dprQueue.length;
          setDprQueue([]);
        }
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error during offline sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = attendanceQueue.length + dprQueue.length;

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        setIsOnline,
        isSyncing,
        pendingCount,
        attendanceQueue,
        dprQueue,
        queueAttendance,
        queueDPR,
        syncAll,
        lastSyncTime
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => useContext(OfflineSyncContext);
