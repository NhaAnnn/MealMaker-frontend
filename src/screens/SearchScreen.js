import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity, // Import thêm TouchableOpacity để dùng cho Header
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons
import InputSection from "../components/InputSection";
import RecipeCard from "../components/RecipeCard";
import { mockRecipes } from "../mockData";

// --- Định nghĩa màu sắc MODERN BLUE ---
const PRIMARY_BLUE = "#007AFF"; // Xanh Dương Sáng (Màu chủ đạo)
const DARK_BLUE = "#003A70"; // Xanh Đậm cho Header
const BACKGROUND_LIGHT = "#F0F3F6"; // Nền Xám Rất Nhạt
const TEXT_DARK = "#2C3E50"; // Xám Đậm
const ACCENT_RED = "#E74C3C"; // Màu nhấn cho lỗi/Random

// --- MOCK LOGIC (Giữ nguyên) ---
const MOCK_DELAY = 1200;
const mockFetchRecipes = (isRandom = false) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let data;
      if (isRandom) {
        const randomIndex = Math.floor(Math.random() * mockRecipes.length);
        data = [mockRecipes[randomIndex]];
      } else {
        data = mockRecipes.slice(0, 5); // Giới hạn 5 kết quả cho mock search
      }
      resolve(data);
    }, MOCK_DELAY);
  });
};
// --- END MOCK LOGIC ---

export default function SearchScreen() {
  const navigation = useNavigation();
  const [ingredients, setIngredients] = useState(["", "", ""]);
  const [recipes, setRecipes] = useState([]); // Bắt đầu với mảng rỗng
  const [message, setMessage] = useState(
    "Nhập 3 nguyên liệu bạn có hoặc nhấn NGẪU NHIÊN để bắt đầu khám phá!"
  );
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    const hasInput = ingredients.some((ing) => ing.trim() !== "");
    if (!hasInput) {
      setMessage("Vui lòng nhập ít nhất một nguyên liệu để tìm kiếm.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const data = await mockFetchRecipes(false);
    setRecipes(data);

    setMessage(
      `Đã tìm thấy ${data.length} công thức tối ưu cho nguyên liệu của bạn! (Mock)`
    );
    setIsLoading(false);
  };

  const handleRandom = async () => {
    setIsLoading(true);
    setIsError(false);

    const data = await mockFetchRecipes(true);
    setRecipes(data);
    setMessage("Món ngẫu nhiên đã được chọn! Chúc bạn ngon miệng. (Mock)");
    setIsLoading(false);
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  }; // Sử dụng `FilterScreen` để mở bộ lọc

  const handleOpenFilter = () => {
    navigation.navigate("Filter");
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
      <View style={styles.headerContainer}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Khám Phá Công Thức</Text>
        <TouchableOpacity onPress={handleOpenFilter} style={styles.headerIcon}>
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.tagline}>
            Chọn 3 nguyên liệu, Tìm kiếm Công thức tối giản!
          </Text>
          {/* Phần InputSection (Cần cập nhật style cho các component con) */}
          <InputSection
            ingredients={ingredients}
            onIngredientChange={handleIngredientChange}
            onSearch={handleSearch}
            onRandom={handleRandom} // Thêm props style mới nếu cần cho InputSection
            buttonColor={PRIMARY_BLUE}
            randomColor={ACCENT_RED}
          />
          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>
            Kết quả tìm kiếm
          </Text>
          {/* Loading/Message Area */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />

              <Text style={styles.loadingText}>
                Đang tìm kiếm... Vui lòng chờ
              </Text>
            </View>
          )}

          {!isLoading && (
            <View>
              {message && (
                <Text
                  style={[
                    styles.messageArea,
                    isError ? styles.errorText : styles.successText,
                  ]}
                >
                  {message}
                </Text>
              )}

              <View style={styles.recipeResults}>
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() =>
                      navigation.navigate("RecipeDetail", { recipe: recipe })
                    }
                  />
                ))}

                {recipes.length === 0 && !isError && (
                  <Text style={styles.noResultsText}>
                    Hãy tìm kiếm một công thức hoặc nhấn "Ngẫu nhiên" để xem đề
                    xuất!
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
  container: { paddingHorizontal: 20, paddingBottom: 40 }, // --- HEADER (Đồng bộ) ---

  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerIcon: {
    padding: 5,
    right: 20,
    position: "absolute",
  },

  tagline: {
    fontSize: 16,
    textAlign: "center",
    color: TEXT_DARK,
    marginTop: 20,
    marginBottom: 25,
    fontWeight: "500",
  }, // --- SECTION TITLE (Đồng bộ) ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
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
  },
  errorText: {
    color: ACCENT_RED,
    backgroundColor: "#FADBD8",
    borderWidth: 1,
    borderColor: "#E6B0AA",
  },
  successText: {
    color: "#2ECC71",
    backgroundColor: "#D4EFDF",
    borderWidth: 1,
    borderColor: "#A9DFBF",
  },
  recipeResults: { marginTop: 5 },
  noResultsText: {
    textAlign: "center",
    color: "#7F8C8D",
    marginTop: 30,
    fontSize: 16,
    fontStyle: "italic",
  },
});
