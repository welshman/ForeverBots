# Optional Remote Engine API Contract

When `VITE_SIMULATION_MODE=remote` and `VITE_REMOTE_ENGINE_URL` is set, ForeverBots posts `SimulationRequest` JSON to `POST /v1/simulate` and expects a `SimulationResult` JSON response.
