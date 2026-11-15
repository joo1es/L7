---
'@antv/l7-core': minor
'@antv/l7-maps': minor
'@antv/l7-layers': minor
---

feat(map): support `renderWorldCopies` with multi-pass sub-viewports

使用 MapLibre / Mapbox 底图并开启世界副本（`renderWorldCopies: true`）时，底图会在
低级别（zoom 0~3）或横向平移越过 ±180° 后平铺多个世界副本，但 L7 的业务图层只在
原始世界绘制，副本区域的数据丢失（#2888）。

本次改动参考 deck.gl 的 `subViewports` + 多 pass 平移重绘思路：

- `@antv/l7-maps`：`web-mercator-viewport.ts` 根据屏幕包围盒的经度区间推导可视世界
  索引范围 `k ∈ [kMin, kMax]`，派生出平移 `-k × 360°` 的 `SubViewport`；
  `mapbox-base-map.ts` 同步 `renderWorldCopies` 配置。
- `@antv/l7-core`：`ICameraService` 增加 `getSubViewports()` / `getRenderViewports()` /
  `setViewport()` / `resetViewport()`；`LayerService` 在多世界副本下逐视口渲染，
  保证各图层的 Z 序与混合顺序在所有副本上一致。
- `@antv/l7-layers`：`LayerPickService` 的 picking 绘制同步遍历副本视口，使任意副本上
  的要素都能被正确拾取。

`getRenderViewports()` 是渲染/拾取唯一的「是否需要多 pass」判据：仅有一个主视口时返回
空数组，保持原有单 pass 路径的开销不变；只要存在世界副本就返回完整列表——包括只存在
**一个非主视口**的情况（视口中心超出 ±180° 且可视区间整体落在副本世界上）。
