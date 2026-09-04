import { supabase } from './supabase';

// Generate or retrieve persistent unique visitor ID (persists across visits)
const getVisitorId = (): string => {
  try {
    let vid = localStorage.getItem('neonx_vid');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('neonx_vid', vid);
    }
    return vid;
  } catch {
    return 'anonymous_visitor';
  }
};

// Generate or retrieve session ID (per tab session)
const getSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem('neonx_sid');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('neonx_sid', sid);
    }
    return sid;
  } catch {
    return 'anonymous_session';
  }
};

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  if (/tablet|ipad/i.test(ua) || (width >= 640 && width <= 1024)) {
    return 'tablet';
  }
  if (/mobile|iphone|android|touch/i.test(ua) || width < 640) {
    return 'mobile';
  }
  return 'desktop';
};

export const trackEvent = async (eventType: string, meta?: Record<string, any>) => {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const deviceType = getDeviceType();
    const referrer = document.referrer ? new URL(document.referrer).hostname : 'Direct / App';

    // Insert non-blocking into supabase
    await supabase.from('analytics_events').insert([
      {
        visitor_id: visitorId,
        session_id: sessionId,
        event_type: eventType,
        device_type: deviceType,
        referrer: referrer,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        meta: meta || {}
      }
    ]);
  } catch (err) {
    // Fail silently so user gameplay is never disrupted
    console.debug('[Analytics] Event skipped:', err);
  }
};

export const trackPageView = () => {
  trackEvent('page_view');
};

export const trackGameStart = () => {
  trackEvent('game_start');
};

export const trackDoorSelect = (doorNum: number) => {
  trackEvent('door_select', { door: doorNum });
};
