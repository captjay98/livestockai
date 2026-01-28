# ESP32 DHT22 Sensor Example

This example demonstrates how to connect an ESP32 microcontroller with a DHT22 temperature/humidity sensor to the OpenLivestock IoT Sensor Hub.

## Hardware Requirements

- ESP32 development board (ESP32-WROOM-32 or similar)
- DHT22 temperature/humidity sensor
- 10kΩ pull-up resistor
- Jumper wires
- USB cable for programming

## Wiring Diagram

```
ESP32          DHT22
------         -----
3.3V    -----> VCC (Pin 1)
GPIO4   -----> DATA (Pin 2) [with 10kΩ pull-up to 3.3V]
GND     -----> GND (Pin 4)
```

Note: Pin 3 of DHT22 is not connected (NC).

## Software Requirements

- Arduino IDE 2.0+ or PlatformIO
- ESP32 board support package
- Required libraries:
  - WiFi (built-in)
  - HTTPClient (built-in)
  - DHT sensor library by Adafruit
  - ArduinoJson

## Installation

### Arduino IDE

1. Install ESP32 board support:
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "esp32" and install

2. Install required libraries:
   - Go to Sketch → Include Library → Manage Libraries
   - Search and install:
     - "DHT sensor library" by Adafruit
     - "ArduinoJson" by Benoit Blanchon

3. Open `sensor.ino` and configure:
   - WiFi credentials
   - API endpoint URL
   - Sensor API key

4. Select your board (ESP32 Dev Module) and upload

### PlatformIO

1. Create a new project or use the provided `platformio.ini`
2. Copy `sensor.ino` to `src/main.cpp`
3. Configure credentials in the code
4. Build and upload

## Configuration

Edit the following constants in `sensor.ino`:

```cpp
// WiFi credentials
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";

// OpenLivestock API
const char* API_ENDPOINT = "https://your-domain.workers.dev/api/sensors/ingest";
const char* SENSOR_API_KEY = "your-sensor-api-key";

// Sensor configuration
const int DHT_PIN = 4;
const int READING_INTERVAL_MS = 300000; // 5 minutes
```

## Getting Your API Key

1. Log in to OpenLivestock Manager
2. Navigate to your farm → Sensors
3. Click "Add Sensor"
4. Fill in sensor details (name, type: temperature or humidity)
5. Copy the API key shown (it's only displayed once!)

## LED Status Indicators

The built-in LED indicates sensor status:

| Pattern | Meaning |
|---------|---------|
| Solid ON | WiFi connecting |
| Slow blink (1s) | Reading sensor |
| Fast blink (100ms) | Sending data |
| OFF | Idle/sleeping |

## Troubleshooting

### WiFi Connection Issues
- Verify SSID and password are correct
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength (move closer to router)

### Sensor Reading Errors
- Verify wiring connections
- Check pull-up resistor is installed
- Ensure DHT22 is not damaged (try another sensor)

### API Errors
- Verify API key is correct
- Check endpoint URL
- Ensure sensor is active in OpenLivestock
- Check rate limits (max 60 requests/minute)

## Power Consumption

For battery-powered deployments:

| Mode | Current Draw |
|------|-------------|
| Active (WiFi) | ~150mA |
| Deep Sleep | ~10µA |

To extend battery life, increase `READING_INTERVAL_MS` and enable deep sleep between readings.

## Security Notes

- Store API keys securely (consider using ESP32's NVS)
- Use HTTPS for all API calls
- Rotate API keys periodically
- Don't commit credentials to version control

## License

MIT License - See main project LICENSE file
