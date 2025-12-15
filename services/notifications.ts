
import { Order, User } from '../types';
import { sendEmail } from './mailer';
import { GlobalEventBus, EVENTS } from './eventBus';
import { IdentityService } from './identity';

// --- Notification Microservice Logic ---
// Listens to system events and triggers email communications independently

GlobalEventBus.on(EVENTS.ORDER_CREATED, async (order: Order) => {
    // Fetch user details to send email
    // In a real microservice, this might be a separate API call or data contained in the event payload
    const user = await IdentityService.getUserById(order.userId);
    if (user) {
        console.log(`🔔 Notification Service: Sending Confirmation for Order ${order.id}`);
        await sendOrderConfirmationEmail(order, user);
    }
});

GlobalEventBus.on(EVENTS.ORDER_UPDATED, async (order: Order) => {
    const user = await IdentityService.getUserById(order.userId);
    if (user) {
        console.log(`🔔 Notification Service: Sending Status Update (${order.status}) for Order ${order.id}`);
        await sendOrderStatusUpdateEmail(order, user);
    }
});

// ----------------------------------------

export const sendOrderConfirmationEmail = async (order: Order, user: User) => {
  const subject = `Order Confirmation #${order.id.slice(-6)}`;
  const body = `Hi ${user.name},

Thank you for your order with Dietanic! 
We've received your order #${order.id.slice(-6)} and are preparing it with fresh ingredients.

Order Details:
----------------
Total: ₹${order.total.toFixed(2)}
Items: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}

Shipping to:
${order.shippingAddress.street}, ${order.shippingAddress.city}

You can track your order status in your account: ${window.location.origin}/#/account

Stay Healthy!
The Dietanic Team`;

  await sendEmail(user.email, subject, body);
};

export const sendOrderStatusUpdateEmail = async (order: Order, user: User) => {
  const subject = `Update on Order #${order.id.slice(-6)}`;
  const statusFormatted = order.status.charAt(0).toUpperCase() + order.status.slice(1);
  
  const body = `Hi ${user.name},

Great news! The status of your order #${order.id.slice(-6)} has been updated to: ${statusFormatted.toUpperCase()}.

${order.status === 'delivered' ? 'Enjoy your meal! We hope to see you again soon.' : 'You can track the progress in your account: ' + window.location.origin + '/#/account'}

Best,
The Dietanic Team`;

  await sendEmail(user.email, subject, body);
};

export const sendPasswordResetEmail = async (user: User) => {
    const subject = `Password Reset Request`;
    const body = `Hi ${user.name},

We received a request to reset your password for your Dietanic account.

Click the link below to set a new password:
${window.location.origin}/#/reset-password?token=${Date.now()}_${user.id}

If you didn't request this, you can safely ignore this email.

Best,
The Dietanic Team`;

    await sendEmail(user.email, subject, body);
};
