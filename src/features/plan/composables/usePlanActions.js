// File: src/composables/usePlanActions.js
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan';
import { useProgressStore } from '@/stores/progress';
import { usePlanUiStore } from '@/stores/planUi';

export function usePlanActions() {
    const planStore = usePlanStore();
    const progressStore = useProgressStore();
    const uiStore = usePlanUiStore();
    const router = useRouter();

    // Các trạng thái loading chi tiết (để giữ hiệu ứng loading trên từng nút nếu cần)
    const isLoadingAction = ref(false);
    const actionError = ref(null);
    const isArchiving = ref(null);     // true: đang lưu trữ, false: đang khôi phục
    const isLeaving = ref(false);
    const removingMemberId = ref(null); // ID của thành viên đang bị xóa

    /**
     * Hàm xử lý trung tâm cho các hành động cần xác nhận.
     * @param {object} payload - { type, item } từ sự kiện confirm-action
     * @param {function} showSnackbar - Callback để hiển thị thông báo lên UI cha
     */
    const handleGenericConfirm = async ({ type, item }, showSnackbar) => {
        // Đóng dialog ngay lập tức để trải nghiệm người dùng nhanh hơn
        uiStore.closeConfirmDialog();

        isLoadingAction.value = true;
        actionError.value = null;

        // Hàm wrapper để gọi showSnackbar an toàn
        const notify = (msg, color = 'success') => {
            if (typeof showSnackbar === 'function') {
                showSnackbar(msg, color);
            } else {
                console.log(`[${color.toUpperCase()}] ${msg}`);
            }
        };

        try {
            switch (type) {
                case 'leave-plan':
                    isLeaving.value = true;
                    await planStore.leaveCurrentPlan();
                    notify('Bạn đã rời khỏi hành trình.');
                    // Router push đã được xử lý trong planStore.leaveCurrentPlan() 
                    // nhưng thêm vào đây cho chắc chắn nếu store thay đổi.
                    router.replace({ name: 'home' }); 
                    break;

                case 'archive-plan':
                    isArchiving.value = true;
                    await planStore.archiveCurrentPlan();
                    notify('Hành trình đã được lưu trữ.');
                    break;

                case 'unarchive-plan':
                    isArchiving.value = false;
                    await planStore.unarchiveCurrentPlan();
                    notify('Hành trình đã được khôi phục.');
                    break;

                case 'remove-member':
                    if (item && item.userId) {
                        removingMemberId.value = item.userId;
                        await planStore.removeMemberFromCurrentPlan(item.userId);
                        notify(`Đã xóa thành viên: ${item.userFullName}`, 'success');
                    }
                    break;

                case 'delete-plan':
                    await planStore.deletePlanPermanently();
                    notify('Hành trình đã được xóa vĩnh viễn.');
                     router.replace({ name: 'home' });
                    break;

                case 'delete-checkin':
                    if (item && item.id) {
                        await progressStore.deleteCheckInAction(item.id);
                        notify('Đã xóa check-in.', 'success');
                    }
                    break;

                default:
                    console.warn('usePlanActions: Unknown action type:', type);
                    break;
            }
        } catch (err) {
            console.error(`Lỗi khi thực hiện hành động [${type}]:`, err);
            actionError.value = err.message || err.response?.data?.message || 'Thao tác thất bại.';
            notify(actionError.value, 'error');
        } finally {
            // Reset tất cả trạng thái loading
            isLoadingAction.value = false;
            isArchiving.value = null;
            isLeaving.value = false;
            removingMemberId.value = null;
        }
    };

    // Trả về mọi thứ cần thiết cho component sử dụng
    return {
        isLoadingAction,
        actionError,
        isArchiving,
        isLeaving,
        removingMemberId,
        handleGenericConfirm
    };
}