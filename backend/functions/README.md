# Backend Functions

Deployment artifacts are intentionally not deployed under current command restrictions. `service.py` defines deterministic interfaces, `control_plane.py` contains deterministic authorization primitives, `state_machine.py` locks lifecycle transitions, and `contracts.py` contains authoritative Pydantic models.
