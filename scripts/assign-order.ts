import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { OrdersService } from "../src/orders/orders.service";
import { UsersService } from "../src/users/users.service";
import { UserRole } from "../src/users/enums/user-role.enum";
import { UserDocument } from "../src/users/schemas/user.schema";

async function assignOrderToDelivery() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ordersService = app.get(OrdersService);
  const usersService = app.get(UsersService);

  try {
    // Find delivery person by phone number
    const deliveryPerson = await usersService.findByPhone("01969093424");

    if (!deliveryPerson) {
      console.log("Delivery person not found with phone number 01969093424");
      return;
    }

    if (deliveryPerson.role !== UserRole.DELIVERY) {
      console.log("User is not a delivery person");
      return;
    }

    console.log(
      "Found delivery person:",
      deliveryPerson.fullName,
      deliveryPerson._id,
    );

    // Get unassigned orders
    const unassignedOrders = await ordersService.getUnassignedOrders();

    if (unassignedOrders.length === 0) {
      console.log("No unassigned orders found");
      return;
    }

    console.log(`Found ${unassignedOrders.length} unassigned orders:`);
    unassignedOrders.forEach((order, index) => {
      // Safe access to populated customer field
      const customer = order.customer as unknown as UserDocument;
      const customerName = customer?.fullName || "Unknown Customer";
      console.log(
        `${index + 1}. Order ID: ${order._id}, Customer: ${customerName}, Total: ${order.pricing.grandTotal} BDT`,
      );
    });

    // Assign the first unassigned order (you can modify this logic)
    const orderToAssign = unassignedOrders[0];

    const assignedOrder = await ordersService.assignDeliveryPerson(
      orderToAssign._id.toString(),
      { deliveryPersonId: deliveryPerson._id.toString() },
    );

    console.log(
      `✅ Successfully assigned order ${assignedOrder._id} to ${deliveryPerson.fullName}`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await app.close();
  }
}

// You can also create a function to assign a specific order
async function assignSpecificOrder(orderId: string, deliveryPhone: string) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ordersService = app.get(OrdersService);
  const usersService = app.get(UsersService);

  try {
    // Find delivery person
    const deliveryPerson = await usersService.findByPhone(deliveryPhone);

    if (!deliveryPerson || deliveryPerson.role !== UserRole.DELIVERY) {
      console.log("Delivery person not found or invalid role");
      return;
    }

    // Assign specific order
    const assignedOrder = await ordersService.assignDeliveryPerson(orderId, {
      deliveryPersonId: deliveryPerson._id.toString(),
    });

    console.log(
      `✅ Successfully assigned order ${assignedOrder._id} to ${deliveryPerson.fullName}`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await app.close();
  }
}

// Run the assignment
assignOrderToDelivery();

// Uncomment and modify to assign a specific order:
// assignSpecificOrder('ORDER_ID_HERE', '01969093424');
