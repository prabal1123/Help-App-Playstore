export default ({ config }) => ({
  ...config,
  name: "help-app",
  slug: "help-app",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "helpapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yugamai.helpapp",
    infoPlist: {
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Allow Help App to access your location even when closed for emergency tracking.",
      NSLocationWhenInUseUsageDescription:
        "Allow Help App to access your location for navigation and emergency features.",
      NSMicrophoneUsageDescription:
        "Allow Help App to use your microphone for voice features.",
      NSPhotoLibraryUsageDescription:
        "Allow Help App to access your photos to scan QR codes.",
      NSPhotoLibraryAddUsageDescription:
        "Allow Help App to save QR codes to your gallery.",
      NSCameraUsageDescription:
        "Allow Help App to use your camera to scan QR codes.",
    },
  },
  android: {
      versionCode: 2,
    googleServicesFile: "./google-services.json", 
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.yugamai.helpapp",
    usesCleartextTraffic: false,
    permissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.RECORD_AUDIO",
    ],
    intentFilters: [
      {
        action: "VIEW",
        data: [{ scheme: "helpapp" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "@react-native-firebase/app", 
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    "@react-native-community/datetimepicker",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Help App to access your location even when the app is closed for emergency tracking.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#16a34a",
        androidMode: "default",
        androidCollapsedTitle: "Safety Alert",
      },
    ],
    "expo-secure-store",
    [
      "expo-media-library",
      {
        photosPermission: "Allow Help App to save QR codes to your gallery.",
        savePhotosPermission: "Allow Help App to save QR codes to your gallery.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow Help App to access your photos to scan QR codes from gallery.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    networkInspector: false,
  },
  extra: {
    router: {},
    eas: {
      projectId: "5576cb62-00c7-40e8-9dc7-8279b9871fbe",
    },
  },
  owner: "okaysample",
});