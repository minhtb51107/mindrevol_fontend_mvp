<template>
  <div class="mention-textarea-wrapper">
    <v-textarea
      ref="textareaRef"
      :model-value="modelValue"
      @update:modelValue="onInput"
      @keydown="onKeyDown"
      @click="updateCursorPosition"
      @blur="hideDropdownDelayed"
      v-bind="$attrs"
      :rows="rows"
      :label="label"
      :variant="variant"
      :density="density"
      :loading="loading"
      :disabled="disabled"
      :hide-details="hideDetails"
      :append-inner-icon="appendInnerIcon"
      @click:append-inner="$emit('click:append-inner')"
      class="mention-textarea"
    ></v-textarea>

    <v-list
      v-if="showDropdown && filteredItems.length > 0"
      class="mention-dropdown elevation-2"
      density="compact"
      :style="dropdownStyle"
      ref="dropdownRef"
    >
      <v-list-item
        v-for="(item, index) in filteredItems"
        :key="item.id"
        @mousedown.prevent="selectItem(item)"
        :active="index === activeIndex"
        active-class="mention-active-item"
        @mouseenter="activeIndex = index"
      >
        <template v-slot:prepend>
          <v-avatar size="32" :image="item.avatar" color="grey-lighten-2" class="me-2">
            <span v-if="!item.avatar">{{ item.initial }}</span>
          </v-avatar>
        </template>
        <v-list-item-title>{{ item.label }}</v-list-item-title>
        <v-list-item-subtitle>{{ item.email }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { VTextarea, VList, VListItem, VListItemTitle, VListItemSubtitle, VAvatar } from 'vuetify/components';

const props = defineProps({
  modelValue: { // For v-model
    type: String,
    default: '',
  },
  items: { // List of mentionable users: [{ id, label, value?, avatar?, initial?, email? }]
    type: Array,
    default: () => [],
  },
  trigger: { // Character to trigger mention
    type: String,
    default: '@',
  },
  // Props để pass xuống v-textarea
  rows: [String, Number],
  label: String,
  variant: String,
  density: String,
  loading: Boolean,
  disabled: Boolean,
  hideDetails: [Boolean, String],
  appendInnerIcon: String,
});

const emit = defineEmits(['update:modelValue', 'click:append-inner']);

const textareaRef = ref(null); // Ref to the v-textarea component instance
const dropdownRef = ref(null); // Ref to the dropdown list
const showDropdown = ref(false);
const searchQuery = ref('');
const activeIndex = ref(0); // Index of highlighted item in dropdown
const mentionStartIndex = ref(-1); // Start position of the current mention query (@...)
const cursorPosition = ref(0); // Current cursor position
const dropdownStyle = ref({ top: '0px', left: '0px' }); // Positioning for dropdown

// Filter items based on searchQuery
const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return props.items.slice(0, 5); // Show top 5 initially or when query is empty
  }
  const query = searchQuery.value.toLowerCase();
  return props.items.filter(item =>
    item.label?.toLowerCase().includes(query) ||
    item.email?.toLowerCase().includes(query)
  ).slice(0, 5); // Limit results
});

// Update internal cursor position state
const updateCursorPosition = () => {
  if (textareaRef.value?.$el) { // Access underlying textarea element
      const textarea = textareaRef.value.$el.querySelector('textarea');
      if (textarea) {
        cursorPosition.value = textarea.selectionStart;
      }
  }
};

// Handle input events on the textarea
const onInput = (value) => {
  emit('update:modelValue', value); // Update v-model
  updateCursorPosition();

  const currentPos = cursorPosition.value;
  const textBeforeCursor = value.substring(0, currentPos);

  // Find the last trigger character before the cursor
  const lastTriggerIndex = textBeforeCursor.lastIndexOf(props.trigger);

  // Check if we are potentially inside a mention query
  // Condition: trigger found, no space between trigger and cursor (or just trigger),
  //            and not already part of a completed mention like @[...](...)
  const potentialQuery = value.substring(lastTriggerIndex + 1, currentPos);
  const precedingChar = lastTriggerIndex > 0 ? value[lastTriggerIndex - 1] : null;

  // Allow trigger at the start or after a space
  const isValidTriggerStart = lastTriggerIndex === 0 || (precedingChar && /\s/.test(precedingChar));

  // Check for invalid characters in the query (spaces, brackets often mean end of mention)
  const isValidQuery = !/\s|[\[\]()]/.test(potentialQuery);


  if (lastTriggerIndex !== -1 && isValidTriggerStart && isValidQuery) {
    searchQuery.value = potentialQuery;
    mentionStartIndex.value = lastTriggerIndex;
    showDropdown.value = true;
    activeIndex.value = 0; // Reset index
    calculateDropdownPosition(); // Calculate position after showing
  } else {
    showDropdown.value = false;
    searchQuery.value = '';
    mentionStartIndex.value = -1;
  }
};

// Calculate dropdown position based on cursor/mention start
// This is a simplified calculation, might need refinement
const calculateDropdownPosition = async () => {
    await nextTick(); // Wait for DOM update
    if (!textareaRef.value?.$el || mentionStartIndex.value === -1) return;

    const textarea = textareaRef.value.$el.querySelector('textarea');
    if (!textarea) return;

    // Estimate position - This part is tricky and might need a library or more complex logic
    // for pixel-perfect positioning relative to the '@' character.
    // Simple approach: Position below the textarea.
    const rect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight, 10) || 20;
    // Estimate current line based on newlines before mention start
    const lines = props.modelValue.substring(0, mentionStartIndex.value + 1).split('\n').length;

    dropdownStyle.value = {
        // Position below the current line (approximate)
        top: `${textarea.offsetTop + lines * lineHeight}px`,
        // Align left with textarea (simple)
        left: `${textarea.offsetLeft}px`,
        // Set a min-width maybe
        minWidth: `${textarea.offsetWidth * 0.5}px`
    };
     console.log("Dropdown Style:", dropdownStyle.value);
};


// Handle keyboard navigation in dropdown
const onKeyDown = (event) => {
  updateCursorPosition(); // Update position before handling key

  if (showDropdown.value && filteredItems.value.length > 0) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeIndex.value = (activeIndex.value + 1) % filteredItems.value.length;
        scrollDropdown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        activeIndex.value = (activeIndex.value - 1 + filteredItems.value.length) % filteredItems.value.length;
        scrollDropdown();
        break;
      case 'Enter':
      case 'Tab': // Use Tab to select as well
        event.preventDefault();
        selectItem(filteredItems.value[activeIndex.value]);
        break;
      case 'Escape':
        event.preventDefault();
        hideDropdown();
        break;
      // Hide dropdown if user types space or moves cursor away significantly
      case ' ':
           hideDropdown();
           break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
           // Hide if cursor moves out of the mention query area
           // Need a slight delay to allow cursor position update
           setTimeout(() => {
                updateCursorPosition();
                 if (cursorPosition.value <= mentionStartIndex.value || cursorPosition.value > mentionStartIndex.value + 1 + searchQuery.value.length) {
                    hideDropdown();
                 }
           }, 50);
           break;
    }
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
       // Allow default arrow behavior if dropdown is not shown
  }
};

// Scroll dropdown to keep active item visible
const scrollDropdown = async () => {
    await nextTick();
    if(dropdownRef.value?.$el) {
        const listElement = dropdownRef.value.$el;
        const activeItemElement = listElement.querySelector('.v-list-item--active');
        if (activeItemElement) {
             activeItemElement.scrollIntoView({ block: 'nearest' });
        }
    }
};

// Insert selected mention into textarea
const selectItem = (item) => {
  if (mentionStartIndex.value === -1 || !item) {
    hideDropdown();
    return;
  }

  const mentionText = `@[${item.label}](${item.id}) `; // Format: @[Display Name](userId) + space
  const currentValue = props.modelValue;
  const before = currentValue.substring(0, mentionStartIndex.value);
  const after = currentValue.substring(cursorPosition.value); // Use current cursor pos

  const newValue = before + mentionText + after;
  emit('update:modelValue', newValue);

  // Move cursor to after the inserted mention
  nextTick(() => {
    if (textareaRef.value?.$el) {
         const textarea = textareaRef.value.$el.querySelector('textarea');
        if (textarea) {
            const newCursorPos = mentionStartIndex.value + mentionText.length;
            textarea.focus(); // Ensure textarea has focus
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            cursorPosition.value = newCursorPos; // Update internal state
        }
    }
    hideDropdown(); // Hide after selection
  });
};

// Hide dropdown immediately
const hideDropdown = () => {
    showDropdown.value = false;
    searchQuery.value = '';
    mentionStartIndex.value = -1;
    activeIndex.value = 0;
};

// Hide dropdown after a short delay (used on blur to allow clicking item)
let blurTimeout = null;
const hideDropdownDelayed = () => {
    clearTimeout(blurTimeout);
    blurTimeout = setTimeout(hideDropdown, 200); // 200ms delay
};

// Focus textarea when needed (e.g., after closing a dialog)
const focusTextarea = () => {
     if (textareaRef.value?.$el) {
         const textarea = textareaRef.value.$el.querySelector('textarea');
         textarea?.focus();
     }
};

// Expose focus method if needed by parent
defineExpose({ focus: focusTextarea });

// Cleanup timeout on unmount
onBeforeUnmount(() => {
    clearTimeout(blurTimeout);
});

</script>

<style scoped>
.mention-textarea-wrapper {
  position: relative; /* Needed for absolute positioning of dropdown */
}

.mention-dropdown {
  position: absolute;
  z-index: 10; /* Ensure it's above other elements */
  max-height: 200px;
  overflow-y: auto;
  background-color: white; /* Or use theme color */
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 150px; /* Adjust as needed */
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.mention-active-item {
  background-color: rgba(var(--v-theme-primary), 0.1) !important; /* Vuetify primary color */
}

/* Ensure textarea doesn't hide dropdown if wrapper clips overflow */
.mention-textarea-wrapper:deep(.v-textarea .v-field__field) {
    overflow: visible;
}
.mention-textarea:deep(textarea) {
    /* Add specific styles to textarea if needed */
}
</style>