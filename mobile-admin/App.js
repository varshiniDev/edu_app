import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider as PaperProvider } from "react-native-paper";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import api, { tokens } from "./src/api";
import { BrandingProvider, Logo, useBranding } from "./src/branding";
import { T, headerOpts } from "./src/theme";
import { LoginScreen, DashboardScreen, MoreScreen } from "./src/screens/core";
import PeopleScreen from "./src/screens/People";
import BatchesScreen from "./src/screens/Batches";
import EnrollmentScreen from "./src/screens/Enrollment";
import {
  PortalHome,
  PortalBatches,
  PortalBatch,
  PortalProfile,
} from "./src/screens/portal";
import AttendanceScreen from "./src/screens/Attendance";
import CoursesScreen, { SyllabusScreen } from "./src/screens/Courses";
import SettingsScreen from "./src/screens/Settings";
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ICONS = {
  Home: "home",
  "My Batches": "layers",
  Profile: "account-circle",
  Dashboard: "view-dashboard",
  Staff: "account-tie",
  Students: "account-school",
  Batches: "layers",
  More: "dots-horizontal-circle",
};
function PortalTabs({ me, onLogout }) {
  const { academy_name } = useBranding();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOpts,
        headerTitle: academy_name,
        headerLeft: () => <Logo size={30} />,
        headerLeftContainerStyle: { paddingLeft: 12 },
        tabBarActiveTintColor: T.brand,
        tabBarIcon: ({ color, size }) => (
          <Icon name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home">{() => <PortalHome me={me} />}</Tab.Screen>
      <Tab.Screen name="My Batches" component={PortalBatches} />
      <Tab.Screen name="Profile">
        {() => <PortalProfile me={me} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
function Tabs({ onLogout }) {
  const { academy_name } = useBranding();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOpts,
        headerTitle: academy_name,
        headerLeft: () => <Logo size={30} />,
        headerLeftContainerStyle: { paddingLeft: 12 },
        tabBarActiveTintColor: T.brand,
        tabBarIcon: ({ color, size }) => (
          <Icon name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Staff">
        {() => <PeopleScreen kind="staff" />}
      </Tab.Screen>
      <Tab.Screen name="Students">
        {() => <PeopleScreen kind="students" />}
      </Tab.Screen>
      <Tab.Screen name="Batches" component={BatchesScreen} />
      <Tab.Screen name="More">
        {(p) => <MoreScreen {...p} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
export default function App() {
  const [me, setMe] = useState(undefined); // undefined = checking, null = logged out
  useEffect(() => {
    tokens.get("access").then((t) =>
      t
        ? api
            .get("/auth/me/")
            .then((r) => setMe(r.data))
            .catch(() => setMe(null))
        : setMe(null),
    );
  }, []);
  if (me === undefined) return <ActivityIndicator style={{ marginTop: 80 }} />;
  const out = () => setMe(null);
  const hdr = { ...headerOpts, animation: "slide_from_right" };
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <BrandingProvider>
          <NavigationContainer>
            {!me ? (
              <LoginScreen onLogin={setMe} />
            ) : me.is_admin ? (
              <Stack.Navigator screenOptions={hdr}>
                <Stack.Screen name="Home" options={{ headerShown: false }}>
                  {() => <Tabs onLogout={out} />}
                </Stack.Screen>
                <Stack.Screen
                  name="Enrollment"
                  component={EnrollmentScreen}
                  options={{ title: "Student Enrollment" }}
                />
                <Stack.Screen name="Attendance" component={AttendanceScreen} />
                <Stack.Screen
                  name="Courses"
                  component={CoursesScreen}
                  options={{ title: "Courses" }}
                />
                <Stack.Screen
                  name="Syllabus"
                  component={SyllabusScreen}
                  options={({ route }) => ({ title: route.params.name })}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{ title: "Settings & Profile" }}
                />
              </Stack.Navigator>
            ) : (
              <Stack.Navigator screenOptions={hdr}>
                <Stack.Screen name="PHome" options={{ headerShown: false }}>
                  {() => <PortalTabs me={me} onLogout={out} />}
                </Stack.Screen>
                <Stack.Screen
                  name="PBatch"
                  options={({ route }) => ({ title: route.params.batch.name })}
                >
                  {(p) => <PortalBatch {...p} me={me} />}
                </Stack.Screen>
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </BrandingProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
