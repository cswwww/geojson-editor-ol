<!--
 * @Date: 2024-10-28 17:43:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-04 16:07:35
 * @FilePath: \geojson-editor-ol\src\App.vue
 * @Description: 主页面
-->

<script setup>
import { initMap } from '@/utils/mapView'
import { VectorEditor } from '@/utils/vectorEditor'

let map = null // 地图实例
let drawVector = null // 绘制实例
const drawOptions = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'Circle', 'Square', 'Box'] // 绘制类型

onMounted(() => {
  map = initMap() // 初始化地图
  drawVector = new VectorEditor(map) // 初始化绘制实例
})
</script>

<template>
  <div class="absolute top-0 left-0 z-10 flex items-start gap-2 flex-col">
    <button v-for="item in drawOptions" :key="item" class="btn-ctl" @click="drawVector.draw(item)">
      {{ item }}
    </button>

    <div class="w-full h-[1px] bg-gray-400" />

    <button class="btn-ctl" @click="drawVector.modify">
      编辑折点
    </button>
    <button class="btn-ctl" @click="drawVector.translate">
      拖拽
    </button>
  </div>

  <div id="map" class="w-full h-full" />
</template>

<style scoped>
.btn-ctl {
  @apply bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-colors;
}
</style>
