// Handle authentication, run things once etc.
import getDatabase from "$db/mongo";

// Initialize database connection on server startup
getDatabase().catch((error) => {
	console.error('Failed to initialize database:', error);
});
