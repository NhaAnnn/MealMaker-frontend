import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ⭐ ĐÃ KHÔI PHỤC IMPORTS GỐC ⭐
import { useRecipes } from "../hook/useRecipes";
import RecipeCard from "../components/RecipeCard";

// --- Theme colors (Dùng màu bạn cung cấp) ---
const PRIMARY_BLUE = "#AB9574";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACCENT_GREEN = "#D9B263"; // Dùng cho nút chính (Search)

// --- Filter Data (Giữ nguyên) ---
const NEW_FILTER_DATA = {
  meal_type: {
    title: "Meal Type 🍽️",
    tags: [
      { label: "Breakfast", value: "breakfast" },
      { label: "Lunch", value: "lunch" },
      { label: "Dinner", value: "dinner" },
      { label: "Snack", value: "snack" },
      { label: "Starter", value: "starter" },
      { label: "Dessert", value: "dessert" },
      { label: "Side Dish", value: "side" },
    ],
  },
  dietary: {
    title: "Dietary 🥕",
    tags: [
      { label: "Vegan", value: "vegan" },
      { label: "Vegetarian", value: "vegetarian" },
      { label: "Pescatarian", value: "pescatarian" },
      { label: "Gluten-Free", value: "gluten-free" },
      { label: "Low Carb", value: "low-carb" },
      { label: "High Protein", value: "protein" },
      { label: "Healthy", value: "healthy" },
      { label: "Light", value: "light" },
    ],
  },
  cuisine: {
    title: "Cuisine 🌍",
    tags: [
      { label: "Italian", value: "italian" },
      { label: "Asian", value: "asian" },
      { label: "Mexican", value: "mexican" },
    ],
  },
  properties: {
    title: "Properties & Method 🌶️",
    tags: [
      { label: "Quick", value: "quick" },
      { label: "Spicy", value: "spicy" },
      { label: "Sweet", value: "sweet" },
      { label: "Sweet-Savory", value: "sweet-savory" },
      { label: "Creamy", value: "creamy" },
      { label: "Comfort Food", value: "comfort" },
      { label: "Soup", value: "soup" },
      { label: "Baked/Oven", value: "baked" },
      { label: "Salad", value: "salad" },
      { label: "Seafood", value: "seafood" },
      { label: "Family", value: "family" },
    ],
  },
  cooking_skill_level: {
    title: "Skill Level 🧑‍🍳 (Select 1)",
    tags: [
      { label: "Easy", value: 1 },
      { label: "Medium", value: 2 },
      { label: "Hard", value: 3 },
    ],
    singleSelection: true,
  },
};

// --- Filter Section Component (Giữ nguyên) ---
const FilterSection = ({
  title,
  options,
  selected,
  onSelect,
  categoryKey,
  singleSelection,
}) => (
  <View style={styles.filterGroup}>
    <Text style={styles.filterTitle}>{title}</Text>
    <View style={styles.pillsWrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={`${categoryKey}-${option.value}`}
            style={[styles.pill, isSelected && styles.pillActive]}
            onPress={() => onSelect(categoryKey, option.value, singleSelection)}
          >
            <Text
              style={[styles.pillText, isSelected && styles.pillTextActive]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// --- MAIN SCREEN ---
export default function FilterScreen({ navigation }) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [selectedFilters, setSelectedFilters] = useState({
    meal_type: [],
    dietary: [],
    cuisine: [],
    properties: [],
    cooking_skill_level: [],
  });

  const { isLoading, error, fetchRecipesByTags, setError } = useRecipes();
  const [hasSearched, setHasSearched] = useState(false); // Toggle Filter Selection
  const [recipes, setRecipes] = useState([]);
  const handleToggleFilter = (categoryKey, tagValue, isSingleSelection) => {
    if (error) setError(null);

    setSelectedFilters((prev) => {
      const current = prev[categoryKey] || [];
      let updated;

      if (isSingleSelection) {
        updated = current.includes(tagValue) ? [] : [tagValue];
      } else {
        updated = current.includes(tagValue)
          ? current.filter((x) => x !== tagValue)
          : [...current, tagValue];
      }

      return { ...prev, [categoryKey]: updated };
    });
  }; // Search Handler (Sẽ mở Modal sau khi tìm kiếm xong)

  const handleSearch = async () => {
    let tags = [];

    Object.entries(selectedFilters).forEach(([key, vals]) => {
      vals.forEach((v) => {
        tags.push(key === "cooking_skill_level" ? `difficulty:${v}` : v);
      });
    });

    setHasSearched(true);

    if (tags.length === 0) {
      setError("Please select at least one filter.");
      return;
    }

    console.log(tags);
    const response = await fetchRecipesByTags(tags, true);

    setRecipes(response || []);
    // Mở Modal sau khi tìm kiếm xong (dù có lỗi hay không, để hiển thị lỗi/kết quả)
    setIsModalVisible(true);
  }; // Reset Filters

  const handleReset = () => {
    setSelectedFilters({
      meal_type: [],
      dietary: [],
      cuisine: [],
      properties: [],
      cooking_skill_level: [],
    });
    setError(null);
    setHasSearched(false);
    setIsModalVisible(false);
  };

  const currentTagsCount = Object.values(selectedFilters).flat().length;

  const renderResultsInModal = () => {
    if (isLoading) {
      return (
        <View style={styles.modalMessageContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>Searching for recipes...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.modalMessageContainer}>
          <Ionicons name="warning-outline" size={50} color="#E3342F" />
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      );
    }

    if (recipes.length === 0) {
      return (
        <View style={styles.modalMessageContainer}>
          <Ionicons name="search-outline" size={60} color="#ccc" />
          <Text style={styles.messageText}>
            No recipes found for these filters.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={recipes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <RecipeCard
            key={item._id}
            recipe={item}
            onPress={() =>
              navigation.navigate("RecipeDetail", {
                recipeId: item._id,
              })
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={() => (
          <Text style={styles.resultsCountText}>
            Found **{recipes.length}** recipes
          </Text>
        )}
      />
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={23} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Filters</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.filterSection}>
        {Object.entries(NEW_FILTER_DATA).map(([key, data]) => (
          <FilterSection
            key={key}
            title={data.title}
            options={data.tags}
            selected={selectedFilters[key]}
            onSelect={handleToggleFilter}
            categoryKey={key}
            singleSelection={data.singleSelection}
          />
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearch}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={DARK_BLUE} />
        ) : (
          <Text style={styles.applyButtonText}>
            Search ({currentTagsCount})
          </Text>
        )}
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Results</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={28} color={DARK_BLUE} />
            </TouchableOpacity>
          </View>
          <View style={styles.resultsContainer}>{renderResultsInModal()}</View>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES (Giữ nguyên) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  resetText: { color: PRIMARY_BLUE, fontSize: 15, fontWeight: "600" },

  filterSection: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 150,
  },

  filterGroup: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e6dccc",
    elevation: 2,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 10,
  },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap" },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#F7F3EC",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D7CEBE",
  },

  pillActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },

  pillText: { fontSize: 13, color: "#6D6D6D", fontWeight: "600" },
  pillTextActive: { color: "#fff" },

  searchButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 14,
    backgroundColor: ACCENT_GREEN,
    borderRadius: 14,
    elevation: 4,
    zIndex: 10,
  },
  applyButtonText: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: DARK_BLUE,
  },
  // ----------------------------------------------------
  // STYLES CHO MODAL VÀ KẾT QUẢ
  // ----------------------------------------------------

  modalView: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: DARK_BLUE,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  resultsCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 10,
    paddingHorizontal: 5,
  },

  // ----------------------------------------------------
  // STYLES CHUNG CHO MESSAGE
  // ----------------------------------------------------
  modalMessageContainer: {
    alignItems: "center",
    paddingTop: 50,
  },
  messageText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  loadingText: { color: PRIMARY_BLUE, marginTop: 10 },
  errorText: { color: "#B3261E", fontSize: 16, fontWeight: "600" },
});
