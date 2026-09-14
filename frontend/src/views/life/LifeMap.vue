<template>
  <div class="page">
    <NavHeader />
    <div class="map-container">
      <div class="map-toolbar">
        <h2>本地生活地图</h2>
        <p class="subtitle">Binghamton 周边生活点位</p>
        <div class="spacer"></div>
        <el-select v-model="filters.category" placeholder="全部分类" clearable size="small" style="width: 140px" @change="reloadByView()">
          <el-option label="全部分类" :value="''" />
          <el-option label="美食" value="food" />
          <el-option label="超市" value="grocery" />
          <el-option label="服务" value="service" />
          <el-option label="校园" value="campus" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select v-model="range.mode" size="small" style="width: 140px; margin-left: 8px" @change="reloadByView()">
          <el-option label="按视窗范围" value="bbox" />
          <el-option label="按半径范围" value="radius" />
        </el-select>
        <template v-if="range.mode==='radius'">
          <el-input-number v-model="range.radiusKm" :min="0.5" :max="50" :step="0.5" size="small" style="margin-left: 8px" />
        </template>
        <el-button size="small" type="primary" style="margin-left: 8px" @click="reloadByView()">重新加载</el-button>
        <el-button size="small" @click="startAddPoint()">提交点位</el-button>
        <el-button v-if="me?.role==='admin'" size="small" type="warning" @click="openReview()">审核提交</el-button>
      </div>
      <div id="life-map" class="map"></div>
      <div v-if="ui.picking" class="pick-overlay">在地图上点击选择位置</div>
      <div class="legend">
        <span class="legend-item"><span class="dot dot-food"></span>中餐/美食</span>
        <span class="legend-item"><span class="dot dot-grocery"></span>超市/食材</span>
        <span class="legend-item"><span class="dot dot-service"></span>服务/银行</span>
        <span class="legend-item"><span class="dot dot-campus"></span>校园/设施</span>
      </div>

      <!-- 提交点位对话框 -->
      <el-dialog
        v-model="dialogs.submit"
        title="提交点位"
        width="520"
        :modal="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :lock-scroll="false"
        draggable
        @close="cancelAddPoint"
      >
        <el-alert v-if="!newPoint.coord" type="info" :closable="false" show-icon>
          <template #title>拾取位置</template>
          在地图上点击选择位置后填写信息
          <div style="margin-top:8px">
            <el-button size="small" type="primary" @click="beginPick">开始拾取</el-button>
            <el-button size="small" @click="dialogs.submit=false">先关闭窗口</el-button>
          </div>
        </el-alert>
        <el-form v-else :model="newPoint.form" label-width="88px">
          <el-form-item label="名称"><el-input v-model="newPoint.form.name" /></el-form-item>
          <el-form-item label="分类">
            <el-select v-model="newPoint.form.category" style="width: 200px">
              <el-option label="美食" value="food" />
              <el-option label="超市" value="grocery" />
              <el-option label="服务" value="service" />
              <el-option label="校园" value="campus" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述"><el-input v-model="newPoint.form.description" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="地址"><el-input v-model="newPoint.form.address" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="newPoint.form.phone" /></el-form-item>
          <el-form-item label="网站"><el-input v-model="newPoint.form.website" /></el-form-item>
          <el-form-item label="位置">
            <div>
              <div>Lat: {{ newPoint.coord?.[0].toFixed(6) }} Lng: {{ newPoint.coord?.[1].toFixed(6) }}</div>
              <el-button size="small" @click="beginPick" style="margin-top:6px">重新选点</el-button>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="cancelAddPoint">取消</el-button>
          <el-button type="primary" :disabled="!newPoint.coord || !newPoint.form.name" @click="submitPoint">提交审核</el-button>
        </template>
      </el-dialog>

      <!-- 审核面板（管理员） -->
      <el-drawer v-model="dialogs.review" title="待审核点位" size="40%">
        <div v-if="pending.loading" class="p-12">加载中...</div>
        <div v-else>
          <el-empty v-if="!pending.items.length" description="暂无待审核" />
          <el-table v-else :data="pending.items" size="small" style="width:100%">
            <el-table-column prop="name" label="名称" width="160" />
            <el-table-column prop="category" label="分类" width="90" />
            <el-table-column label="坐标">
              <template #default="{row}">{{ row.latitude }}, {{ row.longitude }}</template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="200">
              <template #default="{row}">
                <el-button size="small" type="success" @click="approve(row)">通过</el-button>
                <el-button size="small" type="danger" @click="reject(row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-drawer>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import NavHeader from '@/components/NavHeader.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ElMessage } from 'element-plus'

// 修复构建后默认图标路径问题
// @ts-ignore
import iconUrl from 'leaflet/dist/images/marker-icon.png'
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

type LifePoint = {
  name: string
  coord: [number, number]
  desc?: string
  category: 'food' | 'grocery' | 'service' | 'campus'
}

let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
let addMarkerPreview: L.Marker | null = null

// 登录用户与鉴权
const me = ref<{ id:number; role:string } | null>(null)
const token = localStorage.getItem('token')

// 过滤与范围
const filters = reactive({ category: '' as '' | 'food' | 'grocery' | 'service' | 'campus' | 'other' })
const range = reactive({ mode: 'bbox' as 'bbox' | 'radius', radiusKm: 2 })

// 对话框与新提交
const dialogs = reactive({ submit: false, review: false })
const newPoint = reactive<{ coord: [number, number] | null, form: any }>({
  coord: null,
  form: { name: '', category: 'food', description: '', address: '', phone: '', website: '' }
})
const pending = reactive<{ loading: boolean; items: any[] }>({ loading: false, items: [] })
const ui = reactive({ picking: false })

const points: LifePoint[] = [
  // 美食
  { name: '好吃中餐(示例)', coord: [42.1002, -75.9188], desc: '川湘风味，口味较重', category: 'food' },
  { name: '寿司小店(示例)', coord: [42.0989, -75.9242], desc: '便当/寿司', category: 'food' },
  // 超市
  { name: '亚洲超市(示例)', coord: [42.0931, -75.9105], desc: '调料/速食/零食', category: 'grocery' },
  { name: '美式超市(示例)', coord: [42.1063, -75.953], desc: '日常采购', category: 'grocery' },
  // 服务
  { name: '银行网点(示例)', coord: [42.1008, -75.9135], desc: '开户/现金存取', category: 'service' },
  { name: '邮局(示例)', coord: [42.0957, -75.9221], desc: '寄件/收件', category: 'service' },
  // 校园
  { name: 'Bartle Library', coord: [42.0889, -75.9695], desc: '主图书馆', category: 'campus' },
  { name: 'University Union', coord: [42.0883, -75.9679], desc: '活动/餐饮', category: 'campus' }
]

onMounted(() => {
  // Binghamton 市区近似中心坐标
  const center: [number, number] = [42.0987, -75.9180]
  map = L.map('life-map', { zoomControl: true }).setView(center, 13)

  // 开发阶段使用 OSM 公共瓦片；生产建议替换为带 key 的提供商
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  // 动态图层与加载
  markersLayer = L.layerGroup().addTo(map)
  fetchMe()
  reloadByView()

  // 地图移动后自动刷新（按视窗模式）
  map.on('moveend zoomend', () => {
    if (range.mode === 'bbox') reloadByView()
  })
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// ------- 前端交互与API -------
const apiBase = '/api/life-map'

function getAuthHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function pinIconHtml(color: string) {
  return `
    <div style="position:relative; width:24px; height:32px; transform: translate(-50%, -100%);">
      <span style="position:absolute; left:50%; top:0; transform:translateX(-50%); display:inline-block; width:18px; height:18px; border-radius:50%; background:${color}; border:2px solid ${color}; box-shadow:0 0 0 3px #fff, 0 8px 16px rgba(0,0,0,0.25);"></span>
      <span style="position:absolute; left:50%; top:16px; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:10px solid ${color}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"></span>
    </div>`
}

function colorForCategory(cat: string) {
  return cat === 'food' ? '#e11d48' : cat === 'grocery' ? '#059669' : cat === 'service' ? '#2563eb' : cat === 'campus' ? '#7c3aed' : '#6b7280'
}

async function fetchMe() {
  if (!token) return
  try {
    const r = await fetch('/api/auth/me', { headers: getAuthHeaders() })
    if (r.ok) me.value = await r.json()
  } catch {}
}

async function reloadByView() {
  if (!map) return
  try {
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (range.mode === 'bbox') {
      const b = map.getBounds()
      params.set('bbox', `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`)
    } else {
      const c = map.getCenter()
      params.set('lat', String(c.lat))
      params.set('lng', String(c.lng))
      params.set('radius_km', String(range.radiusKm))
    }
    const r = await fetch(`${apiBase}/points?${params.toString()}`)
    const data = await r.json()
    // 渲染
    markersLayer!.clearLayers()
    data.forEach((p: any) => {
      const color = colorForCategory(p.category)
      const icon = L.divIcon({ className: 'life-pin', html: pinIconHtml(color), iconSize: [18, 24], iconAnchor: [8, 21] })
      L.marker([Number(p.latitude), Number(p.longitude)], { icon })
        .addTo(markersLayer!)
        .bindPopup(`<b>${p.name}</b><br/>${p.description ?? ''}`)
        .bindTooltip(p.name, { direction: 'top', offset: [0, -20] })
    })
  } catch (e) {
    console.error(e)
  }
}

function startAddPoint() {
  if (!token) return ElMessage.warning('请先登录')
  dialogs.submit = true
  newPoint.coord = null
  beginPick()
}

function beginPick() {
  if (!map) return
  // 进入拾取模式时，先关闭弹窗，避免对话框覆盖地图拦截点击
  dialogs.submit = false
  ui.picking = true
  // 设置一次性拾取
  map.once('click', (ev: any) => {
    ui.picking = false
    newPoint.coord = [ev.latlng.lat, ev.latlng.lng]
    // 预览标记
    if (addMarkerPreview) { markersLayer?.removeLayer(addMarkerPreview) }
    const icon = L.divIcon({ className: 'life-pin', html: pinIconHtml(colorForCategory(newPoint.form.category)), iconSize: [18,24], iconAnchor: [8,21] })
    addMarkerPreview = L.marker(ev.latlng, { icon }).addTo(markersLayer!)
    // 选点完成后重新打开提交对话框
    dialogs.submit = true
  })
}

function cancelAddPoint() {
  dialogs.submit = false
  if (addMarkerPreview) { markersLayer?.removeLayer(addMarkerPreview); addMarkerPreview = null }
}

async function submitPoint() {
  if (!newPoint.coord) return
  try {
    const body = {
      name: newPoint.form.name,
      category: newPoint.form.category,
      description: newPoint.form.description,
      address: newPoint.form.address,
      phone: newPoint.form.phone,
      website: newPoint.form.website,
      latitude: newPoint.coord[0],
      longitude: newPoint.coord[1]
    }
    const r = await fetch(`${apiBase}/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(body) })
    if (!r.ok) throw new Error('提交失败')
    ElMessage.success('提交成功，等待管理员审核')
    dialogs.submit = false
    if (addMarkerPreview) { markersLayer?.removeLayer(addMarkerPreview); addMarkerPreview = null }
  } catch (e:any) {
    ElMessage.error(e.message || '提交失败')
  }
}

function openReview() {
  if (me.value?.role !== 'admin') return
  dialogs.review = true
  loadPending()
}

async function loadPending() {
  pending.loading = true
  try {
    const r = await fetch(`${apiBase}/submissions?status=pending`, { headers: getAuthHeaders() })
    const data = await r.json()
    pending.items = Array.isArray(data) ? data : []
  } finally {
    pending.loading = false
  }
}

async function approve(row: any) {
  try {
    const r = await fetch(`${apiBase}/submissions/${row.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({}) })
    if (!r.ok) throw new Error('操作失败')
    ElMessage.success('已通过')
    await loadPending()
    reloadByView()
  } catch (e:any) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function reject(row: any) {
  try {
    const r = await fetch(`${apiBase}/submissions/${row.id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({}) })
    if (!r.ok) throw new Error('操作失败')
    ElMessage.success('已拒绝')
    await loadPending()
  } catch (e:any) {
    ElMessage.error(e.message || '操作失败')
  }
}
</script>

<script lang="ts">
// 补充导出，保持SFC一致性
export default {}
</script>


<style scoped>
.page { min-height: 100vh; background: #f5f7fa; padding-top: 80px; }
.map-container { position: relative; max-width: 1200px; margin: 0 auto; padding: 0 16px 16px; }
.map-toolbar { display: flex; align-items: baseline; gap: 12px; padding: 8px 4px 12px; }
.map-toolbar h2 { margin: 0; font-size: 20px; font-weight: 700; color: #1f2937; }
.map-toolbar .subtitle { margin: 0; color: #6b7280; font-size: 14px; }
.map-toolbar .spacer { flex: 1; }

.map { height: calc(100vh - 140px); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }

.pick-overlay {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 1200;
  pointer-events: none; /* 不阻挡地图事件 */
}

/* 简单图例 */
.legend { position: absolute; right: 24px; top: 64px; background: rgba(255,255,255,0.95); border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); z-index: 1100; }
.legend-item { display: flex; align-items: center; gap: 8px; color: #374151; font-size: 13px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-food { background: #e11d48; }
.dot-grocery { background: #059669; }
.dot-service { background: #2563eb; }
.dot-campus { background: #7c3aed; }

/* 自定义小圆标记 */
.life-dot-icon { display: inline-block; }
.life-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 2px #fff, 0 4px 10px rgba(0,0,0,0.15); }
</style>
