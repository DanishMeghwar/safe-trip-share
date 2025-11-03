# ShareRide Android App - Deployment Guide

## Real-Time Features Implemented ✅

### 1. Real-Time Database Sync
- ✅ All rides, bookings, and profiles update in real-time
- ✅ Automatic UI refresh when data changes
- ✅ Supabase real-time subscriptions enabled

### 2. Live Location Tracking
- ✅ GPS location tracking for active rides
- ✅ Real-time location sharing between drivers and passengers
- ✅ Background location updates
- ✅ Location accuracy and speed tracking

### 3. Push Notifications
- ✅ FCM integration ready (Firebase Cloud Messaging)
- ✅ Push token registration and management
- ✅ Notification preferences system
- ✅ Real-time notification triggers

### 4. Network Status & Offline Support
- ✅ Real-time network connectivity detection
- ✅ Offline indicator UI
- ✅ Automatic retry logic for failed requests
- ✅ Query caching for better performance

### 5. Security Enhancements
- ✅ Input validation on all forms (Zod schemas)
- ✅ Proper RLS policies for data protection
- ✅ Secure location sharing (only for active ride participants)
- ✅ Token-based authentication

## Prerequisites for Android Deployment

1. **Development Machine:**
   - macOS, Windows, or Linux
   - Node.js 18+ installed
   - Git installed

2. **Android Development:**
   - Android Studio installed
   - Android SDK (API 33+)
   - Java Development Kit (JDK 17)

3. **Lovable Project:**
   - Git repository access (export via "Export to Github")

## Local Development Setup

### Step 1: Clone Your Repository
```bash
git clone <your-github-repo-url>
cd safe-trip-share
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the Web App
```bash
npm run build
```

### Step 4: Add Android Platform
```bash
npx cap add android
```

### Step 5: Sync Capacitor
```bash
npx cap sync android
```

### Step 6: Open in Android Studio
```bash
npx cap open android
```

### Step 7: Configure Android Permissions
The `AndroidManifest.xml` is already configured with required permissions:
- Internet access
- Network state monitoring
- Fine & coarse location
- Background location
- Push notifications

### Step 8: Run on Device/Emulator
In Android Studio:
1. Connect an Android device or start an emulator
2. Click the "Run" button (green play icon)
3. Select your device
4. Wait for build and installation

Or via command line:
```bash
npx cap run android
```

## GitHub Actions CI/CD (Automated Build)

The app is configured to build automatically via GitHub Actions.

### How It Works:
1. Every push to `main` branch triggers a build
2. APK is generated automatically
3. Download artifact from Actions tab
4. APK is located at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Steps to Get APK:
1. Push code to GitHub
2. Go to "Actions" tab in your repository
3. Click on the latest workflow run
4. Download the "ShareRide-APK" artifact
5. Extract the ZIP to get your APK

## Production Build (Release APK)

For production deployment, you need a signed APK:

### Step 1: Generate Keystore
```bash
keytool -genkey -v -keystore shareride-release.keystore -alias shareride -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure Signing in Android Studio
1. Open `android/app/build.gradle`
2. Add signing configuration:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('shareride-release.keystore')
            storePassword 'your-password'
            keyAlias 'shareride'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Firebase Cloud Messaging Setup (for Push Notifications)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project or use existing
3. Add Android app with package name: `com.shareride.app`

### Step 2: Download google-services.json
1. Download `google-services.json` from Firebase console
2. Place it in: `android/app/google-services.json`

### Step 3: Add Firebase Dependencies
Already configured in the project. If needed, verify in `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.4.0'
}
```

### Step 4: Rebuild and Sync
```bash
npx cap sync android
```

## Testing Real-Time Features

### Test Location Tracking:
1. Create a ride as driver
2. View the ride in "Active Ride" page
3. Click "Start Sharing Location"
4. Location will update in real-time in database

### Test Real-Time Updates:
1. Open app on two devices/emulators
2. Post a ride on device 1
3. Search rides on device 2
4. Ride appears instantly without refresh

### Test Push Notifications:
1. Grant notification permissions when prompted
2. Push token is saved to database automatically
3. Test notifications via Firebase Console

## Troubleshooting

### Location Not Working:
- Ensure GPS is enabled on device
- Grant location permissions in app settings
- Check `AndroidManifest.xml` has location permissions

### Build Fails:
- Clear cache: `cd android && ./gradlew clean`
- Rebuild: `npm run build && npx cap sync android`
- Check Java version: `java -version` (should be 17)

### Push Notifications Not Received:
- Verify `google-services.json` is in place
- Check Firebase console for server key
- Ensure app is in foreground for test notifications

### Real-Time Not Working:
- Check internet connection
- Verify Supabase connection (check .env file)
- Open browser console for real-time errors

## Performance Optimization

### Already Implemented:
- ✅ Query caching (5 minute stale time)
- ✅ Automatic retry with exponential backoff
- ✅ Real-time subscriptions (no polling)
- ✅ Efficient database queries with indexes

### Recommended:
- Enable ProGuard for release builds (code obfuscation & minification)
- Use APK splits for smaller downloads
- Implement image optimization for profiles

## App Store Deployment

### Google Play Store:
1. Create Google Play Developer account ($25 one-time)
2. Generate signed release APK (see above)
3. Create app listing in Play Console
4. Upload APK/AAB (Android App Bundle recommended)
5. Complete store listing (screenshots, description, etc.)
6. Submit for review

### Alternative Distribution:
- Direct APK download (for testing)
- Firebase App Distribution (beta testing)
- Samsung Galaxy Store
- Amazon Appstore

## Security Checklist

- ✅ All API calls use HTTPS
- ✅ Authentication tokens stored securely
- ✅ Input validation on all forms
- ✅ RLS policies protect database
- ✅ Location data only shared in active rides
- ✅ Push tokens encrypted in transit

## Support & Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Android Developer:** https://developer.android.com
- **Lovable Docs:** https://docs.lovable.dev

## License

Ensure you comply with all third-party licenses:
- Capacitor (MIT)
- Supabase (Apache 2.0)
- React (MIT)
- All dependencies listed in package.json

---

**Your ShareRide app is now production-ready with full real-time capabilities! 🚀**
