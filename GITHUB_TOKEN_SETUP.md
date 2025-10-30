# GitHub Personal Access Token Setup

## Quick Guide to Create and Use GitHub Token

### Step 1: Create Personal Access Token

1. **Go to GitHub Token Settings:**
   - Open: https://github.com/settings/tokens
   - Or: GitHub → Settings (top right) → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click "Generate new token" button
   - Select "Generate new token (classic)"

3. **Configure Token:**
   - **Note:** `Git operations for radio-constanta` (or any description)
   - **Expiration:** Select `90 days` (or your preference)
   - **Select scopes:** Check the `repo` box
     - This gives full control of private repositories
     - Includes push, pull, and clone access

4. **Generate and Copy:**
   - Click "Generate token" at the bottom
   - **IMPORTANT:** Copy the token immediately!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You won't be able to see it again!

### Step 2: Use Token to Push

1. **Run the push command:**
   ```bash
   git push -u origin main
   ```

2. **Enter credentials:**
   ```
   Username for 'https://github.com': turlacu
   Password for 'https://turlacu@github.com': [paste your token here]
   ```

   **Note:** Paste the token (not your password) when prompted for password

3. **Push should succeed!**

### Step 3: Save Token for Future Use (Optional)

To avoid entering the token every time:

**Option A: Git Credential Helper (Recommended)**
```bash
git config --global credential.helper store
```

Then push once with the token - Git will save it.

**Option B: Switch to SSH** (see below)

---

## Alternative: Use SSH Instead (Recommended for Long-term)

SSH is more convenient - no passwords or tokens needed.

### Step 1: Check for Existing SSH Key

```bash
ls -la ~/.ssh
```

Look for `id_rsa.pub` or `id_ed25519.pub`. If found, skip to Step 3.

### Step 2: Generate SSH Key (if needed)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- Press Enter to accept default location
- Enter a passphrase (optional but recommended)

### Step 3: Copy SSH Public Key

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519 ...`)

### Step 4: Add SSH Key to GitHub

1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Title: `WSL Ubuntu` (or any name)
4. Key type: `Authentication Key`
5. Paste your public key
6. Click "Add SSH key"

### Step 5: Change Remote to SSH

```bash
cd /home/turlacu/radio
git remote set-url origin git@github.com:turlacu/radio-constanta.git
```

### Step 6: Test and Push

```bash
# Test SSH connection
ssh -T git@github.com

# Should see: "Hi turlacu! You've successfully authenticated..."

# Now push
git push -u origin main
```

No password or token needed! 🎉

---

## Summary

**Quick (5 minutes):**
- Create Personal Access Token
- Use token as password when pushing

**Better (10 minutes):**
- Set up SSH key
- Add to GitHub
- Never enter credentials again

Both work - SSH is better for long-term use!
