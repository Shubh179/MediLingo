# Kalman Filter Mathematics - Detailed Explanation

## 📐 Overview

The Kalman Filter is an optimal estimator that combines:
1. **Predictions** from a motion model (physics)
2. **Measurements** from sensors (GPS)

It minimizes the mean squared error of the state estimate.

---

## 🧮 State Vector

Our state vector has 4 dimensions:

```
x = [latitude]    ← Position in degrees
    [longitude]   ← Position in degrees
    [vLat]        ← Velocity (degrees/second) in latitude direction
    [vLng]        ← Velocity (degrees/second) in longitude direction
```

**Why velocity in the state?**
- Allows prediction between GPS updates
- Smooths out GPS noise
- Enables 60fps rendering from 5-second updates

---

## 🔄 Motion Model (Constant Velocity)

Assumes vehicle moves at constant velocity between updates:

```
lat(t+Δt) = lat(t) + vLat × Δt
lng(t+Δt) = lng(t) + vLng × Δt
vLat(t+Δt) = vLat(t)
vLng(t+Δt) = vLng(t)
```

**State Transition Matrix F:**

```
F = | 1   0   Δt  0  |
    | 0   1   0   Δt |
    | 0   0   1   0  |
    | 0   0   0   1  |
```

Where Δt is the time step (e.g., 0.016s for 60fps, 5s for GPS updates).

---

## 📊 Key Matrices

### 1. **Covariance Matrix P [4×4]**

Represents uncertainty in our state estimate:

```
P = | σ²_lat    0        0       0     |
    | 0       σ²_lng    0       0     |
    | 0        0      σ²_vLat   0     |
    | 0        0        0     σ²_vLng |
```

- **σ²_lat, σ²_lng**: Position uncertainty (degrees²)
- **σ²_vLat, σ²_vLng**: Velocity uncertainty (degrees²/s²)

**Initial Values:**
- Position: `1e-4` (≈ 11 meters)
- Velocity: `1e-2` (moderate uncertainty)

**Evolution:**
- Increases during prediction (we become less certain)
- Decreases during update (measurement improves confidence)

---

### 2. **Process Noise Q [4×4]**

Models uncertainty in our motion model (real world isn't perfectly constant velocity):

```
Q = | q_pos   0      0      0    |
    | 0     q_pos    0      0    |
    | 0      0     q_vel    0    |
    | 0      0      0     q_vel  |
```

**Tuned Values for Urban Driving:**
- **q_pos = 1e-6**: Position process noise
  - Vehicles follow smooth paths (roads, traffic laws)
  - Low noise = trust motion model more
  
- **q_vel = 1e-4**: Velocity process noise
  - Vehicles can accelerate, brake, turn
  - Higher noise = account for speed changes

**Physical Interpretation:**
- Small Q: "Vehicle moves very smoothly"
- Large Q: "Vehicle can make sudden maneuvers"

**When to Increase Q:**
- Sharp turns detected
- Urban environments (traffic lights, intersections)
- Aggressive driving

---

### 3. **Measurement Noise R [4×4]**

Models sensor inaccuracy (GPS errors):

```
R = | r_pos   0      0      0    |
    | 0     r_pos    0      0    |
    | 0      0     r_vel    0    |
    | 0      0      0     r_vel  |
```

**Tuned Values:**
- **r_pos = 1e-5**: GPS position noise (≈ 1-10 meters typical)
  - Based on reported GPS accuracy
  - Adjusted dynamically if `accuracy` field available
  
- **r_vel = 1e-3**: Speed sensor noise
  - Calculated from position differences
  - Moderate trust in derived velocity

**Physical Interpretation:**
- Small R: "Trust GPS measurements completely"
- Large R: "GPS is noisy, rely more on predictions"

**When to Increase R:**
- Poor GPS signal (urban canyons, tunnels)
- High reported GPS accuracy values
- Erratic GPS readings

---

## 🔍 The Kalman Filter Algorithm

### **Prediction Step** (runs every frame, e.g., 60fps)

1. **Predict State:**
   ```
   x̂(k|k-1) = F × x̂(k-1|k-1)
   ```
   Project state forward using motion model.

2. **Predict Covariance:**
   ```
   P(k|k-1) = F × P(k-1|k-1) × F^T + Q
   ```
   Uncertainty grows due to process noise.

### **Update Step** (runs when GPS arrives, e.g., every 5 seconds)

1. **Calculate Kalman Gain:**
   ```
   K = P(k|k-1) × H^T × [H × P(k|k-1) × H^T + R]^-1
   ```
   Optimal weighting between prediction and measurement.

2. **Update State:**
   ```
   x̂(k|k) = x̂(k|k-1) + K × [z(k) - H × x̂(k|k-1)]
   ```
   Correct prediction with measurement.

3. **Update Covariance:**
   ```
   P(k|k) = [I - K × H] × P(k|k-1)
   ```
   Uncertainty reduces after measurement.

---

## 🎯 Kalman Gain Interpretation

The Kalman Gain **K** determines the balance:

```
K ≈ 0:  Ignore measurement, trust prediction
K ≈ I:  Ignore prediction, trust measurement
```

**What affects K?**
- **High P (uncertain prediction)** → K large → trust measurement more
- **High R (noisy GPS)** → K small → trust prediction more
- **Low Q (smooth motion)** → P grows slowly → trust prediction

---

## 🏙️ Tuning for Urban Environment

### **Parameter Tradeoffs:**

| Scenario | Q (Process) | R (Measurement) | Result |
|----------|-------------|-----------------|--------|
| Highway (smooth) | Small | Medium | Smooth tracking, slight lag |
| Urban (turns) | Large | Medium | Responsive turns, more jitter |
| Poor GPS | Medium | Large | Smooth but may drift |
| Good GPS | Small | Small | Follows GPS closely |

### **Our Default Configuration:**

```typescript
{
  processNoisePosition: 1e-6,    // Low - smooth roads
  processNoiseVelocity: 1e-4,    // Moderate - allows acceleration
  measurementNoisePosition: 1e-5, // ~10m GPS accuracy
  measurementNoiseVelocity: 1e-3, // Moderate velocity trust
}
```

**Why these values?**
- **Urban roads are structured**: Vehicles follow lanes, obey traffic
- **GPS is reasonably accurate**: Modern phones have 5-15m accuracy
- **Speed changes happen**: Traffic lights, turns require velocity flexibility
- **Balance smoothness and responsiveness**: Not too laggy, not too jittery

---

## 📈 Performance Characteristics

### **Smoothness:**
The filter produces smooth motion by:
1. Predicting intermediate positions (60fps between 5s updates)
2. Using velocity to extrapolate
3. Averaging out GPS noise

### **Latency:**
- **Prediction**: No latency, runs instantly
- **Update**: Slight lag from GPS transmission time
- **Overall**: ~100-500ms total system latency (GPS → network → filter)

### **Accuracy:**
- **Without filter**: GPS accuracy ± 10 meters
- **With filter**: Effective accuracy ± 3-5 meters (smoothed)
- **Prediction accuracy**: Degrades over time without updates

---

## 🔧 Advanced Tuning

### **Adaptive Noise:**

```typescript
// Increase process noise during turns
if (headingChange > 30°) {
  Q = Q × 3;
}

// Adjust measurement noise based on GPS accuracy
if (gpsAccuracy > 20m) {
  R = R × (gpsAccuracy / 10)²;
}
```

### **Fading Memory:**

For vehicles that can stop/start unpredictably:

```typescript
// Increase uncertainty over time
P = P × 1.01 per second without measurement
```

### **Multiple Models:**

Switch between motion models:
- **Constant Velocity**: Normal driving
- **Constant Acceleration**: Merging onto highway
- **Constant Turn Rate**: Roundabouts

---

## 📊 Numerical Example

**Initial State:**
```
x = [28.6139°, 77.2090°, 0.0001°/s, 0.0001°/s]
    (Connaught Place, Delhi, moving ~40 km/h northeast)
```

**After 1 second prediction:**
```
x_pred = [28.6140°, 77.2091°, 0.0001°/s, 0.0001°/s]
         (moved ~11m northeast)
```

**GPS measurement arrives:**
```
z = [28.6140°, 77.2091°, 0.00009°/s, 0.00011°/s]
    (slightly different due to GPS noise)
```

**Kalman update:**
```
K ≈ [0.5]  (equal weighting)
x_updated = x_pred + 0.5 × (z - x_pred)
          = smoothed position between prediction and measurement
```

---

## 🎓 Mathematical Optimality

The Kalman Filter is **optimal** for:
- Linear systems
- Gaussian noise
- Known noise statistics

**For our GPS tracking:**
- ✅ Motion model is linear (constant velocity)
- ⚠️ GPS noise is ~Gaussian (close enough)
- ⚠️ Process noise estimated (not perfectly known)

**Result:** Near-optimal performance for smooth vehicle tracking!

---

## 📚 Further Reading

- **Kalman Filtering**: R.E. Kalman (1960)
- **GPS/INS Integration**: Groves, "Principles of GNSS, Inertial, and Multisensor Integrated Navigation Systems"
- **Urban Vehicle Tracking**: Multiple model approaches for varying motion dynamics

---

## 🔢 Quick Reference

**Degrees to Meters (approximate):**
- 1° latitude ≈ 111,320 meters
- 1° longitude ≈ 111,320 × cos(latitude) meters
- At 28° latitude: 1° lng ≈ 98,200 meters

**Speed Conversions:**
- 1 m/s = 3.6 km/h
- 40 km/h ≈ 11.1 m/s ≈ 0.0001°/s latitude

**Typical GPS Accuracy:**
- Open sky: 5 meters
- Urban: 10-15 meters  
- Urban canyon: 20-50 meters
- Indoors: 100+ meters or no signal

---

**Mathematical beauty:** The Kalman Filter elegantly balances trust in physics (prediction) vs. trust in sensors (measurement), minimizing uncertainty at every step! 🎯
