import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal, // ⭐ IMPORT MỚI ⭐
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

// Import AuthContext để lấy userData, userId, fetchUserData và processResponse
import { useAuth } from "../components/AuthContext";
// ⭐ Cần đảm bảo hook này có hàm updateCookedStatus ⭐
import { useUserUpdateAPI } from "../hook/useUsers";

// --- Cấu hình API ---
const AI_SERVICE_URL = "https://mealmaker-ai-production.up.railway.app/";
const AI_RECOMMENDATION_ENDPOINT = "get-recommendations-ai";

// --- Colors ---
const PRIMARY_ACCENT = "#AB9574";
const PRIMARY_LIGHT = "#E0D7C9";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#3D2C1C";
const TEXT_MUTED = "#9A9A9A";
const ACTION_GREEN = "#27AE60";
const BUTTON_GRAY = "#F0F0F0";
const CLOSE_RED = "#E74C3C";
// Màu mới cho danh sách mua sắm
const IN_STOCK_COLOR = "#388E3C";
const NEEDED_COLOR = "#D35400";

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
 */
const getCurrentDayOfWeek = () => {
  const date = new Date();
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Điều chỉnh để bắt đầu từ Monday
  const index = dayIndex === 0 ? 6 : dayIndex - 1;
  return DAYS_OF_WEEK[index];
};

// =========================================================
// ⭐ NEW: Component Render Card (tái sử dụng từ file ShoppingListDetail) ⭐
// =========================================================

const RenderShoppingCardFinal = ({ title, items, color, icon, showStatus }) => {
  // ⭐️ Thêm state để quản lý trạng thái đóng/mở
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Chỉ ẩn card nếu không có items và KHÔNG phải là card Main/Seasoning
  if (items.length === 0 && title.indexOf("Overall") !== -1) {
    return null;
  }

  const itemRenderer = (item) => {
    // Nếu có days (từ Overall List), hiển thị ngày bên dưới
    const daysText =
      item.days && item.days.length > 0
        ? ` (For: ${item.days.map((d) => d.substring(0, 3)).join(", ")})`
        : "";

    return (
      <View key={item.id} style={styles.ingredientItem}>
        <View style={styles.itemContent}>
          <Text
            style={[styles.itemText, item.isInStock && { color: "#8A8A8A" }]}
          >
            {/* Hiển thị quantity và khoảng trắng chỉ khi quantity có dữ liệu */}
            {item.quantity ? (
              <Text style={styles.quantityText}>{item.quantity} </Text>
            ) : null}
            <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
          </Text>
          {daysText ? <Text style={styles.daysNote}>{daysText}</Text> : null}
        </View>

        {showStatus && (
          <View
            style={[
              styles.statusTag,
              {
                backgroundColor: item.isInStock
                  ? IN_STOCK_COLOR + "20"
                  : NEEDED_COLOR + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.statusTagText,
                { color: item.isInStock ? IN_STOCK_COLOR : NEEDED_COLOR },
              ]}
            >
              {item.isInStock ? "In Stock" : "To Buy"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const collapseIconName = isCollapsed
    ? "chevron-down-outline"
    : "chevron-up-outline";

  return (
    <View style={[styles.shoppingCard, { borderColor: color }]}>
      {/* ⭐️ Bọc Header trong TouchableOpacity để xử lý sự kiện nhấn */}
      <TouchableOpacity
        style={[styles.cardHeader, { backgroundColor: color + "15" }]}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
        <Text style={styles.cardCount}>({items.length} items)</Text>
        {/* ⭐️ Thêm icon toggle */}
        <Ionicons
          name={collapseIconName}
          size={20}
          color={color}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {/* ⭐️ Chỉ hiển thị Body khi KHÔNG bị collapse */}
      {!isCollapsed && (
        <View style={styles.cardBody}>
          {items.length > 0 ? (
            items.map(itemRenderer)
          ) : (
            <Text style={styles.noDataText}>
              Không có nguyên liệu nào trong nhóm này.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// =========================================================
// ⭐ NEW: Overall Shopping List Modal Component ⭐
// =========================================================

const OverallShoppingModal = ({ isVisible, onClose, weeklyShoppingList }) => {
  // ⭐ State cho ngày được chọn (mặc định chọn cả tuần) ⭐
  const [selectedDays, setSelectedDays] = useState(DAYS_OF_WEEK);
  const [isLoading, setIsLoading] = useState(false);

  // ⭐ Hàm Toggle chọn/bỏ chọn ngày ⭐
  const toggleDaySelection = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(
            (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
          )
    );
  };

  // ⭐ Logic Tổng hợp Nguyên liệu (Aggregation) ⭐
  const aggregateShoppingList = useCallback(() => {
    if (!weeklyShoppingList) {
      return { main: [], seasoning: [] };
    }

    // Sử dụng Map để tổng hợp số lượng (Key: Tên nguyên liệu đã chuẩn hóa)
    const combinedIngredients = new Map();
    const combinedSeasoning = new Map();

    selectedDays.forEach((day) => {
      const dayList = weeklyShoppingList[day];
      if (dayList) {
        // A. Nguyên liệu chính (Ingredient Map)
        if (dayList.ingredients) {
          Object.entries(dayList.ingredients).forEach(([name, quantity]) => {
            const cleanName = name.toLowerCase().trim();

            if (!combinedIngredients.has(cleanName)) {
              combinedIngredients.set(cleanName, {
                name: name, // Giữ tên gốc cho hiển thị
                quantity: quantity || "",
                category: "Main Ingredient",
                isInStock: false,
                id: `Overall_Main_${cleanName.replace(/[^a-z0-9]/g, "")}`,
                days: [day],
              });
            } else {
              // Thêm ngày nếu chưa có
              const existingItem = combinedIngredients.get(cleanName);
              if (!existingItem.days.includes(day)) {
                existingItem.days.push(day);
              }
              // Cập nhật quantity nếu item hiện tại không có (chỉ giữ lại 1 quantity)
              if (existingItem.quantity === "" && quantity) {
                existingItem.quantity = quantity;
              }
            }
          });
        }
        // B. Gia vị (Seasoning Array)
        if (Array.isArray(dayList.seasoning)) {
          dayList.seasoning.forEach((name) => {
            const cleanName = name.toLowerCase().trim();
            if (!combinedSeasoning.has(cleanName)) {
              combinedSeasoning.set(cleanName, {
                name: name,
                quantity: "",
                category: "Seasoning",
                isInStock: false,
                id: `Overall_Seasoning_${cleanName.replace(/[^a-z0-9]/g, "")}`,
                days: [day],
              });
            } else {
              const existingItem = combinedSeasoning.get(cleanName);
              if (!existingItem.days.includes(day)) {
                existingItem.days.push(day);
              }
            }
          });
        }
      }
    });

    return {
      main: Array.from(combinedIngredients.values()),
      seasoning: Array.from(combinedSeasoning.values()),
    };
  }, [weeklyShoppingList, selectedDays]);

  // Kích hoạt tổng hợp khi ngày chọn thay đổi
  const groupedList = useMemo(() => {
    setIsLoading(true);
    const result = aggregateShoppingList();
    setIsLoading(false);
    return result;
  }, [aggregateShoppingList]);

  const totalItems = groupedList.main.length + groupedList.seasoning.length;

  // Lấy chiều cao tab bar để Modal nổi lên hoàn toàn
  const tabBarHeight = useBottomTabBarHeight();
  const MODAL_BOTTOM_PADDING = tabBarHeight;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overallModalOverlay}>
        <View style={styles.overallModalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>
                <Ionicons name="basket-outline" size={20} color={TEXT_DARK} />{" "}
                Overall Shopping List
              </Text>
              <Text style={styles.headerSubtitle}>
                {selectedDays.length} / 7 days selected
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={30} color={CLOSE_RED} />
            </TouchableOpacity>
          </View>

          {/* Day Selection ComboBox */}
          {/* Day Selection ComboBox (Improved UX) */}
          <View style={styles.daySelectionContainer}>
            {/* SELECT ALL / CLEAR */}
            <TouchableOpacity
              onPress={
                () =>
                  selectedDays.length === DAYS_OF_WEEK.length
                    ? setSelectedDays([]) // Clear All
                    : setSelectedDays(DAYS_OF_WEEK) // Select All
              }
              style={[
                styles.allButton,
                selectedDays.length === DAYS_OF_WEEK.length
                  ? styles.allButtonActive
                  : styles.allButtonInactive,
              ]}
            >
              <Ionicons
                name={
                  selectedDays.length === DAYS_OF_WEEK.length
                    ? "checkbox-outline"
                    : "square-outline"
                }
                size={16}
                color={
                  selectedDays.length === DAYS_OF_WEEK.length
                    ? "#fff"
                    : TEXT_DARK
                }
              />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.daySelectionScroll}
              contentContainerStyle={{ paddingRight: 10 }}
            >
              {DAYS_OF_WEEK.map((dayName) => {
                const isSelected = selectedDays.includes(dayName);
                const capitalized =
                  dayName.charAt(0).toUpperCase() + dayName.slice(1);

                return (
                  <TouchableOpacity
                    key={dayName}
                    onPress={() => toggleDaySelection(dayName)}
                    activeOpacity={0.8}
                    style={[
                      styles.dayPillImproved,
                      isSelected
                        ? styles.dayPillImprovedSelected
                        : styles.dayPillImprovedUnselected,
                    ]}
                  >
                    {/* ICON FOR DAY */}
                    <Ionicons
                      name={isSelected ? "calendar" : "calendar-outline"}
                      size={14}
                      color={isSelected ? "#fff" : TEXT_DARK}
                      style={{ marginRight: 4 }}
                    />

                    <Text
                      style={[
                        styles.dayPillImprovedText,
                        isSelected ? { color: "#fff" } : { color: TEXT_DARK },
                      ]}
                    >
                      {capitalized.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Content (Shopping List) */}
          <ScrollView
            style={styles.modalContentScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: MODAL_BOTTOM_PADDING }}
          >
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={PRIMARY_ACCENT}
                style={{ marginTop: 50 }}
              />
            ) : totalItems === 0 ? (
              <View style={{ padding: 30, alignItems: "center" }}>
                <Ionicons name="warning-outline" size={30} color={TEXT_MUTED} />
                <Text style={{ color: TEXT_MUTED, marginTop: 10 }}>
                  No items needed for the selected days.
                </Text>
              </View>
            ) : (
              <>
                {/* Card Main Ingredients */}
                <RenderShoppingCardFinal
                  title={`Overall Main Ingredients`}
                  items={groupedList.main}
                  color={NEEDED_COLOR}
                  icon="fast-food-outline"
                  showStatus={false}
                />
                {/* Card Seasoning */}
                <RenderShoppingCardFinal
                  title={`Overall Seasoning`}
                  items={groupedList.seasoning}
                  color={PRIMARY_ACCENT}
                  icon="flask-outline"
                  showStatus={false}
                />
                <View style={{ height: 40 }} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Component riêng cho mỗi bữa ăn, có thể nhấn vào
const MealTouchableItem = ({ meal, color, onPress, isPastDay }) => {
  const canNavigate = meal.recipe_id !== undefined && meal.recipe_id !== null;
  const textStyle = [
    styles.planMealText,
    canNavigate && { color: TEXT_DARK, fontWeight: "600" },
    isPastDay && { color: TEXT_MUTED, textDecorationLine: "line-through" }, // Hiệu ứng ngày đã qua/đã nấu
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

// Cập nhật PlanItem để nhận prop isCooked và hàm onMarkCooked
const PlanItem = ({
  day,
  meals,
  color,
  onViewShoppingList,
  onViewRecipeDetail,
  onMarkCooked, // ⭐ PROP MỚI: Hàm xử lý sự kiện đã nấu ⭐
  isLast,
  isPastDay,
  isCooked,
  isToday, // ⭐ PROP MỚI: Trạng thái đã nấu ⭐
}) => {
  // Độ mờ cho toàn bộ khung nếu là ngày đã qua HOẶC ĐÃ NẤU
  const opacityStyle = isPastDay || isCooked ? { opacity: 0.5 } : {};
  const dayNameLower = day.toLowerCase();

  // Trạng thái vô hiệu hóa (disabled) chung cho các nút hành động
  const isDisabled = isCooked || isPastDay;

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
              { backgroundColor: isDisabled ? TEXT_MUTED : color },
            ]}
          />
          <Text
            style={[
              styles.planDay,
              { color: isDisabled ? TEXT_MUTED : TEXT_DARK },
            ]}
          >
            {day}
          </Text>
          {isPastDay && <Text style={styles.pastDayTag}> (Passed)</Text>}
          {isCooked && !isPastDay && (
            <Text style={[styles.pastDayTag, { color: ACTION_GREEN }]}>
              (Cooked 🎉)
            </Text>
          )}
        </View>

        {/* Meals Container */}
        <View style={styles.mealsListContainer}>
          {meals.map((meal, index) => (
            <MealTouchableItem
              key={meal.id || index}
              meal={meal}
              color={color}
              isPastDay={isDisabled} // Vô hiệu hóa khi đã nấu hoặc đã qua
              onPress={() => onViewRecipeDetail(meal)}
            />
          ))}
        </View>
      </View>

      {/* Actions Container */}
      <View style={styles.actionsContainer}>
        {isToday && !isCooked && !isPastDay && (
          <TouchableOpacity
            onPress={() => onMarkCooked(dayNameLower, true)}
            style={[
              styles.actionButton,
              { backgroundColor: BUTTON_GRAY, borderRadius: 8, padding: 8 },
              isDisabled && styles.actionButtonDisabled, // Thêm style khi disabled
            ]}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={isDisabled ? TEXT_MUTED : ACTION_GREEN}
            />
          </TouchableOpacity>
        )}
        {/* View Shopping List Button */}
        {/* <TouchableOpacity
          onPress={onViewShoppingList}
          style={[
            styles.actionButton,
            { backgroundColor: BUTTON_GRAY, borderRadius: 8, padding: 8 },
            isDisabled && styles.actionButtonDisabled, // Thêm style khi disabled
          ]}
          activeOpacity={0.7}
          disabled={isDisabled}
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={isDisabled ? TEXT_MUTED : ACTION_GREEN}
          />
        </TouchableOpacity> */}
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
  } = useAuth();

  // ⭐ LẤY fetchWeeklyData và updateCookedStatus TỪ HOOK useUserUpdateAPI ⭐
  const { fetchWeeklyData, updateCookedStatus } = useUserUpdateAPI(userId);

  const [mealPlan, setMealPlan] = useState([]);
  const [isDataProcessing, setIsDataProcessing] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  // ⭐ TRẠNG THÁI MỚI CHO OVERALL MODAL ⭐
  const [isOverallModalVisible, setIsOverallModalVisible] = useState(false);

  const tabBarHeight = useBottomTabBarHeight();
  const BOTTOM_PADDING_FIX = tabBarHeight + 40;

  // Lấy ngày hiện tại
  const currentDay = getCurrentDayOfWeek();

  // --- HÀM CẬP NHẬT TRẠNG THÁI ĐÃ NẤU (Mark Day as Cooked) ---

  const handleMarkDayAsCooked = useCallback(
    (dayName) => {
      if (!userId) return;

      Alert.alert(
        "Confirmation of cooking done",
        `Are you sure you want to confirm that the meals on ${dayName.toUpperCase()} have been cooked?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Confirm",
            onPress: async () => {
              setIsGenerating(true);
              try {
                console.log(`Cập nhật trạng thái đã nấu cho: ${dayName}`);
                // 1. Gọi API cập nhật trạng thái đã nấu
                await updateCookedStatus(dayName);

                // ⭐ 2. CẬP NHẬT TRẠNG THÁI CỤC BỘ NGAY LẬP TỨC (OPTIMISTIC UPDATE) ⭐
                setMealPlan((prevMealPlan) => {
                  return prevMealPlan.map((item) => {
                    // Chuyển dayName của item về chữ thường để so sánh
                    if (item.day.toLowerCase() === dayName.toLowerCase()) {
                      return { ...item, isCooked: true };
                    }
                    return item;
                  });
                });

                Alert.alert(
                  "Success 🎉",
                  `The cooking status for ${dayName.toUpperCase()} has been updated!`
                );
              } catch (error) {
                console.error("Lỗi khi cập nhật trạng thái đã nấu:", error);
                Alert.alert(
                  "Error",
                  "Cannot update the cooking status. Please try again."
                );
              } finally {
                setIsGenerating(false);
              }
            },
          },
        ]
      );
    },
    [userId, fetchUserData, updateCookedStatus] // GIỮ NGUYÊN DEPENDENCY
  );
  // --- HÀM XỬ LÝ DỮ LIỆU WEEKLY MENU (Cập nhật để lấy is_cooked) ---
  // --- HÀM XỬ LÝ DỮ LIỆU WEEKLY MENU (Cập nhật để lấy is_cooked) ---
  const processWeeklyMenu = useCallback(() => {
    if (!userData || !userData.weekly_menu) {
      setMealPlan([]);
      setIsDataProcessing(false);
      return;
    }

    const weeklyMenuData = userData.weekly_menu;
    // ⭐ Lấy danh sách mua sắm cả tuần để suy luận trạng thái đã nấu ⭐
    const weeklyShoppingList = userData.weekly_shopping_list || {};
    const newMealPlan = [];

    // LOGIC XÁC ĐỊNH NGÀY ĐÃ QUA
    const currentDayIndex = DAYS_OF_WEEK.indexOf(currentDay);

    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      const day = DAYS_OF_WEEK[i];
      const mealArray = weeklyMenuData[day];
      const dayShoppingList = weeklyShoppingList[day]; // Lấy danh sách mua sắm của ngày

      const isPastDay = i < currentDayIndex;
      let isCooked = false; // Mặc định là chưa nấu

      // ⭐ LOGIC MỚI: KIỂM TRA weekly_shopping_list[day] RỖNG ⭐
      if (dayShoppingList) {
        // Kiểm tra xem có bất kỳ nguyên liệu chính nào không (ít nhất 1 key)
        const hasIngredients =
          dayShoppingList.ingredients &&
          Object.keys(dayShoppingList.ingredients).length > 0;

        // Kiểm tra xem có bất kỳ gia vị nào không (ít nhất 1 item)
        const hasSeasoning =
          Array.isArray(dayShoppingList.seasoning) &&
          dayShoppingList.seasoning.length > 0;

        // Nếu dayShoppingList tồn tại nhưng không có cả Ingredients và Seasoning
        if (!hasIngredients && !hasSeasoning) {
          isCooked = true; // Coi như đã nấu
        }
      } else if (mealArray && mealArray.length > 0) {
        // Trường hợp 2: weekly_shopping_list[day] bị xóa hoàn toàn (undefined/null)
        // và weekly_menu[day] vẫn có món ăn, coi như đã nấu.
        isCooked = true;
      }

      if (!mealArray || mealArray.length === 0) continue;

      const mealsForDay = mealArray.map((meal, index) => {
        const uniqueId = `${day}_${index}`;
        // ... (giữ nguyên logic map meals)
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
          isPastDay: isPastDay,
          isCooked: isCooked, // ⭐ TRUYỀN TRẠNG THÁI ĐÃ SUY LUẬN ⭐
          isToday: day === currentDay,
        });
      }
    }

    setMealPlan(newMealPlan);
    setIsDataProcessing(false);
  }, [userData, currentDay]);
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

      // Hàm fetchWeeklyData sẽ gửi generatedRecipeIds lên backend
      await fetchWeeklyData(generatedRecipeIds);

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

  // ⭐ HÀM MỚI: Mở Modal Shopping List Tổng Hợp ⭐
  const handleGenerateOverallShoppingList = () => {
    fetchUserData(userData.id);
    setIsOverallModalVisible(true);
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
              onPress={handleGenerateOverallShoppingList} // ⭐ GỌI HÀM MỞ MODAL ⭐
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={22} color={ACTION_GREEN} />
              <Text style={styles.summaryActionText}>
                Generate Shopping List
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
                  isPastDay={item.isPastDay}
                  isCooked={item.isCooked}
                  isToday={item.day.toLowerCase() === currentDay} // ⭐ TRUYỀN PROP ĐÃ NẤU ⭐
                  onViewRecipeDetail={handleViewRecipeDetail}
                  onViewShoppingList={() =>
                    handleViewShoppingList(item.day, item.meals)
                  }
                  onMarkCooked={handleMarkDayAsCooked} // ⭐ TRUYỀN HÀM XỬ LÝ ⭐
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

      {/* ⭐ GỌI OVERALL SHOPPING MODAL ⭐ */}
      <OverallShoppingModal
        isVisible={isOverallModalVisible}
        onClose={() => setIsOverallModalVisible(false)}
        weeklyShoppingList={userData?.weekly_shopping_list}
      />
    </View>
  );
}

// Styles (Đã cập nhật pastDayTag và actionsContainer)
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
    // ⭐ STYLE CHO TAG NGÀY ĐÃ QUA/ĐÃ NẤU ⭐
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

  // --- Actions (Cập nhật để chứa 2 nút xếp chồng) ---
  actionsContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 10,
    marginTop: 5,
  },
  actionButton: {
    padding: 8,
    marginTop: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
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

  // =========================================================
  // ⭐ NEW: OVERALL MODAL STYLES (Thêm vào cuối file styles) ⭐
  // =========================================================

  overallModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overallModalContainer: {
    backgroundColor: BACKGROUND_LIGHT,
    width: "100%",
    height: "100%", // Chiếm phần lớn màn hình
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
  },
  headerTitleGroup: {
    flex: 1,
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ACTION_GREEN,
    fontWeight: "600",
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  modalContentScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flex: 1,
  },
  // --- Day Selection Styles ---
  daySelectionContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  daySelectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_DARK,
    marginRight: 5,
  },
  daySelectionScroll: {
    flexGrow: 0,
  },
  // ⭐ Improved Day Selector Styles ⭐
  allButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 1.2,
  },
  allButtonActive: {
    backgroundColor: PRIMARY_ACCENT,
    borderColor: PRIMARY_ACCENT,
  },
  allButtonInactive: {
    backgroundColor: "#fff",
    borderColor: TEXT_MUTED,
  },
  allButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
  },

  dayPillImproved: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    borderWidth: 1.4,
    minWidth: 55,
    justifyContent: "center",
  },
  dayPillImprovedSelected: {
    backgroundColor: PRIMARY_ACCENT,
    borderColor: PRIMARY_ACCENT,
    transform: [{ scale: 1.05 }],
  },
  dayPillImprovedUnselected: {
    backgroundColor: BUTTON_GRAY,
    borderColor: TEXT_MUTED,
  },
  dayPillImprovedText: {
    fontWeight: "700",
    fontSize: 13,
  },

  // --- Shopping Card Styles (Tái sử dụng) ---
  shoppingCard: {
    marginTop: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  cardCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A8A8A",
    marginLeft: "auto",
  },
  cardBody: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },

  // --- Item Styles ---
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  itemContent: {
    flexDirection: "column",
    flex: 1,
    paddingRight: 10,
  },
  itemText: {
    fontSize: 13,
    color: TEXT_DARK,
    flexShrink: 1,
  },
  daysNote: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  quantityText: {
    fontWeight: "bold",
    marginRight: 5,
  },
  // --- Status Tag Styles ---
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  noDataText: {
    textAlign: "center",
    padding: 15,
    color: "#8A8A8A",
    fontStyle: "italic",
  },
});
