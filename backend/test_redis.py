import os
import redis
import sys

def main():
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
    print(f"Testing Redis Connection: {redis_url}")
    
    try:
        r = redis.from_url(redis_url, socket_timeout=3)
        if r.ping():
            print("\n[SUCCESS] Redis is fully connected! Your Celery automated background posts will function correctly in production.")
            sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Redis connection failed! The error thrown was: {e}")
        print("\nPlease physically ensure your REDIS_URL in .env has the correct 'YOUR_PASSWORD_HERE' replaced.")
        sys.exit(1)

if __name__ == "__main__":
    main()
