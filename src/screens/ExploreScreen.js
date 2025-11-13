import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
// ADDED: Import necessary hooks
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRecipes } from "../hook/useRecipes"; // <--- IMPORT HOOK API
import { useAuth } from "../components/AuthContext"; // <--- IMPORT AUTH CONTEXT

// Import child components (Assuming they exist)
import InputSection from "../components/InputSection";
import RecipeCard from "../components/RecipeCard";

// --- Define MODERN BLUE colors ---
const PRIMARY_BLUE = "#3D2C1C"; // Dark Brown/Coffee (Primary color)
const DARK_BLUE = "#3D2C1C"; // Dark Blue for Header/Titles
const BACKGROUND_LIGHT = "#F9EBD7"; // Very Light Tan Background
const TEXT_DARK = "#2C3E50"; // Dark Gray
const ACCENT_RED = "#E74C3C"; // Accent color for error/Random
const ACCENT_YELLOW = "#a58b13ff"; // Màu Vàng/Be

export default function ExploreScreen() {
  const navigation = useNavigation();

  // --- 1. KHỞI TẠO HOOKS ---
  const { userId, isLoggedIn } = useAuth();
  const {
    searchRecipesByIngredients,
    fetchAllRecipes,
    isLoading: isHookLoading,
    error: hookError,
  } = useRecipes();
  // Trạng thái loading và error của hook sẽ được sử dụng trực tiếp

  const [ingredients, setIngredients] = useState(["", "", ""]);
  const [recipes, setRecipes] = useState([]);
  const [message, setMessage] = useState(
    "Enter 3 ingredients you have or press RANDOM to start exploring!"
  );
  const [isError, setIsError] = useState(false);

  // Sử dụng loading từ hook
  const isLoading = isHookLoading;

  const tabBarHeight = useBottomTabBarHeight();
  const BOTTOM_PADDING_FIX = tabBarHeight + 60;

  // --- EFFECT XỬ LÝ LỖI HOOK ---
  useEffect(() => {
    if (hookError) {
      setMessage(`Error: ${hookError}`);
      setIsError(true);
    }
  }, [hookError]);

  // --- 3. CẬP NHẬT handleSearch (Dùng API thật) ---
  const handleSearch = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required",
        "Please log in to use the ingredient search feature."
      );
      return;
    }

    const filteredIngredients = ingredients
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    if (filteredIngredients.length === 0) {
      setMessage("Please enter at least one ingredient to search.");
      setIsError(true);
      return;
    }

    setIsError(false);
    setMessage("Searching recipes...");
    setRecipes([]); // Xóa kết quả cũ

    try {
      // Gọi API tìm kiếm công thức theo nguyên liệu
      const result = await searchRecipesByIngredients(
        filteredIngredients,
        1,
        10
      );

      const foundRecipes = result.data || [];

      setRecipes(foundRecipes);

      if (foundRecipes.length > 0) {
        setMessage(
          `Found ${foundRecipes.length} optimal recipes for your ingredients!`
        );
        setIsError(false);
      } else {
        setMessage("No recipes found matching your ingredients.");
        setIsError(true); // Coi là lỗi nếu không có kết quả
      }
    } catch (e) {
      // Lỗi đã được xử lý trong hook và cập nhật hookError,
      // nhưng ta vẫn set message cụ thể ở đây nếu cần
      if (!hookError) {
        setMessage("An unexpected error occurred during search.");
        setIsError(true);
      }
      setRecipes([]);
    }
  };

  // --- 4. CẬP NHẬT handleRandom (Dùng API thật) ---
  const handleRandom = async () => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please log in to fetch random recipes.");
      return;
    }

    setIsError(false);
    setIngredients(["", "", ""]); // Xóa input khi chọn ngẫu nhiên
    setMessage("Fetching a random recipe...");
    setRecipes([]);

    try {
      // Gọi API lấy 1 công thức ngẫu nhiên
      // Giả định fetchAllRecipes(limit=1) trả về mảng 1 công thức ngẫu nhiên
      const randomRecipe = await fetchAllRecipes(1);

      if (randomRecipe.length > 0) {
        setRecipes(randomRecipe);
        setMessage("Random dish selected! Enjoy your meal.");
        setIsError(false);
      } else {
        setMessage("Could not fetch a random recipe. Try again later.");
        setIsError(true);
      }
    } catch (e) {
      if (!hookError) {
        setMessage(
          "An unexpected error occurred while fetching random recipe."
        );
        setIsError(true);
      }
      setRecipes([]);
    }
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleOpenFilter = () => {
    Alert.alert(
      "Feature",
      "Navigating to the Filter screen is being activated."
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: BOTTOM_PADDING_FIX,
          },
        ]}
      >
        <View style={styles.container}>
          {/* TIÊU ĐỀ TRANG MỚI */}
          <Text style={[styles.mainPageTitle, { marginBottom: 5 }]}>
            Explore Recipes 🔍
          </Text>
          <Text style={styles.pageSubtitle}>
            Tired of cooking the same dish? Let's discover new meals!
          </Text>

          <Text style={styles.tagline}>
            Select 3 ingredients, Find simple recipes!
          </Text>

          <InputSection
            ingredients={ingredients}
            onIngredientChange={handleIngredientChange}
            onSearch={handleSearch}
            onRandom={handleRandom}
            buttonColor={PRIMARY_BLUE}
            randomColor={ACCENT_RED}
            isDisabled={isLoading} // Khóa input và button khi đang loading
          />

          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>
            Search Results
          </Text>
          {/* Loading/Message Area */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
              <Text style={styles.loadingText}>Searching... Please wait</Text>
            </View>
          )}

          {!isLoading && (
            <View>
              {/* Hiển thị lỗi hook nếu có, ưu tiên hơn message thường */}
              {(message || hookError) && (
                <Text
                  style={[
                    styles.messageArea,
                    isError || hookError
                      ? styles.errorText
                      : styles.successText,
                  ]}
                >
                  {hookError || message}
                </Text>
              )}

              <View style={styles.recipeResults}>
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id || recipe._id || recipe.recipe_id} // Đảm bảo key hoạt động với cả mock và data thật
                    recipe={recipe}
                    onPress={() =>
                      navigation.navigate("RecipeDetail", {
                        recipeId: recipe.id || recipe._id || recipe.recipe_id,
                      })
                    }
                  />
                ))}

                {recipes.length === 0 && !isError && !hookError && (
                  <Text style={styles.noResultsText}>
                    Search for a recipe or press "Random" for a suggestion!
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollView: { marginHorizontal: 0 },
  scrollContent: { paddingTop: 0, paddingHorizontal: 20 },
  container: { paddingHorizontal: 10, top: 30 },
  mainPageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: DARK_BLUE,
    textAlign: "left",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 20,
  },
  tagline: {
    fontSize: 16,
    textAlign: "center",
    color: TEXT_DARK,
    marginTop: 20,
    marginBottom: 25,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT_YELLOW,
    paddingLeft: 10,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: TEXT_DARK },
  messageArea: {
    textAlign: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 0,
    marginBottom: 15,
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
  },
  errorText: {
    color: ACCENT_RED,
    backgroundColor: "#FADBD8",
    borderColor: "#E6B0AA",
  },
  successText: {
    color: TEXT_DARK,
    backgroundColor: "#E8EAE6",
    borderColor: "#BDC3C7",
  },
  recipeResults: { marginTop: 5 },
  noResultsText: {
    textAlign: "center",
    color: "#7F8C8D",
    marginTop: 30,
    fontSize: 16,
    fontStyle: "italic",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
});
