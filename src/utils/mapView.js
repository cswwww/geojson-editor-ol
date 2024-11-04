/*
 * @Date: 2024-10-31 16:17:31
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-04 11:24:42
 * @FilePath: \geojson-editor-ol\src\utils\mapView.js
 * @Description: 地图及视图相关方法
 * @Reference: https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html
 */

import TileLayer from 'ol/layer/Tile.js'
import Map from 'ol/Map.js'
import { get } from 'ol/proj.js'
import OSM from 'ol/source/OSM.js'
import View from 'ol/View.js'
import 'ol/ol.css'

/**
 * @description: 地图：简易初始化
 * @return {*}
 */
export function initMap() {
  const map = new Map({
    target: 'map',
    controls: [],
    view: new View({
      center: [0, 0],
      zoom: 1,
      extent: get('EPSG:3857').getExtent(),
    }),
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
    ],
  })

  return map
}
