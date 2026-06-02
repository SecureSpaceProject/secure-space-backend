from locust import HttpUser, task, between


class SecureSpaceUser(HttpUser):
    """
    Load test for SecureSpace horizontal scaling.

    Locust sends requests to Nginx Load Balancer.
    Nginx distributes requests between backend containers.
    """
    wait_time = between(0.1, 0.5)

    @task
    def health_check(self):
        self.client.get("/health", name="/health")