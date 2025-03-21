# Default recipe to run when just is called without arguments
default:
    just --list

# Install all dependencies
install:
    cd backend && uv sync
    cd ../app && pnpm install

# Start the app development server
dev:
    pnpm dev --host 0.0.0.0 --port 5160

# Build the app for production
build:
    pnpm build

# Run pre-commit hooks
lint:
    pre-commit run --all-files


editor := env_var_or_default("EDITOR", "vim")

env:
    #!/usr/bin/env fish
    if not test -f .env
        echo "No .env file found, creating from template.env"
        cp template.env .env
    end
    {{editor}} .env
