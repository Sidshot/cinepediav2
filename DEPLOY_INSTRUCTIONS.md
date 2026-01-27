# Deployment Instructions

You are currently in the parent directory (`D:\CinePedia - IDL`). You need to navigate into the repository to deploy.

## Option 1: Quick Deploy (Try this first)

Copy and run these commands in your terminal:

```powershell
cd CinePedia
git fetch --unshallow
git checkout -b feat/glass-ui-v2
git push origin feat/glass-ui-v2
```

## Option 2: Feature Branch Deploy

If you want to create a new branch:

```powershell
cd CinePedia
git checkout -b feature/ui-update
git push origin feature/ui-update
```

**Note:** If `git push` fails with "shallow update not allowed", running `git fetch --unshallow` fixes it.
