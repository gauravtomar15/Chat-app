import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// User schema (same as in your models)
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePic: {
        type: String,
        default: ""
    },
    bio: {
        type: String
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// Function to list all users
async function listAllUsers() {
    try {
        // Connect to MongoDB
        const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017";
        await mongoose.connect(`${mongoUrl}/chat-app`);
        console.log("✅ Connected to database: chat-app");
        
        // Get all users
        const users = await User.find({}).select('fullName email profilePic bio createdAt');
        
        console.log("\n📋 All Users in the Database:");
        console.log("=" .repeat(50));
        
        if (users.length === 0) {
            console.log("❌ No users found in the database.");
        } else {
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. User Details:`);
                console.log(`   👤 Name: ${user.fullName}`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🖼️  Profile Pic: ${user.profilePic || 'Not set'}`);
                console.log(`   📝 Bio: ${user.bio || 'Not set'}`);
                console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
                console.log(`   🆔 ID: ${user._id}`);
            });
            
            console.log(`\n📊 Total Users: ${users.length}`);
        }
        
    } catch (error) {
        console.error("❌ Error connecting to database:", error.message);
        console.log("\n💡 Make sure:");
        console.log("   1. MongoDB is running");
        console.log("   2. MONGODB_URL environment variable is set");
        console.log("   3. Database 'chat-app' exists");
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log("\n🔌 Database connection closed.");
    }
}

// Run the function
listAllUsers();
