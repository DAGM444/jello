export const base44 = {
  auth: {
    me: async () => ({ id: '1', email: 'user@example.com' }),
    login: async () => ({}),
    logout: async () => ({}),
    register: async () => ({}),
    resetPassword: async () => ({}),
  },
  app: {
    getPublicSettings: async () => ({ id: 'app', public_settings: {} }),
  },
};

export default base44;
