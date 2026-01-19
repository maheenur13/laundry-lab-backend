import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { UsersService } from "../src/users/users.service";
import { UserRole } from "../src/users/enums/user-role.enum";

async function getDeliveryPersonnel() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log("🚚 Getting all delivery personnel...\n");

    // Method 1: Get all delivery personnel using the dedicated method
    const deliveryPersonnel = await usersService.findDeliveryPersonnel();

    if (deliveryPersonnel.length === 0) {
      console.log("❌ No delivery personnel found in the system");
      return;
    }

    console.log(`✅ Found ${deliveryPersonnel.length} delivery personnel:\n`);

    deliveryPersonnel.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   📱 Phone: ${person.phoneNumber}`);
      console.log(`   🆔 User ID: ${person._id}`);
      console.log(`   📍 Address: ${person.address || "Not provided"}`);
      console.log(`   ✅ Verified: ${person.isVerified ? "Yes" : "No"}`);
      console.log(`   📅 Created: ${person.createdAt.toLocaleDateString()}`);
      console.log("   " + "-".repeat(50));
    });

    // Method 2: Alternative - Get all users with delivery role
    console.log("\n🔍 Alternative method - Get users by role:");
    const deliveryUsers = await usersService.findAll(UserRole.DELIVERY);
    console.log(`Found ${deliveryUsers.length} users with delivery role`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await app.close();
  }
}

// Function to get a specific delivery person by phone
async function getDeliveryPersonByPhone(phoneNumber: string) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log(`🔍 Looking for delivery person with phone: ${phoneNumber}`);

    const person = await usersService.findByPhone(phoneNumber);

    if (!person) {
      console.log("❌ No user found with this phone number");
      return;
    }

    if (person.role !== UserRole.DELIVERY) {
      console.log(`❌ User found but role is '${person.role}', not 'delivery'`);
      return;
    }

    console.log("✅ Delivery person found:");
    console.log(`   👤 Name: ${person.fullName}`);
    console.log(`   📱 Phone: ${person.phoneNumber}`);
    console.log(`   🆔 User ID: ${person._id}`);
    console.log(`   📍 Address: ${person.address || "Not provided"}`);
    console.log(`   ✅ Verified: ${person.isVerified ? "Yes" : "No"}`);
    console.log(`   📅 Created: ${person.createdAt.toLocaleDateString()}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await app.close();
  }
}

// Run the functions
console.log("=".repeat(60));
console.log("           DELIVERY PERSONNEL LOOKUP");
console.log("=".repeat(60));

getDeliveryPersonnel().then(() => {
  console.log("\n" + "=".repeat(60));
  console.log("        SPECIFIC DELIVERY PERSON LOOKUP");
  console.log("=".repeat(60));

  // Look for the specific delivery person we created earlier
  return getDeliveryPersonByPhone("01969093424");
});
