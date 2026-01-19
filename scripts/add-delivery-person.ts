import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { UsersService } from "../src/users/users.service";
import { UserRole } from "../src/users/enums/user-role.enum";

async function addDeliveryPerson() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Check if user already exists
    const existingUser = await usersService.findByPhone("01969093424");

    if (existingUser) {
      console.log("User already exists with this phone number");

      // Update role to delivery if it's not already
      if (existingUser.role !== UserRole.DELIVERY) {
        // Direct model update for admin operation (role change)
        existingUser.role = UserRole.DELIVERY;
        await existingUser.save();
        console.log("Updated existing user role to delivery");
      } else {
        console.log("User is already a delivery person");
      }
    } else {
      // Create new delivery person
      const deliveryPerson = await usersService.create({
        fullName: "Delivery Person",
        phoneNumber: "01969093424",
        address: "Dhaka, Bangladesh",
        role: UserRole.DELIVERY,
      });

      console.log("Delivery person created successfully:", deliveryPerson._id);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await app.close();
  }
}

addDeliveryPerson();
