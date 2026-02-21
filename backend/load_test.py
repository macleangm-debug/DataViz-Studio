#!/usr/bin/env python3
"""
DataViz Studio - Load Testing Script
Simulates high traffic to test scalability improvements (Redis, Celery, DB performance)

Usage:
    python load_test.py --users 50 --duration 60
    python load_test.py --users 100 --duration 120 --report

Requirements:
    pip install aiohttp asyncio rich
"""

import asyncio
import aiohttp
import argparse
import time
import statistics
import json
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict
from collections import defaultdict

# Configuration
API_URL = "https://dataviz-studio-6.preview.emergentagent.com"
TEST_USER = {"email": "test@dataviz.com", "password": "test123"}


@dataclass
class RequestResult:
    endpoint: str
    method: str
    status: int
    duration_ms: float
    success: bool
    error: str = ""


@dataclass
class LoadTestResults:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_duration_sec: float = 0
    requests_per_second: float = 0
    response_times: List[float] = field(default_factory=list)
    errors: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    endpoint_stats: Dict[str, List[float]] = field(default_factory=lambda: defaultdict(list))

    def add_result(self, result: RequestResult):
        self.total_requests += 1
        if result.success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
            self.errors[result.error] += 1
        self.response_times.append(result.duration_ms)
        self.endpoint_stats[result.endpoint].append(result.duration_ms)

    def calculate_stats(self):
        if self.total_duration_sec > 0:
            self.requests_per_second = self.total_requests / self.total_duration_sec
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": f"{(self.successful_requests / self.total_requests * 100):.1f}%" if self.total_requests > 0 else "0%",
            "requests_per_second": f"{self.requests_per_second:.1f}",
            "avg_response_ms": f"{statistics.mean(self.response_times):.1f}" if self.response_times else "0",
            "min_response_ms": f"{min(self.response_times):.1f}" if self.response_times else "0",
            "max_response_ms": f"{max(self.response_times):.1f}" if self.response_times else "0",
            "p50_response_ms": f"{statistics.median(self.response_times):.1f}" if self.response_times else "0",
            "p95_response_ms": f"{sorted(self.response_times)[int(len(self.response_times) * 0.95)]:.1f}" if len(self.response_times) > 1 else "0",
            "p99_response_ms": f"{sorted(self.response_times)[int(len(self.response_times) * 0.99)]:.1f}" if len(self.response_times) > 1 else "0",
        }


class LoadTester:
    def __init__(self, base_url: str, concurrent_users: int, duration_sec: int):
        self.base_url = base_url
        self.concurrent_users = concurrent_users
        self.duration_sec = duration_sec
        self.results = LoadTestResults()
        self.token = None
        self.running = True

    async def login(self, session: aiohttp.ClientSession) -> str:
        """Get authentication token"""
        try:
            async with session.post(
                f"{self.base_url}/api/auth/login",
                json=TEST_USER,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("token")
        except Exception as e:
            print(f"Login failed: {e}")
        return None

    async def make_request(
        self, 
        session: aiohttp.ClientSession, 
        method: str, 
        endpoint: str,
        json_data: dict = None
    ) -> RequestResult:
        """Make a single API request and record results"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        
        start = time.perf_counter()
        try:
            async with session.request(
                method, 
                url, 
                json=json_data,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                duration_ms = (time.perf_counter() - start) * 1000
                success = response.status < 400
                return RequestResult(
                    endpoint=endpoint,
                    method=method,
                    status=response.status,
                    duration_ms=duration_ms,
                    success=success,
                    error="" if success else f"HTTP {response.status}"
                )
        except asyncio.TimeoutError:
            duration_ms = (time.perf_counter() - start) * 1000
            return RequestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                duration_ms=duration_ms,
                success=False,
                error="Timeout"
            )
        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return RequestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                duration_ms=duration_ms,
                success=False,
                error=str(e)[:50]
            )

    async def user_session(self, user_id: int):
        """Simulate a single user's session"""
        async with aiohttp.ClientSession() as session:
            # Get token for this user
            self.token = await self.login(session)
            if not self.token:
                print(f"User {user_id}: Failed to authenticate")
                return

            # Define test scenarios with different weights
            scenarios = [
                # High frequency - Read operations (should be cached)
                ("GET", "/api/datasets", 30),
                ("GET", "/api/dashboards", 25),
                ("GET", "/api/templates", 15),
                
                # Medium frequency - Data retrieval
                ("GET", "/api/auth/me", 10),
                
                # Lower frequency - More expensive operations
                ("POST", "/api/ai/suggest-charts", 5),
            ]

            end_time = time.time() + self.duration_sec
            request_count = 0

            while time.time() < end_time and self.running:
                # Select scenario based on weights
                total_weight = sum(s[2] for s in scenarios)
                rand = asyncio.get_event_loop().time() * 1000 % total_weight
                cumulative = 0
                selected = scenarios[0]
                
                for scenario in scenarios:
                    cumulative += scenario[2]
                    if rand < cumulative:
                        selected = scenario
                        break

                method, endpoint, _ = selected
                result = await self.make_request(session, method, endpoint)
                self.results.add_result(result)
                request_count += 1

                # Small delay between requests (simulates think time)
                await asyncio.sleep(0.1)

            print(f"User {user_id}: Completed {request_count} requests")

    async def run(self):
        """Run the load test"""
        print(f"\n{'='*60}")
        print(f"  DataViz Studio Load Test")
        print(f"  Concurrent Users: {self.concurrent_users}")
        print(f"  Duration: {self.duration_sec} seconds")
        print(f"  Target: {self.base_url}")
        print(f"{'='*60}\n")

        start_time = time.time()

        # Create user tasks
        tasks = [self.user_session(i) for i in range(self.concurrent_users)]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.running = False
            print("\nTest interrupted by user")

        self.results.total_duration_sec = time.time() - start_time
        return self.results

    def print_report(self):
        """Print detailed test report"""
        stats = self.results.calculate_stats()
        
        print(f"\n{'='*60}")
        print(f"  LOAD TEST RESULTS")
        print(f"{'='*60}\n")

        print("📊 Overall Statistics:")
        print(f"  • Total Requests:     {stats['total_requests']}")
        print(f"  • Successful:         {stats['successful_requests']}")
        print(f"  • Failed:             {stats['failed_requests']}")
        print(f"  • Success Rate:       {stats['success_rate']}")
        print(f"  • Requests/Second:    {stats['requests_per_second']}")
        
        print(f"\n⏱️  Response Times:")
        print(f"  • Average:    {stats['avg_response_ms']} ms")
        print(f"  • Min:        {stats['min_response_ms']} ms")
        print(f"  • Max:        {stats['max_response_ms']} ms")
        print(f"  • P50:        {stats['p50_response_ms']} ms")
        print(f"  • P95:        {stats['p95_response_ms']} ms")
        print(f"  • P99:        {stats['p99_response_ms']} ms")

        print(f"\n📈 Endpoint Performance:")
        for endpoint, times in sorted(self.results.endpoint_stats.items()):
            avg = statistics.mean(times) if times else 0
            print(f"  • {endpoint}: {avg:.1f}ms avg ({len(times)} requests)")

        if self.results.errors:
            print(f"\n❌ Errors:")
            for error, count in sorted(self.results.errors.items(), key=lambda x: -x[1]):
                print(f"  • {error}: {count}")

        # Performance assessment
        print(f"\n{'='*60}")
        print(f"  PERFORMANCE ASSESSMENT")
        print(f"{'='*60}\n")
        
        avg_response = float(stats['avg_response_ms'])
        success_rate = float(stats['success_rate'].rstrip('%'))
        rps = float(stats['requests_per_second'])
        
        if avg_response < 200 and success_rate > 99:
            print("✅ EXCELLENT - System handles load efficiently")
            print("   Redis caching and Celery are working optimally")
        elif avg_response < 500 and success_rate > 95:
            print("✅ GOOD - System performs well under load")
            print("   Minor optimizations may improve peak performance")
        elif avg_response < 1000 and success_rate > 90:
            print("⚠️  ACCEPTABLE - System handles load but showing stress")
            print("   Consider scaling resources for higher traffic")
        else:
            print("❌ NEEDS IMPROVEMENT - System struggling under load")
            print("   Review caching strategy and database queries")

        print(f"\n📋 Recommendations:")
        if avg_response > 500:
            print("  • Enable/verify Redis caching for frequently accessed data")
        if success_rate < 99:
            print("  • Check error logs for common failure patterns")
        if rps < self.concurrent_users:
            print("  • Consider increasing worker processes")
        
        print()
        return stats

    def save_report(self, filename: str = None):
        """Save report to JSON file"""
        if not filename:
            filename = f"/app/test_reports/load_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        stats = self.results.calculate_stats()
        report = {
            "timestamp": datetime.now().isoformat(),
            "config": {
                "concurrent_users": self.concurrent_users,
                "duration_sec": self.duration_sec,
                "target_url": self.base_url
            },
            "summary": stats,
            "endpoint_stats": {
                endpoint: {
                    "count": len(times),
                    "avg_ms": statistics.mean(times) if times else 0,
                    "min_ms": min(times) if times else 0,
                    "max_ms": max(times) if times else 0
                }
                for endpoint, times in self.results.endpoint_stats.items()
            },
            "errors": dict(self.results.errors)
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📁 Report saved to: {filename}")
        return filename


async def main():
    parser = argparse.ArgumentParser(description="DataViz Studio Load Tester")
    parser.add_argument("--users", type=int, default=10, help="Number of concurrent users")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    parser.add_argument("--report", action="store_true", help="Save detailed JSON report")
    args = parser.parse_args()

    tester = LoadTester(API_URL, args.users, args.duration)
    await tester.run()
    stats = tester.print_report()
    
    if args.report:
        tester.save_report()

    return stats


if __name__ == "__main__":
    asyncio.run(main())
