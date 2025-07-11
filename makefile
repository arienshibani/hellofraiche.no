start:dev
run:dev
dev:
	npm run dev -- --open

install:
	pnpm install

help:
	echo "Available commands:"
	echo "  make dev - Start the development server"
	echo "  make install - Install dependencies"
	echo "  make help - Show this help message"