import os
from locust import HttpUser, task, between


SENSOR_ID = os.getenv("SENSOR_ID")
DEVICE_SECRET = os.getenv("DEVICE_SECRET")
SENSOR_KIND = os.getenv("SENSOR_KIND", "MOTION").upper()


class SecureSpaceIotUser(HttpUser):
    """
    Load test for real SecureSpace IoT event endpoint.

    Request path:
    Locust -> Nginx Load Balancer -> backend instance -> PostgreSQL.

    Required env:
    SENSOR_ID - existing sensor id from database
    DEVICE_SECRET - plain device secret for this sensor
    SENSOR_KIND - MOTION or OPEN
    """

    wait_time = between(0.1, 0.5)

    def on_start(self):
        if not SENSOR_ID:
            raise RuntimeError("SENSOR_ID env variable is required")
        if not DEVICE_SECRET:
            raise RuntimeError("DEVICE_SECRET env variable is required")

    @task
    def send_iot_event(self):
        headers = {
            "Content-Type": "application/json",
            "X-Device-Secret": DEVICE_SECRET,
        }

        if SENSOR_KIND == "OPEN":
            payload = {"state": "OPEN"}
        else:
            payload = {}

        self.client.post(
            f"/iot/{SENSOR_ID}/events",
            json=payload,
            headers=headers,
            name="POST /iot/:sensorId/events",
        )