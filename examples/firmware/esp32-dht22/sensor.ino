/**
 * Livestock AI IoT Sensor Hub - ESP32 DHT22 Example
 * 
 * This sketch reads temperature and humidity from a DHT22 sensor
 * and sends the data to the Livestock AI API.
 * 
 * Hardware: ESP32 + DHT22
 * 
 * Wiring:
 *   DHT22 VCC  -> ESP32 3.3V
 *   DHT22 DATA -> ESP32 GPIO4 (with 10kΩ pull-up)
 *   DHT22 GND  -> ESP32 GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ============================================
// CONFIGURATION - Edit these values
// ============================================

// WiFi credentials
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";

// Livestock AI API configuration
const char* API_ENDPOINT = "https://your-domain.workers.dev/api/sensors/ingest";
const char* TEMP_SENSOR_API_KEY = "your-temperature-sensor-api-key";
const char* HUMIDITY_SENSOR_API_KEY = "your-humidity-sensor-api-key";

// Hardware configuration
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LED_PIN 2  // Built-in LED

// Timing configuration
const unsigned long READING_INTERVAL_MS = 300000;  // 5 minutes
const unsigned long WIFI_TIMEOUT_MS = 30000;       // 30 seconds
const int MAX_RETRIES = 3;

// ============================================
// Global variables
// ============================================

DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastReadingTime = 0;

// ============================================
// Setup
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("Livestock AI IoT Sensor Hub");
  Serial.println("ESP32 DHT22 Example");
  Serial.println("========================================\n");
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // LED on during setup
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT22 sensor initialized");
  
  // Connect to WiFi
  connectWiFi();
  
  digitalWrite(LED_PIN, LOW);  // LED off when ready
  Serial.println("\nSetup complete. Starting sensor readings...\n");
}

// ============================================
// Main loop
// ============================================

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time for a new reading
  if (currentTime - lastReadingTime >= READING_INTERVAL_MS || lastReadingTime == 0) {
    lastReadingTime = currentTime;
    
    // Ensure WiFi is connected
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi disconnected. Reconnecting...");
      connectWiFi();
    }
    
    // Read and send sensor data
    readAndSendData();
  }
  
  // Small delay to prevent watchdog issues
  delay(100);
}

// ============================================
// WiFi Functions
// ============================================

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_TIMEOUT_MS) {
      Serial.println("\nWiFi connection timeout!");
      Serial.println("Restarting ESP32...");
      ESP.restart();
    }
    
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));  // Blink LED
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

// ============================================
// Sensor Functions
// ============================================

void readAndSendData() {
  // Blink LED slowly while reading
  digitalWrite(LED_PIN, HIGH);
  
  // Read sensor values
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();  // Celsius
  
  // Check for read errors
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("ERROR: Failed to read from DHT sensor!");
    digitalWrite(LED_PIN, LOW);
    return;
  }
  
  // Print readings
  Serial.println("----------------------------------------");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  
  // Send temperature reading
  if (strlen(TEMP_SENSOR_API_KEY) > 10) {
    sendReading(TEMP_SENSOR_API_KEY, temperature, "temperature");
  }
  
  // Send humidity reading
  if (strlen(HUMIDITY_SENSOR_API_KEY) > 10) {
    sendReading(HUMIDITY_SENSOR_API_KEY, humidity, "humidity");
  }
  
  digitalWrite(LED_PIN, LOW);
  Serial.println("----------------------------------------\n");
}

// ============================================
// API Functions
// ============================================

bool sendReading(const char* apiKey, float value, const char* sensorType) {
  Serial.print("Sending ");
  Serial.print(sensorType);
  Serial.print(" reading: ");
  Serial.println(value);
  
  // Fast blink while sending
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
  
  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["value"] = value;
  
  // Add metadata
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["rssi"] = WiFi.RSSI();
  metadata["firmware"] = "esp32-dht22-v1.0";
  metadata["battery"] = 100;  // Replace with actual battery reading if available
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP request with retries
  for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    HTTPClient http;
    http.begin(API_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Sensor-API-Key", apiKey);
    http.setTimeout(10000);  // 10 second timeout
    
    int httpCode = http.POST(jsonPayload);
    
    if (httpCode == HTTP_CODE_CREATED || httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      Serial.print("  Success! Response: ");
      Serial.println(response);
      http.end();
      return true;
    }
    
    Serial.print("  Attempt ");
    Serial.print(attempt);
    Serial.print(" failed. HTTP code: ");
    Serial.println(httpCode);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.print("  Error response: ");
      Serial.println(response);
    }
    
    http.end();
    
    if (attempt < MAX_RETRIES) {
      Serial.println("  Retrying in 2 seconds...");
      delay(2000);
    }
  }
  
  Serial.println("  All retries failed!");
  return false;
}

// ============================================
// Deep Sleep (Optional - for battery power)
// ============================================

void enterDeepSleep(unsigned long sleepTimeMs) {
  Serial.print("Entering deep sleep for ");
  Serial.print(sleepTimeMs / 1000);
  Serial.println(" seconds...");
  
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  
  esp_sleep_enable_timer_wakeup(sleepTimeMs * 1000);  // Convert to microseconds
  esp_deep_sleep_start();
}
