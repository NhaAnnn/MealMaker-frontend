import "react-native-gesture-handler";
import * as React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import tất cả các màn hình
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import RecipeDetailScreen from "./src/screens/RecipeDetailScreen";
import FridgeScreen from "./src/screens/FridgeScreen";
import FilterScreen from "./src/screens/FilterScreen";
import PlanScreen from "./src/screens/PlanScreen";
import AboutScreen from "./src/screens/AboutScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import BlogScreen from "./src/screens/BlogScreen";
import UploadRecipeScreen from "./src/screens/UploadRecipeScreen";
import PostDetailScreen from "./src/screens/PostDetailScreen";

// Giả sử bạn đặt AuthContext trong components
import { AuthProvider, useAuth } from "./src/components/AuthContext";

// Định nghĩa các Navigator
const HomeStack = createStackNavigator();
const ExploreStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AppStack = createStackNavigator(); // Stack cấp cao nhất (App Stack)

// --- LỖI 1: BẠN CHƯA KHỞI TẠO AuthStack ---
const AuthStack = createStackNavigator(); // <-- THÊM DÒNG NÀY

const commonScreenOptions = {
  headerStyle: { backgroundColor: "#E74C3C" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" },
};

// --- 1. Home Stack (Chứa HomeMain - không header) ---
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{ ...commonScreenOptions, headerShown: false }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

// --- 2. Khám Phá/Tìm Kiếm Stack (Chứa Search và Detail) ---
function ExploreStackScreen() {
  return (
    <ExploreStack.Navigator
      initialRouteName="RecipeSearch"
      screenOptions={{ ...commonScreenOptions, headerShown: false }}
    >
      <ExploreStack.Screen name="RecipeSearch" component={SearchScreen} />
    </ExploreStack.Navigator>
  );
}

// --- 3. Tab Navigator (Chứa các Tab chính) ---
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let rn = route.name;

          if (rn === "Trang Chủ") {
            iconName = focused ? "home" : "home-outline";
          } else if (rn === "Khám Phá") {
            iconName = focused ? "search" : "search-outline";
          } else if (rn === "Blog") {
            iconName = focused ? "newspaper" : "newspaper-outline";
          } else if (rn === "Kế Hoạch") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (rn === "Thông Tin") {
            iconName = focused
              ? "information-circle"
              : "information-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 5,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen name="Trang Chủ" component={HomeStackNavigator} />
      <Tab.Screen name="Khám Phá" component={SearchScreen} />
      <Tab.Screen name="Blog" component={BlogScreen} />
      <Tab.Screen name="Kế Hoạch" component={PlanScreen} />
      <Tab.Screen name="Thông Tin" component={AboutScreen} />
    </Tab.Navigator>
  );
}

// --- 4. Auth Stack (Mới) ---
// Stack này chỉ chứa màn hình Đăng nhập, Đăng ký
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      {/* <AuthStack.Screen name="Register" component={RegisterScreen} /> */}
    </AuthStack.Navigator>
  );
}

// --- 5. App Navigator Chính (Sửa đổi) ---

function AppRootNavigator() {
  const { userToken, isLoading } = useAuth();

  // Nếu đang kiểm tra token, hiển thị màn hình loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // --- ĐÂY LÀ LOGIC CỐT LỖI ---
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        // Nếu không có token -> Hiển thị Stack Đăng nhập
        // "Auth" tự động là màn hình đầu tiên
        <AppStack.Screen name="Auth" component={AuthStackNavigator} />
      ) : (
        // Nếu có token -> Hiển thị Stack Chính của App
        // "Main" tự động là màn hình đầu tiên
        <>
          <AppStack.Screen name="Main" component={MainTabNavigator} />
          <AppStack.Screen name="Fridge" component={FridgeScreen} />
          <AppStack.Screen name="Filter" component={FilterScreen} />
          <AppStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          <AppStack.Screen name="Favorites" component={FavoritesScreen} />
          <AppStack.Screen
            name="UploadRecipe"
            component={UploadRecipeScreen}
            options={{ presentation: "modal" }}
          />
          <AppStack.Screen name="PostDetail" component={PostDetailScreen} />
        </>
      )}
    </AppStack.Navigator>
  );
}

// --- 6. App component (Cấp cao nhất) ---
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppRootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
