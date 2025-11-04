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
const ACCENT_YELLOW = "#F1C40F"; // Màu nhấn cho Plan (đồng bộ với HomeScreen)

// Dữ liệu giả lập cho Kế hoạch bữa ăn
const initialPlan = [
  { day: "Thứ Hai", meal: "Phở Gà", color: PRIMARY_BLUE },
  { day: "Thứ Ba", meal: "Cơm rang dưa bò", color: ACCENT_YELLOW },
  { day: "Thứ Tư", meal: "Canh chua cá lóc", color: "#2ECC71" },
  { day: "Thứ Năm", meal: "Mì Ý sốt cà chua", color: "#E74C3C" },
  { day: "Thứ Sáu", meal: "Lẩu nấm chay", color: PRIMARY_BLUE },
  { day: "Thứ Bảy", meal: "Pizza tự làm", color: ACCENT_YELLOW },
  { day: "Chủ Nhật", meal: "Nghỉ ngơi - Ăn ngoài", color: "#7F8C8D" },
];

const PlanItem = ({ day, meal, color, onEdit }) => (
  <View style={styles.planItem}>
    <View style={[styles.dayIndicator, { backgroundColor: color }]} />
    <View style={styles.planContent}>
      <Text style={styles.planDay}>{day}</Text>
      <Text style={styles.planMeal}>{meal}</Text>
    </View>
    <TouchableOpacity onPress={onEdit} style={styles.editButton}>
      <Ionicons name="create-outline" size={20} color={PRIMARY_BLUE} />
    </TouchableOpacity>
  </View>
);

export default function PlanScreen({ navigation }) {
  const [mealPlan, setMealPlan] = useState(initialPlan);

  const handleEdit = (day) => {
    // Đây sẽ là logic mở modal hoặc điều hướng đến màn hình chỉnh sửa chi tiết
    alert(`Chỉnh sửa kế hoạch cho ${day}`);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* Header đồng bộ */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kế Hoạch Bữa Ăn</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="share-social-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Thẻ Tổng quan */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Kế Hoạch Bữa Ăn Tuần Này</Text>
            <Text style={styles.summarySubtitle}>Từ Thứ Hai đến Chủ Nhật</Text>
            <View style={styles.summaryAction}>
              <Ionicons
                name="sync-circle-outline"
                size={20}
                color={PRIMARY_BLUE}
              />
              <Text style={styles.summaryActionText}>Tạo danh sách đi chợ</Text>
            </View>
          </View>

          {/* Danh sách Kế hoạch */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
            Chi tiết theo ngày
          </Text>
          <View style={styles.card}>
            {mealPlan.map((item, index) => (
              <PlanItem
                key={index}
                day={item.day}
                meal={item.meal}
                color={item.color}
                onEdit={() => handleEdit(item.day)}
              />
            ))}
          </View>

          {/* Nút Tự động tạo */}
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: ACCENT_YELLOW }]}
            onPress={() => alert("Tạo kế hoạch tự động...")}
          >
            <Ionicons name="bulb-outline" size={20} color={TEXT_DARK} />
            <Text style={styles.generateButtonText}>
              Gợi ý & Tự động tạo kế hoạch
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollContent: { paddingBottom: 40 },
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
  headerIcon: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
    paddingLeft: 10,
  },
  // --- Summary Card ---
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_YELLOW,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 15,
    color: "#7F8C8D",
    marginBottom: 15,
  },
  summaryAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  summaryActionText: {
    marginLeft: 10,
    color: PRIMARY_BLUE,
    fontWeight: "700",
  },
  // --- Plan List Card ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  planItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  dayIndicator: {
    width: 6,
    height: "100%",
    borderRadius: 3,
    marginRight: 15,
  },
  planContent: {
    flex: 1,
  },
  planDay: {
    fontSize: 14,
    fontWeight: "500",
    color: PRIMARY_BLUE,
  },
  planMeal: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_DARK,
    marginTop: 2,
  },
  editButton: {
    padding: 5,
  },
  // --- Footer Button ---
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  generateButtonText: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 10,
  },
});
