<template>
  <div v-if="totalPages > 1" style="text-align:center;padding:20px">
    <button v-if="modelValue > 1" class="filter-btn" @click="go(1)">首页</button>
    <button v-if="modelValue > 1" class="filter-btn" style="margin-left:8px" @click="go(modelValue - 1)">上一页</button>
    <span style="margin:0 12px;font-size:13px;color:var(--text2)">{{ modelValue }} / {{ totalPages }}</span>
    <button v-if="modelValue < totalPages" class="filter-btn" style="margin-right:8px" @click="go(modelValue + 1)">下一页</button>
    <button v-if="modelValue < totalPages" class="filter-btn" @click="go(totalPages)">末页</button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})
const emit = defineEmits(['update:modelValue'])

function go(p) {
  emit('update:modelValue', p)
  document.documentElement.scrollTop = 0
}
</script>
