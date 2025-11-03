import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    if (this.isInitialized) return;

    try {
      // Request permission
      const permissionResult = await PushNotifications.requestPermissions();
      
      if (permissionResult.receive === 'granted') {
        await PushNotifications.register();
        
        // Listen for registration success
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push registration success, token:', token.value);
          await this.savePushToken(token.value);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error:', error);
        });

        // Listen for push notifications
        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Push notification received:', notification);
          }
        );

        // Listen for notification actions
        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('Push notification action performed:', notification);
          }
        );

        this.isInitialized = true;
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const platform = Capacitor.getPlatform();
      
      await supabase.from('push_tokens').upsert(
        {
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,token'
        }
      );
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async removePushToken(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await this.removePushToken();
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
