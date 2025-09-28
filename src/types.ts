export interface User {
  email: string;
  name: string;
  avatar?: string;
  botName: string;
}

export type AppState = 'login' | 'chat' | 'history' | 'settings';
