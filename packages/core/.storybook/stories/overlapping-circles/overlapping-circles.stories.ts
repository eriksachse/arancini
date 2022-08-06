import { World } from '@recs/core';
import { useEffect } from '@storybook/client-api';
import { CanvasContext, Circle, Intersecting, Movement } from './components';
import { IntersectionSystem, MovementSystem, Renderer } from './systems';
import { random } from './utils';

export const OverlappingCircles = () => {
  useEffect(() => {
    const world = new World();

    world
      .registerComponent(Circle)
      .registerComponent(Movement)
      .registerComponent(Intersecting)
      .registerComponent(CanvasContext)
      .registerSystem(MovementSystem)
      .registerSystem(Renderer)
      .registerSystem(IntersectionSystem);

    const context = world.build.entity().addComponent(CanvasContext).build();

    const canvas = document.querySelector(
      '#example-canvas'
    ) as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const canvasComponent = context.get(CanvasContext);
    canvasComponent.ctx = canvas.getContext('2d')!;
    canvasComponent.width = canvas.width;
    canvasComponent.height = canvas.height;

    for (let i = 0; i < 30; i++) {
      const entity = world.build
        .entity()
        .addComponent(Circle)
        .addComponent(Movement)
        .build();

      const circle = entity.get(Circle);
      circle.position.set(random(0, canvas.width), random(0, canvas.height));
      circle.radius = random(20, 100);

      const movement = entity.get(Movement);
      movement.velocity.set(random(-20, 20), random(-20, 20));
    }

    window.addEventListener(
      'resize',
      () => {
        canvasComponent.width = canvas.width = window.innerWidth;
        canvasComponent.height = canvas.height = window.innerHeight;
      },
      false
    );

    world.init();
    
    let running = true;
    let lastTime = performance.now();
    function update() {
      if (!running) return;
      const time = performance.now();
      const delta = time - lastTime;
      lastTime = time;
      world.update(delta);
      requestAnimationFrame(update);
    }

    update();

    return () => {
      running = false;
      world.destroy();
    };
  });

  return `
    <canvas id="example-canvas" />
  `;
};

export default {
  name: 'Overlapping Circles',
  component: OverlappingCircles,
};