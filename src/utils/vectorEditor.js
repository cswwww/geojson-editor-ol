/*
 * @Date: 2024-11-04 13:46:37
 * @LastEditors: ReBeX  cswwwx@gmail.com
 * @LastEditTime: 2024-11-07 18:43:22
 * @FilePath: \geojson-editor-ol\src\utils\vectorEditor.js
 * @Description: 矢量编辑相关功能
 */

import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON.js'
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
 * @function: cutHole 挖孔
 * @function: stopDraw 停止绘制
 * @return {*}
 */

export class VectorEditor {
  map = null // 地图实例

  _source = null // 基础数据源
  _vector = null // 基础图层
  _editSource = null // 编辑用数据源
  _editVector = null // 编辑用图层

  _draw = null // 绘制交互
  _select = null // 选择交互
  _modify = null // 修改交互
  _translate = null // 平移交互
  _snap = null // 吸附交互 | Notice: The snap interaction must be added last, as it needs to be the first to handle the pointermove event.
  _drawHole = null // 挖孔交互
  _selectedFeature = null // 编辑状态下选中的要素

  constructor(map) {
    this.map = map // 引入地图实例
    this.init()
  }

  // 操作：初始化
  init() {
    this._source = new VectorSource()
    this._editSource = new VectorSource()
    this._vector = new VectorLayer({ source: this._source })
    this._editVector = new VectorLayer({ source: this._editSource })
    this.map.addLayer(this._vector)
    this.map.addLayer(this._editVector)

    this._snap = new Snap({ source: this._source }) // 实例化吸附交互
    this._select = new Select() // 实例化选择交互
    this._modify = new Modify({ features: this._select.getFeatures() }) // 实例化修改交互
    this._translate = new Translate({ features: this._select.getFeatures() }) // 实例化平移交互

    this.map.addInteraction(this._modify)
    this.map.addInteraction(this._select)
    this.map.addInteraction(this._translate)

    this.stopDraw()

    this.watch.clearSelected() // 挂载事件
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
    // 事件：挖孔交互结束时
    drawHoleEnd: () => {
      this._drawHole.on('drawend', (event) => {
        const mask = turf.polygon(this._editSource.getFeatures()[0].getGeometry().getCoordinates()) // 被挖区域
        const polygon = turf.polygon(event.feature.getGeometry().getCoordinates()) // 绘制区域
        const result = new GeoJSON().readFeatures(turf.mask(polygon, mask))
        this._editSource.clear()
        this._editSource.addFeatures(result)
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

    if (this._drawHole) {
      this._drawHole.un('drawend', this.watch.drawHoleEnd) // 先移除事件监听
      this.map.removeInteraction(this._drawHole)
      this._drawHole = null
      this._select.setActive(true)
      this._vector.setVisible(true) // 显示基础图层
      this._editSource.clear()
    }
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
  edit() {
    this.stopDraw()
    this._select.setActive(true)
  }

  /** ------------------------------------------------------------ */

  // 操作：修改
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  modify(flag = true) {
    this.stopMutual()

    if (flag) {
      this._modify.setActive(true)
      this.map.addInteraction(this._snap)
    }
  }

  // 操作：平移
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  translate(flag = true) {
    this.stopMutual()

    if (flag) {
      this._translate.setActive(true)
      this.map.addInteraction(this._snap)
    }
  }

  // 操作：删除
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  delete() {
    this.stopMutual()
    this._source.removeFeature(this._select.getFeatures().getArray()[0])
  }

  // 操作：挖孔
  // 所属互斥组：编辑模式组，重置方法 stopMutual
  cutHole(flag = true) {
    if (flag && this._select.getFeatures().getArray().length > 0) { // 开挖
      this.stopMutual() // 停止互斥交互
      this._vector.setVisible(false) // 隐藏基础图层
      this._selectedFeature = this._select.getFeatures().getArray()[0] // 记录选中的要素
      this._selectedFeature && this._editSource.addFeature(this._selectedFeature)
      this._select.setActive(false)
      this._drawHole = new Draw({
        source: new VectorSource(),
        type: 'Polygon',
      })
      this.watch.drawHoleEnd() // 添加事件监听
      this.map.addInteraction(this._drawHole)
    }
    else if (this._drawHole) { // 停止
      this._source.removeFeature(this._selectedFeature) // 移除被编辑的要素
      this._source.addFeature(this._editSource.getFeatures()[0]) // 添加编辑后的要素
      this._vector.setVisible(true) // 显示基础图层
      this._editSource.clear()
      this._drawHole.un('drawend', this.watch.drawHoleEnd) // 先移除事件监听
      this.map.removeInteraction(this._drawHole)
      this._drawHole = null
      this._select.setActive(true)
    }
  }
}
