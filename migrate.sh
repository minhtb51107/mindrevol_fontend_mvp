#!/bin/bash
# Script tái cấu trúc thư mục MindRevol sang Feature-based Structure

echo "🚀 Bắt đầu tái cấu trúc thư mục..."

# 1. Tạo các thư mục chính (Core & Shared)
mkdir -p src/components/common
mkdir -p src/services
mkdir -p src/features

# 2. Tạo thư mục cho từng Feature
mkdir -p src/features/auth/{components,services,stores,views}
mkdir -p src/features/plan/{components/dialogs,components/tasks,composables,services,stores,views}
mkdir -p src/features/progress/{components/checkin,services,stores}
mkdir -p src/features/community/{components,services,stores}
mkdir -p src/features/notification/{services,stores}
mkdir -p src/features/dashboard/views

echo "📁 Đã tạo xong cấu trúc thư mục mới."

# =============================================
# 3. DI CHUYỂN CORE SERVICES (Từ src/api/ cũ)
# =============================================
echo "🚚 Đang di chuyển Core Services..."
mv src/api/axios.js src/services/ 2>/dev/null
mv src/api/websocketService.js src/services/ 2>/dev/null
mv src/api/fileUploadService.js src/services/ 2>/dev/null

# =============================================
# 4. DI CHUYỂN SHARED COMPONENTS
# =============================================
echo "🚚 Đang di chuyển Shared Components..."
mv src/components/DateSelector.vue src/components/common/ 2>/dev/null
mv src/components/MentionTextarea.vue src/components/common/ 2>/dev/null
mv src/components/QuoteOfTheDay.vue src/components/common/ 2>/dev/null
# Đổi tên DeleteConfirmDialog thành AppConfirmDialog để dùng chung
mv src/components/dialogs/DeleteConfirmDialog.vue src/components/common/AppConfirmDialog.vue 2>/dev/null

# =============================================
# 5. DI CHUYỂN FEATURE: AUTH
# =============================================
echo "🚚 Đang di chuyển Feature: Auth..."
# Components
mv src/components/GoogleLoginButton.vue src/features/auth/components/ 2>/dev/null
mv src/components/ChangePasswordModal.vue src/features/auth/components/ 2>/dev/null
mv src/components/ProfileModal.vue src/features/auth/components/ 2>/dev/null
# Services
mv src/api/authService.js src/features/auth/services/ 2>/dev/null
mv src/api/userService.js src/features/auth/services/ 2>/dev/null
# Stores (Đổi tên file cho thống nhất nếu cần, ở đây giữ nguyên tên nhưng đổi vị trí)
mv src/stores/auth.js src/features/auth/stores/authStore.js 2>/dev/null
# Views
mv src/views/LoginView.vue src/features/auth/views/ 2>/dev/null
mv src/views/RegisterView.vue src/features/auth/views/ 2>/dev/null
mv src/views/ActivationView.vue src/features/auth/views/ 2>/dev/null
mv src/views/ForgotPasswordView.vue src/features/auth/views/ 2>/dev/null
mv src/views/ResetPasswordView.vue src/features/auth/views/ 2>/dev/null
mv src/views/ChangePasswordView.vue src/features/auth/views/ 2>/dev/null
mv src/views/ProfileView.vue src/features/auth/views/ 2>/dev/null

# =============================================
# 6. DI CHUYỂN FEATURE: PLAN
# =============================================
echo "🚚 Đang di chuyển Feature: Plan..."
# Components chính
mv src/components/PlanInfoPanel.vue src/features/plan/components/ 2>/dev/null
mv src/components/PlanSidebar.vue src/features/plan/components/ 2>/dev/null
mv src/components/PlanInsights.vue src/features/plan/components/ 2>/dev/null
mv src/components/PlanDialogs.vue src/features/plan/components/ 2>/dev/null
# Components con (Tasks & Dialogs)
mv src/components/DailyTaskList.vue src/features/plan/components/tasks/ 2>/dev/null
mv src/components/dialogs/TaskDialog.vue src/features/plan/components/dialogs/ 2>/dev/null
mv src/components/dialogs/EditPlanModal.vue src/features/plan/components/dialogs/ 2>/dev/null
mv src/components/dialogs/InviteMemberDialog.vue src/features/plan/components/dialogs/ 2>/dev/null
mv src/components/dialogs/TransferOwnershipDialog.vue src/features/plan/components/dialogs/ 2>/dev/null
# Composables
mv src/composables/usePlanWebSocket.js src/features/plan/composables/ 2>/dev/null
mv src/composables/usePlanActions.js src/features/plan/composables/ 2>/dev/null
# Services
mv src/api/planService.js src/features/plan/services/ 2>/dev/null
mv src/api/taskService.js src/features/plan/services/ 2>/dev/null
# Stores
mv src/stores/plan.js src/features/plan/stores/planStore.js 2>/dev/null
mv src/stores/planTaskStore.js src/features/plan/stores/ 2>/dev/null
mv src/stores/planUi.js src/features/plan/stores/planUiStore.js 2>/dev/null
mv src/stores/planCreator.js src/features/plan/stores/planCreatorStore.js 2>/dev/null
mv src/stores/taskStore.js src/features/plan/stores/ 2>/dev/null
# Views
mv src/views/PlanDetailView.vue src/features/plan/views/ 2>/dev/null
mv src/views/CreatePlanView.vue src/features/plan/views/ 2>/dev/null
mv src/views/SchedulePlanView.vue src/features/plan/views/ 2>/dev/null

# =============================================
# 7. DI CHUYỂN FEATURE: PROGRESS
# =============================================
echo "🚚 Đang di chuyển Feature: Progress..."
# Components
mv src/components/TimelineDashboard.vue src/features/progress/components/ 2>/dev/null
mv src/components/ProgressDashboard.vue src/features/progress/components/ 2>/dev/null
mv src/components/ProgressChart.vue src/features/progress/components/ 2>/dev/null
mv src/components/ProgressDetailModal.vue src/features/progress/components/ 2>/dev/null
# Check-in components
mv src/components/CheckInModal.vue src/features/progress/components/checkin/ 2>/dev/null
mv src/components/CheckInDetailCard.vue src/features/progress/components/checkin/ 2>/dev/null
mv src/components/timeline/CheckInCard.vue src/features/progress/components/checkin/ 2>/dev/null
# Xóa thư mục cũ nếu rỗng
rmdir src/components/timeline 2>/dev/null
# Services & Stores
mv src/api/progressService.js src/features/progress/services/ 2>/dev/null
mv src/stores/progress.js src/features/progress/stores/progressStore.js 2>/dev/null

# =============================================
# 8. DI CHUYỂN FEATURE: COMMUNITY & NOTIFICATION
# =============================================
echo "🚚 Đang di chuyển Feature: Community & Notification..."
mv src/components/CommunityFeed.vue src/features/community/components/ 2>/dev/null
mv src/components/CommentSection.vue src/features/community/components/ 2>/dev/null
mv src/api/communityService.js src/features/community/services/ 2>/dev/null
mv src/api/feedService.js src/features/community/services/ 2>/dev/null
mv src/stores/community.js src/features/community/stores/communityStore.js 2>/dev/null
mv src/stores/feedStore.js src/features/community/stores/ 2>/dev/null

mv src/api/notificationService.js src/features/notification/services/ 2>/dev/null
mv src/stores/notificationStore.js src/features/notification/stores/ 2>/dev/null

# =============================================
# 9. DI CHUYỂN DASHBOARD VIEWS
# =============================================
echo "🚚 Đang di chuyển Dashboard Views..."
mv src/views/HomeView.vue src/features/dashboard/views/ 2>/dev/null
mv src/views/MindRevolDashboard.vue src/features/dashboard/views/ 2>/dev/null

# =============================================
# 10. DỌN DẸP THƯ MỤC RỖNG
# =============================================
echo "🧹 Dọn dẹp thư mục cũ..."
rmdir src/api 2>/dev/null
rmdir src/components/dialogs 2>/dev/null
# rmdir src/stores 2>/dev/null  <-- Giữ lại nếu bạn muốn để root store sau này
# rmdir src/views 2>/dev/null   <-- Giữ lại nếu còn view chung nào đó

echo "✅ Hoàn tất tái cấu trúc! Vui lòng cập nhật imports."