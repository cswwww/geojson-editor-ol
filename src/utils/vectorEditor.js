/*
 * @Date: 2024-11-04 13:46:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-04 20:50:04
 * @FilePath: \geojson-editor-ol\src\utils\vectorEditor.js
 * @Description: 矢量编辑相关功能
 */

import { Draw, Modify, Select, Snap, Translate } from 'ol/interaction.js'
import { createBox, createRegularPolygon } from 'ol/interaction/Draw.js'
import { Vector as VectorLayer } from 'ol/layer.js'
import { Vector as VectorSource } from 'ol/source.js'

/**
 * @description: 矢量编辑类
 * @function: init 初始化
 * @function: draw 绘制
 * @function: watch 监听
 * @function: modify 修改
 * @function: translate 移动
 * @function: stopDraw 停止绘制
 * @return {*}
 */
export class VectorEditor {
  map = null // 地图实例
  _source = null // 数据源
  _vector = null // 图层
  _draw = null // 绘制交互
  _select = null // 选择交互
  _modify = null // 修改交互
  _translate = null // 拖拽交互
  _snap = null // 吸附交互 | Notice: The snap interaction must be added last, as it needs to be the first to handle the pointermove event.

  constructor(map) {
    this.map = map // 引入地图实例
    this.init()
  }

  // 操作：初始化
  init() {
    this._source = new VectorSource()
    this._vector = new VectorLayer({
      source: this._source,
    })
    this.map.addLayer(this._vector)

    this._select = new Select() // 实例化选择交互
    this._modify = new Modify({ // 实例化修改交互
      features: this._select.getFeatures(),
    })
    this._translate = new Translate({
      features: this._select.getFeatures(),
    })
    this._snap = new Snap({ source: this._source }) // 实例化吸附交互

    this.map.addInteraction(this._modify)
    this.map.addInteraction(this._select)
    this.map.addInteraction(this._translate)

    this.stopDraw()
    this.watch.clearSelected()
  }

  // 监听：各类事件
  watch = {
    // 事件：选择状态改变时清空已选择的要素
    clearSelected: () => {
      this._select.on('change:active', () => {
        this._select.getFeatures().forEach((item) => {
          this._select.getFeatures().remove(item)
        })
      })
    },
    // 事件：绘制完成时清空已选择的要素
    drawEnd: () => {
      this._draw.on('drawend', (event) => {
        console.log('绘制完成:', event.feature)
      })
    },
  }

  // 操作：绘制
  // Options: 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'Circle', 'Square', 'Box'
  draw(type) {
    this.stopDraw() // 停止绘制

    let value = type // 绘制类型
    let geometryFunction = null

    switch (type) {
      case 'Square':
        value = 'Circle'
        geometryFunction = createRegularPolygon(4)
        break
      case 'Box':
        value = 'Circle'
        geometryFunction = createBox()
        break
    }

    this._draw = new Draw({
      source: this._source,
      type: value,
      geometryFunction, // 绘制回调
    })

    // 添加绘制完成的监听器
    this.watch.drawEnd()

    this.map.addInteraction(this._draw)
    this.map.addInteraction(this._snap)
  }

  // 复位：停止绘制
  stopDraw() {
    if (this._draw) {
      this._draw.un('drawend', this.watch.drawEnd) // 先移除事件监听
      this.map.removeInteraction(this._draw)
      this._draw = null
    }
    this.map.removeInteraction(this._snap)
    this._modify.setActive(false)
    this._select.setActive(false)
    this._translate.setActive(false)
  }

  // 操作：修改
  modify(flag = true) {
    this.stopDraw()

    this._select.setActive(flag)
    this._modify.setActive(flag)
    this.map.addInteraction(this._snap)
  }

  // 操作：拖拽
  translate(flag = true) {
    this.stopDraw()

    this._select.setActive(flag)
    this._translate.setActive(flag)
    this.map.addInteraction(this._snap)
  }
}
