// Email notification system for order confirmations
// This is a basic implementation that logs emails to console
// In production, integrate with your preferred email service (SendGrid, Resend, etc.)

export interface OrderConfirmationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  merchantName: string;
  merchantEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  orderType: 'delivery' | 'pickup';
  estimatedDelivery: string;
  specialInstructions?: string;
  orderStatus: string;
}

export interface OrderStatusUpdateData {
  orderId: string;
  orderNumber: string;
  newStatus: string;
  previousStatus: string;
  customerName: string;
  customerEmail: string;
  merchantName: string;
  estimatedDelivery?: string;
  updateMessage?: string;
}

// Mock email sending function - replace with actual email service
async function sendEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  // For development, log to console
  console.log('\n📧 EMAIL NOTIFICATION');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML Content:', htmlContent);
  console.log('Text Content:', textContent);
  console.log('─'.repeat(50));
  
  // TODO: Replace with actual email service integration
  // Examples:
  // - SendGrid: await sgMail.send({ to, subject, html: htmlContent, text: textContent })
  // - Resend: await resend.emails.send({ to, subject, html: htmlContent, text: textContent })
  // - Nodemailer: await transporter.sendMail({ to, subject, html: htmlContent, text: textContent })
  
  return { success: true, messageId: `mock_${Date.now()}` };
}

// Send order confirmation email to merchant
export async function sendMerchantOrderConfirmation(data: OrderConfirmationData) {
  const subject = `🔔 New Order #${data.orderNumber} - ${data.merchantName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #28a745; margin-bottom: 20px;">🎉 New Order Received!</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Order Type:</strong> ${data.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
          <p><strong>Estimated ${data.orderType === 'delivery' ? 'Delivery' : 'Pickup'}:</strong> ${new Date(data.estimatedDelivery).toLocaleString()}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3>Items Ordered</h3>
          ${data.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p><strong>${item.name}</strong> × ${item.quantity}</p>
              <p style="color: #666; font-size: 14px;">$${item.price.toFixed(2)} each</p>
              ${item.specialInstructions ? `<p style="color: #dc3545; font-size: 12px; font-style: italic;">Special: ${item.specialInstructions}</p>` : ''}
            </div>
          `).join('')}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #28a745;">
            <p><strong>Subtotal: $${data.subtotal.toFixed(2)}</strong></p>
            ${data.deliveryFee > 0 ? `<p>Delivery Fee: $${data.deliveryFee.toFixed(2)}</p>` : ''}
            <p style="font-size: 18px; color: #28a745;"><strong>Total: $${data.total.toFixed(2)}</strong></p>
          </div>
        </div>

        ${data.orderType === 'delivery' ? `
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3>📍 Delivery Address</h3>
            <p>${data.deliveryAddress.street}<br>
            ${data.deliveryAddress.city}${data.deliveryAddress.postalCode ? `, ${data.deliveryAddress.postalCode}` : ''}<br>
            ${data.deliveryAddress.country}</p>
          </div>
        ` : ''}

        ${data.specialInstructions ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="color: #856404;">📝 Special Instructions</h4>
            <p style="color: #856404;">${data.specialInstructions}</p>
          </div>
        ` : ''}

        <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #155724;">
            <strong>⏰ Please confirm this order in your merchant dashboard</strong>
          </p>
        </div>
      </div>
    </div>
  `;
  
  const textContent = `
    New Order Received - ${data.merchantName}
    
    Order #${data.orderNumber}
    Customer: ${data.customerName}
    Order Type: ${data.orderType}
    Estimated ${data.orderType === 'delivery' ? 'Delivery' : 'Pickup'}: ${new Date(data.estimatedDelivery).toLocaleString()}
    
    Items:
    ${data.items.map(item => `- ${item.name} × ${item.quantity} ($${item.price.toFixed(2)} each)${item.specialInstructions ? ` - Special: ${item.specialInstructions}` : ''}`).join('\n')}
    
    Total: $${data.total.toFixed(2)}
    
    ${data.orderType === 'delivery' ? `
    Delivery Address:
    ${data.deliveryAddress.street}
    ${data.deliveryAddress.city}${data.deliveryAddress.postalCode ? `, ${data.deliveryAddress.postalCode}` : ''}
    ${data.deliveryAddress.country}
    ` : ''}
    
    ${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}` : ''}
    
    Please confirm this order in your merchant dashboard.
  `;
  
  try {
    return await sendEmail(data.merchantEmail, subject, htmlContent, textContent);
  } catch (error) {
    console.error('Failed to send merchant order confirmation:', error);
    return { success: false, error };
  }
}

// Send order confirmation email to customer
export async function sendCustomerOrderConfirmation(data: OrderConfirmationData) {
  const subject = `✅ Order Confirmed #${data.orderNumber} - ${data.merchantName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #007bff; margin-bottom: 20px;">✅ Order Confirmed!</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3>Thank you for your order, ${data.customerName}!</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Merchant:</strong> ${data.merchantName}</p>
          <p><strong>Order Type:</strong> ${data.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
          <p><strong>Estimated ${data.orderType === 'delivery' ? 'Delivery' : 'Ready for Pickup'}:</strong> ${new Date(data.estimatedDelivery).toLocaleString()}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3>Your Order</h3>
          ${data.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p><strong>${item.name}</strong> × ${item.quantity}</p>
              <p style="color: #666; font-size: 14px;">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          `).join('')}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #007bff;">
            <p><strong>Subtotal: $${data.subtotal.toFixed(2)}</strong></p>
            ${data.deliveryFee > 0 ? `<p>Delivery Fee: $${data.deliveryFee.toFixed(2)}</p>` : ''}
            <p style="font-size: 18px; color: #007bff;"><strong>Total: $${data.total.toFixed(2)}</strong></p>
          </div>
        </div>

        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #0c5460;">
            <strong>📱 Track your order status in your account dashboard</strong>
          </p>
        </div>
      </div>
    </div>
  `;
  
  const textContent = `
    Order Confirmed - ${data.merchantName}
    
    Thank you for your order, ${data.customerName}!
    
    Order #${data.orderNumber}
    Merchant: ${data.merchantName}
    Order Type: ${data.orderType}
    Estimated ${data.orderType === 'delivery' ? 'Delivery' : 'Ready for Pickup'}: ${new Date(data.estimatedDelivery).toLocaleString()}
    
    Your Order:
    ${data.items.map(item => `- ${item.name} × ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
    
    Total: $${data.total.toFixed(2)}
    
    Track your order status in your account dashboard.
  `;
  
  try {
    return await sendEmail(data.customerEmail, subject, htmlContent, textContent);
  } catch (error) {
    console.error('Failed to send customer order confirmation:', error);
    return { success: false, error };
  }
}

// Send order status update notification
export async function sendOrderStatusUpdate(data: OrderStatusUpdateData) {
  const statusMessages = {
    pending: '⏳ Your order has been placed and is pending confirmation',
    confirmed: '✅ Your order has been confirmed and is being prepared',
    preparing: '👨‍🍳 Your order is being prepared',
    ready: '🎉 Your order is ready for pickup/delivery',
    out_for_delivery: '🚚 Your order is out for delivery',
    delivered: '✅ Your order has been delivered',
    cancelled: '❌ Your order has been cancelled',
  };
  
  const statusMessage = statusMessages[data.newStatus as keyof typeof statusMessages] || 'Your order status has been updated';
  const subject = `📦 Order Update #${data.orderNumber} - ${statusMessage}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #007bff; margin-bottom: 20px;">${statusMessage}</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p>Hello ${data.customerName},</p>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Merchant:</strong> ${data.merchantName}</p>
          <p><strong>Status Update:</strong> ${data.previousStatus} → <strong>${data.newStatus}</strong></p>
          ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(data.estimatedDelivery).toLocaleString()}</p>` : ''}
        </div>

        ${data.updateMessage ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0;">${data.updateMessage}</p>
          </div>
        ` : ''}

        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #0c5460;">
            <strong>📱 View full order details in your account dashboard</strong>
          </p>
        </div>
      </div>
    </div>
  `;
  
  const textContent = `
    Order Status Update - ${data.merchantName}
    
    Hello ${data.customerName},
    
    Order #${data.orderNumber}
    Status: ${data.newStatus}
    ${data.estimatedDelivery ? `Estimated Delivery: ${new Date(data.estimatedDelivery).toLocaleString()}` : ''}
    
    ${statusMessage}
    ${data.updateMessage ? `\nUpdate: ${data.updateMessage}` : ''}
    
    View full order details in your account dashboard.
  `;
  
  try {
    return await sendEmail(data.customerEmail, subject, htmlContent, textContent);
  } catch (error) {
    console.error('Failed to send order status update:', error);
    return { success: false, error };
  }
}