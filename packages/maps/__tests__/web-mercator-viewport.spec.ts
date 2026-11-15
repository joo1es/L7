import type { SubViewport } from '../src/lib/web-mercator-viewport';
import Viewport from '../src/lib/web-mercator-viewport';

describe('WebMercatorViewport world copies', () => {
  it('should return single viewport when renderWorldCopies is false', () => {
    const viewport = new Viewport();
    viewport.syncWithMapCamera({
      viewportWidth: 1200,
      viewportHeight: 600,
      center: [0, 0],
      zoom: 0,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: false,
    });

    const subViewports = viewport.getSubViewports();
    expect(subViewports.length).toBe(1);
    expect(subViewports[0]).toBe(viewport);
  });

  it('should return single viewport when zoomed in (single world)', () => {
    const viewport = new Viewport();
    viewport.syncWithMapCamera({
      viewportWidth: 800,
      viewportHeight: 600,
      center: [120, 30],
      zoom: 12,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: true,
    });

    const subViewports = viewport.getSubViewports();
    expect(subViewports.length).toBe(1);
    expect(subViewports[0]).toBe(viewport);
  });

  it('should generate multiple subViewports when zoomed out to global view', () => {
    const viewport = new Viewport();
    viewport.syncWithMapCamera({
      viewportWidth: 1200,
      viewportHeight: 600,
      center: [0, 0],
      zoom: 0,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: true,
    });

    const subViewports = viewport.getSubViewports();
    expect(subViewports.length).toBeGreaterThan(1);

    // Primary viewport is at index 0 or corresponds to worldCopyIndex 0
    const primary = subViewports.find((v) => v === viewport);
    expect(primary).toBeDefined();

    // Check subviewports have offset center
    const sub = subViewports.filter((v) => v !== viewport) as SubViewport[];
    expect(sub.length).toBeGreaterThan(0);
    sub.forEach((subV) => {
      expect(subV.worldCopyIndex).not.toBe(0);
      const [lng] = subV.getCenter();
      expect(lng).toBe(0 - subV.worldCopyIndex * 360);
    });
  });

  it('should handle panning across the antimeridian', () => {
    const viewport = new Viewport();
    viewport.syncWithMapCamera({
      viewportWidth: 800,
      viewportHeight: 600,
      center: [190, 0],
      zoom: 2,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: true,
    });

    const subViewports = viewport.getSubViewports();
    expect(subViewports.length).toBeGreaterThanOrEqual(1);
  });

  it('should keep the single non-primary copy when the view only covers one copy', () => {
    const viewport = new Viewport();
    viewport.syncWithMapCamera({
      viewportWidth: 800,
      viewportHeight: 600,
      // 中心超出 ±180°，可视经度区间 [~230, ~370] 完全落在副本世界上
      center: [300, 0],
      zoom: 2,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: true,
    });

    const subViewports = viewport.getSubViewports() as SubViewport[];
    expect(subViewports.length).toBe(1);
    expect(subViewports[0]).not.toBe(viewport);
    expect(subViewports[0].worldCopyIndex).toBe(1);

    const [lng] = subViewports[0].getCenter();
    expect(lng).toBeCloseTo(-60, 5);
  });
});
