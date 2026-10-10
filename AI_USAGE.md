---


```markdown
# AI Usage Report

**Project:** SurplusLink  
**Developer:** Channabasava

### 1. Where I used AI:
- **Architecture Design:** Used AI to brainstorm the MongoDB Schema relationships to handle the "Multi-Tier" link between Donors, Volunteers, and specific Zone-based access.
- **Tailwind v4 Integration:** Used AI to resolve specific Vite-plugin analysis errors during the setup of the Tailwind v4 PostCSS pipeline.
- **Complex Aggregation:** Used AI to verify the mathematical logic for the "Sum Rule" Dashboard to ensure all KG categories remained in balance across state changes.
- **Validation Logic:** Used AI to double-check the time-gap logic for Rule 7 (60-minute buffer) to ensure millisecond accuracy.

### 2. What I Changed or Rejected:
- **Rejected Generic Time Handling:** The AI suggested using `new Date()` for everything; I rejected this and manually implemented the "Simulated Clock" logic from the requirements to ensure the system ignores the real-world system time.
- **Modified Error Reporting:** Initial AI code suggestions only returned the first error found; I rewrote the validation loop to collect and return **all** violated rules in a single array as required by the problem statement.
- **Custom UI Implementation:** I rejected generic Bootstrap templates and manually built the "Activity Audit Trail" feed at the bottom of the portal to better align with Discover Dollar's focus on transparency and forensic data tracking.

### 3. Final Reflection:
AI served as a pair-programmer to accelerate boilerplate setup and debug environment issues, but all core business logic (The 7 Rules), system integrity checks, and the temporal clock engine were manually verified, reviewed, and logic-tested to ensure 100% compliance with the hackathon requirements.