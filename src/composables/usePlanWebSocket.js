// File: src/composables/usePlanWebSocket.js
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import websocketService from '@/api/websocketService';
import { usePlanStore } from '@/stores/plan';
import { useProgressStore } from '@/stores/progress';
import { useAuthStore } from '@/stores/auth';
// --- SỬA: Thêm import store task mới ---
import { usePlanTaskStore } from '@/stores/planTaskStore';
import { toast } from 'vue-sonner';

export function usePlanWebSocket(selectedDateRef) {
    const planStore = usePlanStore();
    const progressStore = useProgressStore();
    const authStore = useAuthStore();
    // --- SỬA: Khởi tạo store task mới ---
    const planTaskStore = usePlanTaskStore();
    const router = useRouter();

    const topics = ref({
        progress: '',
        tasks: '',
        details: ''
    });

    // --- Handlers ---
    const handleProgressUpdate = (message) => {
        progressStore.handleWebSocketUpdate(message);
    };

    const handleTaskUpdate = (message) => {
        // --- SỬA: Gọi handler của planTaskStore ---
        // Cần truyền cả shareableLink để store có thể refetch
        if (planStore.currentPlan?.shareableLink) {
            planTaskStore.handleWebSocketTaskUpdate(
                planStore.currentPlan.shareableLink,
                message, 
                selectedDateRef.value
            );
        }
    };

    const handlePlanDetailsUpdate = (message) => {
        // --- (Logic này giữ nguyên, không liên quan đến task store) ---
        if (!planStore.currentPlan) return;
        const {
            type, member, userId,
            status, displayStatus,
            title, description, dailyGoal, motivation,
            durationInDays, startDate, endDate,
            oldOwnerUserId, newOwnerUserId
        } = message;
        let needsTimelineRefetch = false;
        switch (type) {
            case 'MEMBER_JOINED':
                if (planStore.currentPlan.members && !planStore.currentPlan.members.some(m => m.userId === member?.userId)) {
                    planStore.currentPlan.members.push(member);
                    if (typeof planStore.currentPlan.memberCount === 'number') planStore.currentPlan.memberCount++;
                    needsTimelineRefetch = true;
                }
                break;
            case 'MEMBER_LEFT':
            case 'MEMBER_REMOVED':
                if (planStore.currentPlan.members) {
                    const index = planStore.currentPlan.members.findIndex(m => m.userId === userId);
                    if (index !== -1) {
                        planStore.currentPlan.members.splice(index, 1);
                        if (typeof planStore.currentPlan.memberCount === 'number' && planStore.currentPlan.memberCount > 0) {
                            planStore.currentPlan.memberCount--;
                        }
                        needsTimelineRefetch = true;
                    }
                    if (authStore.currentUser?.id === userId) {
                        const msg = type === 'MEMBER_LEFT' ? 'Bạn đã rời hành trình.' : 'Bạn đã bị loại khỏi hành trình.';
                        toast.info(msg);
                        router.push({ name: 'home' });
                    }
                }
                break;
            case 'STATUS_CHANGED':
                if (status !== undefined) planStore.currentPlan.status = status;
                if (displayStatus !== undefined) planStore.currentPlan.displayStatus = displayStatus;
                if (status === 'ARCHIVED' && !planStore.isCurrentUserOwner) {
                    toast.info('Hành trình này đã được lưu trữ.');
                    router.push({ name: 'home' });
                } else if (status === 'ACTIVE' || status === 'COMPLETED') {
                    needsTimelineRefetch = true;
                }
                break;
            case 'PLAN_DETAILS_UPDATED':
            case 'PLAN_INFO_UPDATED':
                if (title !== undefined) planStore.currentPlan.title = title;
                if (description !== undefined) planStore.currentPlan.description = description;
                if (motivation !== undefined) planStore.currentPlan.motivation = motivation;
                if (dailyGoal !== undefined) planStore.currentPlan.dailyGoal = dailyGoal;
                if (durationInDays !== undefined) planStore.currentPlan.durationInDays = durationInDays;
                if (startDate !== undefined) planStore.currentPlan.startDate = startDate;
                if (endDate !== undefined) planStore.currentPlan.endDate = endDate;
                break;
            case 'OWNERSHIP_TRANSFERRED':
                if (planStore.currentPlan.members && oldOwnerUserId && newOwnerUserId) {
                    const oldOwner = planStore.currentPlan.members.find(m => m.userId === oldOwnerUserId);
                    const newOwner = planStore.currentPlan.members.find(m => m.userId === newOwnerUserId);
                    if (oldOwner) oldOwner.role = 'MEMBER';
                    if (newOwner) newOwner.role = 'OWNER';
                    if (authStore.currentUser?.id === newOwnerUserId) {
                        toast.success('Bạn đã trở thành chủ sở hữu mới!');
                    }
                }
                break;
        }
        if (needsTimelineRefetch && planStore.currentPlan?.shareableLink) {
            progressStore.fetchTimeline(planStore.currentPlan.shareableLink, selectedDateRef.value);
        }
    };

    // --- Connect & Disconnect (Giữ nguyên) ---
    const connect = (shareableLink) => {
        if (!shareableLink || !planStore.isCurrentUserMember) return;
        disconnect();
        const prefix = `/topic/plan/${shareableLink}`;
        topics.value.progress = `${prefix}/progress`;
        topics.value.tasks = `${prefix}/tasks`;
        topics.value.details = `${prefix}/details`;
        console.log(`Composable: Connecting WS for plan ${shareableLink}`);
        websocketService.subscribe(topics.value.progress, handleProgressUpdate);
        websocketService.subscribe(topics.value.tasks, handleTaskUpdate);
        websocketService.subscribe(topics.value.details, handlePlanDetailsUpdate);
    };

    const disconnect = () => {
        if (topics.value.progress) websocketService.unsubscribe(topics.value.progress);
        if (topics.value.tasks) websocketService.unsubscribe(topics.value.tasks);
        if (topics.value.details) websocketService.unsubscribe(topics.value.details);
        topics.value = { progress: '', tasks: '', details: '' };
    };

    onUnmounted(() => {
        disconnect();
    });

    return {
        connect,
        disconnect
    };
}