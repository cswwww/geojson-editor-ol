<!--
 * @Date: 2024-10-28 17:43:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-04 11:26:57
 * @FilePath: \geojson-editor-ol\src\App.vue
 * @Description: 主页面
-->

<script setup>
import { initMap } from '@/utils/mapView'

let map = null // 地图实例

onMounted(() => {
  map = initMap()
  console.log('map: ', map)
})
</script>

<template>
  <div id="map" class="w-full h-full" />
</template>
