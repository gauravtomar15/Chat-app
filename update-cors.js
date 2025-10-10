// Script to help update CORS configuration
// Run this after getting your Vercel URL

const vercelUrl = "https://your-frontend-app.vercel.app"; // Replace with your actual Vercel URL

console.log("Update your server CORS configuration with this URL:");
console.log(vercelUrl);
console.log("\nReplace 'https://your-frontend-app.vercel.app' in server/server.js with:");
console.log(`"${vercelUrl}"`);
