# MountainTracker - New Features Guide

## 🎉 What's New

Your MountainTracker app now includes powerful tracking and analysis features!

---

## 📊 Enhanced Ascent Tracking

When adding an ascent to a route, you can now record:

### Basic Details

- **Date** - When you did the tour
- **Start/End Times** - Track exact timing
- **Partners** - Who joined you on the tour
- **Weather** - Weather conditions during the ascent
- **Route Conditions** - Snow quality, ice, etc.
- **Notes** - Detailed trip report

### GPS Track Upload

- **Upload GPX/TCX files** from your GPS device or app
- Automatically calculates:
  - Total distance (km)
  - Elevation gain/loss (m)
  - Duration (minutes)
  - Max/min elevation
- Track points stored for future map visualization

### Photo Upload

- **Upload multiple photos** from your ascent
- Add captions and geotags
- Photos are linked to each ascent

---

## 📈 Statistics Dashboard

Access your stats at `/stats` or click **Stats** in the navbar.

### Lifetime Totals

- Total ascents completed
- Total elevation gained
- Total distance covered
- Total time spent

### Streaks & Achievements

- **Current streak** - Consecutive days with ascents
- **Longest streak** - Your personal best

### Goals & Progress

Set and track:

- Monthly ascent goal
- Yearly ascent goal
- Yearly elevation goal

Visual progress bars show how you're tracking!

### Activity Breakdown

See which activities you do most (climbing, ski touring, hiking, etc.)

### Recent Ascents

Quick view of your last 10 ascents with key stats

---

## 💾 Export & Backup

### Export Your Data

- **JSON format** - Complete backup with all data
- **CSV format** - Spreadsheet-friendly for analysis

Accessible from the Stats page.

### Import/Restore

- Import previously exported JSON files
- Restore your data on a new device
- Merge data from other sources

---

## 🚀 How to Use

### 1. Add an Enhanced Ascent

1. Go to any tour detail page
2. Click **"Add Ascent"**
3. Fill in the enhanced form:
   - Date and times
   - Partners (type name and click "Add")
   - Weather and conditions
   - Notes
   - Upload GPX file (from Garmin, Strava export, etc.)
   - Upload photos
4. Click **"Save Ascent"**

### 2. View Your Stats

1. Click **"Stats"** in the navbar
2. Review your totals and streaks
3. Set goals by clicking **"Edit Goals"**
4. Export your data anytime

### 3. Backup Your Data

1. Go to Stats page
2. Click **"Export JSON"** for complete backup
3. Save the file somewhere safe
4. To restore: Click **"Import"** and select the JSON file

---

## 🔧 Technical Details

### Database Changes

- New `TrackPoint` model for GPS data
- New `Photo` model for images
- New `UserStats` model for aggregated stats
- Enhanced `Ascent` model with partners, times, conditions, weather, and computed stats

### API Endpoints

- `POST /api/tours/[id]/ascents/[ascentId]/gpx` - Upload GPX file
- `POST /api/tours/[id]/ascents/[ascentId]/photos` - Upload photos
- `GET /api/stats` - Get user statistics
- `PATCH /api/stats` - Update goals
- `GET /api/export?format=json|csv` - Export data
- `POST /api/export` - Import data

### File Storage

- Photos stored in `public/uploads/photos/`
- GPX files parsed and data stored in database
- Track points can be used for future map visualization

---

## 📝 Next Steps

### Potential Future Features

- Interactive map view with track visualization
- Weather integration for planned routes
- Route recommendations based on history
- Sharing ascents with friends
- Mobile app with offline support

---

## 💡 Tips

1. **Use GPX files** - They provide the most accurate stats
2. **Set realistic goals** - Start small and increase gradually
3. **Export regularly** - Keep backups of your data
4. **Add partners** - Track who you climb with
5. **Write notes** - Future you will appreciate the details!

---

Enjoy tracking your mountain adventures! 🏔️
