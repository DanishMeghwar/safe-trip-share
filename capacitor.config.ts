import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safetripshare.app',
  appName: 'SafeTripShare',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
    },
    Geolocation: {
      enabled: true,
    },
  },
  server: {
    androidScheme: 'https',
  },
  android: {
    path: 'android',
    allowMixedContent: true,
  },
};

export default config;