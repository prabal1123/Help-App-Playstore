// import React, { useEffect, useRef, useCallback, useMemo } from "react";
// import {
//   View,
//   Text,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
// import MapView from "react-native-maps";
// import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { guardianStyles as styles } from "@/styles/guardian";
// import {
//   useGuardianState,
//   AlertModal,
//   AlarmBanner,
//   UserSelector,
//   GuardianMap,
//   HomeLocationPanel,
//   SafeZonePanel,
// } from "@/components/guardian";

// const SNAP_POINTS = [80, "28%", "52%", "92%"];
// const SNAP = { COLLAPSED: 0, PEEK: 1, HALF: 2, FULL: 3 };
// const TOP_OVERLAY_CONTENT_HEIGHT = 138;

// const hasHome = true; // or false (replace later with real data)

// export default function GuardianScreen() {
//   const mapRef = useRef<MapView>(null);
//   const bottomSheetRef = useRef<BottomSheet>(null);
//   const snapPoints = useMemo(() => SNAP_POINTS, []);
//   const insets = useSafeAreaInsets();

//   const {
//     linkedUsers,
//     selectedUser,
//     dropdownVisible,
//     setDropdownVisible,
//     selectUser,
//     loadingUser,
//     userLocation,
//     homeLocation,
//     lastUpdated,
//     isOutside,
//     isAwayFromHome,
//     mapMode,
//     setMapMode,
//     safeZones,
//     selectedCenter,
//     setSelectedCenter,
//     radius,
//     setRadius,
//     pendingHome,
//     setPendingHome,
//     isFollowing,
//     setIsFollowing,
//     hasInitialFit,
//     activateSafeZone,
//     saveHomeLocation,
//     savingHome,
//     editingZone,
//     editRadius,
//     setEditRadius,
//     editCenter,
//     setEditCenter,
//     savingZone,
//     startEditZone,
//     saveEditedZone,
//     deleteZone,
//     cancelEditZone,
//     alarm,
//     alertModal,
//     hideAlert,
//   } = useGuardianState();

//   // ─── Initial map fit ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (userLocation && mapRef.current && !hasInitialFit.current) {
//       hasInitialFit.current = true;
//       const coords = [userLocation];
//       if (homeLocation) coords.push(homeLocation);
//       mapRef.current.fitToCoordinates(coords, {
//         edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
//         animated: true,
//       });
//     }
//   }, [userLocation, homeLocation]);

//   // ─── Auto-follow ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!userLocation || !mapRef.current || !isFollowing) return;
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       800
//     );
//   }, [userLocation, isFollowing]);

//   // ─── Go to user ─────────────────────────────────────────────────────────────
//   const locateUser = useCallback(() => {
//     if (!userLocation || !mapRef.current) return;
//     bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
//     mapRef.current.animateToRegion(
//       {
//         latitude: userLocation.latitude,
//         longitude: userLocation.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       500
//     );
//   }, [userLocation]);

//   // ─── Set home at user location ──────────────────────────────────────────────
//   const setHomeAtUserLocation = useCallback(() => {
//     if (!userLocation) {
//       Alert.alert("User location not available yet.");
//       return;
//     }
//     Alert.alert(
//       "Set Home",
//       `Set ${selectedUser?.name}'s current location as home?`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Confirm",
//           onPress: async () => await saveHomeLocation(userLocation),
//         },
//       ]
//     );
//   }, [userLocation, selectedUser, saveHomeLocation]);

//   // ─── Map press ──────────────────────────────────────────────────────────────
//   const handleMapPress = useCallback(
//     (e: any) => {
//       const { latitude, longitude } = e.nativeEvent.coordinate;
//       if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
//       else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
//       else if (mapMode === "editSafeZone") setEditCenter({ latitude, longitude });
//     },
//     [mapMode, setSelectedCenter, setPendingHome, setEditCenter]
//   );

//   // ─── Safe zone / set home modes ─────────────────────────────────────────────
//   const startSafeZoneMode = useCallback(() => {
//     setMapMode("safeZone");
//     setSelectedCenter(null);
//     bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
//   }, [setMapMode, setSelectedCenter]);

//   const startSetHomeMode = useCallback(() => {
//     setMapMode("setHome");
//     setPendingHome(null);
//     bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
//   }, [setMapMode, setPendingHome]);

//   const initialRegion = {
//     latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
//     longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   const fabTopOffset = insets.top + TOP_OVERLAY_CONTENT_HEIGHT;

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaView style={{ flex: 1 }} edges={[]}>
//         {/* ── Full-screen map ── */}
//         {!loadingUser && selectedUser && Platform.OS !== "web" && (
//           <View style={StyleSheet.absoluteFill}>
//             <GuardianMap
//               mapRef={mapRef}
//               initialRegion={initialRegion}
//               userLocation={userLocation}
//               homeLocation={homeLocation}
//               pendingHome={pendingHome}
//               safeZones={safeZones}
//               selectedCenter={selectedCenter}
//               radius={radius}
//               mapMode={mapMode}
//               isOutside={isOutside}
//               isFollowing={isFollowing}
//               savingHome={savingHome}
//               selectedUserName={selectedUser.name}
//               editingZone={editingZone}
//               editCenter={editCenter}
//               editRadius={editRadius}
//               onMapPress={handleMapPress}
//               onPanDrag={() => setIsFollowing(false)}
//               onToggleFollow={() => setIsFollowing((prev) => !prev)}
//               onLocateUser={locateUser}
//               onSetHomeAtUserLocation={setHomeAtUserLocation}
//               onEditZone={startEditZone}
//               fabTopOffset={fabTopOffset}
//             />
//           </View>
//         )}

//         {/* ── Top overlay ── */}
//         <View
//           style={[localStyles.topOverlay, { paddingTop: insets.top + 8 }]}
//           pointerEvents="box-none"
//         >
//           <Text style={[styles.title, localStyles.titleText]}>
//             Guardian View
//           </Text>
//           <AlertModal alertModal={alertModal} onDismiss={hideAlert} />
//           <AlarmBanner
//             activeAlarm={alarm.activeAlarm}
//             alarmBgColor={alarm.alarmBgColor}
//             alarmIcon={alarm.alarmIcon}
//             alarmTitle={alarm.alarmTitle}
//             userName={selectedUser?.name ?? ""}
//             onDismiss={alarm.dismissAlarm}
//           />
//           <UserSelector
//             linkedUsers={linkedUsers}
//             selectedUser={selectedUser}
//             dropdownVisible={dropdownVisible}
//             onOpenDropdown={() => setDropdownVisible(true)}
//             onCloseDropdown={() => setDropdownVisible(false)}
//             onSelectUser={selectUser}
//           />
//           {loadingUser && (
//             <View style={{ alignItems: "center", padding: 20 }}>
//               <ActivityIndicator size="large" color="#16a34a" />
//             </View>
//           )}
//         </View>

//         {/* ── Bottom Sheet ── */}
//         {!loadingUser && selectedUser && Platform.OS !== "web" && (
//           <BottomSheet
//             ref={bottomSheetRef}
//             index={SNAP.PEEK}
//             snapPoints={snapPoints}
//             handleComponent={CustomHandle}
//             backgroundStyle={localStyles.sheetBackground}
//             enableContentPanningGesture={true}
//             enableHandlePanningGesture={true}
//             style={{ zIndex: 20 }}
//           >
//             <BottomSheetScrollView
//               contentContainerStyle={[
//                 localStyles.sheetContent,
//                 { paddingBottom: insets.bottom + 80 },
//               ]}
//             >
//               {/* StatusCard has been removed — use <StatusCard /> in your other screen */}

//               <HomeLocationPanel
//                 userName={selectedUser.name}
//                 mapMode={mapMode}
//                 pendingHome={pendingHome}
//                 savingHome={savingHome}
//                 onStartSetHome={startSetHomeMode}
//                 onConfirmHome={() =>
//                   pendingHome && saveHomeLocation(pendingHome)
//                 }
//                 onCancel={() => {
//                   setMapMode("none");
//                   setPendingHome(null);
//                 }}
//               />
//               <SafeZonePanel
//                 mapMode={mapMode}
//                 radius={radius}
//                 selectedCenter={selectedCenter}
//                 onSetRadius={setRadius}
//                 onStartSafeZone={startSafeZoneMode}
//                 onConfirmSafeZone={activateSafeZone}
//                 onCancel={() => {
//                   setMapMode("none");
//                   setSelectedCenter(null);
//                 }}
//                 safeZones={safeZones}
//                 onEditZone={startEditZone}
//                 onDeleteZone={deleteZone}
//                 editingZone={editingZone}
//                 editRadius={editRadius}
//                 editCenter={editCenter}
//                 savingZone={savingZone}
//                 onSetEditRadius={setEditRadius}
//                 onSaveEdit={saveEditedZone}
//                 onCancelEdit={cancelEditZone}
//               />
//             </BottomSheetScrollView>
//           </BottomSheet>
//         )}
//       </SafeAreaView>
//     </GestureHandlerRootView>
//   );
// }

// function CustomHandle() {
//   return (
//     <View style={localStyles.handleContainer}>
//       <View style={localStyles.handleBar} />
//     </View>
//   );
// }

// const localStyles = StyleSheet.create({
//   topOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     backgroundColor: "rgba(255,255,255,0.93)",
//     paddingBottom: 10,
//     paddingHorizontal: 12,
//   },
//   titleText: {
//     marginBottom: 4,
//   },
//   sheetBackground: {
//     backgroundColor: "#ffffff",
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 12,
//   },
//   sheetContent: {
//     paddingHorizontal: 16,
//     paddingTop: 4,
//   },
//   handleContainer: {
//     height: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     backgroundColor: "#ffffff",
//   },
//   handleBar: {
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: "#d1d5db",
//   },
// });



import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { guardianStyles as styles } from "@/styles/guardian";
import {
  useGuardianState,
  AlertModal,
  AlarmBanner,
  UserSelector,
  GuardianMap,
  HomeLocationPanel,
  SafeZonePanel,
} from "@/components/guardian";

const SNAP_POINTS = [80, "28%", "52%", "92%"];
const SNAP = { COLLAPSED: 0, PEEK: 1, HALF: 2, FULL: 3 };
const TOP_OVERLAY_CONTENT_HEIGHT = 138;

export default function GuardianScreen() {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);
  const insets = useSafeAreaInsets();

  const {
    linkedUsers,
    selectedUser,
    dropdownVisible,
    setDropdownVisible,
    selectUser,
    loadingUser,
    userLocation,
    homeLocation,
    lastUpdated,
    isOutside,
    isAwayFromHome,
    mapMode,
    setMapMode,
    safeZones,
    selectedCenter,
    setSelectedCenter,
    radius,
    setRadius,
    pendingHome,
    setPendingHome,
    isFollowing,
    setIsFollowing,
    hasInitialFit,
    activateSafeZone,
    saveHomeLocation,
    savingHome,
    editingZone,
    editRadius,
    setEditRadius,
    editCenter,
    setEditCenter,
    savingZone,
    startEditZone,
    saveEditedZone,
    deleteZone,
    cancelEditZone,
    zoneName,
    setZoneName,
    editZoneName,
    setEditZoneName,
    alarm,
    alertModal,
    hideAlert,
  } = useGuardianState();

  // ─── Initial map fit ────────────────────────────────────────────────────────
  useEffect(() => {
    if (userLocation && mapRef.current && !hasInitialFit.current) {
      hasInitialFit.current = true;
      const coords = [userLocation];
      if (homeLocation) coords.push(homeLocation);
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [userLocation, homeLocation]);

  // ─── Auto-follow ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userLocation || !mapRef.current || !isFollowing) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800
    );
  }, [userLocation, isFollowing]);

  // ─── Go to user ─────────────────────────────────────────────────────────────
  const locateUser = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  }, [userLocation]);

  // ─── Set home at user location ──────────────────────────────────────────────
  const setHomeAtUserLocation = useCallback(() => {
    if (!userLocation) {
      Alert.alert("User location not available yet.");
      return;
    }
    Alert.alert(
      "Set Home",
      `Set ${selectedUser?.name}'s current location as home?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => await saveHomeLocation(userLocation),
        },
      ]
    );
  }, [userLocation, selectedUser, saveHomeLocation]);

  // ─── Map press ──────────────────────────────────────────────────────────────
  const handleMapPress = useCallback(
    (e: any) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      if (mapMode === "safeZone") setSelectedCenter({ latitude, longitude });
      else if (mapMode === "setHome") setPendingHome({ latitude, longitude });
      else if (mapMode === "editSafeZone") setEditCenter({ latitude, longitude });
    },
    [mapMode, setSelectedCenter, setPendingHome, setEditCenter]
  );

  // ─── Safe zone / set home modes ─────────────────────────────────────────────
  const startSafeZoneMode = useCallback(() => {
    setMapMode("safeZone");
    setSelectedCenter(null);
    bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  }, [setMapMode, setSelectedCenter]);

  const startSetHomeMode = useCallback(() => {
    setMapMode("setHome");
    setPendingHome(null);
    bottomSheetRef.current?.snapToIndex(SNAP.PEEK);
  }, [setMapMode, setPendingHome]);

  const initialRegion = {
    latitude: userLocation?.latitude ?? homeLocation?.latitude ?? 28.6139,
    longitude: userLocation?.longitude ?? homeLocation?.longitude ?? 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const fabTopOffset = insets.top + TOP_OVERLAY_CONTENT_HEIGHT;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={[]}>

        {/* ── Full-screen map ── */}
        {!loadingUser && selectedUser && Platform.OS !== "web" && (
          <View style={StyleSheet.absoluteFill}>
            <GuardianMap
              mapRef={mapRef}
              initialRegion={initialRegion}
              userLocation={userLocation}
              homeLocation={homeLocation}
              pendingHome={pendingHome}
              safeZones={safeZones}
              selectedCenter={selectedCenter}
              radius={radius}
              mapMode={mapMode}
              isOutside={isOutside}
              isFollowing={isFollowing}
              savingHome={savingHome}
              selectedUserName={selectedUser.name}
              editingZone={editingZone}
              editCenter={editCenter}
              editRadius={editRadius}
              onMapPress={handleMapPress}
              onPanDrag={() => setIsFollowing(false)}
              onToggleFollow={() => setIsFollowing((prev) => !prev)}
              onLocateUser={locateUser}
              onSetHomeAtUserLocation={setHomeAtUserLocation}
              onEditZone={startEditZone}
              fabTopOffset={fabTopOffset}
            />
          </View>
        )}

        {/* ── Top overlay ── */}
        <View
          style={[localStyles.topOverlay, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <Text style={[styles.title, localStyles.titleText]}>
            Guardian View
          </Text>
          <AlertModal alertModal={alertModal} onDismiss={hideAlert} />
          <AlarmBanner
            activeAlarm={alarm.activeAlarm}
            alarmBgColor={alarm.alarmBgColor}
            alarmIcon={alarm.alarmIcon}
            alarmTitle={alarm.alarmTitle}
            userName={selectedUser?.name ?? ""}
            onDismiss={alarm.dismissAlarm}
          />
          <UserSelector
            linkedUsers={linkedUsers}
            selectedUser={selectedUser}
            dropdownVisible={dropdownVisible}
            onOpenDropdown={() => setDropdownVisible(true)}
            onCloseDropdown={() => setDropdownVisible(false)}
            onSelectUser={selectUser}
          />
          {loadingUser && (
            <View style={{ alignItems: "center", padding: 20 }}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          )}
        </View>

        {/* ── Bottom Sheet ── */}
        {!loadingUser && selectedUser && Platform.OS !== "web" && (
          <BottomSheet
            ref={bottomSheetRef}
            index={SNAP.PEEK}
            snapPoints={snapPoints}
            handleComponent={CustomHandle}
            backgroundStyle={localStyles.sheetBackground}
            enableContentPanningGesture={true}
            enableHandlePanningGesture={true}
            style={{ zIndex: 20 }}
          >
            <BottomSheetScrollView
              contentContainerStyle={[
                localStyles.sheetContent,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              <HomeLocationPanel
                userName={selectedUser.name}
                mapMode={mapMode}
                pendingHome={pendingHome}
                savingHome={savingHome}
                onStartSetHome={startSetHomeMode}
                onConfirmHome={() =>
                  pendingHome && saveHomeLocation(pendingHome)
                }
                onCancel={() => {
                  setMapMode("none");
                  setPendingHome(null);
                }}
              />
              <SafeZonePanel
                mapMode={mapMode}
                radius={radius}
                selectedCenter={selectedCenter}
                onSetRadius={setRadius}
                onStartSafeZone={startSafeZoneMode}
                onConfirmSafeZone={activateSafeZone}
                onCancel={() => {
                  setMapMode("none");
                  setSelectedCenter(null);
                }}
                safeZones={safeZones}
                onEditZone={startEditZone}
                onDeleteZone={deleteZone}
                editingZone={editingZone}
                editRadius={editRadius}
                editCenter={editCenter}
                savingZone={savingZone}
                onSetEditRadius={setEditRadius}
                onSaveEdit={saveEditedZone}
                onCancelEdit={cancelEditZone}
                zoneName={zoneName}
                onSetZoneName={setZoneName}
                editZoneName={editZoneName}
                onSetEditZoneName={setEditZoneName}
              />
            </BottomSheetScrollView>
          </BottomSheet>
        )}

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function CustomHandle() {
  return (
    <View style={localStyles.handleContainer}>
      <View style={localStyles.handleBar} />
    </View>
  );
}

const localStyles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.93)",
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  titleText: {
    marginBottom: 4,
  },
  sheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  handleContainer: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
});