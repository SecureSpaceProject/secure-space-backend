from locust import HttpUser, task, between


class SecureSpaceDbUser(HttpUser):
    """
    Load test for SecureSpace backend + PostgreSQL path.

    Locust sends requests to Nginx Load Balancer.
    Nginx distributes requests between backend containers.
    Each backend request performs a lightweight SQL query to PostgreSQL.
    """
    wait_time = between(0.1, 0.5)

    @task
    def db_health_check(self):
        self.client.get("/health/db", name="/health/db")