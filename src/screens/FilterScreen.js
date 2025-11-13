import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// --- Define MODERN BLUE colors ---
const PRIMARY_BLUE = "#AB9574"; // Bright Blue (Primary color)
const DARK_BLUE = "#3D2C1C"; // Dark Blue for Header
const BACKGROUND_LIGHT = "#F9EBD7"; // Very Light Gray Background
const TEXT_DARK = "#2C3E50"; // Dark Gray Text
const ACCENT_GREEN = "#D9B263"; // Accent color for Tags

// Component for Filter Option (Kept in English for consistency)
const FilterOption = ({ title, options, selected, onSelect }) => (
  <View style={styles.filterGroup}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionPill,
            selected.includes(option) && { backgroundColor: ACCENT_GREEN },
            selected.includes(option) && { borderColor: ACCENT_GREEN },
          ]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.optionText,
              selected.includes(option) && { color: "#fff" },
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function FilterScreen({ navigation }) {
  const [selectedFilters, setSelectedFilters] = useState({
    cuisine: [],
    time: [],
    difficulty: [],
  });

  // Dịch các tùy chọn lọc
  const filterData = {
    cuisine: [
      "Vietnamese", // Việt Nam
      "Japanese", // Nhật Bản
      "Korean", // Hàn Quốc
      "Italian", // Ý
      "Thai", // Thái Lan
      "European", // Âu
      "Other", // Khác
    ],
    time: ["< 15 min", "15 - 30 min", "30 - 60 min", "> 60 min"], // Thời gian nấu
    difficulty: ["Easy", "Medium", "Hard"], // Độ khó
  };

  const handleSelect = (category, option) => {
    setSelectedFilters((prev) => {
      const current = prev[category];

      // Logic for multi-select (allows multiple options per category)
      if (current.includes(option)) {
        return {
          ...prev,
          [category]: current.filter((item) => item !== option),
        };
      } else {
        return { ...prev, [category]: [...current, option] };
      }
    });
  };

  const handleApply = () => {
    console.log("Applying filters:", selectedFilters);
    // Logic navigation and applying filters
    // Chuyển hướng đến màn hình Explore (đã dịch từ Khám Phá)
    navigation.navigate("Explore", { filters: selectedFilters });
  };

  const handleReset = () => {
    setSelectedFilters({ cuisine: [], time: [], difficulty: [] });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      <View
        style={[styles.headerContainer, { paddingTop: 15, paddingBottom: 15 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        {/* Dịch: Bộ Lọc Công Thức */}
        <Text style={styles.headerTitle}>Recipe Filters</Text>
        <TouchableOpacity onPress={handleReset}>
          {/* Dịch: Đặt lại */}
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Dịch: Chọn các tiêu chí... */}
          <Text style={styles.sectionDescription}>
            Select criteria to refine your search results.
          </Text>

          <View style={styles.card}>
            <FilterOption
              // Dịch: Quốc gia/Vùng miền
              title="Cuisine/Region"
              options={filterData.cuisine}
              selected={selectedFilters.cuisine}
              onSelect={(option) => handleSelect("cuisine", option)}
            />

            <FilterOption
              // Dịch: Thời gian nấu
              title="Cooking Time"
              options={filterData.time}
              selected={selectedFilters.time}
              onSelect={(option) => handleSelect("time", option)}
            />

            <FilterOption
              // Dịch: Độ khó
              title="Difficulty"
              options={filterData.difficulty}
              selected={selectedFilters.difficulty}
              onSelect={(option) => handleSelect("difficulty", option)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Apply Button Fixed at the bottom - APPLY PADDING BOTTOM FROM INSETS */}
      <View style={[styles.footer, { paddingBottom: +20 }]}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: PRIMARY_BLUE }]}
          onPress={handleApply}
        >
          {/* Dịch: Áp Dụng Bộ Lọc */}
          <Text style={styles.applyButtonText}>Apply Filters</Text>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#fff"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollContent: { paddingBottom: 100 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // --- Header (Safe Area fix applied inline) ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  resetText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionDescription: {
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 20,
  },
  // --- Filter Card ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  filterGroup: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  // --- Footer/Apply Button (Safe Area fix applied inline) ---
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
