import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// --- Định nghĩa màu sắc MODERN BLUE ---
const PRIMARY_BLUE = "#007AFF";
const DARK_BLUE = "#003A70";
const BACKGROUND_LIGHT = "#F0F3F6";
const TEXT_DARK = "#2C3E50";
const ACCENT_GREEN = "#2ECC71"; // Màu nhấn cho Filter (đồng bộ với HomeScreen)

// Component cho Filter Option
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

  const filterData = {
    cuisine: [
      "Việt Nam",
      "Nhật Bản",
      "Hàn Quốc",
      "Ý",
      "Thái Lan",
      "Âu",
      "Khác",
    ],
    time: ["< 15 phút", "15 - 30 phút", "30 - 60 phút", "> 60 phút"],
    difficulty: ["Dễ", "Trung Bình", "Khó"],
  };

  const handleSelect = (category, option) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
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
    // Logic điều hướng và áp dụng bộ lọc (ví dụ: quay lại màn Khám Phá)
    navigation.navigate("Khám Phá", { filters: selectedFilters });
  };

  const handleReset = () => {
    setSelectedFilters({ cuisine: [], time: [], difficulty: [] });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* Header đồng bộ */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bộ Lọc Công Thức</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Đặt lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.sectionDescription}>
            Chọn các tiêu chí để tinh chỉnh kết quả tìm kiếm của bạn.
          </Text>

          <View style={styles.card}>
            <FilterOption
              title="Quốc gia/Vùng miền"
              options={filterData.cuisine}
              selected={selectedFilters.cuisine}
              onSelect={(option) => handleSelect("cuisine", option)}
            />

            <FilterOption
              title="Thời gian nấu"
              options={filterData.time}
              selected={selectedFilters.time}
              onSelect={(option) => handleSelect("time", option)}
            />

            <FilterOption
              title="Độ khó"
              options={filterData.difficulty}
              selected={selectedFilters.difficulty}
              onSelect={(option) => handleSelect("difficulty", option)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Nút Áp dụng Cố định ở cuối màn hình */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: PRIMARY_BLUE }]}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Áp Dụng Bộ Lọc</Text>
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
  scrollContent: { paddingBottom: 20 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // --- Header ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 60,
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
  // --- Footer/Apply Button ---
  footer: {
    padding: 20,
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
