
type EventHandler = (data: any) => void | Promise<void>;

class EventBus {
  private events: { [key: string]: EventHandler[] } = {};

  // Subscribe to an event
  on(event: string, handler: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  // Unsubscribe
  off(event: string, handler: EventHandler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  // Publish an event
  async emit(event: string, data: any) {
    if (!this.events[event]) return;
    
    // Execute all handlers (simulating async microservice consumption)
    const promises = this.events[event].map(handler => {
        try {
            return handler(data);
        } catch (err) {
            console.error(`Error in event handler for ${event}:`, err);
            return Promise.resolve();
        }
    });
    
    await Promise.all(promises);
  }
}

export const GlobalEventBus = new EventBus();

// Defined System Events
export const EVENTS = {
    // Transactional Events (Saga)
    SAGA_STARTED: 'SAGA_STARTED',
    SAGA_COMPLETED: 'SAGA_COMPLETED',
    SAGA_FAILED: 'SAGA_FAILED',
    
    // Domain Events
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_UPDATED: 'ORDER_UPDATED',
    PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
    PRODUCT_UPDATED: 'PRODUCT_UPDATED',
    CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
    USER_REGISTERED: 'USER_REGISTERED'
};
