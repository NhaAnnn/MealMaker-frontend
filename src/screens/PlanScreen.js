import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

// Import AuthContext để lấy userData, userId, fetchUserData và processResponse
import { useAuth } from "../components/AuthContext";
import { useUserUpdateAPI } from "../hook/useUsers";

// --- Cấu hình API ---
const AI_SERVICE_URL = "https://mealmaker-ai-production.up.railway.app/";
const AI_RECOMMENDATION_ENDPOINT = "get-recommendations-ai";

// --- Colors ---
const PRIMARY_ACCENT = "#AB9574";
const PRIMARY_LIGHT = "#E0D7C9";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#3D2C1C";
const TEXT_MUTED = "#9A9A9A"; // Màu mới cho ngày đã qua
const ACTION_GREEN = "#27AE60";
const BUTTON_GRAY = "#F0F0F0";

// --- Cấu hình ngày và màu sắc ---
const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayColors = {
  monday: "#6AA84F",
  tuesday: "#E67E22",
  wednesday: "#3498DB",
  thursday: "#9B59B6",
  friday: "#C0392B",
  saturday: "#7F8C8D",
  sunday: "#3D2C1C",
};

/**
 * Hàm Helper để xác định ngày hiện tại trong tuần (dạng chữ thường)
 * Ví dụ: 'monday', 'tuesday', 'sunday'
 */
const getCurrentDayOfWeek = () => {
  const date = new Date();
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Điều chỉnh để bắt đầu từ Monday
  const index = dayIndex === 0 ? 6 : dayIndex - 1;
  return DAYS_OF_WEEK[index];
};

// Component riêng cho mỗi bữa ăn, có thể nhấn vào
const MealTouchableItem = ({ meal, color, onPress, isPastDay }) => {
  const canNavigate = meal.recipe_id !== undefined && meal.recipe_id !== null;
  const textStyle = [
    styles.planMealText,
    canNavigate && { color: TEXT_DARK, fontWeight: "600" },
    isPastDay && { color: TEXT_MUTED, textDecorationLine: "line-through" }, // Hiệu ứng ngày đã qua
  ];

  const content = (
    <>
      {/* Dấu chấm/Bullet point */}
      <View
        style={[
          styles.bulletPoint,
          { backgroundColor: isPastDay ? TEXT_MUTED : color },
        ]}
      />

      {/* Icon (Optional) */}
      <Ionicons
        name="restaurant-outline"
        size={14}
        color={isPastDay ? TEXT_MUTED : TEXT_DARK}
        style={{ marginRight: 6 }}
      />

      {/* Tên bữa ăn */}
      <Text style={textStyle}>{meal.name}</Text>

      {/* Mũi tên dẫn hướng (chỉ hiển thị nếu có thể nhấn) */}
      {canNavigate && (
        <Ionicons
          name="chevron-forward-outline"
          size={16}
          color={isPastDay ? TEXT_MUTED : PRIMARY_ACCENT}
          style={{ marginLeft: "auto" }}
        />
      )}
    </>
  );

  if (!canNavigate || isPastDay) {
    return <View style={[styles.planMealItem, { flex: 1 }]}>{content}</View>;
  }

  return (
    <TouchableOpacity
      style={[styles.planMealItem, styles.mealTouchable, { flexGrow: 1 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

// Cập nhật PlanItem để nhận prop isPastDay
const PlanItem = ({
  day,
  meals,
  color,
  onViewShoppingList,
  onViewRecipeDetail,
  isLast,
  isPastDay, // ⭐ PROP MỚI ⭐
}) => {
  // Độ mờ cho toàn bộ khung nếu là ngày đã qua
  const opacityStyle = isPastDay ? { opacity: 0.5 } : {};

  return (
    <View
      style={[
        styles.planItem,
        isLast && { borderBottomWidth: 0 },
        opacityStyle,
      ]}
    >
      {/* Left Content: Day & Meals */}
      <View style={styles.leftContent}>
        {/* Day Header */}
        <View style={styles.dayHeader}>
          <View
            style={[
              styles.dayIndicator,
              { backgroundColor: isPastDay ? TEXT_MUTED : color },
            ]}
          />
          <Text
            style={[
              styles.planDay,
              { color: isPastDay ? TEXT_MUTED : TEXT_DARK },
            ]}
          >
            {day}
          </Text>
          {isPastDay && <Text style={styles.pastDayTag}> (Passed)</Text>}
        </View>

        {/* Meals Container */}
        <View style={styles.mealsListContainer}>
          {meals.map((meal, index) => (
            <MealTouchableItem
              key={meal.id || index}
              meal={meal}
              color={color}
              isPastDay={isPastDay} // ⭐ TRUYỀN PROP VÀO MEAL ITEM ⭐
              onPress={() => onViewRecipeDetail(meal)}
            />
          ))}
        </View>
      </View>

      {/* Actions Container */}
      <View style={styles.actionsContainer}>
        {/* View Shopping List Button */}
        <TouchableOpacity
          onPress={onViewShoppingList}
          style={[
            styles.actionButton,
            { backgroundColor: BUTTON_GRAY, borderRadius: 8, padding: 8 },
          ]}
          activeOpacity={0.7}
          disabled={isPastDay} // Vô hiệu hóa nút Shopping List cho ngày đã qua (tùy chọn)
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={isPastDay ? TEXT_MUTED : ACTION_GREEN}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function PlanScreen() {
  const navigation = useNavigation();
  const {
    userData,
    userId,
    isLoading: isAuthLoading,
    fetchUserData,
    // processResponse, // Không cần thiết
  } = useAuth();

  // ⭐ LẤY fetchWeeklyData TỪ HOOK useUserUpdateAPI ⭐
  const { fetchWeeklyData } = useUserUpdateAPI(userId);

  const [mealPlan, setMealPlan] = useState([]);
  const [isDataProcessing, setIsDataProcessing] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const tabBarHeight = useBottomTabBarHeight();
  const BOTTOM_PADDING_FIX = tabBarHeight + 40;

  // Lấy ngày hiện tại
  const currentDay = getCurrentDayOfWeek();

  // --- HÀM XỬ LÝ DỮ LIỆU WEEKLY MENU ---
  const processWeeklyMenu = useCallback(() => {
    if (!userData || !userData.weekly_menu) {
      setMealPlan([]);
      setIsDataProcessing(false);
      return;
    }

    const weeklyMenuData = userData.weekly_menu;
    const newMealPlan = [];

    // ⭐ LOGIC XÁC ĐỊNH NGÀY ĐÃ QUA ⭐
    const currentDayIndex = DAYS_OF_WEEK.indexOf(currentDay);

    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      const day = DAYS_OF_WEEK[i];
      const mealArray = weeklyMenuData[day];

      // Nếu ngày trong vòng lặp có index nhỏ hơn index của ngày hiện tại, nó là ngày đã qua.
      const isPastDay = i < currentDayIndex;

      if (!mealArray || mealArray.length === 0) continue;

      const mealsForDay = mealArray.map((meal, index) => {
        const uniqueId = `${day}_${index}`;

        return {
          name: meal.title,
          id: uniqueId,
          recipe_id: meal.recipe_id || null,
          ingredients_list: meal.ingredients_list,
          seasoning: meal.seasoning,
        };
      });

      if (mealsForDay.length > 0) {
        const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);

        newMealPlan.push({
          day: capitalizedDay,
          meals: mealsForDay,
          color: dayColors[day],
          isPastDay: isPastDay, // ⭐ TRUYỀN TRẠNG THÁI NGÀY ĐÃ QUA ⭐
        });
      }
    }

    setMealPlan(newMealPlan);
    setIsDataProcessing(false);
  }, [userData, currentDay]); // Thêm currentDay vào dependency array

  // --- useEffect: Kích hoạt xử lý dữ liệu khi userData thay đổi ---
  useEffect(() => {
    if (!isAuthLoading) {
      setIsDataProcessing(true);
      processWeeklyMenu();
    }
  }, [isAuthLoading, userData, processWeeklyMenu]);

  // --- HÀM CẬP NHẬT: GỌI API TẠO PLAN BẰNG AI THEO HAI BƯỚC ---
  const handleGeneratePlan = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại."
      );
      return;
    }

    // Cảnh báo AI Profile (Optional)
    if (
      !userData?.ai_profile ||
      (!userData.ai_profile.region?.length &&
        userData.ai_profile.cooking_skill_level === 0)
    ) {
      Alert.alert(
        "Hồ sơ AI chưa hoàn chỉnh",
        "Vui lòng hoàn thành hồ sơ sở thích ăn uống của bạn để AI có thể tạo kế hoạch phù hợp nhất.",
        [{ text: "OK" }]
      );
    }

    setIsGenerating(true);
    let generatedRecipeIds = [];

    try {
      // =========================================================
      // BƯỚC 1: GỌI API AI (GET) để lấy danh sách IDs
      // =========================================================
      const aiUrl = `${AI_SERVICE_URL}${AI_RECOMMENDATION_ENDPOINT}?userId=${userId}`;
      console.log(`B1: Calling AI recommendation API: ${aiUrl}`);

      const aiResponse = await fetch(aiUrl);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(
          `Lỗi từ dịch vụ AI (${aiResponse.status}): ${errorText}`
        );
      }

      const aiData = await aiResponse.json();

      if (Array.isArray(aiData) && aiData.length > 0) {
        generatedRecipeIds = aiData;
        console.log(
          "B1: Lấy thành công danh sách Recipe IDs:",
          generatedRecipeIds
        );
      } else {
        throw new Error("Dịch vụ AI không trả về danh sách công thức hợp lệ.");
      }

      // =========================================================
      // BƯỚC 2: GỌI API Backend (POST) để tạo Weekly Menu
      // =========================================================

      console.log(`B2: Calling Backend generate API...`);

      const response = await fetchWeeklyData(generatedRecipeIds);

      // =========================================================
      // BƯỚC 3: FETCH LẠI USER DATA MỚI NHẤT VÀ HIỂN THỊ LOADING
      // =========================================================

      setIsDataProcessing(true);
      await fetchUserData(userId);

      Alert.alert(
        "Thành công 🎉",
        "Kế hoạch ăn uống mới đã được tạo và cập nhật!"
      );
    } catch (error) {
      console.error("Lỗi khi tạo kế hoạch bằng AI:", error);
      Alert.alert(
        "Lỗi Tạo Plan",
        error.message || "Đã xảy ra lỗi không xác định."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [userId, userData, fetchUserData, fetchWeeklyData]);

  const handleViewShoppingList = (day, meals) => {
    const mealNames = meals.map((meal) => meal.name).join(", ");

    navigation.navigate("ShoppingListDetail", {
      day: day.toLowerCase(),
      meals: mealNames,
    });
  };

  const handleViewRecipeDetail = (meal) => {
    if (!meal.recipe_id) {
      console.log(`No recipe available for ${meal.name}`);
      return;
    }
    navigation.navigate("RecipeDetail", {
      recipeId: meal.recipe_id,
    });
  };

  const handleGenerateOverallShoppingList = () => {
    console.log("Function: Generate Overall Shopping List");
  };

  // --- XỬ LÝ TRẠNG THÁI LOADING ---
  if (isAuthLoading || isDataProcessing || isGenerating) {
    return (
      <View
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
        <Text style={{ color: TEXT_DARK, marginTop: 10 }}>
          {isGenerating
            ? "Generating new plan..."
            : "Loading your meal plan..."}
        </Text>
      </View>
    );
  }

  // --- MÀN HÌNH HIỂN THỊ CHÍNH ---
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_LIGHT} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: BOTTOM_PADDING_FIX,
          },
        ]}
      >
        <View style={styles.container}>
          {/* MAIN TITLE */}
          <Text style={styles.mainPageTitle}>Meal Plan 🍽️</Text>
          <Text style={styles.pageSubtitle}>This week's culinary journey.</Text>
        </View>

        <View style={styles.container}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Weekly Plan Overview</Text>
            <Text style={styles.summarySubtitle}>From Monday to Sunday</Text>

            {/* Overall Shopping List Button */}
            <TouchableOpacity
              style={styles.summaryAction}
              onPress={handleGenerateOverallShoppingList}
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={22} color={ACTION_GREEN} />
              <Text style={styles.summaryActionText}>
                Generate **Overall** Shopping List
              </Text>
            </TouchableOpacity>
          </View>

          {/* Plan List */}
          <Text style={styles.sectionTitle}>Daily Details</Text>

          {mealPlan.length > 0 ? (
            <View style={styles.planListCard}>
              {mealPlan.map((item, index) => (
                <PlanItem
                  key={index}
                  day={item.day}
                  meals={item.meals}
                  color={item.color}
                  isPastDay={item.isPastDay} // ⭐ TRUYỀN PROP NGÀY ĐÃ QUA ⭐
                  onViewRecipeDetail={handleViewRecipeDetail}
                  onViewShoppingList={() =>
                    handleViewShoppingList(item.day, item.meals)
                  }
                  isLast={index === mealPlan.length - 1}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.planListCard, { padding: 20 }]}>
              <Text
                style={{ fontSize: 16, color: TEXT_DARK, textAlign: "center" }}
              >
                No meal plan available for this week.
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#8A8A8A",
                  textAlign: "center",
                  marginTop: 5,
                }}
              >
                Try generating a plan using AI below!
              </Text>
            </View>
          )}

          {/* Auto-generate Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGeneratePlan}
            activeOpacity={0.8}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateButtonText}>
                  Generating Plan...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>
                  Suggest Meal Plan using AI
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// Styles (Thêm pastDayTag)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  container: {
    paddingHorizontal: 20,
    top: 20,
  },
  // --- Title Styles ---
  mainPageTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: TEXT_DARK,
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#8A8A8A",
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 15,
    marginTop: 30,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_ACCENT,
    paddingLeft: 10,
  },
  // --- Summary Card ---
  summaryCard: {
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 15,
    padding: 20,
    shadowColor: TEXT_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: PRIMARY_ACCENT,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 15,
    color: "#6D6D6D",
    marginBottom: 15,
  },
  summaryAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: PRIMARY_ACCENT + "50",
  },
  summaryActionText: {
    marginLeft: 10,
    color: ACTION_GREEN,
    fontWeight: "800",
    fontSize: 15,
  },
  // --- Plan List Card ---
  planListCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  // --- Plan Item (Updated Styles) ---
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT + "90",
  },
  leftContent: {
    flex: 1,
    flexDirection: "column",
    paddingRight: 10,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  planDay: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT_DARK,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  pastDayTag: {
    // ⭐ STYLE MỚI CHO TAG NGÀY ĐÃ QUA ⭐
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_MUTED,
    marginLeft: 5,
    fontStyle: "italic",
  },

  // Container cho danh sách bữa ăn
  mealsListContainer: {
    marginTop: 10,
    marginLeft: 15,
  },
  // Style cho mỗi mục bữa ăn (Touchable)
  planMealItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
    paddingHorizontal: 5,
    flex: 1,
  },
  mealTouchable: {
    // backgroundColor: "#F9F9F9",
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  planMealText: {
    fontSize: 15,
    fontWeight: "500",
    color: TEXT_DARK,
    flexShrink: 1,
    lineHeight: 20,
  },

  // --- Actions ---
  actionsContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    marginTop: 8,
  },
  // --- Footer Button ---
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_ACCENT,
    padding: 18,
    borderRadius: 12,
    marginTop: 40,
    shadowColor: TEXT_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginLeft: 10,
  },
});
