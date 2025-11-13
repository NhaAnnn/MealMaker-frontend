import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useUserUpdateAPI } from "../hook/useUsers";

// --- Colors ---
const PRIMARY_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACTIVE_COLOR = "#D35400";
const BORDER_COLOR = "#A0704C";
const BUTTON_COLOR = "#886B47";

// --- Dữ liệu Sở thích được phân loại theo CHỦ ĐỀ (THEME) ---
const THEME_PREFERENCES = [
  // --- CARD 1: KHU VỰC ẨM THỰC (region) ---
  {
    theme: "VĂN HÓA ẨM THỰC 🌍",
    description: "Bạn yêu thích hương vị của khu vực nào? (Chọn nhiều)",
    key: "region",
    tags: [
      { name: "Việt Nam", value: "Vietnam", icon: "flag-outline" },
      { name: "Châu Á (Khác)", value: "Asia", icon: "restaurant-outline" },
      { name: "Châu Âu (Âu/Mỹ)", value: "Europe", icon: "pizza-outline" },
      { name: "Mỹ Latinh", value: "Latinh", icon: "bonfire-outline" },
      { name: "Địa Trung Hải", value: "Mediterranean", icon: "sunny-outline" },
    ],
    singleSelection: false,
  },

  // --- CARD 2: MÓN ĂN ĐẶC TRƯNG (favorite_dishes) ---
  {
    theme: "MÓN ĂN ĐẶC TRƯNG 🍜",
    description: "Món ăn nào bạn luôn muốn thưởng thức hoặc nấu? (Chọn nhiều)",
    key: "favorite_dishes",
    tags: [
      { name: "Phở", value: "Pho", icon: "bowl-outline" },
      { name: "Bánh Mì", value: "BanhMi", icon: "baguette-outline" },
      { name: "Sushi", value: "Sushi", icon: "fish-outline" },
      { name: "Pizza", value: "Pizza", icon: "american-pizza-slice-outline" },
      { name: "Burger", value: "Burger", icon: "fast-food-outline" },
      { name: "Salad/Rau củ", value: "Salad", icon: "leaf-outline" },
    ],
    singleSelection: false,
  },

  // --- CARD 3: NGUYÊN LIỆU CHÍNH (favorite_ingredients) ---
  {
    theme: "NGUYÊN LIỆU CHÍNH PHẢI CÓ 🥩",
    description:
      "Các nguyên liệu chính nào không thể thiếu trong bếp của bạn? (Chọn nhiều)",
    key: "favorite_ingredients",
    tags: [
      { name: "Thịt Gà", value: "Chicken", icon: "egg-outline" },
      { name: "Thịt Bò", value: "Beef", icon: "color-fill-outline" },
      { name: "Hải Sản", value: "Seafood", icon: "fish-outline" },
      { name: "Trứng", value: "Eggs", icon: "egg-outline" },
      { name: "Cà Rốt", value: "Carrot", icon: "leaf-outline" },
      { name: "Gạo/Bún/Mì", value: "Rice/Noodles", icon: "cube-outline" },
      { name: "Khoai Tây", value: "Potato", icon: "cube-outline" },
    ],
    singleSelection: false,
  },

  // --- CARD 4: CHẾ ĐỘ ĂN (diet) ---
  {
    theme: "CHẾ ĐỘ ĂN KIÊNG 🥕",
    description: "Bạn đang theo đuổi chế độ ăn kiêng nào? (Chọn nhiều)",
    key: "diet",
    tags: [
      { name: "Thuần chay", value: "Vegan", icon: "leaf-outline" },
      { name: "Ăn chay", value: "Vegetarian", icon: "nutrition-outline" },
      { name: "Không Gluten", value: "Gluten-Free", icon: "ban-outline" },
      { name: "Low Carb", value: "Low-Carb", icon: "water-outline" },
      { name: "High Protein", value: "High-Protein", icon: "barbell-outline" },
    ],
    singleSelection: false,
  },

  // --- CARD 5: KỸ NĂNG NẤU NƯỚNG (cooking_skill_level) ---
  {
    theme: "KỸ NĂNG NẤU NƯỚNG 🧑‍🍳",
    description: "Cấp độ nấu nướng của bạn là gì? (Chọn một)",
    key: "cooking_skill_level",
    tags: [
      { name: "Sơ cấp (1)", value: 1, icon: "sad-outline" },
      { name: "Trung bình (2)", value: 2, icon: "happy-outline" },
      { name: "Nâng cao (3)", value: 3, icon: "star-outline" },
      { name: "Chuyên gia (4)", value: 4, icon: "medal-outline" },
    ],
    singleSelection: true,
  },
];

// Component cho một thẻ (Tag)
const ThemeTag = ({ tag, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.tagButton,
      isSelected ? styles.tagButtonActive : styles.tagButtonInactive,
    ]}
    onPress={onPress}
  >
    <Ionicons
      name={tag.icon}
      size={18}
      color={isSelected ? "#fff" : TEXT_DARK}
      style={{ marginRight: 8 }}
    />
    <Text
      style={[
        styles.tagText,
        isSelected ? styles.tagTextActive : styles.tagTextInactive,
      ]}
    >
      {tag.name}
    </Text>
  </TouchableOpacity>
);

export default function HabitCollectionScreen() {
  const navigation = useNavigation();
  // useUserUpdateAPI phải được cập nhật như hướng dẫn ở trên (Mục 1)
  const { updateLoading, completeHabitCollection } = useUserUpdateAPI();

  const [preferences, setPreferences] = useState({});

  const toggleTag = (themeKey, tagValue, isSingleSelection) => {
    setPreferences((prevPrefs) => {
      const currentTags = prevPrefs[themeKey] || [];
      let newTags;

      if (isSingleSelection) {
        newTags = currentTags.includes(tagValue) ? [] : [tagValue];
      } else {
        if (currentTags.includes(tagValue)) {
          newTags = currentTags.filter((tag) => tag !== tagValue);
        } else {
          newTags = [...currentTags, tagValue];
        }
      }

      if (isSingleSelection && typeof tagValue === "number") {
        newTags = newTags.length > 0 ? [tagValue] : [];
      }

      return {
        ...prevPrefs,
        [themeKey]: newTags,
      };
    });
  };

  const totalSelected = Object.values(preferences).flat().length;

  const handleSubmit = async () => {
    if (updateLoading) return;

    // --- KIỂM TRA ĐIỀU KIỆN TỐI THIỂU ---
    if ((preferences.region?.length || 0) === 0) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn ít nhất một khu vực ẩm thực yêu thích."
      );
      return;
    }
    if ((preferences.cooking_skill_level?.length || 0) !== 1) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn cấp độ kỹ năng nấu nướng của bạn (chọn duy nhất một)."
      );
      return;
    }

    // --- TẠO PAYLOAD API MỚI (CHỈ GỒM DỮ LIỆU) ---
    // Đảm bảo cooking_skill_level là giá trị số duy nhất
    const cookingLevel = preferences.cooking_skill_level?.[0] || 2;

    // CHỈ GỬI BODY DỮ LIỆU CẦN THIẾT
    const aiProfilePayload = {
      region: preferences.region || [],
      favorite_dishes: preferences.favorite_dishes || [],
      favorite_ingredients: preferences.favorite_ingredients || [],
      diet: preferences.diet || [],
      cooking_skill_level: cookingLevel,
    };

    console.log("AI Profile Payload (Chỉ dữ liệu):", aiProfilePayload);

    try {
      // Gọi API. Hook sẽ tự thêm completed: true và timestamp.
      await completeHabitCollection(aiProfilePayload);

      Alert.alert(
        "Tuyệt vời!",
        `Đã lưu hồ sơ AI của bạn. Hãy bắt đầu khám phá!`
      );

      // Nếu AuthContext đã cập nhật, navigation.replace là không cần thiết
      // nhưng có thể giữ lại như một fallback.
      navigation.replace("MainTabs");
    } catch (error) {
      console.error("Lỗi khi gửi hồ sơ AI:", error);
    }
  };

  // --- RENDER (Không thay đổi) ---
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>✨ Thiết lập Hồ sơ Cá nhân</Text>
        <Text style={styles.subHeader}>
          Chọn các thẻ sở thích phù hợp nhất với bạn. Đây là bước quan trọng để
          cá nhân hóa gợi ý công thức.
        </Text>

        {THEME_PREFERENCES.map((themeItem) => (
          <View key={themeItem.key} style={styles.themeContainer}>
            <Text style={styles.themeTitle}>{themeItem.theme}</Text>
            <Text style={styles.themeDescription}>{themeItem.description}</Text>

            <View style={styles.tagsWrapper}>
              {themeItem.tags.map((tag) => (
                <ThemeTag
                  key={tag.value}
                  tag={tag}
                  isSelected={(preferences[themeItem.key] || []).includes(
                    tag.value
                  )}
                  onPress={() =>
                    toggleTag(
                      themeItem.key,
                      tag.value,
                      themeItem.singleSelection
                    )
                  }
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={updateLoading}
        >
          {updateLoading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginRight: 10 }}
            />
          ) : (
            <Ionicons name="save-outline" size={20} color="#fff" />
          )}

          <Text style={styles.submitButtonText}>
            {updateLoading
              ? "Đang Lưu..."
              : `Lưu Hồ sơ & Bắt đầu (${totalSelected} đã chọn)`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// --- STYLES (Giữ nguyên) ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  container: {
    padding: 20,
    paddingBottom: 50,
    top: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: PRIMARY_BLUE,
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 30,
    lineHeight: 24,
  },
  themeContainer: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderLeftWidth: 5,
    borderLeftColor: BORDER_COLOR,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: PRIMARY_BLUE,
    marginBottom: 5,
  },
  themeDescription: {
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 15,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  tagButtonInactive: {
    backgroundColor: BACKGROUND_LIGHT,
    borderColor: "#D0C0B0",
  },
  tagButtonActive: {
    backgroundColor: ACTIVE_COLOR,
    borderColor: ACTIVE_COLOR,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tagTextInactive: {
    color: TEXT_DARK,
  },
  tagTextActive: {
    color: "#fff",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BUTTON_COLOR,
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    shadowColor: BUTTON_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
