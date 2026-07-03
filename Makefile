.PHONY: setup run stop

setup: node_modules prisma/dev.db
	@echo "Checking Ollama model..."
	@ollama pull qwen2.5:7b 2>/dev/null || echo "Skipping Ollama (not installed)"

node_modules:
	npm install

prisma/dev.db:
	npx prisma migrate dev --name init

run:
	@echo "Starting Ollama (background)..."
	@ollama serve &
	@sleep 2
	@echo "Starting dev server..."
	@npm run dev

stop:
	@pkill -f "ollama serve" 2>/dev/null || true
	@echo "Ollama stopped"
