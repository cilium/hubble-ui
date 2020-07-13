import { Position } from '~/domain/geometry/position';

describe('toPrimitive tests', () => {
  test('top', () => {
    expect(Position.Top.toString()).toBe('Top');

    expect(Position.Top !== Position.TopLeft).toBeTruthy();
    expect(Position.Top !== Position.TopRight).toBeTruthy();

    expect(Position.Top > Position.Left).toBeTruthy();
    expect(Position.Top > Position.Center).toBeTruthy();
    expect(Position.Top > Position.Right).toBeTruthy();
    expect(Position.Top > Position.Middle).toBeTruthy();
    expect(Position.Top > Position.MiddleLeft).toBeTruthy();
    expect(Position.Top > Position.MiddleRight).toBeTruthy();
    expect(Position.Top > Position.Bottom).toBeTruthy();
    expect(Position.Top > Position.BottomLeft).toBeTruthy();
    expect(Position.Top > Position.BottomRight).toBeTruthy();
  });

  test('top left', () => {
    expect(Position.TopLeft.toString()).toBe('TopLeft');

    expect(+Position.TopLeft & +Position.Top).toBeGreaterThan(0);
    expect(+Position.TopLeft & +Position.Left).toBeGreaterThan(0);

    expect(Position.TopLeft > Position.Left).toBeTruthy();
    expect(Position.TopLeft > Position.Center).toBeTruthy();
    expect(Position.TopLeft > Position.Right).toBeTruthy();
    expect(Position.TopLeft > Position.Middle).toBeTruthy();
    expect(Position.TopLeft > Position.MiddleLeft).toBeTruthy();
    expect(Position.TopLeft > Position.MiddleRight).toBeTruthy();
    expect(Position.TopLeft > Position.Bottom).toBeTruthy();
    expect(Position.TopLeft > Position.BottomLeft).toBeTruthy();
    expect(Position.TopLeft > Position.BottomRight).toBeTruthy();
  });

  test('top center', () => {
    expect(Position.TopCenter.toString()).toBe('TopCenter');

    expect(+Position.TopCenter & +Position.Top).toBeGreaterThan(0);
    expect(+Position.TopCenter & +Position.Center).toBeGreaterThan(0);

    expect(Position.TopCenter > Position.Left).toBeTruthy();
    expect(Position.TopCenter > Position.Center).toBeTruthy();
    expect(Position.TopCenter > Position.Right).toBeTruthy();
    expect(Position.TopCenter > Position.Middle).toBeTruthy();
    expect(Position.TopCenter > Position.MiddleLeft).toBeTruthy();
    expect(Position.TopCenter > Position.MiddleRight).toBeTruthy();
    expect(Position.TopCenter > Position.Bottom).toBeTruthy();
    expect(Position.TopCenter > Position.BottomLeft).toBeTruthy();
    expect(Position.TopCenter > Position.BottomRight).toBeTruthy();
  });

  test('top right', () => {
    expect(Position.TopRight.toString()).toBe('TopRight');

    expect(+Position.TopRight & +Position.Top).toBeGreaterThan(0);
    expect(+Position.TopRight & +Position.Right).toBeGreaterThan(0);

    expect(Position.TopRight > Position.Left).toBeTruthy();
    expect(Position.TopRight > Position.Center).toBeTruthy();
    expect(Position.TopRight > Position.Right).toBeTruthy();
    expect(Position.TopRight > Position.Middle).toBeTruthy();
    expect(Position.TopRight > Position.MiddleLeft).toBeTruthy();
    expect(Position.TopRight > Position.MiddleRight).toBeTruthy();
    expect(Position.TopRight > Position.Bottom).toBeTruthy();
    expect(Position.TopRight > Position.BottomLeft).toBeTruthy();
    expect(Position.TopRight > Position.BottomRight).toBeTruthy();
  });

  test('middle', () => {
    expect(Position.Middle.toString()).toBe('Middle');

    expect(Position.Middle !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Middle !== Position.MiddleRight).toBeTruthy();

    expect(Position.Middle < Position.Top).toBeTruthy();
    expect(Position.Middle < Position.TopLeft).toBeTruthy();
    expect(Position.Middle < Position.TopRight).toBeTruthy();
    expect(Position.Middle > Position.Bottom).toBeTruthy();
    expect(Position.Middle > Position.BottomLeft).toBeTruthy();
    expect(Position.Middle > Position.BottomRight).toBeTruthy();
  });

  test('middle left', () => {
    expect(Position.MiddleLeft.toString()).toBe('MiddleLeft');

    expect(Position.MiddleLeft === Position.MiddleLeft).toBeTruthy();
    expect(+Position.MiddleLeft & +Position.Middle).toBeGreaterThan(0);
    expect(+Position.MiddleLeft & +Position.Left).toBeGreaterThan(0);

    expect(Position.MiddleLeft < Position.Top).toBeTruthy();
    expect(Position.MiddleLeft < Position.TopLeft).toBeTruthy();
    expect(Position.MiddleLeft < Position.TopRight).toBeTruthy();
    expect(Position.MiddleLeft > Position.Bottom).toBeTruthy();
    expect(Position.MiddleLeft > Position.BottomLeft).toBeTruthy();
    expect(Position.MiddleLeft > Position.BottomRight).toBeTruthy();
  });

  test('middle center', () => {
    expect(Position.MiddleCenter.toString()).toBe('MiddleCenter');

    expect(Position.MiddleCenter === Position.MiddleCenter).toBeTruthy();
    expect(+Position.MiddleCenter & +Position.Middle).toBeGreaterThan(0);
    expect(+Position.MiddleCenter & +Position.Center).toBeGreaterThan(0);

    expect(Position.MiddleCenter < Position.Top).toBeTruthy();
    expect(Position.MiddleCenter < Position.TopLeft).toBeTruthy();
    expect(Position.MiddleCenter < Position.TopRight).toBeTruthy();
    expect(Position.MiddleCenter > Position.Bottom).toBeTruthy();
    expect(Position.MiddleCenter > Position.BottomLeft).toBeTruthy();
    expect(Position.MiddleCenter > Position.BottomRight).toBeTruthy();
  });

  test('middle right', () => {
    expect(Position.MiddleRight.toString()).toBe('MiddleRight');

    expect(Position.MiddleRight === Position.MiddleRight).toBeTruthy();
    expect(+Position.MiddleRight & +Position.Middle).toBeGreaterThan(0);
    expect(+Position.MiddleRight & +Position.Right).toBeGreaterThan(0);

    expect(Position.MiddleRight < Position.Top).toBeTruthy();
    expect(Position.MiddleRight < Position.TopLeft).toBeTruthy();
    expect(Position.MiddleRight < Position.TopRight).toBeTruthy();
    expect(Position.MiddleRight > Position.Bottom).toBeTruthy();
    expect(Position.MiddleRight > Position.BottomLeft).toBeTruthy();
    expect(Position.MiddleRight > Position.BottomRight).toBeTruthy();
  });

  test('bottom', () => {
    expect(Position.Bottom.toString()).toBe('Bottom');

    expect(Position.Bottom === Position.Bottom).toBeTruthy();
    expect(Position.Bottom !== Position.BottomLeft).toBeTruthy();
    expect(Position.Bottom !== Position.BottomRight).toBeTruthy();

    expect(Position.Bottom < Position.Middle).toBeTruthy();
    expect(Position.Bottom < Position.MiddleLeft).toBeTruthy();
    expect(Position.Bottom < Position.MiddleRight).toBeTruthy();
    expect(Position.Bottom < Position.Top).toBeTruthy();
    expect(Position.Bottom < Position.TopLeft).toBeTruthy();
    expect(Position.Bottom < Position.TopRight).toBeTruthy();
  });

  test('bottom left', () => {
    expect(Position.BottomLeft.toString()).toBe('BottomLeft');

    expect(Position.BottomLeft === Position.BottomLeft).toBeTruthy();
    expect(+Position.BottomLeft & +Position.Bottom).toBeGreaterThan(0);
    expect(+Position.BottomLeft & +Position.Left).toBeGreaterThan(0);

    expect(Position.BottomLeft < Position.Middle).toBeTruthy();
    expect(Position.BottomLeft < Position.MiddleLeft).toBeTruthy();
    expect(Position.BottomLeft < Position.MiddleRight).toBeTruthy();
    expect(Position.BottomLeft < Position.Top).toBeTruthy();
    expect(Position.BottomLeft < Position.TopLeft).toBeTruthy();
    expect(Position.BottomLeft < Position.TopRight).toBeTruthy();
  });

  test('bottom center', () => {
    expect(Position.BottomCenter.toString()).toBe('BottomCenter');

    expect(Position.BottomCenter === Position.BottomCenter).toBeTruthy();
    expect(+Position.BottomCenter & +Position.Bottom).toBeGreaterThan(0);
    expect(+Position.BottomCenter & +Position.Center).toBeGreaterThan(0);

    expect(Position.BottomCenter < Position.Middle).toBeTruthy();
    expect(Position.BottomCenter < Position.MiddleLeft).toBeTruthy();
    expect(Position.BottomCenter < Position.MiddleRight).toBeTruthy();
    expect(Position.BottomCenter < Position.Top).toBeTruthy();
    expect(Position.BottomCenter < Position.TopLeft).toBeTruthy();
    expect(Position.BottomCenter < Position.TopRight).toBeTruthy();
  });

  test('bottom right', () => {
    expect(Position.BottomRight.toString()).toBe('BottomRight');

    expect(Position.BottomRight === Position.BottomRight).toBeTruthy();
    expect(+Position.BottomRight & +Position.Bottom).toBeGreaterThan(0);
    expect(+Position.BottomRight & +Position.Right).toBeGreaterThan(0);

    expect(Position.BottomRight < Position.Middle).toBeTruthy();
    expect(Position.BottomRight < Position.MiddleLeft).toBeTruthy();
    expect(Position.BottomRight < Position.MiddleRight).toBeTruthy();
    expect(Position.BottomRight < Position.Top).toBeTruthy();
    expect(Position.BottomRight < Position.TopLeft).toBeTruthy();
    expect(Position.BottomRight < Position.TopRight).toBeTruthy();
  });
});

describe('sanity check', () => {
  test('left', () => {
    expect(Position.Left.toString()).toBe('Left');

    expect(Position.Left === Position.Left).toBeTruthy();
    expect(Position.Left !== Position.Right).toBeTruthy();
    expect(Position.Left !== Position.Center).toBeTruthy();
    expect(Position.Left !== Position.Top).toBeTruthy();
    expect(Position.Left !== Position.Middle).toBeTruthy();
    expect(Position.Left !== Position.Bottom).toBeTruthy();
    expect(Position.Left !== Position.TopLeft).toBeTruthy();
    expect(Position.Left !== Position.TopCenter).toBeTruthy();
    expect(Position.Left !== Position.TopRight).toBeTruthy();
    expect(Position.Left !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Left !== Position.MiddleCenter).toBeTruthy();
    expect(Position.Left !== Position.MiddleRight).toBeTruthy();
    expect(Position.Left !== Position.BottomLeft).toBeTruthy();
    expect(Position.Left !== Position.BottomCenter).toBeTruthy();
    expect(Position.Left !== Position.BottomRight).toBeTruthy();
  });

  test('right', () => {
    expect(Position.Right.toString()).toBe('Right');

    expect(Position.Right === Position.Right).toBeTruthy();
    expect(Position.Right !== Position.Left).toBeTruthy();
    expect(Position.Right !== Position.Center).toBeTruthy();
    expect(Position.Right !== Position.Top).toBeTruthy();
    expect(Position.Right !== Position.Middle).toBeTruthy();
    expect(Position.Right !== Position.Bottom).toBeTruthy();
    expect(Position.Right !== Position.TopLeft).toBeTruthy();
    expect(Position.Right !== Position.TopCenter).toBeTruthy();
    expect(Position.Right !== Position.TopRight).toBeTruthy();
    expect(Position.Right !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Right !== Position.MiddleCenter).toBeTruthy();
    expect(Position.Right !== Position.MiddleRight).toBeTruthy();
    expect(Position.Right !== Position.BottomLeft).toBeTruthy();
    expect(Position.Right !== Position.BottomCenter).toBeTruthy();
    expect(Position.Right !== Position.BottomRight).toBeTruthy();
  });

  test('center', () => {
    expect(Position.Center.toString()).toBe('Center');

    expect(Position.Center === Position.Center).toBeTruthy();
    expect(Position.Center !== Position.Left).toBeTruthy();
    expect(Position.Center !== Position.Right).toBeTruthy();
    expect(Position.Center !== Position.Top).toBeTruthy();
    expect(Position.Center !== Position.Middle).toBeTruthy();
    expect(Position.Center !== Position.Bottom).toBeTruthy();
    expect(Position.Center !== Position.TopLeft).toBeTruthy();
    expect(Position.Center !== Position.TopCenter).toBeTruthy();
    expect(Position.Center !== Position.TopRight).toBeTruthy();
    expect(Position.Center !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Center !== Position.MiddleCenter).toBeTruthy();
    expect(Position.Center !== Position.MiddleRight).toBeTruthy();
    expect(Position.Center !== Position.BottomLeft).toBeTruthy();
    expect(Position.Center !== Position.BottomCenter).toBeTruthy();
    expect(Position.Center !== Position.BottomRight).toBeTruthy();
  });

  test('top', () => {
    expect(Position.Top.toString()).toBe('Top');

    expect(Position.Top === Position.Top).toBeTruthy();
    expect(Position.Top !== Position.Left).toBeTruthy();
    expect(Position.Top !== Position.Right).toBeTruthy();
    expect(Position.Top !== Position.Center).toBeTruthy();
    expect(Position.Top !== Position.Middle).toBeTruthy();
    expect(Position.Top !== Position.Bottom).toBeTruthy();
    expect(Position.Top !== Position.TopLeft).toBeTruthy();
    expect(Position.Top !== Position.TopCenter).toBeTruthy();
    expect(Position.Top !== Position.TopRight).toBeTruthy();
    expect(Position.Top !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Top !== Position.MiddleCenter).toBeTruthy();
    expect(Position.Top !== Position.MiddleRight).toBeTruthy();
    expect(Position.Top !== Position.BottomLeft).toBeTruthy();
    expect(Position.Top !== Position.BottomCenter).toBeTruthy();
    expect(Position.Top !== Position.BottomRight).toBeTruthy();
  });

  test('bottom', () => {
    expect(Position.Bottom.toString()).toBe('Bottom');

    expect(Position.Bottom === Position.Bottom).toBeTruthy();
    expect(Position.Bottom !== Position.Left).toBeTruthy();
    expect(Position.Bottom !== Position.Right).toBeTruthy();
    expect(Position.Bottom !== Position.Center).toBeTruthy();
    expect(Position.Bottom !== Position.Middle).toBeTruthy();
    expect(Position.Bottom !== Position.Top).toBeTruthy();
    expect(Position.Bottom !== Position.TopLeft).toBeTruthy();
    expect(Position.Bottom !== Position.TopCenter).toBeTruthy();
    expect(Position.Bottom !== Position.TopRight).toBeTruthy();
    expect(Position.Bottom !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Bottom !== Position.MiddleCenter).toBeTruthy();
    expect(Position.Bottom !== Position.MiddleRight).toBeTruthy();
    expect(Position.Bottom !== Position.BottomLeft).toBeTruthy();
    expect(Position.Bottom !== Position.BottomCenter).toBeTruthy();
    expect(Position.Bottom !== Position.BottomRight).toBeTruthy();
  });

  test('middle', () => {
    expect(Position.Middle.toString()).toBe('Middle');

    expect(Position.Middle === Position.Middle).toBeTruthy();
    expect(Position.Middle !== Position.Left).toBeTruthy();
    expect(Position.Middle !== Position.Right).toBeTruthy();
    expect(Position.Middle !== Position.Center).toBeTruthy();
    expect(Position.Middle !== Position.Bottom).toBeTruthy();
    expect(Position.Middle !== Position.Top).toBeTruthy();
    expect(Position.Middle !== Position.TopLeft).toBeTruthy();
    expect(Position.Middle !== Position.TopCenter).toBeTruthy();
    expect(Position.Middle !== Position.TopRight).toBeTruthy();
    expect(Position.Middle !== Position.MiddleLeft).toBeTruthy();
    expect(Position.Middle !== Position.MiddleCenter).toBeTruthy();
    expect(Position.Middle !== Position.MiddleRight).toBeTruthy();
    expect(Position.Middle !== Position.BottomLeft).toBeTruthy();
    expect(Position.Middle !== Position.BottomCenter).toBeTruthy();
    expect(Position.Middle !== Position.BottomRight).toBeTruthy();
  });
});

describe('x coordinate tests', () => {
  test('top', () => {
    expect(Position.TopLeft.x < Position.TopCenter.x).toBeTruthy();
    expect(Position.TopLeft.x < Position.TopRight.x).toBeTruthy();
    expect(Position.TopLeft.x < Position.MiddleCenter.x).toBeTruthy();
    expect(Position.TopLeft.x < Position.MiddleRight.x).toBeTruthy();
    expect(Position.TopLeft.x < Position.BottomCenter.x).toBeTruthy();
    expect(Position.TopLeft.x < Position.BottomRight.x).toBeTruthy();

    expect(Position.TopLeft.x < Position.MiddleLeft.x).toBeFalsy();
    expect(Position.TopLeft.x < Position.BottomLeft.x).toBeFalsy();

    expect(Position.TopCenter.x < Position.TopRight.x).toBeTruthy();
    expect(Position.TopCenter.x < Position.MiddleRight.x).toBeTruthy();
    expect(Position.TopCenter.x < Position.BottomRight.x).toBeTruthy();

    expect(Position.TopCenter.x === Position.BottomCenter.x).toBeTruthy();
    expect(Position.TopCenter.x === Position.MiddleCenter.x).toBeTruthy();
  });

  test('middle', () => {
    expect(Position.MiddleLeft.x < Position.TopRight.x).toBeTruthy();
    expect(Position.MiddleLeft.x < Position.TopCenter.x).toBeTruthy();
    expect(Position.MiddleLeft.x < Position.MiddleRight.x).toBeTruthy();
    expect(Position.MiddleLeft.x < Position.MiddleCenter.x).toBeTruthy();
    expect(Position.MiddleLeft.x < Position.BottomRight.x).toBeTruthy();
    expect(Position.MiddleLeft.x < Position.BottomCenter.x).toBeTruthy();

    expect(Position.MiddleCenter.x < Position.TopRight.x).toBeTruthy();
    expect(Position.MiddleCenter.x < Position.MiddleRight.x).toBeTruthy();
    expect(Position.MiddleCenter.x < Position.BottomRight.x).toBeTruthy();

    expect(Position.MiddleCenter.x > Position.BottomLeft.x).toBeTruthy();
    expect(Position.MiddleCenter.x === Position.BottomCenter.x).toBeTruthy();
  });

  test('bottom', () => {
    expect(Position.BottomLeft.x < Position.TopRight.x).toBeTruthy();
    expect(Position.BottomLeft.x < Position.TopCenter.x).toBeTruthy();
    expect(Position.BottomLeft.x < Position.MiddleRight.x).toBeTruthy();
    expect(Position.BottomLeft.x < Position.MiddleCenter.x).toBeTruthy();
    expect(Position.BottomLeft.x < Position.BottomRight.x).toBeTruthy();
    expect(Position.BottomLeft.x < Position.BottomCenter.x).toBeTruthy();

    expect(Position.BottomCenter.x < Position.TopRight.x).toBeTruthy();
    expect(Position.BottomCenter.x < Position.MiddleRight.x).toBeTruthy();
    expect(Position.BottomCenter.x < Position.BottomRight.x).toBeTruthy();

    expect(Position.BottomLeft.x === Position.MiddleLeft.x).toBeTruthy();
  });
});
