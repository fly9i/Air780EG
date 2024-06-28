<script setup>
import { ref, computed, inject } from 'vue';
import { useMessage, NTooltip } from 'naive-ui';
const globalSettings = inject('globalSettings');
const $l = computed(() => globalSettings.$l)
const message = useMessage();

const props = defineProps({
    data: {
        type: String,
        required: true
    }
})

const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    message.success(`${$l.value['copy']} ${txt}`)
}

</script>

<template>
    <n-tooltip trigger="hover">
        <template #trigger>
            <span class="cursor-pointer text-blue-500" @click="copy(data)">{{ data }}</span>
        </template>
        {{ $l['click2Copy'] }}
    </n-tooltip>
</template>

<style scoped></style>