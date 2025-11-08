// File: src/composables/usePlanWebSocket.js
import { ref, onUnmounted, watch } from 'vue';
import { usePlanStore } from '@/stores/plan';
import { usePlanTaskStore } from '@/stores/planTaskStore';
import { useProgressStore } from '@/stores/progress';
import websocketService from '@/api/websocketService';
import { useAuthStore } from '@/stores/auth';

const isConnected = ref(false);
const currentSubscribedLink = ref(null);

export function usePlanWebSocket(shareableLinkRef, onMessageReceived) {
    // Lưu ý: shareableLinkRef nên là một ref hoặc computed để reactive hoạt động tốt nhất
    const planStore = usePlanStore();
    const planTaskStore = usePlanTaskStore();
    const progressStore = useProgressStore();
    const authStore = useAuthStore();

    const handleWebSocketMessage = async (message) => {
        if (!message || !message.type) return;
        if (typeof onMessageReceived === 'function') onMessageReceived(message);

        // Lấy giá trị link hiện tại (nếu là ref)
        const currentLink = (typeof shareableLinkRef === 'string') ? shareableLinkRef : shareableLinkRef.value;

        switch (message.type) {
            // --- NHÓM TASK (Gửi cho planTaskStore) ---
            case 'NEW_TASK':
            case 'UPDATE_TASK':
            case 'DELETE_TASK':
            case 'MOVE_TASK':
            case 'REORDER_TASKS':
                // SỬA: Gọi đúng tên hàm và thứ tự tham số như đã định nghĩa trong planTaskStore.js
                planTaskStore.handleWebSocketUpdate(
                    message,                    // updateData
                    progressStore.selectedDate, // currentlySelectedDate
                    currentLink                 // shareableLink
                );
                break;

            // --- NHÓM PROGRESS (Gửi cho progressStore) ---
            case 'NEW_CHECK_IN': // Lưu ý: Backend bạn gửi NEW_CHECK_IN hay NEW_CHECKIN? Kiểm tra lại cho chắc. Tôi dùng NEW_CHECK_IN theo progress.js của bạn.
            case 'UPDATE_CHECK_IN':
            case 'DELETE_CHECK_IN':
            case 'UPDATE_CHECKIN_REACTION': // Sửa lại cho khớp với progress.js
            case 'NEW_CHECKIN_COMMENT':
            case 'UPDATE_CHECKIN_COMMENT':
            case 'DELETE_CHECKIN_COMMENT':
                 // SỬA: Gọi đúng tên hàm trong progress.js là handleWebSocketUpdate
                 progressStore.handleWebSocketUpdate(message);
                 break;

            // --- NHÓM PLAN (Gửi cho planStore) ---
            case 'PLAN_DETAILS_UPDATED':
            case 'NEW_MEMBER_JOINED':
            case 'OWNERSHIP_TRANSFERRED':
            case 'MEMBER_LEFT':
            case 'PLAN_ARCHIVED':
            case 'PLAN_UNARCHIVED':
                 await planStore.fetchPlan(currentLink);
                 break;

            case 'MEMBER_REMOVED':
                 if (message.userId === authStore.currentUser?.id) {
                     alert("Bạn đã bị xóa khỏi hành trình này.");
                     window.location.href = '/dashboard';
                     return;
                 }
                 await planStore.fetchPlan(currentLink);
                 break;
                 
            case 'PLAN_DELETED':
                 alert("Hành trình này đã bị xóa.");
                 window.location.href = '/dashboard';
                 break;

            default:
                 break;
        }
    };

    const connect = (link) => {
        if (!link) return;
        if (isConnected.value && currentSubscribedLink.value === link) return;
        if (isConnected.value) disconnect();

        console.log(`Composable: Connecting WS for plan ${link}`);
        websocketService.connect(
            link,
            handleWebSocketMessage,
            () => {
                isConnected.value = true;
                currentSubscribedLink.value = link;
            },
            () => { isConnected.value = false; }
        );
    };

    const disconnect = () => {
        if (currentSubscribedLink.value) {
             console.log(`Composable: Disconnecting WS for ${currentSubscribedLink.value}`);
             websocketService.disconnect(currentSubscribedLink.value);
             currentSubscribedLink.value = null;
             isConnected.value = false;
        }
    };

    // Watch shareableLinkRef để tự động connect/disconnect
    watch(() => (typeof shareableLinkRef === 'string' ? shareableLinkRef : shareableLinkRef.value), (newLink) => {
        if (newLink) connect(newLink);
        else disconnect();
    }, { immediate: true });

    onUnmounted(() => {
        disconnect();
    });

    return { isConnected, connect, disconnect };
}