import type { ComponentClass } from './component'
import { Component } from './component'
import type { Event, EventHandler } from './events'
import { EventSystem } from './events'
import type { Space } from './space'
import { uniqueId } from './utils'
import { BitSet } from './utils/bit-set'
import type { World } from './world'

/**
 * An Entity is a collection of Components with a unique id.
 *
 * Entities can have components dynamically added and removed from them.
 *
 * Aside from containing Components, Entities also have an event system that can be used to share data.
 *
 * ```ts
 * import { Component, World } from '@arancini/core'
 *
 * // example tag component without any data or behavior
 * class ExampleComponent extends Component {}
 *
 * // create a world and register the component
 * const world = new World()
 * world.registerComponent(ExampleComponent)
 *
 * // create a space and an entity
 * const space = world.create.space()
 * const entity = world.create.entity()
 *
 * // try retrieving a component that isn't in the entity
 * entity.find(ExampleComponent) // returns `undefined`
 * entity.get(ExampleComponent) // throws Error
 *
 * // add ExampleComponent to the entity
 * const exampleComponent = entity.add(ExampleComponent)
 *
 * entity.has(ExampleComponent) // returns `true`
 * entity.get(ExampleComponent) // returns `exampleComponent`
 * entity.get(ExampleComponent) // returns `exampleComponent`
 *
 * // subscribe to an entity event
 * space.on('event-name', (event) => {
 *   console.log(event)
 * });
 *
 * // emit an entity event
 * space.emit({
 *   topic: 'event-name',
 *   data: { x: 0, y: 0 },
 * });
 *
 * // remove the component
 * entity.remove(ExampleComponent);
 *
 * // destroy the entity
 * entity.destroy();
 * ```
 */
export class Entity {
  /**
   * The unique ID of the entity
   */
  id = uniqueId()

  /**
   * The event system for the entity
   */
  events = new EventSystem()

  /**
   * Whether the entity has been initialised
   */
  initialised = false

  /**
   * The space the entity is in
   */
  space!: Space

  /**
   * The World the entity is in
   */
  world!: World

  /**
   * The BitSet for the entity
   * @private
   */
  _componentsBitSet = new BitSet()

  /**
   * The components for the entity
   * @private
   */
  _components: { [index: string]: Component } = {}

  /**
   * Adds a component to the entity
   * @param clazz the component to add
   */
  add<T extends Component>(
    clazz: ComponentClass<T>,
    ...args: Parameters<T['construct']>
  ): T {
    if (this._components[clazz.componentIndex]) {
      throw new Error(
        `Cannot add component ${clazz.name}, entity with id ${this.id} already has this component`
      )
    }

    // add the component to this entity
    const component = this.world.spaceManager.addComponentToEntity(
      this,
      clazz,
      args
    )

    // inform the query manager that the component has been initialised
    this.world.queryManager.onEntityComponentChange(this)

    return component
  }

  /**
   * Retrieves a component on an entity by type, throws an error if the component is not in the entity
   * @param value a constructor for the component type to retrieve
   * @returns the component
   */
  get<T extends Component>(value: ComponentClass<T>): T {
    const component: Component | undefined =
      this._components[value.componentIndex]

    if (component !== undefined) {
      return component as T
    }

    throw new Error(`Component ${value}} not in entity ${this.id}`)
  }

  /**
   * Returns all components for the entity
   * @returns all components for the entity
   */
  getAll(): Component[] {
    return Object.values(this._components)
  }

  /**
   * Retrieves a component on an entity by type, returns undefined if the component is not in the entity
   * @param value a constructor for the component type to retrieve
   * @returns the component if it is found, or undefined
   */
  find<T extends Component>(value: ComponentClass<T>): T | undefined {
    return this._components[value.componentIndex] as T | undefined
  }

  /**
   * Returns whether the entity contains the given component
   * @param value the component constructor, a component instance, or the string name of the component
   * @returns whether the entity contains the given component
   */
  has(value: ComponentClass): boolean {
    return this._components[value.componentIndex] !== undefined
  }

  /**
   * Removes a component from the entity and destroys it
   * The value can either be a Component constructor, or the component instance itself
   * @param value the component to remove and destroy
   */
  remove(value: Component | ComponentClass): Entity {
    let component: Component | undefined

    if (value instanceof Component) {
      if (!this._components[value._class.componentIndex]) {
        throw new Error('Component instance does not exist in Entity')
      }
      component = value
    } else {
      component = this.find(value)
      if (component === undefined) {
        throw new Error('Component does not exist in Entity')
      }
    }

    this.world.spaceManager.removeComponentFromEntity(this, component)
    this.world.queryManager.onEntityComponentChange(this)

    return this
  }

  /**
   * Adds a handler for entity events
   * @param topic the event topic
   * @param handler the handler function
   * @returns the subscription
   */
  on<E extends Event | Event>(topic: E['topic'], handler: EventHandler<E>) {
    return this.events.on(topic, handler)
  }

  /**
   * Broadcasts an event to the Entity EventSystem
   * @param event the event to broadcast
   */
  emit<E extends Event | Event>(event: E): void {
    this.events.emit(event)
  }

  /**
   * Destroy the Entity's components and remove the Entity from the space
   */
  destroy(): void {
    if (!this.space || !this.world) return

    this.space.world.spaceManager.destroyEntity(this, this.space)
  }
}
