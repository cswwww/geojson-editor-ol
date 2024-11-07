<!--
 * @Date: 2024-10-28 17:43:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-07 17:40:13
 * @FilePath: \geojson-editor-ol\src\App.vue
 * @Description: 主页面
-->

<script setup>
import { initMap } from '@/utils/mapView'
import { VectorEditor } from '@/utils/vectorEditor'
import GeoJSON from 'ol/format/GeoJSON.js'

let map = null // 地图实例
let drawVector = null // 绘制实例
const featuresList = ref({ // 右侧展示的要素列表
  type: 'FeatureCollection',
  features: [],
})
const drawOptions = [ // 绘制类型
  { type: 'Point', label: '点' },
  { type: 'LineString', label: '线' },
  { type: 'Polygon', label: '面' },
  { type: 'Box', label: '矩形(Q)' },
  { type: 'Square', label: '正方形' },
]

const currentActive = ref(null) // 当前激活的按钮
const currentEditType = ref(null) // 当前编辑的类型
const isEdit = ref(false) // 是否处于编辑状态

const editButtons = [ // 操作按钮配置
  { type: 'modify', label: '编辑折点(E)' },
  { type: 'translate', label: '平移(R)' },
  { type: 'delete', label: '删除' },
  { type: 'cutHole', label: '挖孔(A)' },
]

// 操作：绘制
function handleDraw(type) {
  if (currentActive.value === type) {
    currentActive.value = null
    drawVector.stopDraw()
    return
  }
  isEdit.value = false
  currentActive.value = type
  currentEditType.value = null
  drawVector.draw(type)
}

// 操作：编辑
function enterEdit() {
  if (currentActive.value === 'edit') { // 如果当前处于编辑状态，则退出编辑状态
    currentActive.value = null
    isEdit.value = false
    currentEditType.value = null
    drawVector.stopDraw()
    return
  }
  currentActive.value = 'edit'
  drawVector.edit()
}

// 操作：编辑状态下的其他操作
function handleEdit(type) {
  switch (type) {
    case 'modify':
      drawVector[type](type !== currentEditType.value)
      currentEditType.value = type === currentEditType.value ? null : type
      break
    case 'translate':
      drawVector[type](type !== currentEditType.value)
      currentEditType.value = type === currentEditType.value ? null : type
      break
    case 'cutHole':
      drawVector.cutHole(type !== currentEditType.value)
      currentEditType.value = type === currentEditType.value ? null : type
      break
    case 'delete':
      drawVector[type]()
      isEdit.value = false
      currentEditType.value = null
      break
  }
}

// 事件：键盘事件
function keyDown(e) {
  const key = e.key.toLowerCase()
  switch (key) {
    case 'q':
      handleDraw('Box')
      break
    case 'w':
      enterEdit()
      break
    case 'e':
      if (isEdit.value) {
        handleEdit('modify')
      }
      break
    case 'r':
      if (isEdit.value) {
        handleEdit('translate')
      }
      break
    case 'a':
      if (isEdit.value) {
        handleEdit('cutHole')
      }
      break
  }
}

onMounted(() => {
  map = initMap() // 初始化地图
  drawVector = new VectorEditor(map) // 初始化绘制实例

  // 事件：监听要素变化，用于展示GeoJSON数据
  const geojsonFormat = new GeoJSON()
  drawVector._source.on('change', () => {
    featuresList.value = geojsonFormat.writeFeaturesObject(drawVector._source.getFeatures())
  })
  // 事件：已选中要素时
  drawVector._select.on('select', (event) => {
    if (event.selected.length > 0) {
      isEdit.value = true
    }
    else {
      isEdit.value = false
    }
  })

  window.addEventListener('keydown', keyDown) // 事件：监听键盘事件
})

onUnmounted(() => {
  window.removeEventListener('keydown', keyDown, false)
})
</script>

<template>
  <div class="select-none absolute top-0 right-1/3 z-10 flex items-end gap-2 flex-col">
    <button v-for="item in drawOptions" :key="item" :class="{ active: currentActive === item.type }" class="btn-ctl" @click="handleDraw(item.type)">
      {{ item.label }}
    </button>

    <div class="w-full h-[1px] bg-gray-400" />

    <button :class="{ active: currentActive === 'edit' }" class="btn-ctl" @click="enterEdit">
      编辑模式(W)
    </button>

    <button
      v-for="btn in editButtons"
      v-show="isEdit"
      :key="btn.type"
      class="btn-ctl"
      :class="{ '!bg-red-300': currentEditType === btn.type }"
      @click="handleEdit(btn.type)"
    >
      {{ btn.label }}
    </button>
  </div>

  <div class="w-full h-full flex">
    <div id="map" class="w-2/3 h-full" />
    <div class="w-1/3 h-full overflow-auto p-2 bg-gray-50">
      <pre class="min-h-full bg-white p-2 rounded-lg shadow">{{ featuresList }}</pre>
    </div>
  </div>
</template>

<style scoped>
.btn-ctl {
  @apply bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-colors;
}
.btn-ctl.active {
  @apply bg-red-400;
}
</style>
