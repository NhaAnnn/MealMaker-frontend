import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  TextInput,
  Modal, // Đã thêm Modal
} from "react-native";
import {
  useNavigation,
  useIsFocused,
  useFocusEffect,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
// 💡 Cần import AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

// Assume these imports are correctly configured
import { useRecipes } from "../hook/useRecipes";
import RecipeCard from "../components/RecipeCard";

// --- Define MODERN BLUE colors ---
const PRIMARY_BLUE = "#3D2C1C";
const DARK_BLUE = "#7D7A5B";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACCENT_RED = "#E74C3C";
const REMINDER_COLOR = "#0984E3"; // Màu mới cho Reminder

// Replace with the actual path to the background image
const HEADER_BACKGROUND_IMAGE = require("../../assets/header.jpg");

// Khóa lưu trữ cho AsyncStorage
const LAST_REMINDER_KEY = "lastFridgeReminderDate";

// =========================================================
// NEW COMPONENT: FRIDGE REMINDER MODAL
// =========================================================
const FridgeReminderModal = ({ visible, onClose, onNavigate }) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dialog}>
          <Ionicons
            name="leaf-outline"
            size={35}
            color={REMINDER_COLOR}
            style={{ marginBottom: 10 }}
          />
          <Text style={modalStyles.title}>Freshness Alert!</Text>
          <Text style={modalStyles.message}>
            Please check and update the ingredients in your **Refrigerator**.
            Fresh data helps us suggest better recipes!
          </Text>

          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              style={[modalStyles.button, { backgroundColor: PRIMARY_BLUE }]}
              onPress={onClose}
            >
              <Text style={modalStyles.buttonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                modalStyles.button,
                { backgroundColor: REMINDER_COLOR, marginLeft: 10 },
              ]}
              onPress={onNavigate}
            >
              <Text style={modalStyles.buttonText}>Update Fridge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Component for small action buttons in the card
const MiniActionButton = ({ iconName, title, onPress, color }) => (
  <TouchableOpacity style={styles.miniActionButton} onPress={onPress}>
    <View style={[styles.miniIconContainer, { backgroundColor: color + "15" }]}>
      <Ionicons name={iconName} size={24} color={color} />
    </View>
    <Text style={[styles.miniButtonText, { color: TEXT_DARK }]}>{title}</Text>
  </TouchableOpacity>
);

// SearchBar Input Component
const SearchBarInput = ({ searchText, onSearchChange }) => (
  <View style={styles.searchBar}>
    <Ionicons name="search" size={20} color={PRIMARY_BLUE} />
    <TextInput
      style={styles.searchBarText}
      placeholder="Search all recipes..." // Updated placeholder
      placeholderTextColor="#AAB7B8"
      value={searchText}
      onChangeText={onSearchChange}
      returnKeyType="search"
    />
    {searchText.length > 0 && (
      <TouchableOpacity onPress={() => onSearchChange("")}>
        {/* Clear Text Button */}
        <Ionicons name="close-circle" size={20} color="#AAB7B8" />
      </TouchableOpacity>
    )}
  </View>
);

// =========================================================
// HOMESCREEN MAIN COMPONENT
// =========================================================

export default function HomeScreen() {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();

  const {
    recipes: allRecipes,
    isLoading: isAllLoading,
    error,
    toggleLike,
    fetchAllRecipes,
  } = useRecipes();

  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  // 💡 STATE MỚI: Quản lý hiển thị Reminder Modal
  const [showReminder, setShowReminder] = useState(false);

  // --- LOGIC KIỂM TRA VÀ HIỂN THỊ REMINDER (ASYNC STORAGE) ---
  const checkAndShowReminder = useCallback(async () => {
    const today = new Date().toDateString(); // Lấy ngày hiện tại

    const options = { weekday: "long" };

    try {
      const lastReminderDateString = await AsyncStorage.getItem(
        LAST_REMINDER_KEY
      );

      if (lastReminderDateString) {
        // 1. Chuyển chuỗi (string) thành đối tượng Date
        const lastReminderDateObject = new Date(lastReminderDateString);

        const options = { weekday: "long" };

        // 2. Gọi toLocaleDateString trên đối tượng Date
        const fullDayOfWeek = lastReminderDateObject
          .toLocaleDateString("en-US", options)
          .toLocaleLowerCase();

        console.log("Last Reminder Date (String): " + lastReminderDateString);
        console.log("Day of Week: " + fullDayOfWeek);

        // Gọi API trừ tủ lạnh
      } else {
        // Xử lý trường hợp chưa có dữ liệu lưu trữ
        console.log("Chưa có ngày nhắc nhở nào được lưu.");
      }
      // Nếu ngày cuối cùng được nhắc KHÔNG phải là hôm nay
      if (lastReminderDateString !== today) {
        console.log(
          `Hiển thị nhắc nhở. Ngày cuối cùng: ${lastReminderDateString}`
        );
        setShowReminder(true);
        // Cập nhật ngày đã nhắc (sau khi hiển thị)
        await AsyncStorage.setItem(LAST_REMINDER_KEY, today);
      } else {
        console.log("Đã nhắc nhở hôm nay. Bỏ qua.");
      }
    } catch (e) {
      console.error("AsyncStorage error checking reminder:", e);
    }
  }, []);

  // Function to handle closing the modal (without navigation)
  const handleCloseReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  // Function to handle navigating to the Fridge screen
  const handleNavigateToFridge = useCallback(() => {
    setShowReminder(false);
    navigation.navigate("Fridge");
  }, [navigation]);

  // --- FUNCTION TO LOAD RANDOM FEATURED RECIPES ---
  const loadFeaturedRecipes = useCallback(async () => {
    setIsFeaturedLoading(true);
    try {
      const data = await fetchAllRecipes(3);
      setFeaturedRecipes(data);
    } catch (e) {
      console.error("Error loading featured recipes:", e);
    } finally {
      setIsFeaturedLoading(false);
    }
  }, [fetchAllRecipes]);

  // Load Featured data AND check/show reminder when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFeaturedRecipes();
      // 💡 KIỂM TRA VÀ HIỂN THỊ REMINDER KHI MÀN HÌNH ĐƯỢC FOCUS
      checkAndShowReminder();
    }, [loadFeaturedRecipes, checkAndShowReminder])
  );

  // --- CLIENT-SIDE FILTERING LOGIC ---
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredRecipes([]);
      return;
    }

    const lowerCaseSearch = searchText.toLowerCase().trim();
    const results = allRecipes.filter((recipe) => {
      const titleMatch = recipe.title.toLowerCase().includes(lowerCaseSearch);

      const tagsMatch =
        recipe.tags && Array.isArray(recipe.tags)
          ? recipe.tags.some((tag) =>
              tag.toLowerCase().includes(lowerCaseSearch)
            )
          : false;

      return titleMatch || tagsMatch;
    });

    setFilteredRecipes(results);
  }, [searchText, allRecipes]);

  // Translated action items and standardized screen names
  const actionItems = [
    {
      title: "Fridge", // Tủ Lạnh
      iconName: "cube-outline",
      color: "#09FF00",
      screen: "Fridge",
    },
    {
      title: "Filter", // Lọc
      iconName: "options-outline",
      color: "#3498DB",
      screen: "Filter",
    },
    {
      title: "Favorites", // Yêu Thích
      iconName: "heart-outline",
      color: "#FF0505",
      screen: "Favorites",
    },
    {
      title: "Skill Quiz", // Lên Kế Hoạch
      iconName: "medal-outline",
      color: "#F1C40F",
      screen: "Quiz",
    },
  ];

  const BOTTOM_PADDING_FIX = tabBarHeight + 20;
  const FLOATING_CARD_MARGIN_TOP = -50;

  const handleRecipePress = useCallback(
    (recipe) => {
      navigation.navigate("RecipeDetail", {
        recipeId: recipe.id || recipe._id,
      });
    },
    [navigation]
  );

  const isSearching = searchText.trim() !== "";
  const displayRecipes = isSearching ? filteredRecipes : featuredRecipes;

  const listTitle = useMemo(() => {
    if (isSearching) {
      return `🔍 Search Results (${filteredRecipes.length} recipes)`;
    }
    return "🍜 Quick Recipe Suggestions";
  }, [isSearching, filteredRecipes.length]);

  // --- RENDERING LOADING/ERROR STATES ---
  if (isFeaturedLoading && featuredRecipes.length === 0 && !isSearching) {
    return (
      <View
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        <Text style={{ marginTop: 10, color: TEXT_DARK }}>
          Loading recipes...
        </Text>
      </View>
    );
  }

  if (error && featuredRecipes.length === 0) {
    return (
      <View
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Ionicons name="warning-outline" size={30} color={ACCENT_RED} />
        <Text style={{ marginTop: 10, color: TEXT_DARK, textAlign: "center" }}>
          Error loading recipes: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {isFocused && (
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
      )}

      {/* 💡 THÊM MODAL VÀO COMPONENT TREE */}
      <FridgeReminderModal
        visible={showReminder}
        onClose={handleCloseReminder}
        onNavigate={handleNavigateToFridge}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BOTTOM_PADDING_FIX },
        ]}
      >
        <View style={styles.container}>
          <ImageBackground
            source={HEADER_BACKGROUND_IMAGE}
            style={[styles.topSection]}
            imageStyle={styles.imageBackgroundStyle}
          >
            <View style={styles.overlay}>
              <Text style={styles.greetingTitle}>Welcome back!</Text>
              <Text style={styles.greetingSubTitle}>
                What do you feel like cooking today?
              </Text>
            </View>
          </ImageBackground>

          {/* Floating Card with 4 Action Buttons */}
          <View
            style={[
              styles.actionCardContainerFixed,
              { marginTop: FLOATING_CARD_MARGIN_TOP },
            ]}
          >
            <View style={styles.actionGrid}>
              {actionItems.map((item) => (
                <MiniActionButton
                  key={item.title}
                  iconName={item.iconName}
                  title={item.title}
                  color={item.color}
                  onPress={() => navigation.navigate(item.screen)}
                />
              ))}
            </View>
          </View>

          {/* Search bar and Recipes */}
          <View style={styles.bottomContainer}>
            {/* Search bar */}
            <View style={styles.searchBarWrapper}>
              <SearchBarInput
                searchText={searchText}
                onSearchChange={setSearchText}
              />
            </View>

            {/* SECTION TITLE (Dynamic) */}
            <Text
              style={[styles.sectionTitle, { color: TEXT_DARK, marginTop: 15 }]}
            >
              {listTitle}
            </Text>

            <View style={styles.recipeList}>
              {displayRecipes.map((recipe) => (
                <View
                  key={recipe.id || recipe._id}
                  style={{ marginBottom: 15 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    onToggleLike={toggleLike}
                    onPress={() => handleRecipePress(recipe)}
                  />
                </View>
              ))}

              {/* No Results Text */}
              {(!isFeaturedLoading || isSearching) &&
                displayRecipes.length === 0 && (
                  <Text style={styles.noRecipesText}>
                    {
                      isSearching
                        ? "No recipes found matching your keyword." // Search result 0
                        : "No quick suggestions found. Try searching!" // Quick suggestion 0
                    }
                  </Text>
                )}

              {/* Loading Indicator for Featured Recipes when not searching */}
              {!isSearching && isFeaturedLoading && (
                <ActivityIndicator
                  size="small"
                  color={PRIMARY_BLUE}
                  style={{ marginTop: 10 }}
                />
              )}
            </View>

            {/* See More Button (Only visible when not searching) */}
            {!isSearching && (
              <TouchableOpacity
                style={[
                  styles.seeMoreButton,
                  { backgroundColor: PRIMARY_BLUE },
                ]}
                onPress={() => loadFeaturedRecipes()}
              >
                <Text style={styles.seeMoreButtonText}>Other recipes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: TEXT_DARK,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    color: TEXT_DARK,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },

  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 0, flexGrow: 1 },
  container: {
    paddingHorizontal: 0,
  },
  bottomContainer: {
    paddingHorizontal: 20,
  },

  // --- TOP SECTION (ImageBackground) ---
  topSection: {
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: "hidden",
    paddingTop: 50,
  },
  imageBackgroundStyle: {
    opacity: 0.65,
  },
  overlay: {
    flex: 1,
  },
  greetingTitle: {
    right: -30,
    fontSize: 24,
    fontWeight: "700",
    color: "#3D2C1C",
    marginBottom: 5,
  },
  greetingSubTitle: {
    right: -30,
    fontSize: 16,
    fontWeight: "500",
    color: "#5a432eff",
    marginBottom: 20,
  },

  // --- FLOATING CARD ---
  actionCardContainerFixed: {
    backgroundColor: "#ffffffff",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    zIndex: 10,
    shadowColor: DARK_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  miniActionButton: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 8,
  },
  miniIconContainer: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 5,
  },
  miniButtonText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // --- SearchBar ---
  searchBarWrapper: {
    paddingTop: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 5,
    paddingLeft: 15,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: BACKGROUND_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBarText: {
    marginLeft: 10,
    flex: 1,
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: "500",
  },

  // --- Section/Button styles ---
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
    paddingLeft: 10,
  },
  recipeList: {},
  noRecipesText: {
    textAlign: "center",
    marginTop: 20,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  seeMoreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
