import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shareride.app',
  appName: 'ShareRide',
  webDir: 'dist',
  server: {
    url: 'https://e30b7a05-8b6b-4f7f-85be-52ee530a3c26.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
