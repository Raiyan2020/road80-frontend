export const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Unified storage utility for authentication tokens.
 * Works seamlessly across Web platforms.
 */
export const authStorage = {
  /**
   * Saves the auth token to all applicable storage layers.
   */
  async setToken(token: string) {
    if (!token) return;

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    } catch (error) {
      // Handle error
    }
  },

  /**
   * Retrieves the auth token from the most reliable available source.
   */
  async getToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },

  /**
   * Clears the auth token from all storage layers.
   */
  async removeToken() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      // Handle error
    }
  }
};
