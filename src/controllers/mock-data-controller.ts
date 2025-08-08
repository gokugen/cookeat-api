import bcrypt from "bcryptjs";
import { User } from "../../schema";
import { UserType, UserRoles, UserPlans } from "../../types";

const admin = {
	firstName: "ADMIN",
	email: "hadjadjirayane@outlook.fr",
	password: bcrypt.hashSync("123", 10),
	role: UserRoles.ADMIN
};


const users: UserType[] = [
	{
		firstName: "Ahmed",
		email: "hadjadjirayane@gmail.com",
		password: bcrypt.hashSync("admin", 10),
	},
	{
		firstName: "Test",
		email: "test@gmail.com",
		password: bcrypt.hashSync("test", 10),
		plan: UserPlans.PRO
	},
];

async function createAdmin() {
	const u = await User.findOne({ email: admin.email })
	if (!u) {
		await new User(admin).save();
		console.log("ADMIN created")
	}
}

async function createUsers() {
	for (const user of users) {
		const u = await User.findOne({ email: user.email })
		if (!u) {
			await new User(user).save();
			console.log(`User ${user.firstName} created`)
		}
	}
}

async function wipeAndInsert() {
	await User.deleteMany({});

	for (const user of users) {
		await new User(user).save();
		console.log(`USER: ${user.firstName} created`)
	}
}

async function deleteAll() {
	await User.deleteMany({});

	for (const user of users) {
		await new User(user).save();
		console.log(`USER: ${user.firstName} created`)
	}
}

async function insertIfNotExist() {
	await User.deleteMany({});

	await createAdmin();
	await createUsers();
}

export { createUsers, wipeAndInsert, insertIfNotExist, deleteAll }
