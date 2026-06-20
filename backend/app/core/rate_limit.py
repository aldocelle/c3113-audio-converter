import time
from collections import defaultdict
from app.config import get_logger

logger = get_logger(__name__)


class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - 60
        self.requests[key] = [ts for ts in self.requests[key] if ts > window_start]
        if len(self.requests[key]) >= self.requests_per_minute:
            return False
        self.requests[key].append(now)
        return True

    def get_remaining(self, key: str) -> int:
        now = time.time()
        window_start = now - 60
        self.requests[key] = [ts for ts in self.requests[key] if ts > window_start]
        return max(0, self.requests_per_minute - len(self.requests[key]))


upload_limiter = RateLimiter(requests_per_minute=30)
batch_limiter = RateLimiter(requests_per_minute=20)
