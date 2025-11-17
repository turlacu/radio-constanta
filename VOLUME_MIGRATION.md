# Volume Migration Guide

If you already have Radio Constanța deployed **without** volume persistence and want to preserve your existing data, follow this guide.

## Why You Need This

If you deployed without volume mounting, your admin settings and uploads are currently stored **inside the container**. When you rebuild or update the container, this data is lost.

This guide helps you migrate your existing data to a persistent volume so it survives future updates.

---

## For Coolify Users

### Step 1: Backup Current Data

Before making changes, access your running container and backup the data:

```bash
# Get the container ID
docker ps | grep radio-constanta

# Copy data out of the container
docker cp <container-id>:/app/server/data ./radio-backup
```

### Step 2: Add Volume in Coolify

1. Go to your Radio Constanța app in Coolify
2. Navigate to **Storages** or **Volumes** section
3. Add a new persistent volume:
   - **Name**: `radio-data`
   - **Mount Path**: `/app/server/data`
   - **Type**: Persistent Volume
4. Save the configuration

### Step 3: Redeploy

1. Click **Deploy** in Coolify
2. Wait for deployment to complete

### Step 4: Restore Data

If the new deployment doesn't have your settings:

```bash
# Get the new container ID
docker ps | grep radio-constanta

# Copy backup into the container
docker cp ./radio-backup/. <container-id>:/app/server/data/

# Restart the container
docker restart <container-id>
```

### Step 5: Verify

1. Access the Admin panel
2. Check that your radio stream configurations are present
3. Check that uploaded covers are visible

Done! Your data will now persist across all future deployments.

---

## For Docker Compose Users

### Step 1: Backup Current Data

```bash
# Get the container ID
docker ps | grep radio-constanta

# Backup current data
docker cp <container-id>:/app/server/data ./radio-backup
```

### Step 2: Update to New docker-compose.yml

```bash
# Pull the latest code (includes updated docker-compose.yml)
git pull

# Stop the old container
docker-compose down

# Start with new volume configuration
docker-compose up -d
```

### Step 3: Restore Data

```bash
# Copy backup to the volume
# First, find where the volume is mounted
docker volume inspect radio-constanta_radio-data

# Copy data to volume using a temporary container
docker run --rm \
  -v radio-constanta_radio-data:/data \
  -v $(pwd)/radio-backup:/backup \
  alpine sh -c "cp -r /backup/* /data/"
```

### Step 4: Restart

```bash
docker-compose restart
```

---

## For Manual Docker Users

### Step 1: Backup Current Data

```bash
# Get the container ID
docker ps | grep radio-constanta

# Backup current data
docker cp <container-id>:/app/server/data ./radio-backup
```

### Step 2: Stop and Remove Old Container

```bash
docker stop radio-constanta
docker rm radio-constanta
```

### Step 3: Create Persistent Volume

```bash
docker volume create radio-data
```

### Step 4: Copy Backup to Volume

```bash
# Copy data to volume using a temporary container
docker run --rm \
  -v radio-data:/data \
  -v $(pwd)/radio-backup:/backup \
  alpine sh -c "cp -r /backup/* /data/"
```

### Step 5: Start Container with Volume

```bash
docker run -d \
  --name radio-constanta \
  --restart unless-stopped \
  -p 3001:3001 \
  -v radio-data:/app/server/data \
  radio-constanta
```

---

## Verification

After migration, verify everything works:

1. **Check Admin Settings**
   - Go to `/admin`
   - Login and check Radio Streams configuration
   - Verify your stream URLs are still configured

2. **Check Uploads**
   - Go to Cover Scheduling tab
   - Verify uploaded covers are still visible

3. **Test Update**
   ```bash
   # Pull updates
   git pull

   # Rebuild and restart
   docker-compose up -d --build
   # OR for manual Docker:
   docker stop radio-constanta && docker rm radio-constanta
   docker build -t radio-constanta .
   docker run -d --name radio-constanta --restart unless-stopped -p 3001:3001 -v radio-data:/app/server/data radio-constanta
   ```

4. **Verify Data Persisted**
   - Check admin settings again
   - Your configuration should still be there!

---

## Troubleshooting

### Data Not Showing After Restore

Check volume mount:
```bash
# Verify volume is mounted
docker inspect radio-constanta | grep Mounts -A 10

# Check data exists in volume
docker run --rm -v radio-data:/data alpine ls -la /data
```

### Permission Issues

If you get permission errors:
```bash
# Fix permissions in the volume
docker run --rm -v radio-data:/data alpine chmod -R 755 /data
```

### Start Fresh

If you want to start over completely:
```bash
# Remove volume
docker volume rm radio-data

# Recreate and restart
docker volume create radio-data
docker-compose up -d
# or restart manual docker container
```

---

## Questions?

If you encounter issues during migration, check:
1. Container logs: `docker logs radio-constanta`
2. Volume contents: `docker run --rm -v radio-data:/data alpine ls -la /data`
3. File permissions in volume

The volume should contain:
- `admin-settings.json` (your configuration)
- `covers/fm/` (FM station cover uploads)
- `covers/folclor/` (Folclor station cover uploads)
