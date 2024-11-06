<!--
 * @Date: 2024-10-28 17:43:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-06 17:16:03
 * @FilePath: \geojson-editor-ol\src\App.vue
 * @Description: 主页面
-->

<script setup>
import { initMap } from '@/utils/mapView'
import { VectorEditor } from '@/utils/vectorEditor'
import GeoJSON from 'ol/format/GeoJSON.js'

let map = null // 地图实例
let drawVector = null // 绘制实例
const drawOptions = [ // 绘制类型
  { type: 'Point', label: '点' },
  { type: 'LineString', label: '线' },
  { type: 'Polygon', label: '面' },
  // { type: 'MultiPoint', label: '多点' },
  // { type: 'MultiLineString', label: '多线' },
  // { type: 'MultiPolygon', label: '多面' },
  // { type: 'Circle', label: '圆' },
  { type: 'Box', label: '矩形' },
  { type: 'Square', label: '正方形' },
]

const currentActive = ref(null) // 当前激活的按钮
const currentEditType = ref(null) // 当前编辑的类型
const isEdit = ref(false) // 新增: 用于跟踪 isEdit 状态

const featuresList = ref({ // 要素列表
  type: 'FeatureCollection',
  features: [],
})

const editButtons = [ // 操作按钮配置
  { type: 'modify', label: '编辑折点' },
  { type: 'translate', label: '平移' },
  { type: 'delete', label: '删除' },
]

// 操作：绘制
function handleDraw(type) {
  isEdit.value = false

  currentActive.value = type
  currentEditType.value = null
  drawVector.draw(type)
}

// 操作：进入编辑状态
function enterEdit() {
  currentActive.value = 'edit'
  drawVector.edit()
}

// 操作：编辑状态下的其他操作
function handleEdit(type) {
  currentEditType.value = type
  drawVector[type]()

  if (type === 'delete') {
    isEdit.value = false
    currentEditType.value = null
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
})
</script>

<template>
  <div class="absolute top-0 right-1/3 z-10 flex items-end gap-2 flex-col">
    <button v-for="item in drawOptions" :key="item" :class="{ active: currentActive === item.type }" class="btn-ctl" @click="handleDraw(item.type)">
      {{ item.label }}
    </button>

    <div class="w-full h-[1px] bg-gray-400" />

    <button :class="{ active: currentActive === 'edit' }" class="btn-ctl" @click="enterEdit">
      编辑模式
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
