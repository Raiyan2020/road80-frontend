/**
 * Universal Mobile/Web Bridge for Next.js Server Actions & APIs
 *
 * This function detects if the app is currently running as a static export (Next.js config + Capacitor)
 * or dynamically on the server.
 */

import { getLang } from '@/i18n';

// In Vite, we check VITE_IS_MOBILE.
const IS_MOBILE = import.meta.env.VITE_IS_MOBILE === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeAction<T>(key: string, data?: any): Promise<T> {
  if (IS_MOBILE) {
    // We are on a purely static frontend (Capacitor/Mobile). Communicate over network.
    const API_URL = import.meta.env.VITE_API_URL || 'https://portal.road-80.com/api';

    // Retrieve auth token for protected actions
    const { authStorage } = await import('@/shared/utils/auth-storage');
    const token = await authStorage.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Raw fetch — bypasses lib/api-client, so set the language here too.
      'Accept-Language': getLang(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/mobile/${key}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`Mobile Bridge API Error (${res.status}): ${errorData}`);
    }

    return res.json() as Promise<T>;
  } else {
    // We are running within Next.js Node Environment (Web/VPS). Call directly!
    // Dynamically import registry only on server so client bundle stays entirely clean of server logic
    if (typeof window !== 'undefined') {
        // Technically, if this runs directly on a client component (web), we should probably 
        // fall back to a normal fetch or NEXT.js server action natively.
        // Wait, standard Next.js Server Actions don't need this bridge (Next.js creates a tunnel automatically).
        // Since the user asked to move core business logic into env-agnostic TS functions,
        // we can actually fetch from standard Next.js API route or just run it via use server.
        // But for this bridge, we assume executeAction is called in SERVER COMPONENTS.
    }
    const { actionRegistry } = await import('@/lib/services/registry');
    
    if (!actionRegistry[key]) {
      throw new Error(`Action [${key}] is not registered in the Action Registry.`);
    }

    return actionRegistry[key](data) as Promise<T>;
  }
}
