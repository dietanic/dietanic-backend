
import { Order, User, Invoice } from '../types';
import { sendEmail } from './mailer';
import { GlobalEventBus, EVENTS } from './eventBus';
import { IdentityService } from './identity';
import { SalesService } from './sales';

// --- Notification Microservice Logic ---
// Listens to system events and triggers email communications independently

GlobalEventBus.on(EVENTS.ORDER_CREATED, async (order: Order) => {
    // Fetch user details to send email
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

        // --- AUTOMATIC TESTIMONIAL COLLECTION ---
        // If order is delivered and we haven't asked for a review yet
        if (order.status === 'delivered' && !order.testimonialRequested) {
            console.log(`⭐ Notification Service: Triggering Auto-Testimonial Request for ${order.id}`);
            // Mark as requested to prevent duplicates
            order.testimonialRequested = true;
            await SalesService.updateOrder(order);
            
            // Schedule the email (simulated delay of 1 hour in real world, 2s here)
            setTimeout(async () => {
                await sendTestimonialRequestEmail(order, user);
            }, 2000);
        }
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

export const sendTestimonialRequestEmail = async (order: Order, user: User) => {
    const subject = `How was your Dietanic meal? 🥗`;
    const body = `Hi ${user.name},

We hope you enjoyed your recent order from Dietanic!

We'd love to hear your thoughts. Could you spare a minute to rate your experience?
Your feedback helps us keep things fresh and delicious.

Click here to rate your ${order.items[0].name}:
${window.location.origin}/#/product/${order.items[0].id}?review=true

Thanks for being a valued customer!
The Dietanic Team`;

    await sendEmail(user.email, subject, body);
};

export const sendPaymentReminderEmail = async (invoice: Invoice, user: User) => {
    const subject = `Payment Reminder: Invoice #${invoice.id.slice(-6)} Overdue`;
    const body = `Hi ${user.name},

This is a friendly reminder that invoice #${invoice.id.slice(-6)} for ₹${invoice.balanceDue.toFixed(2)} is due.

Please arrange for payment at your earliest convenience to avoid any service interruption.

You can view and pay your invoice here:
${window.location.origin}/#/account?tab=documents

Thank you,
Dietanic Finance Team`;

    await sendEmail(user.email, subject, body);
};
