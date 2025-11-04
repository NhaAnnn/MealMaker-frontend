import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";

const AboutScreen = () => {
  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>🍲 Minimalist Meal Maker</Text>
        <Text style={styles.version}>Phiên bản 1.0 (MVP)</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về ứng dụng</Text>
          <Text style={styles.contentText}>
            Ứng dụng được xây dựng với mục tiêu giúp bạn giải quyết vấn đề "Hôm
            nay ăn gì?" một cách tối giản nhất. Chỉ cần nhập tối đa 3 nguyên
            liệu sẵn có, ứng dụng sẽ đề xuất các công thức tối ưu, nhanh chóng
            và ít lãng phí.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng dẫn sử dụng</Text>
          <Text style={styles.stepText}>1. Vào tab Trang Chủ.</Text>
          <Text style={styles.stepText}>
            2. Nhập tối đa 3 nguyên liệu bạn có.
          </Text>
          <Text style={styles.stepText}>
            3. Nhấn "Tìm công thức" hoặc "Random".
          </Text>
          <Text style={styles.stepText}>
            4. Chọn món ăn để xem hướng dẫn chi tiết.
          </Text>
        </View>

        <Text style={styles.footer}>© 2025 Minimalist Dev Team.</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: 20, alignItems: "center" },
  logo: { fontSize: 26, fontWeight: "900", color: "#E74C3C", marginBottom: 10 },
  version: { fontSize: 14, color: "#95A5A6", marginBottom: 30 },

  section: { width: "100%", marginBottom: 25, paddingHorizontal: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#34495E",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  contentText: { fontSize: 15, color: "#34495E", lineHeight: 22 },
  stepText: { fontSize: 15, color: "#2C3E50", marginBottom: 5 },

  footer: { marginTop: 40, fontSize: 13, color: "#BDC3C7" },
});

export default AboutScreen;
