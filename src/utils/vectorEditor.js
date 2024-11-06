/*
 * @Date: 2024-11-04 13:46:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-06 15:04:46
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
 * @function: delete 删除
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
  _translate = null // 平移交互
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

    // 挂载事件
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
    // 事件：已选中要素时
    selected: () => {
      this._select.on('select', (event) => {
        console.log('选中要素:', event.selected)
      })
    },
  }

  /** ------------------------------------------------------------ */

  // 复位：停止绘制
  stopDraw() {
    if (this._draw) {
      // this._draw.un('drawend', this.watch.drawEnd) // 先移除事件监听
      this.map.removeInteraction(this._draw)
      this._draw = null
    }
    this.map.removeInteraction(this._snap)
    this._modify.setActive(false)
    this._select.setActive(false)
    this._translate.setActive(false)
  }

  // 复位：清除编辑状态下的互斥交互
  stopMutual() {
    // if (this._select.getFeatures().getArray().length === 0) {
    //   console.warn('请先选中要素')
    //   return
    // }
    this._modify.setActive(false)
    this._translate.setActive(false)
  }

  /** ------------------------------------------------------------ */

  // 操作：绘制
  // 所属互斥组：顶级功能组，重置方法 stopDraw
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
    this.map.addInteraction(this._draw)
    this.map.addInteraction(this._snap)
  }

  // 操作：进入编辑模式
  // 所属互斥组：顶级功能组，重置方法 stopDraw
  edit(flag = true) {
    this.stopDraw()
    this._select.setActive(flag)
  }

  /** ------------------------------------------------------------ */

  // 操作：修改
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  modify(flag = true) {
    this.stopMutual()
    this._modify.setActive(flag)
    this.map.addInteraction(this._snap)
  }

  // 操作：平移
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  translate(flag = true) {
    this.stopMutual()
    this._translate.setActive(flag)
    this.map.addInteraction(this._snap)
  }

  // 操作：删除
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  delete() {
    this.stopMutual()
    this._source.removeFeature(this._select.getFeatures().getArray()[0])
  }
}
