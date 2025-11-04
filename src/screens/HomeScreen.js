import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Import các component cần thiết
import RecipeCard from "../components/RecipeCard";
import { mockRecipes } from "../mockData";

// --- Định nghĩa màu sắc MODERN BLUE ---
const PRIMARY_BLUE = "#007AFF"; // Xanh Dương Sáng (Màu chủ đạo)
const DARK_BLUE = "#003A70"; // Xanh Đậm cho Header
const BACKGROUND_LIGHT = "#F0F3F6"; // Nền Xám Rất Nhạt
const TEXT_DARK = "#2C3E50"; // Xám Đậm

// Component cho các nút chức năng nhỏ trong card
const MiniActionButton = ({ iconName, title, onPress, color }) => (
  <TouchableOpacity style={styles.miniActionButton} onPress={onPress}>
    <View style={[styles.miniIconContainer, { backgroundColor: color + "15" }]}>
      <Ionicons name={iconName} size={24} color={color} />
    </View>
    <Text style={[styles.miniButtonText, { color: TEXT_DARK }]}>{title}</Text>
  </TouchableOpacity>
);

// Component SearchBar Placeholder
const SearchBarPlaceholder = ({ onPress }) => (
  <TouchableOpacity style={styles.searchBar} onPress={onPress}>
    <Ionicons name="search" size={20} color="#AAB7B8" />
    <Text style={styles.searchBarText}>Tìm kiếm công thức đơn giản...</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation(); // Lấy 3 công thức đầu tiên làm đề xuất

  const featuredRecipes = mockRecipes.slice(0, 3);

  // Dữ liệu cho các chức năng trong Action Card nổi
  const actionItems = [
    {
      title: "Tủ Lạnh",
      iconName: "cube-outline",
      color: "#09FF00",
      screen: "Fridge",
    },
    {
      title: "Bộ Lọc",
      iconName: "options-outline",
      color: "#3498DB",
      screen: "Filter",
    },
    {
      title: "Yêu thích",
      iconName: "heart-outline",
      color: "#FF0505",
      screen: "Favorites",
    },
    {
      title: "Lên Kế Hoạch",
      iconName: "calendar-outline",
      color: "#F1C40F",
      screen: "PlanScreen",
    },
  ];

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
      {/* <View style={styles.headerContainer}>
        <Text style={styles.logoText}>MINIMALIST MEAL MAKER</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons
              name="search"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View> */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.topSection}>
            <Text style={styles.greetingTitle}>
              Chào mừng trở lại! 12345678
            </Text>
            <Text style={styles.greetingTitle}>
              Chào mừng trở lại! 12345678
            </Text>
            {/* Card Nổi Chứa 4 Action Buttons */}
            <View style={styles.actionCardContainer}>
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
          </View>
          {/* Thanh tìm kiếm */}
          <View style={styles.bottomContainer}>
            <View style={styles.searchBarWrapper}>
              <SearchBarPlaceholder
                onPress={() => navigation.navigate("Khám Phá")}
              />
            </View>

            <Text
              style={[styles.sectionTitle, { color: TEXT_DARK, marginTop: 15 }]}
            >
              🍜 Gợi ý công thức nhanh
            </Text>

            <View style={styles.recipeList}>
              {featuredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() =>
                    navigation.navigate("RecipeDetail", {
                      recipe: recipe,
                    })
                  }
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.seeMoreButton, { backgroundColor: PRIMARY_BLUE }]}
              onPress={() => navigation.navigate("Khám Phá")}
            >
              <Text style={styles.seeMoreButtonText}>Xem thêm công thức</Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#fff"
                style={{ marginLeft: 5 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 60, paddingTop: 0 },
  container: {
    paddingHorizontal: 0,
    paddingTop: 10,
  },
  bottomContainer: {
    padding: 20,
  },
  // --- HEADER (Mới) ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    // borderBottomLeftRadius: 15,
    // borderBottomRightRadius: 15,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  // --- TOP SECTION (Chứa Greeting và Card Nổi) ---
  topSection: {
    marginTop: -20, // Kéo lên để che bớt khoảng trắng
    backgroundColor: DARK_BLUE,
    padding: 20,
    paddingBottom: 70, // Đẩy xuống cho card nổi
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    marginTop: 10,
  },

  // --- CARD NỔI (ACTION GRID) ---
  actionCardContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    position: "absolute", // Card nổi
    top: 150, // Vị trí nằm dưới header
    left: 20,
    right: 20,
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
    width: "25%", // 4 cột
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

  // --- SearchBar (Dưới Card Nổi) ---
  searchBarWrapper: {
    paddingTop: 80, // Khoảng cách bù cho card nổi
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
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
    color: "#AAB7B8",
    fontSize: 15,
    fontWeight: "500",
  }, // --- Công thức Đề xuất ---

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
    paddingLeft: 10,
  },
  recipeList: {
    // Style cho danh sách công thức
  }, // --- Nút Xem thêm ---

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
