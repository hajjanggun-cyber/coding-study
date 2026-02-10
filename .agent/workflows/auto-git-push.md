---
description: Automatically push changes to GitHub
---

This workflow automatically commits and pushes all changes to GitHub.

// turbo-all

1. Add all changes
   ```bash
   git add .
   ```

2. Commit changes with timestamp
   ```bash
   git commit -m "Auto-update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
   ```

3. Push to remote
   ```bash
   git push origin main
   ```

Note: This workflow will automatically run all steps without user confirmation due to the 'turbo-all' annotation.
