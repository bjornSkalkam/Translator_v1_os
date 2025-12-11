import { useAuthTheme } from '../context/AuthThemeContext';

/**
 * Hook for making authenticated API requests.
 *
 * This hook supports two authentication modes:
 *
 * 1. **Iframe/Embedded Mode**: When the app is embedded in a parent application
 *    (e.g., Microsoft Teams, SharePoint, or custom portal), the parent sends
 *    a JWT token via postMessage. This token is used as a Bearer token.
 *
 * 2. **Development Mode**: When running locally with `npm run dev`, if no token
 *    is received from a parent window within 1 second, a dev API key is used
 *    instead (configured via VITE_API_KEY in .env).
 *
 * Usage:
 * ```tsx
 * const { fetchWithAuth } = useFetchWithAuth();
 * const response = await fetchWithAuth('/api/v1/sessions/translate', {
 *   method: 'POST',
 *   body: formData
 * });
 * ```
 */
export const useFetchWithAuth = () => {
    const { token } = useAuthTheme();

    const fetchWithAuth = async (input: RequestInfo, init?: RequestInit) => {
        const headers = new Headers(init?.headers || {});

        if (token) {
            if (token.startsWith('api-key:')) {
                // Development mode: use x-api-key header with the configured API key
                headers.set('x-api-key', token.replace('api-key:', ''));
            } else {
                // Iframe/embedded mode: use Bearer token from parent window
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        const modifiedInit: RequestInit = {
            ...init,
            headers,
        };

        return fetch(input, modifiedInit);
    };

    return { fetchWithAuth };
};
