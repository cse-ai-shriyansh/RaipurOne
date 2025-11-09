# 🏛️ Municipal Department Classification Guide

## Department Categories

### 🛣️ **Roadway Department**
**Handles:**
- Road maintenance and repairs
- Potholes and road damage
- Street lighting issues
- Traffic signal problems
- Sidewalk repairs
- Road safety concerns
- Street markings and signs

**Example Queries:**
- "Pothole on Main Street"
- "Broken street light at intersection"
- "Road cracks need repair"
- "Traffic signal not working"

---

### 🧹 **Cleaning Department**
**Handles:**
- Garbage collection issues
- Waste management
- Street cleaning
- Littering complaints
- Public space sanitation
- Trash bin requests
- Illegal dumping

**Example Queries:**
- "Garbage not collected for 3 days"
- "Need new trash bin"
- "Street needs cleaning"
- "Illegal dumping near park"

---

### 🚰 **Drainage Department**
**Handles:**
- Sewage system problems
- Blocked drains
- Flooding and waterlogging
- Manhole issues
- Storm water drainage
- Sewer line repairs
- Drainage system maintenance

**Example Queries:**
- "Blocked drain causing flooding"
- "Sewage overflow in street"
- "Manhole cover missing"
- "Water logging after rain"

---

### 💧 **Water Supply Department**
**Handles:**
- Water supply interruptions
- Water pressure issues
- Leaking pipes
- Water quality concerns
- Water connection requests
- Water meter problems
- Contaminated water complaints

**Example Queries:**
- "No water supply since morning"
- "Water leak on street"
- "Low water pressure"
- "Dirty water coming from tap"

---

### 📋 **General Department**
**Handles:**
- Issues that don't fit other categories
- Multiple department issues
- General inquiries
- Unclear requests

**Example Queries:**
- "General city maintenance"
- "Multiple issues to report"
- "City service inquiry"

---

## AI Classification System

### Request Types

1. **✅ Valid**
   - Legitimate citizen complaints
   - Clear, actionable requests
   - Requires departmental attention
   
2. **⚠️ Invalid**
   - Incomplete information
   - Unclear requests
   - Not enough details to act on
   
3. **🗑️ Garbage**
   - Spam messages
   - Nonsense text
   - Malicious content
   - Inappropriate content

---

## Priority Levels

### 🔴 **Urgent**
- Life-threatening situations
- Major infrastructure failure
- Public health emergency
- Immediate action required

**Examples:**
- Major water main burst
- Road collapse
- Sewage overflow in residential area
- Complete power outage in area

### 🟠 **High**
- Significant citizen impact
- Health hazard
- Safety concern
- Requires prompt attention

**Examples:**
- Large potholes on busy road
- Multiple days without water supply
- Blocked drainage causing property damage
- Major street light outages

### 🟡 **Medium**
- Moderate inconvenience
- Needs attention soon
- Not immediately dangerous
- Standard service request

**Examples:**
- Single street light out
- Delayed garbage collection
- Minor road damage
- Low water pressure

### 🟢 **Low**
- Minor issues
- Can be scheduled
- Minimal impact
- Routine maintenance

**Examples:**
- Cosmetic road repairs
- General inquiries
- Non-urgent requests
- Preventive maintenance

---

## Example Classifications

### Example 1: Pothole Complaint
**Query:** "Potholes near Pandri, someone fell off"

**Classification:**
- **Request Type:** Valid
- **Department:** Roadway 🛣️
- **Priority:** High
- **Summary:** "Multiple potholes causing accidents in Pandri area"
- **Suggested Actions:**
  1. Dispatch inspection team immediately
  2. Install warning signs
  3. Schedule emergency road repair

---

### Example 2: Cleaning Request
**Query:** "Help in my cleaning"

**Classification:**
- **Request Type:** Invalid (unclear)
- **Department:** Cleaning 🧹
- **Priority:** Low
- **Summary:** "Unclear cleaning-related request requiring clarification"
- **Suggested Actions:**
  1. Contact citizen for details
  2. Determine specific cleaning issue
  3. Route to appropriate team

---

### Example 3: Water Supply Issue
**Query:** "No water since 2 days, entire block affected"

**Classification:**
- **Request Type:** Valid
- **Department:** Water Supply 💧
- **Priority:** Urgent
- **Summary:** "Extended water outage affecting residential block"
- **Suggested Actions:**
  1. Emergency response team dispatch
  2. Inspect water supply lines
  3. Provide tanker water immediately
  4. Inform residents of timeline

---

## Dashboard Usage

### Analyzing Tickets

1. Click **"🧠 Analyze All Tickets with AI"** on main dashboard
2. Gemini AI processes each ticket
3. Results displayed by department
4. Click **"🏢 Departments"** tab to view

### Department View

- See total complaints per department
- Click department cards to view tickets
- Review AI-generated summaries
- Check suggested actions
- View confidence scores

### Taking Action

1. Review ticket in department view
2. Check simplified summary
3. Review suggested actions
4. Assign to field team
5. Update ticket status
6. Add responses with updates

---

## Benefits

✅ **Automatic Routing** - Tickets go to correct department  
✅ **Priority Setting** - Urgent issues flagged immediately  
✅ **Smart Summaries** - Clear description of each issue  
✅ **Action Guidance** - Suggested next steps provided  
✅ **Spam Filter** - Invalid/garbage requests filtered  
✅ **Time Saving** - Reduces manual ticket review  
✅ **Better Response** - Faster citizen service

---

## Integration with Telegram Bot

Citizens create tickets via:
```
/ticket Pothole on Main Street causing accidents
```

Bot creates ticket → AI analyzes → Routes to Roadway department → Team receives alert → Field inspection scheduled → Citizen updated

---

**Last Updated:** November 1, 2025  
**System Status:** Operational ✅
