const { MongoClient } = require("mongodb");
require("dotenv").config();

async function addDeliveryPerson() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const usersCollection = db.collection("users");

    const deliveryPerson = {
      fullName: "Delivery Person",
      phoneNumber: "01969093424",
      address: "Dhaka, Bangladesh",
      role: "delivery",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      phoneNumber: "01969093424",
    });

    if (existingUser) {
      console.log("User already exists with this phone number");

      // Update role to delivery if it's not already
      if (existingUser.role !== "delivery") {
        await usersCollection.updateOne(
          { phoneNumber: "01969093424" },
          {
            $set: {
              role: "delivery",
              updatedAt: new Date(),
            },
          },
        );
        console.log("Updated existing user role to delivery");
      } else {
        console.log("User is already a delivery person");
      }
    } else {
      // Create new delivery person
      const result = await usersCollection.insertOne(deliveryPerson);
      console.log("Delivery person created successfully:", result.insertedId);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

addDeliveryPerson();
