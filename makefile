default: help

start:dev
run:dev
# Start the development server with auto-open browser
dev:
	npm run dev -- --open

# Install project dependencies using pnpm
install:
	pnpm install

# Run the ingredient price scanner to fetch prices from Kassal.app
price-scan:
	node scripts/price-scanner.js

# Display available make commands with descriptions
help:
	@echo ""
	@echo "Available commands:"
	@echo ""
	@awk 'BEGIN {comment=""; pending_target=""; pending_comment=""} \
	/^#/ {comment=substr($$0, 3); gsub(/^[ \t]+|[ \t]+$$/, "", comment); next} \
	/^[a-zA-Z_-]+:/ { \
		target=$$1; \
		sub(/:$$/, "", target); \
		pending_target=target; \
		pending_comment=comment; \
		comment=""; \
		next \
	} \
	/^[ \t]+/ && pending_target != "" { \
		if (pending_comment != "") { \
			printf "  \033[36mmake %-15s\033[0m %s\n", pending_target, pending_comment \
		} else { \
			printf "  \033[36mmake %-15s\033[0m\n", pending_target \
		} \
		pending_target=""; \
		pending_comment="" \
	}' $(MAKEFILE_LIST)
	@echo ""