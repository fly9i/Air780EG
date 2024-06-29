<script setup>
import { ref, computed, inject } from 'vue';
import { useMessage, NTooltip } from 'naive-ui';
import { useClipboard } from '@vueuse/core';
const globalSettings = inject('globalSettings');
const $l = computed(() => globalSettings.$l)

const message = useMessage();
const { copy, isSupported } = useClipboard();
const props = defineProps({
    data: {
        type: String,
        required: true
    }
})

const copyTo = (txt) => {
    copy(txt);
    message.success(`${$l.value['copy']} ${txt}`)
}

</script>

<template>
    <n-tooltip trigger="hover">
        <template #trigger>
            <span class="cursor-pointer text-blue-500" @click="copyTo(data)">{{ data }}</span>
        </template>
        {{ $l['click2Copy'] }}
    </n-tooltip>
</template>

<style scoped></style>