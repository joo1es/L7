import CameraService from '../../../src/services/camera/CameraService';
import type { IViewport } from '../../../src/services/camera/ICameraService';

describe('CameraService subViewports', () => {
  const mockViewport = (center: [number, number] = [0, 0]): IViewport => ({
    syncWithMapCamera: jest.fn(),
    getProjectionMatrix: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    getModelMatrix: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    getViewMatrix: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    getViewMatrixUncentered: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    getViewProjectionMatrix: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    getViewProjectionMatrixUncentered: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    getZoom: () => 1,
    getZoomScale: () => 2,
    getFocalDistance: () => 1,
    getCenter: () => center,
    projectFlat: (lngLat) => lngLat,
  });

  it('should return primary viewport when no subViewports exist', () => {
    const service = new CameraService();
    const primary = mockViewport([0, 0]);
    service.update(primary);

    const sub = service.getSubViewports();
    expect(sub.length).toBe(1);
    expect(sub[0]).toBe(primary);
  });

  it('should delegate getSubViewports to primary viewport', () => {
    const service = new CameraService();
    const primary = mockViewport([0, 0]);
    const sub1 = mockViewport([-360, 0]);
    const sub2 = mockViewport([360, 0]);
    primary.subViewports = [sub1, primary, sub2];

    service.update(primary);

    const sub = service.getSubViewports();
    expect(sub.length).toBe(3);
    expect(sub).toEqual([sub1, primary, sub2]);
  });

  it('should switch and reset viewport correctly', () => {
    const service = new CameraService();
    const primary = mockViewport([0, 0]);
    const sub1 = mockViewport([360, 0]);
    primary.subViewports = [primary, sub1];

    service.update(primary);
    expect(service.getCenter()).toEqual([0, 0]);

    service.setViewport(sub1);
    expect(service.getCenter()).toEqual([360, 0]);

    service.resetViewport();
    expect(service.getCenter()).toEqual([0, 0]);
  });

  it('should not require multi-pass render for a single primary viewport', () => {
    const service = new CameraService();
    const primary = mockViewport([0, 0]);
    service.update(primary);

    expect(service.getRenderViewports()).toEqual([]);
  });

  it('should require multi-pass render for multiple world copies', () => {
    const service = new CameraService();
    const primary = mockViewport([0, 0]);
    const sub1 = mockViewport([-360, 0]);
    const sub2 = mockViewport([360, 0]);
    primary.subViewports = [sub1, primary, sub2];

    service.update(primary);

    expect(service.getRenderViewports()).toEqual([sub1, primary, sub2]);
  });

  it('should require multi-pass render for a single non-primary viewport', () => {
    const service = new CameraService();
    const primary = mockViewport([300, 0]);
    const shifted = mockViewport([-60, 0]);
    // 视口中心超出 ±180° 时，可视区间可能完全落在某个副本世界上，
    // 此时列表里只有一个非主视口，也必须参与渲染与拾取
    primary.subViewports = [shifted];

    service.update(primary);

    const renderViewports = service.getRenderViewports();
    expect(renderViewports.length).toBe(1);
    expect(renderViewports[0]).toBe(shifted);

    service.setViewport(renderViewports[0]);
    expect(service.getCenter()).toEqual([-60, 0]);

    service.resetViewport();
    expect(service.getCenter()).toEqual([300, 0]);
  });
});
