import { useEffect } from '@storybook/client-api';
import World, { Component, System } from '../../src';

type InventoryEvent = {
  topic: 'inventory-event';
  type: 'add' | 'remove';
  entity: string;
  item: string;
  count: number;
};

class Inventory extends Component {
  /**
   * A map of item ids to counts
   */
  items: Map<string, number> = new Map();
}

class InventorySystem extends System {
  queries = {
    inventories: [Inventory],
  };

  onInit(): void {
    this.world.on<InventoryEvent>('inventory-event', (e) => {
      const entity = this.results.inventories.all.find(
        (entity) => entity.id === e.entity
      );

      if (!entity) {
        return;
      }

      const inventory = entity.get(Inventory);

      let itemCount = inventory.items.get(e.item) ?? 0;

      itemCount = itemCount + (e.type === 'add' ? e.count : -e.count);

      if (itemCount <= 0) {
        inventory.items.delete(e.item);
      } else {
        inventory.items.set(e.item, itemCount);
      }
    });
  }
}

export const PlayerInventory = () => {
  useEffect(() => {
    const world = new World();
    world.addSystem(new InventorySystem());

    const space = world.create.space();
    const player = space.create.entity();
    player.addComponent(Inventory);

    world.init();

    document.querySelector('#add-apple')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'add',
        item: 'apple',
        count: 1,
      });
    });

    document.querySelector('#remove-apple')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'remove',
        item: 'apple',
        count: 1,
      });
    });

    document.querySelector('#add-bomb')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'add',
        item: 'bomb',
        count: 1,
      });
    });

    document.querySelector('#remove-bomb')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'remove',
        item: 'bomb',
        count: 1,
      });
    });

    let lastCall = 0;
    const loop = (now: number) => {
      const elapsed = now - lastCall;
      world.update(elapsed);
      lastCall = now;

      document.querySelector('#inventory')!.innerHTML = JSON.stringify({
        id: player.id,
        inventory: Array.from(player.get(Inventory).items.entries()),
      });

      requestAnimationFrame((elapsedMs) => loop(elapsedMs / 1000));
    };

    loop(0);
  });

  return `
    <div>
      <div id="inventory" style="color: white; margin-bottom: 1em;"></div>
      <div>
        <button id="add-apple">add apple</button>
        <button id="remove-apple">remove apple</button>
        <button id="add-bomb">add bomb</button>
        <button id="remove-bomb">remove bomb</button>
      </div>
    </div>
  `;
};

export default {
  name: 'PlayerInventory',
  component: PlayerInventory,
};