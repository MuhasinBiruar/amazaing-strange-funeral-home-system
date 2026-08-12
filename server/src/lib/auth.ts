import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { username } from "better-auth/plugins";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
    database: new Pool({
        host: process.env.HOST,
        port: parseInt(process.env.PORT || "5432"),
        database: process.env.DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    }),
    user: {
        modelName: "staff",
        fields: {
            createdAt: "dateCreated",
        },
        additionalFields: {
            firstName: { type: "string", required: true },
            middleName: { type: "string", required: false },
            lastName: { type: "string", required: true },
            isActive: { type: "boolean", required: false, defaultValue: true },
            jobRole: { type: "string", required: false, defaultValue: "staff", input: false },
            contactNumber: { type: "string", required: false },
        },
    },
    // advanced: {
    //     database: {
    //         generateId: (options) => {
    //             // Let database auto-generate for specific models
    //             // if (options.model === "user") {
    //             //     return false; // Let database generate ID
    //             // }
    //             // Generate UUIDs for other tables
    //             return crypto.randomUUID();
    //         },
    //     },
    // },
    emailAndPassword: {
        enabled: true,
        disableSignUp: true
    },
    plugins: [
        username({ minUsernameLength: 3, maxUsernameLength: 50 }),
        admin({
            adminUserIds: ["<staffId-of-your-first-admin>"],
        }),
    ]
})

// for account creation, i only want the admin to create accounts, no sign ups and emails will not be used