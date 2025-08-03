// Example usage of the simplified Spreadsheet ORM

import { boolean, date, number, SpreadsheetClient, string } from "./index";

// 1. Define your schema for a single table
const userSchema = {
	id: number("ID", { primary: true }),
	name: string("Name"),
	email: string("Email"),
	age: number("Age"),
	isActive: boolean("IsActive", { default: true }),
	createdAt: date("CreatedAt", { default: () => new Date() }),
};

// 2. Create client for the table
const userClient = new SpreadsheetClient({
	spreadsheetId: "your-spreadsheet-id",
	sheetName: "Users",
	schema: userSchema,
});

// 3. Usage examples with full type safety
async function examples() {
	// Find all users
	const allUsers = await userClient.findMany();
	console.log(allUsers[0].name); // Type: string
	console.log(allUsers[0].age); // Type: number

	// Find users with conditions
	const activeUsers = await userClient.findMany({
		where: {
			isActive: true,
			age: { gte: 18 },
		},
		orderBy: {
			name: "asc",
		},
		take: 10,
	});

	// Find a specific user
	const user = await userClient.findUnique({
		where: { id: 1 },
	});
	console.log(user?.name); // Type: string | undefined

	// Create a new user
	const newUser = await userClient.create({
		data: {
			name: "John Doe",
			email: "john@example.com",
			age: 30,
			// isActive and createdAt will use defaults
		},
	});
	console.log(newUser.name); // Type: string

	// Update a user
	const updatedUser = await userClient.update({
		where: { id: 1 },
		data: { age: 31 },
	});
	console.log(updatedUser.age); // Type: number

	// Delete a user
	const deletedUser = await userClient.delete({
		where: { id: 1 },
	});
	console.log(deletedUser.name); // Type: string

	// Count users
	const userCount = await userClient.count({
		where: { isActive: true },
	});
	console.log(userCount); // Type: number
}

// Example with custom union types
const statusSchema = {
	id: number("ID", { primary: true }),
	status: string("Status") as import("./types").ColumnDef<
		"draft" | "published" | "archived"
	>,
	title: string("Title"),
};

const postClient = new SpreadsheetClient({
	spreadsheetId: "your-spreadsheet-id",
	sheetName: "Posts",
	schema: statusSchema,
});

async function customTypeExample() {
	const post = await postClient.create({
		data: {
			status: "draft", // Type: "draft" | "published" | "archived"
			title: "My Post",
		},
	});
	console.log(post.status); // Type: "draft" | "published" | "archived"
}
