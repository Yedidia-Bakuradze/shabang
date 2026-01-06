# Selenium E2E Test Container
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies (bash is included in slim, but ensure curl is available)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /tests

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy test files
COPY . .

# Ensure Unix line endings and make script executable
RUN sed -i 's/\r$//' run_tests.sh && chmod +x run_tests.sh

# Default command
ENTRYPOINT ["/bin/bash", "./run_tests.sh"]
