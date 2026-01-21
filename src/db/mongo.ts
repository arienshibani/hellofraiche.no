import { MongoClient, Db } from 'mongodb';
import { MONGO_URI } from '$env/static/private';

let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
	if (cachedDb) {
		return cachedDb;
	}

	if (!MONGO_URI) {
		throw new Error('MONGO_URI environment variable is not set. Please check your .env file.');
	}

	console.log('Connecting to MongoDB...');
	const client = new MongoClient(MONGO_URI);

	try {
		await client.connect();
		console.log('Connected to MongoDB');
		cachedDb = client.db("hello-freiche-prod");
		return cachedDb;
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		throw error;
	}
}

export default async function (): Promise<Db> {
	return await connectToDatabase();
}
