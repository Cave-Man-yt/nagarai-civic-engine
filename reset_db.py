"""
Database Reset Utility for NagarAI Civic Intelligence Engine
PS-S05

Clears all active complaint clusters and resets the system state to start fresh.
"""

import sys
from deduplicator import clear_all_complaints, DEFAULT_STORE

# ANSI Colors
HEADER = "\033[95m\033[1m"
GREEN = "\033[92m"
BOLD = "\033[1m"
RESET = "\033[0m"


def main():
    print("\n" + "=" * 70)
    print(f"{HEADER}NAGARAI ENGINE — SYSTEM RESET{RESET}".center(70))
    print("=" * 70)

    clear_all_complaints(DEFAULT_STORE)

    print(f"\n{GREEN}{BOLD}✓ SUCCESS: All stored complaints and clusters have been cleared!{RESET}")
    print("System is now completely fresh and ready for new complaint submissions.\n")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
