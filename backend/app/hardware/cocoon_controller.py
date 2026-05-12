"""
Master Healing Cocoon controller.
Coordinates all hardware systems (projector, scent, audio).

TODO: Implement real coordination:
- Sync hardware startup/shutdown
- Handle hardware failures gracefully
- Implement safety protocols
- Add telemetry and logging
"""

from app.hardware.projector import ProjectorController
from app.hardware.scent import ScentController
from app.hardware.audio import AudioController


class CocoonController:
    """Master controller for a Healing Cocoon unit."""

    def __init__(self, cocoon_id: str = "cocoon_001"):
        """Initialize a cocoon with all its hardware."""
        self.cocoon_id = cocoon_id
        self.projector = ProjectorController(f"{cocoon_id}_projector")
        self.scent = ScentController(f"{cocoon_id}_scent")
        self.audio = AudioController(f"{cocoon_id}_audio")
        self.is_session_active = False

    def start_session(
        self, environment: str, sound_level: str = "Soft", scent_level: str = "Soft"
    ):
        """
        Start a complete cocoon session with all hardware synchronized.

        Args:
            environment: 'Ocean', 'Forest', 'Space', or 'Calm Garden'
            sound_level: 'Soft', 'Medium', or 'Strong'
            scent_level: 'Soft', 'Medium', or 'Strong'
        """
        # TODO: Add error handling and safety checks
        print(f"\n[COCOON {self.cocoon_id}] Starting session: {environment}")

        # Start all hardware in sequence
        self.projector.start_environment(environment)
        self.audio.play_sound(environment, sound_level)
        self.scent.start_scent(scent_level)

        self.is_session_active = True

    def stop_session(self):
        """Stop all hardware and end the session."""
        print(f"\n[COCOON {self.cocoon_id}] Stopping session")

        # Stop all hardware
        self.projector.stop()
        self.audio.stop()
        self.scent.stop()

        self.is_session_active = False

    def emergency_stop(self):
        """
        Emergency stop - immediately shut down all hardware.
        Used when child needs to exit quickly.
        """
        print(f"\n[COCOON {self.cocoon_id}] EMERGENCY STOP")

        # Immediate shutdown without grace period
        self.projector.stop()
        self.audio.stop()
        self.scent.stop()

        self.is_session_active = False

    def get_status(self) -> dict:
        """Get complete status of all hardware systems."""
        return {
            "cocoon_id": self.cocoon_id,
            "is_session_active": self.is_session_active,
            "projector": self.projector.get_status(),
            "audio": self.audio.get_status(),
            "scent": self.scent.get_status(),
        }


# Global cocoon instances (in production, manage these properly)
# TODO: Implement proper device registry and connection management
cocoons = {
    "cocoon_001": CocoonController("cocoon_001"),
    "cocoon_002": CocoonController("cocoon_002"),
}


def get_cocoon(cocoon_id: str) -> CocoonController | None:
    """Get a cocoon instance by ID."""
    return cocoons.get(cocoon_id)


def get_all_cocoons() -> dict[str, CocoonController]:
    """Get all cocoon instances."""
    return cocoons
