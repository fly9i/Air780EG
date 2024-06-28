<script setup>
import { ref, onMounted, watch, useAttrs, computed, inject } from 'vue'
import { NInfiniteScroll, NTag, NTooltip, useMessage } from 'naive-ui';
const globalSettings = inject('globalSettings');
const $l = computed(() => globalSettings.$l)
const props = defineProps({
    list: {
        type: Array,
        default: [],
        required: true
    }

});
const emit = defineEmits(['loadMessage', 'setPhoneNumber'])
const loadMessage = () => {
    emit('loadMessage')
}
const setPhoneNumber = (phone) => {
    emit('setPhoneNumber', phone)
}

const smsList = ref([])
const numReg = /\b((?=(?:.*\d){4})[-0-9 ]{4,20})\b/g
const urlReg = /(https?:\/\/[a-zA-Z0-9-_.~%&#(){}|`^\/?]+)/g

watch(() => props.list, (val) => {
    change()
})


function change() {
    smsList.value = []
    props.list.forEach(it => {
        let item = {};
        for (let k in it) {
            item[k] = it[k]
        }
        item.tags = [];
        console.log(item.content)
        while (true) {
            let r = numReg.exec(item.content);
            if (!r) {
                break;
            }
            item.tags.push({
                type: 'num',
                value: r[0]
            })
        }
        while (true) {
            let r = urlReg.exec(item.content);
            if (!r) {
                break;
            }
            item.tags.push({
                type: 'url',
                value: r[0]
            })
        }
        smsList.value.push(it)
    })
}


onMounted(() => {
    change()
})
const message = useMessage();
const copy = (value) => {
    navigator.clipboard.writeText(value)
    message.success($l.value['copySuccess'])
}
</script>
<template>
    <n-infinite-scroll class="w-full" :distance="10" @load="loadMessage">
        <div v-for="item in smsList" :key="item.id" class="flex flex-col w-full">
            <div class="h-auto flex flex-row items-center m-1">

                <img v-if="item.type === 'in'" class="w-10 h-10 bg-black rounded-full" src="@/assets/avatar.svg" />
                <div class="w-full flex flex-col">

                    <div :class="item.type === 'in' ? 'msg-left' : 'msg-right'">

                        <div class="text-gray-500 text-sm grid grid-cols-2 w-full">
                            <span class="inline underline text-blue-500 cursor-pointer"
                                @click="setPhoneNumber(item.from || item.to)">{{ item.from || item.to }}</span>
                            <span class="text-right">{{ item.time }}</span>
                        </div>
                        <div class="text-sms" v-html="item.content"></div>
                    </div>
                </div>
                <img v-if="item.type === 'out'" class="w-10 h-10 bg-black rounded-full" src="@/assets/avatar.svg" />
            </div>
            <div class="flex gap-1 ml-14">

                <n-tooltip trigger="hover" v-for="it, idx in item.tags" :key="idx">
                    <template #trigger>
                        <n-tag class="cursor-pointer" size="small" type="info" @click="copy(it.value)">{{ it.value
                            }}</n-tag>
                    </template>
                    {{ $l['click2Copy'] }}
                </n-tooltip>
            </div>
        </div>
    </n-infinite-scroll>
</template>
<style scoped>
.msg-left {
    @apply bg-blue-200 text-gray-700 max-w-[80%] p-2 px-3 rounded-lg self-start relative;
    margin-left: 0.65rem;
}

.msg-right {
    @apply bg-green-200 text-gray-700 max-w-[80%] p-2 px-3 rounded-lg m-1 self-end relative;
    margin-right: 0.65rem;
}

.msg-left::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(-100%, -50%);
    width: 0;
    height: 0;
    border-top: 0.4rem solid transparent;
    border-bottom: 0.4rem solid transparent;
    border-right: 0.5rem solid theme('colors.blue.200');
}

.msg-right::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    transform: translate(100%, -50%);
    width: 0;
    height: 0;
    border-top: 0.4rem solid transparent;
    border-bottom: 0.4rem solid transparent;
    border-left: 0.5rem solid theme('colors.green.200');
}

.text-sms :deep(a) {
    color: theme('colors.blue.500');
    text-decoration: underline;
}
</style>